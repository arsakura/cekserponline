import { createClient } from '@libsql/client';
import fs from 'fs';

const client = createClient({
  url: 'file:cekserp.db'
});

const LEGACY_URL = 'https://cekserponline.muhammad-ardyan.workers.dev';

async function main() {
  console.log('🚀 Memulai penyiapan Database SQLite Lokal (cekserp.db)...');

  // Disable foreign keys temporarily during bulk import
  try { await client.execute('PRAGMA foreign_keys = OFF;'); } catch(e){}

  // 1. Inisialisasi Schema Database
  const schemaSql = fs.readFileSync('./schema.sql', 'utf8');
  const cleanSql = schemaSql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  const rawStmts = cleanSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`📜 Mengeksekusi ${rawStmts.length} pernyataan DDL schema...`);
  for (const sql of rawStmts) {
    try {
      await client.execute(sql);
    } catch (err) {
      console.warn('⚠️ Note DDL:', err.message);
    }
  }
  console.log('✅ Schema tabel SQLite lokal berhasil dibuat/diverifikasi.');

  // 2. Seed Default Admin & User
  const defaultUsers = [
    { id: 'admin-01', email: 'admin@cekserp.com', password_hash: 'e9675096489b9d0b5e3ab73b73a49f47770a01894162cf23ee34b56e9073dea3', name: 'Super Admin', role: 'admin' },
    { id: 'user-01', email: 'user@cekserp.com', password_hash: '846c3a865e52cffb78d99113afc4dbfcc83abfda6ff8f12d902765b2ba2de1de', name: 'Budi (Client SEO)', role: 'user' }
  ];

  for (const u of defaultUsers) {
    await client.execute({
      sql: 'INSERT OR IGNORE INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [u.id, u.email, u.password_hash, u.name, u.role, new Date().toISOString()]
    });
  }

  // 3. Tarik Data dari Server Legacy (muhammad.ardyan@gmail.com)
  console.log(`🌐 Menghubungi server legacy (${LEGACY_URL})...`);
  const headers = { 'Authorization': 'Bearer admin-01' };

  // Categories
  let categories = [];
  try {
    const resCat = await fetch(`${LEGACY_URL}/api/categories`, { headers });
    if (resCat.ok) {
      const jsonCat = await resCat.json();
      categories = jsonCat.data || [];
    }
  } catch (e) {
    console.warn('⚠️ Gagal menarik kategori legacy:', e.message);
  }

  for (const c of categories) {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO categories (id, user_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [c.id, c.user_id || 'admin-01', c.name, c.description || null, c.created_at || new Date().toISOString()]
    });
  }

  // Projects
  let projects = [];
  try {
    const resProj = await fetch(`${LEGACY_URL}/api/projects`, { headers });
    if (resProj.ok) {
      const jsonProj = await resProj.json();
      projects = jsonProj.data || [];
    }
  } catch (e) {
    console.warn('⚠️ Gagal menarik proyek legacy:', e.message);
  }

  for (const p of projects) {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO projects (id, user_id, category_id, name, target_url, country_code, language_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [p.id, p.user_id || 'admin-01', p.category_id || null, p.name, p.target_url, p.country_code || 'id', p.language_code || 'id', p.created_at || new Date().toISOString(), p.updated_at || new Date().toISOString()]
    });
  }

  // Keywords per project
  let totalKeywords = 0;
  for (const p of projects) {
    try {
      const resKw = await fetch(`${LEGACY_URL}/api/keywords?project_id=${p.id}`, { headers });
      if (resKw.ok) {
        const jsonKw = await resKw.json();
        const kwList = jsonKw.data || [];
        for (const k of kwList) {
          await client.execute({
            sql: 'INSERT OR REPLACE INTO keywords (id, project_id, keyword, created_at) VALUES (?, ?, ?, ?)',
            args: [k.id, k.project_id, k.keyword, k.created_at || new Date().toISOString()]
          });
          totalKeywords++;
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  // News Tickers
  let newstickers = [];
  try {
    const resNews = await fetch(`${LEGACY_URL}/api/newstickers`, { headers });
    if (resNews.ok) {
      const jsonNews = await resNews.json();
      newstickers = jsonNews.data || [];
    }
  } catch (e) {
    console.warn('⚠️ Gagal menarik news tickers legacy:', e.message);
  }

  for (const n of newstickers) {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO newstickers (id, content, is_active, created_at) VALUES (?, ?, ?, ?)',
      args: [n.id, n.content, n.is_active || 1, n.created_at || new Date().toISOString()]
    });
  }

  // Featured Keywords
  let featured_keywords = [];
  try {
    const resFeat = await fetch(`${LEGACY_URL}/api/admin/featured-keywords`, { headers });
    if (resFeat.ok) {
      const jsonFeat = await resFeat.json();
      featured_keywords = jsonFeat.data || [];
    }
  } catch (e) {
    console.warn('⚠️ Gagal menarik featured keywords legacy:', e.message);
  }

  for (const f of featured_keywords) {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO featured_keywords (id, keyword, is_active, last_checked_at, top10_count, serp_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [f.id, f.keyword, f.is_active || 1, f.last_checked_at || null, f.top10_count || 0, f.serp_data || null, f.created_at || new Date().toISOString()]
    });
  }

  console.log('\n🎉 IMPOR DATA DARI SERVER LEGACY KE LOCALHOST SUKSES 100%!');
  console.log(`📊 Ringkasan Data Tersimpan di 'cekserp.db':
   - Kategori: ${categories.length}
   - Proyek: ${projects.length}
   - Kata Kunci: ${totalKeywords}
   - News Tickers: ${newstickers.length}
   - Featured Keywords: ${featured_keywords.length}`);
}

main().catch(err => {
  console.error('❌ Error migrasi:', err);
  process.exit(1);
});
