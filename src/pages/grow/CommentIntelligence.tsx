import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, RefreshCw, Lightbulb, Copy, Check } from "lucide-react";
import { callAI } from "@/lib/ai-service";

const YT_KEY = "AIzaSyAz-3Zhkq7DaeodW4s_2zTXW_zHvtzqXzc";
const sv = (v: any): string => { if (v == null) return ""; if (typeof v === "string") return v; if (Array.isArray(v)) return v.map(String).join(", "); return String(v); };
function extractJson(t: string): any { if (!t) return null; try { return JSON.parse(t); } catch {} const s = t.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim(); try { return JSON.parse(s); } catch {} const i = s.indexOf("{"), j = s.lastIndexOf("}"); if (i !== -1 && j !== -1) { try { return JSON.parse(s.slice(i, j + 1)); } catch {} } return null; }
function fmt(n: number): string { if (!n) return "0"; if (n >= 1e6) return (n / 1e6).toFixed(1) + "M"; if (n >= 1e3) return (n / 1e3).toFixed(1) + "K"; return String(n); }

export default function CommentIntelligence() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState("");
  const [topVids, setTopVids] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const s = localStorage.getItem("cb_channel_data");
    if (!s) { navigate("/"); return; }
    const d = JSON.parse(s);
    const sorted = [...(d.videos || [])].sort((a: any, b: any) => (b.views || 0) - (a.views || 0));
    const top = sorted.slice(0, 3);
    setTopVids(top);
    run(top, d);
  }, []);

  async function run(vids: any[], ch: any) {
    setLoading(true); setProgress(5); setReport(null); setError("");
    const all: string[] = [];
    for (let i = 0; i < vids.length; i++) {
      try {
        const r = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${vids[i].id}&maxResults=40&order=relevance&key=${YT_KEY}`);
        const d = await r.json();
        const c = (d.items || []).map((x: any) => x.snippet.topLevelComment.snippet.textDisplay);
        all.push(...c);
      } catch {}
      setProgress(10 + (i + 1) * 18);
    }
    setTotal(all.length);
    if (!all.length) { setError("No comments found. Comments may be disabled on these videos."); setLoading(false); return; }
    setProgress(65);
    const r = await callAI(
      "Expert YouTube audience analyst. Return ONLY raw JSON starting with {. No markdown.",
      `Analyse ${all.length} comments from ${ch.name}. Return:\n{"overall_sentiment":"positive"|"neutral"|"negative","sentiment_score":0-100,"audience_type":"exactly who they are - age interests why they watch","top_requests":[{"request":"specific ask","frequency":"~X comments","video_idea":"exact title"},{"request":"r2","frequency":"x","video_idea":"t2"},{"request":"r3","frequency":"x","video_idea":"t3"}],"pain_points":[{"pain":"specific frustration","opportunity":"how to address"},{"pain":"p2","opportunity":"o2"},{"pain":"p3","opportunity":"o3"}],"video_ideas":[{"title":"specific title from comments","why":"why high views"},{"title":"t2","why":"w2"},{"title":"t3","why":"w3"},{"title":"t4","why":"w4"}],"best_comments_to_reply":[{"comment":"exact comment","why":"why reply helps","reply_suggestion":"suggested reply"},{"comment":"c2","why":"w2","reply_suggestion":"r2"},{"comment":"c3","why":"w3","reply_suggestion":"r3"}],"audience_vocabulary":["w1","w2","w3","w4","w5","w6"],"hidden_insight":"one surprising thing creator doesnt know"}\nComments:${all.slice(0, 120).join(" ||| ")}`
    );
    setProgress(100);
    const p = extractJson(r);
    if (!p) { setError("Analysis failed. Try again."); setLoading(false); return; }
    setReport(p); setLoading(false);
  }

  function copy(t: string, k: string) { navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(null), 1500); }
  const sentimentColor = !report ? "#60a5fa" : (report.sentiment_score ?? 50) >= 70 ? "#4ade80" : (report.sentiment_score ?? 50) >= 40 ? "#facc15" : "#f87171";

  return (
    <div className="cb-page" style={{ maxWidth: 800, margin: "0 auto" }}>

      <div style={{ marginBottom: 20 }}>
        <p className="cb-label" style={{ marginBottom: 4 }}>Grow / Comment Intelligence</p>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f0f0f1", margin: 0 }}>Comment Intelligence</h1>
        <p style={{ fontSize: 13, color: "#52525b", marginTop: 4 }}>Auto-analysing what your audience is really saying</p>
      </div>

      {topVids.length > 0 && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <MessageSquare size={14} style={{ color: "#60a5fa" }} />
        <p style={{ fontSize: 13, color: "#71717a", flex: 1 }}>{loading ? "Fetching comments..." : <>{total} comments analysed from your top {topVids.length} videos</>}</p>
        <button onClick={() => { const s = localStorage.getItem("cb_channel_data"); if (s) run(topVids, JSON.parse(s)); }} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#60a5fa", background: "none", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 7, minHeight: 32 }}><RefreshCw size={12} />Refresh</button>
      </div>}

      {topVids.length > 0 && <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto" }}>
        {topVids.map((v: any) => <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "6px 10px", flexShrink: 0 }}>
          <img src={v.thumbnail} alt="" style={{ width: 32, height: 20, borderRadius: 4, objectFit: "cover" }} />
          <span style={{ fontSize: 11, color: "#a1a1aa", maxWidth: 140, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.title}</span>
        </div>)}
      </div>}

      {loading && <div style={{ textAlign: "center", padding: "40px 0" }}>
        <p style={{ fontSize: 14, color: "#71717a", marginBottom: 10 }}>Mining comment section...</p>
        <div style={{ width: 180, height: 4, background: "#1c1c20", borderRadius: 4, margin: "0 auto" }}>
          <div style={{ width: `${progress}%`, height: 4, background: "#60a5fa", borderRadius: 4, transition: "width 300ms" }} />
        </div>
      </div>}

      {error && !loading && <div className="cb-card" style={{ textAlign: "center", padding: 20, borderColor: "rgba(248,113,113,0.2)" }}>
        <p style={{ fontSize: 13, color: "#f87171", marginBottom: 10 }}>{error}</p>
        <button onClick={() => { const s = localStorage.getItem("cb_channel_data"); if (s) run(topVids, JSON.parse(s)); }} style={{ fontSize: 12, fontWeight: 700, color: "#f0f0f1", background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", padding: "8px 14px", borderRadius: 8 }}>Try Again</button>
      </div>}

      {report && !loading && <div className="cb-fade">

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }} className="cb-grid-2">
          <div className="cb-card" style={{ padding: 16, textAlign: "center" }}>
            <span className="cb-label">Sentiment</span>
            <p style={{ fontSize: 36, fontWeight: 800, color: sentimentColor, margin: "6px 0 0" }}>{report.sentiment_score}</p>
            <p style={{ fontSize: 12, color: "#52525b" }}>{sv(report.overall_sentiment)}</p>
          </div>
          <div className="cb-card" style={{ padding: 16 }}>
            <span className="cb-label">Who Your Audience Is</span>
            <p style={{ fontSize: 13, color: "#f0f0f1", marginTop: 6, lineHeight: 1.5 }}>{sv(report.audience_type)}</p>
          </div>
        </div>

        {report.hidden_insight && <div className="cb-card" style={{ marginBottom: 16, borderLeft: "3px solid #facc15", padding: 16 }}>
          <span className="cb-label" style={{ color: "#facc15" }}>Hidden Insight</span>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f1", marginTop: 6 }}>{sv(report.hidden_insight)}</p>
        </div>}

        {(report.top_requests || []).length > 0 && <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#f0f0f1", marginBottom: 10 }}>What They Keep Requesting</p>
          <div style={{ display: "grid", gap: 8 }}>
            {(report.top_requests || []).map((item: any, i: number) => (
              <div key={i} className="cb-card" style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f1" }}>{sv(item.request)}</p>
                  <p style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>{sv(item.frequency)}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <Lightbulb size={10} style={{ color: "#facc15" }} />
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#facc15" }}>{sv(item.video_idea)}</p>
                  </div>
                </div>
                <button onClick={() => copy(sv(item.video_idea), `r${i}`)} style={{ background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 7, color: copied === `r${i}` ? "#4ade80" : "#a1a1aa", fontSize: 11, fontWeight: 700, minHeight: 32, display: "flex", alignItems: "center", gap: 4 }}>
                  {copied === `r${i}` ? <><Check size={10} />Copied</> : <><Copy size={10} />Copy</>}
                </button>
              </div>
            ))}
          </div>
        </div>}

        {(report.video_ideas || []).length > 0 && <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#f0f0f1", marginBottom: 10 }}>Video Ideas From Comments</p>
          <div style={{ display: "grid", gap: 8 }}>
            {(report.video_ideas || []).map((idea: any, i: number) => (
              <div key={i} className="cb-card" style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f1" }}>{sv(idea.title)}</p>
                  <button onClick={() => copy(sv(idea.title), `i${i}`)} style={{ background: "none", border: "none", cursor: "pointer", color: "#52525b", padding: 4, flexShrink: 0, display: "flex", alignItems: "center", minHeight: 24 }}>
                    {copied === `i${i}` ? <Check size={12} style={{ color: "#4ade80" }} /> : <Copy size={12} />}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>{sv(idea.why)}</p>
              </div>
            ))}
          </div>
        </div>}

        {(report.pain_points || []).length > 0 && <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#f0f0f1", marginBottom: 10 }}>Audience Pain Points</p>
          <div style={{ display: "grid", gap: 8 }}>
            {(report.pain_points || []).map((item: any, i: number) => (
              <div key={i} className="cb-card" style={{ padding: 14 }}>
                <p className="cb-label" style={{ color: "#f87171" }}>The Pain</p>
                <p style={{ fontSize: 13, color: "#f0f0f1", marginTop: 4 }}>{sv(item.pain)}</p>
                <p className="cb-label" style={{ color: "#4ade80", marginTop: 10 }}>The Opportunity</p>
                <p style={{ fontSize: 13, color: "#f0f0f1", marginTop: 4 }}>{sv(item.opportunity)}</p>
              </div>
            ))}
          </div>
        </div>}

        {(report.best_comments_to_reply || []).length > 0 && <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#f0f0f1", marginBottom: 10 }}>Comments You Should Reply To</p>
          <div style={{ display: "grid", gap: 8 }}>
            {(report.best_comments_to_reply || []).map((item: any, i: number) => (
              <div key={i} className="cb-card" style={{ padding: 14 }}>
                <p style={{ fontSize: 13, color: "#a1a1aa", fontStyle: "italic", marginBottom: 4 }}>"{sv(item.comment)}"</p>
                <p style={{ fontSize: 12, color: "#52525b", marginBottom: 8 }}>{sv(item.why)}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(167,139,250,0.06)", borderRadius: 8, padding: "8px 10px" }}>
                  <p style={{ fontSize: 12, color: "#a78bfa", flex: 1 }}>{sv(item.reply_suggestion)}</p>
                  <button onClick={() => copy(sv(item.reply_suggestion), `rp${i}`)} style={{ background: "none", border: "none", cursor: "pointer", color: "#a78bfa", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, minHeight: 24, padding: "0 4px" }}>
                    {copied === `rp${i}` ? <><Check size={10} />Copied</> : <><Copy size={10} />Copy</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>}

        {(report.audience_vocabulary || []).length > 0 && <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#f0f0f1", marginBottom: 10 }}>Words Your Audience Uses — Put These in Your Titles</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(report.audience_vocabulary || []).map((w: string, i: number) => (
              <button key={i} onClick={() => copy(sv(w), `v${i}`)} style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 20, cursor: "pointer", background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.15)", color: "#facc15" }}>
                {sv(w)} {copied === `v${i}` ? "✓" : ""}
              </button>
            ))}
          </div>
        </div>}

      </div>}
    </div>
  );
}
