// POST /api/payment-callback
// Уведомление от Т-Банк о статусе платежа. Проверяем токен, обновляем заказ.
// Т-Банк ожидает в ответ тело "OK".
const { verifyToken } = require('./_lib/tbank');
const { getAdminClient } = require('./_lib/supabase');

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

// Маппинг статусов Т-Банк → наш payment_status
const STATUS_MAP = {
  CONFIRMED: 'paid',
  AUTHORIZED: 'paid',
  REJECTED: 'failed',
  CANCELED: 'failed',
  DEADLINE_EXPIRED: 'failed',
  REFUNDED: 'failed',
  PARTIAL_REFUNDED: 'failed',
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).send('Method not allowed'); return; }

  const password = process.env.TBANK_PASSWORD;
  if (!password) { res.status(500).send('not configured'); return; }

  let body;
  try { body = await readBody(req); } catch { res.status(400).send('bad request'); return; }

  if (!verifyToken(body, password)) { res.status(403).send('invalid token'); return; }

  const orderId = body.OrderId;
  const mapped = STATUS_MAP[body.Status];
  if (orderId && mapped) {
    try {
      const sb = getAdminClient();
      await sb.from('orders').update({
        payment_status: mapped,
        payment_id: body.PaymentId ? String(body.PaymentId) : undefined,
      }).eq('id', orderId);
    } catch { /* проглатываем — Т-Банк повторит уведомление при не-OK */ }
  }

  res.status(200).send('OK');
};
