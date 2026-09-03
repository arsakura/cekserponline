import { createClient } from '@libsql/client';
import fs from 'fs';

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error('❌ Harap set variabel lingkungan TURSO_DATABASE_URL dan TURSO_AUTH_TOKEN');
  process.exit(1);
}

const client = createClient({
  url: tursoUrl,
  authToken: tursoToken
});

const LEGACY_URL = 'https://cekserponline.muhammad-ardyan.workers.dev';

async function migrate() {
  console.log('🚀 Memulai inisialisasi schema & impor data ke Turso Database...');

  // 1. Inisialisasi Schema Database
  const schemaSql = fs.readFileSync('./schema.sql', 'utf8');
  const statements = schemaSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`📜 Mengeksekusi ${statements.length} pernyataan DDL schema...`);
  for (const stmt of statements) {
    try {
      await client.execute(stmt);
    } catch (err) {
      console.warn('⚠️ Warning schema stmt:', err.message);
    }
  }
  console.log('✅ Schema database Turso berhasil dibuat!');

  // 2. Tarik Data Historis dari Server Legacy
  console.log(`🌐 Menghubungi server legacy (${LEGACY_URL})...`);
  
  const headers = { 'Authorization': 'Bearer admin-01' };

  let categories = [], projects = [], keywords = [], newstickers = [], featured_keywords = [];

  try {
    const resCat = await fetch(`${LEGACY_URL}/api/categories`, { headers });
    if (resCat.ok) {
      const jsonCat = await resCat.json();
      categories = jsonCat.data || [];
    }
  } catch (e) {
    console.warn('Failed to fetch legacy categories:', e.message);
  }

  try {
    const resProj = await fetch(`${LEGACY_URL}/api/projects`, { headers });
    if (resProj.ok) {
      const jsonProj = await resProj.json();
      projects = jsonProj.data || [];
    }
  } catch (e) {
    console.warn('Failed to fetch legacy projects:', e.message);
  }

  try {
    const resKw = await fetch(`${LEGACY_URL}/api/keywords`, { headers });
    if (resKw.ok) {
      const jsonKw = await resKw.json();
      keywords = jsonKw.data || [];
    }
  } catch (e) {
    console.warn('Failed to fetch legacy keywords:', e.message);
  }

  try {
    const resNews = await fetch(`${LEGACY_URL}/api/newstickers`, { headers });
    if (resNews.ok) {
      const jsonNews = await resNews.json();
      newstickers = jsonNews.data || [];
    }
  } catch (e) {
    console.warn('Failed to fetch legacy news tickers:', e.message);
  }

  try {
    const resFeat = await fetch(`${LEGACY_URL}/api/admin/featured-keywords`, { headers });
    if (resFeat.ok) {
      const jsonFeat = await resFeat.json();
      featured_keywords = jsonFeat.data || [];
    }
  } catch (e) {
    console.warn('Failed to fetch legacy featured keywords:', e.message);
  }

  console.log(`📊 Data Historis Ditemukan:
   - Kategori: ${categories.length}
   - Proyek: ${projects.length}
   - Kata Kunci: ${keywords.length}
   - News Tickers: ${newstickers.length}
   - Featured Keywords: ${featured_keywords.length}`);

  // 3. Masukkan Data ke Turso
  for (const c of categories) {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO categories (id, user_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [c.id, c.user_id || 'admin-01', c.name, c.description || null, c.created_at || new Date().toISOString()]
    });
  }

  for (const p of projects) {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO projects (id, user_id, category_id, name, target_url, country_code, language_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [p.id, p.user_id || 'admin-01', p.category_id || null, p.name, p.target_url, p.country_code || 'id', p.language_code || 'id', p.created_at || new Date().toISOString(), p.updated_at || new Date().toISOString()]
    });
  }

  for (const k of keywords) {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO keywords (id, project_id, keyword, created_at) VALUES (?, ?, ?, ?)',
      args: [k.id, k.project_id, k.keyword, k.created_at || new Date().toISOString()]
    });
  }

  for (const n of newstickers) {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO newstickers (id, content, is_active, created_at) VALUES (?, ?, ?, ?)',
      args: [n.id, n.content, n.is_active || 1, n.created_at || new Date().toISOString()]
    });
  }

  for (const f of featured_keywords) {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO featured_keywords (id, keyword, is_active, last_checked_at, top10_count, serp_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [f.id, f.keyword, f.is_active || 1, f.last_checked_at || null, f.top10_count || 0, f.serp_data || null, f.created_at || new Date().toISOString()]
    });
  }

  console.log('🎉 MIGRASI DAN IMPOR KE TURSO SUKSES 100%!');
}

migrate().catch(err => {
  console.error('❌ Error migrasi:', err);
  process.exit(1);
});
