import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FeaturePage from "@/components/FeaturePage";
import LoadingSteps from "@/components/LoadingSteps";
import ShareInsight from "@/components/ShareInsight";
import { useChannelData } from "@/hooks/useChannelData";
import { callAI, parseJsonFromAI } from "@/lib/ai-service";

export default function NicheGapRadar() {
  const { channel, videos, loading: dataLoading, channelContext } = useChannelData();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => { if (channel && videos.length > 0 && data.length === 0) analyse(); }, [channel, videos]);

  async function analyse() {
    setLoading(true); setStep(0);
    try {
      setStep(1);
      const res = await callAI(
        "You are a YouTube niche analyst. Identify 8 topics NOT covered by major channels in this niche with rising demand. Return JSON array: [{topic: string, score: number (1-100), why_uncovered: string, search_signal: string, how_to_own: string, suggested_title: string, days_left: number}]",
        channelContext
      );
      setStep(2);
      setData(parseJsonFromAI(res) || []);
    } catch {}
    setLoading(false);
  }

  if (dataLoading || loading) {
    return (
      <FeaturePage emoji="🔥" title="Niche Gap Radar" description="What nobody in your niche is covering right now">
        <LoadingSteps steps={["Scanning niche...", "Identifying gaps...", "Ranking opportunities..."]} currentStep={step} />
      </FeaturePage>
    );
  }

  return (
    <FeaturePage emoji="🔥" title="Niche Gap Radar" description="What nobody in your niche is covering right now">
      {/* Layer 1 */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <p className="data-number-xl" style={{ fontSize: "52px", fontWeight: 800, color: "hsl(var(--primary))" }}>{data.length}</p>
        <p className="text-lg text-muted-foreground">unclaimed topics in your niche</p>
      </motion.div>

      {/* Layer 2 */}
      <div className="grid sm:grid-cols-2 gap-3">
        {data.map((topic, i) => {
          const urgency = topic.days_left < 7 ? "destructive" : topic.days_left < 14 ? "warning" : "success";
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="cb-card space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{topic.topic}</p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `hsl(var(--${urgency}) / 0.12)`, color: `hsl(var(--${urgency}))` }}>
                  {topic.days_left}d left
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
                <div className="h-full rounded-full bg-primary bar-animate" style={{ width: `${topic.score}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{topic.why_uncovered}</p>
              <p className="text-xs font-medium" style={{ color: "hsl(var(--info))" }}>Title: "{topic.suggested_title}"</p>
            </motion.div>
          );
        })}
      </div>

      {data.length > 0 && <ShareInsight title="Niche Gap Radar" value={`${data.length} gaps`} subtitle={`Top: ${data[0]?.topic} — ${data[0]?.score}/100`} />}
    </FeaturePage>
  );
}
