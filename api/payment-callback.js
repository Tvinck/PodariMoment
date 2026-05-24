// POST /api/payment-callback
// Уведомление от Т-Банк о статусе платежа. Проверяем токен, обновляем заказ.
// Т-Банк ожидает в ответ тело "OK".
const { verifyToken } = require('./_lib/tbank');
const { getAdminClient } = require('./_lib/supabase');
const { generateVoice } = require('./_generateVoice');
const { rateLimit } = require('./_rateLimit');
const { sendEmail, emailPaid } = require('./_sendEmail');

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
  if (!rateLimit(req, { key: 'payment-callback', limit: 100 })) { res.status(429).send('Too Many Requests'); return; }

  const password = process.env.TBANK_PASSWORD;
  if (!password) { res.status(500).send('not configured'); return; }

  let body;
  try { body = await readBody(req); } catch { res.status(400).send('bad request'); return; }

  // Верификация подписи Т-Банк
  if (!verifyToken(body, password)) {
    console.warn('[payment-callback] invalid token', { OrderId: body.OrderId, Status: body.Status });
    res.status(400).send('invalid token'); return;
  }

  const orderId = body.OrderId;
  const mapped = STATUS_MAP[body.Status];
  if (orderId && mapped) {
    try {
      const sb = getAdminClient();

      // Идемпотентность: если заказ уже оплачен — не обрабатываем повторно
      const { data: existing } = await sb.from('orders').select('payment_status,file_url').eq('id', orderId).single();
      if (existing && ['paid', 'processing', 'done'].includes(existing.payment_status) && mapped === 'paid') {
        res.status(200).send('OK'); return;
      }

      // 1. Фиксируем оплату: pending → paid (+ paid_at)
      const { data: order } = await sb.from('orders').update({
        payment_status: mapped,
        payment_id: body.PaymentId ? String(body.PaymentId) : undefined,
        paid_at: mapped === 'paid' ? new Date().toISOString() : undefined,
      }).eq('id', orderId).select().single();

      // 2. Если оплачено и файл ещё не сгенерирован — письмо + авто-генерация
      if (mapped === 'paid' && order && !order.file_url) {
        await sendEmail(order.email, emailPaid(order)); // письмо 1

        // CRM: создаём лид на этапе ordered, если по этому email его ещё нет
        try {
          const { data: existing } = await sb.from('crm_leads').select('id').eq('email', order.email).limit(1);
          if (!existing || existing.length === 0) {
            await sb.from('crm_leads').insert({
              email: order.email,
              name: order.parent_names || null,
              source: 'direct',
              stage: 'ordered',
              order_id: order.id,
              ordered_at: new Date().toISOString(),
            });
          }
        } catch { /* CRM не критична для оплаты */ }

        try {
          await generateVoice(order); // внутри выставит статус processing + kie_task_id
        } catch (genErr) {
          await sb.from('orders').update({
            payment_status: 'generation_failed',
            error_log: String(genErr && genErr.message || genErr),
          }).eq('id', orderId);
        }
      }
    } catch { /* проглатываем — Т-Банк повторит уведомление при не-OK */ }
  }

  res.status(200).send('OK');
};
