import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';

const COLS = [
  { key: 'Employee ID',           label: 'Emp ID',     w: 80,  mono: true  },
  { key: 'First Name',            label: 'First Name', w: 100             },
  { key: 'Last Name',             label: 'Last Name',  w: 110             },
  { key: 'DOB',                   label: 'DOB',        w: 100, mono: true  },
  { key: 'SSN',                   label: 'SSN',        w: 120, ssn: true   },
  { key: 'Work Email',            label: 'Email',      w: 210             },
  { key: 'Mobile Phone Number',   label: 'Mobile',     w: 140, mono: true  },
  { key: 'Employment Status',     label: 'Status',     w: 90,  badge: 'status' },
  { key: 'Employment Start Date', label: 'Start',      w: 100, mono: true  },
  { key: 'Employment Term Date',  label: 'Term',       w: 100, mono: true  },
  { key: 'Home Address 1',        label: 'Address',    w: 200             },
  { key: 'City',                  label: 'City',       w: 110             },
  { key: 'State',                 label: 'ST',         w: 46,  mono: true  },
  { key: 'Postal Code',           label: 'ZIP',        w: 68,  mono: true  },
  { key: 'Benefits Account Type', label: 'Plan',       w: 80,  badge: 'plan' },
  { key: 'Coverage Tier',         label: 'Coverage',   w: 120             },
  { key: 'Plan Effective Date',   label: 'Eff. Date',  w: 100, mono: true  },
  { key: 'Plan Term Date',        label: 'End Date',   w: 100, mono: true  },
  { key: 'Employer Amount',       label: 'Employer $', w: 95,  currency: true },
  { key: 'Employee Amount',       label: 'Employee $', w: 95,  currency: true },
  { key: 'Benefits Amount',       label: 'Total $',    w: 85,  currency: true },
];

const STATUS_STYLE = {
  Active:     { bg: '#E3FCEF', color: '#006644', dot: '#00875A' },
  Terminated: { bg: '#FFEBE6', color: '#BF2600', dot: '#DE350B' },
};
const PLAN_STYLE = {
  HSA:   { bg: '#DEEBFF', color: '#0747A6' },
  FSA:   { bg: '#E3FCEF', color: '#006644' },
  DCFSA: { bg: '#FFF0B3', color: '#172B4D' },
};

function Empty() {
  return <span style={{ color: '#C1C7D0', fontFamily: 'var(--mono)', fontSize: 13 }}>—</span>;
}
function StatusBadge({ v }) {
  const s = STATUS_STYLE[v];
  if (!s) return <Empty />;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px 2px 6px', borderRadius: 20, background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />{v}
    </span>
  );
}
function PlanBadge({ v }) {
  const s = PLAN_STYLE[v];
  if (!s) return <Empty />;
  return <span style={{ padding: '2px 8px', borderRadius: 4, background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, letterSpacing: '0.4px' }}>{v}</span>;
}
function SSNCell({ v, show }) {
  if (!v) return <Empty />;
  return <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: show ? '#172B4D' : '#7A869A', letterSpacing: show ? '0.5px' : '1.5px' }}>{show ? v : `•••-••-${String(v).slice(-4)}`}</span>;
}
function Cell({ col, val, showSSN }) {
  if (val === undefined || val === null || val === '') return <Empty />;
  if (col.ssn) return <SSNCell v={val} show={showSSN} />;
  if (col.badge === 'status') return <StatusBadge v={val} />;
  if (col.badge === 'plan') return val ? <PlanBadge v={val} /> : <Empty />;
  if (col.currency) return <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: Number(val) > 0 ? '#006644' : '#7A869A' }}>${Number(val).toLocaleString()}</span>;
  if (col.mono) return <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{val}</span>;
  if (col.key === 'Work Email') return <span style={{ fontSize: 12, color: '#0052CC', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: col.w - 22 }}>{val}</span>;
  return <span style={{ fontSize: 13 }}>{val}</span>;
}
function Stat({ label, value, color, icon, sub }) {
  return (
    <div style={{ background: 'white', borderRadius: 10, padding: '18px 22px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--g100)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: color, borderRadius: '10px 0 0 10px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--g500)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 34, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--g400)', marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ fontSize: 22, opacity: 0.7 }}>{icon}</div>
      </div>
    </div>
  );
}

function ExtractModal({ onClose, onSuccess }) {
  const [state, setState] = useState('idle');
  const [msg, setMsg] = useState('');
  const [dots, setDots] = useState(0);
  const pollRef = useRef(null);

  useEffect(() => {
    if (state !== 'loading') return;
    const t = setInterval(() => setDots(d => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, [state]);

  const STEPS = ['Connecting to Workday', 'Fetching employee records', 'Applying InComm schema', 'Pushing to dashboard'];
  const [step, setStep] = useState(0);

  const run = async () => {
    setState('loading');
    setStep(0);

    const stepTimer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 4000);

    try {
      const r = await fetch('https://sapis.gocobalt.io/api/v1/workflow/69ba8edebf3b534791ffd2aa/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'tk42aa441c-7f2a-4f76-a08f-3a1f99fc4df0',
          'linked_account_id': 'cobalt_test_user',
          'slug': 'Coba-6128',
          'config_id': 'OPTIONAL',
          'sync_execution': 'false',
        },
        body: JSON.stringify({}),
      });

      clearInterval(stepTimer);

      if (!r.ok) throw new Error(`API returned ${r.status}`);

      setState('success');
      setMsg('Workflow triggered! Watching for data...');

      let attempts = 0;
      const prevTotal = await fetch(`/api/workers?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).then(d => d.total || 0).catch(() => 0);

      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const d = await fetch(`/api/workers?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json());
          if (d.total > prevTotal) {
            clearInterval(pollRef.current);
            setMsg(`✓ ${d.total} records loaded successfully!`);
            setTimeout(() => { onSuccess(); onClose(); }, 1800);
          }
        } catch {}
        if (attempts >= 20) {
          clearInterval(pollRef.current);
          setMsg('Sync triggered. Data will appear in the table shortly.');
          setTimeout(() => { onSuccess(); onClose(); }, 2000);
        }
      }, 3000);

    } catch (e) {
      clearInterval(stepTimer);
      setState('error');
      setMsg(e.message);
    }
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,15,40,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget && state !== 'loading') onClose(); }}>
      <div style={{ background: 'white', borderRadius: 14, width: 440, boxShadow: '0 24px 64px rgba(0,0,0,.28)', overflow: 'hidden', animation: 'modalIn .2s ease' }}>

        {/* Header */}
        <div style={{ background: 'var(--navy)', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(244,130,31,.18)', border: '1px solid rgba(244,130,31,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>⚡</div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Extract from Workday</div>
              <div style={{ color: '#5B8DB8', fontSize: 11 }}>Full employee census sync</div>
            </div>
          </div>
          {state !== 'loading' && (
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,.07)', border: 'none', color: '#8DAFC8', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          )}
        </div>

        <div style={{ padding: '24px 22px 22px' }}>
          {state === 'idle' && (
            <>
              <p style={{ fontSize: 14, color: 'var(--g600)', lineHeight: 1.65, marginBottom: 20 }}>
                Triggers Refold to pull all active employee records from Workday, transform them to InComm's census format, and push the data to this dashboard.
              </p>
              <div style={{ background: '#F4F5F7', borderRadius: 8, padding: '14px 16px', marginBottom: 22 }}>
                {[['📥','Source','Workday — Get Workers API'],['⚙️','Transform','Custom Code → InComm schema'],['📤','Output','This dashboard (live update)']].map(([ico, lbl, val]) => (
                  <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 15 }}>{ico}</span>
                    <span style={{ fontSize: 11, color: 'var(--g400)', width: 68, flexShrink: 0 }}>{lbl}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--g700)' }}>{val}</span>
                  </div>
                ))}
              </div>
              <button onClick={run} style={{ width: '100%', padding: '13px', borderRadius: 8, border: 'none', background: 'var(--navy)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--sans)', letterSpacing: '0.2px' }}>
                ⚡ Start Extraction
              </button>
            </>
          )}

          {state === 'loading' && (
            <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid #DEEBFF', borderTop: '3px solid #0052CC', margin: '0 auto 22px', animation: 'spin .85s linear infinite' }} />
              <div style={{ fontWeight: 700, color: 'var(--g900)', fontSize: 15, marginBottom: 8 }}>Extracting Data{'.'.repeat(dots + 1)}</div>

              {/* Steps */}
              <div style={{ margin: '18px 0', textAlign: 'left' }}>
                {STEPS.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < STEPS.length - 1 ? '1px solid #F4F5F7' : 'none' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                      background: i < step ? '#E3FCEF' : i === step ? '#DEEBFF' : '#F4F5F7',
                      color: i < step ? '#006644' : i === step ? '#0052CC' : '#97A0AF',
                      border: i === step ? '2px solid #0052CC' : '2px solid transparent',
                    }}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: i === step ? 600 : 400, color: i <= step ? 'var(--g800)' : 'var(--g400)' }}>{s}</span>
                    {i === step && <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#0052CC', animation: 'pulse 1s infinite', flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {state === 'success' && (
            <div style={{ textAlign: 'center', padding: '14px 0 8px' }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#E3FCEF', border: '2px solid #00875A', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✓</div>
              <div style={{ fontWeight: 700, color: '#006644', fontSize: 16, marginBottom: 8 }}>Sync Triggered!</div>
              <div style={{ fontSize: 13, color: 'var(--g500)', lineHeight: 1.5 }}>{msg}</div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 6 }}>
                {[0,1,2].map(i => <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#0052CC', display: 'inline-block', animation: `dotPulse 1.2s ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          )}

          {state === 'error' && (
            <div style={{ textAlign: 'center', padding: '14px 0 8px' }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#FFEBE6', border: '2px solid #DE350B', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>!</div>
              <div style={{ fontWeight: 700, color: '#BF2600', fontSize: 16, marginBottom: 8 }}>Sync Failed</div>
              <div style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 20, lineHeight: 1.5 }}>{msg}</div>
              <button onClick={() => setState('idle')} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: 'var(--navy)', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--sans)' }}>Try Again</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [workers, setWorkers]     = useState([]);
  const [lastSync, setLastSync]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showSSN, setShowSSN]     = useState(false);
  const [search, setSearch]       = useState('');
  const [statusF, setStatusF]     = useState('All');
  const [planF, setPlanF]         = useState('All');
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
      const r = await fetch(`/api/workers?t=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`${r.status}`);
      const d = await r.json();
      const incoming = Array.isArray(d.workers) ? d.workers : [];
      if (!firstLoad.current && incoming.length > prevLen.current) {
        const diff = incoming.length - prevLen.current;
        setToast(`${diff} new record${diff > 1 ? 's' : ''} synced`);
        setSyncAnim(true);
        setTimeout(() => { setToast(null); setSyncAnim(false); }, 3500);
      }
      firstLoad.current = false;
      prevLen.current = incoming.length;
      setWorkers(incoming);
      if (d.last_sync) setLastSync(d.last_sync);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 3000);
    return () => clearInterval(t);
  }, [fetchData]);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const doClear = async () => {
    if (!confirm('Clear all records?')) return;
    await fetch('/api/workers', { method: 'DELETE' });
    setWorkers([]); prevLen.current = 0; setLastSync(null); setSelected(null);
  };

  const filtered = workers.filter(w => {
    if (statusF !== 'All' && w['Employment Status'] !== statusF) return false;
    if (planF   !== 'All' && w['Benefits Account Type'] !== planF) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return ['Employee ID','First Name','Last Name','Work Email','City','State','Benefits Account Type','Mobile Phone Number']
      .some(k => w[k] && String(w[k]).toLowerCase().includes(q));
  });

  const stats = {
    total:  workers.length,
    active: workers.filter(w => w['Employment Status'] === 'Active').length,
    hsa:    workers.filter(w => w['Benefits Account Type'] === 'HSA').length,
    fsa:    workers.filter(w => w['Benefits Account Type'] === 'FSA').length,
    dcfsa:  workers.filter(w => w['Benefits Account Type'] === 'DCFSA').length,
  };
  const detailW = selected !== null ? filtered[selected] : null;

  return (
    <>
      <Head><title>InComm Benefits Census</title><meta name="viewport" content="width=device-width,initial-scale=1" /></Head>

      {showModal && <ExtractModal onClose={() => setShowModal(false)} onSuccess={fetchData} />}

      {toast && (
        <div style={{ position: 'fixed', top: 68, right: 20, zIndex: 400, background: '#006644', color: 'white', padding: '12px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: 8, animation: 'slideToast .25s ease' }}>
          ✓ {toast}
        </div>
      )}

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* ── HEADER ── */}
        <header style={{ background: 'var(--navy)', borderBottom: '3px solid var(--orange)', height: 60, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,.35)' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 14 }}>IC</div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>InComm Benefits</div>
              <div style={{ color: '#5B8DB8', fontSize: 10, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase' }}>Census Data Platform</div>
            </div>
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,.1)', margin: '0 4px' }} />

            {/* Hamburger */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button onClick={() => setMenuOpen(o => !o)}
                style={{ background: menuOpen ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 7, padding: '8px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[0,1,2].map(i => <span key={i} style={{ display: 'block', width: 18, height: 2, background: menuOpen ? 'var(--orange)' : '#A8C4E0', borderRadius: 2, transition: 'background .15s' }} />)}
              </button>

              {menuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: 'white', borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,.18)', minWidth: 250, overflow: 'hidden', border: '1px solid var(--g100)', zIndex: 200, animation: 'menuDrop .15s ease' }}>
                  <div style={{ padding: '9px 16px 5px', fontSize: 10, fontWeight: 700, color: 'var(--g400)', letterSpacing: '0.8px', textTransform: 'uppercase', borderBottom: '1px solid var(--g100)' }}>Data Actions</div>

                  <button onClick={() => { setMenuOpen(false); setShowModal(true); }}
                    style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--sans)' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#DEEBFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>⚡</div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--g900)' }}>Extract from Workday</div>
                      <div style={{ fontSize: 11, color: 'var(--g500)', marginTop: 1 }}>Trigger full census sync</div>
                    </div>
                  </button>

                  <div style={{ borderTop: '1px solid var(--g100)' }} />
                  <div style={{ padding: '9px 16px 5px', fontSize: 10, fontWeight: 700, color: 'var(--g400)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Table</div>

                  <button onClick={() => { setMenuOpen(false); doClear(); }}
                    style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--sans)' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FFF5F3'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FFEBE6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>🗑</div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#BF2600' }}>Clear All Records</div>
                      <div style={{ fontSize: 11, color: 'var(--g500)', marginTop: 1 }}>Remove data from dashboard</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right side — settings + account only */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {lastSync && (
              <div style={{ textAlign: 'right', marginRight: 4 }}>
                <div style={{ color: '#5B8DB8', fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Last Sync</div>
                <div style={{ color: syncAnim ? '#79F2C0' : '#A8C4E0', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500, transition: 'color 0.5s' }}>
                  {new Date(lastSync).toLocaleTimeString()}
                </div>
              </div>
            )}
            <button title="Settings" style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}>⚙️</button>
            <button title="Account" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--orange)', border: '2px solid rgba(255,255,255,.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 13 }}>IC</button>
          </div>
        </header>

        <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
            <Stat label="Total Employees" value={stats.total}  color="#0052CC" icon="👥" sub={`${stats.active} active`} />
            <Stat label="Active Workers"  value={stats.active} color="#006644" icon="✓"  sub={`${stats.total - stats.active} terminated`} />
            <Stat label="HSA Enrolled"    value={stats.hsa}    color="#0747A6" icon="🏦" sub="Health Savings" />
            <Stat label="FSA Enrolled"    value={stats.fsa}    color="#006644" icon="💊" sub="Flex Spending" />
            <Stat label="DCFSA Enrolled"  value={stats.dcfsa}  color="#FF991F" icon="👶" sub="Dependent Care" />
          </div>

          {/* Table */}
          <div style={{ background: 'white', borderRadius: 10, boxShadow: 'var(--shadow)', border: '1px solid var(--g100)', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--g100)', display: 'flex', alignItems: 'center', gap: 10, background: '#FAFBFC', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--g400)', fontSize: 14 }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, ID, email, city..."
                  style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 6, border: '1.5px solid var(--g200)', fontSize: 13, outline: 'none', background: 'white' }}
                  onFocus={e => e.target.style.borderColor = '#0052CC'} onBlur={e => e.target.style.borderColor = 'var(--g200)'} />
              </div>
              {[{label:'Status',val:statusF,set:setStatusF,opts:['All','Active','Terminated']},{label:'Plan',val:planF,set:setPlanF,opts:['All','HSA','FSA','DCFSA']}].map(f => (
                <select key={f.label} value={f.val} onChange={e => f.set(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: 6, border: '1.5px solid var(--g200)', fontSize: 13, background: 'white', cursor: 'pointer', color: f.val !== 'All' ? '#0052CC' : 'inherit', fontWeight: f.val !== 'All' ? 600 : 400, outline: 'none' }}>
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </select>
              ))}
              <div style={{ width: 1, height: 28, background: 'var(--g200)' }} />
              <button onClick={() => setShowSSN(s => !s)} style={{ padding: '7px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: `1.5px solid ${showSSN ? '#FF991F' : 'var(--g200)'}`, background: showSSN ? '#FFFAE6' : 'white', color: showSSN ? '#B45309' : 'var(--g600)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                {showSSN ? '🔒 Mask SSN' : '👁 Reveal SSN'}
              </button>
              <button onClick={fetchData} style={{ padding: '7px 14px', borderRadius: 6, fontSize: 12, border: 'none', background: 'var(--blue)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>↻ Refresh</button>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--g400)', fontWeight: 500, whiteSpace: 'nowrap' }}>{filtered.length} / {workers.length} records</span>
            </div>

            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--navy2)' }}>
                    <th style={{ width: 36, padding: '10px 8px', color: '#5B8DB8', fontSize: 11, textAlign: 'center' }}>#</th>
                    {COLS.map(c => (
                      <th key={c.key} style={{ padding: '10px 12px', textAlign: 'left', color: '#8DAFC8', fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', minWidth: c.w, whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,.05)', background: 'var(--navy2)', position: 'sticky', top: 0, zIndex: 5 }}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={COLS.length+1} style={{ padding: 60, textAlign: 'center', color: 'var(--g400)' }}>Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={COLS.length+1} style={{ padding: '70px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                      <div style={{ fontWeight: 600, color: 'var(--g700)', fontSize: 15, marginBottom: 6 }}>{workers.length === 0 ? 'No data yet' : 'No matching records'}</div>
                      <div style={{ fontSize: 13, color: 'var(--g400)', marginBottom: workers.length === 0 ? 18 : 0 }}>
                        {workers.length === 0 ? 'Click ☰ → Extract from Workday to load data' : 'Clear your filters'}
                      </div>
                      {workers.length === 0 && (
                        <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--navy)', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--sans)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          ⚡ Extract from Workday
                        </button>
                      )}
                    </td></tr>
                  ) : filtered.map((w, i) => {
                    const isSel = selected === i;
                    return (
                      <tr key={w['Employee ID']||i} onClick={() => setSelected(isSel ? null : i)}
                        style={{ background: isSel ? '#EBF2FF' : i%2===0 ? 'white' : '#FAFBFC', borderBottom: '1px solid #F4F5F7', cursor: 'pointer', outline: isSel ? '2px solid #0052CC' : 'none', outlineOffset: -2 }}
                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#F0F4FF'; }}
                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = i%2===0?'white':'#FAFBFC'; }}>
                        <td style={{ padding: 8, textAlign: 'center', color: '#C1C7D0', fontSize: 11 }}>{i+1}</td>
                        {COLS.map(c => (
                          <td key={c.key} style={{ padding: '8px 12px', maxWidth: c.w, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderRight: '1px solid #F4F5F7' }}>
                            <Cell col={c} val={w[c.key]} showSSN={showSSN} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          {detailW && (
            <div style={{ background: 'white', borderRadius: 10, boxShadow: 'var(--shadow)', border: '1px solid var(--g100)', overflow: 'hidden' }}>
              <div style={{ background: 'var(--navy)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(244,130,31,.2)', border: '2px solid var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)', fontWeight: 700, fontSize: 14 }}>
                    {(detailW['First Name']||'?')[0]}{(detailW['Last Name']||'?')[0]}
                  </div>
                  <div>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>{detailW['First Name']} {detailW['Last Name']}</div>
                    <div style={{ color: '#5B8DB8', fontSize: 11, display: 'flex', gap: 10 }}>
                      <span style={{ fontFamily: 'var(--mono)' }}>ID: {detailW['Employee ID']}</span>
                      {detailW['Work Email'] && <span>· {detailW['Work Email']}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: 'white', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>✕ Close</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
                {[
                  { title: '👤 Personal',     accent: '#0052CC', fields: [['Employee ID','Employee ID'],['First Name','First Name'],['Last Name','Last Name'],['DOB','Date of Birth'],['SSN','SSN'],['Mobile Phone Number','Mobile'],['Work Email','Work Email']] },
                  { title: '💼 Employment',   accent: '#006644', fields: [['Employment Status','Status'],['Employment Start Date','Start Date'],['Employment Term Date','Term Date']] },
                  { title: '🏠 Address',      accent: '#5243AA', fields: [['Home Address 1','Address Line 1'],['Home Address 2','Address Line 2'],['City','City'],['State','State'],['Postal Code','ZIP']] },
                  { title: '🏥 Benefits',     accent: '#FF991F', fields: [['Benefits Account Type','Plan Type'],['Coverage Tier','Coverage'],['Plan Effective Date','Plan Start'],['Plan Term Date','Plan End'],['Employer Amount','Employer $'],['Employee Amount','Employee $'],['Benefits Amount','Total $']] },
                ].map(sec => (
                  <div key={sec.title} style={{ padding: '18px 20px', borderRight: '1px solid var(--g100)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: sec.accent, borderBottom: `2px solid ${sec.accent}`, paddingBottom: 6, marginBottom: 14 }}>{sec.title}</div>
                    {sec.fields.map(([fk, fl]) => (
                      <div key={fk} style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--g500)', flexShrink: 0 }}>{fl}</span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}><Cell col={{ key: fk, ...(COLS.find(c => c.key === fk) || {}) }} val={detailW[fk]} showSSN={showSSN} /></span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
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
        ::-webkit-scrollbar-track{background:#F4F5F7}
        ::-webkit-scrollbar-thumb{background:#C1C7D0;border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:#97A0AF}
      `}</style>
    </>
  );
}
