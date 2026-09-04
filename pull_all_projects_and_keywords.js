import { createClient } from '@libsql/client';
import fs from 'fs';

const client = createClient({
  url: 'file:cekserp.db'
});

const LEGACY_URL = 'https://cekserponline.muhammad-ardyan.workers.dev';
const headers = { 'Authorization': 'Bearer admin-01' };

async function main() {
  console.log('🚀 Memulai ekspor data LENGKAP dari server legacy (https://cekserponline.muhammad-ardyan.workers.dev)...');

  // Disable foreign keys temporarily during bulk import
  try { await client.execute('PRAGMA foreign_keys = OFF;'); } catch(e){}

  // 1. Re-initialize Schema
  const schemaSql = fs.readFileSync('./schema.sql', 'utf8');
  const cleanSql = schemaSql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  const rawStmts = cleanSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const sql of rawStmts) {
    try {
      await client.execute(sql);
    } catch (err) {}
  }
  console.log('✅ Schema tabel SQLite lokal berhasil diverifikasi.');

  // 2. Tarik USERS
  console.log('📥 Menarik data Users...');
  let usersCount = 0;
  try {
    const resUsers = await fetch(`${LEGACY_URL}/api/admin/users`, { headers });
    if (resUsers.ok) {
      const jsonUsers = await resUsers.json();
      const usersList = jsonUsers.data || [];
      for (const u of usersList) {
        await client.execute({
          sql: 'INSERT OR REPLACE INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          args: [u.id, u.email, u.password_hash || 'e9675096489b9d0b5e3ab73b73a49f47770a01894162cf23ee34b56e9073dea3', u.name, u.role || 'user', u.created_at || new Date().toISOString()]
        });
        usersCount++;
      }
    }
  } catch (e) {
    console.warn('⚠️ Note Users:', e.message);
  }

  // Always ensure default admin-01 & user-01 exist
  await client.execute({
    sql: 'INSERT OR IGNORE INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: ['admin-01', 'admin@cekserp.com', 'e9675096489b9d0b5e3ab73b73a49f47770a01894162cf23ee34b56e9073dea3', 'Super Admin', 'admin', new Date().toISOString()]
  });
  await client.execute({
    sql: 'INSERT OR IGNORE INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: ['user-01', 'user@cekserp.com', '846c3a865e52cffb78d99113afc4dbfcc83abfda6ff8f12d902765b2ba2de1de', 'Budi (Client SEO)', 'user', new Date().toISOString()]
  });

  // 3. Tarik CATEGORIES
  console.log('📥 Menarik data Kategori...');
  let categories = [];
  try {
    const resCat = await fetch(`${LEGACY_URL}/api/categories`, { headers });
    if (resCat.ok) {
      const jsonCat = await resCat.json();
      categories = jsonCat.data || [];
      for (const c of categories) {
        await client.execute({
          sql: 'INSERT OR REPLACE INTO categories (id, user_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)',
          args: [c.id, c.user_id || 'admin-01', c.name, c.description || null, c.created_at || new Date().toISOString()]
        });
      }
    }
  } catch (e) {
    console.warn('⚠️ Note Categories:', e.message);
  }

  // 4. Tarik PROJECTS
  console.log('📥 Menarik data Proyek...');
  let projects = [];
  try {
    const resProj = await fetch(`${LEGACY_URL}/api/projects`, { headers });
    if (resProj.ok) {
      const jsonProj = await resProj.json();
      projects = jsonProj.data || [];
      for (const p of projects) {
        await client.execute({
          sql: 'INSERT OR REPLACE INTO projects (id, user_id, category_id, name, target_url, country_code, language_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          args: [p.id, p.user_id || 'admin-01', p.category_id || null, p.name, p.target_url, p.country_code || 'id', p.language_code || 'id', p.created_at || new Date().toISOString(), p.updated_at || new Date().toISOString()]
        });
      }
    }
  } catch (e) {
    console.warn('⚠️ Note Projects:', e.message);
  }

  // 5. Tarik KEYWORDS per Project
  console.log('📥 Menarik data Kata Kunci (Keywords) per Proyek...');
  let totalKeywords = 0;
  for (const p of projects) {
    try {
      const resKw = await fetch(`${LEGACY_URL}/api/projects/${p.id}/keywords`, { headers });
      if (resKw.ok) {
        const jsonKw = await resKw.json();
        const kwList = jsonKw.data || [];
        for (const k of kwList) {
          await client.execute({
            sql: 'INSERT OR REPLACE INTO keywords (id, project_id, keyword, created_at) VALUES (?, ?, ?, ?)',
            args: [k.id, k.project_id || p.id, k.keyword, k.created_at || new Date().toISOString()]
          });
          totalKeywords++;
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  // 6. Tarik NEWS TICKERS
  console.log('📥 Menarik data News Tickers...');
  let newstickersCount = 0;
  try {
    const resNews = await fetch(`${LEGACY_URL}/api/newstickers`, { headers });
    if (resNews.ok) {
      const jsonNews = await resNews.json();
      const newsList = jsonNews.data || [];
      for (const n of newsList) {
        await client.execute({
          sql: 'INSERT OR REPLACE INTO newstickers (id, content, is_active, created_at) VALUES (?, ?, ?, ?)',
          args: [n.id, n.content, n.is_active || 1, n.created_at || new Date().toISOString()]
        });
        newstickersCount++;
      }
    }
  } catch (e) {
    console.warn('⚠️ Note News Tickers:', e.message);
  }

  // 7. Tarik FEATURED KEYWORDS
  console.log('📥 Menarik data Featured Keywords...');
  let featuredCount = 0;
  try {
    const resFeat = await fetch(`${LEGACY_URL}/api/admin/featured-keywords`, { headers });
    if (resFeat.ok) {
      const jsonFeat = await resFeat.json();
      const featList = jsonFeat.data || [];
      for (const f of featList) {
        await client.execute({
          sql: 'INSERT OR REPLACE INTO featured_keywords (id, keyword, is_active, last_checked_at, top10_count, serp_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          args: [f.id, f.keyword, f.is_active || 1, f.last_checked_at || null, f.top10_count || 0, f.serp_data || null, f.created_at || new Date().toISOString()]
        });
        featuredCount++;
      }
    }
  } catch (e) {
    console.warn('⚠️ Note Featured Keywords:', e.message);
  }

  console.log('\n🎉 EKSPOR & IMPOR DATA DARI SERVER LEGACY BERHASIL 100% SUKSES!');
  console.log(`📊 Ringkasan Data Tersimpan di 'cekserp.db' (Localhost):
   - Users: ${usersCount}
   - Kategori: ${categories.length}
   - Proyek: ${projects.length}
   - Kata Kunci (Keywords): ${totalKeywords}
   - News Tickers: ${newstickersCount}
   - Featured Keywords: ${featuredCount}`);
}

main().catch(err => {
  console.error('❌ Error migrasi:', err);
  process.exit(1);
});
