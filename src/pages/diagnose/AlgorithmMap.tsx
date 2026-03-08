import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Map, BarChart3 } from "lucide-react";
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

      // Extract patterns
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

  function BarChart({ items, label }: { items: { label: string; value: number }[]; label: string }) {
    const max = Math.max(...items.map(i => i.value), 1);
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">{label}</h3>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs w-20 shrink-0 text-muted-foreground">{item.label}</span>
              <div className="flex-1 h-3 bg-border rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / max) * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
              <span className="text-xs font-bold w-16 text-right">{formatCount(item.value)}</span>
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
          <div className="grid md:grid-cols-2 gap-4">
            {data.best_days?.length > 0 && (
              <BarChart label="📅 Best Upload Days" items={data.best_days.map(d => ({ label: d.day, value: d.avg_views }))} />
            )}
            {data.best_times?.length > 0 && (
              <BarChart label="🕐 Best Upload Times" items={data.best_times.map(t => ({ label: t.time, value: t.avg_views }))} />
            )}
            {data.best_topics?.length > 0 && (
              <BarChart label="📌 Best Topics" items={data.best_topics.map(t => ({ label: t.topic, value: t.avg_views }))} />
            )}
            {data.best_lengths?.length > 0 && (
              <BarChart label="⏱️ Best Video Lengths" items={data.best_lengths.map(l => ({ label: l.range, value: l.avg_views }))} />
            )}
          </div>

          {/* Sweet Spot */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-primary/20 bg-primary/5 p-6">
            <p className="text-xs font-semibold uppercase text-primary mb-2">🎯 Your Algorithm Sweet Spot</p>
            <p className="text-sm leading-relaxed">{data.sweet_spot}</p>
            <CopyButton text={data.sweet_spot} className="mt-2" />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">💡 Biggest Insight</p>
              <p className="text-sm">{data.biggest_insight}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">🔄 One Change to Make</p>
              <p className="text-sm">{data.biggest_change}</p>
            </div>
          </div>
        </div>
      )}
    </FeaturePage>
  );
}
