import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, RefreshCw, Copy, Check } from "lucide-react";
import { callAI } from "@/lib/ai-service";

const sv = (v: any): string => { if (v == null) return ""; if (typeof v === "string") return v; if (Array.isArray(v)) return v.map(String).join(", "); return String(v); };
function extractJson(t: string): any { if (!t) return null; try { return JSON.parse(t); } catch {} const s = t.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim(); try { return JSON.parse(s); } catch {} const i = s.indexOf("{"), j = s.lastIndexOf("}"); if (i !== -1 && j !== -1) { try { return JSON.parse(s.slice(i, j + 1)); } catch {} } return null; }
function fmt(n: number): string { if (!n) return "0"; if (n >= 1e6) return (n / 1e6).toFixed(1) + "M"; if (n >= 1e3) return (n / 1e3).toFixed(1) + "K"; return String(n); }
const sc = (n: number) => n >= 70 ? "#4ade80" : n >= 50 ? "#facc15" : "#f87171";

export default function VideoDeath() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [channel, setChannel] = useState<any>(null);
  const [avg, setAvg] = useState(0);
  const [maxV, setMaxV] = useState(0);
  const [sel, setSel] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("cb_channel_data");
    if (!s) { navigate("/"); return; }
    const d = JSON.parse(s);
    setChannel(d);
    const vids: any[] = d.videos || [];
    setVideos(vids);
    if (vids.length > 0) {
      const a = Math.round(vids.reduce((s: number, v: any) => s + (v.views || 0), 0) / vids.length);
      const mx = Math.max(...vids.map((v: any) => v.views || 0));
      setAvg(a); setMaxV(mx);
      const worst = [...vids].sort((a, b) => (a.views || 0) - (b.views || 0))[0];
      setSel(worst);
      runDiag(worst, d, a);
    }
  }, []);

  async function runDiag(video: any, ch: any, a: number) {
    setReport(null); setError(""); setLoading(true); setProgress(15);
    try {
      setProgress(35);
      const r = await callAI(
        "Brutal YouTube algorithm expert. Specific, direct. Reference actual title and numbers.",
        `Video autopsy. Return ONLY raw JSON:\n{"verdict":"one brutal sentence why this failed — use its exact title","failure_type":"title_problem"|"thumbnail_problem"|"wrong_topic"|"bad_timing"|"poor_hook"|"algorithm_mismatch","title_score":0-100,"title_problem":"exact issue","title_fix":"exact new title","thumbnail_problem":"exact issue","thumbnail_fix":"what to change","hook_problem":"first 30 sec issue","algorithm_reason":"why algo stopped pushing","revival_possible":true|false,"revival_strategy":"exact steps or empty","do_this_now":["action1","action2","action3"]}\nVideo:"${video.title}"\nViews:${video.views} avg:${a} = ${a > 0 ? Math.round((video.views / a) * 100) : 0}%\nLikes:${video.likes || 0} Comments:${video.comments || 0}\nChannel:${ch.name} ${ch.subscribers}subs`
      );
      setProgress(100);
      const p = extractJson(r);
      if (!p) throw new Error("Parse failed. Try again.");
      setReport(p);
    } catch (e: any) { setError(e?.message || "Failed. Try again."); }
    setLoading(false);
  }

  function pick(v: any) { setSel(v); setOpen(false); setReport(null); setError(""); if (channel && avg > 0) setTimeout(() => runDiag(v, channel, avg), 50); }

  const sortedVids = [...videos].sort((a, b) => (a.views || 0) - (b.views || 0));

  return (
    <div className="cb-page" style={{ maxWidth: 800, margin: "0 auto" }}>

      <div style={{ marginBottom: 24 }}>
        <p className="cb-label" style={{ marginBottom: 4 }}>Diagnose / Video Autopsy</p>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f0f0f1", margin: 0 }}>Why Did My Video Die?</h1>
        <p style={{ fontSize: 13, color: "#52525b", marginTop: 4 }}>Auto-analysing your worst performing video</p>
      </div>

      {sel && <div style={{ marginBottom: 20 }}>
        <div onClick={() => setOpen(!open)} className="cb-card cb-card-hover" style={{ padding: 12, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <img src={sel.thumbnail} alt="" style={{ width: 56, height: 32, borderRadius: 6, objectFit: "cover" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sel.title}</p>
            <p style={{ fontSize: 11, color: "#52525b" }}>{fmt(sel.views)} views — {avg > 0 ? Math.round((sel.views / avg) * 100) : 0}% of avg</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={(e) => { e.stopPropagation(); if (channel && avg > 0) runDiag(sel, channel, avg); }} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#60a5fa", background: "rgba(96,165,250,0.1)", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 7, minHeight: 32 }}><RefreshCw size={12} />Re-analyse</button>
            <ChevronDown size={14} style={{ color: "#52525b", transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
          </div>
        </div>
        {open && <div className="cb-card" style={{ marginTop: 4, padding: 6, maxHeight: 240, overflowY: "auto" }}>
          {sortedVids.map(v => {
            const dot = v.views < avg * 0.7 ? "#f87171" : v.views > avg * 1.2 ? "#4ade80" : "#facc15";
            return <button key={v.id} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "8px 10px", background: sel?.id === v.id ? "rgba(255,255,255,0.05)" : "none", border: "none", cursor: "pointer", borderRadius: 8, marginBottom: 2 }} onClick={() => pick(v)}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0 }} />
              <img src={v.thumbnail} alt="" style={{ width: 40, height: 24, borderRadius: 4, objectFit: "cover" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#f0f0f1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.title}</p>
                <p style={{ fontSize: 10, color: "#52525b" }}>{fmt(v.views)} views</p>
              </div>
            </button>;
          })}
        </div>}
      </div>}

      {sel && avg > 0 && maxV > 0 && <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 20, padding: "0 4px" }}>
        {[{ label: "This Video", views: sel.views, color: sel.views < avg * 0.7 ? "#f87171" : sel.views > avg * 1.2 ? "#4ade80" : "#facc15" }, { label: "Avg Views", views: avg, color: "#60a5fa" }, { label: "Best Video", views: maxV, color: "#4ade80" }].map(bar => (
          <div key={bar.label} style={{ flex: 1, textAlign: "center" }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: bar.color, marginBottom: 4 }}>{fmt(bar.views)}</p>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, height: 80, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", bottom: 0, width: "100%", height: `${Math.max(8, (bar.views / maxV) * 100)}%`, background: bar.color, borderRadius: 6, transition: "height 600ms ease" }} />
            </div>
            <span className="cb-label" style={{ marginTop: 4, display: "block" }}>{bar.label}</span>
          </div>
        ))}
      </div>}

      {loading && <div style={{ textAlign: "center", padding: "40px 0" }}>
        <p style={{ fontSize: 14, color: "#71717a", marginBottom: 10 }}>Performing autopsy...</p>
        <div style={{ width: 180, height: 4, background: "#1c1c20", borderRadius: 4, margin: "0 auto" }}>
          <div style={{ width: `${progress}%`, height: 4, background: "#f87171", borderRadius: 4, transition: "width 300ms" }} />
        </div>
      </div>}

      {error && !loading && <div className="cb-card" style={{ textAlign: "center", padding: 20, borderColor: "rgba(248,113,113,0.2)" }}>
        <p style={{ fontSize: 13, color: "#f87171", marginBottom: 10 }}>{error}</p>
        <button onClick={() => { if (sel && channel && avg > 0) runDiag(sel, channel, avg); }} style={{ fontSize: 12, fontWeight: 700, color: "#f0f0f1", background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", padding: "8px 14px", borderRadius: 8 }}>Try Again</button>
      </div>}

      {report && !loading && <div className="cb-fade">

        <div className="cb-card" style={{ marginBottom: 16, borderLeft: "3px solid #f87171", padding: 20 }}>
          <span className="cb-label">The Verdict</span>
          <p style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f1", marginTop: 6, lineHeight: 1.4 }}>{sv(report.verdict)}</p>
          {report.failure_type && <span style={{ display: "inline-block", marginTop: 8, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 4, background: "rgba(248,113,113,0.1)", color: "#f87171" }}>{sv(report.failure_type).replace(/_/g, " ")}</span>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }} className="cb-grid-2">
          <div className="cb-card" style={{ padding: 16, textAlign: "center" }}>
            <span className="cb-label">Title Score</span>
            <p style={{ fontSize: 36, fontWeight: 800, color: sc(report.title_score || 0), margin: "6px 0 0" }}>{report.title_score || 0}</p>
            <p style={{ fontSize: 11, color: "#52525b" }}>/100</p>
          </div>
          <div className="cb-card" style={{ padding: 16 }}>
            <span className="cb-label">Problem</span>
            <p style={{ fontSize: 13, color: "#f0f0f1", marginTop: 4 }}>{sv(report.title_problem)}</p>
            <span className="cb-label" style={{ marginTop: 10, display: "block" }}>Fixed Title</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", flex: 1 }}>{sv(report.title_fix)}</p>
              <button onClick={() => { navigator.clipboard.writeText(sv(report.title_fix)); setCopied(true); setTimeout(() => setCopied(false), 1500); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#4ade80", padding: 4, minHeight: 24, display: "flex", alignItems: "center" }}>{copied ? <Check size={14} /> : <Copy size={14} />}</button>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }} className="cb-grid-2">
          <div className="cb-card" style={{ padding: 16 }}>
            <span className="cb-label">Thumbnail Problem</span>
            <p style={{ fontSize: 13, color: "#f0f0f1", marginTop: 4 }}>{sv(report.thumbnail_problem)}</p>
            <span className="cb-label" style={{ marginTop: 10, display: "block" }}>Fix</span>
            <p style={{ fontSize: 13, color: "#a78bfa", marginTop: 4 }}>{sv(report.thumbnail_fix)}</p>
          </div>
          <div className="cb-card" style={{ padding: 16 }}>
            <span className="cb-label">Hook Problem</span>
            <p style={{ fontSize: 13, color: "#f0f0f1", marginTop: 4 }}>{sv(report.hook_problem)}</p>
            <span className="cb-label" style={{ marginTop: 10, display: "block" }}>Algorithm Reason</span>
            <p style={{ fontSize: 13, color: "#facc15", marginTop: 4 }}>{sv(report.algorithm_reason)}</p>
          </div>
        </div>

        {report.revival_possible && <div className="cb-card" style={{ marginBottom: 16, borderLeft: "3px solid #4ade80", padding: 16 }}>
          <span className="cb-label" style={{ color: "#4ade80" }}>Revival Is Possible</span>
          <p style={{ fontSize: 13, color: "#f0f0f1", marginTop: 6 }}>{sv(report.revival_strategy)}</p>
        </div>}

        <div className="cb-card" style={{ padding: 16 }}>
          <span className="cb-label" style={{ marginBottom: 10, display: "block" }}>Do This Right Now</span>
          {(report.do_this_now || []).map((a: string, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(250,204,21,0.15)", color: "#facc15", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
              <p style={{ fontSize: 13, color: "#f0f0f1" }}>{sv(a)}</p>
            </div>
          ))}
        </div>

      </div>}
    </div>
  );
}
