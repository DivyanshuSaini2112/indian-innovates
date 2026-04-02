"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Droplets, MapPin, Bell, Shield, Zap, Globe, BarChart3 } from "lucide-react";
import dynamic from "next/dynamic";

const ParticleCanvas = dynamic(() => import("@/components/ParticleCanvas"), { ssr: false });

const STAT_ITEMS = [
  { value: "700+", label: "Districts Monitored" },
  { value: "48h",  label: "Advance Warning" },
  { value: "15min",label: "Data Refresh Rate" },
  { value: "99.8%",label: "Uptime SLA" },
];

const FEATURES = [
  { icon: <Droplets className="w-6 h-6" />, title: "Live IMD Data",       desc: "Direct sync with Indian Meteorological Department satellites for precise, real-time precipitation tracking.", color: "#2DD4BF" },
  { icon: <MapPin   className="w-6 h-6" />, title: "District Precision",   desc: "Granular monitoring across all 700+ administrative districts with local elevation and river level mapping.",  color: "#FBBF24" },
  { icon: <Bell     className="w-6 h-6" />, title: "Instant Alerts",       desc: "Multi-channel alerts via Email, SMS, WhatsApp, and push notifications the moment risk levels change.",         color: "#FF5757" },
  { icon: <Shield   className="w-6 h-6" />, title: "AI Prediction",        desc: "Random Forest model forecasting flood zones 48 hours in advance, trained on live weather streams.",            color: "#10B981" },
  { icon: <Zap      className="w-6 h-6" />, title: "Free Forever",         desc: "FloodSense India is completely free for citizens, NGOs, and disaster management professionals across India.",    color: "#2DD4BF" },
  { icon: <Globe    className="w-6 h-6" />, title: "Open Data",            desc: "All data sourced from open government APIs — IMD, CWC, NDMA — transparent and fully auditable.",               color: "#F97316" },
  { icon: <BarChart3 className="w-6 h-6"/>, title: "Risk Analytics",       desc: "Interactive charts, historical comparisons, and downloadable CSV reports for research and planning.",             color: "#a855f7" },
  { icon: <MapPin   className="w-6 h-6" />, title: "Pinned Districts",     desc: "Save your most-watched districts for instant access, custom alerts, and personalised dashboards.",               color: "#FBBF24" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 px-8 py-4 flex items-center justify-between"
        style={{ background: "rgba(6,15,28,.85)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
        <span className="font-heading font-bold text-[15px] tracking-[0.12em]">
          FLOOD<span className="text-primary">SENSE</span>
        </span>
        <Link href="/dashboard"
          className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-primary rounded-full border border-primary/30 hover:bg-primary/10 transition-all">
          Open Dashboard <ArrowRight className="w-4 h-4" />
        </Link>
      </nav>

      {/* ── Hero ── */}
      <div className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Deep gradient bg */}
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 70% at 50% 40%, rgba(26,111,212,.1) 0%, rgba(6,15,28,0) 70%), radial-gradient(ellipse 50% 50% at 20% 70%, rgba(45,212,191,.07) 0%, transparent 60%), #060F1C" }} />

        {/* Particle network */}
        <div className="absolute inset-0">
          <ParticleCanvas />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[.025]"
          style={{ backgroundImage: "linear-gradient(rgba(45,212,191,1) 1px,transparent 1px),linear-gradient(90deg,rgba(45,212,191,1) 1px,transparent 1px)", backgroundSize: "64px 64px" }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm text-muted border border-white/10"
            style={{ background: "rgba(255,255,255,.04)", backdropFilter: "blur(12px)" }}>
            <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
            Live telemetry active · Updated every 15 minutes
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.7, delay:.1 }}
            className="font-heading text-[clamp(3rem,9vw,7.5rem)] font-bold text-foreground leading-[1.05] mb-6">
            Real-Time Flood<br />
            <span style={{ backgroundImage: "linear-gradient(135deg, #2DD4BF 0%, #1A6FD4 60%, #a855f7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Intelligence
            </span>{" "}for India.
          </motion.h1>

          {/* Subheading */}
          <motion.p initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:.7, delay:.2 }}
            className="text-muted text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Monitor all 700+ districts. Get AI-powered flood risk predictions 48 hours early.
            Powered by <span className="text-foreground font-medium">IMD</span>, <span className="text-foreground font-medium">CWC</span>, and <span className="text-foreground font-medium">Open-Meteo</span> data.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:.7, delay:.3 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link href="/dashboard"
              className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg,#2DD4BF,#1A6FD4)", boxShadow: "0 0 32px rgba(45,212,191,.4)" }}>
              Open Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/map"
              className="px-8 py-4 rounded-full font-bold text-foreground border border-white/15 hover:bg-white/8 transition-all hover:scale-105 text-lg"
              style={{ backdropFilter: "blur(12px)", background: "rgba(255,255,255,.04)" }}>
              View Live Map
            </Link>
          </motion.div>

          {/* Stats bar */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:.8, delay:.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {STAT_ITEMS.map(({ value, label }, i) => (
              <motion.div key={label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.5 + i * .1 }}
                className="rounded-2xl p-4 text-center border"
                style={{ background: "rgba(255,255,255,.04)", borderColor: "rgba(255,255,255,.08)" }}>
                <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
                <p className="text-muted text-xs mt-0.5">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #060F1C)" }} />
      </div>

      {/* ── Features grid ── */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3">Features</p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
            Everything you need to{" "}
            <span className="text-primary">stay safe</span>.
          </h2>
          <p className="text-muted text-lg max-w-xl mx-auto">
            Built for citizens, disaster managers, NGOs, and researchers who depend on accurate early warnings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
              viewport={{ once: true }} transition={{ delay: i * .05 }}
              className="district-card glass-card rounded-2xl p-6 group cursor-default">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                style={{ background: `${f.color}15`, color: f.color }}>
                {f.icon}
              </div>
              <h3 className="font-heading font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── CTA section ── */}
      <div className="relative py-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(45,212,191,.06) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-xl mx-auto">
          <h2 className="font-heading text-4xl font-bold text-foreground mb-4">Ready to get started?</h2>
          <p className="text-muted mb-8">Join thousands of professionals monitoring India's flood risk in real time.</p>
          <Link href="/dashboard"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-bold text-lg text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg,#2DD4BF,#1A6FD4)", boxShadow: "0 0 32px rgba(45,212,191,.35)" }}>
            Open Dashboard <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t py-8 px-8 text-center text-muted text-xs" style={{ borderColor: "rgba(255,255,255,.07)" }}>
        <p>© 2025 FloodSense India · Data: IMD, NDMA, CWC, Open-Meteo · Built with Next.js 14</p>
      </footer>
    </div>
  );
}
