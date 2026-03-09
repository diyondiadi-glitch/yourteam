import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Zap,
  Search,
  Lock,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertCircle,
  Sparkles,
  Brain,
  TrendingUp,
  MessageSquare,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  fetchCompleteChannelData,
  isChannelConnected,
  formatCount,
  type FetchProgress,
  type ChannelData,
} from "@/lib/youtube-api";
import { callAI } from "@/lib/ai-service";

type Step = "input" | "loading" | "success" | "error";

const features = [
  {
    icon: AlertCircle,
    title: "Why your videos succeed or fail",
    desc: "Specific reasons with timestamps",
    color: "0 72% 60%",
  },
  {
    icon: MessageSquare,
    title: "Exactly what to make next",
    desc: "Ranked ideas from your audience's comments",
    color: "217 91% 60%",
  },
  {
    icon: Brain,
    title: "AI coach that knows your channel",
    desc: "Ask anything, get channel-specific answers",
    color: "142 69% 58%",
  },
];

const socialProof = [
  { name: "MK", rating: 5 },
  { name: "JD", rating: 5 },
  { name: "AS", rating: 5 },
];

export default function Landing() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<FetchProgress | null>(null);
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [insight, setInsight] = useState("");

  useEffect(() => {
    if (isChannelConnected()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  async function handleAnalyse() {
    if (!url.trim()) {
      setError("Please enter your YouTube channel URL");
      return;
    }
    setError("");
    setStep("loading");

    try {
      const channelData = await fetchCompleteChannelData(url, setProgress);
      setChannel(channelData);

      // Generate AI insight
      try {
        const aiInsight = await callAI(
          "You are a YouTube growth expert. Give ONE specific, exciting insight about this channel in 2 sentences. Be encouraging but specific.",
          `Channel: ${channelData.name}, ${channelData.subscribers} subs, ${channelData.videoCount} videos, avg ${channelData.avgViews} views. Top: "${channelData.videos[0]?.title}" with ${channelData.videos[0]?.views} views.`
        );
        setInsight(aiInsight);
      } catch {
        setInsight(
          `Your channel has ${formatCount(channelData.subscribers)} subscribers. Let's find your biggest growth opportunities!`
        );
      }

      setStep("success");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
      setStep("error");
    }
  }

  function handleEnterApp() {
    navigate("/dashboard", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(800px circle at 50% -10%, hsl(48 96% 53% / 0.06), transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(600px circle at 80% 60%, hsl(217 91% 60% / 0.03), transparent 50%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <AnimatePresence mode="wait">
          {/* ── INPUT STEP ──────────────────────────────────────── */}
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl mx-auto text-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground mb-8 backdrop-blur-sm"
              >
                <Zap className="h-3.5 w-3.5 text-primary" />
                Your AI Growth Team · Free to Start
              </motion.div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-4 tracking-tight">
                Your Entire YouTube Team.
                <br />
                <span className="landing-gradient-text">Powered by AI.</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
                Paste your channel URL. Get instant AI insights on every video, every trend, every
                opportunity. Free forever.
              </p>

              {/* Main Input Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl p-6 sm:p-8 mb-6"
                style={{
                  background: "hsl(var(--background-card))",
                  border: "2px solid hsl(var(--primary) / 0.3)",
                  boxShadow: "0 0 60px hsl(var(--primary) / 0.1)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Search className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Enter your YouTube channel URL</h2>
                </div>

                <Input
                  placeholder="youtube.com/@yourchannel"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyse()}
                  className="h-14 text-base mb-4 transition-shadow"
                  style={{ boxShadow: "none" }}
                  onFocus={(e) => { e.target.style.boxShadow = "0 0 0 3px rgba(250,204,21,0.3)"; }}
                  onBlur={(e) => { e.target.style.boxShadow = "none"; }}
                  autoFocus
                />

                {/* Format example pills */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {["@mkbhd", "youtube.com/@channelname", "youtube.com/channel/UC..."].map((example) => (
                    <button
                      key={example}
                      onClick={() => setUrl(example === "youtube.com/channel/UC..." ? "" : example)}
                      className="text-xs px-3 py-1.5 rounded-full transition-colors hover:bg-primary/10 hover:text-primary"
                      style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}
                    >
                      {example}
                    </button>
                  ))}
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-destructive mb-4 flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </motion.p>
                )}

                <Button
                  onClick={handleAnalyse}
                  className="w-full h-14 text-base font-bold rounded-xl gap-2"
                  style={{
                    background: "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground))",
                  }}
                >
                  <Zap className="h-5 w-5" /> Analyse My Channel — Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>

              <p className="text-xs text-muted-foreground mb-8">
                Works with any YouTube channel · No signup · No credit card · Instant results
              </p>

              {/* Social proof */}
              <div className="flex items-center justify-center gap-1 mb-12">
                {socialProof.map((user, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold -ml-2 first:ml-0 ring-2 ring-background"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                  >
                    {user.name}
                  </div>
                ))}
                <div className="ml-3 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground ml-2">Loved by creators</span>
              </div>

              {/* Full Connect - Coming Soon */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-xl p-5 opacity-60"
                style={{
                  background: "hsl(var(--background-card))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">Connect YouTube Account</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Unlock private analytics: CTR, retention, impressions, revenue estimates
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* ── ERROR STEP ──────────────────────────────────────── */}
          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md mx-auto text-center"
            >
              <div
                className="h-16 w-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{ background: "hsl(var(--destructive) / 0.1)" }}
              >
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>

              <h2 className="text-xl font-bold mb-2">Channel not found</h2>
              <p className="text-muted-foreground text-sm mb-6">{error}</p>

              <div className="rounded-xl p-4 mb-6 text-left" style={{ background: "hsl(var(--background-card))" }}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Try these formats:
                </p>
                <ul className="space-y-2 text-sm">
                  <li>
                    <code className="text-primary">youtube.com/@mkbhd</code>
                  </li>
                  <li>
                    <code className="text-primary">youtube.com/channel/UCBcRF18a7Qf58cCRy5xuWwQ</code>
                  </li>
                  <li>
                    <code className="text-primary">@mkbhd</code>
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => setStep("input")}
                className="w-full h-12 rounded-xl font-semibold"
                style={{
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                }}
              >
                Try Again
              </Button>
            </motion.div>
          )}

          {/* ── LOADING STEP ────────────────────────────────────── */}
          {step === "loading" && progress && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md mx-auto text-center"
            >
              {progress.channelName ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-6"
                >
                  <div
                    className="h-20 w-20 rounded-full mx-auto ring-4 ring-primary/30 flex items-center justify-center overflow-hidden"
                    style={{ background: "hsl(var(--primary) / 0.1)" }}
                  >
                    {channel?.avatar ? (
                      <img src={channel.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-primary">
                        {progress.channelName.charAt(0)}
                      </span>
                    )}
                  </div>
                </motion.div>
              ) : (
                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-6" />
              )}

              <h2 className="text-xl font-bold mb-6">
                {progress.channelName ? `Analysing ${progress.channelName}...` : "Finding your channel..."}
              </h2>

              <div className="space-y-3 text-left mb-6">
                {[
                  { key: "finding", label: "Finding your channel", done: progress.step !== "finding" },
                  {
                    key: "videos",
                    label: progress.videoCount ? `Loading ${progress.videoCount} videos` : "Loading videos",
                    done: ["comments", "insights", "done"].includes(progress.step),
                    active: progress.step === "videos",
                  },
                  {
                    key: "comments",
                    label: "Reading comments",
                    done: ["insights", "done"].includes(progress.step),
                    active: progress.step === "comments",
                  },
                  {
                    key: "insights",
                    label: "Building your insights",
                    done: progress.step === "done",
                    active: progress.step === "insights",
                  },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-3">
                    {item.done ? (
                      <CheckCircle className="h-5 w-5 text-success shrink-0" />
                    ) : item.active ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-border shrink-0" />
                    )}
                    <span
                      className={`text-sm ${item.done ? "text-foreground" : item.active ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {item.done && "✓ "}
                      {item.label}
                      {item.done && "!"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percent}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "hsl(var(--primary))" }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{progress.percent}%</p>
            </motion.div>
          )}

          {/* ── SUCCESS STEP ────────────────────────────────────── */}
          {step === "success" && channel && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg mx-auto text-center"
            >
              {/* Banner background */}
              {channel.banner && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage: `url(${channel.banner})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "blur(40px)",
                  }}
                />
              )}

              <div className="relative">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative mx-auto w-24 h-24 mb-4"
                >
                  <img
                    src={channel.avatar}
                    alt={channel.name}
                    className="h-24 w-24 rounded-full ring-4 ring-primary/30 object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-success flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-2xl font-bold mb-1">{channel.name}</h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    {formatCount(channel.subscribers)} subscribers · {channel.videos.length} videos loaded
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl p-5 mb-6"
                  style={{
                    borderLeft: "4px solid hsl(var(--primary))",
                    background: "hsl(var(--primary) / 0.05)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                    <div className="text-left">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                        First Insight
                      </p>
                      <p className="text-sm leading-relaxed">{insight}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Button
                    onClick={handleEnterApp}
                    className="w-full h-14 text-base font-bold rounded-xl gap-2"
                    style={{
                      background: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                    }}
                  >
                    <Zap className="h-5 w-5" /> Enter CreatorBrain
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FEATURES PREVIEW ──────────────────────────────────── */}
        {step === "input" && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full max-w-4xl mx-auto mt-20"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-8">
              What happens after you paste your URL
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="rounded-xl p-5"
                  style={{
                    background: "hsl(var(--background-card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `hsl(${f.color} / 0.12)` }}
                  >
                    <f.icon className="h-5 w-5" style={{ color: `hsl(${f.color})` }} />
                  </div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Footer */}
        {step === "input" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-xs text-muted-foreground mt-16"
          >
            Used by creators to grow faster. Free forever.
          </motion.p>
        )}
      </div>
    </div>
  );
}
