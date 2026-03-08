import { motion } from "framer-motion";
import { TrendingUp, Eye, Upload, Star, Zap, ArrowRight, LogOut } from "lucide-react";
import DemoBanner from "@/components/DemoBanner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, clearToken, isAuthenticated, hasChannelConnected } from "@/lib/youtube-auth";
import {
  getMyChannel,
  getRecentVideos,
  formatCount,
  timeAgo,
  calcChannelScore,
  isDemoMode,
  type ChannelData,
  type VideoData,
} from "@/lib/youtube-api";
import { getStoredChannel, getStoredVideos } from "@/lib/youtube-public-api";
import { generateVerdict, callGroq } from "@/lib/groq-api";
import OnboardingModal from "@/components/OnboardingModal";

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
  const [quickWin, setQuickWin] = useState("");
  const [quickWinOpen, setQuickWinOpen] = useState(false);
  const [quickWinLoading, setQuickWinLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/", { replace: true });
      return;
    }
    // If user is logged in but hasn't connected a channel and not in demo mode
    if (!hasChannelConnected()) {
      setShowOnboarding(true);
      setLoading(false);
      return;
    }
    loadData();
  }, []);

  function handleOnboardingComplete() {
    setShowOnboarding(false);
    loadData();
  }

  async function loadData() {
    try {
      setLoading(true);

      // Try stored real channel data first
      const storedChannel = getStoredChannel();
      const storedVideos = getStoredVideos();

      if (storedChannel && storedVideos.length > 0 && !isDemoMode()) {
        // Use stored real data, map to ChannelData/VideoData format
        const ch: ChannelData = {
          id: storedChannel.id,
          title: storedChannel.title,
          avatar: storedChannel.avatar,
          subscriberCount: storedChannel.subscriberCount,
          viewCount: storedChannel.viewCount,
          videoCount: storedChannel.videoCount,
          customUrl: storedChannel.customUrl,
        };
        setChannel(ch);
        const vids: VideoData[] = storedVideos.slice(0, 6).map(v => ({
          id: v.id,
          title: v.title,
          thumbnail: v.thumbnail,
          viewCount: v.viewCount,
          likeCount: v.likeCount,
          commentCount: v.commentCount,
          publishedAt: v.publishedAt,
        }));
        setVideos(vids);

        try {
          const v = await generateVerdict({
            title: ch.title,
            subscriberCount: ch.subscriberCount,
            recentVideos: vids.map((v) => ({ title: v.title, viewCount: v.viewCount, publishedAt: v.publishedAt })),
          });
          setVerdict(v);
        } catch {
          setVerdict("Review your recent video performance and plan your next upload based on what's working.");
        }
      } else {
        // Fall back to youtube-api (demo mode or OAuth token)
        const ch = await getMyChannel();
        setChannel(ch);
        const vids = await getRecentVideos(ch.id, 6);
        setVideos(vids);

        try {
          const v = await generateVerdict({
            title: ch.title,
            subscriberCount: ch.subscriberCount,
            recentVideos: vids.map((v) => ({ title: v.title, viewCount: v.viewCount, publishedAt: v.publishedAt })),
          });
          setVerdict(v);
        } catch {
          setVerdict("Review your recent video performance and plan your next upload based on what's working.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load channel data");
    } finally {
      setLoading(false);
    }
  }

  async function getQuickWin() {
    setQuickWinLoading(true);
    setQuickWinOpen(true);
    try {
      const ch = channel || await getMyChannel();
      const vids = videos.length > 0 ? videos : await getRecentVideos(ch.id, 10);
      const avgViews = vids.reduce((s, v) => s + v.viewCount, 0) / vids.length;
      const res = await callGroq(
        "You are a YouTube growth coach. Give the single highest-impact action this creator can take TODAY. One paragraph, be specific.",
        `Channel: ${ch.title}, ${formatCount(ch.subscriberCount)} subs, avg ${Math.round(avgViews)} views. Recent: ${vids.slice(0, 3).map(v => `"${v.title}" (${v.viewCount} views)`).join(", ")}. What's their #1 quick win right now?`
      );
      setQuickWin(res);
    } catch {
      setQuickWin("Focus on your next upload — consistency is the highest-impact action you can take.");
    } finally {
      setQuickWinLoading(false);
    }
  }

  function handleDisconnect() {
    clearToken();
    navigate("/", { replace: true });
  }

  if (showOnboarding) {
    return <OnboardingModal onComplete={handleOnboardingComplete} />;
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-lg text-destructive">{error}</p>
        <Button variant="ghost-muted" onClick={() => { setError(""); loadData(); }}>Retry</Button>
        <Button variant="ghost-muted" onClick={handleDisconnect}>Disconnect & Try Again</Button>
      </div>
    );
  }

  const avgViews = videos.length > 0 ? Math.round(videos.reduce((s, v) => s + v.viewCount, 0) / videos.length) : 0;
  const channelScore = channel ? calcChannelScore(videos, channel.subscriberCount) : 0;

  const uploadStreak = (() => {
    if (videos.length === 0) return "0 weeks";
    const now = Date.now();
    let weeks = 0;
    for (let w = 0; w < 8; w++) {
      const weekStart = now - (w + 1) * 7 * 86400000;
      const weekEnd = now - w * 7 * 86400000;
      if (videos.some((v) => { const t = new Date(v.publishedAt).getTime(); return t >= weekStart && t < weekEnd; })) weeks++;
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 relative">
      <DemoBanner />

      {/* Connect channel banner for logged-in users without channel */}
      {!isDemoMode() && !getStoredChannel() && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
          <p className="text-sm">Connect your YouTube channel to see your real data</p>
          <Button size="sm" onClick={() => setShowOnboarding(true)}>Connect Channel</Button>
        </div>
      )}

      {/* Channel Header */}
      {loading ? (
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32" /></div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <img src={channel?.avatar} alt={channel?.title} className="h-14 w-14 rounded-full object-cover border-2 border-primary/30" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{channel?.title}</h1>
            <p className="text-sm text-muted-foreground">{formatCount(channel?.subscriberCount || 0)} subscribers · {formatCount(channel?.viewCount || 0)} total views</p>
          </div>
          <Button variant="ghost-muted" size="sm" onClick={handleDisconnect}>
            <LogOut className="h-4 w-4 mr-1" /> Disconnect
          </Button>
        </motion.div>
      )}

      {/* Verdict Card */}
      {loading ? <Skeleton className="h-28 w-full rounded-xl" /> : (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="rounded-xl border border-primary/20 bg-primary/5 p-6">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : (
        <motion.div variants={stagger.container} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Recent Videos</h2>
          {loading ? (
            <div className="grid sm:grid-cols-2 gap-3">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {videos.map((v) => (
                <div key={v.id} className="rounded-xl border border-border bg-card p-4 card-glow flex gap-3 items-start cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/video?id=${v.id}`)}>
                  <img src={v.thumbnail} alt={v.title} className="h-12 w-20 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{v.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{formatCount(v.viewCount)} views</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(v.publishedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${v.viewCount >= avgViews ? "bg-success" : "bg-destructive"}`} />
                      <span className="text-[10px] text-muted-foreground">{v.viewCount >= avgViews ? "Above avg" : "Below avg"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: "Analyze Latest Video", url: "/diagnose/video-death" },
                { label: "Get Next Idea", url: "/strategy/next-video" },
                { label: "Channel Health Check", url: "/diagnose/health-check" },
                { label: "Get Roasted 🔥", url: "/diagnose/roast" },
                { label: "Talk to Max (AI Coach)", url: "/coach" },
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

      {/* Quick Win FAB */}
      <button onClick={getQuickWin} className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-primary/30 transition-all hover:scale-105 z-40" title="Get Quick Win">
        <Zap className="h-6 w-6" />
      </button>

      {quickWinOpen && (
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="fixed bottom-24 right-6 w-80 rounded-xl border border-primary/20 bg-card p-5 shadow-xl z-40">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase text-primary">⚡ Quick Win</p>
            <button onClick={() => setQuickWinOpen(false)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
          </div>
          {quickWinLoading ? (
            <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-primary animate-pulse" /><span className="text-sm text-muted-foreground">Thinking...</span></div>
          ) : (
            <p className="text-sm leading-relaxed">{quickWin}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
