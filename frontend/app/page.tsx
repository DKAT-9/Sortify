
"use client";

import { useEffect, useState } from 'react';
import { bins as mockBins, demoBin, demoTime, sortBins } from './data/bins';

function Icon({
  name,
  size = 20,
}: {
  name: "leaf" | "grid" | "bin" | "search" | "pin" | "arrow";
  size?: number;
}) {
  const paths = {
    leaf: (
      <>
        <path d="M20 4c-8-2-16 2-14 9 2 6 11 6 14-9Z" />
        <path d="M4 21 15 10" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    bin: (
      <>
        <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="7" />
        <path d="m16 16 5 5" />
      </>
    ),
    pin: (
      <>
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    arrow: (
      <>
        <path d="M7 17 17 7M7 7h10v10" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function waiting(since: string, now: number = demoTime.getTime()) {
  const minutes = Math.max(0, Math.floor((now - Date.parse(since)) / 60000));
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [building, setBuilding] = useState('All buildings');
  const [filter, setFilter] = useState('All bins');
  const [demo, setDemo] = useState(demoBin);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const bins = [...mockBins, demo];
  const full = bins.filter(bin => bin.status === 'full').length;
  const oldest = sortBins(bins.filter(bin => bin.fullSince)).reduce<string | null>((since, bin) => !since || bin.fullSince! < since ? bin.fullSince : since, null);
  function toggleDemo() {
    const changedAt = Date.now();
    setNow(changedAt);
    setDemo(current => ({ ...current, status: current.status === 'full' ? 'not full' : 'full', fullSince: current.status === 'full' ? null : new Date(changedAt).toISOString() }));
    setFilter('All bins');
    setBuilding('All buildings');
    setQuery('');
  }
  const visible = sortBins(bins).filter(bin =>
    (building === 'All buildings' || bin.building === building) &&
    (filter === 'All bins' || bin.status === filter.toLowerCase()) &&
    `${bin.id} ${bin.name ?? ""} ${bin.building} ${bin.floor} ${bin.description}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href="#" className="brand">
          <span className="brand-icon">
            <Icon name="leaf" size={25} />
          </span>
          sortify<span className="brand-period">.</span>
        </a>

        <div className="workspace-label">CAMPUS OPERATIONS</div>

        <a className="nav-item active" href="#overview">
          <Icon name="grid" /> Overview <span className="nav-dot" />
        </a>

        <div className="sidebar-bottom">
          <div className="eco-icon">
            <Icon name="leaf" size={23} />
          </div>

          <strong>
            A cleaner campus.
            <br />
            A greener tomorrow.
          </strong>

          <p>Small actions. Lasting impact.</p>

          <div className="sidebar-rule" />

          <div className="team">
            <span className="avatar">FC</span>
            <div>
              <strong>Tufts Facilities</strong>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <span>
            Workspace <span className="slash">/</span>{" "}
            <strong>Overview</strong>
          </span>

          <span className="demo-pill">
            <span />
            {connected ? "API connected" : "Connecting to API..."}
          </span>
        </header>

        <main id="overview">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                A LITTLE CARE GOES A LONG WAY
              </div>

              <h1>
                Campus, kept clean<span>.</span>
              </h1>

              <p>
                Your collection queue. Know what needs attention,
                and where to go.
              </p>
            </div>

            <div className="date">
              <span>LAST DASHBOARD REFRESH</span>
              {now === null
                ? "Loading..."
                : new Date(now).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
            </div>
          </div>

        <section className="stats" aria-label="Bin summary">
          <div className="stat"><div className="stat-top">Total bins <Icon name="bin"/></div><div className="stat-value">{bins.length.toString().padStart(2, '0')}<span>across {new Set(bins.map(bin => bin.building)).size} buildings</span></div><div className="stat-footer">One campus. All in view.</div></div>
          <div className="stat urgent-stat"><div className="stat-top">Ready for collection <span className="tiny-dot red"/></div><div className="stat-value">{full.toString().padStart(2, '0')}<span>full bins</span></div><div className="stat-footer">{oldest ? `Oldest waiting for ${waiting(oldest)}` : 'No bins need collection'}</div></div>
        </section>

        <section className="demo-control" aria-label="Demo bin control"><div><strong>Demo bin · TTC, room 208</strong><p>Change this bin’s status to try the collection queue. Waiting time updates automatically while this page is open. Other sample bins stay unchanged.</p></div><button onClick={toggleDemo}>Mark demo bin {demo.status === 'full' ? 'not full' : 'full'}</button><span role="status">Demo bin: {demo.status}</span></section>
        <section className="bin-section" id="bin-list" aria-labelledby="bins-heading">
          <div className="section-heading"><div><h2 id="bins-heading">Your bins <span>{bins.length}</span></h2></div></div>
          <div className="toolbar"><div className="tabs" aria-label="Filter bins by status">{['All bins', 'Full', 'Not full'].map(tab => <button key={tab} className={filter === tab ? 'selected' : ''} onClick={() => setFilter(tab)} aria-pressed={filter === tab}>{tab}{tab === 'Full' && <span>{full}</span>}</button>)}</div><div className="search-filters"><label className="search"><Icon name="search" size={17}/><input aria-label="Search bins" placeholder="Search bins or locations…" value={query} onChange={e => setQuery(e.target.value)}/></label><select aria-label="Filter by building" value={building} onChange={e => setBuilding(e.target.value)}><option>All buildings</option>{Array.from(new Set(bins.map(bin => bin.building))).map(name => <option key={name}>{name}</option>)}</select></div></div>
          <div className="list-head"><span>BIN & LOCATION</span><span>STATUS</span><span>COLLECTION PRIORITY</span></div>
          <div className="bin-list">{visible.map(bin => {
            const status = bin.status === 'full' ? 'full' : 'available';
            return <article key={bin.id} className={`bin-row ${status}`}>
              <div className="bin-location"><div className="bin-icon"><Icon name="bin" size={23}/></div><div><div className="bin-title"><h3>{bin.name ?? bin.building}</h3><span>Floor {bin.floor}</span></div><p><Icon name="pin" size={13}/>{bin.name ? `${bin.building} · ${bin.description}` : bin.description}</p><code>{bin.id}</code></div></div>
              <div><span className={`badge ${status}`}><span/>{status === 'full' ? 'Full' : 'Not full'}</span></div>
              <div className="priority">{bin.fullSince ? <><strong>Waiting {waiting(bin.fullSince, bin.id === demoBin.id ? now ?? Date.parse(bin.fullSince) : demoTime.getTime())}</strong><span>Full since {new Date(bin.fullSince).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York'})}</span></> : <span>No action needed</span>}</div>
            </article>;
          })}</div>
          {visible.length === 0 && <div className="empty"><Icon name="search" size={28}/><h3>No matching bins</h3><p>Try another location or clear your filters.</p><button onClick={() => {setQuery(''); setBuilding('All buildings'); setFilter('All bins');}}>Clear filters</button></div>}
          <div className="list-footer"><span>Showing {visible.length} of {bins.length} bins</span></div></section></main>
          <main> </main>
    </div>
  );
}
