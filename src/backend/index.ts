import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic as serveStaticCF } from 'hono/cloudflare-workers';
import { DatabaseService, hashPassword } from './db';
import { SerpCheckerEngine } from './serpChecker';
import { SerpExplorerEngine } from './serpExplorer';
import { Env, UserItem } from './types';

const app = new Hono<{ Bindings: Env; Variables: { currentUser?: UserItem } }>();

// Enable CORS
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Helper to instantiate DB
const getDb = (c: any) => new DatabaseService(c.env);

// Auth Middleware: attaches currentUser to c.var
app.use('/api/*', async (c, next) => {
  const path = c.req.path;
  if (path === '/api/auth/login' || path === '/api/sync/replicate') {
    return await next();
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Akses ditolak: Silakan login terlebih dahulu' }, 401);
  }

  const token = authHeader.substring(7);
  const db = getDb(c);
  const user = await db.getUserById(token);

  if (!user) {
    return c.json({ success: false, error: 'Sesi login telah berakhir atau tidak valid' }, 401);
  }

  c.set('currentUser', user);
  await next();
});

// --- CROSS-NODE REPLICATION ENDPOINT ---
app.post('/api/sync/replicate', async (c) => {
  try {
    const { table, action, data } = await c.req.json();
    if (!table || !action || !data) {
      return c.json({ success: false, error: 'Data replikasi tidak lengkap' }, 400);
    }
    const db = getDb(c);
    await db.replicateData(table, action, data);
    return c.json({ success: true, message: 'Replikasi data berhasil diterapkan' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// --- AUTH ENDPOINTS ---
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ success: false, error: 'Email dan password wajib diisi' }, 400);
    }

    const db = getDb(c);
    const user = await db.getUserByEmail(email);
    if (!user || !user.password_hash) {
      return c.json({ success: false, error: 'Email atau password salah' }, 400);
    }

    const inputHash = await hashPassword(password);
    if (inputHash !== user.password_hash) {
      return c.json({ success: false, error: 'Email atau password salah' }, 400);
    }

    const { password_hash, ...safeUser } = user;
    return c.json({
      success: true,
      data: {
        token: user.id,
        user: safeUser
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get('/api/auth/me', async (c) => {
  const user = c.get('currentUser');
  return c.json({ success: true, data: user });
});

// --- ADMIN ONLY: USER MANAGEMENT ---
app.get('/api/admin/users', async (c) => {
  const currentUser = c.get('currentUser')!;
  if (currentUser.role !== 'admin') {
    return c.json({ success: false, error: 'Akses ditolak: Fitur ini khusus Administrator' }, 403);
  }
  const db = getDb(c);
  const users = await db.getUsers();
  return c.json({ success: true, data: users });
});

app.post('/api/admin/users', async (c) => {
  const currentUser = c.get('currentUser')!;
  if (currentUser.role !== 'admin') {
    return c.json({ success: false, error: 'Akses ditolak: Hanya Admin yang dapat menambah user baru' }, 403);
  }
  try {
    const { email, password, name, role } = await c.req.json();
    if (!email || !password || !name) {
      return c.json({ success: false, error: 'Nama, Email, dan Password wajib diisi' }, 400);
    }
    const db = getDb(c);
    const newUser = await db.createUser(email, password, name, role || 'user');
    return c.json({ success: true, data: newUser });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.delete('/api/admin/users/:id', async (c) => {
  const currentUser = c.get('currentUser')!;
  if (currentUser.role !== 'admin') {
    return c.json({ success: false, error: 'Akses ditolak: Hanya Admin yang dapat menghapus user' }, 403);
  }
  try {
    const id = c.req.param('id');
    if (id === currentUser.id) {
      return c.json({ success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri' }, 400);
    }
    const db = getDb(c);
    await db.deleteUser(id);
    return c.json({ success: true, message: 'User berhasil dihapus' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.put('/api/admin/users/:id', async (c) => {
  const currentUser = c.get('currentUser')!;
  if (currentUser.role !== 'admin') {
    return c.json({ success: false, error: 'Akses ditolak: Hanya Admin yang dapat mengedit user' }, 403);
  }
  try {
    const id = c.req.param('id');
    const { name, email, role, password } = await c.req.json();
    if (!email || !name) {
      return c.json({ success: false, error: 'Nama dan Email wajib diisi' }, 400);
    }
    const db = getDb(c);
    const updatedUser = await db.updateUser(id, name, email, role || 'user', password);
    return c.json({ success: true, data: updatedUser });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// --- CATEGORIES ENDPOINTS ---
app.get('/api/categories', async (c) => {
  const currentUser = c.get('currentUser')!;
  const db = getDb(c);
  const categories = await db.getCategories(currentUser.id, currentUser.role);
  return c.json({ success: true, data: categories });
});

app.post('/api/categories', async (c) => {
  const currentUser = c.get('currentUser')!;
  try {
    const { name, description } = await c.req.json();
    if (!name) {
      return c.json({ success: false, error: 'Nama kategori wajib diisi' }, 400);
    }
    const db = getDb(c);
    const cat = await db.addCategory(currentUser.id, name, description);
    return c.json({ success: true, data: cat });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.delete('/api/categories/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c);
    await db.deleteCategory(id);
    return c.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// --- PER-USER API KEYS ENDPOINTS ---
app.get('/api/keys', async (c) => {
  const currentUser = c.get('currentUser')!;
  try {
    const db = getDb(c);
    const keys = await db.getApiKeys(currentUser.id);
    return c.json({ success: true, data: keys });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/api/keys', async (c) => {
  const currentUser = c.get('currentUser')!;
  try {
    const { api_key, label } = await c.req.json();
    if (!api_key) {
      return c.json({ success: false, error: 'API Key SerpApi wajib diisi' }, 400);
    }
    const db = getDb(c);
    const maxKeys = currentUser.role === 'admin' ? 9 : 6;
    const newKey = await db.addApiKey(currentUser.id, api_key, label || 'SerpApi Key', maxKeys);
    return c.json({ success: true, data: newKey });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.delete('/api/keys/:id', async (c) => {
  const currentUser = c.get('currentUser')!;
  try {
    const id = c.req.param('id');
    const db = getDb(c);
    await db.deleteApiKey(currentUser.id, id);
    return c.json({ success: true, message: 'API Key berhasil dihapus' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/api/keys/:id/toggle', async (c) => {
  const currentUser = c.get('currentUser')!;
  try {
    const id = c.req.param('id');
    const { is_active } = await c.req.json();
    const db = getDb(c);
    await db.toggleApiKey(currentUser.id, id, is_active ? 1 : 0);
    return c.json({ success: true, message: 'Status API Key berhasil diperbarui' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/api/keys/:id/check-quota', async (c) => {
  const currentUser = c.get('currentUser')!;
  try {
    const id = c.req.param('id');
    const db = getDb(c);
    const keys = await db.getApiKeys(currentUser.id);
    const key = keys.find(k => k.id === id);
    if (!key) {
      return c.json({ success: false, error: 'API Key tidak ditemukan' }, 404);
    }

    let remainingQuota = 100;
    let totalQuota = 100;
    let planName = 'Free Plan (100 Search)';

    if (key.api_key.startsWith('demo_') || key.api_key === 'DEMO_KEY') {
      const remaining = Math.max(0, 100 - key.usage_count);
      remainingQuota = remaining;
      totalQuota = 100;
      planName = 'Simulasi / Demo Plan';
    } else {
      try {
        const resp = await fetch(`https://serpapi.com/account.json?api_key=${key.api_key}`);
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`SerpApi HTTP ${resp.status}: ${text}`);
        }
        const data = await resp.json() as any;
        if (data.error) {
          throw new Error(data.error);
        }
        planName = data.plan_name || 'Standard Plan';
        totalQuota = data.searches_per_month || data.total_searches_left || 100;
        if (data.remaining_searches !== undefined) {
          remainingQuota = data.remaining_searches;
        } else if (data.this_month_usage !== undefined && data.searches_per_month) {
          remainingQuota = Math.max(0, data.searches_per_month - data.this_month_usage);
        } else {
          remainingQuota = data.total_searches_left || 100;
        }
      } catch (err: any) {
        throw new Error(`Gagal cek kuota: ${err.message}`);
      }
    }

    await db.updateApiKeyQuota(currentUser.id, id, remainingQuota, totalQuota, planName);
    const updatedKeys = await db.getApiKeys(currentUser.id);
    const updated = updatedKeys.find(k => k.id === id);

    return c.json({
      success: true,
      data: updated || {
        id,
        remaining_quota: remainingQuota,
        total_quota: totalQuota,
        plan_name: planName,
        quota_updated_at: new Date().toISOString()
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/api/keys/check-all-quotas', async (c) => {
  const currentUser = c.get('currentUser')!;
  try {
    const db = getDb(c);
    const keys = await db.getApiKeys(currentUser.id);

    for (const key of keys) {
      let remainingQuota = 100;
      let totalQuota = 100;
      let planName = 'Free Plan';

      if (key.api_key.startsWith('demo_') || key.api_key === 'DEMO_KEY') {
        remainingQuota = Math.max(0, 100 - key.usage_count);
        totalQuota = 100;
        planName = 'Simulasi / Demo Plan';
      } else {
        try {
          const resp = await fetch(`https://serpapi.com/account.json?api_key=${key.api_key}`);
          if (resp.ok) {
            const data = await resp.json() as any;
            planName = data.plan_name || 'Standard Plan';
            totalQuota = data.searches_per_month || data.total_searches_left || 100;
            if (data.remaining_searches !== undefined) {
              remainingQuota = data.remaining_searches;
            } else if (data.this_month_usage !== undefined && data.searches_per_month) {
              remainingQuota = Math.max(0, data.searches_per_month - data.this_month_usage);
            }
          }
        } catch (e) {
          console.error('Error checking key quota:', e);
        }
      }

      await db.updateApiKeyQuota(currentUser.id, key.id, remainingQuota, totalQuota, planName);
    }

    const updatedKeys = await db.getApiKeys(currentUser.id);
    return c.json({ success: true, data: updatedKeys });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// --- PROJECTS ENDPOINTS ---
app.get('/api/projects', async (c) => {
  const currentUser = c.get('currentUser')!;
  const filterUserId = c.req.query('userId');
  const filterCategoryId = c.req.query('categoryId');
  
  try {
    const db = getDb(c);
    const projects = await db.getProjects(currentUser.id, currentUser.role, filterCategoryId, filterUserId);
    return c.json({ success: true, data: projects });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/api/projects', async (c) => {
  const currentUser = c.get('currentUser')!;
  try {
    const { name, target_url, category_id, country_code, language_code, keywords } = await c.req.json();
    if (!name || !target_url) {
      return c.json({ success: false, error: 'Nama Project dan Target URL wajib diisi' }, 400);
    }
    const db = getDb(c);
    const project = await db.addProject(currentUser.id, name, target_url, category_id, country_code, language_code);

    let addedKeywords: any[] = [];
    if (Array.isArray(keywords) && keywords.length > 0) {
      addedKeywords = await db.addKeywords(project.id, keywords);
    }

    return c.json({ success: true, data: { ...project, keywords: addedKeywords } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.delete('/api/projects/:id', async (c) => {
  const currentUser = c.get('currentUser')!;
  try {
    const id = c.req.param('id');
    const db = getDb(c);

    if (currentUser.role !== 'admin') {
      const p = await db.getProjectById(id);
      if (!p || p.user_id !== currentUser.id) {
        return c.json({ success: false, error: 'Anda tidak memiliki hak untuk menghapus project ini' }, 403);
      }
    }

    await db.deleteProject(id);
    return c.json({ success: true, message: 'Project berhasil dihapus' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// --- KEYWORDS ENDPOINTS ---
app.get('/api/projects/:projectId/keywords', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const db = getDb(c);
    const keywords = await db.getKeywordsByProject(projectId);
    return c.json({ success: true, data: keywords });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/api/projects/:projectId/keywords', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const { keywords } = await c.req.json();

    let keywordList: string[] = [];
    if (typeof keywords === 'string') {
      keywordList = keywords.split(/\n|,/).map(k => k.trim()).filter(Boolean);
    } else if (Array.isArray(keywords)) {
      keywordList = keywords;
    }

    if (keywordList.length === 0) {
      return c.json({ success: false, error: 'Kata kunci tidak boleh kosong' }, 400);
    }

    const db = getDb(c);
    const added = await db.addKeywords(projectId, keywordList);
    return c.json({ success: true, data: added });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.delete('/api/keywords/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c);
    await db.deleteKeyword(id);
    return c.json({ success: true, message: 'Kata kunci berhasil dihapus' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// --- SERP CHECK ENDPOINTS ---
app.post('/api/check-serp', async (c) => {
  const currentUser = c.get('currentUser')!;
  try {
    const { keywordId, projectId } = await c.req.json();
    const db = getDb(c);
    const project = await db.getProjectById(projectId);
    if (!project) {
      return c.json({ success: false, error: 'Project tidak ditemukan' }, 404);
    }

    const keywords = await db.getKeywordsByProject(projectId);
    const targetKw = keywords.find(k => k.id === keywordId);
    if (!targetKw) {
      return c.json({ success: false, error: 'Kata kunci tidak ditemukan' }, 404);
    }

    const engine = new SerpCheckerEngine(db);
    const targetUserId = project.user_id || currentUser.id;
    const result = await engine.runSerpCheck({
      userId: targetUserId,
      keywordId: targetKw.id,
      projectId: project.id,
      keyword: targetKw.keyword,
      targetUrl: project.target_url,
      countryCode: project.country_code,
      languageCode: project.language_code
    });

    return c.json({ success: true, data: result });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/api/check-project-serp', async (c) => {
  const currentUser = c.get('currentUser')!;
  try {
    const { projectId } = await c.req.json();
    const db = getDb(c);
    const project = await db.getProjectById(projectId);
    if (!project) {
      return c.json({ success: false, error: 'Project tidak ditemukan' }, 404);
    }

    const keywords = await db.getKeywordsByProject(projectId);
    if (keywords.length === 0) {
      return c.json({ success: false, error: 'Project belum memiliki kata kunci' }, 400);
    }

    const engine = new SerpCheckerEngine(db);
    const targetUserId = project.user_id || currentUser.id;
    const results = [];

    for (const kw of keywords) {
      try {
        const res = await engine.runSerpCheck({
          userId: targetUserId,
          keywordId: kw.id,
          projectId: project.id,
          keyword: kw.keyword,
          targetUrl: project.target_url,
          countryCode: project.country_code,
          languageCode: project.language_code
        });
        results.push(res);
      } catch (kwErr: any) {
        results.push({ keywordId: kw.id, keyword: kw.keyword, error: kwErr.message });
      }
    }

    return c.json({ success: true, data: results });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// --- STANDALONE SERP EXPLORER ENDPOINT ---
app.post('/api/explore-serp', async (c) => {
  const currentUser = c.get('currentUser')!;
  try {
    const { keyword, country = 'id', language = 'id', limit = 10 } = await c.req.json();
    if (!keyword || !keyword.trim()) {
      return c.json({ success: false, error: 'Kata kunci wajib diisi' }, 400);
    }

    const db = getDb(c);
    const explorer = new SerpExplorerEngine(db);
    const serpData = await explorer.exploreSerp(currentUser.id, keyword, country, language, limit);

    return c.json({ success: true, data: serpData });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// --- ANALYTICS ENDPOINTS ---
app.get('/api/analytics/dashboard', async (c) => {
  const currentUser = c.get('currentUser')!;
  const filterUserId = c.req.query('userId');
  const filterCategoryId = c.req.query('categoryId');

  try {
    const db = getDb(c);
    const projects = await db.getProjects(currentUser.id, currentUser.role, filterCategoryId, filterUserId);
    const allKeywords = await db.getAllKeywords(currentUser.id, currentUser.role);
    const allHistory = await db.getAllHistory(currentUser.id, currentUser.role);

    const totalProjects = projects.length;
    const totalKeywords = allKeywords.length;
    const trackedKeywords = allKeywords.filter(k => k.latest_position !== null && k.latest_position !== undefined);

    const avgPosition = trackedKeywords.length > 0
      ? (trackedKeywords.reduce((acc, k) => acc + (k.latest_position || 100), 0) / trackedKeywords.length).toFixed(1)
      : null;

    let top3 = 0, top10 = 0, top30 = 0, top100 = 0, notInTop100 = 0;
    for (const kw of trackedKeywords) {
      const pos = kw.latest_position;
      if (pos === null || pos === undefined) {
        notInTop100++;
      } else if (pos <= 3) {
        top3++; top10++; top30++; top100++;
      } else if (pos <= 10) {
        top10++; top30++; top100++;
      } else if (pos <= 30) {
        top30++; top100++;
      } else if (pos <= 100) {
        top100++;
      }
    }

    let rankUpCount = 0, rankDownCount = 0, rankUnchangedCount = 0;
    for (const kw of allKeywords) {
      if (kw.latest_position !== null && kw.previous_position !== null && kw.latest_position !== undefined && kw.previous_position !== undefined) {
        const delta = kw.previous_position - kw.latest_position;
        if (delta > 0) rankUpCount++;
        else if (delta < 0) rankDownCount++;
        else rankUnchangedCount++;
      }
    }

    return c.json({
      success: true,
      data: {
        totalProjects,
        totalKeywords,
        avgPosition: avgPosition ? parseFloat(avgPosition) : null,
        trackedCount: trackedKeywords.length,
        distribution: {
          top3,
          top10,
          top30,
          top100,
          notInTop100: totalKeywords - trackedKeywords.length
        },
        movement: {
          up: rankUpCount,
          down: rankDownCount,
          unchanged: rankUnchangedCount
        },
        recentChecks: allHistory.slice(0, 10)
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// --- LOGBOOKS ENDPOINTS ---
app.get('/api/workbooks', async (c) => {
  const currentUser = c.get('currentUser')!;
  try {
    const db = getDb(c);
    const logbooks = await db.getLogbooks(currentUser.id, currentUser.role);
    return c.json({ success: true, data: logbooks });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/api/workbooks', async (c) => {
  const currentUser = c.get('currentUser')!;
  try {
    const { projectId, keywordId, actionType, description } = await c.req.json();
    if (!projectId || !actionType) return c.json({ success: false, error: 'Proyek dan jenis aksi wajib diisi' }, 400);

    const db = getDb(c);
    const newLog = await db.addLogbook(currentUser.id, projectId, keywordId || null, actionType, description || '');
    return c.json({ success: true, data: newLog });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.put('/api/workbooks/:id', async (c) => {
  const currentUser = c.get('currentUser')!;
  const id = c.req.param('id');
  try {
    const { actionType, description } = await c.req.json();
    const db = getDb(c);
    await db.updateLogbook(id, currentUser.id, currentUser.role, actionType, description || '');
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.delete('/api/workbooks/:id', async (c) => {
  const currentUser = c.get('currentUser')!;
  const id = c.req.param('id');
  try {
    const db = getDb(c);
    await db.deleteLogbook(id, currentUser.id, currentUser.role);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get('/api/analytics/history', async (c) => {
  const currentUser = c.get('currentUser')!;
  try {
    const db = getDb(c);
    const history = await db.getAllHistory(currentUser.id, currentUser.role);
    return c.json({ success: true, data: history });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// --- NEWSTICKERS ENDPOINTS ---
app.get('/api/newstickers', async (c) => {
  try {
    const db = getDb(c);
    const tickers = await db.getNewsTickers(true); // active only
    return c.json({ success: true, data: tickers });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get('/api/admin/newstickers', async (c) => {
  const currentUser = c.get('currentUser')!;
  if (currentUser.role !== 'admin') {
    return c.json({ success: false, error: 'Akses ditolak. Membutuhkan peran Super Admin.' }, 403);
  }
  try {
    const db = getDb(c);
    const tickers = await db.getNewsTickers(false); // all tickers
    return c.json({ success: true, data: tickers });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/api/admin/newstickers', async (c) => {
  const currentUser = c.get('currentUser')!;
  if (currentUser.role !== 'admin') {
    return c.json({ success: false, error: 'Akses ditolak. Membutuhkan peran Super Admin.' }, 403);
  }
  try {
    const { content, is_active } = await c.req.json();
    if (!content || !content.trim()) {
      return c.json({ success: false, error: 'Teks newsticker wajib diisi' }, 400);
    }
    const db = getDb(c);
    const item = await db.addNewsTicker(content.trim(), is_active !== undefined ? Number(is_active) : 1);
    return c.json({ success: true, data: item });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.put('/api/admin/newstickers/:id', async (c) => {
  const currentUser = c.get('currentUser')!;
  if (currentUser.role !== 'admin') {
    return c.json({ success: false, error: 'Akses ditolak. Membutuhkan peran Super Admin.' }, 403);
  }
  const id = c.req.param('id');
  try {
    const { content, is_active } = await c.req.json();
    if (!content || !content.trim()) {
      return c.json({ success: false, error: 'Teks newsticker wajib diisi' }, 400);
    }
    const db = getDb(c);
    await db.updateNewsTicker(id, content.trim(), Number(is_active));
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.delete('/api/admin/newstickers/:id', async (c) => {
  const currentUser = c.get('currentUser')!;
  if (currentUser.role !== 'admin') {
    return c.json({ success: false, error: 'Akses ditolak. Membutuhkan peran Super Admin.' }, 403);
  }
  const id = c.req.param('id');
  try {
    const db = getDb(c);
    await db.deleteNewsTicker(id);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// --- FEATURED KEYWORDS STATS ENDPOINTS ---
app.get('/api/analytics/featured-keywords-stats', async (c) => {
  try {
    const db = getDb(c);
    const stats = await db.getFeaturedKeywordsStats();
    return c.json({ success: true, data: stats });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get('/api/admin/featured-keywords', async (c) => {
  const currentUser = c.get('currentUser')!;
  if (currentUser.role !== 'admin') {
    return c.json({ success: false, error: 'Akses ditolak. Membutuhkan peran Super Admin.' }, 403);
  }
  try {
    const db = getDb(c);
    const keywords = await db.getFeaturedKeywords(false); // all
    return c.json({ success: true, data: keywords });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/api/admin/featured-keywords', async (c) => {
  const currentUser = c.get('currentUser')!;
  if (currentUser.role !== 'admin') {
    return c.json({ success: false, error: 'Akses ditolak. Membutuhkan peran Super Admin.' }, 403);
  }
  try {
    const { keyword, is_active } = await c.req.json();
    if (!keyword || !keyword.trim()) {
      return c.json({ success: false, error: 'Kata kunci wajib diisi' }, 400);
    }
    const db = getDb(c);
    const item = await db.addFeaturedKeyword(keyword.trim(), is_active !== undefined ? Number(is_active) : 1);
    return c.json({ success: true, data: item });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.put('/api/admin/featured-keywords/:id', async (c) => {
  const currentUser = c.get('currentUser')!;
  if (currentUser.role !== 'admin') {
    return c.json({ success: false, error: 'Akses ditolak. Membutuhkan peran Super Admin.' }, 403);
  }
  const id = c.req.param('id');
  try {
    const { keyword, is_active } = await c.req.json();
    if (!keyword || !keyword.trim()) {
      return c.json({ success: false, error: 'Kata kunci wajib diisi' }, 400);
    }
    const db = getDb(c);
    await db.updateFeaturedKeyword(id, keyword.trim(), Number(is_active));
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.delete('/api/admin/featured-keywords/:id', async (c) => {
  const currentUser = c.get('currentUser')!;
  if (currentUser.role !== 'admin') {
    return c.json({ success: false, error: 'Akses ditolak. Membutuhkan peran Super Admin.' }, 403);
  }
  const id = c.req.param('id');
  try {
    const db = getDb(c);
    await db.deleteFeaturedKeyword(id);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/api/admin/featured-keywords/:id/check', async (c) => {
  const currentUser = c.get('currentUser')!;
  if (currentUser.role !== 'admin') {
    return c.json({ success: false, error: 'Akses ditolak. Membutuhkan peran Super Admin.' }, 403);
  }
  const id = c.req.param('id');
  try {
    const db = getDb(c);
    const keywords = await db.getFeaturedKeywords(false);
    const item = keywords.find(k => k.id === id);
    if (!item) {
      return c.json({ success: false, error: 'Kata kunci unggulan tidak ditemukan' }, 404);
    }

    // 1. Perform live SERP search for top 10 using SerpExplorerEngine
    const explorerEngine = new SerpExplorerEngine(db);
    const serpResult = await explorerEngine.exploreSerp(currentUser.id, item.keyword, 'id', 'id', 10);
    const top10Organic = (serpResult.results || []).slice(0, 10);

    // 2. Fetch all registered projects in DB to match target_url
    const projects = await db.getProjects(currentUser.id, currentUser.role);

    // 3. Highlight matching projects
    let matchedCount = 0;
    const processedTop10 = top10Organic.map((res: any) => {
      const resLink = (res.link || '').toLowerCase();
      
      let matchedProject: any = null;
      for (const p of projects) {
        if (!p.target_url) continue;
        const cleanTarget = p.target_url.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
        const cleanRes = resLink.replace(/^https?:\/\//, '').replace(/\/$/, '');

        if (cleanRes.includes(cleanTarget) || cleanTarget.includes(cleanRes.split('/')[0])) {
          matchedProject = p;
          break;
        }
      }

      if (matchedProject) {
        matchedCount++;
        return {
          position: res.position,
          title: res.title,
          link: res.link,
          displayed_link: res.displayed_link,
          snippet: res.snippet,
          is_our_project: true,
          project_id: matchedProject.id,
          project_name: matchedProject.name,
          target_url: matchedProject.target_url
        };
      } else {
        return {
          position: res.position,
          title: res.title,
          link: res.link,
          displayed_link: res.displayed_link,
          snippet: res.snippet,
          is_our_project: false
        };
      }
    });

    // 4. Save results to DB
    const serpJson = JSON.stringify(processedTop10);
    await db.updateFeaturedKeywordSerpResult(id, matchedCount, serpJson);

    return c.json({ 
      success: true, 
      data: {
        id,
        keyword: item.keyword,
        is_active: item.is_active,
        last_checked_at: new Date().toISOString(),
        top10Count: matchedCount,
        totalResults: processedTop10.length,
        percentage: Math.round((matchedCount / (processedTop10.length || 10)) * 100),
        top10Results: processedTop10
      } 
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// --- IMPORT FROM LEGACY NODE ENDPOINT ---
app.post('/api/admin/import-from-legacy', async (c) => {
  const currentUser = c.get('currentUser');
  if (!currentUser || currentUser.role !== 'admin') {
    return c.json({ success: false, error: 'Akses ditolak: Hanya Super Admin yang dapat melakukan impor data legacy' }, 403);
  }

  const legacyUrl = 'https://cekserponline.muhammad-ardyan.workers.dev';
  const legacyToken = 'admin-01';
  const db = getDb(c);
  const resultsSummary = { categories: 0, projects: 0, keywords: 0, newstickers: 0, featured_keywords: 0 };

  try {
    // 1. Import Categories
    const catRes = await fetch(`${legacyUrl}/api/categories`, { headers: { 'Authorization': `Bearer ${legacyToken}` } });
    if (catRes.ok) {
      const catJson: any = await catRes.json();
      if (catJson.success && Array.isArray(catJson.data)) {
        for (const item of catJson.data) {
          await db.replicateData('categories', 'INSERT', item);
          resultsSummary.categories++;
        }
      }
    }

    // 2. Import Projects & Keywords
    const projRes = await fetch(`${legacyUrl}/api/projects`, { headers: { 'Authorization': `Bearer ${legacyToken}` } });
    if (projRes.ok) {
      const projJson: any = await projRes.json();
      if (projJson.success && Array.isArray(projJson.data)) {
        for (const item of projJson.data) {
          const { category_name, user_name, user_email, ...projItem } = item;
          await db.replicateData('projects', 'INSERT', projItem);
          resultsSummary.projects++;

          // Fetch keywords for each project
          const kwRes = await fetch(`${legacyUrl}/api/projects/${item.id}`, { headers: { 'Authorization': `Bearer ${legacyToken}` } });
          if (kwRes.ok) {
            const kwJson: any = await kwRes.json();
            if (kwJson.success && kwJson.data && Array.isArray(kwJson.data.keywords)) {
              for (const kw of kwJson.data.keywords) {
                await db.replicateData('keywords', 'INSERT', {
                  id: kw.id,
                  project_id: item.id,
                  keyword: kw.keyword,
                  created_at: kw.created_at || new Date().toISOString()
                });
                resultsSummary.keywords++;
              }
            }
          }
        }
      }
    }

    // 3. Import News Tickers
    const newsRes = await fetch(`${legacyUrl}/api/admin/newstickers`, { headers: { 'Authorization': `Bearer ${legacyToken}` } });
    if (newsRes.ok) {
      const newsJson: any = await newsRes.json();
      if (newsJson.success && Array.isArray(newsJson.data)) {
        for (const item of newsJson.data) {
          await db.replicateData('newstickers', 'INSERT', item);
          resultsSummary.newstickers++;
        }
      }
    }

    // 4. Import Featured Keywords
    const featRes = await fetch(`${legacyUrl}/api/admin/featured-keywords`, { headers: { 'Authorization': `Bearer ${legacyToken}` } });
    if (featRes.ok) {
      const featJson: any = await featRes.json();
      if (featJson.success && Array.isArray(featJson.data)) {
        for (const item of featJson.data) {
          await db.replicateData('featured_keywords', 'INSERT', item);
          resultsSummary.featured_keywords++;
        }
      }
    }

    return c.json({
      success: true,
      message: 'Impor data dari Server Legacy berhasil disinkronkan!',
      summary: resultsSummary
    });
  } catch (err: any) {
    return c.json({ success: false, error: `Gagal impor dari server legacy: ${err.message}` }, 500);
  }
});

// Serve static frontend assets for Deno Deploy & Cloudflare Workers
app.use('/assets/*', async (c, next) => {
  if (typeof (globalThis as any).Deno !== 'undefined') {
    try {
      const { serveStatic: serveStaticDeno } = await import('hono/deno');
      return await serveStaticDeno({ root: './dist' })(c, next);
    } catch (e) {
      console.error('[Deno Assets Error]', e);
    }
  }
  return await next();
});

app.get('/*', async (c, next) => {
  if (c.req.path.startsWith('/api/')) {
    return await next();
  }
  if (typeof (globalThis as any).Deno !== 'undefined') {
    try {
      const { serveStatic: serveStaticDeno } = await import('hono/deno');
      const handler = serveStaticDeno({ root: './dist', path: 'index.html' });
      return await handler(c, next);
    } catch (e) {
      console.error('[Deno Static Error]', e);
    }
  }
  return await serveStaticCF({ root: './' })(c, next);
});

export default app;
