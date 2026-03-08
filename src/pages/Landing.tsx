import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, Brain, TrendingUp, MessageSquare, Palette, BarChart3, ArrowRight, Chrome } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, signInWithGoogle } from "@/lib/youtube-auth";
import { enableDemoMode, disableDemoMode } from "@/lib/youtube-api";
import { useToast } from "@/hooks/use-toast";

const features = [
  { icon: Brain, title: "AI Strategy Engine", desc: "Know exactly what to post next based on your real data" },
  { icon: TrendingUp, title: "Growth Diagnostics", desc: "Find out why videos underperform and how to fix them" },
  { icon: Zap, title: "60-Min Video Machine", desc: "Script, title, thumbnail brief — all generated in minutes" },
  { icon: MessageSquare, title: "Comment Gold Miner", desc: "Extract video ideas your audience is begging for" },
  { icon: Palette, title: "Thumbnail Advisor", desc: "Get scored thumbnail briefs that boost your CTR" },
  { icon: BarChart3, title: "First Hour War Room", desc: "Monitor new uploads in real-time with action alerts" },
];

const roles = [
  "Trend Analyst", "Script Writer", "Growth Strategist",
  "Comment Manager", "Thumbnail Advisor", "AI Coach"
];

export default function Landing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // Check for error in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) {
      toast({ title: "Sign-in issue", description: "Authentication failed. Try Demo Mode to explore!", variant: "destructive" });
    }

    if (isAuthenticated()) navigate("/dashboard", { replace: true });
  }, []);

  async function handleGoogleLogin() {
    setConnecting(true);
    const result = await signInWithGoogle();
    if (result.error) {
      toast({ title: "Connection Issue", description: result.error, variant: "destructive" });
      setConnecting(false);
    }
    // If no error, Supabase redirects — no need to set connecting false
  }

  function handleDemo() {
    enableDemoMode();
    navigate("/dashboard", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="hero-glow absolute inset-0 pointer-events-none" />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground mb-8">
            <Zap className="h-3.5 w-3.5 text-primary" />
            Powered by AI · Built for Creators
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] mb-6">
            Stop Guessing.{" "}
            <span className="gradient-text">Start Growing.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            CreatorBrain is the AI operating system for YouTube creators. Replace your entire growth team — strategist, analyst, coach — all in one app.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Button
              variant="hero"
              size="lg"
              className="h-14 px-8 text-lg rounded-xl"
              onClick={handleDemo}
            >
              🚀 Try Free Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="ghost-muted"
              size="lg"
              className="h-14 px-8 text-lg rounded-xl"
              onClick={handleGoogleLogin}
              disabled={connecting}
            >
              <Chrome className="mr-2 h-5 w-5" />
              {connecting ? "Connecting..." : "Sign in with Google — free"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">No YouTube permissions required · Just a Google account</p>
        </motion.div>

        {/* Roles */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-3"
        >
          <span className="text-sm text-muted-foreground mr-2">Replaces:</span>
          {roles.map((role) => (
            <span key={role} className="text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-secondary text-muted-foreground">
              {role}
            </span>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl sm:text-4xl font-bold text-center mb-4">
            How It Works
          </motion.h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">From zero to actionable strategy in under 2 minutes</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Sign In & Paste Your Channel", desc: "Sign in with Google, then paste your YouTube channel URL. We fetch your public data — no scary permissions needed.", emoji: "🔗" },
              { step: "02", title: "AI Analyses Instantly", desc: "Our AI engine scans your videos, analytics, and audience patterns in seconds.", emoji: "🧠" },
              { step: "03", title: "Get Clear Decisions", desc: "Receive exactly what to post next, what to fix, and how to grow — no guesswork.", emoji: "🎯" },
            ].map((item, i) => (
              <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="relative rounded-xl border border-border bg-card p-8 text-center card-glow">
                <span className="text-4xl mb-4 block">{item.emoji}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Step {item.step}</span>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Everything you need to grow
          </motion.h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">24 AI-powered tools that work with your real YouTube data</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="rounded-xl border border-border bg-card p-6 card-glow group cursor-pointer">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
