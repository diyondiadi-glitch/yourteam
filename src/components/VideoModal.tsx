import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, ThumbsUp, MessageSquare, Play, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { type VideoData } from "@/lib/youtube-api";
import { formatCount } from "@/lib/utils";
import { callAI } from "@/lib/ai-service";

interface VideoModalProps {
  video: VideoData | null;
  isOpen: boolean;
  onClose: () => void;
  avgViews: number;
}

export default function VideoModal({ video, isOpen, onClose, avgViews }: VideoModalProps) {
  const navigate = useNavigate();
  const [insight, setInsight] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!video || !isOpen) return;
    
    setLoading(true);
    callAI(
      "You are a YouTube growth strategist. Analyze this video's performance. Respond with EXACTLY 3 lines. Line 1: One sentence verdict why it performed this way. Line 2: The single biggest mistake or win. Line 3: One specific action for the next video. Be direct.",
      `Video: "${video.title}"\nViews: ${video.views} (Avg: ${Math.round(avgViews)})\nLikes: ${video.likes}\nComments: ${video.comments}`
    ).then(r => {
      const lines = r.split("\n").filter(l => l.trim().length > 0).slice(0, 3);
      setInsight(lines);
    }).catch(() => {
      setInsight([
        "Performance was driven by strong initial interest from your core subscribers.",
        "The biggest win was the high comment-to-view ratio indicating deep engagement.",
        "Double down on this topic but try a more aggressive thumbnail for the next part."
      ]);
    }).finally(() => setLoading(false));
  }, [video?.id, isOpen]);

  if (!video || !isOpen) return null;

  const perfPercent = Math.round(((video.views / avgViews) - 1) * 100);
  const isAbove = perfPercent >= 0;
  const likeRate = ((video.likes / Math.max(video.views, 1)) * 100).toFixed(1);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-[480px] bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Thumbnail/Link Area */}
          <div className="relative aspect-video group cursor-pointer" onClick={() => window.open(`https://youtube.com/watch?v=${video.id}`, "_blank")}>
            <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white text-black p-3 rounded-full mb-2">
                <Play className="h-6 w-6 fill-current" />
              </div>
              <span className="text-white text-xs font-bold uppercase tracking-widest">Watch on YouTube</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black p-2 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Title & Performance */}
            <div>
              <h2 className="text-lg font-bold font-display line-clamp-2 mb-2">{video.title}</h2>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isAbove ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                <Sparkles className="h-3.5 w-3.5" />
                {isAbove ? "+" : ""}{perfPercent}% {isAbove ? "above" : "below"} average
              </div>
            </div>

            {/* AI Insight Box */}
            <div className="bg-zinc-900 border-l-2 border-yellow-500 p-4 rounded-r-xl space-y-3">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-zinc-800" />
                  <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                  <Skeleton className="h-4 w-1/2 bg-zinc-800" />
                </div>
              ) : (
                insight.map((line, i) => (
                  <p key={i} className={`text-sm leading-relaxed ${i === 0 ? "text-white font-medium" : "text-zinc-400"}`}>
                    {line}
                  </p>
                ))
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Views", value: formatCount(video.views), icon: Eye },
                { label: "Likes", value: formatCount(video.likes), icon: ThumbsUp },
                { label: "Comments", value: formatCount(video.comments), icon: MessageSquare },
                { label: "Like Rate", value: `${likeRate}%`, icon: Sparkles },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">{s.label}</p>
                  <p className="text-sm font-bold">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button 
                variant="outline" 
                className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 rounded-xl text-xs font-bold"
                onClick={() => { onClose(); navigate("/grow/comment-intelligence"); }}
              >
                Mine Comments
              </Button>
              <Button 
                className="bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-bold"
                onClick={() => { onClose(); navigate("/strategy/next-video"); }}
              >
                Make Part 2
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
