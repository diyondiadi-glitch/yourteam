import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Map } from "lucide-react";
import FeaturePage from "@/components/FeaturePage";
import LoadingSteps from "@/components/LoadingSteps";
import CopyButton from "@/components/CopyButton";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/youtube-auth";
import { getMyChannel, getRecentVideos, getChannelContext, formatCount } from "@/lib/youtube-api";
import { callGroq, parseJsonFromResponse } from "@/lib/groq-api";

interface AlgorithmData {
  best_days: { day: string; avg_views: number }[];
  best_times: { time: string; avg_views: number }[];
  best_lengths: { range: string; avg_views: number }[];
  best_topics: { topic: string; avg_views: number }[];
  sweet_spot: string;
  biggest_insight: string;
  biggest_change: string;
}

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AlgorithmMap() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadStep, setLoadStep] = useState(0);
  const [data, setData] = useState<AlgorithmData | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { navigate("/", { replace: true }); return; }
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoadStep(0);
      const ch = await getMyChannel();
      const vids = await getRecentVideos(ch.id, 20);
      setLoadStep(1);
      const context = getChannelContext(ch, vids);

      const dayStats: Record<string, { total: number; count: number }> = {};
      const timeStats: Record<string, { total: number; count: number }> = {};
      vids.forEach(v => {
        const d = new Date(v.publishedAt);
        const day = d.toLocaleDateString("en-US", { weekday: "long" });
        const hour = d.getHours();
        const time = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
        dayStats[day] = dayStats[day] || { total: 0, count: 0 };
        dayStats[day].total += v.viewCount;
        dayStats[day].count++;
        timeStats[time] = timeStats[time] || { total: 0, count: 0 };
        timeStats[time].total += v.viewCount;
        timeStats[time].count++;
      });

      const patternData = `Upload day performance:\n${Object.entries(dayStats).map(([d, s]) => `${d}: avg ${Math.round(s.total / s.count)} views (${s.count} videos)`).join("\n")}\n\nUpload time performance:\n${Object.entries(timeStats).map(([t, s]) => `${t}: avg ${Math.round(s.total / s.count)} views (${s.count} videos)`).join("\n")}`;

      setLoadStep(2);
      const res = await callGroq(
        `You are a YouTube algorithm pattern analyst. Based on this creator's data, build their personal algorithm map. Return JSON: {best_days: [{day: string, avg_views: number}], best_times: [{time: string, avg_views: number}], best_lengths: [{range: string, avg_views: number}], best_topics: [{topic: string, avg_views: number}], sweet_spot: string (one paragraph describing ideal video formula), biggest_insight: string, biggest_change: string}`,
        `${context}\n\n${patternData}\n\nBuild the algorithm map.`
      );

      const parsed = parseJsonFromResponse(res);
      if (parsed) setData(parsed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Heatmap for days
  function DayHeatmap({ days }: { days: { day: string; avg_views: number }[] }) {
    const dayMap: Record<string, number> = {};
    days.forEach(d => {
      const short = d.day.substring(0, 3);
      dayMap[short] = d.avg_views;
    });
    const max = Math.max(...Object.values(dayMap), 1);

    return (
      <div className="cb-card">
        <h3 className="t-section mb-4">📅 BEST UPLOAD DAYS</h3>
        <div className="grid grid-cols-7 gap-2">
          {ALL_DAYS.map(d => {
            const val = dayMap[d] || 0;
            const intensity = val / max;
            return (
              <motion.div
                key={d}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: ALL_DAYS.indexOf(d) * 0.05 }}
                className="flex flex-col items-center gap-1.5"
              >
                <span className="t-label text-muted-foreground">{d}</span>
                <div
                  className="w-full aspect-square rounded-lg flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: intensity > 0
                      ? `hsla(var(--success), ${0.1 + intensity * 0.5})`
                      : 'hsl(var(--secondary))',
                    border: intensity > 0.8 ? '1px solid hsl(var(--success) / 0.4)' : '1px solid transparent',
                    boxShadow: intensity > 0.8 ? '0 0 12px hsl(var(--success) / 0.2)' : 'none',
                  }}
                >
                  <span className={`text-xs font-bold ${intensity > 0.5 ? 'text-success' : 'text-muted-foreground'}`}>
                    {val > 0 ? formatCount(val) : '—'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // Time segments
  function TimeSegments({ times }: { times: { time: string; avg_views: number }[] }) {
    const segments = ["Morning", "Afternoon", "Evening", "Night"];
    const timeMap: Record<string, number> = {};
    times.forEach(t => { timeMap[t.time] = t.avg_views; });
    const max = Math.max(...Object.values(timeMap), 1);
    const emojis: Record<string, string> = { Morning: "🌅", Afternoon: "☀️", Evening: "🌆", Night: "🌙" };

    return (
      <div className="cb-card">
        <h3 className="t-section mb-4">🕐 BEST UPLOAD TIMES</h3>
        <div className="grid grid-cols-2 gap-3">
          {segments.map(seg => {
            const val = timeMap[seg] || 0;
            const intensity = val / max;
            const isTop = intensity > 0.8 && val > 0;
            return (
              <div
                key={seg}
                className={`rounded-lg p-3 text-center transition-all ${isTop ? 'ring-1 ring-success/30' : ''}`}
                style={{ backgroundColor: `hsl(var(--background-section))` }}
              >
                <span className="text-xl">{emojis[seg]}</span>
                <p className="t-label text-muted-foreground mt-1">{seg}</p>
                <p className={`text-lg font-bold mt-1 ${isTop ? 'text-success' : 'text-foreground'}`}>
                  {val > 0 ? formatCount(val) : '—'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Ranked list
  function RankedList({ items, label, emoji }: { items: { label: string; value: number }[]; label: string; emoji: string }) {
    const max = Math.max(...items.map(i => i.value), 1);
    return (
      <div className="cb-card">
        <h3 className="t-section mb-4">{emoji} {label}</h3>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i === 0 ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
              }`}>{i + 1}</span>
              <span className="text-sm flex-1 truncate">{item.label}</span>
              <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / max) * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className={`h-full rounded-full ${i === 0 ? 'bg-primary' : 'bg-muted-foreground/40'}`}
                />
              </div>
              <span className="text-sm font-bold w-16 text-right">{formatCount(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <FeaturePage emoji="🧬" title="Your Algorithm DNA" description="The algorithm feels random? Let's map YOUR personal patterns.">
        <LoadingSteps steps={["Fetching all video data...", "Detecting patterns...", "Building your algorithm map..."]} currentStep={loadStep} />
      </FeaturePage>
    );
  }

  return (
    <FeaturePage emoji="🧬" title="Your Algorithm DNA" description="The algorithm feels random? Let's map YOUR personal patterns.">
      {data && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-5">
            {data.best_days?.length > 0 && <DayHeatmap days={data.best_days} />}
            {data.best_times?.length > 0 && <TimeSegments times={data.best_times} />}
            {data.best_topics?.length > 0 && (
              <RankedList label="BEST TOPICS" emoji="📌" items={data.best_topics.map(t => ({ label: t.topic, value: t.avg_views }))} />
            )}
            {data.best_lengths?.length > 0 && (
              <RankedList label="BEST VIDEO LENGTHS" emoji="⏱️" items={data.best_lengths.map(l => ({ label: l.range, value: l.avg_views }))} />
            )}
          </div>

          {/* Sweet Spot — large, glowing */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="cb-card-glow p-8"
          >
            <p className="t-section text-primary mb-3">🎯 YOUR ALGORITHM SWEET SPOT</p>
            <p className="text-base leading-relaxed font-medium">{data.sweet_spot}</p>
            <CopyButton text={data.sweet_spot} className="mt-4" />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="cb-card">
              <p className="t-section text-info mb-2">💡 BIGGEST INSIGHT</p>
              <p className="text-sm leading-relaxed">{data.biggest_insight}</p>
            </div>
            <div className="cb-card">
              <p className="t-section text-warning mb-2">🔄 ONE CHANGE TO MAKE</p>
              <p className="text-sm leading-relaxed">{data.biggest_change}</p>
            </div>
          </div>
        </div>
      )}
    </FeaturePage>
  );
}
