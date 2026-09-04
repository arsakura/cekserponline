import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:cekserp.db'
});

const ENDPOINTS = [
  'https://cekserponline.muhammad-ardyan.workers.dev',
  'https://cs.ratuaspal21.workers.dev'
];
const headers = { 'Authorization': 'Bearer admin-01' };

async function fetchWithRetry(path) {
  for (const base of ENDPOINTS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(base + path, { headers });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return null;
}

async function main() {
  console.log('🚀 Menarik Riwayat Analitik (SERP History) & Posisi Kata Kunci...');

  try { await client.execute('PRAGMA foreign_keys = OFF;'); } catch(e){}

  const json = await fetchWithRetry('/api/analytics/history');
  if (!json || !json.data) {
    console.error('❌ Gagal menarik history dari server remote.');
    return;
  }

  const historyList = json.data || [];
  console.log(`📊 Ditemukan ${historyList.length} data riwayat analitik.`);

  let insertedHistory = 0;
  for (const h of historyList) {
    if (!h.id || !h.keyword_id || !h.project_id) continue;
    await client.execute({
      sql: 'INSERT OR REPLACE INTO serp_history (id, keyword_id, project_id, position, found_url, page_number, api_key_used, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        h.id,
        h.keyword_id,
        h.project_id,
        h.position !== undefined ? h.position : null,
        h.found_url || null,
        h.page_number || null,
        h.api_key_used || null,
        h.checked_at || new Date().toISOString()
      ]
    });
    insertedHistory++;
  }

  console.log(`✅ Berhasil memasukkan ${insertedHistory} riwayat analitik ke tabel 'serp_history'.`);

  // Update keywords table with latest SERP check values
  console.log('🔄 Memperbarui posisi terbaru kata kunci di tabel \'keywords\'...');
  const kwRes = await client.execute('SELECT id FROM keywords');
  const kwIds = kwRes.rows.map(r => r.id);

  let updatedKw = 0;
  for (const kwId of kwIds) {
    const latestHist = await client.execute({
      sql: 'SELECT position, found_url, page_number, checked_at FROM serp_history WHERE keyword_id = ? ORDER BY checked_at DESC LIMIT 1',
      args: [kwId]
    });

    if (latestHist.rows.length > 0) {
      const row = latestHist.rows[0];
      await client.execute({
        sql: 'UPDATE keywords SET latest_position = ?, found_url = ?, page_number = ?, checked_at = ? WHERE id = ?',
        args: [row.position, row.found_url, row.page_number, row.checked_at, kwId]
      });
      updatedKw++;
    }
  }

  console.log(`🎉 SUKSES! ${updatedKw} kata kunci telah memiliki posisi analitik terbaru.`);
}

main().catch(console.error);
