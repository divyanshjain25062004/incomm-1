import { upsert } from '../../lib/store';
import { transformContact } from '../../lib/transform';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body;
    let raw = [];

    if (Array.isArray(body)) raw = body;
    else if (body?.value && Array.isArray(body.value)) raw = body.value; // raw Dynamics OData
    else if (body?.mapped_contacts) raw = body.mapped_contacts;
    else if (body?.contacts) raw = body.contacts;
    else if (body?.body?.mapped_contacts) raw = body.body.mapped_contacts;
    else if (typeof body === 'object' && body !== null) raw = [body];

    raw = raw.filter(r => r && typeof r === 'object');
    if (!raw.length) return res.status(400).json({ error: 'No valid contact data found' });

    const contacts = raw.map(transformContact);
    const result = upsert(contacts);

    return res.status(200).json({ success: true, received: result.count, total: result.total, synced_at: result.last_sync });
  } catch (e) {
    console.error('[ingest]', e);
    return res.status(500).json({ error: e.message });
  }
}
