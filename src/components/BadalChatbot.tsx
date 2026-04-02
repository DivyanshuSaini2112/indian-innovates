"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Mic, MicOff, Volume2, VolumeX, Send, Cloud, ChevronDown, RefreshCw } from "lucide-react";

/* ─── types ─────────────────────────────────────────── */
interface Message {
  id:   string;
  role: "user" | "bot";
  text: string;
  ts:   Date;
}
type Lang = "en" | "hi";

/* ─── Web Speech API ─────────────────────────────────── */
/* eslint-disable @typescript-eslint/no-explicit-any */
const getSR = () =>
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

/* ─── helpers ────────────────────────────────────────── */
function uid() { return Math.random().toString(36).slice(2); }

/** Markdown → plain text for TTS (keep it short) */
function stripMd(s: string) {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g,     "$1")
    .replace(/^[#>•\-\d.]+\s*/gm, "")
    .replace(/\n+/g, ". ")
    .slice(0, 350);
}

/** Very basic markdown → HTML */
function mdToHtml(s: string) {
  return s
    .replace(/\*\*(.+?)\*\*/g,  "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,       "<em>$1</em>")
    .replace(/^#{1,3} (.+)$/gm,  "<p class='font-bold text-white mt-1 mb-0.5'>$1</p>")
    .replace(/^([•\-]) (.+)$/gm, "<li class='ml-4 list-disc'>$2</li>")
    .replace(/\n/g,              "<br/>");
}

const SUGGESTIONS: Record<Lang, string[]> = {
  en: [
    "Which districts are most at risk? 🚨",
    "What is the rainfall in Patna?",
    "Is Delhi safe right now?",
    "Flood forecast for tomorrow",
    "What should I do during a flood?",
  ],
  hi: [
    "कौन से जिलों में बाढ़ का खतरा है? 🚨",
    "पटना में बारिश की स्थिति क्या है?",
    "क्या दिल्ली अभी सुरक्षित है?",
    "कल के लिए बाढ़ का पूर्वानुमान बताओ",
    "बाढ़ के दौरान क्या करना चाहिए?",
  ],
};

/* ─── component ─────────────────────────────────────── */
export default function BadalChatbot() {
  const [open,       setOpen]       = useState(false);
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [listening,  setListening]  = useState(false);
  const [ttsOn,      setTtsOn]      = useState(true);
  const [lang,       setLang]       = useState<Lang>("en");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices,     setVoices]     = useState<SpeechSynthesisVoice[]>([]);

  const recogRef  = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  /* ── Load TTS voices (async — must wait for onvoiceschanged) ── */
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setVoices(v);
    };
    load(); // already cached on revisit
    window.speechSynthesis.onvoiceschanged = load; // fires when browser loads voices
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  /* ── Scroll to bottom ── */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [messages]);

  /* ── Focus & greeting ── */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
      if (messages.length === 0) {
        addBotMsg(`🌧️ **Namaste! I'm Badal** ☁️\n\nI'm powered by **Google Gemini AI** and have live data for **115 districts** across India.\n\nAsk me anything about:\n• **बाढ़ / Flood risks** across any district\n• **बारिश / Live rainfall** data\n• **Safety advisories** and alerts\n• **72h weather forecast**\n\nI can speak in **English** and **हिन्दी**! Switch with the EN/हि button above. 🎙️`);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ── Text-to-Speech with proper voice selection ── */
  const speak = useCallback((text: string, targetLang: Lang) => {
    if (!("speechSynthesis" in window) || !ttsOn) return;
    window.speechSynthesis.cancel();

    const utt    = new SpeechSynthesisUtterance(text);
    utt.lang     = targetLang === "hi" ? "hi-IN" : "en-IN";
    utt.rate     = targetLang === "hi" ? 0.88 : 0.95;
    utt.pitch    = 1.05;
    utt.volume   = 1;

    // Pick best voice for the language
    const allVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    if (targetLang === "hi") {
      const hiVoice =
        allVoices.find(v => v.lang === "hi-IN") ||
        allVoices.find(v => v.lang.startsWith("hi")) ||
        allVoices.find(v => /hindi|हिन्दी/i.test(v.name));
      if (hiVoice) {
        utt.voice = hiVoice;
      }
      // If no Hindi voice found, browser will still attempt hi-IN synthesis
    } else {
      const enVoice =
        allVoices.find(v => v.lang === "en-IN" && !v.localService) ||
        allVoices.find(v => v.lang === "en-IN") ||
        allVoices.find(v => v.lang.startsWith("en") && /india|google|natural/i.test(v.name)) ||
        allVoices.find(v => v.lang.startsWith("en"));
      if (enVoice) utt.voice = enVoice;
    }

    utt.onstart = () => setIsSpeaking(true);
    utt.onend   = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);

    // Small delay helps on some browsers
    setTimeout(() => window.speechSynthesis.speak(utt), 50);
  }, [ttsOn, voices]);

  const stopSpeech = () => { window.speechSynthesis.cancel(); setIsSpeaking(false); };

  /* ── Add bot message ── */
  function addBotMsg(text: string) {
    setMessages(p => [...p, { id: uid(), role: "bot", text, ts: new Date() }]);
  }

  /* ── Send to Gemini API ── */
  const sendMessage = useCallback(async (text: string, overrideLang?: Lang) => {
    if (!text.trim() || loading) return;
    const activeLang = overrideLang ?? lang;
    const userMsg: Message = { id: uid(), role: "user", text: text.trim(), ts: new Date() };
    setMessages(p => [...p, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res  = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: text.trim(), lang: activeLang }),
      });
      const data = await res.json();
      const reply = data.reply ?? "मुझे खेद है। / Sorry, no response received.";
      addBotMsg(reply);
      if (ttsOn) speak(stripMd(reply), activeLang);
    } catch {
      addBotMsg("⚠️ Connection error. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  }, [loading, lang, ttsOn, speak]);

  /* ── Speech recognition ── */
  const startListening = useCallback(() => {
    const SR = getSR();
    if (!SR) { alert("Speech recognition not supported. Please use Chrome or Edge."); return; }

    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }

    const recog           = new SR();
    recog.lang            = lang === "hi" ? "hi-IN" : "en-IN";
    recog.continuous      = false;
    recog.interimResults  = false;
    recog.maxAlternatives = 1;

    recog.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setListening(false);
      recogRef.current = null;
      sendMessage(transcript, lang);
    };
    recog.onerror = () => { setListening(false); recogRef.current = null; };
    recog.onend   = () => { setListening(false); recogRef.current = null; };

    recogRef.current = recog;
    recog.start();
    setListening(true);
  }, [lang, listening, sendMessage]);

  /* ── Clear chat ── */
  const clearChat = () => { setMessages([]); stopSpeech(); };

  /* ──────────── RENDER ──────────── */
  return (
    <>
      <style>{`
        @keyframes bFloat  { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-6px) scale(1.03)} }
        @keyframes bRing   { 0%{transform:scale(.9);opacity:.7} 70%{transform:scale(1.6);opacity:0} 100%{transform:scale(.9);opacity:0} }
        @keyframes bPop    { 0%{transform:scale(.55);opacity:0} 70%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
        @keyframes bSlide  { from{transform:translateY(16px);opacity:0} to{transform:none;opacity:1} }
        @keyframes bSpin   { to{transform:rotate(360deg)} }
        @keyframes bDot    { 0%,100%{opacity:1} 50%{opacity:.25} }
        @keyframes bWave   { 0%,100%{height:6px} 50%{height:14px} }
        .b-float  { animation:bFloat 3.5s ease-in-out infinite; }
        .b-ring   { animation:bRing  2.4s ease-out infinite; }
        .b-pop    { animation:bPop   .38s cubic-bezier(.34,1.56,.64,1) forwards; }
        .b-slide  { animation:bSlide .28s ease forwards; }
        .b-spin   { animation:bSpin  .9s linear infinite; }
        .b-dot    { animation:bDot 1.1s ease-in-out infinite; }
        .bsb::-webkit-scrollbar { width:2px; }
        .bsb::-webkit-scrollbar-thumb { background:rgba(45,212,191,.3); border-radius:9px; }
        .b-wave span { display:inline-block; width:3px; border-radius:9px; background:#2DD4BF; animation:bWave .7s ease-in-out infinite; }
        .b-wave span:nth-child(2){animation-delay:.15s} .b-wave span:nth-child(3){animation-delay:.3s}
      `}</style>

      {/* ════ FLOATING BALL ════ */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Chat with Badal AI"
          className="b-float fixed z-[9999] bottom-6 right-6 w-16 h-16 rounded-full flex flex-col items-center justify-center select-none focus:outline-none"
          style={{
            background:  "linear-gradient(135deg,#2DD4BF 0%,#1A6FD4 55%,#a855f7 100%)",
            boxShadow:   "0 8px 32px rgba(45,212,191,.5), 0 2px 10px rgba(0,0,0,.45)",
          }}
        >
          <span className="b-ring absolute inset-[-5px] rounded-full border-2"
            style={{ borderColor: "rgba(45,212,191,.45)" }} />
          <Cloud className="w-6 h-6 text-white drop-shadow" />
          <span className="text-[10px] font-bold text-white/95 leading-none mt-0.5 tracking-wide">Badal</span>
        </button>
      )}

      {/* ════ CHAT PANEL ════ */}
      {open && (
        <div
          className="b-pop fixed z-[9999] bottom-6 right-6 flex flex-col overflow-hidden"
          style={{
            width:  "min(390px, calc(100vw - 20px))",
            height: "min(640px, calc(100vh - 80px))",
            borderRadius: "22px",
            background:   "rgba(5,13,25,.97)",
            backdropFilter: "blur(30px)",
            border:    "1px solid rgba(45,212,191,.2)",
            boxShadow: "0 40px 100px rgba(0,0,0,.7), 0 0 0 1px rgba(45,212,191,.06), 0 0 60px rgba(45,212,191,.06)",
          }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{
              background:    "linear-gradient(135deg,rgba(45,212,191,.1),rgba(168,85,247,.07))",
              borderBottom:  "1px solid rgba(255,255,255,.07)",
            }}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#2DD4BF,#1A6FD4)" }}>
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                style={{ background: "#10B981", boxShadow: "0 0 6px #10B981", borderColor: "#050D19" }} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-[13px] text-white">Badal ☁️ <span className="text-[10px] font-normal text-muted ml-1 align-middle">Gemini AI</span></p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
                <span style={{ fontSize: "10px", color: "#7B90AA" }}>Live flood intelligence · 115 districts</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Lang toggle */}
              <button
                onClick={() => setLang(l => l === "en" ? "hi" : "en")}
                className="h-7 px-2 rounded-lg text-[11px] font-bold border transition hover:bg-white/5 mr-0.5"
                style={{ color: "#2DD4BF", borderColor: "rgba(45,212,191,.3)" }}
                title="Switch language / भाषा बदलें"
              >
                {lang === "en" ? "EN" : "हि"}
              </button>

              {/* TTS */}
              <button
                onClick={() => { setTtsOn(p => !p); if (isSpeaking) stopSpeech(); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition"
                style={{ color: ttsOn ? "#2DD4BF" : "#7B90AA" }} title="Toggle voice"
              >
                {ttsOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Clear */}
              <button onClick={clearChat}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition text-muted"
                title="Clear chat">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {/* Minimise */}
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition text-muted"
                title="Minimise">
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Close */}
              <button onClick={() => { setOpen(false); stopSpeech(); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition text-muted"
                title="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bsb">
            {messages.map(msg => (
              <div key={msg.id} className={`b-slide flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "bot" && (
                  <div className="w-6 h-6 rounded-lg shrink-0 mr-2 mt-0.5 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#2DD4BF,#1A6FD4)" }}>
                    <Cloud className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user" ? "rounded-br-sm text-white" : "rounded-bl-sm border"
                  }`}
                  style={msg.role === "user"
                    ? { background: "linear-gradient(135deg,#2DD4BF,#1A6FD4)", boxShadow: "0 4px 14px rgba(45,212,191,.25)" }
                    : { background: "rgba(255,255,255,.045)", borderColor: "rgba(255,255,255,.08)", color: "#E8EFF8" }
                  }
                  dangerouslySetInnerHTML={{ __html: mdToHtml(msg.text) }}
                />
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start b-slide">
                <div className="w-6 h-6 rounded-lg shrink-0 mr-2 mt-0.5 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#2DD4BF,#1A6FD4)" }}>
                  <Cloud className="w-3.5 h-3.5 text-white b-spin" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm border"
                  style={{ background: "rgba(255,255,255,.045)", borderColor: "rgba(255,255,255,.08)" }}>
                  <div className="b-wave flex items-center gap-1" style={{ height: "18px" }}>
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Suggestions ── */}
          {messages.length <= 1 && !loading && (
            <div className="px-4 pb-2 shrink-0">
              <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "#7B90AA" }}>
                {lang === "hi" ? "पूछने की कोशिश करें:" : "Try asking:"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS[lang].map(s => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="text-[11px] px-2.5 py-1.5 rounded-full border transition-all hover:bg-primary/10 hover:scale-[1.02] active:scale-95"
                    style={{ borderColor: "rgba(255,255,255,.1)", color: "#94A3B8" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Speaking bar ── */}
          {isSpeaking && (
            <div className="mx-4 mb-1 px-3 py-1.5 rounded-xl flex items-center gap-2 shrink-0"
              style={{ background: "rgba(45,212,191,.08)", border: "1px solid rgba(45,212,191,.2)", color: "#2DD4BF", fontSize: "11px" }}>
              <Volume2 className="w-3 h-3 animate-pulse shrink-0" />
              {lang === "hi" ? "हिन्दी में बोल रहा हूँ…" : "Speaking in English…"}
              <button onClick={stopSpeech} className="ml-auto opacity-60 hover:opacity-100">✕</button>
            </div>
          )}

          {/* ── Input ── */}
          <div className="px-3 pb-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
              style={{ background: "rgba(255,255,255,.055)", border: "1px solid rgba(255,255,255,.1)" }}>

              {/* Mic */}
              <button
                onClick={startListening}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0"
                style={{
                  background: listening ? "rgba(255,87,87,.15)" : "rgba(45,212,191,.1)",
                  border:     `1px solid ${listening ? "rgba(255,87,87,.4)" : "rgba(45,212,191,.25)"}`,
                  color:      listening ? "#FF5757" : "#2DD4BF",
                  boxShadow:  listening ? "0 0 14px rgba(255,87,87,.35)" : "none",
                }}
                title={lang === "hi" ? "हिन्दी में बोलें" : "Speak in English"}
              >
                {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>

              {/* Text input */}
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder={lang === "hi" ? "बाढ़ के बारे में पूछें…" : "Ask about floods, rainfall, safety…"}
                className="flex-1 bg-transparent text-sm outline-none min-w-0"
                style={{ color: "#E8EFF8" }}
                disabled={loading || listening}
                autoComplete="off"
              />

              {/* Send */}
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0"
                style={{
                  background:  input.trim() && !loading ? "linear-gradient(135deg,#2DD4BF,#1A6FD4)" : "rgba(255,255,255,.06)",
                  color:       input.trim() && !loading ? "white" : "#7B90AA",
                  boxShadow:   input.trim() && !loading ? "0 4px 12px rgba(45,212,191,.3)" : "none",
                }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-center mt-1.5" style={{ fontSize: "9px", color: "#4B617A" }}>
              {lang === "hi"
                ? "Gemini AI · Open-Meteo लाइव डेटा · English & हिन्दी"
                : "Powered by Gemini AI · Open-Meteo live data · English & हिन्दी voice"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
