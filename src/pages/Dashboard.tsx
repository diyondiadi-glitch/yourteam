import { motion } from "framer-motion";
import { TrendingUp, Eye, Clock, Flame, Zap, ArrowRight, LogOut } from "lucide-react";
import DemoBanner from "@/components/DemoBanner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, hasChannelConnected, clearToken } from "@/lib/youtube-auth";
import { useChannelData } from "@/hooks/useChannelData";
import { formatCount, calcChannelScore, timeAgo } from "@/lib/youtube-api";
import { generateVerdict } from "@/lib/groq-api";
import OnboardingModal from "@/components/OnboardingModal";
import VideoModal from "@/components/VideoModal";
import type { VideoData } from "@/lib/youtube-api";

export default function Dashboard() {
  const navigate = useNavigate();
  const { channel, videos, loading, error, isDemo, avgViews, reload } = useChannelData(10);
  const [verdict, setVerdict] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { navigate("/", { replace: true }); return; }
    if (!hasChannelConnected()) { setShowOnboarding(true); }
  }, []);

  useEffect(() => {
    if (channel && videos.length > 0) {
      generateVerdict({
        title: channel.title,
        subscriberCount: channel.subscriberCount,
        recentVideos: videos.map(v => ({ title: v.title, viewCount: v.viewCount, publishedAt: v.publishedAt })),
      }).then(setVerdict).catch(() => setVerdict("Focus on your next upload — consistency wins."));
    }
  }, [channel, videos]);

  if (showOnboarding) return <OnboardingModal onComplete={() => { setShowOnboarding(false); reload(); }} />;

  if (error) {
    return (
      <div className="p-6 max-w-[920px] mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-lg text-destructive">{error}</p>
        <Button variant="outline" onClick={reload}>Retry</Button>
      </div>
    );
  }

  const channelScore = channel ? calcChannelScore(videos, channel.subscriberCount) : 0;

  const metrics = [
    { label: "avg views", value: formatCount(avgViews), icon: Eye },
    { label: "health", value: `${channelScore}/100`, icon: TrendingUp },
    { label: "best time", value: "Wed 7PM", icon: Clock },
    { label: "momentum", value: "+12%", icon: Flame },
  ];

  return (
    <div className="p-6 md:p-8 max-w-[920px] mx-auto space-y-8">
      <DemoBanner />

      {/* Channel header */}
      {loading ? (
        <div className="flex items-center gap-4"><Skeleton className="h-12 w-12 rounded-full" /><Skeleton className="h-6 w-48" /></div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <img src={channel?.avatar} alt="" className="h-12 w-12 rounded-full ring-2 ring-primary/20" />
          <div>
            <h1 className="text-xl font-bold">{channel?.title}</h1>
            <p className="text-sm text-muted-foreground">{formatCount(channel?.subscriberCount || 0)} subs</p>
          </div>
        </motion.div>
      )}

      {/* Metrics row */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="cb-card text-center py-4">
              <p className="text-2xl font-extrabold">{m.value}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">{m.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Today's Priority */}
      {loading ? <Skeleton className="h-24 rounded-xl" /> : (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl p-5" style={{ background: "hsl(var(--primary) / 0.06)", border: "1px solid hsl(var(--primary) / 0.15)", boxShadow: "0 0 24px hsl(var(--primary) / 0.08)" }}>
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">Today's #1 Priority</p>
              <p className="text-sm leading-relaxed">{verdict || "Analysing your channel..."}</p>
            </div>
            <Button size="sm" className="shrink-0 rounded-lg text-xs" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
              Do It Now <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Videos */}
      <div>
        <h2 className="text-base font-semibold mb-3">Your Videos</h2>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {videos.slice(0, 8).map((v, i) => {
              const perf = avgViews > 0 ? (v.viewCount - avgViews) / avgViews : 0;
              const isAbove = perf >= 0;
              return (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setSelectedVideo(v)}
                  className="cursor-pointer group rounded-xl overflow-hidden cb-card p-0"
                >
                  <div className="relative">
                    <img src={v.thumbnail} alt={v.title} className="w-full h-24 object-cover" />
                    {Math.abs(perf) > 1 && (
                      <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium truncate mb-1.5">{v.title}</p>
                    <p className="text-[10px] text-muted-foreground">{formatCount(v.viewCount)} views · {timeAgo(v.publishedAt)}</p>
                    {/* Performance bar */}
                    <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(Math.max((v.viewCount / (avgViews * 2)) * 100, 5), 100)}%` }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.06 }}
                        className="h-full rounded-full"
                        style={{ background: isAbove ? "hsl(var(--success))" : "hsl(var(--destructive))" }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Get Roasted 🔥", url: "/diagnose/roast" },
            { label: "Analyse Latest Video", url: "/diagnose/video-death" },
            { label: "Growth Intelligence", url: "/diagnose/growth-intelligence" },
            { label: "Talk to Max", url: "/coach" },
          ].map(a => (
            <Button key={a.label} variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => navigate(a.url)}>
              {a.label} <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          ))}
        </div>
      </div>

      <VideoModal video={selectedVideo} avgViews={avgViews} onClose={() => setSelectedVideo(null)} />
    </div>
  );
}
