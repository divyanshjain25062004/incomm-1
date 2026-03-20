import { store } from '../../lib/store';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body;
    let workers = [];

    // Handle all possible shapes Refold might send
    if (Array.isArray(body)) {
      workers = body;
    } else if (body?.mapped_workers) {
      workers = body.mapped_workers;
    } else if (body?.body?.mapped_workers) {
      workers = body.body.mapped_workers;
    } else if (typeof body === 'object' && body !== null) {
      workers = [body];
    }

    workers = workers.filter(w => w && !w._error);

    if (workers.length === 0) {
      return res.status(400).json({ error: 'No valid worker data found' });
    }

    // Upsert into store
    let upserted = 0;
    for (const w of workers) {
      const id = w['Employee ID'] || w['employee_id'] || w['Worker_ID'] || String(Date.now());
      store.workers[id] = { ...w, _synced_at: new Date().toISOString() };
      upserted++;
    }
    store.last_sync = new Date().toISOString();

    const total = Object.keys(store.workers).length;

    console.log(`[ingest] +${upserted} workers | total: ${total}`);

    return res.status(200).json({
      success: true,
      received: upserted,
      total_stored: total,
      synced_at: store.last_sync,
    });

  } catch (err) {
    console.error('[ingest] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
