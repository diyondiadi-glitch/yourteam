import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Shield, Target, Crosshair, ArrowRight, BarChart3, Swords, Brain, ThumbsUp, Zap, TrendingDown, TrendingUp, Sparkles, Crown, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FeaturePage from "@/components/FeaturePage";
import LoadingSteps from "@/components/LoadingSteps";
import CopyButton from "@/components/CopyButton";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/youtube-auth";
import { getMyChannel, getRecentVideos, getChannelContext, searchChannel, getChannelById, getChannelVideos, formatCount, type ChannelData, type VideoData } from "@/lib/youtube-api";
import { callGroq, parseJsonFromResponse } from "@/lib/groq-api";

interface SpyReport {
  they_win_at: string[];
  you_win_at: string[];
  steal_these: { strength: string; how_to_steal: string }[];
  exploit_these: { weakness: string; how_to_exploit: string }[];
  topic_gaps: string[];
  upload_frequency: { yours: string; theirs: string; recommendation: string };
  title_formula: { their_pattern: string; your_pattern: string; examples: string[] };
  thumbnail_style: { their_style: string; your_style: string; recommendation: string };
  best_video: { title: string; views: number; why_it_worked: string };
  comment_sentiment: { yours: string; theirs: string; who_wins: string };
  first_mover_topics: string[];
  weakest_videos: { title: string; views: number; why_it_failed: string }[];
  growth_rate: { yours: string; theirs: string; who_is_faster: string };
  engagement_vs_views: { yours: string; theirs: string; weakness: string };
  if_you_posted: { topic: string; predicted_views: number; reasoning: string };
}

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } },
};

export default function CompetitorSpy() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [myChannel, setMyChannel] = useState<ChannelData | null>(null);
  const [competitor, setCompetitor] = useState<ChannelData | null>(null);
  const [report, setReport] = useState<SpyReport | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { navigate("/", { replace: true }); return; }
  }, []);

  async function analyze() {
    if (!query.trim()) return;
    setLoading(true);
    setReport(null);
    setLoadStep(0);

    try {
      const ch = await getMyChannel();
      setMyChannel(ch);
      const myVids = await getRecentVideos(ch.id, 10);
      setLoadStep(1);

      const compId = await searchChannel(query);
      if (!compId) throw new Error("Channel not found");
      const comp = await getChannelById(compId);
      if (!comp) throw new Error("Channel not found");
      setCompetitor(comp);
      const compVids = await getChannelVideos(compId, 10);
      setLoadStep(2);

      const myContext = getChannelContext(ch, myVids);
      const compSummary = `Competitor: ${comp.title}\nSubscribers: ${formatCount(comp.subscriberCount)}\nTotal Views: ${formatCount(comp.viewCount)}\nVideos: ${comp.videoCount}\nRecent Videos:\n${compVids.map(v => `"${v.title}" - ${v.viewCount} views, ${v.likeCount} likes, ${v.commentCount} comments`).join("\n")}`;

      const result = await callGroq(
        `Compare these two YouTube channels comprehensively. Return JSON with ALL these fields:
- they_win_at (array of strings)
- you_win_at (array of strings)
- steal_these (array of {strength, how_to_steal})
- exploit_these (array of {weakness, how_to_exploit})
- topic_gaps (array of topics they cover that you don't)
- upload_frequency ({yours: string, theirs: string, recommendation: string})
- title_formula ({their_pattern: string describing their exact title formula, your_pattern: string, examples: array of 3 example titles})
- thumbnail_style ({their_style: string, your_style: string, recommendation: string})
- best_video ({title: string, views: number, why_it_worked: string})
- comment_sentiment ({yours: string like "Positive 82%", theirs: string, who_wins: string})
- first_mover_topics (array of trending topics neither covers yet)
- weakest_videos (array of 3 {title, views, why_it_failed})
- growth_rate ({yours: string, theirs: string, who_is_faster: string})
- engagement_vs_views ({yours: string like "4.2% engagement", theirs: string, weakness: string})
- if_you_posted ({topic: string from their best video, predicted_views: number, reasoning: string})`,
        `YOUR CHANNEL:\n${myContext}\n\nCOMPETITOR:\n${compSummary}`
      );

      const parsed = parseJsonFromResponse(result);
      if (parsed) setReport(parsed);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const s = (v: any) => typeof v === "string" ? v : JSON.stringify(v);

  return (
    <FeaturePage emoji="🕵️" title="Intelligence Report" description="Deep competitive analysis with 10 strategic dimensions">
      {/* Input */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="cb-card-glow p-8 text-center" style={{ borderColor: "hsl(var(--cat-strategy) / 0.3)" }}>
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "hsl(var(--cat-strategy) / 0.12)" }}>
            <Eye className="h-7 w-7" style={{ color: "hsl(var(--cat-strategy))" }} />
          </div>
          <p className="t-card-title mb-1">Enter competitor channel name or URL</p>
          <p className="text-xs text-muted-foreground mb-5">We'll run a full 10-dimension analysis</p>
          <div className="flex gap-3">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. TechFlow Daily or @techflowdaily"
              className="h-12 rounded-xl bg-background border-border"
              onKeyDown={e => e.key === "Enter" && analyze()}
            />
            <Button size="lg" className="h-12 px-8 rounded-xl font-semibold" onClick={analyze} disabled={loading || !query.trim()}>
              <Eye className="mr-2 h-4 w-4" /> Spy
            </Button>
          </div>
        </div>
      </div>

      {loading && (
        <LoadingSteps steps={["Gathering your channel data...", "Infiltrating competitor channel...", "Running 10 strategic analyses..."]} currentStep={loadStep} />
      )}

      {report && competitor && (
        <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-6">

          {/* Channel comparison — VS style */}
          <motion.div variants={stagger.item} className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
            <div className="cb-card p-6 text-center" style={{ borderColor: "hsl(var(--success) / 0.2)", boxShadow: "0 0 20px hsl(var(--success) / 0.06)" }}>
              <img src={myChannel?.avatar} className="h-16 w-16 rounded-full mx-auto mb-3 ring-2" style={{ ringColor: "hsl(var(--success) / 0.4)" }} />
              <p className="t-card-title mb-1">{myChannel?.title}</p>
              <p className="data-number" style={{ color: "hsl(var(--success))" }}>{formatCount(myChannel?.subscriberCount || 0)}</p>
              <p className="t-label text-muted-foreground mt-1">subscribers</p>
            </div>
            <div className="hidden md:flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Swords className="h-7 w-7 text-muted-foreground" />
              </div>
            </div>
            <div className="cb-card p-6 text-center" style={{ borderColor: "hsl(var(--destructive) / 0.2)", boxShadow: "0 0 20px hsl(var(--destructive) / 0.06)" }}>
              <img src={competitor.avatar} className="h-16 w-16 rounded-full mx-auto mb-3 ring-2" style={{ ringColor: "hsl(var(--destructive) / 0.4)" }} />
              <p className="t-card-title mb-1">{competitor.title}</p>
              <p className="data-number" style={{ color: "hsl(var(--destructive))" }}>{formatCount(competitor.subscriberCount)}</p>
              <p className="t-label text-muted-foreground mt-1">subscribers</p>
            </div>
          </motion.div>

          {/* Win comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div variants={stagger.item} className="cb-card p-6" style={{ borderColor: "hsl(var(--destructive) / 0.2)", borderLeftWidth: "3px", borderLeftColor: "hsl(var(--destructive))" }}>
              <h3 className="flex items-center gap-2 mb-4">
                <TrendingDown className="h-5 w-5" style={{ color: "hsl(var(--destructive))" }} />
                <span className="t-card-title" style={{ color: "hsl(var(--destructive))" }}>They Win At</span>
              </h3>
              <div className="space-y-2.5">
                {report.they_win_at?.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full mt-2 shrink-0" style={{ background: "hsl(var(--destructive))" }} />
                    <p className="t-body">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div variants={stagger.item} className="cb-card p-6" style={{ borderColor: "hsl(var(--success) / 0.2)", borderLeftWidth: "3px", borderLeftColor: "hsl(var(--success))" }}>
              <h3 className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5" style={{ color: "hsl(var(--success))" }} />
                <span className="t-card-title" style={{ color: "hsl(var(--success))" }}>You Win At</span>
              </h3>
              <div className="space-y-2.5">
                {report.you_win_at?.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full mt-2 shrink-0" style={{ background: "hsl(var(--success))" }} />
                    <p className="t-body">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Upload Frequency Battle */}
          {report.upload_frequency && (
            <motion.div variants={stagger.item} className="cb-card p-6">
              <h3 className="flex items-center gap-2 mb-5">
                <BarChart3 className="h-5 w-5" style={{ color: "hsl(var(--cat-strategy))" }} />
                <span className="t-card-title">Upload Frequency Battle</span>
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center rounded-xl p-4" style={{ background: "hsl(var(--success) / 0.06)" }}>
                  <p className="t-label text-muted-foreground mb-2">You</p>
                  <p className="text-xl font-bold" style={{ color: "hsl(var(--success))" }}>{s(report.upload_frequency.yours)}</p>
                </div>
                <div className="flex items-center justify-center">
                  <Swords className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center rounded-xl p-4" style={{ background: "hsl(var(--destructive) / 0.06)" }}>
                  <p className="t-label text-muted-foreground mb-2">Them</p>
                  <p className="text-xl font-bold" style={{ color: "hsl(var(--destructive))" }}>{s(report.upload_frequency.theirs)}</p>
                </div>
              </div>
              <div className="rounded-lg p-3" style={{ background: "hsl(var(--info) / 0.06)", borderLeft: "3px solid hsl(var(--info))" }}>
                <p className="text-sm text-muted-foreground"><Lightbulb className="inline h-3.5 w-3.5 mr-1" style={{ color: "hsl(var(--info))" }} />{s(report.upload_frequency.recommendation)}</p>
              </div>
            </motion.div>
          )}

          {/* Title Formula Decoder */}
          {report.title_formula && (
            <motion.div variants={stagger.item} className="cb-card p-6" style={{ borderLeft: "3px solid hsl(var(--info))" }}>
              <h3 className="flex items-center gap-2 mb-5">
                <Brain className="h-5 w-5" style={{ color: "hsl(var(--info))" }} />
                <span className="t-card-title">Title Formula Decoder</span>
                <span className="t-label px-2 py-0.5 rounded-full text-[10px]" style={{ background: "hsl(var(--info) / 0.12)", color: "hsl(var(--info))" }}>AI INSIGHT</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="rounded-xl p-5" style={{ background: "hsl(var(--destructive) / 0.05)", border: "1px solid hsl(var(--destructive) / 0.12)" }}>
                  <p className="t-label text-muted-foreground mb-2">Their Pattern</p>
                  <p className="t-card-title text-sm">{s(report.title_formula.their_pattern)}</p>
                </div>
                <div className="rounded-xl p-5" style={{ background: "hsl(var(--success) / 0.05)", border: "1px solid hsl(var(--success) / 0.12)" }}>
                  <p className="t-label text-muted-foreground mb-2">Your Pattern</p>
                  <p className="t-card-title text-sm">{s(report.title_formula.your_pattern)}</p>
                </div>
              </div>
              {report.title_formula.examples?.length > 0 && (
                <div>
                  <p className="t-label text-muted-foreground mb-3">Steal these title formulas:</p>
                  <div className="space-y-2">
                    {report.title_formula.examples.map((ex, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ background: "hsl(var(--cat-strategy) / 0.06)" }}>
                        <span className="text-xs font-bold" style={{ color: "hsl(var(--cat-strategy))" }}>#{i+1}</span>
                        <p className="text-sm font-medium">"{s(ex)}"</p>
                        <CopyButton text={s(ex)} className="ml-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Thumbnail Style */}
          {report.thumbnail_style && (
            <motion.div variants={stagger.item} className="cb-card p-6">
              <h3 className="flex items-center gap-2 mb-5">
                <Eye className="h-5 w-5" style={{ color: "hsl(var(--cat-create))" }} />
                <span className="t-card-title">Thumbnail Style Analysis</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="rounded-xl p-5" style={{ background: "hsl(var(--destructive) / 0.05)" }}>
                  <p className="t-label text-muted-foreground mb-2">Their Style</p>
                  <p className="text-sm">{s(report.thumbnail_style.their_style)}</p>
                </div>
                <div className="rounded-xl p-5" style={{ background: "hsl(var(--success) / 0.05)" }}>
                  <p className="t-label text-muted-foreground mb-2">Your Style</p>
                  <p className="text-sm">{s(report.thumbnail_style.your_style)}</p>
                </div>
              </div>
              <div className="rounded-lg p-3" style={{ background: "hsl(var(--warning) / 0.08)", borderLeft: "3px solid hsl(var(--warning))" }}>
                <p className="text-sm text-muted-foreground">💡 {s(report.thumbnail_style.recommendation)}</p>
              </div>
            </motion.div>
          )}

          {/* Their Best Video — featured card */}
          {report.best_video && (
            <motion.div variants={stagger.item} className="cb-card-glow p-6" style={{ borderColor: "hsl(var(--primary) / 0.3)" }}>
              <h3 className="flex items-center gap-2 mb-4">
                <Crown className="h-5 w-5 text-primary" />
                <span className="t-card-title">Their #1 Best Performing Video</span>
              </h3>
              <p className="text-lg font-bold mb-2">"{s(report.best_video.title)}"</p>
              <p className="data-number-win mb-3">{typeof report.best_video.views === "number" ? formatCount(report.best_video.views) : s(report.best_video.views)} views</p>
              <p className="t-body mb-4">{s(report.best_video.why_it_worked)}</p>
              <Button size="sm" className="rounded-xl" onClick={() => navigate(`/create/video-machine?topic=${encodeURIComponent(s(report.best_video.title))}`)}>
                Make a Better Version <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </motion.div>
          )}

          {/* Weakest Videos */}
          {report.weakest_videos?.length > 0 && (
            <motion.div variants={stagger.item} className="cb-card p-6" style={{ borderLeft: "3px solid hsl(var(--destructive))" }}>
              <h3 className="flex items-center gap-2 mb-4">
                <TrendingDown className="h-5 w-5" style={{ color: "hsl(var(--destructive))" }} />
                <span className="t-card-title">Their Weakest Videos</span>
                <span className="t-label px-2 py-0.5 rounded-full text-[10px]" style={{ background: "hsl(var(--destructive) / 0.12)", color: "hsl(var(--destructive))" }}>AVOID</span>
              </h3>
              <div className="space-y-3">
                {report.weakest_videos.map((v, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ background: "hsl(var(--destructive) / 0.04)", border: "1px solid hsl(var(--destructive) / 0.1)" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-semibold">"{s(v.title)}"</p>
                      <span className="data-number-loss text-sm">{typeof v.views === "number" ? formatCount(v.views) : s(v.views)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{s(v.why_it_failed)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Battle cards — Sentiment + Growth + Engagement */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Comment Sentiment */}
            {report.comment_sentiment && (
              <motion.div variants={stagger.item} className="cb-card p-5">
                <h3 className="flex items-center gap-2 mb-4">
                  <ThumbsUp className="h-4 w-4" style={{ color: "hsl(var(--cat-analyze))" }} />
                  <span className="text-sm font-semibold">Sentiment</span>
                </h3>
                <div className="space-y-3">
                  <div className="rounded-lg p-3" style={{ background: "hsl(var(--success) / 0.06)" }}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">You</p>
                    <p className="text-sm font-bold">{s(report.comment_sentiment.yours)}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "hsl(var(--destructive) / 0.06)" }}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Them</p>
                    <p className="text-sm font-bold">{s(report.comment_sentiment.theirs)}</p>
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-3">🏆 {s(report.comment_sentiment.who_wins)}</p>
              </motion.div>
            )}

            {/* Growth Rate */}
            {report.growth_rate && (
              <motion.div variants={stagger.item} className="cb-card p-5">
                <h3 className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4" style={{ color: "hsl(var(--cat-grow))" }} />
                  <span className="text-sm font-semibold">Growth Rate</span>
                </h3>
                <div className="space-y-3">
                  <div className="rounded-lg p-3" style={{ background: "hsl(var(--success) / 0.06)" }}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">You</p>
                    <p className="text-sm font-bold">{s(report.growth_rate.yours)}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "hsl(var(--destructive) / 0.06)" }}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Them</p>
                    <p className="text-sm font-bold">{s(report.growth_rate.theirs)}</p>
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-3">🏁 {s(report.growth_rate.who_is_faster)}</p>
              </motion.div>
            )}

            {/* Engagement */}
            {report.engagement_vs_views && (
              <motion.div variants={stagger.item} className="cb-card p-5">
                <h3 className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4" style={{ color: "hsl(var(--info))" }} />
                  <span className="text-sm font-semibold">Engagement</span>
                </h3>
                <div className="space-y-3">
                  <div className="rounded-lg p-3" style={{ background: "hsl(var(--success) / 0.06)" }}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">You</p>
                    <p className="text-sm font-bold">{s(report.engagement_vs_views.yours)}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "hsl(var(--destructive) / 0.06)" }}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Them</p>
                    <p className="text-sm font-bold">{s(report.engagement_vs_views.theirs)}</p>
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-3">⚡ {s(report.engagement_vs_views.weakness)}</p>
              </motion.div>
            )}
          </div>

          {/* First Mover Topics — purple chips */}
          {report.first_mover_topics?.length > 0 && (
            <motion.div variants={stagger.item} className="cb-card p-6" style={{ borderLeft: "3px solid hsl(var(--cat-strategy))" }}>
              <h3 className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5" style={{ color: "hsl(var(--cat-strategy))" }} />
                <span className="t-card-title">First Mover Opportunities</span>
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Topics neither channel covers yet — post first to own them</p>
              <div className="flex flex-wrap gap-2">
                {report.first_mover_topics.map((t, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="rounded-full font-semibold"
                    style={{ borderColor: "hsl(var(--cat-strategy) / 0.3)", color: "hsl(var(--cat-strategy))", background: "hsl(var(--cat-strategy) / 0.06)" }}
                    onClick={() => navigate(`/create/video-machine?topic=${encodeURIComponent(s(t))}`)}
                  >
                    🚀 {s(t)} <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Steal & Exploit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div variants={stagger.item} className="space-y-3">
              <h3 className="flex items-center gap-2 px-1">
                <Target className="h-5 w-5 text-primary" />
                <span className="t-card-title">Steal These</span>
              </h3>
              {report.steal_these?.map((item, i) => (
                <div key={i} className="cb-card p-4">
                  <p className="text-sm font-semibold mb-1.5">{s(item.strength)}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s(item.how_to_steal)}</p>
                </div>
              ))}
            </motion.div>
            <motion.div variants={stagger.item} className="space-y-3">
              <h3 className="flex items-center gap-2 px-1">
                <Crosshair className="h-5 w-5" style={{ color: "hsl(var(--destructive))" }} />
                <span className="t-card-title">Exploit These</span>
              </h3>
              {report.exploit_these?.map((item, i) => (
                <div key={i} className="cb-card p-4" style={{ borderColor: "hsl(var(--destructive) / 0.1)" }}>
                  <p className="text-sm font-semibold mb-1.5">{s(item.weakness)}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s(item.how_to_exploit)}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Topic Gaps */}
          {report.topic_gaps?.length > 0 && (
            <motion.div variants={stagger.item} className="cb-card p-6">
              <h3 className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5" style={{ color: "hsl(var(--warning))" }} />
                <span className="t-card-title">Topic Gaps</span>
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Topics they cover that you don't — potential growth areas</p>
              <div className="flex flex-wrap gap-2">
                {report.topic_gaps.map((t, i) => (
                  <Button key={i} variant="outline" size="sm" className="rounded-full" onClick={() => navigate(`/create/video-machine?topic=${encodeURIComponent(s(t))}`)}>
                    {s(t)} <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {/* If You Posted This — hero CTA */}
          {report.if_you_posted && (
            <motion.div
              variants={stagger.item}
              className="cb-card-glow p-8 text-center relative overflow-hidden"
              style={{ borderColor: "hsl(var(--primary) / 0.4)" }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "radial-gradient(400px circle at 50% 0%, hsl(var(--primary) / 0.08), transparent 70%)"
              }} />
              <div className="relative">
                <h3 className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="t-card-title">If You Posted Their Best Topic</span>
                </h3>
                <p className="text-xl font-bold mb-3">"{s(report.if_you_posted.topic)}"</p>
                <p className="data-number text-4xl mb-3">
                  {typeof report.if_you_posted.predicted_views === "number" ? formatCount(report.if_you_posted.predicted_views) : s(report.if_you_posted.predicted_views)}
                  <span className="text-base font-normal text-muted-foreground ml-2">predicted views</span>
                </p>
                <p className="t-body max-w-lg mx-auto mb-6">{s(report.if_you_posted.reasoning)}</p>
                <Button size="lg" className="rounded-xl font-semibold" onClick={() => navigate(`/create/video-machine?topic=${encodeURIComponent(s(report.if_you_posted.topic))}`)}>
                  Build This Video Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </FeaturePage>
  );
}
