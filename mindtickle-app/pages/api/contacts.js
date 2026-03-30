import { getAll, clear } from '../../lib/store';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'DELETE') { clear(); return res.status(200).json({ success: true }); }
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const data = getAll();
  return res.status(200).json({ contacts: data.contacts, total: data.contacts.length, last_sync: data.last_sync });
}
