import { upsert } from '../../lib/store';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body;
    let workers = [];

    if (Array.isArray(body)) workers = body;
    else if (body?.mapped_workers) workers = body.mapped_workers;
    else if (body?.body?.mapped_workers) workers = body.body.mapped_workers;
    else if (typeof body === 'object' && body !== null) workers = [body];

    workers = workers.filter(w => w && !w._error && typeof w === 'object');
    if (!workers.length) return res.status(400).json({ error: 'No valid worker data' });

    const result = upsert(workers);
    return res.status(200).json({ success: true, received: result.count, total: result.total, synced_at: result.last_sync });
  } catch (e) {
    console.error('[ingest]', e);
    return res.status(500).json({ error: e.message });
  }
}
