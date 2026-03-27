"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Droplets, MapPin, Bell, Shield } from "lucide-react";

export default function Home() {

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/8 backdrop-blur-xl bg-background/80 px-8 py-4 flex items-center justify-between">
        <span className="font-heading font-semibold text-lg tracking-[0.15em]">FLOOD<span className="text-primary">SENSE</span></span>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="px-4 py-2 text-sm text-muted hover:text-foreground transition">Dashboard</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#020B18] via-[#051628] to-[#020B18]" />
        <div className="absolute top-0 left-1/4 w-[60rem] h-[60rem] bg-primary/8 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 right-1/4 w-[40rem] h-[40rem] bg-danger/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(26,111,212,1) 1px,transparent 1px),linear-gradient(90deg,rgba(26,111,212,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="relative z-10 max-w-5xl mx-auto px-8 pt-32 pb-24 text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm text-muted border border-white/10 mb-8">
            <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            Live telemetry active · Updated every 15 minutes
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="font-heading text-[clamp(3rem,8vw,7rem)] font-semibold text-foreground leading-none mb-6">
            Real-Time Flood<br />
            <span className="text-primary">Intelligence</span> for India.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="text-muted text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Monitor all 700+ districts. Get AI-powered flood risk predictions 48 hours early. Powered by IMD, CWC, and OpenWeatherMap data.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-full font-semibold text-lg hover:shadow-[0_0_30px_rgba(45,212,191,0.4)] hover:bg-primary/90 transition-all">
              Open Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/map" className="px-8 py-4 glass rounded-full font-semibold text-foreground border border-white/15 hover:bg-white/8 transition-all text-lg">
              View Live Map
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-y border-white/8 py-8 px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[["700+", "Districts Monitored"], ["48h", "Advance Warning"], ["15min", "Data Refresh Rate"], ["12", "States Active"]].map(([v, l]) => (
            <div key={l}>
              <p className="font-heading text-3xl font-semibold text-foreground">{v}</p>
              <p className="text-muted text-sm mt-1">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-8 py-20">
        <h2 className="font-heading text-4xl font-semibold text-foreground text-center mb-16">Everything you need to <span className="text-primary">stay safe</span>.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Droplets className="w-8 h-8 text-primary" />, title: "Live IMD Data", desc: "Direct sync with Indian Meteorological Department satellites for precise, real-time precipitation tracking." },
            { icon: <MapPin className="w-8 h-8 text-warning" />, title: "District Precision", desc: "Granular monitoring across all 700+ administrative districts with local elevation and river level mapping." },
            { icon: <Bell className="w-8 h-8 text-danger" />, title: "Instant Alerts", desc: "Multi-channel alerts via Email, SMS, WhatsApp, and push notifications the moment risk levels change." },
            { icon: <Shield className="w-8 h-8 text-safe" />, title: "AI Prediction", desc: "Advanced neural networks forecasting flood zones 48 hours in advance, trained on decades of IMD data." },
            { icon: <ArrowRight className="w-8 h-8 text-primary" />, title: "Free Forever", desc: "FloodSense India is completely free for citizens, NGOs, and disaster management professionals." },
            { icon: <MapPin className="w-8 h-8 text-critical" />, title: "Open Data", desc: "All data sourced from open government APIs — IMD, CWC, NDMA — transparent and fully auditable." },
          ].map(f => (
            <div key={f.title} className="glass rounded-2xl p-7 hover:bg-white/5 transition border border-white/5 hover:border-white/10">
              <div className="mb-4">{f.icon}</div>
              <h3 className="font-heading font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-white/8 py-20 px-8 text-center">
        <h2 className="font-heading text-4xl font-semibold text-foreground mb-4">Ready to get started?</h2>
        <p className="text-muted mb-8">Join thousands of professionals monitoring India&apos;s flood risk in real time.</p>
        <Link href="/dashboard"
          className="px-10 py-4 bg-primary text-white rounded-full font-semibold text-lg hover:shadow-[0_0_30px_rgba(45,212,191,0.4)] transition-all inline-flex items-center gap-2">
          Open Dashboard <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/8 px-8 py-6 text-center text-muted text-xs">
        © 2025 FloodSense India · Data: IMD, NDMA, CWC, Open-Meteo
      </footer>
    </div>
  );
}
