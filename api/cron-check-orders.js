// GET /api/cron-check-orders — Vercel Cron каждые 15 минут.
// Догоняет «зависшие» заказы в статусе processing.
const { getAdminClient } = require('./_lib/supabase');
const { fetchTaskDetail, storeAudioToOrder } = require('./_generateVoice');
const { sendEmail, emailDone, emailFailed } = require('./_sendEmail');

module.exports = async (req, res) => {
  // Vercel Cron шлёт Authorization: Bearer ${CRON_SECRET}, если он задан
  if (process.env.CRON_SECRET) {
    const auth = req.headers['authorization'] || '';
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) { res.status(401).json({ error: 'Unauthorized' }); return; }
  }

  const now = Date.now();
  const FIFTEEN = 15 * 60 * 1000;
  const THIRTY = 30 * 60 * 1000;

  try {
    const sb = getAdminClient();
    const cutoff = new Date(now - FIFTEEN).toISOString();
    const { data: stuck, error } = await sb.from('orders')
      .select('*')
      .eq('payment_status', 'processing')
      .lt('created_at', cutoff)
      .limit(50);
    if (error) throw error;

    const result = { checked: (stuck || []).length, done: 0, failed: 0, pending: 0 };

    for (const order of stuck || []) {
      const ageMs = now - new Date(order.created_at).getTime();
      try {
        if (order.kie_task_id) {
          const { status, audioUrl } = await fetchTaskDetail(order.kie_task_id);
          if (status === 'completed' && audioUrl) {
            const fileUrl = await storeAudioToOrder(order, audioUrl);
            await sendEmail(order.email, emailDone({ ...order, file_url: fileUrl }));
            result.done++; continue;
          }
          if (status === 'failed') {
            await sb.from('orders').update({ payment_status: 'generation_failed', error_log: 'cron: kie failed' }).eq('id', order.id);
            await sendEmail(order.email, emailFailed(order));
            result.failed++; continue;
          }
        }
        // Всё ещё processing и висит дольше 30 минут → помечаем ошибкой
        if (ageMs > THIRTY) {
          await sb.from('orders').update({ payment_status: 'generation_failed', error_log: 'cron: timeout > 30 min' }).eq('id', order.id);
          await sendEmail(order.email, emailFailed(order));
          result.failed++;
        } else {
          result.pending++;
        }
      } catch (e) {
        result.pending++;
      }
    }

    res.status(200).json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e) });
  }
};
