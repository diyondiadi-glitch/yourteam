import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, ThumbsUp, MessageSquare, Sparkles, Skull, Zap, Scissors, PickaxeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { formatCount, timeAgo, type VideoData } from "@/lib/youtube-api";
import { callAI } from "@/lib/ai-service";
import { setSelectedVideo } from "@/lib/video-context";
import YouTubeEmbed from "./YouTubeEmbed";

interface VideoModalProps {
  video: VideoData | null;
  avgViews: number;
  onClose: () => void;
}

export default function VideoModal({ video, avgViews, onClose }: VideoModalProps) {
  const navigate = useNavigate();
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    if (!video) return;
    setInsight("");
    setInsightLoading(true);
    callAI(
      "You are a YouTube strategist. Give a 2-sentence insight about this video's performance. Be specific and actionable.",
      `Video: "${video.title}"\nViews: ${video.views} (channel avg: ${Math.round(avgViews)})\nLikes: ${video.likes}\nComments: ${video.comments}\nPublished: ${video.publishedAt}`
    )
      .then(setInsight)
      .catch(() => setInsight("AI analysis temporarily unavailable."))
      .finally(() => setInsightLoading(false));
  }, [video?.id]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  function navWith(path: string) {
    if (video) {
      setSelectedVideo({
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        views: video.views,
        likes: video.likes,
        comments: video.comments,
        publishDate: video.publishedAt,
      });
    }
    onClose();
    navigate(path);
  }

  if (!video) return null;

  const perfPercent = avgViews > 0 ? Math.round(((video.views - avgViews) / avgViews) * 100) : 0;
  const isAbove = perfPercent >= 0;
  const likeRate = video.views > 0 ? ((video.likes / video.views) * 100).toFixed(1) : "0";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(16px)" }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
          style={{ background: "hsl(var(--background))", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Video Details</span>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* YouTube Embed */}
            <div className="rounded-xl overflow-hidden">
              <YouTubeEmbed videoId={video.id} />
            </div>

            {/* Performance Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isAbove ? "bg-success/15 text-success border border-success/20" : "bg-destructive/15 text-destructive border border-destructive/20"}`}
            >
              {Math.abs(perfPercent)}% {isAbove ? "above" : "below"} average
            </div>

            {/* Title */}
            <div>
              <h2 className="text-xl font-bold mb-1">{video.title}</h2>
              <p className="text-sm text-muted-foreground">Published {timeAgo(video.publishedAt)}</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "views", value: formatCount(video.views), icon: Eye },
                { label: "likes", value: formatCount(video.likes), icon: ThumbsUp },
                { label: "comments", value: formatCount(video.comments), icon: MessageSquare },
                { label: "liked", value: `${likeRate}%`, icon: Sparkles },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-3 text-center cb-card">
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {/* AI Insight */}
            <div
              className="rounded-xl p-4"
              style={{ borderLeft: "4px solid hsl(var(--info))", background: "hsl(var(--info) / 0.05)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4" style={{ color: "hsl(var(--info))" }} />
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "hsl(var(--info))" }}
                >
                  AI Instant Insight
                </span>
              </div>
              {insightLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <p className="text-sm leading-relaxed">{insight}</p>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <p className="t-label text-muted-foreground mb-3">Quick Actions</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs"
                  onClick={() => navWith("/diagnose/video-death")}
                >
                  <Skull className="mr-1 h-3.5 w-3.5" /> Autopsy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs"
                  onClick={() => navWith("/grow/hidden-gold")}
                >
                  <Scissors className="mr-1 h-3.5 w-3.5" /> Shorts Scanner
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs"
                  onClick={() => navWith("/grow/comment-intelligence")}
                >
                  <PickaxeIcon className="mr-1 h-3.5 w-3.5" /> Mine Comments
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs"
                  onClick={() => navWith("/create/video-machine")}
                >
                  <Zap className="mr-1 h-3.5 w-3.5" /> Make Part 2
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs"
                  onClick={() => navWith("/create/hook-score")}
                >
                  <Sparkles className="mr-1 h-3.5 w-3.5" /> Score Hook
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
