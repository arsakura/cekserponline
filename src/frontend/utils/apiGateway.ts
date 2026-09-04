// API Gateway Manager for Multi-Account Cloudflare Workers Failover

const DEFAULT_ENDPOINTS = [
  '', // Localhost Node (Local SQLite Database `cekserp.db`)
  'https://cs.ratuaspal21.workers.dev', // Node Utama (Akun Cloudflare ratuaspal21@gmail.com)
  'https://cekserponline.muhammad-ardyan.workers.dev' // Node Cadangan (Akun Cloudflare muhammad.ardyan@gmail.com)
];

class ApiGatewayManager {
  private endpoints: string[];
  private activeIndex: number;
  private onFailoverCallback?: (oldEndpoint: string, newEndpoint: string, accountName: string) => void;

  constructor() {
    const savedEndpoints = localStorage.getItem('cekserp_cf_endpoints');
    this.endpoints = savedEndpoints ? JSON.parse(savedEndpoints) : DEFAULT_ENDPOINTS;

    if (!this.endpoints.includes('')) {
      this.endpoints.unshift('');
    }

    const savedIndex = localStorage.getItem('cekserp_cf_active_index');
    this.activeIndex = savedIndex ? parseInt(savedIndex, 10) : 0;
    if (this.activeIndex >= this.endpoints.length) {
      this.activeIndex = 0;
    }
  }

  public setOnFailoverListener(cb: (oldEndpoint: string, newEndpoint: string, accountName: string) => void) {
    this.onFailoverCallback = cb;
  }

  public getActiveEndpoint(): string {
    const ep = this.endpoints[this.activeIndex] ?? '';
    return ep.replace(/\/$/, '');
  }

  public getActiveIndex(): number {
    return this.activeIndex;
  }

  public getActiveAccountName(): string {
    if (this.endpoints[this.activeIndex] === '') return 'Localhost Node (SQLite lokal)';
    return this.activeIndex === 1 ? 'Akun Utama (Cloudflare A)' : `Akun Cadangan (Cloudflare B #${this.activeIndex})`;
  }

  public setEndpoints(newEndpoints: string[]) {
    this.endpoints = newEndpoints.filter(e => e && e.trim());
    localStorage.setItem('cekserp_cf_endpoints', JSON.stringify(this.endpoints));
  }

  public getEndpoints(): string[] {
    return [...this.endpoints];
  }

  public switchNextEndpoint(): string {
    if (this.endpoints.length <= 1) return this.getActiveEndpoint();
    const oldEp = this.getActiveEndpoint();
    this.activeIndex = (this.activeIndex + 1) % this.endpoints.length;
    localStorage.setItem('cekserp_cf_active_index', this.activeIndex.toString());
    const newEp = this.getActiveEndpoint();
    console.warn(`[ApiGateway] Failover triggered! Switched active backend from ${oldEp} to: ${newEp} (${this.getActiveAccountName()})`);

    if (this.onFailoverCallback) {
      this.onFailoverCallback(oldEp, newEp, this.getActiveAccountName());
    }
    return newEp;
  }

  public async fetchWithFailover(path: string, options: RequestInit = {}, authToken?: string): Promise<Response> {
    const attempts = Math.max(1, this.endpoints.length);
    let lastError: any = null;

    for (let i = 0; i < attempts; i++) {
      const baseUrl = this.getActiveEndpoint();
      const fullUrl = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        ...(options.headers as Record<string, string> || {})
      };

      try {
        const response = await fetch(fullUrl, { ...options, headers });

        // HTTP 429 = Cloudflare Workers 100k requests/day rate limit
        // HTTP 503 = Service Unavailable / D1 DB limit
        if (response.status === 429 || response.status === 503) {
          console.warn(`[ApiGateway] Worker/DB limit hit on ${baseUrl} (HTTP ${response.status}). Rotated to next endpoint...`);
          this.switchNextEndpoint();
          continue;
        }

        // On successful write request (POST, PUT, DELETE), silently replicate to all other backend nodes
        const method = (options.method || 'GET').toUpperCase();
        if (response.ok && ['POST', 'PUT', 'DELETE'].includes(method) && !path.includes('/api/sync/replicate') && !path.includes('/api/auth/login')) {
          this.replicateWriteToOtherNodes(path, options, headers);
        }

        return response;
      } catch (err: any) {
        console.warn(`[ApiGateway] Network/Fetch failed on ${baseUrl}:`, err.message);
        lastError = err;
        this.switchNextEndpoint();
      }
    }

    throw lastError || new Error('Gagal terhubung ke semua Server Cloudflare Workers.');
  }

  private async replicateWriteToOtherNodes(path: string, options: RequestInit, headers: Record<string, string>) {
    const activeEp = this.getActiveEndpoint();
    for (const ep of this.endpoints) {
      if (ep === activeEp) continue;
      try {
        const replicaUrl = `${ep}${path.startsWith('/') ? '' : '/'}${path}`;
        fetch(replicaUrl, { ...options, headers }).catch(() => {});
      } catch (e) {}
    }
  }
}

export const apiGateway = new ApiGatewayManager();
