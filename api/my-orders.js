// POST /api/my-orders { email } → заказы покупателя.
// Service-role используется ТОЛЬКО на сервере (не отдаём ключ клиенту, не
// открываем RLS для anon — персональные данные под 152-ФЗ).
const { getAdminClient } = require('./_lib/supabase');
const { rateLimit } = require('./_rateLimit');

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
  if (!rateLimit(req, { key: 'my-orders', limit: 30 })) { res.status(429).json({ error: 'Слишком много запросов' }); return; }
  let body;
  try { body = await readBody(req); } catch { res.status(400).json({ error: 'bad request' }); return; }
  const email = (body.email || '').trim().toLowerCase();
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { res.status(400).json({ error: 'Некорректный email' }); return; }

  try {
    const sb = getAdminClient();
    const { data, error } = await sb
      .from('orders')
      .select('id,created_at,product,tariff,baby_gender,voice_type,party_date,email,payment_status,file_url')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    res.status(200).json({ orders: data || [] });
  } catch (e) {
    res.status(500).json({ error: 'Не удалось загрузить заказы' });
  }
};
