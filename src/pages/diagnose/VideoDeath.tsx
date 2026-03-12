import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, RefreshCw, Copy, Check } from "lucide-react";
import { callAI } from "@/lib/ai-service";

const sv = (v: any): string => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(String).join(", ");
  return String(v);
};

function extractJson(t: string): any {
  if (!t) return null;
  try { return JSON.parse(t); } catch {}
  const s = t.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
  try { return JSON.parse(s); } catch {}
  const i = s.indexOf("{"), j = s.lastIndexOf("}");
  if (i !== -1 && j !== -1) { try { return JSON.parse(s.slice(i, j + 1)); } catch {} }
  return null;
}

function fmt(n: number): string {
  if (!n) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

const scoreColor = (n: number) => n >= 70 ? "#4ade80" : n >= 50 ? "#facc15" : "#f87171";

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
    const s = localStorage.getItem("yt_channel_data");
    if (!s) { navigate("/"); return; }
    const d = JSON.parse(s);
    setChannel(d);
    const vids: any[] = d.videos || [];
    setVideos(vids);
    if (vids.length > 0) {
      const a = Math.round(vids.reduce((s: number, v: any) => s + (v.views || 0), 0) / vids.length);
      const mx = Math.max(...vids.map((v: any) => v.views || 0));
      setAvg(a);
      setMaxV(mx);
      const worst = [...vids].sort((a, b) => (a.views || 0) - (b.views || 0))[0];
      setSel(worst);
      runDiag(worst, d, a);
    }
  }, []);

  async function runDiag(video: any, ch: any, a: number) {
    setReport(null);
    setError("");
    setLoading(true);
    setProgress(15);
    try {
      setProgress(35);
      const r = await callAI(
        "You are a brutal YouTube algorithm expert. Be 100% specific to THIS video. Reference its exact title and exact view count in every answer. Never give generic advice.",
        `Perform a video autopsy. Return ONLY raw JSON, no markdown:
{
  "verdict": "one brutal sentence about THIS specific video called '${video.title}' which got ${video.views} views vs channel avg of ${a}",
  "failure_type": "title_problem" | "thumbnail_problem" | "wrong_topic" | "bad_timing" | "poor_hook" | "algorithm_mismatch",
  "title_score": 0-100,
  "title_problem": "exact problem with the title '${video.title}'",
  "title_fix": "rewrite '${video.title}' — give the exact new title",
  "thumbnail_problem": "specific issue with the thumbnail for this type of content",
  "thumbnail_fix": "exactly what to change",
  "hook_problem": "what was likely wrong with the first 30 seconds of '${video.title}'",
  "algorithm_reason": "why the algorithm stopped pushing '${video.title}' specifically",
  "revival_possible": true or false,
  "revival_strategy": "exact steps to revive this specific video, or empty string",
  "do_this_now": ["specific action 1 for this video", "specific action 2", "specific action 3"]
}
Video: "${video.title}"
Views: ${video.views} | Channel avg: ${a} | Performance: ${a > 0 ? Math.round((video.views / a) * 100) : 0}% of average
Likes: ${video.likes || 0} | Comments: ${video.comments || 0}
Published: ${video.publishedAt}
Channel: ${ch.name}, ${ch.subscribers} subscribers`
      );
      setProgress(100);
      const p = extractJson(r);
      if (!p) throw new Error("Could not read AI response. Please try again.");
      setReport(p);
    } catch (e: any) {
      setError(e?.message || "Analysis failed. Please try again.");
    }
    setLoading(false);
  }

  function pick(v: any) {
    setOpen(false);
    setSel(v);
    setReport(null);
    setError("");
    setProgress(0);
    if (channel && avg > 0) {
      setTimeout(() => runDiag(v, channel, avg), 80);
    }
  }

  const sortedVids = [...videos].sort((a, b) => (a.views || 0) - (b.views || 0));

  return (
    <div className="cb-page cb-fade">
      <div style={{ marginBottom: 20 }}>
        <span className="cb-label" style={{ marginBottom: 6 }}>Diagnose / Video Autopsy</span>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
          Why Did My Video Die?
        </h1>
        <p style={{ fontSize: 13, color: "#71717a" }}>Auto-analysing your worst performing video</p>
      </div>

      {/* Video picker */}
      {sel && (
        <div style={{ marginBottom: 16 }}>
          <div className="cb-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
            onClick={() => setOpen(!open)}>
            <img src={sel.thumbnail} alt="" style={{ height: 44, width: 78, objectFit: "cover", borderRadius: 7, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sel.title}</p>
              <p style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>
                {fmt(sel.views)} views — {avg > 0 ? Math.round((sel.views / avg) * 100) : 0}% of avg
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={e => { e.stopPropagation(); if (channel && avg > 0) runDiag(sel, channel, avg); }}
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#60a5fa", background: "rgba(96,165,250,0.1)", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 7, minHeight: 32 }}>
                <RefreshCw size={11} /> Re-analyse
              </button>
              <ChevronDown size={14} color="#52525b" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
            </div>
          </div>

          {open && (
            <div className="cb-card" style={{ marginTop: 4, maxHeight: 300, overflowY: "auto", padding: 8 }}>
              {sortedVids.map(v => {
                const dot = v.views < avg * 0.5 ? "#f87171" : v.views < avg * 0.8 ? "#facc15" : "#4ade80";
                return (
                  <div key={v.id}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: 8, cursor: "pointer", background: sel?.id === v.id ? "rgba(255,255,255,0.05)" : "transparent" }}
                    onClick={() => pick(v)}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                    <img src={v.thumbnail} alt="" style={{ height: 34, width: 60, objectFit: "cover", borderRadius: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title}</p>
                      <p style={{ fontSize: 10, color: "#52525b" }}>{fmt(v.views)} views</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bar chart — always visible when video selected */}
      {sel && avg > 0 && maxV > 0 && (
        <div className="cb-card" style={{ padding: 20, marginBottom: 16 }}>
          <span className="cb-label" style={{ marginBottom: 16, display: "block" }}>Performance vs Channel</span>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-end", height: 120 }}>
            {[
              { label: "This Video", views: sel.views, color: sel.views < avg * 0.7 ? "#f87171" : sel.views > avg * 1.2 ? "#4ade80" : "#facc15" },
              { label: "Channel Avg", views: avg, color: "#60a5fa" },
              { label: "Best Video", views: maxV, color: "#4ade80" },
            ].map(bar => (
              <div key={bar.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: bar.color }}>{fmt(bar.views)}</p>
                <div style={{ flex: 1, width: "100%", background: "rgba(255,255,255,0.04)", borderRadius: 8, display: "flex", alignItems: "flex-end" }}>
                  <div style={{
                    width: "100%",
                    height: `${Math.max(6, Math.round((bar.views / maxV) * 100))}%`,
                    background: bar.color,
                    borderRadius: 8,
                    opacity: 0.8,
                    transition: "height 700ms ease"
                  }} />
                </div>
                <span className="cb-label">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="cb-card" style={{ padding: 24, marginBottom: 16 }}>
          <span className="cb-label" style={{ color: "#facc15", marginBottom: 12, display: "block" }}>
            Performing autopsy on "{sel?.title?.slice(0, 40)}..."
          </span>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, height: 6, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#facc15", width: `${progress}%`, borderRadius: 8, transition: "width 400ms" }} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="cb-card" style={{ padding: 20, borderLeft: "3px solid #f87171", marginBottom: 16 }}>
          <p style={{ color: "#f87171", fontWeight: 600, marginBottom: 8 }}>{error}</p>
          <button onClick={() => { if (sel && channel && avg > 0) runDiag(sel, channel, avg); }}
            style={{ fontSize: 12, fontWeight: 700, color: "#f0f0f1", background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", padding: "8px 14px", borderRadius: 8 }}>
            Try Again
          </button>
        </div>
      )}

      {/* Report */}
      {report && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          <div className="cb-card" style={{ padding: 20, borderLeft: "3px solid #f87171" }}>
            <span className="cb-label" style={{ color: "#f87171", marginBottom: 10, display: "block" }}>The Verdict</span>
            <p style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.45 }}>{sv(report.verdict)}</p>
            {report.failure_type && (
              <span style={{ display: "inline-block", marginTop: 10, fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
                {sv(report.failure_type).replace(/_/g, " ")}
              </span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 10 }}>
            <div className="cb-card" style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <span className="cb-label" style={{ marginBottom: 8 }}>Title Score</span>
              <p style={{ fontSize: 40, fontWeight: 900, color: scoreColor(report.title_score || 0), lineHeight: 1 }}>{report.title_score || 0}</p>
              <p style={{ fontSize: 10, color: "#52525b", marginTop: 4 }}>/100</p>
            </div>
            <div className="cb-card" style={{ padding: 16 }}>
              <span className="cb-label" style={{ color: "#f87171", marginBottom: 6, display: "block" }}>Problem</span>
              <p style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 12, lineHeight: 1.5 }}>{sv(report.title_problem)}</p>
              <span className="cb-label" style={{ color: "#4ade80", marginBottom: 6, display: "block" }}>Fixed Title</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 9, padding: "10px 14px" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", flex: 1 }}>{sv(report.title_fix)}</p>
                <button onClick={() => { navigator.clipboard.writeText(sv(report.title_fix)); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#4ade80", padding: 4, minHeight: 24, display: "flex", alignItems: "center" }}>
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="cb-card" style={{ padding: 16 }}>
              <span className="cb-label" style={{ color: "#f87171", marginBottom: 6, display: "block" }}>Thumbnail Problem</span>
              <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5, marginBottom: 10 }}>{sv(report.thumbnail_problem)}</p>
              <span className="cb-label" style={{ color: "#4ade80", marginBottom: 6, display: "block" }}>Fix</span>
              <p style={{ fontSize: 13, lineHeight: 1.5 }}>{sv(report.thumbnail_fix)}</p>
            </div>
            <div className="cb-card" style={{ padding: 16 }}>
              <span className="cb-label" style={{ color: "#facc15", marginBottom: 6, display: "block" }}>Hook Problem</span>
              <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5, marginBottom: 10 }}>{sv(report.hook_problem)}</p>
              <span className="cb-label" style={{ color: "#a78bfa", marginBottom: 6, display: "block" }}>Algorithm Reason</span>
              <p style={{ fontSize: 13, lineHeight: 1.5 }}>{sv(report.algorithm_reason)}</p>
            </div>
          </div>

          {report.revival_possible && (
            <div className="cb-card" style={{ padding: 16, borderLeft: "3px solid #4ade80" }}>
              <span className="cb-label" style={{ color: "#4ade80", marginBottom: 8, display: "block" }}>Revival Is Possible</span>
              <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>{sv(report.revival_strategy)}</p>
            </div>
          )}

          <div className="cb-card" style={{ padding: 20, borderLeft: "3px solid #facc15" }}>
            <span className="cb-label" style={{ color: "#facc15", marginBottom: 12, display: "block" }}>Do This Right Now</span>
            {(report.do_this_now || []).map((a: string, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#facc15", flexShrink: 0 }}>
                  {i + 1}
                </span>
                <p style={{ fontSize: 14, lineHeight: 1.5, paddingTop: 2 }}>{sv(a)}</p>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
