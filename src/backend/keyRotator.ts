import { DatabaseService } from './db';
import { ApiKeyItem } from './types';

export class KeyRotator {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  async getActiveKeys(userId: string): Promise<ApiKeyItem[]> {
    const keys = await this.dbService.getApiKeys(userId);
    return keys.filter(k => k.is_active === 1);
  }

  async getNextKey(userId: string): Promise<ApiKeyItem> {
    const activeKeys = await this.getActiveKeys(userId);

    if (activeKeys.length === 0) {
      throw new Error('Anda belum memiliki API Key SerpApi yang aktif. Silakan tambahkan API Key terlebih dahulu di menu API Keys.');
    }

    // Sort by least usage count
    activeKeys.sort((a, b) => a.usage_count - b.usage_count);
    const selectedKey = activeKeys[0];

    // Increment usage
    await this.dbService.incrementKeyUsage(selectedKey.id);
    return selectedKey;
  }

  async handleKeyFailure(userId: string, keyId: string, errorMsg?: string): Promise<void> {
    console.warn(`[KeyRotator] Key ID ${keyId} milik user ${userId} mengalami kegagalan / quota limit. Error: ${errorMsg}`);
    await this.dbService.toggleApiKey(userId, keyId, 0);
  }
}
