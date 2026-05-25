// POST /api/admin-update { password, id, status?, file_url? } → обновить заказ.
const { getAdminClient } = require('./_lib/supabase');
const { checkAdmin } = require('./_lib/admin');

const ALLOWED_STATUS = ['pending', 'paid', 'processing', 'done', 'refunded', 'failed'];

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
  if (!body.id) { res.status(400).json({ error: 'Не указан заказ' }); return; }

  const patch = {};
  if (body.status !== undefined) {
    if (!ALLOWED_STATUS.includes(body.status)) { res.status(400).json({ error: 'Недопустимый статус' }); return; }
    patch.payment_status = body.status;
  }
  if (body.file_url !== undefined) {
    patch.file_url = body.file_url || null;
    if (body.file_url) patch.payment_status = patch.payment_status || 'done';
  }
  if (body.admin_note !== undefined) patch.admin_note = body.admin_note;
  if (Object.keys(patch).length === 0) { res.status(400).json({ error: 'Нечего обновлять' }); return; }

  try {
    const sb = getAdminClient();
    const { data, error } = await sb.from('orders').update(patch).eq('id', body.id).select().single();
    if (error) throw error;
    res.status(200).json({ order: data });
  } catch (e) {
    res.status(500).json({ error: 'Не удалось обновить заказ' });
  }
};
