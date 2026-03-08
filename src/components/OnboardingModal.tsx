import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, Zap, Youtube, Sparkles } from "lucide-react";
import {
  fetchChannelByUrl,
  fetchChannelVideos,
  storeChannelData,
  type PublicChannelData,
  type PublicVideoData,
} from "@/lib/youtube-public-api";
import { enableDemoMode } from "@/lib/youtube-api";
import { callAI } from "@/lib/ai-service";
import { formatCount } from "@/lib/youtube-api";

interface OnboardingModalProps {
  onComplete: () => void;
}

type Step = "welcome" | "loading" | "success";

interface LoadingProgress {
  findChannel: "pending" | "loading" | "done" | "error";
  loadVideos: "pending" | "loading" | "done" | "error";
  analysePerformance: "pending" | "loading" | "done" | "error";
  buildInsights: "pending" | "loading" | "done" | "error";
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<Step>("welcome");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [channel, setChannel] = useState<PublicChannelData | null>(null);
  const [videos, setVideos] = useState<PublicVideoData[]>([]);
  const [insight, setInsight] = useState("");
  const [progress, setProgress] = useState<LoadingProgress>({
    findChannel: "pending",
    loadVideos: "pending",
    analysePerformance: "pending",
    buildInsights: "pending",
  });

  async function handleConnect() {
    if (!url.trim()) {
      setError("Please paste your YouTube channel URL");
      return;
    }
    setError("");
    setStep("loading");
    setProgress({ findChannel: "loading", loadVideos: "pending", analysePerformance: "pending", buildInsights: "pending" });

    try {
      const ch = await fetchChannelByUrl(url);
      if (!ch) {
        setError("Could not find that channel. Please check the URL and try again.");
        setStep("welcome");
        return;
      }
      setChannel(ch);
      setProgress(p => ({ ...p, findChannel: "done", loadVideos: "loading" }));

      const vids = await fetchChannelVideos(ch.id, 50);
      setVideos(vids);
      setProgress(p => ({ ...p, loadVideos: "done", analysePerformance: "loading" }));

      storeChannelData(ch, vids);
      setProgress(p => ({ ...p, analysePerformance: "done", buildInsights: "loading" }));

      try {
        const avgViews = vids.length > 0
          ? Math.round(vids.reduce((s, v) => s + v.viewCount, 0) / vids.length)
          : 0;
        const result = await callAI(
          "You are a YouTube growth expert. Give ONE specific, exciting insight about this channel in 2 sentences. Be encouraging but specific to their data.",
          `Channel: ${ch.title}, ${ch.subscriberCount} subs, ${vids.length} videos, avg ${avgViews} views. Top video: "${vids[0]?.title}" with ${vids[0]?.viewCount} views. What's one exciting insight?`
        );
        setInsight(result);
      } catch {
        setInsight(`Your channel has ${formatCount(ch.subscriberCount)} subscribers and your content is performing well. Let's find your biggest growth opportunities!`);
      }

      setProgress(p => ({ ...p, buildInsights: "done" }));
      setStep("success");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setStep("welcome");
    }
  }

  function handleDemo() {
    enableDemoMode();
    onComplete();
  }

  const progressSteps = [
    { key: "findChannel", label: "Finding your channel...", doneLabel: "Channel found!" },
    { key: "loadVideos", label: `Loading videos...`, doneLabel: `${videos.length} videos loaded!` },
    { key: "analysePerformance", label: "Analysing performance...", doneLabel: "Performance analysed!" },
    { key: "buildInsights", label: "Building your insights...", doneLabel: "Insights ready!" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg mx-4 rounded-2xl border border-border bg-card p-8 shadow-2xl"
      >
        <AnimatePresence mode="wait">
          {step === "welcome" && (
            <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Welcome to CreatorBrain ⚡</h2>
                <p className="text-muted-foreground">Let's connect your YouTube channel to unlock personalised insights</p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Paste your YouTube channel URL</label>
                <Input
                  placeholder="https://youtube.com/@yourchannel"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                  className="h-12 text-base"
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              <Button onClick={handleConnect} className="w-full h-12 text-base font-semibold" variant="default">
                <Youtube className="h-5 w-5 mr-2" />
                Connect My Channel
              </Button>

              <div className="text-center">
                <button onClick={handleDemo} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Don't have a YouTube channel? <span className="text-primary font-medium">Explore with demo data →</span>
                </button>
              </div>
            </motion.div>
          )}

          {step === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 py-4">
              {channel && (
                <div className="flex flex-col items-center">
                  <img src={channel.avatar} alt={channel.title} className="h-20 w-20 rounded-full ring-4 ring-primary/30 mb-3" />
                  <h3 className="text-lg font-bold">{channel.title}</h3>
                </div>
              )}
              <div className="space-y-4">
                {progressSteps.map(({ key, label, doneLabel }) => {
                  const status = progress[key];
                  return (
                    <motion.div key={key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                      {status === "done" ? (
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      ) : status === "loading" ? (
                        <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-border shrink-0" />
                      )}
                      <span className={`text-sm ${status === "done" ? "text-foreground" : status === "loading" ? "text-foreground" : "text-muted-foreground"}`}>
                        {status === "done" ? doneLabel : label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === "success" && channel && (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="text-center">
                <div className="relative mx-auto w-20 h-20 mb-4">
                  <img src={channel.avatar} alt={channel.title} className="h-20 w-20 rounded-full ring-4 ring-primary/30" />
                  <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-1">{channel.title}</h2>
                <p className="text-muted-foreground text-sm">
                  {formatCount(channel.subscriberCount)} subscribers · {videos.length} videos loaded
                </p>
              </div>

              <div className="rounded-xl border border-info/20 bg-info/5 p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-info mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-info mb-1">Your First Insight</p>
                    <p className="text-sm leading-relaxed">{insight}</p>
                  </div>
                </div>
              </div>

              <Button onClick={onComplete} className="w-full h-12 text-base font-semibold">
                <Zap className="h-5 w-5 mr-2" />
                Enter CreatorBrain
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
