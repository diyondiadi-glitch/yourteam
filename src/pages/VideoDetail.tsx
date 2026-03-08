import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, Eye, ThumbsUp, MessageSquare, Calendar, Zap, Skull, RefreshCw, Sparkles, PickaxeIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CopyButton from "@/components/CopyButton";
import { isAuthenticated } from "@/lib/youtube-auth";
import { getMyChannel, getRecentVideos, getVideoComments, formatCount, timeAgo, type VideoData } from "@/lib/youtube-api";
import { callAI } from "@/lib/ai-service";
import { setSelectedVideo } from "@/lib/video-context";

export default function VideoDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get("id");
  const [video, setVideo] = useState<VideoData | null>(null);
  const [allVideos, setAllVideos] = useState<VideoData[]>([]);
  const [comments, setComments] = useState<string[]>([]);
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);
  const [avgViews, setAvgViews] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) { navigate("/", { replace: true }); return; }
    loadVideo();
  }, [videoId]);

  async function loadVideo() {
    try {
      const ch = await getMyChannel();
      const vids = await getRecentVideos(ch.id, 20);
      setAllVideos(vids);
      const v = vids.find(v => v.id === videoId);
      if (!v) { navigate("/dashboard"); return; }
      setVideo(v);

      const avg = vids.reduce((s, v) => s + v.viewCount, 0) / vids.length;
      setAvgViews(avg);

      const cmts = await getVideoComments(v.id, 20);
      setComments(cmts);

      setInsightLoading(true);
      try {
        const res = await callAI(
          "You are a YouTube strategist. Analyse this video in 3 sentences. End with the single most important thing to know about it.",
          `Video: "${v.title}"\nViews: ${v.viewCount} (avg: ${Math.round(avg)})\nLikes: ${v.likeCount}\nComments: ${v.commentCount}\nPublished: ${v.publishedAt}`
        );
        setInsight(res);
      } catch {
        setInsight("AI analysis temporarily unavailable. Check back shortly.");
      }
      setInsightLoading(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function navigateWithVideo(path: string) {
    if (video) {
      setSelectedVideo({
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        views: video.viewCount,
        likes: video.likeCount,
        comments: video.commentCount,
        publishDate: video.publishedAt,
      });
    }
    navigate(path);
  }

  const perfPercent = video && avgViews > 0
    ? Math.round(((video.viewCount - avgViews) / avgViews) * 100)
    : 0;
  const isAboveAvg = perfPercent >= 0;

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-8 w-3/4" />
        <div className="flex gap-3"><Skeleton className="h-20 w-1/4 rounded-xl" /><Skeleton className="h-20 w-1/4 rounded-xl" /><Skeleton className="h-20 w-1/4 rounded-xl" /><Skeleton className="h-20 w-1/4 rounded-xl" /></div>
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!video) return null;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
      </div>

      {/* Thumbnail with gradient overlay */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-xl overflow-hidden">
        <img src={video.thumbnail} alt={video.title} className="w-full h-auto max-h-[320px] object-cover" />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to top, hsl(var(--background)) 0%, transparent 60%)"
        }} />
        {/* Performance badge */}
        <div className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
          isAboveAvg
            ? "bg-success/20 text-success border border-success/30"
            : "bg-destructive/20 text-destructive border border-destructive/30"
        }`}>
          {isAboveAvg ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {Math.abs(perfPercent)}% {isAboveAvg ? "above" : "below"} average
        </div>
        <div className="absolute bottom-4 right-4 px-3 py-1 rounded-lg bg-background/80 backdrop-blur text-sm font-bold">
          {formatCount(video.viewCount)} views
        </div>
      </motion.div>

      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-3">{video.title}</h1>
        <p className="text-sm text-muted-foreground">Published {timeAgo(video.publishedAt)}</p>
      </div>

      {/* Stat chips — glass morphism */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Views", value: formatCount(video.viewCount), icon: Eye },
          { label: "Likes", value: formatCount(video.likeCount), icon: ThumbsUp },
          { label: "Comments", value: formatCount(video.commentCount), icon: MessageSquare },
          { label: "Like Rate", value: video.viewCount > 0 ? `${((video.likeCount / video.viewCount) * 100).toFixed(1)}%` : "—", icon: Sparkles },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{
            background: "hsl(var(--card) / 0.8)",
            border: "1px solid hsl(var(--border))",
            backdropFilter: "blur(8px)",
          }}>
            <s.icon className="h-4 w-4 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* AI Insight */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl p-5"
        style={{
          borderLeft: "4px solid hsl(var(--info))",
          background: "hsl(var(--info) / 0.06)",
          border: "1px solid hsl(var(--info) / 0.15)",
          borderLeftWidth: "4px",
          borderLeftColor: "hsl(var(--info))",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" style={{ color: "hsl(var(--info))" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--info))" }}>AI Instant Insight</p>
          </div>
          {insight && <CopyButton text={insight} />}
        </div>
        {insightLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{insight}</p>
        )}
      </motion.div>

      {/* Quick Actions */}
      <div>
        <p className="t-label text-muted-foreground mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="rounded-xl" style={{ background: "hsl(var(--destructive) / 0.12)", color: "hsl(var(--destructive))", border: "1px solid hsl(var(--destructive) / 0.2)" }}
            onClick={() => navigateWithVideo("/diagnose/video-death")}>
            <Skull className="mr-1.5 h-3.5 w-3.5" /> Run Autopsy
          </Button>
          <Button size="sm" className="rounded-xl" style={{ background: "hsl(var(--warning) / 0.12)", color: "hsl(var(--warning))", border: "1px solid hsl(var(--warning) / 0.2)" }}
            onClick={() => navigateWithVideo("/analyze/revival")}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Revive It
          </Button>
          <Button size="sm" className="rounded-xl" style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.2)" }}
            onClick={() => navigateWithVideo("/analyze/comments")}>
            <PickaxeIcon className="mr-1.5 h-3.5 w-3.5" /> Mine Comments
          </Button>
          <Button size="sm" className="rounded-xl" style={{ background: "hsl(var(--info) / 0.12)", color: "hsl(var(--info))", border: "1px solid hsl(var(--info) / 0.2)" }}
            onClick={() => navigate(`/create/video-machine?topic=${encodeURIComponent("Part 2: " + video.title)}`)}>
            <Zap className="mr-1.5 h-3.5 w-3.5" /> Make Part 2
          </Button>
          <Button size="sm" className="rounded-xl" style={{ background: "hsl(var(--cat-strategy) / 0.12)", color: "hsl(var(--cat-strategy))", border: "1px solid hsl(var(--cat-strategy) / 0.2)" }}
            onClick={() => navigateWithVideo("/create/hook-score")}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Analyse Hook
          </Button>
        </div>
      </div>

      {/* Comments */}
      {comments.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Latest Comments</h2>
          <div className="space-y-2">
            {comments.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-lg border border-border bg-card p-3"
              >
                <p className="text-sm">{c}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
