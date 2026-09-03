-- Seed data for Cloudflare D1 Database (cekserp-dbi)

INSERT OR IGNORE INTO users (id, email, password_hash, name, role) VALUES 
('admin-01', 'admin@cekserp.com', 'e9675096489b9d0b5e3ab73b73a49f47770a01894162cf23ee34b56e9073dea3', 'Super Admin', 'admin'),
('user-01', 'user@cekserp.com', '846c3a865e52cffb78d99113afc4dbfcc83abfda6ff8f12d902765b2ba2de1de', 'Budi (Client SEO)', 'user');

INSERT OR IGNORE INTO categories (id, user_id, name, description) VALUES
('cat-01', 'admin-01', 'General / Utama', 'Kategori bawaan sistem'),
('cat-02', 'admin-01', 'Klien Agency SEO', 'Proyek optimasi website klien agency'),
('cat-03', 'user-01', 'E-Commerce Toko Baju', 'Project toko online pribadi');

INSERT OR IGNORE INTO api_keys (id, user_id, api_key, label, is_active) VALUES
('key-admin-01', 'admin-01', 'demo_key_serpapi_admin_1', 'Demo Key Admin Utama', 1),
('key-user-01', 'user-01', 'demo_key_serpapi_user_1', 'Demo Key User Budi', 1);

INSERT OR IGNORE INTO projects (id, user_id, category_id, name, target_url, country_code, language_code) VALUES
('proj-01', 'user-01', 'cat-03', 'Toko Online Fashion Budi', 'tokobaguskids.com', 'id', 'id');

INSERT OR IGNORE INTO keywords (id, project_id, keyword) VALUES
('kw-01', 'proj-01', 'baju anak laki laki murah'),
('kw-02', 'proj-01', 'grosir kaos anak branded');
