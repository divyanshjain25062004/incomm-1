import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';

// ── BUYER ROLE COLORS ─────────────────────────────────────────────────────────
const ROLE_STYLE = {
  'Economic Buyer':  { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', dot: '#F59E0B' },
  'Champion':        { bg: '#EDE9FE', color: '#5B21B6', border: '#C4B5FD', dot: '#7C3AED' },
  'Decision Maker':  { bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD', dot: '#3B82F6' },
  'Influencer':      { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7', dot: '#10B981' },
  'User':            { bg: '#F0FDF4', color: '#166534', border: '#86EFAC', dot: '#22C55E' },
  'Gatekeeper':      { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', dot: '#EF4444' },
  'Unknown':         { bg: '#F1F3F9', color: '#6B748F', border: '#C7CCE0', dot: '#9199B8' },
};

const SENIORITY_STYLE = {
  'C-Suite':               { bg: '#1B2458', color: '#FFFFFF' },
  'SVP / EVP':             { bg: '#2D3A7A', color: '#FFFFFF' },
  'VP Level':              { bg: '#7C3AED', color: '#FFFFFF' },
  'Director':              { bg: '#3B82F6', color: '#FFFFFF' },
  'Manager':               { bg: '#6B748F', color: '#FFFFFF' },
  'Individual Contributor':{ bg: '#E2E5F0', color: '#4B5470' },
};

// ── TABLE COLUMNS ─────────────────────────────────────────────────────────────
const COLS = [
  { key: 'display_name',        label: 'Name',         w: 160 },
  { key: 'job_title',           label: 'Job Title',    w: 160 },
  { key: 'business_unit',       label: 'Department',   w: 130 },
  { key: 'email_address',       label: 'Email',        w: 210, mono: true },
  { key: 'phone_number',        label: 'Phone',        w: 130, mono: true },
  { key: 'buyer_role',          label: 'Buyer Role',   w: 140, badge: 'role' },
  { key: 'seniority_tier',      label: 'Seniority',    w: 160, badge: 'seniority' },
  { key: 'recommended_content', label: 'Content Rec.', w: 220 },
  { key: 'city',                label: 'City',         w: 110 },
  { key: 'country',             label: 'Country',      w: 100 },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name[0].toUpperCase();
}

function avatarColor(name) {
  const colors = ['#7C3AED','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#EC4899'];
  if (!name) return colors[0];
  return colors[name.charCodeAt(0) % colors.length];
}

function Empty() {
  return <span style={{ color: '#C7CCE0', fontSize: 13 }}>—</span>;
}

function RoleBadge({ v }) {
  const s = ROLE_STYLE[v] || ROLE_STYLE['Unknown'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px 2px 6px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />{v}
    </span>
  );
}

function SeniorityBadge({ v }) {
  const s = SENIORITY_STYLE[v] || SENIORITY_STYLE['Individual Contributor'];
  return <span style={{ padding: '2px 8px', borderRadius: 4, background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{v}</span>;
}

function ContentBadge({ v }) {
  if (!v) return <Empty />;
  const parts = v.split(' · ');
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {parts.map(p => (
        <span key={p} style={{ padding: '1px 7px', borderRadius: 4, background: '#EDE9FE', color: '#5B21B6', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>{p}</span>
      ))}
    </div>
  );
}

function Cell({ col, val }) {
  if (val === undefined || val === null || val === '') return <Empty />;
  if (col.badge === 'role') return <RoleBadge v={val} />;
  if (col.badge === 'seniority') return <SeniorityBadge v={val} />;
  if (col.key === 'recommended_content') return <ContentBadge v={val} />;
  if (col.mono) return <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: col.key === 'email_address' ? '#3B82F6' : 'inherit' }}>{val}</span>;
  return <span style={{ fontSize: 13 }}>{val}</span>;
}

function StatCard({ label, value, color, sub, icon }) {
  return (
    <div style={{ background: 'white', borderRadius: 10, padding: '16px 20px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--g100)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: color, borderRadius: '10px 0 0 10px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--g400)', marginTop: 4 }}>{sub}</div>}
        </div>
        <span style={{ fontSize: 20, opacity: 0.6 }}>{icon}</span>
      </div>
    </div>
  );
}

// ── CONTACT CARD (grid view) ──────────────────────────────────────────────────
function ContactCard({ contact, onClick }) {
  const bg = avatarColor(contact.display_name);
  return (
    <div onClick={onClick} style={{ background: 'white', borderRadius: 12, padding: '20px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--g100)', cursor: 'pointer', transition: 'all .15s', display: 'flex', flexDirection: 'column', gap: 12 }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(124,58,237,.15)'; e.currentTarget.style.borderColor = '#C4B5FD'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--g100)'; }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
          {initials(contact.display_name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--g900)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.display_name}</div>
          <div style={{ fontSize: 12, color: 'var(--g500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.job_title || '—'}</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#3B82F6', fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.email_address || '—'}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <RoleBadge v={contact.buyer_role} />
        <SeniorityBadge v={contact.seniority_tier} />
      </div>
      {contact.recommended_content && (
        <div style={{ paddingTop: 8, borderTop: '1px solid var(--g100)' }}>
          <div style={{ fontSize: 10, color: 'var(--g400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 5 }}>Content Recommendation</div>
          <ContentBadge v={contact.recommended_content} />
        </div>
      )}
      <div style={{ fontSize: 11, color: 'var(--g400)', display: 'flex', gap: 4, alignItems: 'center' }}>
        <span>📍</span><span>{[contact.city, contact.country].filter(Boolean).join(', ') || '—'}</span>
      </div>
    </div>
  );
}

// ── EXTRACT MODAL ─────────────────────────────────────────────────────────────
function ExtractModal({ onClose, onSuccess }) {
  const [state, setState] = useState('idle');
  const [msg, setMsg] = useState('');
  const [step, setStep] = useState(0);
  const pollRef = useRef(null);
  const STEPS = ['Connecting to Dynamics 365', 'Fetching CRM contacts', 'Normalizing buyer data', 'Pushing to Mindtickle'];

  const run = async () => {
    setState('loading'); setStep(0);
    const st = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 5000);
    try {
      const r = await fetch('https://sapis.gocobalt.io/api/v1/workflow/69ca23dc6cfe34bc321b2260/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': 'tk42aa441c-7f2a-4f76-a08f-3a1f99fc4df0', 'linked_account_id': 'cobalt_test_user', 'slug': 'ms_dynamics_crm', 'config_id': 'OPTIONAL', 'sync_execution': 'false' },
        body: JSON.stringify({}),
      });
      clearInterval(st);
      if (!r.ok) throw new Error(`API returned ${r.status}`);
      setState('success'); setMsg('Workflow triggered! Waiting for contacts...');
      const prev = await fetch(`/api/contacts?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).then(d => d.total || 0).catch(() => 0);
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const d = await fetch(`/api/contacts?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json());
          if (d.total > prev) { clearInterval(pollRef.current); setMsg(`✓ ${d.total} contacts loaded!`); setTimeout(() => { onSuccess(); onClose(); }, 1500); }
        } catch {}
        if (attempts >= 20) { clearInterval(pollRef.current); setMsg('Sync triggered — data will appear shortly.'); setTimeout(() => { onSuccess(); onClose(); }, 2000); }
      }, 3000);
    } catch (e) { clearInterval(st); setState('error'); setMsg(e.message); }
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,28,71,0.65)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget && state !== 'loading') onClose(); }}>
      <div style={{ background: 'white', borderRadius: 16, width: 440, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,.28)', animation: 'modalIn .2s ease' }}>
        <div style={{ background: 'var(--mt-navy)', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(124,58,237,.25)', border: '1px solid rgba(124,58,237,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Sync from Dynamics 365</div>
              <div style={{ color: '#8B9DC8', fontSize: 11 }}>Pull CRM contacts into Mindtickle</div>
            </div>
          </div>
          {state !== 'loading' && <button onClick={onClose} style={{ background: 'rgba(255,255,255,.08)', border: 'none', color: '#8B9DC8', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>}
        </div>
        <div style={{ padding: '24px 22px 22px' }}>
          {state === 'idle' && (
            <>
              <p style={{ fontSize: 14, color: 'var(--g500)', lineHeight: 1.65, marginBottom: 20 }}>Triggers Refold to fetch all active contacts from Microsoft Dynamics 365, normalize buyer roles and seniority tiers, and push them to this dashboard.</p>
              <div style={{ background: 'var(--g50)', borderRadius: 8, padding: '14px 16px', marginBottom: 22 }}>
                {[['📥', 'Source', 'Microsoft Dynamics 365 CRM'], ['⚙️', 'Transform', 'Buyer Role · Seniority · Content Rec.'], ['📤', 'Output', 'Mindtickle Contact Intelligence']].map(([ico, lbl, val]) => (
                  <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 15 }}>{ico}</span>
                    <span style={{ fontSize: 11, color: 'var(--g400)', width: 72, flexShrink: 0 }}>{lbl}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--g700)' }}>{val}</span>
                  </div>
                ))}
              </div>
              <button onClick={run} style={{ width: '100%', padding: '13px', borderRadius: 9, border: 'none', background: 'var(--mt-purple)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                ⚡ Start Sync
              </button>
            </>
          )}
          {state === 'loading' && (
            <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', border: '3px solid var(--mt-purple-bg)', borderTop: '3px solid var(--mt-purple)', margin: '0 auto 22px', animation: 'spin .85s linear infinite' }} />
              <div style={{ fontWeight: 700, color: 'var(--g900)', fontSize: 15, marginBottom: 18 }}>Syncing Contacts...</div>
              <div style={{ textAlign: 'left' }}>
                {STEPS.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < STEPS.length - 1 ? '1px solid var(--g100)' : 'none' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: i < step ? 'var(--mt-teal-bg)' : i === step ? 'var(--mt-purple-bg)' : 'var(--g100)', color: i < step ? '#065F46' : i === step ? 'var(--mt-purple)' : 'var(--g400)', border: i === step ? '2px solid var(--mt-purple)' : '2px solid transparent' }}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: i === step ? 600 : 400, color: i <= step ? 'var(--g800)' : 'var(--g400)' }}>{s}</span>
                    {i === step && <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: 'var(--mt-purple)', animation: 'pulse 1s infinite', flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
            </div>
          )}
          {state === 'success' && (
            <div style={{ textAlign: 'center', padding: '14px 0 8px' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--mt-teal-bg)', border: '2px solid var(--mt-teal)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✓</div>
              <div style={{ fontWeight: 700, color: '#065F46', fontSize: 15, marginBottom: 8 }}>Sync Triggered!</div>
              <div style={{ fontSize: 13, color: 'var(--g500)', lineHeight: 1.5 }}>{msg}</div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 6 }}>
                {[0, 1, 2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--mt-purple)', display: 'inline-block', animation: `dotPulse 1.2s ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          )}
          {state === 'error' && (
            <div style={{ textAlign: 'center', padding: '14px 0 8px' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FEE2E2', border: '2px solid #EF4444', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>!</div>
              <div style={{ fontWeight: 700, color: '#991B1B', fontSize: 15, marginBottom: 8 }}>Sync Failed</div>
              <div style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 20, lineHeight: 1.5 }}>{msg}</div>
              <button onClick={() => setState('idle')} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: 'var(--mt-purple)', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--sans)' }}>Try Again</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── DETAIL PANEL ──────────────────────────────────────────────────────────────
function DetailPanel({ contact, onClose }) {
  const bg = avatarColor(contact.display_name);
  const sections = [
    { title: '👤 Identity', accent: 'var(--mt-purple)', fields: [['Full Name','display_name'],['First Name','first_name'],['Last Name','last_name'],['Email','email_address'],['Phone','phone_number'],['Mobile','mobile_number']] },
    { title: '🏢 Organization', accent: '#3B82F6', fields: [['Job Title','job_title'],['Department','business_unit'],['CRM Created','crm_created_date'],['Last Synced','last_synced_at']] },
    { title: '📍 Location', accent: '#10B981', fields: [['Street','street_address'],['City','city'],['Region','region'],['Country','country'],['Postal Code','postal_code']] },
    { title: '🎯 Mindtickle Intelligence', accent: 'var(--mt-orange)', fields: [['Buyer Role','buyer_role'],['Seniority Tier','seniority_tier'],['Recommended Content','recommended_content']] },
  ];

  const fmtDate = d => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return d; }
  };

  return (
    <div style={{ background: 'white', borderRadius: 12, boxShadow: 'var(--shadow)', border: '1px solid var(--g100)', overflow: 'hidden' }}>
      <div style={{ background: 'var(--mt-navy)', padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
            {initials(contact.display_name)}
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>{contact.display_name}</div>
            <div style={{ color: '#8B9DC8', fontSize: 11, display: 'flex', gap: 10, marginTop: 2 }}>
              <span>{contact.job_title}</span>
              {contact.business_unit && <><span>·</span><span>{contact.business_unit}</span></>}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: 'white', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>✕ Close</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
        {sections.map(sec => (
          <div key={sec.title} style={{ padding: '18px 20px', borderRight: '1px solid var(--g100)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.9px', textTransform: 'uppercase', color: sec.accent, borderBottom: `2px solid ${sec.accent}`, paddingBottom: 6, marginBottom: 14 }}>{sec.title}</div>
            {sec.fields.map(([label, key]) => {
              const val = contact[key];
              const isDate = key.includes('date') || key.includes('synced');
              const display = isDate ? fmtDate(val) : val;
              return (
                <div key={key} style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--g400)', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, textAlign: 'right' }}>
                    {key === 'buyer_role' ? <RoleBadge v={display} /> :
                     key === 'seniority_tier' ? <SeniorityBadge v={display} /> :
                     key === 'recommended_content' ? <ContentBadge v={display} /> :
                     key === 'email_address' ? <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#3B82F6' }}>{display || '—'}</span> :
                     <span style={{ color: 'var(--g700)' }}>{display || '—'}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [contacts, setContacts]   = useState([]);
  const [lastSync, setLastSync]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState('table'); // 'table' | 'card'
  const [search, setSearch]       = useState('');
  const [roleF, setRoleF]         = useState('All');
  const [senF, setSenF]           = useState('All');
  const [selected, setSelected]   = useState(null);
  const [toast, setToast]         = useState(null);
  const [syncAnim, setSyncAnim]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const prevLen = useRef(0);
  const firstLoad = useRef(true);
  const menuRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch(`/api/contacts?t=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      const inc = Array.isArray(d.contacts) ? d.contacts : [];
      if (!firstLoad.current && inc.length > prevLen.current) {
        const diff = inc.length - prevLen.current;
        setToast(`${diff} new contact${diff > 1 ? 's' : ''} synced`);
        setSyncAnim(true);
        setTimeout(() => { setToast(null); setSyncAnim(false); }, 3500);
      }
      firstLoad.current = false; prevLen.current = inc.length;
      setContacts(inc); if (d.last_sync) setLastSync(d.last_sync);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 3000);
    return () => clearInterval(t);
  }, [fetchData]);

  useEffect(() => {
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const doClear = async () => {
    if (!confirm('Clear all contacts?')) return;
    await fetch('/api/contacts', { method: 'DELETE' });
    setContacts([]); prevLen.current = 0; setLastSync(null); setSelected(null);
  };

  const filtered = contacts.filter(c => {
    if (roleF !== 'All' && c.buyer_role !== roleF) return false;
    if (senF  !== 'All' && c.seniority_tier !== senF) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return ['display_name','email_address','job_title','business_unit','city','country','buyer_role']
      .some(k => c[k] && String(c[k]).toLowerCase().includes(q));
  });

  const roleCount = r => contacts.filter(c => c.buyer_role === r).length;
  const countries = new Set(contacts.map(c => c.country).filter(Boolean)).size;

  const stats = [
    { label: 'Total Contacts', value: contacts.length, color: 'var(--mt-purple)', icon: '👥', sub: `${countries} countries` },
    { label: 'Economic Buyers', value: roleCount('Economic Buyer'), color: '#F59E0B', icon: '💰', sub: 'C-Suite / SVP' },
    { label: 'Champions', value: roleCount('Champion'), color: 'var(--mt-purple)', icon: '🏆', sub: 'VP of Sales / Eng.' },
    { label: 'Decision Makers', value: roleCount('Decision Maker'), color: '#3B82F6', icon: '🎯', sub: 'VP / Director' },
    { label: 'Influencers', value: roleCount('Influencer'), color: '#10B981', icon: '📣', sub: 'Manager / Senior' },
  ];

  const selectedContact = selected !== null ? (view === 'table' ? filtered[selected] : filtered[selected]) : null;

  const ROLES = ['All', 'Economic Buyer', 'Champion', 'Decision Maker', 'Influencer', 'User', 'Gatekeeper'];
  const SENIORITIES = ['All', 'C-Suite', 'SVP / EVP', 'VP Level', 'Director', 'Manager', 'Individual Contributor'];

  return (
    <>
      <Head><title>Mindtickle · CRM Contact Intelligence</title><meta name="viewport" content="width=device-width,initial-scale=1" /></Head>

      {showModal && <ExtractModal onClose={() => setShowModal(false)} onSuccess={fetchData} />}

      {toast && (
        <div style={{ position: 'fixed', top: 68, right: 20, zIndex: 400, background: 'var(--mt-purple)', color: 'white', padding: '12px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: 8, animation: 'slideToast .25s ease' }}>
          ✓ {toast}
        </div>
      )}

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* ── HEADER ── */}
        <header style={{ background: 'var(--mt-navy)', height: 60, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--mt-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
                  <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px' }}>Mindtickle</div>
                <div style={{ color: '#8B9DC8', fontSize: 10, fontWeight: 500, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Contact Intelligence</div>
              </div>
            </div>

            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,.1)', margin: '0 4px' }} />

            {/* Hamburger */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button onClick={() => setMenuOpen(o => !o)}
                style={{ background: menuOpen ? 'rgba(124,58,237,.3)' : 'rgba(255,255,255,.06)', border: `1px solid ${menuOpen ? 'rgba(124,58,237,.5)' : 'rgba(255,255,255,.1)'}`, borderRadius: 7, padding: '8px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, transition: 'all .15s' }}>
                {[0,1,2].map(i => <span key={i} style={{ display: 'block', width: 18, height: 2, background: menuOpen ? '#C4B5FD' : '#A8B8D8', borderRadius: 2 }} />)}
              </button>

              {menuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: 'white', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,.18)', minWidth: 260, overflow: 'hidden', border: '1px solid var(--g100)', zIndex: 200, animation: 'menuDrop .15s ease' }}>
                  <div style={{ padding: '9px 16px 6px', fontSize: 10, fontWeight: 700, color: 'var(--g400)', letterSpacing: '0.8px', textTransform: 'uppercase', borderBottom: '1px solid var(--g100)' }}>Data Actions</div>
                  <button onClick={() => { setMenuOpen(false); setShowModal(true); }}
                    style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--sans)' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--mt-purple-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>⚡</div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--g900)' }}>Sync from Dynamics 365</div>
                      <div style={{ fontSize: 11, color: 'var(--g400)', marginTop: 1 }}>Pull latest CRM contacts</div>
                    </div>
                  </button>
                  <div style={{ borderTop: '1px solid var(--g100)' }} />
                  <div style={{ padding: '9px 16px 6px', fontSize: 10, fontWeight: 700, color: 'var(--g400)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Table</div>
                  <button onClick={() => { setMenuOpen(false); doClear(); }}
                    style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--sans)' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FFF5F5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🗑</div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#991B1B' }}>Clear All Contacts</div>
                      <div style={{ fontSize: 11, color: 'var(--g400)', marginTop: 1 }}>Remove all data from dashboard</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {lastSync && (
              <div style={{ textAlign: 'right', marginRight: 4 }}>
                <div style={{ color: '#8B9DC8', fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Last Sync</div>
                <div style={{ color: syncAnim ? '#00C9A7' : '#A8B8D8', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500, transition: 'color .5s' }}>
                  {new Date(lastSync).toLocaleTimeString()}
                </div>
              </div>
            )}
            <button title="Settings" style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}>⚙️</button>
            <button title="Account" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--mt-purple)', border: '2px solid rgba(255,255,255,.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 13 }}>MT</button>
          </div>
        </header>

        <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
            {stats.map(s => <StatCard key={s.label} {...s} />)}
          </div>

          {/* Toolbar */}
          <div style={{ background: 'white', borderRadius: '10px 10px 0 0', padding: '12px 16px', borderBottom: '1px solid var(--g100)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', boxShadow: 'var(--shadow-sm)' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--g400)', fontSize: 14 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, title, city..."
                style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 6, border: '1.5px solid var(--g200)', fontSize: 13, outline: 'none', background: 'white' }}
                onFocus={e => e.target.style.borderColor = 'var(--mt-purple)'}
                onBlur={e => e.target.style.borderColor = 'var(--g200)'} />
            </div>

            {/* Buyer Role filter */}
            <select value={roleF} onChange={e => { setRoleF(e.target.value); setSelected(null); }}
              style={{ padding: '8px 10px', borderRadius: 6, border: '1.5px solid var(--g200)', fontSize: 13, background: 'white', cursor: 'pointer', color: roleF !== 'All' ? 'var(--mt-purple)' : 'inherit', fontWeight: roleF !== 'All' ? 600 : 400, outline: 'none' }}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>

            {/* Seniority filter */}
            <select value={senF} onChange={e => { setSenF(e.target.value); setSelected(null); }}
              style={{ padding: '8px 10px', borderRadius: 6, border: '1.5px solid var(--g200)', fontSize: 13, background: 'white', cursor: 'pointer', color: senF !== 'All' ? '#3B82F6' : 'inherit', fontWeight: senF !== 'All' ? 600 : 400, outline: 'none' }}>
              {SENIORITIES.map(s => <option key={s}>{s}</option>)}
            </select>

            <div style={{ width: 1, height: 28, background: 'var(--g200)' }} />

            {/* View toggle */}
            <div style={{ display: 'flex', gap: 2, background: 'var(--g100)', borderRadius: 7, padding: 3 }}>
              {[['table','☰ Table'],['card','⊞ Cards']].map(([v,lbl]) => (
                <button key={v} onClick={() => { setView(v); setSelected(null); }}
                  style={{ padding: '5px 12px', borderRadius: 5, border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)', background: view === v ? 'white' : 'transparent', color: view === v ? 'var(--mt-navy)' : 'var(--g500)', boxShadow: view === v ? 'var(--shadow-sm)' : 'none', transition: 'all .15s' }}>
                  {lbl}
                </button>
              ))}
            </div>

            <button onClick={fetchData} style={{ padding: '7px 14px', borderRadius: 6, fontSize: 12, border: 'none', background: 'var(--mt-purple)', color: 'white', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--sans)' }}>↻ Refresh</button>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--g400)', fontWeight: 500, whiteSpace: 'nowrap' }}>{filtered.length} / {contacts.length}</span>
          </div>

          {/* TABLE VIEW */}
          {view === 'table' && (
            <div style={{ background: 'white', borderRadius: '0 0 10px 10px', boxShadow: 'var(--shadow)', border: '1px solid var(--g100)', borderTop: 'none', overflow: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--mt-navy2)' }}>
                    <th style={{ width: 36, padding: '10px 8px', color: '#5B6A8A', fontSize: 11, textAlign: 'center', position: 'sticky', top: 0, background: 'var(--mt-navy2)', zIndex: 5 }}>#</th>
                    {COLS.map(c => (
                      <th key={c.key} style={{ padding: '10px 12px', textAlign: 'left', color: '#8B9DC8', fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', minWidth: c.w, whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,.04)', position: 'sticky', top: 0, background: 'var(--mt-navy2)', zIndex: 5 }}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={COLS.length+1} style={{ padding: 60, textAlign: 'center', color: 'var(--g400)' }}>Loading contacts...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={COLS.length+1} style={{ padding: '70px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
                      <div style={{ fontWeight: 600, color: 'var(--g700)', fontSize: 15, marginBottom: 6 }}>{contacts.length === 0 ? 'No contacts yet' : 'No matching contacts'}</div>
                      <div style={{ fontSize: 13, color: 'var(--g400)', marginBottom: contacts.length === 0 ? 18 : 0 }}>
                        {contacts.length === 0 ? 'Click ☰ → Sync from Dynamics 365 to load contacts' : 'Clear your filters'}
                      </div>
                      {contacts.length === 0 && (
                        <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--mt-purple)', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--sans)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          ⚡ Sync from Dynamics 365
                        </button>
                      )}
                    </td></tr>
                  ) : filtered.map((c, i) => {
                    const isSel = selected === i;
                    return (
                      <tr key={c.mt_contact_id || i} onClick={() => setSelected(isSel ? null : i)}
                        style={{ background: isSel ? '#F5F3FF' : i%2===0 ? 'white' : 'var(--g50)', borderBottom: '1px solid var(--g100)', cursor: 'pointer', outline: isSel ? '2px solid var(--mt-purple)' : 'none', outlineOffset: -2 }}
                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#FAF9FF'; }}
                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = i%2===0 ? 'white' : 'var(--g50)'; }}>
                        <td style={{ padding: 8, textAlign: 'center', color: 'var(--g300)', fontSize: 11 }}>{i+1}</td>
                        {COLS.map(col => (
                          <td key={col.key} style={{ padding: '8px 12px', maxWidth: col.w, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: col.badge || col.key === 'recommended_content' ? 'normal' : 'nowrap', borderRight: '1px solid var(--g100)' }}>
                            <Cell col={col} val={c[col.key]} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* CARD VIEW */}
          {view === 'card' && (
            <div style={{ borderRadius: '0 0 10px 10px', flex: 1 }}>
              {loading ? (
                <div style={{ background: 'white', borderRadius: 10, padding: 60, textAlign: 'center', color: 'var(--g400)', borderTop: 'none' }}>Loading contacts...</div>
              ) : filtered.length === 0 ? (
                <div style={{ background: 'white', borderRadius: 10, padding: '70px 20px', textAlign: 'center', borderTop: 'none' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
                  <div style={{ fontWeight: 600, color: 'var(--g700)', fontSize: 15, marginBottom: 6 }}>{contacts.length === 0 ? 'No contacts yet' : 'No matching contacts'}</div>
                  <div style={{ fontSize: 13, color: 'var(--g400)', marginBottom: contacts.length === 0 ? 18 : 0 }}>
                    {contacts.length === 0 ? 'Click ☰ → Sync from Dynamics 365' : 'Clear your filters'}
                  </div>
                  {contacts.length === 0 && (
                    <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--mt-purple)', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--sans)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      ⚡ Sync from Dynamics 365
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                  {filtered.map((c, i) => <ContactCard key={c.mt_contact_id || i} contact={c} onClick={() => setSelected(selected === i ? null : i)} />)}
                </div>
              )}
            </div>
          )}

          {/* Detail Panel */}
          {selected !== null && selectedContact && (
            <DetailPanel contact={selectedContact} onClose={() => setSelected(null)} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes slideToast{from{transform:translateX(12px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes dotPulse{0%,80%,100%{opacity:.2}40%{opacity:1}}
        @keyframes modalIn{from{transform:scale(.95) translateY(10px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
        @keyframes menuDrop{from{transform:translateY(-6px);opacity:0}to{transform:translateY(0);opacity:1}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:var(--g100)}
        ::-webkit-scrollbar-thumb{background:var(--g300);border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:var(--g400)}
      `}</style>
    </>
  );
}
