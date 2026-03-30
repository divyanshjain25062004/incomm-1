import fs from 'fs';
import path from 'path';

const FILE = path.join('/tmp', 'mt_contacts.json');

function read() {
  try {
    if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {}
  return { contacts: {}, last_sync: null };
}

function write(data) {
  try { fs.writeFileSync(FILE, JSON.stringify(data), 'utf8'); } catch (e) { console.error(e); }
}

export function getAll() {
  const d = read();
  return { contacts: Object.values(d.contacts || {}), last_sync: d.last_sync };
}

export function upsert(contacts) {
  const d = read();
  if (!d.contacts) d.contacts = {};
  let count = 0;
  for (const c of contacts) {
    const id = c.mt_contact_id || c.contactid || String(Date.now() + count);
    d.contacts[id] = { ...c, _synced_at: new Date().toISOString() };
    count++;
  }
  d.last_sync = new Date().toISOString();
  write(d);
  return { count, total: Object.keys(d.contacts).length, last_sync: d.last_sync };
}

export function clear() {
  write({ contacts: {}, last_sync: null });
}
