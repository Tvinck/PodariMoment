// Серверный Supabase-клиент (service role — только на бэкенде, не отдавать клиенту)
const { createClient } = require('@supabase/supabase-js');

let _client = null;
function getAdminClient() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured');
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

module.exports = { getAdminClient };
