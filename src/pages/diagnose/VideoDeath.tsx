import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, RefreshCw, Copy, Check, AlertTriangle } from "lucide-react";
import { callAI } from "@/lib/ai-service";
import { getMyChannel } from "@/lib/youtube-api";
import { getSelectedVideo, clearSelectedVideo } from "@/lib/video-context";

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
  const location = useLocation();
  const [videos, setVideos] = useState<any[]>([]);
  const [channel, setChannel] = useState<any>(null);
  const [avg, setAvg] = useState(0);
  const [sel, setSel] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const maxV = useMemo(() => videos.length ? Math.max(...videos.map(v => v.views || 0)) : 0, [videos]);

  useEffect(() => {
    try {
      const ch = getMyChannel();
      setChannel(ch);
      const vids: any[] = ch.videos || [];
      setVideos(vids);
      if (!vids.length) return;

      const a = Math.round(
        vids.reduce((sum: number, v: any) => sum + (v.views || 0), 0) / vids.length,
      );
      setAvg(a);

      const storedSel = getSelectedVideo();
      const passedId = (location.state as any)?.videoId;
      let initial: any | null = null;

      if (passedId) {
        initial = vids.find(v => v.id === passedId) || null;
      }

      if (!initial && storedSel) {
        initial = vids.find(v => v.id === storedSel.id) || null;
      }

      if (!initial) {
        initial = [...vids].sort((a, b) => (a.views || 0) - (b.views || 0))[0];
      }

      setSel(initial);
      clearSelectedVideo();
      if (initial && a > 0) {
        runDiag(initial, ch, a);
      }
    } catch {
      navigate("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="cb-page cb-fade min-h-screen bg-[#050505] text-zinc-100">
      <div className="mb-6">
        <span className="cb-label mb-2 block text-[11px] tracking-[0.22em] uppercase text-zinc-500">
          Diagnose / Video Autopsy
        </span>
        <h1 className="text-xl font-semibold tracking-tight">
          Why Did My Video Die?
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          Auto-analysing your weakest video and turning it into a playbook.
        </p>
      </div>

      {/* Video picker */}
      {sel && (
        <div className="mb-4">
          <div
            className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/5 bg-[#0A0A0A] px-3 py-2"
            onClick={() => setOpen(!open)}
          >
            <img
              src={sel.thumbnail}
              alt=""
              className="h-11 w-[78px] flex-shrink-0 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="truncate text-[13px] font-semibold">{sel.title}</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {fmt(sel.views)} views · {avg > 0 ? Math.round((sel.views / avg) * 100) : 0}% of avg
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (channel && avg > 0) runDiag(sel, channel, avg);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-300"
              >
                <RefreshCw size={11} /> Re-analyse
              </button>
              <ChevronDown
                size={14}
                className={`text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </div>
          </div>

          {open && (
            <div className="mt-2 max-h-72 overflow-y-auto rounded-2xl border border-white/5 bg-[#0A0A0A] p-2">
              {sortedVids.map(v => {
                const dot =
                  v.views < avg * 0.5 ? "#f87171" : v.views < avg * 0.8 ? "#facc15" : "#4ade80";
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => pick(v)}
                    className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-white/5 ${
                      sel?.id === v.id ? "bg-white/5" : ""
                    }`}
                  >
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ background: dot }}
                    />
                    <img
                      src={v.thumbnail}
                      alt=""
                      className="h-9 w-[60px] flex-shrink-0 rounded-md object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[12px] font-semibold">{v.title}</p>
                      <p className="text-[10px] text-zinc-500">{fmt(v.views)} views</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

{/* VidIQ-style area chart */}
      {sel && avg > 0 && maxV > 0 && (() => {
        const thisColor = sel.views < avg * 0.7 ? "#f87171" : sel.views > avg * 1.2 ? "#4ade80" : "#facc15";
        const points = [
          { x: 0, v: sel.views, label: "This Video", color: thisColor },
          { x: 1, v: avg, label: "Avg", color: "#60a5fa" },
          { x: 2, v: maxV, label: "Best", color: "#4ade80" },
        ];
        const W = 320, H = 110, pad = 24;
        const xStep = (W - pad * 2) / 2;
        const toY = (v: number) => pad + (1 - v / maxV) * (H - pad * 2);
        const coords = points.map((p, i) => ({ x: pad + i * xStep, y: toY(p.v), ...p }));
        // smooth SVG path through all 3 points
        const pathD = coords.map((c, i) => {
          if (i === 0) return `M ${c.x} ${c.y}`;
          const prev = coords[i - 1];
          const cx = (prev.x + c.x) / 2;
          return `C ${cx} ${prev.y}, ${cx} ${c.y}, ${c.x} ${c.y}`;
        }).join(" ");
        const areaD = pathD + ` L ${coords[coords.length - 1].x} ${H} L ${coords[0].x} ${H} Z`;
        return (
          <div className="mb-4 rounded-2xl border border-white/5 bg-[#0A0A0A] p-4 cb-card-glow-blue">
            <div className="mb-3 flex items-center justify-between">
              <span className="cb-label block text-[11px] tracking-[0.18em] uppercase text-zinc-500">
                Performance vs Channel
              </span>
              <span className="text-[11px] text-zinc-400">This · Avg · Best</span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="h-28 w-full overflow-visible">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={thisColor} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={thisColor} stopOpacity="0.01" />
                </linearGradient>
              </defs>
              {/* horizontal grid lines */}
              {[0.25, 0.5, 0.75, 1].map(t => {
                const y = pad + (1 - t) * (H - pad * 2);
                return (
                  <line
                    key={t}
                    x1={pad}
                    x2={W - pad}
                    y1={y}
                    y2={y}
                    stroke="rgba(63,63,70,0.8)"
                    strokeWidth="1"
                  />
                );
              })}
              {/* area fill */}
              <path d={areaD} fill="url(#areaGrad)" />
              {/* line */}
              <path d={pathD} fill="none" stroke={thisColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* dots + labels */}
              {coords.map((c) => (
                <g key={c.label}>
                  <circle cx={c.x} cy={c.y} r="5" fill={c.color} stroke="#080809" strokeWidth="2" />
                  <text x={c.x} y={c.y - 10} textAnchor="middle" fill={c.color} fontSize="11" fontWeight="700">{fmt(c.v)}</text>
                  <text x={c.x} y={H - 4} textAnchor="middle" fill="#52525b" fontSize="9" fontWeight="600" letterSpacing="0.06em" style={{ textTransform: "uppercase" }}>{c.label}</text>
                </g>
              ))}
            </svg>
          </div>
        );
      })()}

      {/* Loading */}
      {loading && (
        <div className="mb-4 rounded-2xl border border-amber-400/40 bg-[#0A0A0A] p-4">
          <span className="cb-label mb-2 block text-amber-300">
            Performing autopsy on &quot;{sel?.title?.slice(0, 40)}&quot;...
          </span>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-300" />
          <div>
            <p className="text-sm font-semibold text-zinc-100">{error}</p>
            <button
              onClick={() => {
                if (sel && channel && avg > 0) runDiag(sel, channel, avg);
              }}
              className="mt-3 inline-flex items-center rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-1.5 text-[11px] font-semibold text-zinc-100"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Report */}
      {report && !loading && (
        <div className="space-y-4">
          {/* Critical failure + gauge */}
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-br from-rose-950/60 via-[#0A0A0A] to-[#050505] p-4 shadow-[0_0_40px_rgba(248,113,113,0.35)]">
              <p className="cb-label mb-2 flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-rose-300 cb-card-glow-red">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-rose-400" /> Critical Failure
              </p>
              <p className="text-sm font-semibold leading-relaxed">
                {sv(report.verdict)}
              </p>
              {report.failure_type && (
                <span className="mt-3 inline-block rounded-full border border-rose-400/50 bg-rose-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-200">
                  {sv(report.failure_type).replace(/_/g, " ")}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-[#0A0A0A] p-4">
              {(() => {
                const baseScore = report.title_score || 60;
                const revivalScore =
                  typeof report.revival_probability === "number"
                    ? report.revival_probability
                    : report.revival_possible
                      ? Math.min(95, Math.max(40, baseScore))
                      : 20;
                const radius = 30;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference - (revivalScore / 100) * circumference;
                const color =
                  revivalScore >= 70 ? "#4ade80" : revivalScore >= 45 ? "#facc15" : "#f97373";

                return (
                  <>
                    <div className="relative h-20 w-20">
                      <svg
                        viewBox="0 0 80 80"
                        className="h-20 w-20 -rotate-90"
                      >
                        <circle
                          cx="40"
                          cy="40"
                          r={radius}
                          stroke="rgba(63,63,70,0.6)"
                          strokeWidth="7"
                          fill="transparent"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r={radius}
                          stroke={color}
                          strokeWidth="7"
                          strokeLinecap="round"
                          fill="transparent"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          className="transition-all duration-700 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center rotate-90">
                        <span className="text-xs text-zinc-400">Revival</span>
                        <span className="text-lg font-semibold" style={{ color }}>
                          {revivalScore}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="cb-label text-[11px] tracking-[0.18em] uppercase text-zinc-500">
                        Revival Probability
                      </p>
                      <p className="text-[13px] text-zinc-300">
                        {report.revival_possible
                          ? "This video can be revived with the right edits."
                          : "Revival is unlikely — use this as a lesson for your next upload."}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Intelligence strips */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 rounded-2xl border border-white/5 bg-[#0A0A0A] p-4">
              <p className="cb-label flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-rose-300">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Title Intelligence
              </p>
              <p className="text-xs text-zinc-400">{sv(report.title_problem)}</p>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/5 px-3 py-2">
                <span className="cb-label text-[10px] text-emerald-300">Fixed Title</span>
                <p className="flex-1 text-[12px] font-semibold text-emerald-200 line-clamp-2">
                  {sv(report.title_fix)}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sv(report.title_fix));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-white/5 bg-[#0A0A0A] p-4">
              <p className="cb-label flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Thumbnail & Hook
              </p>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-rose-400" />
                  <p className="text-xs text-zinc-400">
                    {sv(report.thumbnail_problem)}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-sky-400" />
                  <p className="text-xs text-zinc-400">
                    {sv(report.hook_problem)}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-violet-400" />
                  <p className="text-xs text-zinc-400">
                    {sv(report.algorithm_reason)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic action plan */}
          <div className="rounded-2xl border border-amber-400/40 bg-[#0A0A0A] p-5">
            <p className="cb-label mb-2 text-[11px] tracking-[0.18em] uppercase text-amber-300">
              Strategic Action Plan
            </p>
            <p className="mb-3 text-xs text-zinc-400">
              Three precise moves to either revive this video or ensure the next one massively outperforms it.
            </p>
            <div className="space-y-2">
              {(report.do_this_now || []).map((a: string, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/30 px-3 py-2"
                >
                  <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/15 text-[11px] font-semibold text-amber-300">
                    {i + 1}
                  </span>
                  <p className="text-xs leading-relaxed text-zinc-200">
                    {sv(a)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
