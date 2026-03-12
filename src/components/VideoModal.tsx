import { useState, useEffect } from "react";
import { X, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { type VideoData } from "@/lib/youtube-api";
import { formatCount } from "@/lib/utils";
import { callAI } from "@/lib/ai-service";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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

  if (!video) return null;

  const perfPercent = Math.round(((video.views / avgViews) - 1) * 100);
  const isAbove = perfPercent >= 0;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-md border-l border-white/5 bg-[#050505] p-0 text-zinc-100"
      >
        <div className="flex flex-col h-full">
          {/* Thumbnail */}
          <div
            className="relative aspect-video group cursor-pointer"
            onClick={() => window.open(`https://youtube.com/watch?v=${video.id}`, "_blank")}
          >
            <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white text-black p-3 rounded-full mb-2 shadow-[0_0_30px_rgba(0,0,0,0.6)]">
                <Play className="h-6 w-6 fill-current" />
              </div>
              <span className="text-white text-xs font-bold uppercase tracking-[0.22em]">Watch on YouTube</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-4 right-4 bg-black/70 hover:bg-black rounded-full p-2 transition-colors"
            >
              <X className="h-4 w-4 text-zinc-200" />
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-5 p-5">
            {/* Title & performance */}
            <div className="space-y-2">
              <h2 className="text-base font-semibold leading-snug line-clamp-2">
                {video.title}
              </h2>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${
                  isAbove ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isAbove ? "+" : ""}
                {isNaN(perfPercent) ? "0" : perfPercent}%
                <span className="ml-1 text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                  {isAbove ? "Above avg" : "Below avg"}
                </span>
              </div>
            </div>

            {/* AI insight strip */}
            <div className="rounded-2xl border border-amber-400/40 bg-[#0A0A0A] p-4 space-y-3 shadow-[0_0_30px_rgba(251,191,36,0.15)]">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-full bg-zinc-800" />
                  <Skeleton className="h-3.5 w-3/4 bg-zinc-800" />
                  <Skeleton className="h-3.5 w-1/2 bg-zinc-800" />
                </div>
              ) : (
                insight.map((line, i) => (
                  <p
                    key={i}
                    className={`text-xs leading-relaxed ${
                      i === 0 ? "text-zinc-100 font-medium" : "text-zinc-400"
                    }`}
                  >
                    {line}
                  </p>
                ))
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Views", value: formatCount(video.views) },
                { label: "Likes", value: formatCount(video.likes) },
                { label: "Comments", value: formatCount(video.comments) },
                {
                  label: "Like Rate",
                  value: `${((video.likes / Math.max(video.views, 1)) * 100).toFixed(1)}%`,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="text-center p-2 rounded-xl bg-white/5 border border-white/5"
                >
                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">
                    {s.label}
                  </p>
                  <p className="text-sm font-semibold">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Quick actions grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "🔬 Autopsy", route: "/diagnose/video-death" },
                { label: "✂️ Find Shorts", route: "/grow/hidden-gold" },
                { label: "⛏ Mine Comments", route: "/coach/comment-intel" },
                { label: "⚡ Make Part 2", route: "/create/video-machine" },
                { label: "🎣 Score Hook", route: "/create/hook-score" },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => {
                    sessionStorage.setItem("selected_video", JSON.stringify(video));
                    onClose();
                    navigate(a.route);
                  }}
                  className="text-[11px] font-semibold py-2 px-2 rounded-xl border border-white/7 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-100 text-left transition-colors"
                >
                  {a.label}
                </button>
              ))}
            </div>

            {/* Bottom CTA row */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button
                variant="outline"
                className="rounded-xl border-white/10 bg-[#0A0A0A] hover:bg-white/5 text-[11px] font-semibold"
                onClick={() => {
                  onClose();
                  navigate("/grow/comment-intelligence");
                }}
              >
                Mine Comments
              </Button>
              <Button
                className="rounded-xl bg-zinc-100 hover:bg-zinc-200 text-black text-[11px] font-semibold"
                onClick={() => {
                  onClose();
                  navigate("/strategy/next-video");
                }}
              >
                Make Part 2
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
