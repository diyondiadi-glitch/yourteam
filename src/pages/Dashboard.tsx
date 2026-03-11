import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Eye, Clock, Flame, Zap, ArrowRight, AlertTriangle, BarChart2, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useChannelData } from "@/hooks/useChannelData";
import { calcChannelScore, timeAgo, type VideoData } from "@/lib/youtube-api";
import { formatCount } from "@/lib/utils";
import { callAI } from "@/lib/ai-service";
import VideoModal from "@/components/VideoModal";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type TimeRange = "7d" | "30d" | "all";
type SortMode = "recent" | "views" | "worst";

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 bg-zinc-900 border border-zinc-800 shadow-xl">
      <p className="text-xs text-zinc-400 mb-1">{payload[0]?.payload?.fullTitle}</p>
      <p className="text-sm font-bold text-white">{formatCount(payload[0]?.value)} views</p>
      <p className="text-[10px] text-zinc-500 mt-1">{payload[0]?.payload?.date}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { channel, videos, avgViews, subscribers, isConnected } = useChannelData();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [actionPlan, setActionPlan] = useState<string[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);

  useEffect(() => {
    if (!isConnected || !channel || !videos.length) return;
    
    setLoadingPlan(true);
    callAI(
      "You are a YouTube growth strategist. Generate 3 specific numbered action items. Each item MUST contain a specific number or day from the channel's real data. Start with a verb. Be direct. Format: 1. Action\n2. Action\n3. Action",
      `Channel: ${channel.name}. Avg Views: ${avgViews}. Best Day: ${channel.bestDay}. Recent performance: ${videos.slice(0, 5).map(v => v.views).join(", ")}. Last 30 uploads best day: ${channel.bestDay}.`
    ).then(r => {
      const items = r.split("\n").filter(l => /^\d\./.test(l.trim())).map(l => l.replace(/^\d\.\s*/, "").trim());
      setActionPlan(items.slice(0, 3));
    }).catch(() => {
      setActionPlan([
        `Post on ${channel.bestDay} at 3pm — it gets 2x your average based on recent data.`,
        `Analyze why your top video got ${formatCount(videos[0]?.views || 0)} views and replicate the hook.`,
        `Fix engagement on your latest upload which is currently performing below average.`
      ]);
    }).finally(() => setLoadingPlan(false));
  }, [channel?.id]);

  const graphData = useMemo(() => {
    if (!videos.length) return [];
    const now = Date.now();
    const daysLimit = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 3650;
    
    return videos
      .filter(v => (now - new Date(v.publishedAt).getTime()) / 86400000 <= daysLimit)
      .slice(0, 50)
      .reverse()
      .map(v => ({
        views: Number(v.views), // Critical: Cast to Number
        fullTitle: v.title,
        label: v.title.slice(0, 20) + "...",
        date: new Date(v.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      }));
  }, [videos, timeRange]);

  const sortedVideos = useMemo(() => {
    let v = [...videos];
    if (sortMode === "views") v.sort((a, b) => b.views - a.views);
    else if (sortMode === "worst") v.sort((a, b) => a.views - b.views);
    return v.slice(0, 12);
  }, [videos, sortMode]);

  if (!isConnected) return null;

  const channelScore = channel ? calcChannelScore(videos, channel.subscribers) : 0;
  const latestVideo = videos[0];
  const isUnderperforming = latestVideo && avgViews > 0 && latestVideo.views < avgViews * 0.7;
  const underperformPercent = latestVideo ? Math.round((1 - (latestVideo.views / avgViews)) * 100) : 0;

  const metrics = [
    { label: "Avg Views", value: formatCount(avgViews), icon: Eye, color: "text-blue-400" },
    { label: "Channel Score", value: `${channelScore}/100`, icon: TrendingUp, color: "text-yellow-400" },
    { label: "Best Day", value: channel?.bestDay || "—", icon: Clock, color: "text-green-400" },
    { label: "Frequency", value: channel?.uploadFrequency || "—", icon: Flame, color: "text-orange-400" },
  ];

  const lastAnalysed = channel?.fetchedAt ? timeAgo(channel.fetchedAt) : "Just now";

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-8 pb-20">
      
      {/* ── Header ─────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={channel?.avatar} alt="" className="h-14 w-14 rounded-full border-2 border-zinc-800 object-cover" />
          <div>
            <h1 className="text-2xl font-bold font-display">{channel?.name}</h1>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span>{formatCount(subscribers)} subscribers</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last analysed: {lastAnalysed}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Best Time Banner ───────────────── */}
      <div className="bg-yellow-500 text-black px-6 py-4 rounded-2xl flex items-center justify-between shadow-lg shadow-yellow-500/10">
        <div className="flex items-center gap-4">
          <div className="bg-black/10 p-2 rounded-lg">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="font-bold text-lg">Post on {channel?.bestDay}s at 3pm — your highest performing upload day</p>
            <p className="text-sm font-medium opacity-70">Based on your data</p>
          </div>
        </div>
        <div className="hidden md:block bg-black text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
          Recommended
        </div>
      </div>

      {/* ── Underperforming alert ───────────── */}
      {isUnderperforming && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-center justify-between group cursor-pointer"
          onClick={() => navigate("/diagnose/video-death")}
        >
          <div className="flex items-center gap-4">
            <div className="bg-red-500/20 p-2 rounded-xl text-red-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-red-500">"{latestVideo.title}" is {underperformPercent}% below your average</p>
              <p className="text-sm text-red-500/70">Click to run an autopsy and fix it now</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-red-500 group-hover:translate-x-1 transition-transform" />
        </motion.div>
      )}

      {/* ── Metrics Row ────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <m.icon className={`h-4 w-4 ${m.color}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{m.label}</span>
            </div>
            <p className="text-2xl font-bold font-display">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Views Graph ──────────────────── */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold font-display">Views Per Upload</h2>
            <div className="flex bg-black/40 p-1 rounded-xl">
              {(["7d", "30d", "all"] as TimeRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${timeRange === r ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphData}>
                <defs>
                  <linearGradient id="viewGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#viewGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Action Plan ───────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Zap className="h-24 w-24 text-yellow-500" />
          </div>
          <h2 className="text-lg font-bold font-display mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            This Week's Action Plan
          </h2>

          <div className="space-y-6">
            {loadingPlan ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl bg-zinc-800" />)
            ) : (
              actionPlan.map((item, idx) => (
                <div key={idx} className="flex gap-4 group">
                  <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-sm font-bold group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                    {idx + 1}
                  </div>
                  <p className="text-zinc-200 text-sm leading-relaxed pt-1">{item}</p>
                </div>
              ))
            )}
          </div>

          <Button 
            variant="outline" 
            className="w-full mt-8 border-zinc-800 hover:bg-zinc-800 rounded-xl"
            onClick={() => navigate("/coach")}
          >
            Discuss with Max
          </Button>
        </div>
      </div>

      {/* ── Video Grid ────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-display">Recent Content</h2>
          <div className="flex gap-2">
            {(["recent", "views", "worst"] as SortMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setSortMode(m)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase border transition-all ${sortMode === m ? "bg-white text-black border-white" : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700"}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedVideos.map((v) => {
            const performance = v.views / avgViews;
            const isGood = performance > 1.3;
            const isBad = performance < 0.7;
            const badgeColor = isGood ? "bg-green-500" : isBad ? "bg-red-500" : "bg-yellow-500";
            const percentLabel = isGood ? `+${Math.round((performance - 1) * 100)}%` : `${Math.round((performance - 1) * 100)}%`;

            return (
              <motion.div
                key={v.id}
                whileHover={{ y: -5 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => setSelectedVideo(v)}
              >
                <div className="aspect-video relative overflow-hidden">
                  <img src={v.thumbnail} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold">
                    {v.duration.replace("PT", "").replace("M", ":").replace("S", "").padStart(4, "0")}
                  </div>
                  <div className={`absolute top-2 left-2 ${badgeColor} text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg`}>
                    {percentLabel}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm line-clamp-2 mb-2 group-hover:text-yellow-500 transition-colors">{v.title}</h3>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span>{formatCount(v.views)} views</span>
                    <span>{timeAgo(v.publishedAt)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          avgViews={avgViews}
        />
      )}
    </div>
  );
}
