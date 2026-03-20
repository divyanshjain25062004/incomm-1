import { store } from '../../lib/store';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'DELETE') {
    store.workers = {};
    store.last_sync = null;
    return res.status(200).json({ success: true });
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const workers = Object.values(store.workers);
  return res.status(200).json({
    workers,
    total: workers.length,
    last_sync: store.last_sync,
  });
}
