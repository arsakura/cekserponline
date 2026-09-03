import { DatabaseService } from './db';
import { KeyRotator } from './keyRotator';
import { SerpExplorerResponse, SerpOrganicResult } from './types';

export class SerpExplorerEngine {
  private dbService: DatabaseService;
  private keyRotator: KeyRotator;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    this.keyRotator = new KeyRotator(dbService);
  }

  async exploreSerp(userId: string, keyword: string, country = 'id', language = 'id', limit = 10): Promise<SerpExplorerResponse> {
    let activeKeyObj;
    try {
      activeKeyObj = await this.keyRotator.getNextKey(userId);
    } catch (err: any) {
      throw new Error(err.message || 'Anda belum memasukkan API Key yang aktif.');
    }

    const keyLabel = activeKeyObj.label || activeKeyObj.api_key;

    // Demo Mode Handler
    if (activeKeyObj.api_key.startsWith('demo_') || activeKeyObj.api_key === 'DEMO_KEY') {
      const demoResults = this.generateDemoTopResults(keyword, limit);
      return {
        keyword,
        country,
        total_results: 'Sekitar 4.250.000 hasil (0,32 detik)',
        results: demoResults,
        checked_at: new Date().toISOString(),
        api_key_used: `${keyLabel} (Demo Mode)`
      };
    }

    // Real SerpApi Call for Live SERP Exploration using User's Key
    const parsedResults: SerpOrganicResult[] = [];
    let startOffset = 0;
    let totalResultsStr: string | undefined;
    let consecutiveEmptyCount = 0;

    // We will loop to fetch results until we reach the limit or we can't get any more
    while (parsedResults.length < limit && consecutiveEmptyCount < 2) {
      try {
        const serpUrl = new URL('https://serpapi.com/search.json');
        serpUrl.searchParams.set('engine', 'google');
        serpUrl.searchParams.set('q', keyword);
        serpUrl.searchParams.set('gl', country);
        serpUrl.searchParams.set('hl', language);
        
        // Ask for the remaining number of results, up to 100
        const numToFetch = Math.min(100, limit - parsedResults.length);
        serpUrl.searchParams.set('num', numToFetch.toString());
        if (startOffset > 0) {
          serpUrl.searchParams.set('start', startOffset.toString());
        }
        serpUrl.searchParams.set('api_key', activeKeyObj.api_key);

        const response = await fetch(serpUrl.toString());
        if (!response.ok) {
          const errText = await response.text();
          if (response.status === 429 || response.status === 403 || errText.includes('out of searches')) {
            await this.keyRotator.handleKeyFailure(userId, activeKeyObj.id, errText);
          }
          throw new Error(`SerpApi HTTP error ${response.status}: ${errText}`);
        }

        const data = await response.json() as any;

        if (data.error) {
          await this.keyRotator.handleKeyFailure(userId, activeKeyObj.id, data.error);
          throw new Error(`SerpApi error: ${data.error}`);
        }

        if (data.search_information?.total_results && !totalResultsStr) {
          totalResultsStr = `Sekitar ${data.search_information.total_results} hasil`;
        }

        const rawOrganic = data.organic_results || [];
        if (rawOrganic.length === 0) {
          consecutiveEmptyCount++;
          startOffset += 10; // try next offset just in case
          continue;
        }

        consecutiveEmptyCount = 0;
        let addedThisRound = 0;

        for (let i = 0; i < rawOrganic.length; i++) {
          const item = rawOrganic[i];
          const position = parsedResults.length + 1;
          
          // Avoid duplicates
          const link = item.link || '';
          if (parsedResults.some(r => r.link === link)) {
            continue;
          }

          parsedResults.push({
            position,
            title: item.title || 'Untitled',
            link,
            displayed_link: item.displayed_link || item.link || '',
            snippet: item.snippet || '',
            sitelinks: item.sitelinks?.inline?.map((sl: any) => ({ title: sl.title, link: sl.link })) ||
                       item.sitelinks?.expanded?.map((sl: any) => ({ title: sl.title, link: sl.link })) || []
          });
          addedThisRound++;
        }

        if (addedThisRound === 0) {
          break; // No new results found
        }

        startOffset += rawOrganic.length;
      } catch (err: any) {
        console.error('[SerpExplorer] Error fetching live SERP round:', err);
        throw err;
      }
    }

    return {
      keyword,
      country,
      total_results: totalResultsStr,
      results: parsedResults.slice(0, limit),
      checked_at: new Date().toISOString(),
      api_key_used: keyLabel
    };
  }

  private generateDemoTopResults(keyword: string, limit: number): SerpOrganicResult[] {
    const list: SerpOrganicResult[] = [];
    const domains = [
      { domain: 'wikipedia.org', name: 'Wikipedia Indonesia', snippet: 'Artikel terpercaya dan bebas dari Wikipedia mengenai' },
      { domain: 'detik.com', name: 'Detik Finance & News', snippet: 'Berita terbaru, analisis mendalam, dan ulasan terdepan terkait' },
      { domain: 'kompas.com', name: 'Kompas.com Utama', snippet: 'Informasi akurat dan terpercaya seputar tren industri dan topik' },
      { domain: 'tokopedia.com', name: 'Tokopedia Official', snippet: 'Beli dan temukan penawaran harga promo terbaik untuk' },
      { domain: 'shopee.co.id', name: 'Shopee Indonesia', snippet: 'Belanja online murah, diskon gratis ongkir untuk produk' },
      { domain: 'tribunnews.com', name: 'Tribun Network', snippet: 'Kabar terkini dan berita terpopuler hari ini di Indonesia tentang' },
      { domain: 'liputan6.com', name: 'Liputan6.com', snippet: 'Berita hari ini, berita terkini nusantara dan fakta penting seputar' },
      { domain: 'tirto.id', name: 'Tirto.ID Riset', snippet: 'Laporan mendalam, infografis data, dan investigasi mendalam seputar' },
      { domain: 'kumparan.com', name: 'Kumparan Platform', snippet: 'Platform media berita berbasis sains & data seputar topik' },
      { domain: 'idntimes.com', name: 'IDN Times Pop', snippet: 'Artikel informatif, tips & trik praktis sehari-hari mengenai' }
    ];

    for (let i = 1; i <= limit; i++) {
      const d = domains[(i - 1) % domains.length];
      list.push({
        position: i,
        title: `${i}. ${d.name} - Informasi & Ulasan ${keyword}`,
        link: `https://${d.domain}/${keyword.toLowerCase().replace(/\s+/g, '-')}`,
        displayed_link: `https://www.${d.domain} › ${keyword.toLowerCase().replace(/\s+/g, '-')}`,
        snippet: `${d.snippet} "${keyword}". Panduan terlengkap 2026 dengan informasi resmi dan fakta terkini.`
      });
    }
    return list;
  }
}
