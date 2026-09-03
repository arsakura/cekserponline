import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function seed() {
  console.log('🌱 Menanamkan data default...');

  await client.execute({
    sql: 'INSERT OR REPLACE INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: ['admin-01', 'admin@cekserp.com', 'e9675096489b9d0b5e3ab73b73a49f47770a01894162cf23ee34b56e9073dea3', 'Super Admin', 'admin', new Date().toISOString()]
  });

  await client.execute({
    sql: 'INSERT OR REPLACE INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: ['user-01', 'user@cekserp.com', '846c3a865e52cffb78d99113afc4dbfcc83abfda6ff8f12d902765b2ba2de1de', 'Budi (Client SEO)', 'user', new Date().toISOString()]
  });

  await client.execute({
    sql: 'INSERT OR REPLACE INTO categories (id, user_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)',
    args: ['cat-01', 'admin-01', 'General / Utama', 'Kategori bawaan sistem', new Date().toISOString()]
  });

  await client.execute({
    sql: 'INSERT OR REPLACE INTO categories (id, user_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)',
    args: ['cat-02', 'admin-01', 'Klien Agency SEO', 'Proyek optimasi website klien agency', new Date().toISOString()]
  });

  await client.execute({
    sql: 'INSERT OR REPLACE INTO categories (id, user_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)',
    args: ['cat-03', 'user-01', 'E-Commerce Toko Baju', 'Project toko online pribadi', new Date().toISOString()]
  });

  await client.execute({
    sql: 'INSERT OR REPLACE INTO api_keys (id, user_id, api_key, label, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: ['key-admin-01', 'admin-01', 'demo_key_serpapi_admin_1', 'Demo Key Admin Utama', 1, new Date().toISOString()]
  });

  const resUsers = await client.execute('SELECT id, email, name, role FROM users');
  const resCat = await client.execute('SELECT id, name FROM categories');

  console.log('✅ SEEDING TURSO DB SUKSES 100%!');
  console.log('Users:', resUsers.rows);
  console.log('Categories:', resCat.rows);
}

seed().catch(console.error);
