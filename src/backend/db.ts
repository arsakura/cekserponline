import { Env, UserItem, CategoryItem, ApiKeyItem, ProjectItem, KeywordItem, SerpHistoryItem, LogbookItem, NewsTickerItem, FeaturedKeywordItem, FeaturedKeywordStat } from './types';
import { createClient, Client as TursoClient } from '@libsql/client';

// Web Crypto Password Hashing Helper
export async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password + 'SERP_SALT_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// In-Memory storage fallback
let mockUsers: UserItem[] = [];
let mockCategories: CategoryItem[] = [];
let mockApiKeys: ApiKeyItem[] = [];
let mockProjects: ProjectItem[] = [];
let mockKeywords: KeywordItem[] = [];
let mockHistory: SerpHistoryItem[] = [];
let mockLogbooks: LogbookItem[] = [];
let mockNewsTickers: NewsTickerItem[] = [];
let mockFeaturedKeywords: FeaturedKeywordItem[] = [];
let seeded = false;

async function seedDefaultData() {
  if (seeded) return;
  seeded = true;

  const adminHash = await hashPassword('admin123password');
  const userHash = await hashPassword('user123password');

  mockUsers = [
    {
      id: 'admin-01',
      email: 'admin@cekserp.com',
      name: 'Super Admin',
      role: 'admin',
      password_hash: adminHash,
      created_at: new Date().toISOString()
    },
    {
      id: 'user-01',
      email: 'user@cekserp.com',
      name: 'Budi (Client SEO)',
      role: 'user',
      password_hash: userHash,
      created_at: new Date().toISOString()
    }
  ];

  mockCategories = [
    {
      id: 'cat-01',
      user_id: 'admin-01',
      name: 'General / Utama',
      description: 'Kategori bawaan sistem',
      created_at: new Date().toISOString()
    },
    {
      id: 'cat-02',
      user_id: 'admin-01',
      name: 'Klien Agency SEO',
      description: 'Proyek optimasi website klien agency',
      created_at: new Date().toISOString()
    },
    {
      id: 'cat-03',
      user_id: 'user-01',
      name: 'E-Commerce Toko Baju',
      description: 'Project toko online pribadi',
      created_at: new Date().toISOString()
    }
  ];

  mockApiKeys = [
    {
      id: 'key-admin-01',
      user_id: 'admin-01',
      api_key: 'demo_key_serpapi_admin_1',
      label: 'Demo Key Admin Utama',
      is_active: 1,
      usage_count: 5,
      last_used_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    },
    {
      id: 'key-user-01',
      user_id: 'user-01',
      api_key: 'demo_key_serpapi_user_1',
      label: 'Demo Key User Budi',
      is_active: 1,
      usage_count: 12,
      last_used_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  ];

  mockProjects = [
    {
      id: 'proj-01',
      user_id: 'user-01',
      category_id: 'cat-03',
      name: 'Toko Online Fashion Budi',
      target_url: 'tokobaguskids.com',
      country_code: 'id',
      language_code: 'id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category_name: 'E-Commerce Toko Baju',
      user_name: 'Budi (Client SEO)',
      user_email: 'user@cekserp.com'
    }
  ];

  mockKeywords = [
    {
      id: 'kw-01',
      project_id: 'proj-01',
      keyword: 'baju anak laki laki murah',
      created_at: new Date().toISOString(),
      latest_position: 4,
      previous_position: 7,
      found_url: 'https://tokobaguskids.com/baju-anak-laki-laki',
      page_number: 1,
      checked_at: new Date().toISOString()
    },
    {
      id: 'kw-02',
      project_id: 'proj-01',
      keyword: 'grosir kaos anak branded',
      created_at: new Date().toISOString(),
      latest_position: 12,
      previous_position: 15,
      found_url: 'https://tokobaguskids.com/grosir-kaos',
      page_number: 2,
      checked_at: new Date().toISOString()
    }
  ];
}

export class DatabaseService {
  private db?: D1Database;
  private turso?: TursoClient;

  constructor(env: Env) {
    this.db = env?.DB;

    const proc = (globalThis as any).process;
    const tursoUrl = env?.TURSO_DATABASE_URL || (proc?.env?.TURSO_DATABASE_URL);
    const tursoToken = env?.TURSO_AUTH_TOKEN || (proc?.env?.TURSO_AUTH_TOKEN);

    if (tursoUrl && tursoToken) {
      try {
        this.turso = createClient({
          url: tursoUrl,
          authToken: tursoToken
        });
      } catch (e) {
        console.error('[Turso] Failed to initialize client:', e);
      }
    } else if (!this.db) {
      // Localhost fallback: Use local SQLite database file (cekserp.db)
      try {
        this.turso = createClient({
          url: 'file:cekserp.db'
        });
      } catch (e) {
        console.error('[Local SQLite] Failed to initialize local db file:', e);
      }
    }

    seedDefaultData();
  }

  private async queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (this.turso) {
      const rs = await this.turso.execute({ sql, args: params });
      return rs.rows.map((row: any) => {
        const obj: any = {};
        for (const col of rs.columns) {
          obj[col] = row[col];
        }
        return obj as T;
      });
    }
    if (this.db) {
      const { results } = await this.db.prepare(sql).bind(...params).all<T>();
      return results || [];
    }
    return [];
  }

  private async queryFirst<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    if (this.turso) {
      const rows = await this.queryAll<T>(sql, params);
      return rows[0] || null;
    }
    if (this.db) {
      const result = await this.db.prepare(sql).bind(...params).first<T>();
      return result || null;
    }
    return null;
  }

  private async executeSql(sql: string, params: any[] = []): Promise<void> {
    if (this.turso) {
      await this.turso.execute({ sql, args: params });
    } else if (this.db) {
      await this.db.prepare(sql).bind(...params).run();
    }
  }

  // --- USERS ---
  async getUsers(): Promise<UserItem[]> {
    if (this.turso || this.db) {
      return await this.queryAll<UserItem>('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC');
    }
    return mockUsers.map(({ password_hash, ...u }) => u);
  }

  async getUserByEmail(email: string): Promise<UserItem | null> {
    if (this.turso || this.db) {
      return await this.queryFirst<UserItem>(
        'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
        [email.trim()]
      );
    }
    return mockUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
  }

  async getUserById(id: string): Promise<UserItem | null> {
    if (this.turso || this.db) {
      return await this.queryFirst<UserItem>(
        'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
        [id]
      );
    }
    const found = mockUsers.find(u => u.id === id);
    if (!found) return null;
    const { password_hash, ...u } = found;
    return u;
  }

  async createUser(email: string, passwordPlain: string, name: string, role: 'admin' | 'user' = 'user'): Promise<UserItem> {
    const existing = await this.getUserByEmail(email);
    if (existing) {
      throw new Error(`Email "${email}" sudah terdaftar di sistem.`);
    }

    const hash = await hashPassword(passwordPlain);
    const newItem: UserItem = {
      id: crypto.randomUUID(),
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role,
      password_hash: hash,
      created_at: new Date().toISOString()
    };

    if (this.turso || this.db) {
      await this.executeSql(
        'INSERT INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [newItem.id, newItem.email, newItem.password_hash, newItem.name, newItem.role, newItem.created_at]
      );
    } else {
      mockUsers.push(newItem);
    }

    const { password_hash, ...createdUser } = newItem;
    return createdUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    if (this.turso || this.db) {
      await this.executeSql('DELETE FROM api_keys WHERE user_id = ?', [id]);
      await this.executeSql('DELETE FROM users WHERE id = ?', [id]);
    } else {
      mockUsers = mockUsers.filter(u => u.id !== id);
      mockProjects = mockProjects.filter(p => p.user_id !== id);
      mockCategories = mockCategories.filter(c => c.user_id !== id);
      mockApiKeys = mockApiKeys.filter(k => k.user_id !== id);
    }
    return true;
  }

  async updateUser(id: string, name: string, email: string, role: 'admin' | 'user', newPasswordPlain?: string): Promise<UserItem> {
    const existing = await this.getUserByEmail(email);
    if (existing && existing.id !== id) {
      throw new Error(`Email "${email}" sudah digunakan oleh pengguna lain.`);
    }

    let hash: string | undefined;
    if (newPasswordPlain && newPasswordPlain.trim()) {
      hash = await hashPassword(newPasswordPlain.trim());
    }

    if (this.turso || this.db) {
      if (hash) {
        await this.executeSql(
          'UPDATE users SET name = ?, email = ?, role = ?, password_hash = ? WHERE id = ?',
          [name.trim(), email.trim().toLowerCase(), role, hash, id]
        );
      } else {
        await this.executeSql(
          'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
          [name.trim(), email.trim().toLowerCase(), role, id]
        );
      }
    } else {
      const user = mockUsers.find(u => u.id === id);
      if (user) {
        user.name = name.trim();
        user.email = email.trim().toLowerCase();
        user.role = role;
        if (hash) user.password_hash = hash;
      }
    }

    const updated = await this.getUserById(id);
    if (!updated) throw new Error('User tidak ditemukan setelah diupdate.');
    return updated;
  }

  // --- CATEGORIES ---
  async getCategories(userId: string, role: 'admin' | 'user'): Promise<CategoryItem[]> {
    if (this.turso || this.db) {
      let query = `
        SELECT c.*, u.name as user_name,
               (SELECT COUNT(*) FROM projects p WHERE p.category_id = c.id) as project_count
        FROM categories c
        LEFT JOIN users u ON c.user_id = u.id
      `;
      if (role !== 'admin') {
        query += ` WHERE c.user_id = ? OR c.user_id = 'admin-01' ORDER BY c.name ASC`;
        return await this.queryAll<CategoryItem>(query, [userId]);
      } else {
        query += ` ORDER BY c.name ASC`;
        return await this.queryAll<CategoryItem>(query);
      }
    }

    return mockCategories
      .filter(c => role === 'admin' || c.user_id === userId || c.user_id === 'admin-01')
      .map(c => {
        const u = mockUsers.find(user => user.id === c.user_id);
        const pCount = mockProjects.filter(p => p.category_id === c.id).length;
        return {
          ...c,
          user_name: u ? u.name : 'System',
          project_count: pCount
        };
      });
  }

  async addCategory(userId: string, name: string, description?: string): Promise<CategoryItem> {
    const newItem: CategoryItem = {
      id: crypto.randomUUID(),
      user_id: userId,
      name: name.trim(),
      description: description?.trim() || null,
      created_at: new Date().toISOString(),
      project_count: 0
    };

    if (this.turso || this.db) {
      await this.executeSql(
        'INSERT INTO categories (id, user_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)',
        [newItem.id, newItem.user_id, newItem.name, newItem.description, newItem.created_at]
      );
    } else {
      mockCategories.push(newItem);
    }
    return newItem;
  }

  async deleteCategory(id: string): Promise<boolean> {
    if (this.turso || this.db) {
      await this.executeSql('DELETE FROM categories WHERE id = ?', [id]);
    } else {
      mockCategories = mockCategories.filter(c => c.id !== id);
    }
    return true;
  }

  // --- PER-USER API KEYS ---
  async getApiKeys(userId: string): Promise<ApiKeyItem[]> {
    if (this.turso || this.db) {
      return await this.queryAll<ApiKeyItem>(
        'SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at ASC',
        [userId]
      );
    }
    return mockApiKeys.filter(k => k.user_id === userId);
  }

  async addApiKey(userId: string, apiKey: string, label: string, maxKeys: number = 6): Promise<ApiKeyItem> {
    const userKeys = await this.getApiKeys(userId);
    if (userKeys.length >= maxKeys) {
      throw new Error(`Maksimal ${maxKeys} API Key SerpApi per akun yang diizinkan.`);
    }

    const newItem: ApiKeyItem = {
      id: crypto.randomUUID(),
      user_id: userId,
      api_key: apiKey.trim(),
      label: label.trim() || `API Key ${userKeys.length + 1}`,
      is_active: 1,
      usage_count: 0,
      last_used_at: null,
      created_at: new Date().toISOString()
    };

    if (this.turso || this.db) {
      await this.executeSql(
        'INSERT INTO api_keys (id, user_id, api_key, label, is_active, usage_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [newItem.id, newItem.user_id, newItem.api_key, newItem.label, newItem.is_active, newItem.usage_count, newItem.created_at]
      );
    } else {
      mockApiKeys.push(newItem);
    }
    return newItem;
  }

  async deleteApiKey(userId: string, id: string): Promise<boolean> {
    if (this.turso || this.db) {
      await this.executeSql('DELETE FROM api_keys WHERE id = ? AND user_id = ?', [id, userId]);
    } else {
      mockApiKeys = mockApiKeys.filter(k => !(k.id === id && k.user_id === userId));
    }
    return true;
  }

  async toggleApiKey(userId: string, id: string, is_active: number): Promise<boolean> {
    if (this.turso || this.db) {
      await this.executeSql('UPDATE api_keys SET is_active = ? WHERE id = ? AND user_id = ?', [is_active, id, userId]);
    } else {
      const key = mockApiKeys.find(k => k.id === id && k.user_id === userId);
      if (key) key.is_active = is_active;
    }
    return true;
  }

  async incrementKeyUsage(id: string): Promise<void> {
    const now = new Date().toISOString();
    if (this.db) {
      await this.db.prepare('UPDATE api_keys SET usage_count = usage_count + 1, last_used_at = ? WHERE id = ?').bind(now, id).run();
    } else {
      const key = mockApiKeys.find(k => k.id === id);
      if (key) {
        key.usage_count += 1;
        key.last_used_at = now;
      }
    }
  }

  async updateApiKeyQuota(userId: string, id: string, remainingQuota: number, totalQuota: number, planName: string): Promise<ApiKeyItem | null> {
    const now = new Date().toISOString();
    if (this.db) {
      try {
        await this.db.prepare(
          'UPDATE api_keys SET remaining_quota = ?, total_quota = ?, quota_updated_at = ?, plan_name = ? WHERE id = ? AND user_id = ?'
        ).bind(remainingQuota, totalQuota, now, planName, id, userId).run();
      } catch (e) {
        console.warn('D1 Quota columns update warning:', e);
      }
    }

    const key = mockApiKeys.find(k => k.id === id && k.user_id === userId);
    if (key) {
      key.remaining_quota = remainingQuota;
      key.total_quota = totalQuota;
      key.quota_updated_at = now;
      key.plan_name = planName;
      return key;
    }

    const keys = await this.getApiKeys(userId);
    const found = keys.find(k => k.id === id);
    if (found) {
      found.remaining_quota = remainingQuota;
      found.total_quota = totalQuota;
      found.quota_updated_at = now;
      found.plan_name = planName;
      return found;
    }
    return null;
  }

  // --- PROJECTS ---
  async getProjects(userId: string, role: 'admin' | 'user', filterCategoryId?: string, filterUserId?: string): Promise<ProjectItem[]> {
    if (this.turso || this.db) {
      let query = `
        SELECT p.*, c.name as category_name, u.name as user_name, u.email as user_email,
               (SELECT COUNT(*) FROM keywords k WHERE k.project_id = p.id) as keyword_count
        FROM projects p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.user_id = u.id
      `;
      const conditions: string[] = [];
      const bindings: any[] = [];

      if (role !== 'admin') {
        conditions.push(`p.user_id = ?`);
        bindings.push(userId);
      } else if (filterUserId && filterUserId !== 'ALL') {
        conditions.push(`p.user_id = ?`);
        bindings.push(filterUserId);
      }

      if (filterCategoryId && filterCategoryId !== 'ALL') {
        conditions.push(`p.category_id = ?`);
        bindings.push(filterCategoryId);
      }

      if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
      }
      query += ` ORDER BY p.created_at DESC`;

      return await this.queryAll<ProjectItem>(query, bindings);
    }

    return mockProjects
      .filter(p => {
        if (role !== 'admin' && p.user_id !== userId) return false;
        if (role === 'admin' && filterUserId && filterUserId !== 'ALL' && p.user_id !== filterUserId) return false;
        if (filterCategoryId && filterCategoryId !== 'ALL' && p.category_id !== filterCategoryId) return false;
        return true;
      })
      .map(p => {
        const cat = mockCategories.find(c => c.id === p.category_id);
        const u = mockUsers.find(user => user.id === p.user_id);
        const kwCount = mockKeywords.filter(k => k.project_id === p.id).length;
        return {
          ...p,
          category_name: cat ? cat.name : 'Umum',
          user_name: u ? u.name : 'Unknown User',
          user_email: u ? u.email : '',
          keyword_count: kwCount
        };
      });
  }

  async getProjectById(id: string): Promise<ProjectItem | null> {
    if (this.db) {
      const result = await this.db.prepare(`
        SELECT p.*, c.name as category_name, u.name as user_name, u.email as user_email
        FROM projects p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
      `).bind(id).first<ProjectItem>();
      return result || null;
    }
    const p = mockProjects.find(item => item.id === id);
    if (!p) return null;
    const cat = mockCategories.find(c => c.id === p.category_id);
    const u = mockUsers.find(user => user.id === p.user_id);
    return {
      ...p,
      category_name: cat ? cat.name : 'Umum',
      user_name: u ? u.name : 'Unknown',
      user_email: u ? u.email : ''
    };
  }

  async addProject(
    userId: string,
    name: string,
    target_url: string,
    categoryId: string | null = null,
    country_code = 'id',
    language_code = 'id'
  ): Promise<ProjectItem> {
    const now = new Date().toISOString();
    const newItem: ProjectItem = {
      id: crypto.randomUUID(),
      user_id: userId,
      category_id: categoryId || null,
      name: name.trim(),
      target_url: target_url.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, ''),
      country_code: country_code.trim().toLowerCase() || 'id',
      language_code: language_code.trim().toLowerCase() || 'id',
      created_at: now,
      updated_at: now
    };

    if (this.db) {
      await this.db.prepare(
        'INSERT INTO projects (id, user_id, category_id, name, target_url, country_code, language_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(newItem.id, newItem.user_id, newItem.category_id, newItem.name, newItem.target_url, newItem.country_code, newItem.language_code, newItem.created_at, newItem.updated_at).run();
    } else {
      mockProjects.push(newItem);
    }
    return newItem;
  }

  async deleteProject(id: string): Promise<boolean> {
    if (this.db) {
      await this.db.prepare('DELETE FROM keywords WHERE project_id = ?').bind(id).run();
      await this.db.prepare('DELETE FROM serp_history WHERE project_id = ?').bind(id).run();
      await this.db.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
    } else {
      mockProjects = mockProjects.filter(p => p.id !== id);
      mockKeywords = mockKeywords.filter(k => k.project_id !== id);
      mockHistory = mockHistory.filter(h => h.project_id !== id);
    }
    return true;
  }

  // --- KEYWORDS ---
  async getKeywordsByProject(project_id: string): Promise<KeywordItem[]> {
    if (this.turso || this.db) {
      return await this.queryAll<KeywordItem>(`
        SELECT k.*, 
          (SELECT position FROM serp_history sh WHERE sh.keyword_id = k.id ORDER BY checked_at DESC LIMIT 1) as latest_position,
          (SELECT position FROM serp_history sh WHERE sh.keyword_id = k.id ORDER BY checked_at DESC LIMIT 1 OFFSET 1) as previous_position,
          (SELECT found_url FROM serp_history sh WHERE sh.keyword_id = k.id ORDER BY checked_at DESC LIMIT 1) as found_url,
          (SELECT page_number FROM serp_history sh WHERE sh.keyword_id = k.id ORDER BY checked_at DESC LIMIT 1) as page_number,
          (SELECT checked_at FROM serp_history sh WHERE sh.keyword_id = k.id ORDER BY checked_at DESC LIMIT 1) as checked_at
        FROM keywords k
        WHERE k.project_id = ?
        ORDER BY k.created_at DESC
      `, [project_id]);
    }

    return mockKeywords
      .filter(k => k.project_id === project_id)
      .map(k => {
        const history = mockHistory.filter(h => h.keyword_id === k.id).sort((a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime());
        return {
          ...k,
          latest_position: history[0] ? history[0].position : null,
          previous_position: history[1] ? history[1].position : null,
          found_url: history[0] ? history[0].found_url : null,
          page_number: history[0] ? history[0].page_number : null,
          checked_at: history[0] ? history[0].checked_at : null
        };
      });
  }

  async getAllKeywords(userId: string, role: 'admin' | 'user'): Promise<KeywordItem[]> {
    if (this.turso || this.db) {
      let query = `
        SELECT k.*, 
          (SELECT position FROM serp_history sh WHERE sh.keyword_id = k.id ORDER BY checked_at DESC LIMIT 1) as latest_position,
          (SELECT position FROM serp_history sh WHERE sh.keyword_id = k.id ORDER BY checked_at DESC LIMIT 1 OFFSET 1) as previous_position,
          (SELECT checked_at FROM serp_history sh WHERE sh.keyword_id = k.id ORDER BY checked_at DESC LIMIT 1) as checked_at
        FROM keywords k
        JOIN projects p ON k.project_id = p.id
      `;
      const bindings: any[] = [];
      if (role !== 'admin') {
        query += ` WHERE p.user_id = ?`;
        bindings.push(userId);
      }
      query += ` ORDER BY k.created_at DESC`;
      return await this.queryAll<KeywordItem>(query, bindings);
    }

    const userProjIds = new Set(mockProjects.filter(p => role === 'admin' || p.user_id === userId).map(p => p.id));
    return mockKeywords
      .filter(k => userProjIds.has(k.project_id))
      .map(k => {
        const history = mockHistory.filter(h => h.keyword_id === k.id).sort((a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime());
        return {
          ...k,
          latest_position: history[0] ? history[0].position : null,
          previous_position: history[1] ? history[1].position : null,
          checked_at: history[0] ? history[0].checked_at : null
        };
      });
  }

  async addKeywords(project_id: string, keywordList: string[]): Promise<KeywordItem[]> {
    const created: KeywordItem[] = [];
    for (const kw of keywordList) {
      const trimmed = kw.trim();
      if (!trimmed) continue;
      const item: KeywordItem = {
        id: crypto.randomUUID(),
        project_id,
        keyword: trimmed,
        created_at: new Date().toISOString()
      };

      if (this.turso || this.db) {
        await this.executeSql(
          'INSERT INTO keywords (id, project_id, keyword, created_at) VALUES (?, ?, ?, ?)',
          [item.id, item.project_id, item.keyword, item.created_at]
        );
      } else {
        mockKeywords.push(item);
      }
      created.push(item);
    }
    return created;
  }

  async deleteKeyword(id: string): Promise<boolean> {
    if (this.turso || this.db) {
      await this.executeSql('DELETE FROM serp_history WHERE keyword_id = ?', [id]);
      await this.executeSql('DELETE FROM keywords WHERE id = ?', [id]);
    } else {
      mockKeywords = mockKeywords.filter(k => k.id !== id);
      mockHistory = mockHistory.filter(h => h.keyword_id !== id);
    }
    return true;
  }

  // --- SERP HISTORY ---
  async recordSerpCheck(
    keyword_id: string,
    project_id: string,
    position: number | null,
    found_url: string | null,
    page_number: number | null,
    api_key_used: string | null
  ): Promise<SerpHistoryItem> {
    const item: SerpHistoryItem = {
      id: crypto.randomUUID(),
      keyword_id,
      project_id,
      position,
      found_url,
      page_number,
      api_key_used,
      checked_at: new Date().toISOString()
    };

    if (this.turso || this.db) {
      await this.executeSql(`
        INSERT INTO serp_history (id, keyword_id, project_id, position, found_url, page_number, api_key_used, checked_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [item.id, item.keyword_id, item.project_id, item.position, item.found_url, item.page_number, item.api_key_used, item.checked_at]);
    } else {
      mockHistory.push(item);
    }
    return item;
  }

  async getAllHistory(userId: string, role: 'admin' | 'user'): Promise<SerpHistoryItem[]> {
    if (this.turso || this.db) {
      let query = `
        SELECT sh.*, k.keyword, p.name as project_name, p.target_url, c.name as category_name, u.name as user_name
        FROM serp_history sh
        JOIN keywords k ON sh.keyword_id = k.id
        JOIN projects p ON sh.project_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.user_id = u.id
      `;
      const bindings: any[] = [];
      if (role !== 'admin') {
        query += ` WHERE p.user_id = ?`;
        bindings.push(userId);
      }
      query += ` ORDER BY sh.checked_at DESC`;
      return await this.queryAll<SerpHistoryItem>(query, bindings);
    }

    return mockHistory
      .filter(h => {
        const prj = mockProjects.find(p => p.id === h.project_id);
        if (role !== 'admin' && prj?.user_id !== userId) return false;
        return true;
      })
      .map(h => {
        const kw = mockKeywords.find(k => k.id === h.keyword_id);
        const prj = mockProjects.find(p => p.id === h.project_id);
        const cat = mockCategories.find(c => c.id === prj?.category_id);
        const u = mockUsers.find(user => user.id === prj?.user_id);
        return {
          ...h,
          keyword: kw ? kw.keyword : '',
          project_name: prj ? prj.name : '',
          target_url: prj ? prj.target_url : '',
          category_name: cat ? cat.name : 'Umum',
          user_name: u ? u.name : 'User'
        };
      })
      .sort((a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime());
  }

  // --- LOGBOOKS ---
  async getLogbooks(userId: string, role: 'admin' | 'user'): Promise<LogbookItem[]> {
    if (this.db) {
      let query = `
        SELECT l.*, p.name as project_name, u.name as user_name
        FROM logbooks l
        JOIN projects p ON l.project_id = p.id
        JOIN users u ON l.user_id = u.id
      `;
      if (role !== 'admin') {
        query += ` WHERE l.user_id = ?`;
      }
      query += ` ORDER BY l.created_at DESC`;
      
      const stmt = this.db.prepare(query);
      const { results } = role !== 'admin' ? await stmt.bind(userId).all<LogbookItem>() : await stmt.all<LogbookItem>();
      return results || [];
    }

    return mockLogbooks
      .filter(l => role === 'admin' || l.user_id === userId)
      .map(l => {
        const p = mockProjects.find(proj => proj.id === l.project_id);
        const u = mockUsers.find(user => user.id === l.user_id);
        return {
          ...l,
          project_name: p ? p.name : 'Unknown Project',
          user_name: u ? u.name : 'Unknown User'
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async addLogbook(userId: string, projectId: string, keywordId: string | null, actionType: string, description: string): Promise<LogbookItem> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    
    if (this.db) {
      await this.db.prepare(`
        INSERT INTO logbooks (id, user_id, project_id, keyword_id, action_type, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(id, userId, projectId, keywordId, actionType, description, createdAt).run();
    } else {
      mockLogbooks.push({ id, user_id: userId, project_id: projectId, keyword_id: keywordId, action_type: actionType, description, created_at: createdAt });
    }
    
    return { id, user_id: userId, project_id: projectId, keyword_id: keywordId, action_type: actionType, description, created_at: createdAt };
  }

  async updateLogbook(id: string, userId: string, role: 'admin' | 'user', actionType: string, description: string): Promise<boolean> {
    if (this.db) {
      let query = 'UPDATE logbooks SET action_type = ?, description = ? WHERE id = ?';
      const bindings: any[] = [actionType, description, id];
      if (role !== 'admin') {
        query += ' AND user_id = ?';
        bindings.push(userId);
      }
      const stmt = this.db.prepare(query);
      await stmt.bind(...bindings).run();
      return true;
    } else {
      const idx = mockLogbooks.findIndex(l => l.id === id && (role === 'admin' || l.user_id === userId));
      if (idx !== -1) {
        mockLogbooks[idx].action_type = actionType;
        mockLogbooks[idx].description = description;
      }
      return true;
    }
  }

  async deleteLogbook(id: string, userId: string, role: 'admin' | 'user'): Promise<boolean> {
    if (this.db) {
      if (role === 'admin') {
        await this.db.prepare('DELETE FROM logbooks WHERE id = ?').bind(id).run();
      } else {
        await this.db.prepare('DELETE FROM logbooks WHERE id = ? AND user_id = ?').bind(id, userId).run();
      }
      return true;
    } else {
      mockLogbooks = mockLogbooks.filter(l => {
        if (l.id === id) {
          if (role === 'admin' || l.user_id === userId) return false; // delete
        }
        return true;
      });
      return true;
    }
  }

  // --- NEWSTICKER METHODS ---
  async getNewsTickers(activeOnly = false): Promise<NewsTickerItem[]> {
    if (this.turso || this.db) {
      let query = 'SELECT * FROM newstickers';
      if (activeOnly) {
        query += ' WHERE is_active = 1';
      }
      query += ' ORDER BY created_at DESC';
      return await this.queryAll<NewsTickerItem>(query);
    } else {
      return mockNewsTickers
        .filter(t => !activeOnly || t.is_active === 1)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }

  async addNewsTicker(content: string, isActive = 1): Promise<NewsTickerItem> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    if (this.turso || this.db) {
      await this.executeSql(
        'INSERT INTO newstickers (id, content, is_active, created_at) VALUES (?, ?, ?, ?)',
        [id, content, isActive, createdAt]
      );
    } else {
      mockNewsTickers.push({ id, content, is_active: isActive, created_at: createdAt });
    }

    return { id, content, is_active: isActive, created_at: createdAt };
  }

  async updateNewsTicker(id: string, content: string, isActive: number): Promise<boolean> {
    if (this.turso || this.db) {
      await this.executeSql(
        'UPDATE newstickers SET content = ?, is_active = ? WHERE id = ?',
        [content, isActive, id]
      );
    } else {
      const idx = mockNewsTickers.findIndex(t => t.id === id);
      if (idx !== -1) {
        mockNewsTickers[idx].content = content;
        mockNewsTickers[idx].is_active = isActive;
      }
    }
    return true;
  }

  async deleteNewsTicker(id: string): Promise<boolean> {
    if (this.turso || this.db) {
      await this.executeSql('DELETE FROM newstickers WHERE id = ?', [id]);
    } else {
      mockNewsTickers = mockNewsTickers.filter(t => t.id !== id);
    }
    return true;
  }

  // --- FEATURED KEYWORDS METHODS ---
  async getFeaturedKeywords(activeOnly = false): Promise<FeaturedKeywordItem[]> {
    if (this.turso || this.db) {
      let query = 'SELECT * FROM featured_keywords';
      if (activeOnly) {
        query += ' WHERE is_active = 1';
      }
      query += ' ORDER BY created_at DESC';
      return await this.queryAll<FeaturedKeywordItem>(query);
    } else {
      return mockFeaturedKeywords
        .filter(t => !activeOnly || t.is_active === 1)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }

  async addFeaturedKeyword(keyword: string, isActive = 1): Promise<FeaturedKeywordItem> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const cleanKw = keyword.trim();

    if (this.turso || this.db) {
      await this.executeSql(
        'INSERT INTO featured_keywords (id, keyword, is_active, created_at) VALUES (?, ?, ?, ?)',
        [id, cleanKw, isActive, createdAt]
      );
    } else {
      mockFeaturedKeywords.push({ id, keyword: cleanKw, is_active: isActive, created_at: createdAt });
    }

    return { id, keyword: cleanKw, is_active: isActive, created_at: createdAt };
  }

  async updateFeaturedKeyword(id: string, keyword: string, isActive: number): Promise<boolean> {
    const cleanKw = keyword.trim();
    if (this.turso || this.db) {
      await this.executeSql(
        'UPDATE featured_keywords SET keyword = ?, is_active = ? WHERE id = ?',
        [cleanKw, isActive, id]
      );
    } else {
      const idx = mockFeaturedKeywords.findIndex(t => t.id === id);
      if (idx !== -1) {
        mockFeaturedKeywords[idx].keyword = cleanKw;
        mockFeaturedKeywords[idx].is_active = isActive;
      }
    }
    return true;
  }

  async updateFeaturedKeywordSerpResult(id: string, top10Count: number, serpDataJson: string): Promise<boolean> {
    const now = new Date().toISOString();
    if (this.turso || this.db) {
      await this.executeSql(
        'UPDATE featured_keywords SET last_checked_at = ?, top10_count = ?, serp_data = ? WHERE id = ?',
        [now, top10Count, serpDataJson, id]
      );
    } else {
      const idx = mockFeaturedKeywords.findIndex(t => t.id === id);
      if (idx !== -1) {
        mockFeaturedKeywords[idx].last_checked_at = now;
        mockFeaturedKeywords[idx].top10_count = top10Count;
        mockFeaturedKeywords[idx].serp_data = serpDataJson;
      }
    }
    return true;
  }

  async deleteFeaturedKeyword(id: string): Promise<boolean> {
    if (this.turso || this.db) {
      await this.executeSql('DELETE FROM featured_keywords WHERE id = ?', [id]);
    } else {
      mockFeaturedKeywords = mockFeaturedKeywords.filter(t => t.id !== id);
    }
    return true;
  }

  async getFeaturedKeywordsStats(): Promise<FeaturedKeywordStat[]> {
    const featuredList = await this.getFeaturedKeywords(true); // active only
    if (featuredList.length === 0) return [];

    const resultStats: FeaturedKeywordStat[] = [];

    for (const item of featuredList) {
      let top10Results: any[] = [];
      if (item.serp_data) {
        try {
          top10Results = JSON.parse(item.serp_data);
        } catch (e) {}
      }

      const top10Count = item.top10_count || 0;
      const totalResults = top10Results.length || 10;
      const percentage = Math.round((top10Count / totalResults) * 100);

      resultStats.push({
        id: item.id,
        keyword: item.keyword,
        is_active: item.is_active,
        last_checked_at: item.last_checked_at || null,
        top10Count,
        totalResults,
        percentage,
        top10Results
      });
    }

    return resultStats;
  }

  // --- REPLICATION ENGINE ---
  async replicateData(table: string, action: 'INSERT' | 'UPDATE' | 'DELETE', data: any): Promise<boolean> {
    if ((!this.turso && !this.db) || !data) return true;
    try {
      if (action === 'DELETE' && data.id) {
        await this.executeSql(`DELETE FROM ${table} WHERE id = ?`, [data.id]);
      } else if (action === 'INSERT' || action === 'UPDATE') {
        const keys = Object.keys(data);
        const cols = keys.join(', ');
        const placeholders = keys.map(() => '?').join(', ');
        const vals = keys.map(k => data[k]);
        
        await this.executeSql(`INSERT OR REPLACE INTO ${table} (${cols}) VALUES (${placeholders})`, vals);
      }
      return true;
    } catch (err: any) {
      console.error(`Replication error on ${table}:`, err.message);
      return false;
    }
  }
}
