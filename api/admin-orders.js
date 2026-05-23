// POST /api/admin-orders { password } → все заказы (для админки).
// Пароль проверяется на сервере, service-role не покидает бэкенд.
const { getAdminClient } = require('./_lib/supabase');
const { checkAdmin } = require('./_lib/admin');

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  let body;
  try { body = await readBody(req); } catch { res.status(400).json({ error: 'bad request' }); return; }
  if (!checkAdmin(body.password)) { res.status(401).json({ error: 'Неверный пароль' }); return; }

  try {
    const sb = getAdminClient();
    const { data, error } = await sb
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.status(200).json({ orders: data || [] });
  } catch (e) {
    res.status(500).json({ error: 'Не удалось загрузить заказы' });
  }
};
