import fs from 'fs';
import path from 'path';

const FILE = path.join('/tmp', 'incomm_workers.json');

function read() {
  try {
    if (fs.existsSync(FILE)) {
      return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return { workers: {}, last_sync: null };
}

function write(data) {
  try {
    fs.writeFileSync(FILE, JSON.stringify(data), 'utf8');
  } catch (e) {
    console.error('store write error:', e.message);
  }
}

export function getAll() {
  const d = read();
  return { workers: Object.values(d.workers || {}), last_sync: d.last_sync };
}

export function upsert(workers) {
  const d = read();
  if (!d.workers) d.workers = {};
  let count = 0;
  for (const w of workers) {
    const id = w['Employee ID'] || w['employee_id'] || w['Worker_ID'] || String(Date.now() + count);
    d.workers[id] = { ...w, _synced_at: new Date().toISOString() };
    count++;
  }
  d.last_sync = new Date().toISOString();
  write(d);
  return { count, total: Object.keys(d.workers).length, last_sync: d.last_sync };
}

export function clear() {
  write({ workers: {}, last_sync: null });
}
