import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Clock, Lightbulb, Zap, ChevronRight, X } from "lucide-react";
import { callAI } from "@/lib/ai-service";
import { useChannelData } from "@/hooks/useChannelData";
import { formatCount } from "@/lib/utils";

const sv = (v: any): string => { if (v == null) return ""; if (typeof v === "string") return v; if (Array.isArray(v)) return v.map(String).join(", "); return String(v); };
function extractJson(t: string): any { if (!t) return null; try { return JSON.parse(t); } catch {} const s = t.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim(); try { return JSON.parse(s); } catch {} const i = s.indexOf("{"), j = s.lastIndexOf("}"); if (i !== -1 && j !== -1) { try { return JSON.parse(s.slice(i, j + 1)); } catch {} } return null; }
function fmt(n: number): string { if (!n) return "0"; if (n >= 1e6) return (n / 1e6).toFixed(1) + "M"; if (n >= 1e3) return (n / 1e3).toFixed(1) + "K"; return String(n); }
function useCountUp(target: number) { const [c, setC] = useState(0); useEffect(() => { if (!target) return; let cur = 0; const step = target / 60; const t = setInterval(() => { cur += step; if (cur >= target) { setC(target); clearInterval(t); } else setC(Math.floor(cur)); }, 16); return () => clearInterval(t); }, [target]); return c; }
function dayName(t: string): string { if (!t) return "—"; const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]; for (const d of days) if (t.toLowerCase().includes(d.toLowerCase())) return d; return sv(t).split(/[—\-,.]/)[0].trim().slice(0, 12) || "—"; }
function route(t: string): string { const v = t.toLowerCase(); if (v.includes("competitor")) return "/strategy/competitor-spy"; if (v.includes("title") || v.includes("thumbnail")) return "/create/title-tester"; if (v.includes("hook")) return "/create/hook-score"; if (v.includes("comment")) return "/grow/comment-intelligence"; return "/strategy/competitor-spy"; }

export default function Dashboard() {
  const navigate = useNavigate();
  const { channel, videos, isConnected } = useChannelData();
  const [brief, setBrief] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selVid, setSelVid] = useState<any>(null);
  const [sort, setSort] = useState<"worst" | "best" | "recent">("worst");
  const ran = useRef(false);

  const avg = videos.length ? Math.round(videos.reduce((s, v) => s + (v.views || 0), 0) / videos.length) : 0;
  const subs = useCountUp(channel?.subscribers || 0);
  const avgAnim = useCountUp(avg);

  useEffect(() => { if (channel && videos.length > 0 && !ran.current) { ran.current = true; run(); } }, [channel, videos]);

  async function run() {
    setLoading(true); setProgress(20);
    const fail = [...videos].sort((a, b) => (a.views || 0) - (b.views || 0)).slice(0, 3);
    const win = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);
    const days: Record<string, number> = {};
    videos.forEach(v => { if (!v.publishedAt) return; const d = new Date(v.publishedAt).toLocaleDateString("en-US", { weekday: "long" }); days[d] = (days[d] || 0) + 1; });
    const bestDay = Object.entries(days).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";
    setProgress(40);
    const r = await callAI(
      "Brutal YouTube strategist. Max 12 words per insight. Reference actual titles and numbers.",
      `Analyse channel. Return ONLY raw JSON:\n{"biggest_problem":"max 15 words brutal truth","momentum":"growing"|"plateauing"|"declining","best_upload_day":"${bestDay}","best_upload_time":"time IST","hidden_opportunity":"specific topic max 12 words","this_week_action":"one action max 12 words","failing_video_reasons":["reason for video 1","reason for video 2","reason for video 3"]}\nChannel:${channel?.name} ${channel?.subscribers}subs ${avg}avg\nBest:${win.map(v => `"${v.title}"${v.views}v`).join("|")}\nWorst:${fail.map(v => `"${v.title}"${v.views}v`).join("|")}\nRecent:${videos.slice(0, 8).map(v => `"${v.title}"${v.views}v`).join("|")}`
    );
    setProgress(100); setBrief(extractJson(r)); setLoading(false);
  }

  if (!isConnected) return null;

  const fail = [...videos].sort((a, b) => (a.views || 0) - (b.views || 0)).slice(0, 3);
  const sorted = [...videos].sort((a, b) => sort === "worst" ? (a.views || 0) - (b.views || 0) : sort === "best" ? (b.views || 0) - (a.views || 0) : new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  const mc = brief?.momentum === "growing" ? "#4ade80" : brief?.momentum === "declining" ? "#f87171" : "#facc15";

  return (
    <div className="cb-page" style={{ maxWidth: 960, margin: "0 auto" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {channel?.avatar && <img src={channel.avatar} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />}
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f1", lineHeight: 1.2, margin: 0 }}>{channel?.name}</h1>
            <p style={{ fontSize: 13, color: "#52525b", margin: 0 }}>{fmt(subs)} subscribers</p>
          </div>
        </div>
        <button onClick={() => { localStorage.removeItem("cb_channel_data"); navigate("/"); }} style={{ fontSize: 12, color: "#3f3f46", background: "none", border: "none", cursor: "pointer", padding: "8px 12px", borderRadius: 8 }}>Disconnect</button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: "48px 0" }}>
        <p style={{ fontSize: 14, color: "#71717a", marginBottom: 12 }}>Analysing your channel...</p>
        <div style={{ width: 200, height: 4, background: "#1c1c20", borderRadius: 4, margin: "0 auto" }}>
          <div style={{ width: `${progress}%`, height: 4, background: "#facc15", borderRadius: 4, transition: "width 300ms" }} />
        </div>
      </div>}

      {brief && !loading && <div className="cb-card" style={{ marginBottom: 24, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#52525b" }}>Channel Intelligence Brief</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: mc }}>{brief.momentum === "growing" ? "▲" : brief.momentum === "declining" ? "▼" : "→"} {sv(brief.momentum)}</span>
        </div>
        <p style={{ fontSize: 18, fontWeight: 800, color: "#f0f0f1", marginBottom: 20, lineHeight: 1.4 }}>{sv(brief.biggest_problem)}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[{ label: "Post On", icon: <Clock size={14} />, value: dayName(sv(brief.best_upload_day)), sub: sv(brief.best_upload_time), color: "#facc15" }, { label: "Hidden Opportunity", icon: <Lightbulb size={14} />, value: sv(brief.hidden_opportunity), sub: "", color: "#a78bfa" }, { label: "This Week", icon: <Zap size={14} />, value: sv(brief.this_week_action), sub: "", color: "#4ade80" }].map(item => (
            <div key={item.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#52525b", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>{item.icon}{item.label}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: item.color, lineHeight: 1.4 }}>{item.value}</p>
              {item.sub && <p style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>{item.sub}</p>}
            </div>
          ))}
        </div>
        <button onClick={() => navigate(route(sv(brief.this_week_action)))} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#facc15", color: "#000", fontWeight: 800, fontSize: 13, padding: "11px 20px", borderRadius: 10, border: "none", cursor: "pointer", marginTop: 16 }}>Do It Now <ArrowRight size={14} /></button>
      </div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }} className="cb-grid-4">
        {[{ label: "Avg Views", value: fmt(avgAnim), color: "#60a5fa" }, { label: "Health", value: `${Math.min(100, Math.round(videos.filter(v => v.views > avg * 1.2).length / Math.max(videos.length, 1) * 100 + 40))}/100`, color: "#4ade80" }, { label: "Best Day", value: brief ? dayName(sv(brief.best_upload_day)) : "—", color: "#facc15" }, { label: "Videos", value: String(videos.length), color: "#a1a1aa" }].map(s => (
          <div key={s.label} className="cb-card" style={{ padding: 14, textAlign: "center" }}>
            <span className="cb-label">{s.label}</span>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {fail.length > 0 && <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: "#f87171", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Videos That Are Failing</p>
        <div style={{ display: "grid", gap: 8 }}>
          {fail.map((v, i) => (
            <div key={v.id} className="cb-card cb-card-hover" onClick={() => navigate("/diagnose/video-death")} style={{ padding: 14, borderLeft: "3px solid #f87171" }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: "#f87171" }}>{fmt(v.views)} views — {avg > 0 ? Math.round((v.views / avg) * 100) : 0}% of avg</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f1", marginTop: 2 }}>{v.title}</p>
              {brief?.failing_video_reasons?.[i] && <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>{sv(brief.failing_video_reasons[i])}</p>}
              <p style={{ fontSize: 11, fontWeight: 700, color: "#f87171", marginTop: 6 }}>Fix This <ArrowRight size={10} style={{ display: "inline" }} /></p>
            </div>
          ))}
        </div>
      </div>}

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#f0f0f1" }}>Your Videos</span>
          <div style={{ display: "flex", gap: 4 }}>
            {(["worst", "best", "recent"] as const).map(m => (
              <button key={m} onClick={() => setSort(m)} style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", textTransform: "uppercase", background: sort === m ? "rgba(255,255,255,0.1)" : "transparent", color: sort === m ? "#f0f0f1" : "#3f3f46" }}>{m}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }} className="cb-grid-3">
          {sorted.slice(0, 9).map(v => {
            const perf = v.views > avg * 1.2 ? "good" : v.views < avg * 0.7 ? "bad" : "ok";
            const pl = perf === "good" ? `${((v.views / avg) * 100 - 100).toFixed(0)}% above avg` : perf === "bad" ? `${(100 - (v.views / avg) * 100).toFixed(0)}% below avg` : "Near average";
            const bc = perf === "good" ? "#4ade80" : perf === "bad" ? "#f87171" : "#facc15";
            return (
              <div key={v.id} className="cb-card cb-card-hover" onClick={() => setSelVid(v)} style={{ padding: 0, overflow: "hidden", borderLeft: `3px solid ${bc}` }}>
                <div style={{ position: "relative" }}>
                  <img src={v.thumbnail} alt="" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
                  <span style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.8)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>{fmt(v.views)}</span>
                </div>
                <div style={{ padding: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#f0f0f1", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{v.title}</p>
                  <p style={{ fontSize: 10, fontWeight: 700, color: bc, marginTop: 4 }}>{pl}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selVid && <div onClick={() => setSelVid(null)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: "#111114", borderRadius: 16, width: "100%", maxWidth: 420, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: 16, gap: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f1", lineHeight: 1.3 }}>{selVid.title}</h3>
            <button onClick={() => setSelVid(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#52525b", padding: 4, minHeight: 24, fontSize: 18 }}>✕</button>
          </div>
          <img src={selVid.thumbnail} alt="" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, padding: 16 }}>
            {[{ l: "Views", v: fmt(selVid.views), c: "#60a5fa" }, { l: "Likes", v: fmt(selVid.likes || 0), c: "#4ade80" }, { l: "Comments", v: fmt(selVid.comments || 0), c: "#a78bfa" }].map(s => (
              <div key={s.l} style={{ textAlign: "center" }}>
                <span className="cb-label">{s.l}</span>
                <p style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.v}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 16px 16px" }}>
            <button onClick={() => { setSelVid(null); navigate("/diagnose/video-death"); }} style={{ background: "#f87171", color: "#000", fontWeight: 800, fontSize: 13, padding: "11px", borderRadius: 9, border: "none", cursor: "pointer" }}>Diagnose This</button>
            <button onClick={() => setSelVid(null)} style={{ background: "rgba(255,255,255,0.06)", color: "#f0f0f1", fontWeight: 700, fontSize: 13, padding: "11px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>Close</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
