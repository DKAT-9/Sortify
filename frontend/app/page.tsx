"use client";

import { useEffect, useState } from "react";
import { bins as mockBins, demoBin, sortBins, type Bin } from "./data/bins";

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

function waiting(since: string, now: number) {
  const minutes = Math.max(
    0,
    Math.floor((now - Date.parse(since)) / 60000)
  );

  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    : `${minutes}m`;
}

export default function Home() {
  const [bins, setBins] = useState<Bin[]>([...mockBins, demoBin]);
  const [query, setQuery] = useState("");
  const [building, setBuilding] = useState("All buildings");
  const [filter, setFilter] = useState("All bins");
  const [now, setNow] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchBins() {
      try {
        const response = await fetch("/api/bins", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const updatedBins: Bin[] = await response.json();

        if (active) {
          setBins(updatedBins);
          setConnected(true);
          setLastRefresh(Date.now());
        }
      } catch (error) {
        console.error("Failed to fetch bin updates:", error);

        if (active) {
          setConnected(false);
        }
      }
    }

    fetchBins();

    const interval = setInterval(fetchBins, 2000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const updateTime = () => setNow(Date.now());

    const timeout = setTimeout(updateTime, 0);
    const interval = setInterval(updateTime, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const sortedBins = sortBins(bins);
  const fullBins = bins.filter((bin) => bin.fullSince !== null);
  const full = fullBins.length;

  const buildings = new Set(bins.map((bin) => bin.building));

  const oldestFullBin = bins.filter(bin => bin.fullSince).sort((a, b) => Date.parse(a.fullSince!) - Date.parse(b.fullSince!))[0];
  const liveDemo = bins.find(bin => bin.id === demoBin.id);
  const sensorFresh = !!liveDemo?.lastSeen && now !== null && now - Date.parse(liveDemo.lastSeen) < 15000;

  const visible = sortedBins.filter(
    (bin) =>
      (building === "All buildings" || bin.building === building) &&
      (filter === "All bins" || bin.status === filter.toLowerCase()) &&
      `${bin.id} ${bin.name ?? ""} ${bin.building} ${bin.floor} ${bin.description}`
        .toLowerCase()
        .includes(query.toLowerCase())
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
        </header>

        <main id="overview">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                A LITTLE CARE GOES A LONG WAY
              </div>

            
            </div>
          </div>

          <section className="stats" aria-label="Bin summary">
            <div className="stat">
              <div className="stat-top">
                Total bins <Icon name="bin" />
              </div>

              <div className="stat-value">
                {bins.length.toString().padStart(2, "0")}
                <span>across {buildings.size} buildings</span>
              </div>

              <div className="stat-footer">
                One campus. All in view.
              </div>
            </div>

            <div className="stat urgent-stat">
              <div className="stat-top">
                Ready for collection
                <span className="tiny-dot red" />
              </div>

              <div className="stat-value">
                {full.toString().padStart(2, "0")}
                <span>full bins</span>
              </div>

              <div className="stat-footer">
                {oldestFullBin?.fullSince && now !== null
                  ? `Oldest waiting for ${waiting(
                      oldestFullBin.fullSince,
                      now
                    )}`
                  : "No bins currently need collection."}
              </div>
            </div>

          </section>
          <section
            className="bin-section"
            id="bin-list"
            aria-labelledby="bins-heading"
          >
            <div className="section-heading">
              <div>
                <h2 id="bins-heading">
                  Your bins <span>{bins.length}</span>
                </h2>

                <p>A clear view of every corner of campus.</p>
              </div>

              <span className="sort-label">
                ↕ Full demo first · then oldest full
              </span>
            </div>

            <div className="toolbar">
              <div className="tabs" aria-label="Filter bins by status">
                {[
                  "All bins",
                  "Full",
                  "Not full",
                ].map((tab) => (
                  <button
                    key={tab}
                    className={filter === tab ? "selected" : ""}
                    onClick={() => setFilter(tab)}
                    aria-pressed={filter === tab}
                  >
                    {tab}
                    {tab === "Full" && <span>{full}</span>}
                  </button>
                ))}
              </div>

              <div className="search-filters">
                <label className="search">
                  <Icon name="search" size={17} />

                  <input
                    aria-label="Search bins"
                    placeholder="Search bins or locations…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>

                <select
                  aria-label="Filter by building"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                >
                  <option>All buildings</option>

                  {Array.from(buildings).map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="list-head">
              <span>BIN & LOCATION</span>
              <span>FILL LEVEL</span>
              <span>STATUS</span>
              <span>COLLECTION PRIORITY</span>
            </div>

            <div className="bin-list">
              {visible.map((bin) => {
                const status = bin.status === "full" ? "full" : "available";

                return (
                  <article
                    key={bin.id}
                    className={`bin-row ${status}`}
                  >
                    <div className="bin-location">
                      <div className="bin-icon">
                        <Icon name="bin" size={23} />
                      </div>

                      <div>
                        <div className="bin-title">
                          <h3>{bin.name ?? bin.building}</h3>
                          <span>Floor {bin.floor}</span>
                        </div>

                        <p>
                          <Icon name="pin" size={13} />
                          {bin.name ? `${bin.building} · ${bin.description}` : bin.description}
                        </p>

                        <code>{bin.id}</code>
                      </div>
                    </div>

                    <div className="fill">
                      {bin.fillLevel === null ? <span className="calibration-note">Not calibrated</span> : <><strong>{bin.fillLevel}<small>%</small></strong><div className="progress" role="meter" aria-label={`${bin.id} fill level`} aria-valuenow={bin.fillLevel} aria-valuemin={0} aria-valuemax={100}><span style={{width: `${bin.fillLevel}%`}} /></div></>}
                    </div>
                    <div>
                      <span className={`badge ${status}`}>
                        <span />

                        {status === "full"
                          ? "Full" : "Not full"}
                      </span>
                    </div>

                    <div className="priority">
                      {bin.fullSince ? (
                        <>
                          <strong>
                            {now === null
                              ? "Waiting..."
                              : `Waiting ${waiting(
                                  bin.fullSince,
                                  now
                                )}`}
                          </strong>

                          <span>
                            Full since{" "}
                            {new Date(
                              bin.fullSince
                            ).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              timeZone: "America/New_York",
                            })}
                          </span>
                        </>
                      ) : (
                        <span>No action needed</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {visible.length === 0 && (
              <div className="empty">
                <Icon name="search" size={28} />

                <h3>No matching bins</h3>

                <p>Try another location or clear your filters.</p>

                <button
                  onClick={() => {
                    setQuery("");
                    setBuilding("All buildings");
                    setFilter("All bins");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}

            <div className="list-footer">
              <span>
                Showing {visible.length} of {bins.length} bins
              </span>

              <span>
                <span className="tiny-dot green" />
                {connected
                  ? "API data · refreshes every 2 seconds"
                  : "API disconnected · showing last available data"}
              </span>
            </div>
          </section>

          <footer className="page-footer">
            <span>Sort smarter. Leave a lighter footprint.</span>

            <span>
              Made for the people who keep campus moving.{" "}
              <Icon name="leaf" size={14} />
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}