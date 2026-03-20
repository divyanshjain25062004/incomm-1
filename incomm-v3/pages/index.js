import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';

// ─── COLUMNS ─────────────────────────────────────────────────────────────────
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

// ─── BADGE STYLES ─────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  Active:     { bg: '#E3FCEF', color: '#006644', dot: '#00875A' },
  Terminated: { bg: '#FFEBE6', color: '#BF2600', dot: '#DE350B' },
};
const PLAN_STYLE = {
  HSA:   { bg: '#DEEBFF', color: '#0747A6' },
  FSA:   { bg: '#E3FCEF', color: '#006644' },
  DCFSA: { bg: '#FFF0B3', color: '#172B4D' },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function Empty() {
  return <span style={{ color: '#C1C7D0', fontFamily: 'var(--mono)', fontSize: 13 }}>—</span>;
}

function StatusBadge({ v }) {
  const s = STATUS_STYLE[v];
  if (!s) return <Empty />;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px 2px 6px', borderRadius: 20, background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {v}
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
  return (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: show ? '#172B4D' : '#7A869A', letterSpacing: show ? '0.5px' : '1.5px' }}>
      {show ? v : `•••-••-${String(v).slice(-4)}`}
    </span>
  );
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

// ─── STAT CARD ────────────────────────────────────────────────────────────────
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

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [workers, setWorkers]       = useState([]);
  const [lastSync, setLastSync]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showSSN, setShowSSN]       = useState(false);
  const [search, setSearch]         = useState('');
  const [statusF, setStatusF]       = useState('All');
  const [planF, setPlanF]           = useState('All');
  const [selected, setSelected]     = useState(null);
  const [toast, setToast]           = useState(null);
  const [syncAnim, setSyncAnim]     = useState(false);
  const [liveTime, setLiveTime]     = useState('');
  const prevLen = useRef(0);
  const firstLoad = useRef(true);
  const pollRef = useRef(null);

  // Live clock
  useEffect(() => {
    const tick = () => setLiveTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch(`/api/workers?t=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`${r.status}`);
      const d = await r.json();
      const incoming = Array.isArray(d.workers) ? d.workers : [];

      if (!firstLoad.current && incoming.length > prevLen.current) {
        const diff = incoming.length - prevLen.current;
        setToast({ msg: `${diff} new record${diff > 1 ? 's' : ''} synced`, type: 'success' });
        setSyncAnim(true);
        setTimeout(() => { setToast(null); setSyncAnim(false); }, 3500);
      }

      firstLoad.current = false;
      prevLen.current = incoming.length;
      setWorkers(incoming);
      if (d.last_sync) setLastSync(d.last_sync);
    } catch (e) {
      console.error('[poll]', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling — uses interval ref so it always calls latest fetchData
  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 3000);
    return () => clearInterval(pollRef.current);
  }, [fetchData]);

  const doClear = async () => {
    if (!confirm('Clear all records from the dashboard?')) return;
    await fetch('/api/workers', { method: 'DELETE' });
    setWorkers([]); prevLen.current = 0; setLastSync(null); setSelected(null);
  };

  // Filters
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
  const endpoint = typeof window !== 'undefined' ? `${window.location.origin}/api/ingest` : 'https://your-app.vercel.app/api/ingest';

  return (
    <>
      <Head>
        <title>InComm Benefits Census</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position: 'fixed', top: 72, right: 20, zIndex: 999, background: '#006644', color: 'white', padding: '12px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: 8, animation: 'slideToast 0.25s ease' }}>
          <span style={{ fontSize: 16 }}>✓</span> {toast.msg}
        </div>
      )}

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* ── TOPBAR ── */}
        <header style={{ background: 'var(--navy)', borderBottom: '3px solid var(--orange)', height: 60, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Logo */}
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 14, letterSpacing: '-0.5px', flexShrink: 0 }}>IC</div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>InComm Benefits</div>
              <div style={{ color: '#5B8DB8', fontSize: 10, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase' }}>Census Data Platform</div>
            </div>
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,.1)', margin: '0 4px' }} />
            <div style={{ background: 'rgba(244,130,31,.15)', border: '1px solid rgba(244,130,31,.3)', color: '#F4AC6B', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.3px' }}>
              ⚡ Powered by Refold
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Live clock */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#5B8DB8', fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Current Time</div>
              <div style={{ color: 'white', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500 }}>{liveTime}</div>
            </div>
            {lastSync && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#5B8DB8', fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Last Sync</div>
                <div style={{ color: syncAnim ? '#79F2C0' : '#A8C4E0', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500, transition: 'color 0.5s' }}>
                  {new Date(lastSync).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,214,143,.12)', border: '1px solid rgba(0,214,143,.25)', borderRadius: 20, padding: '4px 10px 4px 8px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00D68F', boxShadow: '0 0 6px #00D68F', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              <span style={{ color: '#00D68F', fontSize: 11, fontWeight: 600 }}>Live</span>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── STATS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
            <Stat label="Total Employees" value={stats.total}  color="#0052CC" icon="👥" sub={`${stats.active} active`} />
            <Stat label="Active Workers"  value={stats.active} color="#006644" icon="✓"  sub={`${stats.total - stats.active} terminated`} />
            <Stat label="HSA Enrolled"    value={stats.hsa}    color="#0747A6" icon="🏦" sub="Health Savings" />
            <Stat label="FSA Enrolled"    value={stats.fsa}    color="#006644" icon="💊" sub="Flex Spending" />
            <Stat label="DCFSA Enrolled"  value={stats.dcfsa}  color="#FF991F" icon="👶" sub="Dependent Care" />
          </div>

          {/* ── TABLE CARD ── */}
          <div style={{ background: 'white', borderRadius: 10, boxShadow: 'var(--shadow)', border: '1px solid var(--g100)', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>

            {/* Toolbar */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--g100)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: '#FAFBFC' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--g400)', fontSize: 14 }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, ID, email, city..."
                  style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 6, border: '1.5px solid var(--g200)', fontSize: 13, outline: 'none', background: 'white', transition: 'border .15s' }}
                  onFocus={e => e.target.style.borderColor = '#0052CC'}
                  onBlur={e => e.target.style.borderColor = 'var(--g200)'}
                />
              </div>

              {/* Filters */}
              {[
                { label: 'Status', val: statusF, set: setStatusF, opts: ['All','Active','Terminated'] },
                { label: 'Plan',   val: planF,   set: setPlanF,   opts: ['All','HSA','FSA','DCFSA']   },
              ].map(f => (
                <select key={f.label} value={f.val} onChange={e => f.set(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: 6, border: '1.5px solid var(--g200)', fontSize: 13, background: 'white', cursor: 'pointer', color: f.val !== 'All' ? '#0052CC' : 'var(--g900)', fontWeight: f.val !== 'All' ? 600 : 400, outline: 'none' }}>
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </select>
              ))}

              <div style={{ width: 1, height: 28, background: 'var(--g200)' }} />

              {/* SSN toggle */}
              <button onClick={() => setShowSSN(s => !s)} style={{
                padding: '7px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                border: `1.5px solid ${showSSN ? '#FF991F' : 'var(--g200)'}`,
                background: showSSN ? '#FFFAE6' : 'white',
                color: showSSN ? '#B45309' : 'var(--g600)',
                fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span>{showSSN ? '🔒' : '👁'}</span>
                <span>{showSSN ? 'Mask SSN' : 'Reveal SSN'}</span>
              </button>

              {/* Refresh */}
              <button onClick={() => fetchData()} style={{
                padding: '7px 14px', borderRadius: 6, fontSize: 12, border: 'none',
                background: 'var(--blue)', color: 'white', cursor: 'pointer', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                ↻ Refresh
              </button>

              {/* Clear */}
              <button onClick={doClear} style={{
                padding: '7px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                border: '1.5px solid #FFBDAD', background: '#FFF5F3', color: 'var(--red)', fontWeight: 500,
              }}>✕ Clear</button>

              <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--g400)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {filtered.length} <span style={{ color: 'var(--g300)' }}>/</span> {workers.length} records
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--navy2)' }}>
                    <th style={{ width: 36, padding: '10px 8px', color: '#5B8DB8', fontSize: 11, textAlign: 'center', position: 'sticky', top: 0 }}>#</th>
                    {COLS.map(c => (
                      <th key={c.key} style={{ padding: '10px 12px', textAlign: 'left', color: '#8DAFC8', fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', minWidth: c.w, whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,.05)', position: 'sticky', top: 0, background: 'var(--navy2)' }}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={COLS.length + 1} style={{ padding: 60, textAlign: 'center' }}>
                      <div style={{ color: 'var(--g400)', fontSize: 14 }}>Loading census data...</div>
                    </td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={COLS.length + 1} style={{ padding: '80px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 40, marginBottom: 14 }}>📋</div>
                      <div style={{ fontWeight: 600, color: 'var(--g700)', fontSize: 15, marginBottom: 6 }}>
                        {workers.length === 0 ? 'Waiting for data from Refold' : 'No matching records'}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--g400)' }}>
                        {workers.length === 0
                          ? 'Run your Refold workflow — data will appear automatically'
                          : 'Clear your search or filters to see all records'}
                      </div>
                    </td></tr>
                  ) : filtered.map((w, i) => {
                    const isSelected = selected === i;
                    return (
                      <tr key={w['Employee ID'] || i} onClick={() => setSelected(isSelected ? null : i)}
                        style={{ background: isSelected ? '#EBF2FF' : i % 2 === 0 ? 'white' : '#FAFBFC', borderBottom: '1px solid #F4F5F7', cursor: 'pointer', outline: isSelected ? '2px solid #0052CC' : 'none', outlineOffset: -2, transition: 'background .1s' }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F0F4FF'; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#FAFBFC'; }}
                      >
                        <td style={{ padding: '8px', textAlign: 'center', color: '#C1C7D0', fontSize: 11, userSelect: 'none' }}>{i + 1}</td>
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

          {/* ── DETAIL PANEL ── */}
          {detailW && (
            <div style={{ background: 'white', borderRadius: 10, boxShadow: 'var(--shadow)', border: '1px solid var(--g100)', overflow: 'hidden' }}>
              <div style={{ background: 'var(--navy)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(244,130,31,.2)', border: '2px solid var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {(detailW['First Name'] || '?')[0]}{(detailW['Last Name'] || '?')[0]}
                  </div>
                  <div>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>{detailW['First Name']} {detailW['Middle Name'] ? detailW['Middle Name'] + ' ' : ''}{detailW['Last Name']}</div>
                    <div style={{ color: '#5B8DB8', fontSize: 11, display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                      <span style={{ fontFamily: 'var(--mono)' }}>ID: {detailW['Employee ID']}</span>
                      {detailW['Work Email'] && <span>· {detailW['Work Email']}</span>}
                      {detailW._synced_at && <span>· Synced {new Date(detailW._synced_at).toLocaleTimeString()}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: 'white', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>✕ Close</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
                {[
                  { title: '👤 Personal',     accent: '#0052CC', fields: [['Employee ID','Employee ID'],['First Name','First Name'],['Last Name','Last Name'],['DOB','Date of Birth'],['SSN','SSN'],['Mobile Phone Number','Mobile'],['Work Email','Work Email']] },
                  { title: '💼 Employment',   accent: '#006644', fields: [['Employment Status','Status'],['Employment Start Date','Start Date'],['Employment Term Date','Term Date']] },
                  { title: '🏠 Home Address', accent: '#5243AA', fields: [['Home Address 1','Address Line 1'],['Home Address 2','Address Line 2'],['City','City'],['State','State'],['Postal Code','ZIP Code']] },
                  { title: '🏥 Benefits',     accent: '#FF991F', fields: [['Benefits Account Type','Plan Type'],['Coverage Tier','Coverage Tier'],['Plan Effective Date','Plan Start'],['Plan Term Date','Plan End'],['Employer Amount','Employer $'],['Employee Amount','Employee $'],['Benefits Amount','Total $']] },
                ].map(sec => (
                  <div key={sec.title} style={{ padding: '18px 20px', borderRight: '1px solid var(--g100)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: sec.accent, borderBottom: `2px solid ${sec.accent}`, paddingBottom: 6, marginBottom: 14 }}>
                      {sec.title}
                    </div>
                    {sec.fields.map(([fk, fl]) => (
                      <div key={fk} style={{ marginBottom: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--g500)', flexShrink: 0 }}>{fl}</span>
                        <span style={{ fontSize: 13, fontWeight: 500, textAlign: 'right' }}>
                          <Cell col={{ key: fk, ...(COLS.find(c => c.key === fk) || {}) }} val={detailW[fk]} showSSN={showSSN} />
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ENDPOINT BANNER ── */}
          <div style={{ background: 'white', border: '1px solid #DEEBFF', borderRadius: 10, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>📡</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0052CC', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Refold POST Endpoint</div>
                <div style={{ fontSize: 11, color: 'var(--g400)' }}>Auto-refreshes every 3s</div>
              </div>
            </div>
            <code onClick={() => navigator.clipboard?.writeText(endpoint)} style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 13, color: '#0747A6', background: '#F4F5F7', padding: '9px 16px', borderRadius: 6, border: '1px solid #DEEBFF', cursor: 'pointer', userSelect: 'all', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title="Click to copy">
              {endpoint}
            </code>
            <button onClick={() => navigator.clipboard?.writeText(endpoint)} style={{ padding: '8px 14px', borderRadius: 6, fontSize: 12, border: '1px solid #DEEBFF', background: '#EBF2FF', color: '#0052CC', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Copy URL
            </button>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes slideToast { from{transform:translateX(12px);opacity:0} to{transform:translateX(0);opacity:1} }
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:#F4F5F7}
        ::-webkit-scrollbar-thumb{background:#C1C7D0;border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:#97A0AF}
        thead th{position:sticky;top:0;z-index:5}
      `}</style>
    </>
  );
}
