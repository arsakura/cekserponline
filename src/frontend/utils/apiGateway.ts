// API Gateway Manager (Configured 100% for Localhost Node SQLite `cekserp.db`)

const DEFAULT_ENDPOINTS = [
  '' // Localhost Node (Local SQLite Database `cekserp.db`)
];

class ApiGatewayManager {
  private endpoints: string[];
  private activeIndex: number;
  private onFailoverCallback?: (oldEndpoint: string, newEndpoint: string, accountName: string) => void;

  constructor() {
    // Lock 100% to Localhost Node
    localStorage.removeItem('cekserp_cf_endpoints');
    localStorage.removeItem('cekserp_cf_active_index');
    this.endpoints = DEFAULT_ENDPOINTS;
    this.activeIndex = 0;
  }

  public setOnFailoverListener(cb: (oldEndpoint: string, newEndpoint: string, accountName: string) => void) {
    this.onFailoverCallback = cb;
  }

  public getActiveEndpoint(): string {
    return '';
  }

  public getActiveIndex(): number {
    return 0;
  }

  public getActiveAccountName(): string {
    return 'Localhost Node (SQLite lokal)';
  }

  public setEndpoints(newEndpoints: string[]) {
    this.endpoints = [''];
  }

  public getEndpoints(): string[] {
    return [''];
  }

  public switchNextEndpoint(): string {
    return '';
  }

  public async fetchWithFailover(path: string, options: RequestInit = {}, authToken?: string): Promise<Response> {
    const baseUrl = this.getActiveEndpoint();
    const fullUrl = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      ...(options.headers as Record<string, string> || {})
    };

    return fetch(fullUrl, { ...options, headers });
  }
}

export const apiGateway = new ApiGatewayManager();
