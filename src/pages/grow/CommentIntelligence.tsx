import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FeaturePage from "@/components/FeaturePage";
import LoadingSteps from "@/components/LoadingSteps";
import { useChannelData } from "@/hooks/useChannelData";
import { callAI, parseJsonFromAI } from "@/lib/ai-service";
import { getVideoComments } from "@/lib/youtube-api";
import type { VideoData } from "@/lib/youtube-api";
import ShareInsight from "@/components/ShareInsight";
import CopyButton from "@/components/CopyButton";

const emotionColors: Record<string, string> = {
  grateful: "--success", love: "--success", excitement: "--success",
  curious: "--info", question: "--info",
  frustrated: "--destructive", complaint: "--destructive", confused: "--destructive",
  idea: "--warning", suggestion: "--warning", request: "--warning",
};

export default function CommentIntelligence() {
  const { channel, videos, loading: dataLoading, channelContext } = useChannelData();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => { if (videos.length > 0 && !selectedVideoId) setSelectedVideoId(videos[0].id); }, [videos]);
  useEffect(() => { if (selectedVideoId && channel) loadComments(); }, [selectedVideoId]);

  async function loadComments() {
    setLoading(true); setStep(0);
    try {
      const cmts = await getVideoComments(selectedVideoId, 50);
      setStep(1);
      const res = await callAI(
        "Analyse these YouTube comments. Classify each by emotion (grateful/curious/frustrated/idea). Return JSON: { summary: string, emotion_breakdown: {grateful: number, curious: number, frustrated: number, idea: number}, video_ideas: [{idea: string, demand: number}], complaints: [{issue: string, count: number}], reply_opportunities: [{comment: string, suggested_reply: string}], comments: [{text: string, emotion: string, is_gold: boolean}] }",
        `Comments for analysis:\n${cmts.map((c: string) => `"${c}"`).join("\n")}`
      );
      setStep(2);
      const data = parseJsonFromAI(res);
      setAnalysis(data);
      setComments(data?.comments || cmts.map((c: string) => ({ text: c, emotion: "curious", is_gold: false })));
    } catch {}
    setLoading(false);
  }

  if (dataLoading || loading) {
    return (
      <FeaturePage emoji="⛏" title="Comment Intelligence" description="Mine your comments for ideas, sentiment, and reply opportunities">
        <LoadingSteps steps={["Loading comments...", "Analysing sentiment...", "Building insights..."]} currentStep={step} />
      </FeaturePage>
    );
  }

  return (
    <FeaturePage emoji="⛏" title="Comment Intelligence" description="Mine your comments for ideas, sentiment, and reply opportunities">
      {/* Video selector */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
        {videos.slice(0, 8).map(v => (
          <button key={v.id} onClick={() => setSelectedVideoId(v.id)} className={`shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${selectedVideoId === v.id ? "border-primary" : "border-transparent"}`}>
            <img src={v.thumbnail} alt={v.title} className="w-24 h-14 object-cover" />
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Left — Comments (60%) */}
        <div className="md:col-span-3 space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin">
          {comments.map((c, i) => {
            const colorVar = emotionColors[c.emotion] || "--muted-foreground";
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.03, 0.5) }} className="rounded-lg p-3 relative" style={{ borderLeft: `3px solid hsl(var(${colorVar}))`, background: "hsl(var(--card))", border: `1px solid hsl(var(--border))`, borderLeftWidth: "3px", borderLeftColor: `hsl(var(${colorVar}))` }}>
                {c.is_gold && <span className="absolute top-2 right-2 text-xs">💡 Gold</span>}
                <p className="text-sm mb-1.5">{c.text}</p>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: `hsl(var(${colorVar}) / 0.1)`, color: `hsl(var(${colorVar}))` }}>
                  {c.emotion}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Right — Intelligence (40%) */}
        <div className="md:col-span-2 space-y-4">
          {analysis?.summary && (
            <div className="rounded-xl p-4" style={{ background: "hsl(var(--primary) / 0.06)", border: "1px solid hsl(var(--primary) / 0.15)" }}>
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Key Insight</p>
              <p className="text-sm">{analysis.summary}</p>
            </div>
          )}

          {analysis?.emotion_breakdown && (
            <div className="cb-card">
              <p className="t-label text-muted-foreground mb-3">Emotion Breakdown</p>
              {Object.entries(analysis.emotion_breakdown).map(([emotion, count]) => (
                <div key={emotion} className="flex items-center gap-2 mb-2">
                  <span className="text-xs w-20 capitalize">{emotion}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
                    <div className="h-full rounded-full bar-animate" style={{ width: `${Math.min(Number(count) * 2, 100)}%`, background: `hsl(var(${emotionColors[emotion] || "--muted-foreground"}))` }} />
                  </div>
                  <span className="text-xs font-bold w-8 text-right">{String(count)}</span>
                </div>
              ))}
            </div>
          )}

          {analysis?.video_ideas && (
            <div className="cb-card">
              <p className="t-label text-muted-foreground mb-3">Video Ideas From Comments</p>
              {analysis.video_ideas.map((idea: any, i: number) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span className="text-sm flex-1">{idea.idea}</span>
                  <span className="text-xs font-bold text-primary">{idea.demand}x</span>
                </div>
              ))}
            </div>
          )}

          {analysis?.reply_opportunities && (
            <div className="cb-card">
              <p className="t-label text-muted-foreground mb-3">Reply Opportunities</p>
              {analysis.reply_opportunities.slice(0, 3).map((r: any, i: number) => (
                <div key={i} className="mb-3 pb-3 border-b border-border/30 last:border-0 last:pb-0 last:mb-0">
                  <p className="text-xs text-muted-foreground mb-1">"{r.comment}"</p>
                  <div className="flex items-start gap-2 mt-1">
                    <p className="text-xs" style={{ color: "hsl(var(--info))" }}>{r.suggested_reply}</p>
                    <CopyButton text={r.suggested_reply} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {analysis && <ShareInsight title="Comment Intelligence" text={analysis.summary || "Comment analysis complete"} />}
    </FeaturePage>
  );
}
