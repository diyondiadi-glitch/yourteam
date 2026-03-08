import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Wrench, ChevronDown, Skull, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FeaturePage from "@/components/FeaturePage";
import LoadingSteps from "@/components/LoadingSteps";
import CopyButton from "@/components/CopyButton";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/youtube-auth";
import { getMyChannel, getRecentVideos, getChannelContext, formatCount, type VideoData, type ChannelData } from "@/lib/youtube-api";
import { callGroq, parseJsonFromResponse } from "@/lib/groq-api";
import { getSelectedVideo, clearSelectedVideo } from "@/lib/video-context";

interface Diagnosis {
  reason: string;
  evidence: string;
  emotional_context: string;
  fix: string;
  priority: string;
}

export default function VideoDeath() {
  const navigate = useNavigate();
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>("");
  const [diagnosis, setDiagnosis] = useState<Diagnosis[]>([]);
  const [killer, setKiller] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [loadStep, setLoadStep] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) { navigate("/", { replace: true }); return; }
    loadVideos();
  }, []);

  async function loadVideos() {
    try {
      const ch = await getMyChannel();
      setChannel(ch);
      const vids = await getRecentVideos(ch.id, 20);
      setVideos(vids);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVideos(false);
    }
  }

  async function runDiagnosis() {
    if (!selectedVideo || !channel) return;
    const video = videos.find(v => v.id === selectedVideo);
    if (!video) return;

    setLoading(true);
    setDiagnosis([]);
    setKiller("");
    setLoadStep(0);

    const avgViews = Math.round(videos.reduce((s, v) => s + v.viewCount, 0) / videos.length);
    const avgLikes = Math.round(videos.reduce((s, v) => s + v.likeCount, 0) / videos.length);
    const avgComments = Math.round(videos.reduce((s, v) => s + v.commentCount, 0) / videos.length);
    const publishDay = new Date(video.publishedAt).toLocaleDateString("en-US", { weekday: "long" });

    setTimeout(() => setLoadStep(1), 1500);
    setTimeout(() => setLoadStep(2), 3000);

    try {
      const result = await callGroq(
        "You are a brutal YouTube algorithm expert. Given this video's performance data compared to channel averages, identify exactly 3 reasons it underperformed. For each reason give: the specific evidence from the data, the emotional impact on the creator, and one precise actionable fix. Be specific, be brutal, be helpful. Format as JSON array with fields: reason, evidence, emotional_context, fix, priority(high/medium/low). After the JSON array, add a line starting with 'KILLER:' followed by the single most important reason.",
        `Channel: ${channel.title} (${formatCount(channel.subscriberCount)} subs)
Channel averages: ${formatCount(avgViews)} views, ${avgLikes} likes, ${avgComments} comments per video

THIS VIDEO:
Title: "${video.title}"
Views: ${formatCount(video.viewCount)} (${video.viewCount < avgViews ? "BELOW" : "ABOVE"} average by ${Math.abs(Math.round((video.viewCount / avgViews - 1) * 100))}%)
Likes: ${video.likeCount}
Comments: ${video.commentCount}
Published: ${video.publishedAt} (${publishDay})

Why did this video underperform?`
      );

      const parsed = parseJsonFromResponse(result);
      if (Array.isArray(parsed)) {
        setDiagnosis(parsed);
      }

      const killerMatch = result.match(/KILLER:\s*(.+)/i);
      setKiller(killerMatch?.[1] || (parsed?.[0]?.reason || "Check the diagnosis above"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const priorityColor = (p: string) => {
    if (p === "high") return "text-destructive";
    if (p === "medium") return "text-warning";
    return "text-muted-foreground";
  };

  return (
    <FeaturePage emoji="💀" title="Autopsy Room" description="Select any video and get a brutally honest diagnosis with actionable fixes">
      {/* Video selector */}
      <div className="mb-6">
        {loadingVideos ? (
          <div className="h-12 rounded-xl bg-secondary animate-pulse" />
        ) : (
          <Select value={selectedVideo} onValueChange={setSelectedVideo}>
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder="Select a video to diagnose..." />
            </SelectTrigger>
            <SelectContent>
              {videos.map(v => (
                <SelectItem key={v.id} value={v.id}>
                  {v.title} ({formatCount(v.viewCount)} views)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Button
        variant="destructive"
        size="lg"
        className="w-full h-14 rounded-xl text-lg font-bold mb-8"
        onClick={runDiagnosis}
        disabled={!selectedVideo || loading}
      >
        <Skull className="mr-2 h-5 w-5" /> Run Diagnosis
      </Button>

      {loading && (
        <LoadingSteps
          steps={["Fetching video data...", "Analysing performance patterns...", "Generating brutal diagnosis..."]}
          currentStep={loadStep}
        />
      )}

      <AnimatePresence>
        {diagnosis.length > 0 && (
          <div className="space-y-4 mb-8">
            {diagnosis.map((d, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.3 }}
                className="rounded-xl border border-border bg-card p-6 card-glow"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">Reason #{i + 1}: {d.reason}</p>
                      <span className={`text-xs font-bold uppercase ${priorityColor(d.priority)}`}>{d.priority}</span>
                    </div>
                    <p className="text-sm text-warning">{d.evidence}</p>
                    {d.emotional_context && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{d.emotional_context}</p>
                    )}
                  </div>
                  <CopyButton text={`${d.reason}\n${d.evidence}\n${d.fix}`} />
                </div>
                <div className="ml-11 mt-3 p-3 rounded-lg bg-success/5 border border-success/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Wrench className="h-3.5 w-3.5 text-success" />
                    <span className="text-xs font-semibold uppercase text-success">Fix</span>
                  </div>
                  <p className="text-sm">{d.fix}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {killer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-destructive/20 bg-destructive/5 p-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-destructive" />
            <p className="text-xs font-semibold uppercase tracking-wider text-destructive">The Real Killer</p>
          </div>
          <p className="text-sm leading-relaxed">{killer}. Fix this first.</p>
        </motion.div>
      )}
    </FeaturePage>
  );
}
