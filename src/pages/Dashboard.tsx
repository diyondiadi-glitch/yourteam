import { motion } from "framer-motion";
import { TrendingUp, Eye, Upload, Star, Zap, ArrowRight, LogOut, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, clearToken, isAuthenticated } from "@/lib/youtube-auth";
import {
  getMyChannel,
  getRecentVideos,
  formatCount,
  timeAgo,
  calcChannelScore,
  type ChannelData,
  type VideoData,
} from "@/lib/youtube-api";
import { generateVerdict } from "@/lib/groq-api";

const stagger = {
  container: { transition: { staggerChildren: 0.08 } },
  item: { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 } },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [verdict, setVerdict] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/", { replace: true });
      return;
    }
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const ch = await getMyChannel();
      setChannel(ch);

      const vids = await getRecentVideos(ch.id, 6);
      setVideos(vids);

      // Generate AI verdict
      try {
        const v = await generateVerdict({
          title: ch.title,
          subscriberCount: ch.subscriberCount,
          recentVideos: vids.map((v) => ({
            title: v.title,
            viewCount: v.viewCount,
            publishedAt: v.publishedAt,
          })),
        });
        setVerdict(v);
      } catch {
        setVerdict("Review your recent video performance and plan your next upload based on what's working.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load channel data");
    } finally {
      setLoading(false);
    }
  }

  function handleDisconnect() {
    clearToken();
    navigate("/", { replace: true });
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-lg text-destructive">{error}</p>
        <Button variant="ghost-muted" onClick={handleDisconnect}>
          Disconnect & Try Again
        </Button>
      </div>
    );
  }

  const avgViews = videos.length > 0
    ? Math.round(videos.reduce((s, v) => s + v.viewCount, 0) / videos.length)
    : 0;
  const channelScore = channel ? calcChannelScore(videos, channel.subscriberCount) : 0;

  // Upload streak: count consecutive weeks with at least one upload
  const uploadStreak = (() => {
    if (videos.length === 0) return "0 weeks";
    const now = Date.now();
    let weeks = 0;
    for (let w = 0; w < 8; w++) {
      const weekStart = now - (w + 1) * 7 * 86400000;
      const weekEnd = now - w * 7 * 86400000;
      const hasUpload = videos.some((v) => {
        const t = new Date(v.publishedAt).getTime();
        return t >= weekStart && t < weekEnd;
      });
      if (hasUpload) weeks++;
      else break;
    }
    return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  })();

  const metrics = [
    { label: "Subscribers", value: channel ? formatCount(channel.subscriberCount) : "—", icon: TrendingUp },
    { label: "Avg Views", value: formatCount(avgViews), icon: Eye },
    { label: "Upload Streak", value: uploadStreak, icon: Upload },
    { label: "Channel Score", value: `${channelScore}/100`, icon: Star },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Channel Header */}
      {loading ? (
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <img
            src={channel?.avatar}
            alt={channel?.title}
            className="h-14 w-14 rounded-full object-cover border-2 border-primary/30"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{channel?.title}</h1>
            <p className="text-sm text-muted-foreground">
              {formatCount(channel?.subscriberCount || 0)} subscribers · {formatCount(channel?.viewCount || 0)} total views
            </p>
          </div>
          <Button variant="ghost-muted" size="sm" onClick={handleDisconnect}>
            <LogOut className="h-4 w-4 mr-1" /> Disconnect
          </Button>
        </motion.div>
      )}

      {/* Verdict Card */}
      {loading ? (
        <Skeleton className="h-28 w-full rounded-xl" />
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-6"
        >
          <div className="flex items-start gap-3">
            <Zap className="h-6 w-6 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Your #1 Priority Today</p>
              <p className="text-lg font-medium">{verdict}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Metrics */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {metrics.map((m) => (
            <motion.div key={m.label} variants={stagger.item} className="metric-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{m.label}</span>
                <m.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{m.value}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Videos */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Recent Videos</h2>
          {loading ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {videos.map((v) => (
                <div key={v.id} className="rounded-xl border border-border bg-card p-4 card-glow flex gap-3 items-start">
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    className="h-12 w-20 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{v.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{formatCount(v.viewCount)} views</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(v.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Trend Widget */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary" /> Trending Now
              </h2>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/strategy/trend-radar")}>
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
            <TrendWidget />
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: "Analyze Latest Video", url: "/diagnose/video-death" },
                { label: "Get Next Idea", url: "/strategy/next-video" },
                { label: "Check Competitors", url: "/strategy/competitor-spy" },
                { label: "Get Roasted 🔥", url: "/diagnose/roast" },
              ].map((action) => (
                <Button key={action.label} variant="ghost-muted" className="w-full justify-between rounded-lg h-10 text-sm" onClick={() => navigate(action.url)}>
                  {action.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
