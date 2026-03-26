export default function SettingsPage() {
  const sources = [
    { abbr: "OMT", name: "Open-Meteo", status: "Connected", freq: "15 min", ok: true },
    { abbr: "IMD", name: "India Meteorological Department", status: "Simulated", freq: "30 min", ok: true },
    { abbr: "CWC", name: "Central Water Commission", status: "Simulated", freq: "30 min", ok: true },
    { abbr: "NDMA", name: "NDMA Alert Feed", status: "Simulated", freq: "1 hour", ok: true },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground mb-8">Settings</h1>
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-52 shrink-0">
          <div className="glass rounded-2xl p-3 space-y-0.5">
            {["General", "Data Sources", "API Access", "Notifications", "Danger Zone"].map((label, i) => (
              <button key={label} className={`w-full text-left px-4 py-3 rounded-xl text-sm transition ${i === 1 ? "bg-primary/20 text-primary border-l-2 border-primary" : "text-muted hover:text-foreground hover:bg-white/5"}`}>
                {label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1">
          <h2 className="font-heading font-semibold text-foreground text-xl mb-6">Data Sources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sources.map(src => (
              <div key={src.abbr} className="glass rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="glass rounded-xl px-3 py-1 text-xs font-bold text-primary mb-2 inline-block">{src.abbr}</div>
                    <p className="text-sm text-foreground font-medium">{src.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${src.ok ? "bg-safe animate-pulse" : "bg-danger"}`} />
                    <span className={`text-xs ${src.ok ? "text-safe" : "text-danger"}`}>{src.status}</span>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-muted mb-5">
                  <div className="flex justify-between">
                    <span>Frequency</span>
                    <select className="bg-transparent border border-white/10 rounded px-2 py-0.5 text-foreground outline-none">
                      <option>{src.freq}</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 glass rounded-xl py-2 text-xs text-muted hover:text-foreground transition">Test</button>
                  <button className="flex-1 bg-primary/20 border border-primary/30 text-primary rounded-xl py-2 text-xs hover:bg-primary/30 transition">Configure</button>
                </div>
              </div>
            ))}
          </div>

          <div className="glass rounded-2xl p-6 mt-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">API Access</h3>
            <p className="text-muted text-sm mb-4">Integrate FloodSense data into your own applications using our read-only API.</p>
            <div className="flex gap-2">
              <code className="glass rounded-xl px-4 py-3 text-sm text-muted flex-1 font-mono tracking-wider text-ellipsis overflow-hidden whitespace-nowrap">
                fs_live_••••••••••••••••••••••
              </code>
              <button className="glass rounded-xl px-4 py-3 text-sm text-primary hover:bg-primary/10 transition">Copy</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
