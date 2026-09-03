import { DatabaseService } from './db';
import { KeyRotator } from './keyRotator';

export interface CheckSerpParams {
  userId: string;
  keywordId: string;
  projectId: string;
  keyword: string;
  targetUrl: string;
  countryCode?: string;
  languageCode?: string;
}

export class SerpCheckerEngine {
  private dbService: DatabaseService;
  private keyRotator: KeyRotator;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    this.keyRotator = new KeyRotator(dbService);
  }

  private normalizeUrl(url: string): string {
    return url
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  }

  private isUrlMatch(organicLink: string, targetUrl: string): boolean {
    const normalizedOrganic = this.normalizeUrl(organicLink);
    const normalizedTarget = this.normalizeUrl(targetUrl);

    if (normalizedOrganic === normalizedTarget) return true;
    
    if (normalizedOrganic.startsWith(normalizedTarget + '/')) return true;

    const organicHost = normalizedOrganic.split('/')[0];
    const targetHost = normalizedTarget.split('/')[0];
    
    if (organicHost === targetHost) {
      if (normalizedOrganic.startsWith(normalizedTarget)) return true;
    }
    
    if (organicHost.endsWith('.' + targetHost)) {
      const targetPath = normalizedTarget.substring(targetHost.length);
      const organicPath = normalizedOrganic.substring(organicHost.length);
      if (organicPath.startsWith(targetPath)) return true;
    }

    return false;
  }

  async runSerpCheck(params: CheckSerpParams) {
    const { userId, keywordId, projectId, keyword, targetUrl, countryCode = 'id', languageCode = 'id' } = params;

    let foundPosition: number | null = null;
    let foundUrl: string | null = null;
    let foundPage: number | null = null;
    let lastApiKeyUsed: string | null = null;

    const MAX_PAGES = 10; // Up to 10 pages (100 organic search results total)

    for (let page = 1; page <= MAX_PAGES; page++) {
      const startOffset = (page - 1) * 10;
      let pageFetched = false;
      let retryCount = 0;

      while (!pageFetched && retryCount < 3) {
        let activeKeyObj;
        try {
          // Strictly get active API key owned by this user
          activeKeyObj = await this.keyRotator.getNextKey(userId);
        } catch (err: any) {
          throw new Error(err.message || 'Tidak ada API Key yang dapat digunakan.');
        }

        lastApiKeyUsed = activeKeyObj.label || activeKeyObj.api_key;

        // Demo Mode for simulated keys
        if (activeKeyObj.api_key.startsWith('demo_') || activeKeyObj.api_key === 'DEMO_KEY') {
          console.log(`[SerpChecker] Using Demo mode for page ${page} (User: ${userId})`);
          const simulatedOrganicResults = this.generateDemoOrganicResults(page, keyword, targetUrl);

          for (const item of simulatedOrganicResults) {
            if (this.isUrlMatch(item.link, targetUrl)) {
              foundPosition = item.position; // Absolute position 1..100
              foundUrl = item.link;
              foundPage = page;
              break;
            }
          }

          pageFetched = true;
          if (foundPosition !== null) {
            console.log(`[SerpChecker] EARLY STOP: Domain ${targetUrl} found at position #${foundPosition} (Page ${foundPage})!`);
            break;
          }
          continue;
        }

        // Real SerpApi HTTP Call using user's API Key
        try {
          const serpUrl = new URL('https://serpapi.com/search.json');
          serpUrl.searchParams.set('engine', 'google');
          serpUrl.searchParams.set('q', keyword);
          serpUrl.searchParams.set('gl', countryCode);
          serpUrl.searchParams.set('hl', languageCode);
          serpUrl.searchParams.set('start', startOffset.toString());
          serpUrl.searchParams.set('num', '10');
          serpUrl.searchParams.set('api_key', activeKeyObj.api_key);

          const response = await fetch(serpUrl.toString());

          if (!response.ok) {
            const errData = await response.text();
            if (response.status === 429 || response.status === 403 || errData.includes('out of searches') || errData.includes('Invalid API key')) {
              await this.keyRotator.handleKeyFailure(userId, activeKeyObj.id, `HTTP ${response.status}: ${errData}`);
              retryCount++;
              continue;
            }
            throw new Error(`SerpApi response error HTTP ${response.status}: ${errData}`);
          }

          const data = await response.json() as any;

          if (data.error) {
            if (data.error.includes('out of searches') || data.error.includes('Invalid API key')) {
              await this.keyRotator.handleKeyFailure(userId, activeKeyObj.id, data.error);
              retryCount++;
              continue;
            }
            throw new Error(`SerpApi error: ${data.error}`);
          }

          const organicResults = data.organic_results || [];

          for (let i = 0; i < organicResults.length; i++) {
            const result = organicResults[i];
            const rawPos = result.position || (i + 1);
            // Calculate absolute 100-scale position (e.g. Page 2, pos 4 -> 10 + 4 = #14)
            const currentPosition = rawPos > startOffset ? rawPos : (startOffset + rawPos);

            if (this.isUrlMatch(result.link || '', targetUrl)) {
              foundPosition = currentPosition;
              foundUrl = result.link;
              foundPage = page;
              break;
            }
          }

          pageFetched = true;

          // EARLY STOP LOGIC:
          if (foundPosition !== null) {
            console.log(`[SerpChecker] EARLY STOP: Target URL ${targetUrl} found at absolute position #${foundPosition} on page ${foundPage}!`);
            break;
          }

        } catch (fetchErr: any) {
          console.error(`[SerpChecker] Error fetching SerpApi page ${page}:`, fetchErr);
          retryCount++;
          if (retryCount >= 3) {
            throw fetchErr;
          }
        }
      }

      if (foundPosition !== null) {
        break;
      }
    }

    const historyItem = await this.dbService.recordSerpCheck(
      keywordId,
      projectId,
      foundPosition,
      foundUrl,
      foundPage,
      lastApiKeyUsed
    );

    return {
      keywordId,
      projectId,
      keyword,
      targetUrl,
      position: foundPosition,
      foundUrl,
      pageNumber: foundPage,
      apiKeyUsed: lastApiKeyUsed,
      checkedAt: historyItem.checked_at
    };
  }

  private generateDemoOrganicResults(page: number, keyword: string, targetUrl: string) {
    const results = [];
    const normalizedTarget = this.normalizeUrl(targetUrl);
    
    let hash = 0;
    for (let i = 0; i < keyword.length; i++) {
      hash = (hash << 5) - hash + keyword.charCodeAt(i);
      hash |= 0;
    }
    // Generate simulated position across 1..95 in Top 100
    const targetSimulatedPos = (Math.abs(hash) % 85) + 1;

    for (let i = 1; i <= 10; i++) {
      const position = (page - 1) * 10 + i; // Absolute 1..100 position
      
      if (position === targetSimulatedPos) {
        results.push({
          position,
          link: `https://${normalizedTarget}/page-${i}`,
          title: `${keyword.toUpperCase()} - Official Guide & Portal (${normalizedTarget})`,
          snippet: `Temukan informasi terlengkap mengenai ${keyword} secara resmi di ${normalizedTarget}. Layanan cepat dan akurat.`
        });
      } else {
        const compDomains = ['wikipedia.org', 'detik.com', 'kompas.com', 'tribunnews.com', 'tokopedia.com', 'shopee.co.id'];
        const domain = compDomains[(position + i) % compDomains.length];
        results.push({
          position,
          link: `https://${domain}/artikel/${keyword.replace(/\s+/g, '-')}-${position}`,
          title: `Ulasan ${keyword} Terkini #${position} - ${domain}`,
          snippet: `Artikel lengkap mengenai ${keyword} di portal ${domain}. Baca ulasan mendalam dan rekomendasi terbaik.`
        });
      }
    }
    return results;
  }
}
