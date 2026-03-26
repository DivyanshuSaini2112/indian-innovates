"use client";

import { useState, useEffect } from "react";
import { DistrictCard } from "@/components/DistrictCard";
import type { DistrictWeather } from "@/types";
import { Plus, X, Loader2 } from "lucide-react";
import { DISTRICT_COORDS } from "@/types";

const ALL_DISTRICTS = Object.keys(DISTRICT_COORDS);
const DEFAULT_DISTRICTS = ["kottayam", "patna", "bhubaneswar", "guwahati", "surat"];

export default function MyDistrictsPage() {
  const [districts,  setDistricts]  = useState<DistrictWeather[]>([]);
  const [keys,       setKeys]       = useState<string[]>(DEFAULT_DISTRICTS);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [search,     setSearch]     = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/weather?districts=${keys.join(",")}`)
      .then(r => r.json())
      .then(d => { setDistricts(d.districts ?? []); setLoading(false); });
  }, [keys]);

  const removeDistrict = (name: string) => setKeys(prev => prev.filter(k => k !== name.toLowerCase()));
  const addDistrict = (key: string) => { setKeys(prev => prev.includes(key) ? prev : [...prev, key]); setShowModal(false); };

  const filtered = ALL_DISTRICTS.filter(k => k.includes(search.toLowerCase()) && !keys.includes(k));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">My Districts</h1>
          <p className="text-muted text-sm mt-1">{keys.length} districts monitored</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 hover:shadow-[0_0_18px_rgba(26,111,212,0.4)] transition">
          <Plus className="w-4 h-4" /> Add District
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted">
          <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading live weather data...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {districts.map(d => (
            <div key={d.name} className="relative group">
              <DistrictCard
                name={d.name} state={d.state}
                riskScore={d.riskScore} riskLevel={d.riskLevel}
                rainfall24h={d.rainfall24h} rainfall7d={d.rainfall7d}
                forecast={d.forecast.slice(-7).map(f => f.rain * 10)}
              />
              <button
                onClick={() => removeDistrict(d.name)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition glass rounded-lg p-1.5 text-muted hover:text-danger">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add District Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowModal(false)}>
          <div className="glass rounded-2xl p-7 w-full max-w-md border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-heading font-semibold text-foreground text-xl">Add Districts</h2>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search districts..."
              className="w-full glass rounded-xl px-4 py-3 text-foreground text-sm border border-white/10 focus:border-primary/60 outline-none mb-4 bg-transparent" />
            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
              {filtered.slice(0, 30).map(k => (
                <button key={k} onClick={() => addDistrict(k)}
                  className="px-3 py-1.5 glass rounded-full text-xs text-muted hover:text-foreground hover:border-primary/40 hover:bg-primary/10 transition capitalize">
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
