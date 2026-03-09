import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Shield, Target, Crosshair, ArrowRight, BarChart3, Swords, Brain, ThumbsUp, Zap, TrendingDown, TrendingUp, Sparkles, Crown, Lightbulb, Copy, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import FeaturePage from "@/components/FeaturePage";
import LoadingSteps from "@/components/LoadingSteps";
import CopyButton from "@/components/CopyButton";
import { useNavigate } from "react-router-dom";
import { isChannelConnected, getChannelContext, formatCount, fetchCompleteChannelData, type ChannelData, type VideoData } from "@/lib/youtube-api";
import { callAI, parseJsonSafely } from "@/lib/ai-service";

interface SpyReport {
  battle_verdict?: string;
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
  action_plan?: string[];
}

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } },
};

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  
  useEffect(() => {
    const start = ref.current;
    const end = value;
    const duration = 1500;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
    ref.current = end;
  }, [value]);
  
  return <>{formatCount(display)}</>;
}

export default function CompetitorSpy() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [myChannel, setMyChannel] = useState<ChannelData | null>(null);
  const [competitor, setCompetitor] = useState<ChannelData | null>(null);
  const [report, setReport] = useState<SpyReport | null>(null);
  const [error, setError] = useState("");
  const [checkedActions, setCheckedActions] = useState<boolean[]>([false, false, false]);
  const [actionsCopied, setActionsCopied] = useState(false);

  useEffect(() => {
    if (!isChannelConnected()) { 
      navigate("/", { replace: true }); 
      return; 
    }
  }, [navigate]);

  async function analyze() {
    if (!query.trim()) return;
    setLoading(true);
    setReport(null);
    setError("");
    setLoadStep(0);
    setCheckedActions([false, false, false]);

    try {
      // Get own channel from localStorage
      const stored = localStorage.getItem('yt_channel_data');
      if (!stored) { 
        navigate('/'); 
        return; 
      }
      const ch: ChannelData = JSON.parse(stored);
      setMyChannel(ch);
      const myVids = ch.videos?.slice(0, 10) || [];
      setLoadStep(1);

      // Fetch competitor channel data live
      setLoadStep(1);
      let comp: ChannelData;
      try {
        comp = await fetchCompleteChannelData(query);
        setCompetitor(comp);
      } catch (err: any) {
        throw new Error("Competitor channel not found. Try their exact channel URL.");
      }
      const compVids = comp.videos?.slice(0, 10) || [];
      setLoadStep(2);

      const myContext = getChannelContext(ch, myVids);
      const compSummary = `Competitor: ${comp.name}
Subscribers: ${formatCount(comp.subscribers)}
Total Views: ${formatCount(comp.totalViews)}
Videos: ${comp.videoCount}
Average Views: ${formatCount(comp.avgViews)}
Recent Videos:
${compVids.map(v => `"${v.title}" - ${formatCount(v.views)} views, ${formatCount(v.likes)} likes, ${v.comments} comments`).join("\n")}`;

      setLoadStep(3);
      
      const competitorPrompt = `You are an elite competitive intelligence analyst for YouTube channels. Analyse these two channels with brutal honesty and strategic precision. Return ONLY valid JSON, no markdown, no explanation outside the JSON.

{
  "battle_verdict": "One sentence declaring who is winning and why",
  "they_win_at": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "you_win_at": ["specific advantage 1", "specific advantage 2", "specific advantage 3"],
  "steal_these": [
    {"strength": "what they do well", "how_to_steal": "exactly how you replicate it"},
    {"strength": "...", "how_to_steal": "..."},
    {"strength": "...", "how_to_steal": "..."}
  ],
  "exploit_these": [
    {"weakness": "their specific weakness", "how_to_exploit": "exact action to take advantage"},
    {"weakness": "...", "how_to_exploit": "..."}
  ],
  "topic_gaps": ["topic they cover you don't 1", "topic 2", "topic 3", "topic 4"],
  "upload_frequency": {
    "yours": "e.g. Once per week",
    "theirs": "e.g. 3x per week",
    "recommendation": "specific actionable recommendation"
  },
  "title_formula": {
    "their_pattern": "describe their exact title formula pattern e.g. Number + Outcome + Timeframe",
    "your_pattern": "describe your current title formula",
    "examples": ["example title using their formula", "example 2", "example 3"]
  },
  "thumbnail_style": {
    "their_style": "specific description of their thumbnail approach",
    "your_style": "specific description of your approach",
    "recommendation": "specific change to make"
  },
  "best_video": {
    "title": "their actual best performing video title",
    "views": ${compVids[0]?.views || 0},
    "why_it_worked": "specific analysis of why it performed well"
  },
  "comment_sentiment": {
    "yours": "e.g. Highly positive — 89% appreciative comments",
    "theirs": "e.g. Mixed — 71% positive, high confusion rate",
    "who_wins": "channel name + one sentence why"
  },
  "first_mover_topics": ["uncovered trending topic 1", "topic 2", "topic 3"],
  "weakest_videos": [
    {"title": "their weak video title", "views": 0, "why_it_failed": "specific reason"},
    {"title": "...", "views": 0, "why_it_failed": "..."}
  ],
  "growth_rate": {
    "yours": "estimated growth trajectory",
    "theirs": "estimated growth trajectory",
    "who_is_faster": "winner + specific reason"
  },
  "engagement_vs_views": {
    "yours": "engagement rate estimate",
    "theirs": "engagement rate estimate",
    "weakness": "which channel has weak engagement relative to views and why"
  },
  "if_you_posted": {
    "topic": "their best topic applied to your channel",
    "predicted_views": ${Math.round(ch.avgViews * 1.5)},
    "reasoning": "specific reasoning based on your channel's performance patterns"
  },
  "action_plan": [
    "Most important action to take this week",
    "Second most important action",
    "Third action"
  ]
}`;

      const result = await callAI(competitorPrompt, `YOUR CHANNEL:\n${myContext}\n\nCOMPETITOR:\n${compSummary}`);

      // Try parsing with fallbacks
      let parsed = parseJsonSafely(result);
      
      if (!parsed) {
        setError("Analysis couldn't be parsed — please try again.");
        return;
      }
      
      setReport(parsed);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const s = (v: any): string => typeof v === "string" ? v : Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v ?? '');

  function copyActionPlan() {
    if (!report?.action_plan) return;
    const text = report.action_plan.map((a, i) => `${i + 1}. ${s(a)}`).join('\n');
    navigator.clipboard.writeText(text);
    setActionsCopied(true);
    setTimeout(() => setActionsCopied(false), 2000);
  }

  return (
    <FeaturePage emoji="🕵️" title="Intelligence Report" description="Deep competitive analysis with 12 strategic dimensions">
      {/* Input — Spy Command Center */}
      <div className="max-w-2xl mx-auto mb-10">
        <div 
          className="rounded-2xl p-8 text-center"
          style={{ 
            background: "radial-gradient(ellipse at top, #0d0511 0%, hsl(var(--background)) 60%)",
            border: "1px solid hsl(271 81% 65% / 0.2)"
          }}
        >
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "hsl(271 81% 65% / 0.12)" }}>
            <Eye className="h-7 w-7" style={{ color: "hsl(271 81% 65%)" }} />
          </div>
          <p className="t-card-title mb-1">Enter competitor channel name or URL</p>
          <p className="text-xs text-muted-foreground mb-5">We'll run a 12-dimension deep analysis against your channel</p>
          <div className="flex gap-3">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. @mkbhd or youtube.com/@techreview"
              className="h-12 rounded-xl bg-background/50 border-border focus:ring-2 focus:ring-[hsl(271_81%_65%/0.4)] focus:border-[hsl(271_81%_65%)]"
              onKeyDown={e => e.key === "Enter" && analyze()}
            />
            <Button 
              size="lg" 
              className="h-12 px-8 rounded-xl font-semibold"
              style={{ background: "hsl(271 81% 65%)", color: "white" }}
              onClick={analyze} 
              disabled={loading || !query.trim()}
            >
              <Eye className="mr-2 h-4 w-4" /> Run Intelligence Report
            </Button>
          </div>
        </div>
      </div>

      {loading && (
        <LoadingSteps 
          steps={[
            "Gathering your channel intelligence...", 
            "Infiltrating competitor channel...", 
            "Cross-referencing 12 strategic dimensions...",
            "Generating battle report..."
          ]} 
          currentStep={loadStep} 
        />
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto text-center p-6 rounded-xl"
          style={{ background: "hsl(var(--destructive) / 0.08)", border: "1px solid hsl(var(--destructive) / 0.2)" }}
        >
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <p className="font-semibold mb-1">Analysis Failed</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={() => { setError(""); setQuery(""); }}>Try Again</Button>
        </motion.div>
      )}

      {report && competitor && myChannel && (
        <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-6">

          {/* LAYER 1 — Battle Verdict Hero */}
          {report.battle_verdict && (
            <motion.div 
              variants={stagger.item} 
              className="cb-card p-8 text-center"
              style={{ 
                boxShadow: "0 0 28px rgba(250,204,21,0.10)",
                borderColor: "rgba(250,204,21,0.20)"
              }}
            >
              <p className="t-label text-primary mb-3">⚔️ BATTLE VERDICT</p>
              <p className="text-2xl font-bold mb-6">{s(report.battle_verdict)}</p>
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <img src={myChannel.avatar} alt="" className="h-12 w-12 rounded-full mx-auto mb-2 ring-2 ring-success/40" />
                  <p className="data-number" style={{ color: "hsl(var(--success))" }}>{formatCount(myChannel.subscribers)}</p>
                  <p className="text-xs text-muted-foreground">{myChannel.name}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-lg font-bold text-muted-foreground">VS</span>
                </div>
                <div className="text-center">
                  <img src={competitor.avatar} alt="" className="h-12 w-12 rounded-full mx-auto mb-2 ring-2 ring-destructive/40" />
                  <p className="data-number" style={{ color: "hsl(var(--destructive))" }}>{formatCount(competitor.subscribers)}</p>
                  <p className="text-xs text-muted-foreground">{competitor.name}</p>
                </div>
              </div>
            </motion.div>
          )}

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
                    <p className="t-body">{s(item)}</p>
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
                    <p className="t-body">{s(item)}</p>
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

          {/* First Mover Opportunities */}
          {report.first_mover_topics?.length > 0 && (
            <motion.div variants={stagger.item} className="cb-card p-6">
              <h3 className="flex items-center gap-2 mb-5">
                <Zap className="h-5 w-5" style={{ color: "hsl(var(--success))" }} />
                <span className="t-card-title">First Mover Opportunities</span>
                <span className="t-label px-2 py-0.5 rounded-full text-[10px]" style={{ background: "hsl(var(--success) / 0.12)", color: "hsl(var(--success))" }}>UNCLAIMED</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {report.first_mover_topics.map((topic, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ background: "hsl(var(--success) / 0.04)", border: "1px solid hsl(var(--success) / 0.15)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                      </span>
                      <span className="text-[10px] font-bold uppercase" style={{ color: "hsl(var(--success))" }}>🔥 Trending</span>
                    </div>
                    <p className="text-sm font-medium mb-3">{s(topic)}</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full rounded-lg text-xs"
                      onClick={() => navigate(`/create/video-machine?topic=${encodeURIComponent(s(topic))}`)}
                    >
                      Post First → <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Their Best Video */}
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

          {/* If You Posted This — Most dramatic card */}
          {report.if_you_posted && (
            <motion.div 
              variants={stagger.item} 
              className="rounded-2xl p-8 text-center relative overflow-hidden"
              style={{ 
                background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.08) 0%, hsl(var(--background-card)) 70%)",
                border: "2px solid hsl(var(--primary) / 0.3)",
                boxShadow: "0 0 60px hsl(var(--primary) / 0.15)"
              }}
            >
              <p className="t-label text-primary mb-2">🚀 IF YOU POSTED THIS</p>
              <p className="text-lg font-semibold mb-4">"{s(report.if_you_posted.topic)}"</p>
              <p className="text-5xl font-black text-primary mb-2">
                <AnimatedNumber value={report.if_you_posted.predicted_views || 0} />
              </p>
              <p className="text-sm text-muted-foreground mb-4">predicted views</p>
              <p className="t-body mb-6 max-w-md mx-auto">{s(report.if_you_posted.reasoning)}</p>
              <Button 
                size="lg" 
                className="rounded-xl font-bold"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                onClick={() => navigate(`/create/video-machine?topic=${encodeURIComponent(s(report.if_you_posted.topic))}`)}
              >
                Build This Video Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Battle cards — Sentiment + Growth + Engagement */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report.comment_sentiment && (
              <motion.div variants={stagger.item} className="cb-card p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Sentiment</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-success">You:</span> {s(report.comment_sentiment.yours)}</p>
                  <p><span className="text-destructive">Them:</span> {s(report.comment_sentiment.theirs)}</p>
                  <p className="text-xs text-muted-foreground mt-2">{s(report.comment_sentiment.who_wins)}</p>
                </div>
              </motion.div>
            )}
            {report.growth_rate && (
              <motion.div variants={stagger.item} className="cb-card p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Growth Rate</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-success">You:</span> {s(report.growth_rate.yours)}</p>
                  <p><span className="text-destructive">Them:</span> {s(report.growth_rate.theirs)}</p>
                  <p className="text-xs text-muted-foreground mt-2">{s(report.growth_rate.who_is_faster)}</p>
                </div>
              </motion.div>
            )}
            {report.engagement_vs_views && (
              <motion.div variants={stagger.item} className="cb-card p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Engagement</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-success">You:</span> {s(report.engagement_vs_views.yours)}</p>
                  <p><span className="text-destructive">Them:</span> {s(report.engagement_vs_views.theirs)}</p>
                  <p className="text-xs text-muted-foreground mt-2">{s(report.engagement_vs_views.weakness)}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* LAYER 3 — Action Plan at bottom */}
          {report.action_plan && report.action_plan.length > 0 && (
            <motion.div 
              variants={stagger.item} 
              className="cb-card p-6"
              style={{ borderLeft: "4px solid hsl(var(--success))" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="t-card-title flex items-center gap-2">
                  <Target className="h-5 w-5" style={{ color: "hsl(var(--success))" }} />
                  Your 3 Moves This Week
                </h3>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-lg text-xs"
                  onClick={copyActionPlan}
                >
                  {actionsCopied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
                  {actionsCopied ? "Copied!" : "Copy Action Plan"}
                </Button>
              </div>
              <div className="space-y-3">
                {report.action_plan.map((action, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "hsl(var(--success) / 0.04)" }}>
                    <Checkbox 
                      checked={checkedActions[i]} 
                      onCheckedChange={(checked) => {
                        const newChecked = [...checkedActions];
                        newChecked[i] = !!checked;
                        setCheckedActions(newChecked);
                      }}
                      className="mt-0.5"
                    />
                    <span className={`text-sm ${checkedActions[i] ? 'line-through text-muted-foreground' : ''}`}>
                      <span className="font-bold mr-2">{i + 1}.</span>
                      {s(action)}
                    </span>
                  </div>
                ))}
              </div>
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

          {/* Steal These / Exploit These */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.steal_these?.length > 0 && (
              <motion.div variants={stagger.item} className="cb-card p-6">
                <h3 className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="t-card-title">Steal These</span>
                </h3>
                <div className="space-y-3">
                  {report.steal_these.map((item, i) => (
                    <div key={i} className="rounded-lg p-3" style={{ background: "hsl(var(--primary) / 0.04)" }}>
                      <p className="text-sm font-semibold mb-1">{s(item.strength)}</p>
                      <p className="text-xs text-muted-foreground">{s(item.how_to_steal)}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            {report.exploit_these?.length > 0 && (
              <motion.div variants={stagger.item} className="cb-card p-6">
                <h3 className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5" style={{ color: "hsl(var(--destructive))" }} />
                  <span className="t-card-title">Exploit These</span>
                </h3>
                <div className="space-y-3">
                  {report.exploit_these.map((item, i) => (
                    <div key={i} className="rounded-lg p-3" style={{ background: "hsl(var(--destructive) / 0.04)" }}>
                      <p className="text-sm font-semibold mb-1">{s(item.weakness)}</p>
                      <p className="text-xs text-muted-foreground">{s(item.how_to_exploit)}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Topic Gaps */}
          {report.topic_gaps?.length > 0 && (
            <motion.div variants={stagger.item} className="cb-card p-6">
              <h3 className="flex items-center gap-2 mb-4">
                <Crosshair className="h-5 w-5" style={{ color: "hsl(var(--warning))" }} />
                <span className="t-card-title">Topic Gaps</span>
                <span className="text-xs text-muted-foreground">Topics they cover that you don't</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {report.topic_gaps.map((topic, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full text-sm" style={{ background: "hsl(var(--warning) / 0.1)", color: "hsl(var(--warning))" }}>
                    {s(topic)}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </FeaturePage>
  );
}
