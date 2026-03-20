import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';

const COLS = [
  { key: 'Employee ID',           label: 'Emp ID',       w: 80  },
  { key: 'First Name',            label: 'First',        w: 90  },
  { key: 'Last Name',             label: 'Last',         w: 110 },
  { key: 'DOB',                   label: 'DOB',          w: 100 },
  { key: 'SSN',                   label: 'SSN',          w: 115 },
  { key: 'Work Email',            label: 'Work Email',   w: 210 },
  { key: 'Mobile Phone Number',   label: 'Mobile',       w: 130 },
  { key: 'Employment Status',     label: 'Status',       w: 95  },
  { key: 'Employment Start Date', label: 'Start Date',   w: 100 },
  { key: 'Employment Term Date',  label: 'Term Date',    w: 100 },
  { key: 'Home Address 1',        label: 'Address 1',    w: 200 },
  { key: 'Home Address 2',        label: 'Address 2',    w: 120 },
  { key: 'City',                  label: 'City',         w: 110 },
  { key: 'State',                 label: 'ST',           w: 50  },
  { key: 'Postal Code',           label: 'ZIP',          w: 70  },
  { key: 'Benefits Account Type', label: 'Benefit',      w: 90  },
  { key: 'Coverage Tier',         label: 'Coverage',     w: 115 },
  { key: 'Plan Effective Date',   label: 'Plan Start',   w: 100 },
  { key: 'Plan Term Date',        label: 'Plan End',     w: 100 },
  { key: 'Employer Amount',       label: 'Employer $',   w: 90  },
  { key: 'Employee Amount',       label: 'Employee $',   w: 90  },
  { key: 'Benefits Amount',       label: 'Total $',      w: 85  },
];

const BENEFIT_STYLE = {
  HSA:   { bg: '#DBEAFE', color: '#1D4ED8', border: '#93C5FD' },
  FSA:   { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
  DCFSA: { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
};
const STATUS_STYLE = {
  Active:     { bg: '#D1FAE5', color: '#065F46' },
  Terminated: { bg: '#FEE2E2', color: '#991B1B' },
};

function Chip({ value, type }) {
  const s = type === 'benefit' ? (BENEFIT_STYLE[value] || {}) : (STATUS_STYLE[value] || {});
  if (!s.bg) return <span style={{ color: '#9CA3AF' }}>—</span>;
  return (
    <span style={{
      display: 'inline-block', padding: '1px 7px', borderRadius: '4px',
      fontSize: '11px', fontWeight: '600', letterSpacing: '0.3px',
      background: s.bg, color: s.color, border: `1px solid ${s.border || s.bg}`,
      whiteSpace: 'nowrap',
    }}>{value}</span>
  );
}

function SSNCell({ value, show }) {
  if (!value) return <span style={{ color: '#D1D5DB' }}>—</span>;
  if (!show) return (
    <span style={{ fontFamily: 'var(--mono)', color: '#9CA3AF', letterSpacing: '1px', fontSize: '11px' }}>
      •••-••-{String(value).slice(-4)}
    </span>
  );
  return <span style={{ fontFamily: 'var(--mono)', fontSize: '12px' }}>{value}</span>;
}

function CellVal({ col, val, showSSN }) {
  if (val === '' || val === null || val === undefined) return <span style={{ color: '#D1D5DB' }}>—</span>;
  if (col.key === 'SSN') return <SSNCell value={val} show={showSSN} />;
  if (col.key === 'Employment Status') return <Chip value={val} type="status" />;
  if (col.key === 'Benefits Account Type') return val ? <Chip value={val} type="benefit" /> : <span style={{ color: '#D1D5DB' }}>—</span>;
  if (['Employer Amount','Employee Amount','Benefits Amount'].includes(col.key))
    return <span style={{ fontFamily: 'var(--mono)', fontSize: '12px' }}>${Number(val).toLocaleString()}</span>;
  if (col.key === 'Work Email')
    return <span style={{ fontSize: '12px', color: '#0057A8' }}>{val}</span>;
  return <span>{val}</span>;
}

export default function Home() {
  const [workers, setWorkers]     = useState([]);
  const [lastSync, setLastSync]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showSSN, setShowSSN]     = useState(false);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('All');
  const [selected, setSelected]   = useState(null);
  const [toast, setToast]         = useState(null);
  const prevCount = useRef(0);
  const isFirstLoad = useRef(true);

  const fetchData = useCallback(async (silent = false) => {
    try {
      const r = await fetch('/api/workers');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      const incoming = Array.isArray(d.workers) ? d.workers : [];

      if (!isFirstLoad.current && incoming.length > prevCount.current) {
        const diff = incoming.length - prevCount.current;
        setToast(`✓ ${diff} new record${diff > 1 ? 's' : ''} received`);
        setTimeout(() => setToast(null), 3500);
      }
      prevCount.current = incoming.length;
      isFirstLoad.current = false;
      setWorkers(incoming);
      if (d.last_sync) setLastSync(d.last_sync);
    } catch (e) {
      console.error('fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(() => fetchData(true), 4000);
    return () => clearInterval(t);
  }, [fetchData]);

  const clearAll = async () => {
    if (!confirm('Clear all records?')) return;
    await fetch('/api/workers', { method: 'DELETE' });
    setWorkers([]); prevCount.current = 0; setLastSync(null); setSelected(null);
  };

  const filtered = workers.filter(w => {
    if (statusFilter !== 'All' && w['Employment Status'] !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return [w['Employee ID'],w['First Name'],w['Last Name'],w['Work Email'],w['City'],w['State'],w['Benefits Account Type']]
      .some(v => v && String(v).toLowerCase().includes(q));
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
      <Head>
        <title>InComm Benefits Census</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#EEF2F8' }}>

        {/* HEADER */}
        <header style={{
          background: 'var(--navy)', borderBottom: '3px solid var(--orange)',
          height: 58, padding: '0 28px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 7, background: 'var(--orange)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, color: 'white', fontSize: 15, letterSpacing: '-0.5px',
            }}>IC</div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>InComm Benefits</div>
              <div style={{ color: '#6B9AC4', fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase' }}>Census Data Platform</div>
            </div>
            <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.12)', margin: '0 6px' }} />
            <span style={{
              fontSize: 11, color: '#8BB4D4', padding: '3px 10px',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4,
              background: 'rgba(255,255,255,0.06)',
            }}>Powered by Refold</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {lastSync && (
              <div style={{ textAlign: 'right', fontSize: 11 }}>
                <div style={{ color: '#6B9AC4' }}>Last sync</div>
                <div style={{ color: '#A8C4E0', fontFamily: 'var(--mono)' }}>
                  {new Date(lastSync).toLocaleTimeString()}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }} />
              <span style={{ color: '#6B9AC4', fontSize: 11 }}>Live</span>
            </div>
          </div>
        </header>

        {/* TOAST */}
        {toast && (
          <div style={{
            position: 'fixed', top: 68, right: 20, zIndex: 200,
            background: '#065F46', color: 'white', padding: '10px 18px',
            borderRadius: 8, fontSize: 13, fontWeight: 500,
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            animation: 'fadeSlide 0.3s ease',
          }}>{toast}</div>
        )}

        <div style={{ padding: '22px 28px' }}>

          {/* STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Total Employees', val: stats.total,  accent: '#0057A8', icon: '👥' },
              { label: 'Active',          val: stats.active, accent: '#059669', icon: '✓'  },
              { label: 'HSA Enrolled',    val: stats.hsa,    accent: '#1D4ED8', icon: '🏦' },
              { label: 'FSA Enrolled',    val: stats.fsa,    accent: '#059669', icon: '💊' },
              { label: 'DCFSA Enrolled',  val: stats.dcfsa,  accent: '#D97706', icon: '👶' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'white', borderRadius: 10, padding: '18px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: `4px solid ${s.accent}`,
              }}>
                <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
                  {s.icon} {s.label}
                </div>
                <div style={{ fontSize: 30, fontWeight: 700, color: s.accent, lineHeight: 1 }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* TOOLBAR */}
          <div style={{
            background: 'white', borderRadius: '10px 10px 0 0',
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
            borderBottom: '1px solid #E5E7EB',
          }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, ID, email, city..."
              style={{
                flex: 1, padding: '7px 12px', borderRadius: 6, border: '1.5px solid #E5E7EB',
                fontSize: 13, fontFamily: 'var(--sans)', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#0057A8'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
            <select value={statusFilter} onChange={e => setStatus(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 6, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'var(--sans)', background: 'white', cursor: 'pointer' }}>
              <option>All</option><option>Active</option><option>Terminated</option>
            </select>
            <button onClick={() => setShowSSN(!showSSN)} style={{
              padding: '7px 13px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              border: '1.5px solid #E5E7EB', fontFamily: 'var(--sans)', fontWeight: 500,
              background: showSSN ? '#FFF7ED' : 'white', color: showSSN ? '#C2410C' : '#4B5563',
            }}>{showSSN ? '🔒 Mask SSN' : '👁 Reveal SSN'}</button>
            <button onClick={() => fetchData(true)} style={{
              padding: '7px 14px', borderRadius: 6, fontSize: 12, border: 'none',
              background: '#0057A8', color: 'white', cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 600,
            }}>↻ Refresh</button>
            <button onClick={clearAll} style={{
              padding: '7px 13px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              border: '1.5px solid #FECACA', background: '#FFF5F5', color: '#DC2626', fontFamily: 'var(--sans)',
            }}>Clear</button>
            <span style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
              {filtered.length} / {workers.length} records
            </span>
          </div>

          {/* TABLE */}
          <div style={{ background: 'white', borderRadius: '0 0 10px 10px', boxShadow: '0 2px 6px rgba(0,0,0,0.07)', overflow: 'auto', maxHeight: 'calc(100vh - 340px)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ background: 'var(--navy)' }}>
                  <th style={{ padding: '9px 8px', color: '#6B9AC4', fontSize: 11, minWidth: 36 }}>#</th>
                  {COLS.map(c => (
                    <th key={c.key} style={{
                      padding: '9px 11px', textAlign: 'left', whiteSpace: 'nowrap',
                      color: '#A8C4E0', fontSize: 10, fontWeight: 600, letterSpacing: '0.7px',
                      textTransform: 'uppercase', minWidth: c.w,
                      borderRight: '1px solid rgba(255,255,255,0.05)',
                    }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={COLS.length+1} style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>
                    Loading...
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={COLS.length+1} style={{ padding: 80, textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 14 }}>📋</div>
                    <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                      {workers.length === 0 ? 'Waiting for data from Refold...' : 'No matching records'}
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                      {workers.length === 0
                        ? `POST employee data to /api/ingest`
                        : 'Adjust your search or filter'}
                    </div>
                  </td></tr>
                ) : filtered.map((w, i) => (
                  <tr key={w['Employee ID'] || i}
                    onClick={() => setSelected(selected === i ? null : i)}
                    style={{
                      background: selected === i ? '#EFF6FF' : i % 2 === 0 ? 'white' : '#FAFAFA',
                      borderBottom: '1px solid #F3F4F6', cursor: 'pointer',
                      outline: selected === i ? '2px solid #BFDBFE' : 'none',
                      outlineOffset: -1,
                    }}
                    onMouseEnter={e => { if (selected !== i) e.currentTarget.style.background = '#F5F8FF'; }}
                    onMouseLeave={e => { if (selected !== i) e.currentTarget.style.background = i%2===0?'white':'#FAFAFA'; }}
                  >
                    <td style={{ padding: '8px', textAlign: 'center', color: '#D1D5DB', fontSize: 11 }}>{i+1}</td>
                    {COLS.map(c => (
                      <td key={c.key} style={{
                        padding: '8px 11px', maxWidth: c.w, overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        borderRight: '1px solid #F3F4F6',
                      }}>
                        <CellVal col={c} val={w[c.key]} showSSN={showSSN} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* DETAIL PANEL */}
          {detailW && (
            <div style={{ marginTop: 18, background: 'white', borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.09)', overflow: 'hidden' }}>
              <div style={{ background: 'var(--navy)', padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>
                    {detailW['First Name']} {detailW['Last Name']}
                  </div>
                  <div style={{ color: '#6B9AC4', fontSize: 11, fontFamily: 'var(--mono)' }}>
                    Employee ID: {detailW['Employee ID']}
                    {detailW._synced_at && <span style={{ marginLeft: 16, color: '#4A7A9B' }}>Synced: {new Date(detailW._synced_at).toLocaleTimeString()}</span>}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{
                  background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                  padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                }}>✕</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
                {[
                  { title: 'Personal',    fields: ['DOB','SSN','Mobile Phone Number','Work Email','Middle Name'] },
                  { title: 'Employment',  fields: ['Employment Status','Employment Start Date','Employment Term Date'] },
                  { title: 'Home Address',fields: ['Home Address 1','Home Address 2','City','State','Postal Code'] },
                  { title: 'Benefits',    fields: ['Benefits Account Type','Coverage Tier','Plan Effective Date','Plan Term Date','Employer Amount','Employee Amount','Benefits Amount'] },
                ].map(sec => (
                  <div key={sec.title} style={{ padding: '18px 22px', borderRight: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--orange)', borderBottom: '2px solid var(--orange)', paddingBottom: 5, marginBottom: 14 }}>
                      {sec.title}
                    </div>
                    {sec.fields.map(f => (
                      <div key={f} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{f}</div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>
                          <CellVal col={{ key: f }} val={detailW[f]} showSSN={showSSN} />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ENDPOINT BANNER */}
          <div style={{
            marginTop: 18, background: '#EFF6FF', border: '1px solid #BFDBFE',
            borderRadius: 10, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 600, whiteSpace: 'nowrap' }}>📡 Refold POST Endpoint</div>
            <code style={{
              flex: 1, fontFamily: 'var(--mono)', fontSize: 12, color: '#1E3A5F',
              background: 'white', padding: '8px 14px', borderRadius: 6,
              border: '1px solid #BFDBFE', userSelect: 'all',
            }}>
              {typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app'}/api/ingest
            </code>
            <div style={{ fontSize: 11, color: '#6B7280' }}>Auto-refreshes every 4s</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #F3F4F6; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }
      `}</style>
    </>
  );
}
