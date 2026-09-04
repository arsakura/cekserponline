import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:cekserp.db'
});

const LEGACY_URL = 'https://cekserponline.muhammad-ardyan.workers.dev';

// Complete list of 9 Super Admin API keys from Node 2
const ADMIN_KEYS = [
  {
    id: '6172cb2e-506d-4bd2-a423-eab5ad637d32',
    user_id: 'admin-01',
    api_key: '9e659a80d43c1894b1686f15f7d4a3fead031bc741b68a859b22491f840620a7',
    label: 'admin@cekserp.com',
    is_active: 0,
    usage_count: 70,
    last_used_at: '2026-08-29T05:31:06.061Z',
    created_at: '2026-08-13T04:16:14.453Z',
    remaining_quota: 0,
    total_quota: 250,
    quota_updated_at: '2026-09-01T02:52:37.650Z',
    plan_name: 'Free Plan'
  },
  {
    id: 'bc4fb065-7918-4b0c-8cae-5f2da4460e25',
    user_id: 'admin-01',
    api_key: '45bc41c78a686030242d7cecefa60dfd9ec166824a5a5962b992906e64c3ae13',
    label: 'telo kacang',
    is_active: 0,
    usage_count: 13,
    last_used_at: '2026-08-28T07:19:33.910Z',
    created_at: '2026-08-22T02:48:08.222Z',
    remaining_quota: 0,
    total_quota: 250,
    quota_updated_at: '2026-09-01T02:52:37.970Z',
    plan_name: 'Free Plan'
  },
  {
    id: '1de29453-3797-473c-b081-b1a5fbb94149',
    user_id: 'admin-01',
    api_key: '502c4cf422533e34c2b7c56aa528a09acdae63a0303ec46fb3adbf3ffaebbb37',
    label: 'sothe',
    is_active: 0,
    usage_count: 2,
    last_used_at: '2026-08-26T08:33:11.294Z',
    created_at: '2026-08-22T02:48:48.155Z',
    remaining_quota: 250,
    total_quota: 250,
    quota_updated_at: '2026-09-01T02:52:38.288Z',
    plan_name: 'Free Plan'
  },
  {
    id: 'dee912f1-3ee6-435a-8898-596d26ff0f8b',
    user_id: 'admin-01',
    api_key: '3ec6758b07b69c69835f88503412cf6e69ed2f5c70fd1750c88f1808dc57d8b1',
    label: 'kelas pekerja',
    is_active: 0,
    usage_count: 32,
    last_used_at: '2026-08-26T08:33:11.893Z',
    created_at: '2026-08-22T02:49:36.342Z',
    remaining_quota: 0,
    total_quota: 250,
    quota_updated_at: '2026-09-01T02:52:38.615Z',
    plan_name: 'Free Plan'
  },
  {
    id: '4e5b0877-9834-4e4b-9731-40a2322d281d',
    user_id: 'admin-01',
    api_key: 'f16f8fe4be658a5962591e2a7924cddcc16262f850b0b54938d719340b3499a2',
    label: 'pemuda sosialis',
    is_active: 0,
    usage_count: 115,
    last_used_at: '2026-08-31T07:31:11.247Z',
    created_at: '2026-08-22T02:50:19.571Z',
    remaining_quota: 0,
    total_quota: 250,
    quota_updated_at: '2026-09-01T02:52:38.937Z',
    plan_name: 'Free Plan'
  },
  {
    id: '3e9f8079-5bba-43d3-b28c-526d61f44db8',
    user_id: 'admin-01',
    api_key: 'efd3a632b3ca1391580744a37c2022086b3ee88842ebf42f384029f9680d44f8',
    label: 'Barisan Banteng',
    is_active: 1,
    usage_count: 172,
    last_used_at: '2026-09-03T02:34:31.428Z',
    created_at: '2026-08-22T02:50:53.600Z',
    remaining_quota: 173,
    total_quota: 250,
    quota_updated_at: '2026-09-01T02:52:39.265Z',
    plan_name: 'Free Plan'
  },
  {
    id: '234535fa-2930-485a-b705-a32e85215062',
    user_id: 'admin-01',
    api_key: '314f0c615891895b6b40d21e0ad911f744e84c9167794a55b3dc9942020f3b61',
    label: 'Partai Rakyat Demokratik',
    is_active: 1,
    usage_count: 172,
    last_used_at: '2026-09-03T02:34:52.095Z',
    created_at: '2026-08-22T02:51:31.009Z',
    remaining_quota: 171,
    total_quota: 250,
    quota_updated_at: '2026-09-01T02:52:39.595Z',
    plan_name: 'Free Plan'
  },
  {
    id: '7e99c960-d792-4ccd-95fe-83d9992ba562',
    user_id: 'admin-01',
    api_key: 'fa6555acaef31db7ee44d2e20bc9c90ec17aa4f71026cd18e578b8882cf34a8d',
    label: 'Kominteren',
    is_active: 1,
    usage_count: 172,
    last_used_at: '2026-09-03T02:35:25.390Z',
    created_at: '2026-08-22T02:52:27.112Z',
    remaining_quota: 172,
    total_quota: 250,
    quota_updated_at: '2026-09-01T02:52:39.924Z',
    plan_name: 'Free Plan'
  },
  {
    id: 'f3386ae9-e7ef-49cc-bd4b-e54287a0b0ca',
    user_id: 'admin-01',
    api_key: 'fb126bc9153cf93b302ac43747f17fda17cfd3736b7396b27db3d8f907f8e703',
    label: 'Musyawarah Rakyat Banyak',
    is_active: 1,
    usage_count: 172,
    last_used_at: '2026-09-03T02:40:55.199Z',
    created_at: '2026-08-22T02:53:15.008Z',
    remaining_quota: 185,
    total_quota: 250,
    quota_updated_at: '2026-09-01T02:52:40.261Z',
    plan_name: 'Free Plan'
  }
];

async function ensureColumnsExist() {
  const columnsToAdd = [
    { name: 'remaining_quota', type: 'INTEGER' },
    { name: 'total_quota', type: 'INTEGER' },
    { name: 'quota_updated_at', type: 'TEXT' },
    { name: 'plan_name', type: 'TEXT' }
  ];

  for (const col of columnsToAdd) {
    try {
      await client.execute(`ALTER TABLE api_keys ADD COLUMN ${col.name} ${col.type};`);
    } catch (e) {
      // Column probably already exists
    }
  }
}

async function insertKey(key) {
  await client.execute({
    sql: `INSERT OR REPLACE INTO api_keys (id, user_id, api_key, label, is_active, usage_count, last_used_at, remaining_quota, total_quota, quota_updated_at, plan_name, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      key.id,
      key.user_id,
      key.api_key,
      key.label,
      key.is_active !== undefined ? key.is_active : 1,
      key.usage_count || 0,
      key.last_used_at || null,
      key.remaining_quota !== undefined ? key.remaining_quota : 100,
      key.total_quota !== undefined ? key.total_quota : 100,
      key.quota_updated_at || null,
      key.plan_name || 'Free Plan',
      key.created_at || new Date().toISOString()
    ]
  });
}

async function main() {
  await ensureColumnsExist();

  console.log('👑 Inserting Super Admin 9 API Keys...');
  for (const k of ADMIN_KEYS) {
    await insertKey(k);
  }
  console.log('✅ Super Admin 9 API Keys inserted successfully.');

  const usersRes = await client.execute('SELECT id, email, name, role FROM users');
  const users = usersRes.rows;

  for (const user of users) {
    if (user.id === 'admin-01') continue;

    console.log(`\nChecking API Keys for user ${user.name} (${user.id})...`);
    const existingRes = await client.execute({
      sql: 'SELECT * FROM api_keys WHERE user_id = ?',
      args: [user.id]
    });

    const existingCount = existingRes.rows.length;
    console.log(`User ${user.name} currently has ${existingCount} keys.`);

    // If user has fewer than 6 keys, ensure user has 6 active API keys
    const needed = 6 - existingCount;
    if (needed > 0) {
      console.log(`Generating ${needed} additional API keys for ${user.name}...`);
      for (let i = 1; i <= 6; i++) {
        const keyId = `key-${user.id.substring(0, 8)}-${i}`;
        const label = `API Key ${user.name} #${i}`;
        // Pick key from admin key pool or unique key
        const sourceKey = ADMIN_KEYS[(i - 1) % ADMIN_KEYS.length].api_key;
        
        await insertKey({
          id: keyId,
          user_id: user.id,
          api_key: sourceKey,
          label: label,
          is_active: 1,
          usage_count: 0,
          remaining_quota: 250,
          total_quota: 250,
          plan_name: 'Free Plan',
          created_at: new Date().toISOString()
        });
      }
    }
  }

  console.log('\n📊 Final API Keys Breakdown per User:');
  for (const u of users) {
    const keysRes = await client.execute({
      sql: 'SELECT id, label, api_key, is_active FROM api_keys WHERE user_id = ?',
      args: [u.id]
    });
    console.log(`\nUser: ${u.name} (${u.role}) - Total Keys: ${keysRes.rows.length}`);
    for (const k of keysRes.rows) {
      console.log(`   - [${k.is_active ? 'ACTIVE' : 'INACTIVE'}] ${k.label}: ${k.api_key.substring(0, 15)}...`);
    }
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
