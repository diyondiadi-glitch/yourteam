import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, ThumbsUp, MessageSquare, Calendar, Zap, Skull, RefreshCw, Sparkles, PickaxeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import CopyButton from "@/components/CopyButton";
import { isAuthenticated } from "@/lib/youtube-auth";
import { getMyChannel, getRecentVideos, getVideoComments, formatCount, timeAgo, type VideoData } from "@/lib/youtube-api";
import { callGroq } from "@/lib/groq-api";

export default function VideoDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get("id");
  const [video, setVideo] = useState<VideoData | null>(null);
  const [comments, setComments] = useState<string[]>([]);
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { navigate("/", { replace: true }); return; }
    loadVideo();
  }, [videoId]);

  async function loadVideo() {
    try {
      const ch = await getMyChannel();
      const vids = await getRecentVideos(ch.id, 20);
      const v = vids.find(v => v.id === videoId);
      if (!v) { navigate("/dashboard"); return; }
      setVideo(v);

      const cmts = await getVideoComments(v.id, 20);
      setComments(cmts);

      const avgViews = vids.reduce((s, v) => s + v.viewCount, 0) / vids.length;
      const res = await callGroq(
        "You are a YouTube strategist. Analyse this video in 3 sentences. End with the single most important thing to know about it.",
        `Video: "${v.title}"\nViews: ${v.viewCount} (avg: ${Math.round(avgViews)})\nLikes: ${v.likeCount}\nComments: ${v.commentCount}\nPublished: ${v.publishedAt}`
      );
      setInsight(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !video) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>

      {/* Thumbnail */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-xl overflow-hidden">
        <img src={video.thumbnail} alt={video.title} className="w-full h-auto max-h-[400px] object-cover" />
        <div className="absolute bottom-4 right-4 px-3 py-1 rounded-lg bg-background/80 backdrop-blur text-sm font-bold">
          {formatCount(video.viewCount)} views
        </div>
      </motion.div>

      {/* Title & Stats */}
      <div>
        <h1 className="text-2xl font-bold mb-3">{video.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {formatCount(video.viewCount)}</span>
          <span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" /> {formatCount(video.likeCount)}</span>
          <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {formatCount(video.commentCount)}</span>
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {timeAgo(video.publishedAt)}</span>
        </div>
      </div>

      {/* AI Insight */}
      {insight && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase text-primary">🧠 AI Instant Insight</p>
            <CopyButton text={insight} />
          </div>
          <p className="text-sm leading-relaxed">{insight}</p>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => navigate(`/diagnose/video-death`)}>
          <Skull className="mr-1 h-3.5 w-3.5" /> Why Did This Die
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate(`/analyze/revival`)}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" /> Revive This Video
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate(`/create/video-machine?topic=Part 2: ${video.title}`)}>
          <Zap className="mr-1 h-3.5 w-3.5" /> Make Part 2
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate(`/create/hook-score`)}>
          <Sparkles className="mr-1 h-3.5 w-3.5" /> Analyse Hook
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate(`/analyze/comments`)}>
          <PickaxeIcon className="mr-1 h-3.5 w-3.5" /> Mine Comments
        </Button>
      </div>

      {/* Comments */}
      <div>
        <h2 className="font-semibold mb-3">Latest Comments</h2>
        <div className="space-y-2">
          {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
          {comments.map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="rounded-lg border border-border bg-card p-3">
              <p className="text-sm">{c}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
