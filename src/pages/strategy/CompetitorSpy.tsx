import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Eye, Target, Crosshair, ArrowRight, BarChart3, Swords,
  Brain, Zap, TrendingDown, TrendingUp, Sparkles, Crown,
  Lightbulb, Shield, ThumbsUp, Loader2, AlertCircle, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useChannelData } from "@/hooks/useChannelData";
import { formatCount } from "@/lib/utils";
import { callAI } from "@/lib/ai-service";
import { friendlyError } from "@/lib/errors";
import { fetchCompleteChannelData } from "@/lib/youtube-api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const s = (v: any): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

type Metric = "views" | "subscribers" | "videos";
type Timeframe = "30d" | "60d" | "12m";
type ViewType = "total" | "cumulative" | "daily";

function classifyCompetitorError(err: any) {
  const msg = (err?.message || "").toString();
  if (msg.includes("Channel not found")) {
    return {
      title: "Channel Not Found",
      message: "We couldn't find a YouTube channel for that handle or URL.",
      hint: "Try pasting the full URL from YouTube, like youtube.com/@channelname.",
    };
  }
  if (msg.includes("YouTube API keys exhausted") || msg.includes("quota")) {
    return {
      title: "YouTube API Rate Limit",
      message: "YouTube is temporarily refusing more requests from our API keys.",
      hint: "Wait a few minutes and try again, or test with a different competitor.",
    };
  }
  return {
    title: "Unexpected Diagnosis Error",
    message: "Something blocked the competitor scan before it could complete.",
    hint: "Check that the channel is public and exists, then try again.",
  };
}

async function fetchCompetitorChannel(input: string) {
  const data = await fetchCompleteChannelData(input);
  return {
    id: data.id,
    name: data.name,
    avatar: data.avatar,
    subscribers: data.subscribers,
    totalViews: data.totalViews,
    videos: data.videos || [],
  };
}

export default function CompetitorSpy() {
  const navigate = useNavigate();
  const { channel, videos, channelContext, isConnected } = useChannelData();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [error, setError] = useState("");
  const [competitor, setCompetitor] = useState<any>(null);
  const [compVideos, setCompVideos] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [myChannel, setMyChannel] = useState<any>(channel);
  const [metric, setMetric] = useState<Metric>("views");
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");
  const [viewType, setViewType] = useState<ViewType>("cumulative");
  const [diagOpen, setDiagOpen] = useState(false);
  const [diagTitle, setDiagTitle] = useState("");
  const [diagMessage, setDiagMessage] = useState("");
  const [diagHint, setDiagHint] = useState("");

  if (!isConnected) return null;

  async function analyze() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setReport(null);
    setCompetitor(null);
    setCompVideos([]);

    try {
      if (!channel) {
        navigate("/");
        return;
      }
      const myData = channel;
      const myVids = videos.slice(0, 8);
      setMyChannel(myData);

      setLoadMsg("🔍 Finding competitor channel...");
      const competitorData = await fetchCompetitorChannel(query.trim());
      setCompetitor(competitorData);
      setCompVideos(competitorData.videos || []);

      const myContext = `MY CHANNEL: ${myData.name}, ${myData.subscribers} subs, avg ${myData.avgViews} views. Videos: ${myVids.map((v: any) => `"${v.title}" ${v.views} views`).join(", ")}`;
      const compContext = `COMPETITOR: ${competitorData.name}, ${competitorData.subscribers} subs. Videos: ${(competitorData.videos||[]).slice(0, 6).map((v: any) => `"${v.title}" ${v.views} views`).join(", ")}`;

      function extractJson(text: string): any {
        if (!text) return null;
        try { return JSON.parse(text); } catch {}
        const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
        try { return JSON.parse(cleaned); } catch {}
        const i = cleaned.indexOf("{"), j = cleaned.lastIndexOf("}");
        if (i !== -1 && j !== -1) { try { return JSON.parse(cleaned.slice(i, j + 1)); } catch {} }
        return null;
      }

      setLoadMsg("🤖 Running battle analysis...");
      const r1 = await callAI(
        "Return ONLY raw JSON starting with {. No markdown. No explanation.",
        `Fill this JSON using the channel data below. Every field required.
{"battle_verdict":"","they_win_at":["","",""],"you_win_at":["","",""],"steal_these":[{"strength":"","how_to_steal":""},{"strength":"","how_to_steal":""},{"strength":"","how_to_steal":""}],"exploit_these":[{"weakness":"","how_to_exploit":""},{"weakness":"","how_to_exploit":""}],"topic_gaps":["","","",""],"title_formula":{"their_pattern":"","your_pattern":"","examples":["","",""]},"first_mover_topics":["","",""],"action_plan":["","",""]}
${myContext} ${compContext}`
      );

      const r2 = await callAI(
        "Return ONLY raw JSON starting with {. No markdown. No explanation.",
        `Fill this JSON using the channel data below. Every field required.
{"best_video":{"title":"","views":0,"why_it_worked":""},"weakest_videos":[{"title":"","views":0,"why_it_failed":""},{"title":"","views":0,"why_it_failed":""}],"growth_rate":{"yours":"","theirs":"","who_is_faster":""},"engagement_vs_views":{"yours":"","theirs":"","weakness":""},"upload_frequency":{"yours":"","theirs":"","recommendation":""},"thumbnail_style":{"their_style":"","your_style":"","recommendation":""},"if_you_posted":{"topic":"","predicted_views":0,"reasoning":""}}
${myContext} ${compContext}`
      );

      const p1 = extractJson(r1), p2 = extractJson(r2);
      if (!p1 && !p2) { setError("Analysis failed to parse — please try again."); setLoading(false); return; }
      setReport({ ...(p1 || {}), ...(p2 || {}) });
    } catch (err: any) {
      const diag = classifyCompetitorError(err);
      setDiagTitle(diag.title);
      setDiagMessage(diag.message);
      setDiagHint(diag.hint);
      setDiagOpen(true);
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  const compareData = useMemo(() => {
    if (!myChannel || !competitor) return [];

    const now = new Date();
    const daysBack = timeframe === "30d" ? 30 : timeframe === "60d" ? 60 : 365;
    const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    const buildSeries = (vids: any[], subs: number) => {
      const byDay: Record<string, number> = {};
      vids.forEach((v) => {
        if (!v.publishedAt) return;
        const d = new Date(v.publishedAt);
        if (d < cutoff) return;
        const key = d.toISOString().slice(0, 10);
        if (!byDay[key]) byDay[key] = 0;
        if (metric === "views") byDay[key] += v.views || 0;
        if (metric === "videos") byDay[key] += 1;
        if (metric === "subscribers") byDay[key] = subs;
      });
      const days = Object.keys(byDay).sort();
      let running = 0;
      return days.map((key) => {
        const base = byDay[key];
        running += base;
        const value =
          viewType === "daily" ? base :
          viewType === "total" ? base :
          running;
        return { key, value };
      });
    };

    const mine = buildSeries(videos, myChannel.subscribers || myChannel.subscriberCount || 0);
    const theirs = buildSeries(compVideos, competitor.subscribers || competitor.subscriberCount || 0);

    const allKeys = Array.from(new Set([...mine.map(d => d.key), ...theirs.map(d => d.key)])).sort();

    return allKeys.map((key) => {
      const m = mine.find(d => d.key === key);
      const t = theirs.find(d => d.key === key);
      const dateLabel = new Date(key).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return {
        date: dateLabel,
        mine: m?.value ?? null,
        them: t?.value ?? null,
      };
    });
  }, [myChannel, competitor, videos, compVideos, metric, timeframe, viewType]);

  const metricLabel = metric === "views" ? "Views" : metric === "videos" ? "Videos" : "Subscribers";

  return (
    <div className="p-6 md:p-8 max-w-[1100px] mx-auto bg-[#050505] min-h-screen text-zinc-100">
      <Dialog open={diagOpen} onOpenChange={setDiagOpen}>
        <DialogContent className="bg-[#050505] border border-red-500/40 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> {diagTitle}
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-300">
              {diagMessage}
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs text-zinc-500 mt-2">{diagHint}</p>
          <Button
            className="mt-4 w-full rounded-xl bg-red-500/10 text-red-300 border border-red-500/40 hover:bg-red-500/20"
            variant="outline"
            onClick={() => setDiagOpen(false)}
          >
            Close and Try Again
          </Button>
        </DialogContent>
      </Dialog>

      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-violet-500/10 border border-violet-400/30">
            <Crosshair className="h-7 w-7 text-violet-300" />
          </div>
          <div>
            <h1 className="t-page bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-100 bg-clip-text text-transparent tracking-[0.22em] uppercase text-xs mb-1">
              Competitor Spy
            </h1>
            <p className="text-sm text-zinc-400">Luxury-grade competitive intelligence on your niche.</p>
          </div>
        </div>
      </div>

      {/* INPUT COMMAND CENTER */}
      <div className="rounded-2xl p-8 mb-8 border border-white/5 bg-gradient-to-b from-violet-950/40 via-[#0A0A0A] to-[#050505] shadow-[0_0_40px_rgba(124,58,237,0.40)]">
        <div className="max-w-lg mx-auto text-center">
          <p className="t-label mb-3 text-violet-300 tracking-[0.2em] uppercase text-[11px]">🕵️ Spy Mode Active</p>
          <h2 className="text-xl font-semibold text-zinc-50 mb-2">Enter Competitor Channel</h2>
          <p className="text-sm text-zinc-400 mb-6">Channel name, @handle, or full YouTube URL. We&apos;ll run a full intel sweep.</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && analyze()}
              placeholder="@technoblade, MrBeast, or paste any YouTube URL"
              className="h-13 rounded-xl text-base bg-black/40 border-violet-400/40 text-zinc-100 placeholder:text-zinc-600"
              inputMode="url"
              autoComplete="off"
            />
            <Button
              onClick={analyze}
              disabled={loading || !query.trim()}
              className="h-[52px] px-6 rounded-xl font-bold shrink-0 bg-gradient-to-r from-violet-500 to-fuchsia-400 text-black hover:from-violet-400 hover:to-fuchsia-300"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Run Intel <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </div>
          {loading && (
            <p className="text-sm text-zinc-400 mt-4 animate-pulse">{loadMsg}</p>
          )}
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-zinc-100">Competitor scan failed</p>
            <p className="text-xs text-zinc-400 mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 rounded-xl border-red-500/40 text-red-200 hover:bg-red-500/10"
              onClick={analyze}
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {report && competitor && (
        <div className="space-y-8">
          {/* COMPARE PERFORMANCE GRAPH */}
          {compareData.length > 0 && (
            <motion.div
              variants={fade}
              initial="hidden"
              animate="show"
              className="rounded-2xl border border-white/5 bg-[#0A0A0A] p-6 shadow-[0_0_40px_rgba(0,0,0,0.7)]"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <p className="t-label text-[11px] tracking-[0.2em] uppercase text-zinc-500 mb-1">
                    Compare Performance
                  </p>
                  <p className="text-sm text-zinc-300">
                    {metricLabel} over time · You vs {competitor.name}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-1 py-1">
                    {(["views", "subscribers", "videos"] as Metric[]).map(m => (
                      <button
                        key={m}
                        onClick={() => setMetric(m)}
                        className={`px-3 py-1 text-xs rounded-full transition-all ${
                          metric === m
                            ? "bg-zinc-100 text-black shadow-[0_0_18px_rgba(255,255,255,0.25)]"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {m === "views" ? "Views" : m === "subscribers" ? "Subs" : "Videos"}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-1 py-1">
                    {(["30d", "60d", "12m"] as Timeframe[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setTimeframe(t)}
                        className={`px-3 py-1 text-xs rounded-full transition-all ${
                          timeframe === t
                            ? "bg-zinc-100 text-black shadow-[0_0_18px_rgba(255,255,255,0.25)]"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {t === "30d" ? "30 Days" : t === "60d" ? "60 Days" : "12 Months"}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-1 py-1">
                    {(["total", "cumulative", "daily"] as ViewType[]).map(v => (
                      <button
                        key={v}
                        onClick={() => setViewType(v)}
                        className={`px-3 py-1 text-xs rounded-full transition-all ${
                          viewType === v
                            ? "bg-zinc-100 text-black shadow-[0_0_18px_rgba(255,255,255,0.25)]"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={compareData} margin={{ left: -20, right: 0, top: 10, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(148,163,184,0.18)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => formatCount(v || 0)}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        return (
                          <div className="backdrop-blur-md bg-black/80 border border-white/10 rounded-2xl px-4 py-3 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-2">
                              {label}
                            </p>
                            {payload.map((p: any) => (
                              <div key={p.dataKey} className="flex items-center justify-between gap-3 text-xs mb-1 last:mb-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: p.color }}
                                  />
                                  <span className="text-zinc-300">
                                    {p.dataKey === "mine" ? (myChannel?.name || "You") : (competitor?.name || "Them")}
                                  </span>
                                </div>
                                <span className="font-semibold text-zinc-100">
                                  {formatCount(p.value || 0)} {metricLabel.toLowerCase()}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: 8 }}
                      formatter={(value: string) =>
                        value === "mine" ? (myChannel?.name || "You") : (competitor?.name || "Them")
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="mine"
                      stroke="#a855f7"
                      strokeWidth={2.2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name="You"
                    />
                    <Line
                      type="monotone"
                      dataKey="them"
                      stroke="#38bdf8"
                      strokeWidth={2.2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name={competitor?.name || "Them"}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
          {/* BATTLE VERDICT */}
          <motion.div variants={fade} initial="hidden" animate="show" className="cb-card cb-card-verdict cb-card-glow-yellow relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ background: "radial-gradient(circle at center, #facc15, transparent 70%)" }} />
            <div className="relative z-10">
              <p className="t-label mb-3" style={{ color: "#facc15" }}>⚔️ BATTLE VERDICT</p>
              <p className="text-xl font-bold text-foreground mb-6">{s(report.battle_verdict)}</p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                <div className="text-center">
                  {myChannel?.avatar && <img src={myChannel.avatar} className="h-12 w-12 rounded-full mx-auto mb-2" style={{ boxShadow: "0 0 0 2px #4ade80" }} alt="" />}
                  <p className="text-sm font-bold text-foreground">{myChannel?.name || myChannel?.title}</p>
                  <p className="text-lg font-bold" style={{ color: "#4ade80" }}>{formatCount(myChannel?.subscribers || myChannel?.subscriberCount || 0)}</p>
                  <p className="text-xs text-muted-foreground">subscribers</p>
                </div>
                <div className="text-center">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: "rgba(250,204,21,0.15)" }}>
                    <Swords className="h-5 w-5" style={{ color: "#facc15" }} />
                  </div>
                </div>
                <div className="text-center">
                  {competitor?.avatar && <img src={competitor.avatar} className="h-12 w-12 rounded-full mx-auto mb-2" style={{ boxShadow: "0 0 0 2px #f87171" }} alt="" />}
                  <p className="text-sm font-bold text-foreground">{competitor?.name || competitor?.title}</p>
                  <p className="text-lg font-bold" style={{ color: "#f87171" }}>{formatCount(competitor?.subscriberCount || competitor?.subscribers || 0)}</p>
                  <p className="text-xs text-muted-foreground">subscribers</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* WIN / LOSE SPLIT */}
          <div className="grid md:grid-cols-2 gap-4">
            <motion.div variants={fade} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="cb-card cb-card-problem cb-card-glow-red">
              <p className="t-label mb-3 flex items-center gap-2" style={{ color: "#f87171" }}>
                <TrendingDown className="h-4 w-4" /> They Win At
              </p>
              <div className="space-y-2">
                {(report.they_win_at || []).map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#f87171" }} />
                    <p className="text-sm text-foreground">{s(item)}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fade} initial="hidden" animate="show" transition={{ delay: 0.15 }} className="cb-card cb-card-win cb-card-glow-green">
              <p className="t-label mb-3 flex items-center gap-2" style={{ color: "#4ade80" }}>
                <TrendingUp className="h-4 w-4" /> You Win At
              </p>
              <div className="space-y-2">
                {(report.you_win_at || []).map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <ThumbsUp className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#4ade80" }} />
                    <p className="text-sm text-foreground">{s(item)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* STEAL & EXPLOIT */}
          <div className="grid md:grid-cols-2 gap-4">
            <motion.div variants={fade} initial="hidden" animate="show" transition={{ delay: 0.2 }} className="cb-card">
              <p className="t-label mb-3 flex items-center gap-2" style={{ color: "#60a5fa" }}>
                <Eye className="h-4 w-4" /> Steal These
              </p>
              <div className="space-y-4">
                {(report.steal_these || []).map((item: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.1)" }}>
                    <p className="text-sm font-semibold text-foreground">{s(item.strength)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s(item.how_to_steal)}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fade} initial="hidden" animate="show" transition={{ delay: 0.25 }} className="cb-card">
              <p className="t-label mb-3 flex items-center gap-2" style={{ color: "#f87171" }}>
                <Target className="h-4 w-4" /> Exploit These
              </p>
              <div className="space-y-4">
                {(report.exploit_these || []).map((item: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.1)" }}>
                    <p className="text-sm font-semibold text-foreground">{s(item.weakness)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s(item.how_to_exploit)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* TITLE FORMULA */}
          {report.title_formula && (
            <motion.div variants={fade} initial="hidden" animate="show" transition={{ delay: 0.3 }} className="cb-card cb-card-ai">
              <div className="flex items-center justify-between mb-4">
                <p className="t-label flex items-center gap-2" style={{ color: "#60a5fa" }}>
                  <Brain className="h-4 w-4" /> Title Formula Decoder
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa" }}>AI INSIGHT</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg" style={{ background: "rgba(248,113,113,0.06)" }}>
                  <p className="t-label text-muted-foreground mb-1">Their Pattern</p>
                  <p className="text-sm text-foreground">{s(report.title_formula.their_pattern)}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: "rgba(74,222,128,0.06)" }}>
                  <p className="t-label text-muted-foreground mb-1">Your Pattern</p>
                  <p className="text-sm text-foreground">{s(report.title_formula.your_pattern)}</p>
                </div>
              </div>
              {(report.title_formula.examples || []).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Steal These Title Formulas</p>
                  {report.title_formula.examples.map((ex: string, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-2 rounded-lg" style={{ background: "rgba(167,139,250,0.06)" }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: "#a78bfa" }}>#{i + 1}</span>
                        <p className="text-sm text-foreground">&quot;{s(ex)}&quot;</p>
                      </div>
                      <button onClick={() => navigator.clipboard.writeText(s(ex))} className="text-xs px-3 py-1 rounded-lg shrink-0" style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa" }}>Copy</button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* THEIR BEST VIDEO */}
          {report.best_video && (
            <motion.div variants={fade} initial="hidden" animate="show" transition={{ delay: 0.35 }} className="cb-card">
              <p className="t-label mb-3 flex items-center gap-2" style={{ color: "#facc15" }}>
                <Crown className="h-4 w-4" /> Their #1 Best Video
              </p>
              {competitor && (
                <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: "rgba(250,204,21,0.04)", border: "1px solid rgba(250,204,21,0.1)" }}>
                  <img src={competitor.avatar} className="h-10 w-10 rounded-full" alt="" />
                  <div>
                    <p className="text-xs text-muted-foreground">Best performing video from</p>
                    <p className="text-sm font-semibold text-foreground">{competitor.name || competitor.title}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground">total channel views</p>
                    <p className="text-sm font-bold" style={{ color: "#facc15" }}>{formatCount(competitor.viewCount || competitor.totalViews || 0)}</p>
                  </div>
                </div>
              )}
              <p className="text-lg font-bold text-foreground mb-1">&quot;{s(report.best_video.title)}&quot;</p>
              <p className="text-sm font-semibold mb-2" style={{ color: "#facc15" }}>
                {typeof report.best_video.views === "number" ? formatCount(report.best_video.views) : s(report.best_video.views)} views
              </p>
              <p className="text-sm text-muted-foreground mb-4">{s(report.best_video.why_it_worked)}</p>
              <Button size="sm" onClick={() => navigate(`/create/video-machine?topic=${encodeURIComponent(s(report.best_video.title))}`)}>
                Make a Better Version <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </motion.div>
          )}

          {/* COMPETITOR VIDEO GRID */}
          {compVideos.length > 0 && (
            <motion.div variants={fade} initial="hidden" animate="show" transition={{ delay: 0.37 }} className="cb-card">
              <div className="flex items-center justify-between mb-4">
                <p className="t-label flex items-center gap-2" style={{ color: "#60a5fa" }}>
                  <Eye className="h-4 w-4" /> Their Recent Videos — Real Data
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse" style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}>
                  LIVE FROM YOUTUBE
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {compVideos.slice(0, 10).map((v: any, i: number) => (
                  <a key={i} href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" className="group cursor-pointer">
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                      <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs font-bold text-white">▶ Watch</span>
                      </div>
                      <div className="absolute bottom-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}>
                        {formatCount(v.viewCount || v.views || 0)}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 group-hover:text-foreground transition-colors">{v.title}</p>
                  </a>
                ))}
              </div>
            </motion.div>
          )}

          {/* BATTLE STATS ROW */}
          <div className="grid md:grid-cols-3 gap-4">
            {report.growth_rate && (
              <motion.div variants={fade} initial="hidden" animate="show" transition={{ delay: 0.4 }} className="cb-card">
                <p className="t-label mb-3 flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4" /> Growth Rate</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><p className="text-xs text-muted-foreground">You</p><p className="text-sm font-semibold" style={{ color: "#4ade80" }}>{s(report.growth_rate.yours)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Them</p><p className="text-sm font-semibold" style={{ color: "#f87171" }}>{s(report.growth_rate.theirs)}</p></div>
                </div>
                <p className="text-xs text-muted-foreground">🏁 {s(report.growth_rate.who_is_faster)}</p>
              </motion.div>
            )}
            {report.engagement_vs_views && (
              <motion.div variants={fade} initial="hidden" animate="show" transition={{ delay: 0.45 }} className="cb-card">
                <p className="t-label mb-3 flex items-center gap-2 text-muted-foreground"><BarChart3 className="h-4 w-4" /> Engagement</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><p className="text-xs text-muted-foreground">You</p><p className="text-sm font-semibold" style={{ color: "#4ade80" }}>{s(report.engagement_vs_views.yours)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Them</p><p className="text-sm font-semibold" style={{ color: "#f87171" }}>{s(report.engagement_vs_views.theirs)}</p></div>
                </div>
                <p className="text-xs text-muted-foreground">⚡ {s(report.engagement_vs_views.weakness)}</p>
              </motion.div>
            )}
            {report.upload_frequency && (
              <motion.div variants={fade} initial="hidden" animate="show" transition={{ delay: 0.5 }} className="cb-card">
                <p className="t-label mb-3 flex items-center gap-2 text-muted-foreground"><Zap className="h-4 w-4" /> Upload Speed</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><p className="text-xs text-muted-foreground">You</p><p className="text-sm font-semibold" style={{ color: "#4ade80" }}>{s(report.upload_frequency.yours)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Them</p><p className="text-sm font-semibold" style={{ color: "#f87171" }}>{s(report.upload_frequency.theirs)}</p></div>
                </div>
                <p className="text-xs text-muted-foreground">💡 {s(report.upload_frequency.recommendation)}</p>
              </motion.div>
            )}
          </div>

          {/* FIRST MOVER TOPICS */}
          {(report.first_mover_topics || []).length > 0 && (
            <motion.div variants={fade} initial="hidden" animate="show" transition={{ delay: 0.55 }} className="cb-card">
              <p className="t-label mb-2 flex items-center gap-2" style={{ color: "#4ade80" }}>
                <Sparkles className="h-4 w-4" /> First Mover Opportunities
              </p>
              <p className="text-xs text-muted-foreground mb-4">Topics neither channel covers yet — post first to own them</p>
              <div className="space-y-3">
                {report.first_mover_topics.map((topic: string, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all hover:translate-y-[-2px]" style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.12)" }} onClick={() => navigate(`/create/video-machine?topic=${encodeURIComponent(s(topic))}`)}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#4ade80" }} /><span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#4ade80" }} /></span>
                        <span className="text-[10px] font-bold uppercase" style={{ color: "#4ade80" }}>UNCLAIMED</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{s(topic)}</p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80" }}>Post First →</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TOPIC GAPS */}
          {(report.topic_gaps || []).length > 0 && (
            <motion.div variants={fade} initial="hidden" animate="show" transition={{ delay: 0.6 }} className="cb-card">
              <p className="t-label mb-2 flex items-center gap-2" style={{ color: "#a78bfa" }}>
                <Lightbulb className="h-4 w-4" /> Topic Gaps
              </p>
              <p className="text-xs text-muted-foreground mb-4">Topics they cover that you don&apos;t — potential growth areas</p>
              <div className="flex flex-wrap gap-2">
                {report.topic_gaps.map((t: string, i: number) => (
                  <button key={i} className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105" style={{ background: "rgba(167,139,250,0.08)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.15)" }} onClick={() => navigate(`/create/video-machine?topic=${encodeURIComponent(s(t))}`)}>
                    {s(t)} →
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* WEAKEST VIDEOS */}
          {(report.weakest_videos || []).length > 0 && (
            <motion.div variants={fade} initial="hidden" animate="show" transition={{ delay: 0.65 }} className="cb-card">
              <div className="flex items-center justify-between mb-1">
                <p className="t-label flex items-center gap-2" style={{ color: "#f87171" }}>
                  <TrendingDown className="h-4 w-4" /> Their Weakest Videos
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>AVOID THESE TOPICS</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">These flopped for them — don&apos;t make the same mistake</p>
              <div className="space-y-3">
                {report.weakest_videos.map((v: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.1)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-foreground">&quot;{s(v.title)}&quot;</p>
                      <span className="text-xs font-bold" style={{ color: "#f87171" }}>{typeof v.views === "number" ? formatCount(v.views) : s(v.views)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{s(v.why_it_failed)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* IF YOU POSTED THIS */}
          {report.if_you_posted && (
            <motion.div variants={fade} initial="hidden" animate="show" transition={{ delay: 0.7 }} className="rounded-2xl p-8 text-center relative overflow-hidden" style={{ background: "radial-gradient(ellipse at center, rgba(167,139,250,0.08), var(--cb-card))", border: "1px solid rgba(167,139,250,0.15)" }}>
              <div className="absolute inset-0 opacity-5" style={{ background: "radial-gradient(circle at center, #a78bfa, transparent 70%)" }} />
              <div className="relative z-10">
                <p className="t-label mb-2 flex items-center justify-center gap-2" style={{ color: "#a78bfa" }}>
                  <Sparkles className="h-4 w-4" /> If You Posted Their Best Topic
                </p>
                <p className="text-lg font-bold text-foreground mb-4">&quot;{s(report.if_you_posted.topic)}&quot;</p>
                <p className="data-number mb-1" style={{ color: "#a78bfa" }}>
                  {typeof report.if_you_posted.predicted_views === "number" ? formatCount(report.if_you_posted.predicted_views) : s(report.if_you_posted.predicted_views)}
                </p>
                <p className="text-sm text-muted-foreground mb-4">predicted views</p>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{s(report.if_you_posted.reasoning)}</p>
                <Button onClick={() => navigate(`/create/video-machine?topic=${encodeURIComponent(s(report.if_you_posted.topic))}`)}>
                  Build This Video Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* 3-STEP ACTION PLAN */}
          {(report.action_plan || []).length > 0 && (
            <motion.div variants={fade} initial="hidden" animate="show" transition={{ delay: 0.75 }} className="cb-card" style={{ borderLeft: "4px solid #4ade80" }}>
              <p className="t-label mb-4 flex items-center gap-2" style={{ color: "#4ade80" }}>
                <Shield className="h-4 w-4" /> Your 3 Moves This Week
              </p>
              <div className="space-y-4 mb-6">
                {report.action_plan.map((action: string, i: number) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold" style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80" }}>
                      {i + 1}
                    </div>
                    <p className="text-sm text-foreground pt-0.5">{s(action)}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(report.action_plan.map((a: string, i: number) => `${i + 1}. ${s(a)}`).join("\n"))}
                className="w-full h-10 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "rgba(74,222,128,0.08)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.15)" }}
              >
                Copy Action Plan
              </button>
            </motion.div>
          )}

          {/* COPY FULL REPORT */}
          {report && (
            <button
              onClick={() => {
                const text = `COMPETITOR INTELLIGENCE REPORT\nGenerated by CreatorBrain\n\n⚔️ VERDICT: ${s(report.battle_verdict)}\n\n✅ YOU WIN AT:\n${(report.you_win_at || []).map((i: string, n: number) => `${n + 1}. ${s(i)}`).join("\n")}\n\n⚠️ THEY WIN AT:\n${(report.they_win_at || []).map((i: string, n: number) => `${n + 1}. ${s(i)}`).join("\n")}\n\n🎯 YOUR 3 MOVES THIS WEEK:\n${(report.action_plan || []).map((i: string, n: number) => `${n + 1}. ${s(i)}`).join("\n")}\n\n🚀 FIRST MOVER TOPICS:\n${(report.first_mover_topics || []).map((t: string) => `• ${s(t)}`).join("\n")}\n\nGenerated free at creatorbrain.app`;
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="w-full h-12 rounded-xl font-bold text-sm transition-all mt-4"
              style={{
                background: copied ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)",
                color: copied ? "#4ade80" : "hsl(var(--foreground))",
                border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"}`
              }}
            >
              {copied ? (
                <span className="flex items-center justify-center gap-2"><Check className="h-4 w-4" /> Copied to clipboard!</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Copy className="h-4 w-4" /> Copy Full Report</span>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
