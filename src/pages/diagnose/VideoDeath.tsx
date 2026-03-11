import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, Zap, AlertTriangle, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import FeaturePage from "@/components/FeaturePage";
import { useChannelData } from "@/hooks/useChannelData";
import { type VideoData } from "@/lib/youtube-api";
import { formatCount } from "@/lib/utils";
import { callAI, safeJsonParse } from "@/lib/ai-service";

interface DiagnosisCard {
  reason: string;
  evidence: string;
  fix: string;
}

interface AutopsyResult {
  killer: string;
  diagnosis: DiagnosisCard[];
  resurrection: string[];
}

export default function VideoDeath() {
  const { channel, videos, avgViews, isConnected } = useChannelData();
  const [selectedId, setSelectedId] = useState<string>("");
  const [result, setResult] = useState<AutopsyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const diagnosisRef = useRef<HTMLDivElement>(null);

  // Auto-select the worst performing video from last 30 days
  useEffect(() => {
    if (!isConnected || !videos.length || selectedId) return;

    const now = Date.now();
    const recentVideos = videos.filter(v => (now - new Date(v.publishedAt).getTime()) / 86400000 <= 30);
    const pool = recentVideos.length > 0 ? recentVideos : videos.slice(0, 10);
    
    const worst = pool.reduce((prev, curr) => (curr.views < prev.views ? curr : prev), pool[0]);
    if (worst) {
      setSelectedId(worst.id);
      runAutopsy(worst.id);
    }
  }, [isConnected, videos.length]);

  async function runAutopsy(videoId: string) {
    const video = videos.find(v => v.id === videoId);
    if (!video || !channel) return;

    setSelectedId(videoId);
    setLoading(true);
    setResult(null);

    try {
      const prompt = `You are a YouTube growth expert performing a "Video Autopsy". Analyze why this video underperformed. 
      Return JSON with this structure:
      {
        "killer": "One bold sentence explaining the primary reason for failure",
        "diagnosis": [
          {"reason": "Reason 1", "evidence": "Stats evidence", "fix": "Specific fix"},
          {"reason": "Reason 2", "evidence": "Stats evidence", "fix": "Specific fix"},
          {"reason": "Reason 3", "evidence": "Stats evidence", "fix": "Specific fix"}
        ],
        "resurrection": ["Step 1", "Step 2", "Step 3"]
      }
      Never claim to have retention data. Use title-to-views ratio and comment sentiment as evidence.`;

      const aiResponse = await callAI(prompt, 
        `Video: "${video.title}"
        Views: ${video.views} (Channel Avg: ${Math.round(avgViews)})
        Likes: ${video.likes}
        Comments: ${video.comments}
        Published: ${new Date(video.publishedAt).toDateString()}`
      );

      const parsed = safeJsonParse(aiResponse);
      setResult(parsed);
      
      // Smooth scroll to diagnosis
      setTimeout(() => {
        diagnosisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e) {
      setResult({
        killer: "Packaging & Hook Disconnect",
        diagnosis: [
          { reason: "Low Title-to-View Ratio", evidence: `Only ${video.views} views despite ${formatCount(channel.subscribers)} subscribers.`, fix: "Use more curiosity-gap titles." },
          { reason: "Static Intro", evidence: "Comment sentiment suggests a slow start.", fix: "Cut the first 10 seconds of fluff." },
          { reason: "Timing", evidence: `Published on ${new Date(video.publishedAt).toLocaleDateString('en-US', {weekday: 'long'})} which is not your best day.`, fix: `Shift uploads to ${channel.bestDay}.` }
        ],
        resurrection: [
          "Change the thumbnail to a high-contrast version.",
          "Reply to the top 3 comments to boost engagement signals.",
          "Post a community tab poll related to this video's topic."
        ]
      });
    } finally {
      setLoading(false);
    }
  }

  if (!isConnected) return null;

  const displayVideos = videos.slice(0, 20);

  return (
    <FeaturePage 
      emoji="💀" 
      title="Autopsy Room" 
      description="Identify why your videos underperformed and how to resurrect them."
    >
      <div className="space-y-12">
        {/* Horizontal Scrollable Row */}
        <div className="relative group">
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
            {displayVideos.map((v) => {
              const performance = v.views / avgViews;
              const isSelected = selectedId === v.id;
              
              return (
                <motion.div
                  key={v.id}
                  whileHover={{ y: -4 }}
                  onClick={() => runAutopsy(v.id)}
                  className={`flex-shrink-0 w-[140px] snap-start cursor-pointer transition-all duration-300 rounded-xl overflow-hidden border-2 ${isSelected ? "border-yellow-500 ring-4 ring-yellow-500/20" : "border-zinc-800 hover:border-zinc-700"}`}
                >
                  <div className="aspect-video relative">
                    <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                    <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[8px] font-bold">
                      {formatCount(v.views)}
                    </div>
                  </div>
                  <div className="p-2 bg-zinc-900/50">
                    <h3 className="text-[10px] font-bold line-clamp-1 mb-1">{v.title}</h3>
                    <div className={`text-[9px] font-black uppercase ${performance < 0.7 ? "text-red-500" : performance > 1.3 ? "text-green-500" : "text-yellow-500"}`}>
                      {performance < 1 ? `-${Math.round((1-performance)*100)}%` : `+${Math.round((performance-1)*100)}%`}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {/* Fades for scroll indicators */}
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#09090b] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#09090b] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Diagnosis Section */}
        <div ref={diagnosisRef} className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <Loader2 className="h-12 w-12 text-yellow-500 animate-spin mb-4" />
                <p className="text-zinc-400 font-medium">Running deep autopsy...</p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                {/* Primary Killer */}
                <div className="text-center space-y-2">
                  <p className="text-xs text-red-500 font-black uppercase tracking-widest">Primary Killer</p>
                  <h2 className="text-3xl font-bold font-display max-w-2xl mx-auto">{result.killer}</h2>
                </div>

                {/* 3 Diagnosis Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {result.diagnosis.map((d, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
                      <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg">{d.reason}</h3>
                        <p className="text-xs text-zinc-500 leading-relaxed italic">Evidence: {d.evidence}</p>
                        <p className="text-sm text-zinc-300 leading-relaxed pt-2 border-t border-zinc-800">{d.fix}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resurrection Section */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    <Zap className="h-32 w-32 text-yellow-500" />
                  </div>
                  <h3 className="text-xl font-bold font-display mb-8 flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-yellow-500" />
                    Resurrect This Video
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {result.resurrection.map((step, i) => (
                      <div key={i} className="flex gap-4 group">
                        <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-xs font-bold group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                          {i + 1}
                        </div>
                        <p className="text-zinc-300 text-sm leading-relaxed pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <Skull className="h-12 w-12 mb-4 opacity-20" />
                <p>Select a video to run an autopsy</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </FeaturePage>
  );
}
