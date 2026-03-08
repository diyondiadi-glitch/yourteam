import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, Shield, Target, Crosshair, ArrowRight, BarChart3, Swords, Brain, ThumbsUp, Zap, TrendingDown, TrendingUp, Sparkles } from "lucide-react";
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
      <div className="max-w-2xl mx-auto mb-8">
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center">
          <Eye className="h-8 w-8 text-primary mx-auto mb-3" />
          <p className="font-semibold mb-3">Enter competitor channel name or URL</p>
          <div className="flex gap-3">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. TechFlow Daily or @techflowdaily"
              className="h-12 rounded-xl"
              onKeyDown={e => e.key === "Enter" && analyze()}
            />
            <Button size="lg" className="h-12 px-8 rounded-xl" onClick={analyze} disabled={loading || !query.trim()}>
              <Eye className="mr-2 h-4 w-4" /> Spy
            </Button>
          </div>
        </div>
      </div>

      {loading && (
        <LoadingSteps steps={["Gathering your channel data...", "Infiltrating competitor channel...", "Running 10 strategic analyses..."]} currentStep={loadStep} />
      )}

      {report && competitor && (
        <div className="space-y-6">
          {/* Channel comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-primary/20 bg-card p-5 text-center">
              <img src={myChannel?.avatar} className="h-12 w-12 rounded-full mx-auto mb-2" />
              <p className="font-semibold">{myChannel?.title}</p>
              <p className="data-number">{formatCount(myChannel?.subscriberCount || 0)}</p>
              <p className="text-xs text-muted-foreground">subscribers</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <img src={competitor.avatar} className="h-12 w-12 rounded-full mx-auto mb-2" />
              <p className="font-semibold">{competitor.title}</p>
              <p className="data-number">{formatCount(competitor.subscriberCount)}</p>
              <p className="text-xs text-muted-foreground">subscribers</p>
            </div>
          </div>

          {/* Win comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-destructive/20 bg-card p-5">
              <h3 className="section-header text-destructive mb-3">They Win At</h3>
              {report.they_win_at?.map((s, i) => <p key={i} className="text-sm text-muted-foreground mb-2">• {s}</p>)}
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-success/20 bg-card p-5">
              <h3 className="section-header text-success mb-3">You Win At</h3>
              {report.you_win_at?.map((s, i) => <p key={i} className="text-sm text-muted-foreground mb-2">• {s}</p>)}
            </motion.div>
          </div>

          {/* Upload Frequency Battle */}
          {report.upload_frequency && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="section-header flex items-center gap-2 mb-4"><BarChart3 className="h-5 w-5 text-cat-strategy" /> Upload Frequency Battle</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center"><p className="text-xs text-muted-foreground">You</p><p className="data-number text-2xl">{s(report.upload_frequency.yours)}</p></div>
                <div className="text-center flex items-center justify-center"><Swords className="h-6 w-6 text-muted-foreground" /></div>
                <div className="text-center"><p className="text-xs text-muted-foreground">Them</p><p className="data-number text-2xl">{s(report.upload_frequency.theirs)}</p></div>
              </div>
              <p className="text-sm text-muted-foreground mt-3 text-center">{s(report.upload_frequency.recommendation)}</p>
            </div>
          )}

          {/* Title Formula Decoder */}
          {report.title_formula && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="section-header flex items-center gap-2 mb-4"><Brain className="h-5 w-5 text-cat-create" /> Title Formula Decoder</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Their Pattern</p>
                  <p className="font-semibold">{s(report.title_formula.their_pattern)}</p>
                </div>
                <div className="rounded-lg bg-primary/5 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Your Pattern</p>
                  <p className="font-semibold">{s(report.title_formula.your_pattern)}</p>
                </div>
              </div>
              {report.title_formula.examples?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Example titles using their formula:</p>
                  {report.title_formula.examples.map((ex, i) => <p key={i} className="text-sm mb-1">"{s(ex)}"</p>)}
                </div>
              )}
            </div>
          )}

          {/* Thumbnail Style */}
          {report.thumbnail_style && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="section-header flex items-center gap-2 mb-4"><Eye className="h-5 w-5 text-cat-create" /> Thumbnail Style Analysis</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg bg-secondary/50 p-4"><p className="text-xs text-muted-foreground">Their Style</p><p className="font-semibold">{s(report.thumbnail_style.their_style)}</p></div>
                <div className="rounded-lg bg-primary/5 p-4"><p className="text-xs text-muted-foreground">Your Style</p><p className="font-semibold">{s(report.thumbnail_style.your_style)}</p></div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">💡 {s(report.thumbnail_style.recommendation)}</p>
            </div>
          )}

          {/* Best Performing Video */}
          {report.best_video && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <h3 className="section-header flex items-center gap-2 mb-3"><Sparkles className="h-5 w-5 text-primary" /> Their Best Video</h3>
              <p className="font-bold text-lg mb-1">"{s(report.best_video.title)}"</p>
              <p className="data-number mb-2">{typeof report.best_video.views === "number" ? formatCount(report.best_video.views) : s(report.best_video.views)} views</p>
              <p className="text-sm text-muted-foreground">{s(report.best_video.why_it_worked)}</p>
            </div>
          )}

          {/* Comment Sentiment */}
          {report.comment_sentiment && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="section-header flex items-center gap-2 mb-4"><ThumbsUp className="h-5 w-5 text-cat-analyze" /> Comment Sentiment Battle</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center"><p className="text-xs text-muted-foreground">You</p><p className="font-bold text-lg">{s(report.comment_sentiment.yours)}</p></div>
                <div className="text-center flex items-center justify-center"><span className="text-lg">vs</span></div>
                <div className="text-center"><p className="text-xs text-muted-foreground">Them</p><p className="font-bold text-lg">{s(report.comment_sentiment.theirs)}</p></div>
              </div>
              <p className="text-sm text-center text-muted-foreground mt-2">🏆 {s(report.comment_sentiment.who_wins)}</p>
            </div>
          )}

          {/* First Mover Alert */}
          {report.first_mover_topics?.length > 0 && (
            <div className="rounded-xl border border-success/20 bg-card p-5">
              <h3 className="section-header flex items-center gap-2 mb-3"><Zap className="h-5 w-5 text-success" /> First Mover Opportunities</h3>
              <div className="flex flex-wrap gap-2">
                {report.first_mover_topics.map((t, i) => (
                  <Button key={i} variant="outline" size="sm" onClick={() => navigate(`/create/video-machine?topic=${encodeURIComponent(s(t))}`)}>
                    {s(t)} <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Weakest Videos */}
          {report.weakest_videos?.length > 0 && (
            <div className="rounded-xl border border-destructive/20 bg-card p-5">
              <h3 className="section-header flex items-center gap-2 mb-4"><TrendingDown className="h-5 w-5 text-destructive" /> Their Weakest Videos (Avoid These)</h3>
              <div className="space-y-3">
                {report.weakest_videos.map((v, i) => (
                  <div key={i} className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">"{s(v.title)}"</p>
                      <span className="text-xs text-destructive font-bold">{typeof v.views === "number" ? formatCount(v.views) : s(v.views)} views</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{s(v.why_it_failed)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Growth Rate Battle */}
          {report.growth_rate && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="section-header flex items-center gap-2 mb-4"><TrendingUp className="h-5 w-5 text-cat-grow" /> Growth Rate Battle</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center"><p className="text-xs text-muted-foreground">You</p><p className="data-number text-2xl">{s(report.growth_rate.yours)}</p></div>
                <div className="text-center flex items-center justify-center"><span className="text-lg">🏁</span></div>
                <div className="text-center"><p className="text-xs text-muted-foreground">Them</p><p className="data-number text-2xl">{s(report.growth_rate.theirs)}</p></div>
              </div>
              <p className="text-sm text-center text-muted-foreground mt-2">{s(report.growth_rate.who_is_faster)}</p>
            </div>
          )}

          {/* Engagement vs Views */}
          {report.engagement_vs_views && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="section-header flex items-center gap-2 mb-4"><BarChart3 className="h-5 w-5 text-cat-analyze" /> Engagement vs Views</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg bg-primary/5 p-4 text-center"><p className="text-xs text-muted-foreground">Your Engagement</p><p className="font-bold text-xl">{s(report.engagement_vs_views.yours)}</p></div>
                <div className="rounded-lg bg-secondary/50 p-4 text-center"><p className="text-xs text-muted-foreground">Their Engagement</p><p className="font-bold text-xl">{s(report.engagement_vs_views.theirs)}</p></div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">⚡ {s(report.engagement_vs_views.weakness)}</p>
            </div>
          )}

          {/* If You Posted This */}
          {report.if_you_posted && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border-2 border-primary/30 bg-primary/10 p-6">
              <h3 className="section-header flex items-center gap-2 mb-3"><Sparkles className="h-5 w-5 text-primary" /> If You Posted Their Best Topic</h3>
              <p className="font-bold text-lg mb-2">"{s(report.if_you_posted.topic)}"</p>
              <p className="data-number mb-2">Predicted: {typeof report.if_you_posted.predicted_views === "number" ? formatCount(report.if_you_posted.predicted_views) : s(report.if_you_posted.predicted_views)} views</p>
              <p className="text-sm text-muted-foreground">{s(report.if_you_posted.reasoning)}</p>
              <Button className="mt-4" onClick={() => navigate(`/create/video-machine?topic=${encodeURIComponent(s(report.if_you_posted.topic))}`)}>
                Build This Video <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Steal & Exploit */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="section-header flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Steal These</h3>
              {report.steal_these?.map((item, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4 card-glow">
                  <p className="text-sm font-medium mb-1">{s(item.strength)}</p>
                  <p className="text-xs text-muted-foreground">{s(item.how_to_steal)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="section-header flex items-center gap-2"><Crosshair className="h-5 w-5 text-destructive" /> Exploit These</h3>
              {report.exploit_these?.map((item, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4 card-glow">
                  <p className="text-sm font-medium mb-1">{s(item.weakness)}</p>
                  <p className="text-xs text-muted-foreground">{s(item.how_to_exploit)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Topic gaps */}
          {report.topic_gaps?.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="section-header mb-3">Topic Gaps (they cover, you don't)</h3>
              <div className="flex flex-wrap gap-2">
                {report.topic_gaps.map((t, i) => (
                  <Button key={i} variant="outline" size="sm" onClick={() => navigate(`/create/video-machine?topic=${encodeURIComponent(s(t))}`)}>
                    {s(t)} <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </FeaturePage>
  );
}
