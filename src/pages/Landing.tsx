import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchCompleteChannelData, type FetchProgress, type ChannelData } from "@/lib/youtube-api";
import { callAI } from "@/lib/ai-service";
import { formatCount } from "@/lib/utils";

type Step = "input" | "loading" | "success" | "error";

const featurePills = [
  "Video Autopsy",
  "AI Coach Max",
  "Comment Intelligence",
  "Growth Action Plan",
];

export default function Landing() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<FetchProgress | null>(null);
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [insight, setInsight] = useState("");

  async function handleAnalyse() {
    if (!url.trim()) return;
    setStep("loading");
    setError("");

    try {
      const channelData = await fetchCompleteChannelData(url, setProgress);
      setChannel(channelData);

      // Save to localStorage for the rest of the app
      localStorage.setItem("cb_channel_data", JSON.stringify(channelData));

      try {
        const aiInsight = await callAI(
          "You are a YouTube growth strategist. Give exactly 2 sentences. Sentence 1 must contain a real number showing recent video performance vs average. Sentence 2 must be one specific action with a specific day of the week. Be direct. No praise.",
          `Channel: ${channelData.name}. Subscribers: ${channelData.subscribers}. Avg Views: ${channelData.avgViews}. Recent video views: ${channelData.videos[0]?.views}. Best Day: ${channelData.bestDay}.`,
          { maxTokens: 200, temperature: 0.7 }
        );
        setInsight(aiInsight);
      } catch {
        setInsight(`Your channel has ${formatCount(channelData.subscribers)} subscribers. Post on ${channelData.bestDay} to maximize your reach.`);
      }

      setStep("success");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
      setStep("error");
    }
  }

  function handleEnterApp() {
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white relative overflow-hidden font-sans">
      {/* Dot Grid Texture */}
      <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {/* ── INPUT STATE ── */}
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full text-center"
            >
              <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight mb-4">
                Stop Guessing. <br />
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">Start Growing.</span>
              </h1>
              <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
                Paste your channel URL. Get your personal AI strategist in 30 seconds — for free.
              </p>

              <div className="flex flex-col md:flex-row gap-3 max-w-xl mx-auto mb-8">
                <Input
                  placeholder="youtube.com/@handle"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyse()}
                  className="h-14 bg-zinc-900/50 border-zinc-800 text-lg px-6 rounded-2xl focus-visible:ring-yellow-500/50"
                />
                <Button
                  onClick={handleAnalyse}
                  className="h-14 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 rounded-2xl text-lg transition-all"
                >
                  Analyze
                </Button>
              </div>

              <div className="flex flex-wrap justify-center gap-3 mb-10">
                {featurePills.map((p) => (
                  <span key={p} className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-sm text-zinc-400">
                    {p}
                  </span>
                ))}
              </div>

              <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
                No account required. Works with any public YouTube channel.
              </p>
            </motion.div>
          )}

          {/* ── LOADING STATE ── */}
          {step === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl backdrop-blur-xl"
            >
              <div className="flex flex-col items-center text-center mb-8">
                <Loader2 className="h-12 w-12 text-yellow-500 animate-spin mb-4" />
                <h2 className="text-2xl font-bold font-display">
                  {progress?.channelName ? `Analyzing ${progress.channelName}` : "Connecting to YouTube..."}
                </h2>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Channel data", step: "finding" },
                  { label: "Recent videos", step: "videos" },
                  { label: "Comments", step: "comments" },
                  { label: "AI insights", step: "insights" },
                ].map((s, idx) => {
                  const steps = ["finding", "videos", "comments", "insights", "done"];
                  const currentIdx = steps.indexOf(progress?.step || "finding");
                  const isDone = currentIdx > idx;
                  const isCurrent = currentIdx === idx;

                  return (
                    <div key={s.label} className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center ${isDone ? "bg-yellow-500" : isCurrent ? "border-2 border-yellow-500/50" : "bg-zinc-800"}`}>
                        {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-black" />}
                        {isCurrent && <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />}
                      </div>
                      <span className={isDone ? "text-white" : isCurrent ? "text-yellow-500" : "text-zinc-500"}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── SUCCESS STATE ── */}
          {step === "success" && channel && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl"
            >
              <div className="flex items-center gap-6 mb-10">
                <img src={channel.avatar} alt={channel.name} className="h-24 w-24 rounded-full border-4 border-zinc-800 shadow-2xl" />
                <div>
                  <h2 className="text-4xl font-bold font-display">{channel.name}</h2>
                  <p className="text-xl text-zinc-400">{formatCount(channel.subscribers)} subscribers</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                  { label: "Avg Views", value: formatCount(channel.avgViews) },
                  { label: "Best Upload Day", value: channel.bestDay },
                  { label: "Total Videos", value: channel.videoCount },
                ].map((s) => (
                  <div key={s.label} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{s.label}</p>
                    <p className="text-2xl font-bold font-display">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-900 border-l-4 border-yellow-500 p-8 rounded-2xl mb-8">
                <p className="text-sm text-yellow-500 font-bold uppercase tracking-widest mb-2">AI Diagnosis</p>
                <p className="text-xl leading-relaxed text-zinc-200">
                  {insight || "Analyzing your channel performance..."}
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 px-6 py-3 rounded-full text-center mb-10">
                <p className="text-yellow-500 font-medium text-sm">
                  Every week without a strategy is growth you're leaving behind.
                </p>
              </div>

              <Button
                onClick={handleEnterApp}
                className="w-full h-16 bg-white hover:bg-zinc-200 text-black text-xl font-bold rounded-2xl group transition-all"
              >
                Enter CreatorBrain
                <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          )}

          {/* ── ERROR STATE ── */}
          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-md text-center"
            >
              <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl mb-6">
                <h3 className="text-xl font-bold text-red-500 mb-2">Analysis Failed</h3>
                <p className="text-zinc-400">{error}</p>
              </div>
              <Button
                onClick={() => setStep("input")}
                variant="outline"
                className="border-zinc-800 hover:bg-zinc-900 text-white rounded-xl"
              >
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
