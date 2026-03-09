import { useState } from "react";
import { motion } from "framer-motion";
import {
  Eye, Target, Crosshair, ArrowRight, BarChart3, Swords,
  Brain, Zap, TrendingDown, TrendingUp, Sparkles, Crown,
  Lightbulb, Shield, ThumbsUp, Loader2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useChannelData } from "@/hooks/useChannelData";
import { searchChannel, getChannelById, getChannelVideos, formatCount } from "@/lib/youtube-api";
import { callAI, parseJsonSafely } from "@/lib/ai-service";

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

  if (!isConnected) return null;

  async function analyze() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setReport(null);
    setCompetitor(null);
    setCompVideos([]);

    // Clean the input into a bare handle or channel name
    let cleanQuery = query.trim()
      .replace("https://", "")
      .replace("http://", "")
      .replace("www.youtube.com/", "")
      .replace("youtube.com/", "")
      .replace("@", "")
      .split("/")[0]
      .split("?")[0]
      .trim();

    try {
      setLoadMsg("🔍 Finding competitor channel...");
      const compId = await searchChannel(cleanQuery);
      if (!compId) throw new Error("Channel not found. Try their exact @handle.");

      setLoadMsg("📊 Loading competitor data...");
      const comp = await getChannelById(compId);
      if (!comp) throw new Error("Could not load channel data.");
      setCompetitor(comp);

      const compVids = await getChannelVideos(compId, 10);
      setCompVideos(compVids);

      const myContext = `MY CHANNEL:\nName: ${channel?.name}\nSubscribers: ${formatCount(channel?.subscribers || 0)}\nAvg Views: ${formatCount(channel?.avgViews || 0)}\nUpload Frequency: ${channel?.uploadFrequency}\nRecent Videos:\n${videos.slice(0, 8).map(v => `- "${v.title}" → ${formatCount(v.views)} views, ${v.likes} likes`).join("\n")}`;

      const compContext = `COMPETITOR CHANNEL:\nName: ${comp.title || comp.name}\nSubscribers: ${formatCount(comp.subscriberCount || comp.subscribers || 0)}\nTotal Views: ${formatCount(comp.viewCount || comp.totalViews || 0)}\nRecent Videos:\n${compVids.slice(0, 8).map((v: any) => `- "${v.title}" → ${formatCount(v.viewCount || v.views || 0)} views`).join("\n")}`;

      setLoadMsg("🤖 Running battle analysis...");
      const result = await callAI(
        `You are a YouTube competitive intelligence expert. Analyse these two channels and return ONLY a JSON object. No markdown. No explanation. No backticks. Start your response with { and end with }

The JSON must have exactly these keys:
battle_verdict, they_win_at, you_win_at, steal_these, exploit_these, topic_gaps, upload_frequency, title_formula, thumbnail_style, best_video, first_mover_topics, weakest_videos, growth_rate, engagement_vs_views, if_you_posted, action_plan

battle_verdict: string
they_win_at: array of 3 strings
you_win_at: array of 3 strings
steal_these: array of 3 objects each with keys strength and how_to_steal
exploit_these: array of 2 objects each with keys weakness and how_to_exploit
topic_gaps: array of 4 strings
upload_frequency: object with keys yours theirs recommendation
title_formula: object with keys their_pattern your_pattern examples (array of 3 strings)
thumbnail_style: object with keys their_style your_style recommendation
best_video: object with keys title views why_it_worked
first_mover_topics: array of 3 strings
weakest_videos: array of 2 objects each with keys title views why_it_failed
growth_rate: object with keys yours theirs who_is_faster
engagement_vs_views: object with keys yours theirs weakness
if_you_posted: object with keys topic predicted_views reasoning
action_plan: array of 3 strings`,
        `${myContext}\n\n${compContext}`
      );

      let parsed = parseJsonSafely(result);
      if (!parsed) {
        const start = result.indexOf("{");
        const end = result.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          try { parsed = JSON.parse(result.slice(start, end + 1)); } catch {}
        }
      }

      if (!parsed) {
        setError("AI returned an unexpected format. Please try again — this usually works on the second attempt.");
        setLoading(false);
        return;
      }

      setReport(parsed);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-[960px] mx-auto">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <Crosshair className="h-7 w-7" style={{ color: "#a78bfa" }} />
          </div>
          <div>
            <h1 className="t-page">Intelligence Report</h1>
            <p className="text-muted-foreground">12-dimension competitive battle analysis</p>
          </div>
        </div>
      </div>

      {/* INPUT COMMAND CENTER */}
      <div className="rounded-2xl p-8 mb-8" style={{ background: "radial-gradient(ellipse at top, #0d0511 0%, var(--cb-card) 60%)", border: "1px solid rgba(167,139,250,0.15)" }}>
        <div className="max-w-lg mx-auto text-center">
          <p className="t-label mb-4" style={{ color: "#a78bfa" }}>🕵️ SPY MODE ACTIVE</p>
          <h2 className="t-section text-foreground mb-2">Enter Competitor Channel</h2>
          <p className="text-sm text-muted-foreground mb-6">Channel name, @handle, or full YouTube URL. We&apos;ll run a full intel sweep.</p>

          <div className="flex gap-3">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && analyze()}
              placeholder="@technoblade, MrBeast, or paste any YouTube URL"
              className="h-13 rounded-xl text-base"
              style={{ background: "rgba(0,0,0,0.4)", borderColor: "rgba(167,139,250,0.3)", height: "52px" }}
            />
            <Button onClick={analyze} disabled={loading || !query.trim()} className="h-[52px] px-6 rounded-xl font-bold" style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Run Intel <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </div>
          {loading && (
            <p className="text-sm text-muted-foreground mt-4 animate-pulse">{loadMsg}</p>
          )}
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="cb-card cb-card-problem mb-8">
          <AlertCircle className="h-6 w-6 text-destructive mb-3" />
          <div>
            <p className="font-semibold text-foreground">Analysis failed</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={analyze}>Try Again</Button>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {report && competitor && (
        <div className="space-y-8">
          {/* BATTLE VERDICT */}
          <motion.div variants={fade} initial="hidden" animate="show" className="cb-card cb-card-verdict relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ background: "radial-gradient(circle at center, #facc15, transparent 70%)" }} />
            <div className="relative z-10">
              <p className="t-label mb-3" style={{ color: "#facc15" }}>⚔️ BATTLE VERDICT</p>
              <p className="text-xl font-bold text-foreground mb-6">{s(report.battle_verdict)}</p>

              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  {channel?.avatar && <img src={channel.avatar} className="h-10 w-10 rounded-full mx-auto mb-2" alt="" />}
                  <p className="text-xs text-muted-foreground">You</p>
                  <p className="text-lg font-bold" style={{ color: "#4ade80" }}>{formatCount(channel?.subscribers || 0)}</p>
                </div>
                <div className="text-center">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: "rgba(250,204,21,0.15)" }}>
                    <Swords className="h-5 w-5" style={{ color: "#facc15" }} />
                  </div>
                </div>
                <div className="text-center">
                  {competitor?.avatar && <img src={competitor.avatar} className="h-10 w-10 rounded-full mx-auto mb-2" alt="" />}
                  <p className="text-xs text-muted-foreground">Them</p>
                  <p className="text-lg font-bold" style={{ color: "#f87171" }}>{formatCount(competitor?.subscriberCount || competitor?.subscribers || 0)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* WIN / LOSE SPLIT */}
          <div className="grid md:grid-cols-2 gap-4">
            <motion.div variants={fade} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="cb-card cb-card-problem">
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

            <motion.div variants={fade} initial="hidden" animate="show" transition={{ delay: 0.15 }} className="cb-card cb-card-win">
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
        </div>
      )}
    </div>
  );
}
