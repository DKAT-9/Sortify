"use client";

import { useState } from 'react';
import { bins, demoTime, sortBins } from './data/bins';

function Icon({ name, size = 20 }: { name: 'leaf' | 'grid' | 'bin' | 'search' | 'pin' | 'arrow'; size?: number }) {
  const paths = {
    leaf: <><path d="M20 4c-8-2-16 2-14 9 2 6 11 6 14-9Z"/><path d="M4 21 15 10"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    bin: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/></>,
    search: <><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function waiting(since: string) {
  const minutes = Math.floor((demoTime.getTime() - Date.parse(since)) / 60000);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [building, setBuilding] = useState('All buildings');
  const [filter, setFilter] = useState('All bins');
  const full = bins.filter(bin => bin.fullSince).length;
  const near = bins.filter(bin => !bin.fullSince && bin.fillLevel >= 80).length;
  const visible = sortBins(bins).filter(bin =>
    (building === 'All buildings' || bin.building === building) &&
    (filter === 'All bins' || (filter === 'Full' ? !!bin.fullSince : filter === 'Almost full' ? !bin.fullSince && bin.fillLevel >= 80 : bin.fillLevel < 80)) &&
    `${bin.id} ${bin.building} ${bin.floor} ${bin.description}`.toLowerCase().includes(query.toLowerCase())
  );

  return <div className="app-shell">
    <aside className="sidebar">
      <a href="#" className="brand"><span className="brand-icon"><Icon name="leaf" size={25}/></span>sortify<span className="brand-period">.</span></a>
      <div className="workspace-label">CAMPUS OPERATIONS</div>
      <a className="nav-item active" href="#overview"><Icon name="grid"/> Overview <span className="nav-dot"/></a>
      <div className="sidebar-bottom"><div className="eco-icon"><Icon name="leaf" size={23}/></div><strong>A cleaner campus.<br/>A greener tomorrow.</strong><p>Small actions. Lasting impact.</p><div className="sidebar-rule"/><div className="team"><span className="avatar">FC</span><div><strong>Tufts Faciliies</strong></div></div></div>
    </aside>

    <div className="main-shell">
      <header className="topbar"><span>Workspace <span className="slash">/</span> <strong>Overview</strong></span><span className="demo-pill"><span/> Demo data</span></header>
      <main id="overview">
        <div className="page-heading"><div><div className="eyebrow">A LITTLE CARE GOES A LONG WAY</div><h1>Campus, kept clean<span>.</span></h1><p>Your collection queue. Know what needs attention, and where to go.</p></div><div className="date"><span>DEMO SNAPSHOT</span>November 14, 2026 · 3:30 PM</div></div>

        <section className="stats" aria-label="Bin summary">
          <div className="stat"><div className="stat-top">Total bins <Icon name="bin"/></div><div className="stat-value">{bins.length.toString().padStart(2, '0')}<span>across 3 buildings</span></div><div className="stat-footer">One campus. All in view.</div></div>
          <div className="stat urgent-stat"><div className="stat-top">Ready for collection <span className="tiny-dot red"/></div><div className="stat-value">{full.toString().padStart(2, '0')}<span>full bins</span></div><div className="stat-footer">Oldest waiting for {waiting(bins[0].fullSince!)}</div></div>
          <div className="stat"><div className="stat-top">Almost full <span className="tiny-dot amber"/></div><div className="stat-value">{near.toString().padStart(2, '0')}<span>at 80–99% capacity</span></div><div className="stat-footer">Keep an eye on these next.</div></div>
          <div className="stat"><div className="stat-top">Looking good <span className="tiny-dot green"/></div><div className="stat-value">{(bins.length - full - near).toString().padStart(2, '0')}<span>below 80% capacity</span></div><div className="stat-footer">No collection needed yet.</div></div>
        </section>

        <div className="attention-banner"><span className="alert-symbol">!</span><div><strong>{full} bins need a fresh start.</strong><span> Full bins are listed first, with the longest waiting at the top.</span></div><a href="#bin-list">View collection queue <span>↓</span></a></div>

        <section className="bin-section" id="bin-list" aria-labelledby="bins-heading">
          <div className="section-heading"><div><h2 id="bins-heading">Your bins <span>{bins.length}</span></h2><p>A clear view of every corner of campus.</p></div><span className="sort-label">↕ Priority first · oldest full first</span></div>
          <div className="toolbar"><div className="tabs" aria-label="Filter bins by status">{['All bins', 'Full', 'Almost full', 'Available'].map(tab => <button key={tab} className={filter === tab ? 'selected' : ''} onClick={() => setFilter(tab)} aria-pressed={filter === tab}>{tab}{tab === 'Full' && <span>{full}</span>}</button>)}</div><div className="search-filters"><label className="search"><Icon name="search" size={17}/><input aria-label="Search bins" placeholder="Search bins or locations…" value={query} onChange={e => setQuery(e.target.value)}/></label><select aria-label="Filter by building" value={building} onChange={e => setBuilding(e.target.value)}><option>All buildings</option>{Array.from(new Set(bins.map(bin => bin.building))).map(name => <option key={name}>{name}</option>)}</select></div></div>
          <div className="list-head"><span>BIN & LOCATION</span><span>FILL LEVEL</span><span>STATUS</span><span>COLLECTION PRIORITY</span></div>
          <div className="bin-list">{visible.map(bin => {
            const status = bin.fullSince ? 'full' : bin.fillLevel >= 80 ? 'near' : 'available';
            return <article key={bin.id} className={`bin-row ${status}`}>
              <div className="bin-location"><div className="bin-icon"><Icon name="bin" size={23}/></div><div><div className="bin-title"><h3>{bin.building}</h3><span>Floor {bin.floor}</span></div><p><Icon name="pin" size={13}/>{bin.description}</p><code>{bin.id}</code></div></div>
              <div className="fill"><span className="mobile-label">Fill level</span><strong>{bin.fillLevel}<small>%</small></strong><div className="progress" role="meter" aria-label={`${bin.id} fill level`} aria-valuenow={bin.fillLevel} aria-valuemin={0} aria-valuemax={100}><span style={{width: `${bin.fillLevel}%`}}/></div></div>
              <div><span className={`badge ${status}`}><span/>{status === 'full' ? 'Full · collect now' : status === 'near' ? 'Almost full' : 'Available'}</span></div>
              <div className="priority">{bin.fullSince ? <><strong>Waiting {waiting(bin.fullSince)}</strong><span>Full since {new Date(bin.fullSince).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York'})}</span></> : <span>No action needed</span>}</div>
            </article>;
          })}</div>
          {visible.length === 0 && <div className="empty"><Icon name="search" size={28}/><h3>No matching bins</h3><p>Try another location or clear your filters.</p><button onClick={() => {setQuery(''); setBuilding('All buildings'); setFilter('All bins');}}>Clear filters</button></div>}
          <div className="list-footer"><span>Showing {visible.length} of {bins.length} bins</span><span><span className="tiny-dot green"/> Mock data · live updates coming soon</span></div>
        </section>
        <footer className="page-footer"><span>Sort smarter. Leave a lighter footprint.</span><span>Made for the people who keep campus moving. <Icon name="leaf" size={14}/></span></footer>
      </main>
    </div>
  </div>;
}
