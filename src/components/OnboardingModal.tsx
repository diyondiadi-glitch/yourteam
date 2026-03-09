import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, Zap, Sparkles, Link2, Search, Lock } from "lucide-react";
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

type Step = "choose" | "quick-loading" | "success";

interface LoadingProgress {
  findChannel: "pending" | "loading" | "done" | "error";
  loadVideos: "pending" | "loading" | "done" | "error";
  readComments: "pending" | "loading" | "done" | "error";
  buildInsights: "pending" | "loading" | "done" | "error";
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<Step>("choose");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [channel, setChannel] = useState<PublicChannelData | null>(null);
  const [videos, setVideos] = useState<PublicVideoData[]>([]);
  const [insight, setInsight] = useState("");
  const [progress, setProgress] = useState<LoadingProgress>({
    findChannel: "pending", loadVideos: "pending", readComments: "pending", buildInsights: "pending",
  });

  async function handleQuickConnect() {
    if (!url.trim()) { setError("Please paste your YouTube channel URL"); return; }
    setError("");
    setStep("quick-loading");
    setProgress({ findChannel: "loading", loadVideos: "pending", readComments: "pending", buildInsights: "pending" });

    try {
      const ch = await fetchChannelByUrl(url);
      if (!ch) { setError("Could not find that channel. Check the URL and try again."); setStep("choose"); return; }
      setChannel(ch);
      setProgress(p => ({ ...p, findChannel: "done", loadVideos: "loading" }));

      const vids = await fetchChannelVideos(ch.id, 50);
      setVideos(vids);
      setProgress(p => ({ ...p, loadVideos: "done", readComments: "loading" }));

      storeChannelData(ch, vids);
      setProgress(p => ({ ...p, readComments: "done", buildInsights: "loading" }));

      try {
        const avgViews = vids.length > 0 ? Math.round(vids.reduce((s, v) => s + v.viewCount, 0) / vids.length) : 0;
        const result = await callAI(
          "You are a YouTube growth expert. Give ONE specific, exciting insight about this channel in 2 sentences. Be encouraging but specific.",
          `Channel: ${ch.title}, ${ch.subscriberCount} subs, ${vids.length} videos, avg ${avgViews} views. Top: "${vids[0]?.title}" with ${vids[0]?.viewCount} views.`
        );
        setInsight(result);
      } catch {
        setInsight(`Your channel has ${formatCount(ch.subscriberCount)} subscribers. Let's find your biggest growth opportunities!`);
      }

      setProgress(p => ({ ...p, buildInsights: "done" }));
      setStep("success");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
      setStep("choose");
    }
  }

  function handleDemo() {
    enableDemoMode();
    onComplete();
  }

  const progressSteps = [
    { key: "findChannel" as const, label: "Finding your channel...", done: channel ? `Found — ${channel.title}` : "Channel found!" },
    { key: "loadVideos" as const, label: "Loading videos...", done: `${videos.length} videos loaded!` },
    { key: "readComments" as const, label: "Reading comments...", done: "Comments analysed!" },
    { key: "buildInsights" as const, label: "Building your insights...", done: "Insights ready!" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(16px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl mx-4 rounded-2xl border border-border bg-card p-8 shadow-2xl"
      >
        <AnimatePresence mode="wait">
          {step === "choose" && (
            <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="text-center mb-8">
                <Zap className="h-10 w-10 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Connect Your YouTube Channel</h2>
                <p className="text-muted-foreground">How do you want to connect?</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Full Connect - Coming Soon */}
                <div className="rounded-xl border border-border p-5 space-y-3 opacity-60">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Full Connect</h3>
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Connect your Google account directly. Unlocks private analytics + deeper data.</p>
                  <Button disabled className="w-full" variant="outline">
                    <Lock className="mr-2 h-4 w-4" /> Coming Soon
                  </Button>
                </div>

                {/* Quick Connect - Primary */}
                <div className="rounded-xl border-2 border-primary/40 p-5 space-y-3" style={{ boxShadow: "0 0 32px hsl(var(--primary) / 0.12)" }}>
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Quick Connect</h3>
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Recommended
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Paste your channel URL. No permissions needed. Works instantly.</p>
                  <Input
                    placeholder="youtube.com/@yourchannel"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleQuickConnect()}
                    className="h-11"
                    autoFocus
                  />
                  <Button 
                    onClick={handleQuickConnect} 
                    className="w-full h-11 font-semibold"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                  >
                    Connect Channel →
                  </Button>
                </div>
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              <div className="text-center pt-2">
                <button onClick={handleDemo} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  or <span className="text-primary font-medium">Explore Demo →</span>
                </button>
              </div>
            </motion.div>
          )}

          {step === "quick-loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 py-4">
              {channel && (
                <div className="flex flex-col items-center">
                  <img src={channel.avatar} alt={channel.title} className="h-20 w-20 rounded-full ring-4 ring-primary/30 mb-3" />
                  <h3 className="text-lg font-bold">{channel.title}</h3>
                </div>
              )}
              <div className="space-y-4">
                {progressSteps.map(({ key, label, done }) => {
                  const status = progress[key];
                  return (
                    <motion.div key={key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                      {status === "done" ? (
                        <CheckCircle className="h-5 w-5 text-success shrink-0" />
                      ) : status === "loading" ? (
                        <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-border shrink-0" />
                      )}
                      <span className={`text-sm ${status === "done" ? "text-foreground" : status === "loading" ? "text-foreground" : "text-muted-foreground"}`}>
                        {status === "done" ? `✓ ${done}` : label}
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
                  <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-success flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-1">{channel.title}</h2>
                <p className="text-muted-foreground text-sm">{formatCount(channel.subscriberCount)} subscribers · {videos.length} videos loaded</p>
              </div>

              <div className="rounded-xl p-4" style={{ borderLeft: "4px solid hsl(var(--info))", background: "hsl(var(--info) / 0.05)" }}>
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "hsl(var(--info))" }} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "hsl(var(--info))" }}>Your First Insight</p>
                    <p className="text-sm leading-relaxed">{insight}</p>
                  </div>
                </div>
              </div>

              <Button onClick={onComplete} className="w-full h-12 text-base font-semibold" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                <Zap className="h-5 w-5 mr-2" /> Enter CreatorBrain
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
