import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, Brain, TrendingUp, Sparkles, ArrowRight, Chrome, Flame, Globe, Search, Lock, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/youtube-auth";
import { enableDemoMode } from "@/lib/youtube-api";
import { useToast } from "@/hooks/use-toast";

const features = [
  { icon: Flame, title: "Channel Roast", desc: "Get hilariously roasted by AI — then get the real fixes hidden inside every joke", tag: "Most Popular", color: "0 72% 60%" },
  { icon: Brain, title: "Video Autopsy", desc: "Paste any video URL. We find every filler word, retention killer, and pacing issue", tag: "Deep Analysis", color: "217 91% 60%" },
  { icon: TrendingUp, title: "Growth Predictor", desc: "See exactly when you'll hit 100K subs — and how to get there 3x faster", tag: "Predictive", color: "142 69% 58%" },
];

const stats = [
  { value: "24+", label: "AI Tools" },
  { value: "60s", label: "To First Insight" },
  { value: "0", label: "Permissions Needed" },
];

const roles = [
  "Trend Analyst", "Script Writer", "Growth Strategist",
  "Thumbnail Advisor", "Comment Manager", "AI Coach"
];

const tiers = [
  {
    emoji: "🌐",
    title: "Guest",
    subtitle: "See demo data",
    features: ["No signup needed", "Full demo channel", "Explore all tools", "Free forever"],
    cta: "Try Free Demo",
    highlight: false,
    color: "var(--muted-foreground)",
  },
  {
    emoji: "🔍",
    title: "Quick Connect",
    subtitle: "Paste channel URL",
    features: ["No permissions needed", "All public features", "Your real data", "Free forever"],
    cta: "Paste Your URL",
    highlight: true,
    color: "var(--primary)",
  },
  {
    emoji: "🔐",
    title: "Full Connect",
    subtitle: "Coming soon",
    features: ["Private analytics", "CTR & retention data", "Revenue insights", "Algorithm deep-dive"],
    cta: "Coming Soon",
    highlight: false,
    color: "var(--muted-foreground)",
    comingSoon: true,
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) {
      toast({ title: "Sign-in issue", description: "Authentication failed. Try Demo Mode to explore!", variant: "destructive" });
    }
    if (isAuthenticated()) navigate("/dashboard", { replace: true });
  }, []);

  function handleDemo() {
    enableDemoMode();
    navigate("/dashboard", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(800px circle at 50% -10%, hsl(48 96% 53% / 0.06), transparent 60%)"
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(600px circle at 80% 60%, hsl(217 91% 60% / 0.03), transparent 50%)"
      }} />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground mb-8 backdrop-blur-sm"
          >
            <Zap className="h-3.5 w-3.5 text-primary" />
            Your AI Growth Team · Free to Start
          </motion.div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.02] mb-6 tracking-tight">
            Stop Guessing.
            <br />
            <span className="landing-gradient-text">Start Growing.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            CreatorBrain replaces your entire YouTube growth team — strategist, analyst, coach, roaster — in one AI-powered app.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Button
              onClick={handleDemo}
              className="h-14 px-8 text-base rounded-xl font-bold gap-2 shadow-[0_0_40px_hsl(48_96%_53%/0.25)] hover:shadow-[0_0_60px_hsl(48_96%_53%/0.35)] transition-all"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              <Sparkles className="h-5 w-5" /> Try Free Demo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4 opacity-70">No signup required · Works instantly</p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16 flex items-center gap-8 sm:gap-12"
        >
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Replaces */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          <span className="text-xs text-muted-foreground mr-1">Replaces:</span>
          {roles.map((role) => (
            <span key={role} className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-border/50 bg-secondary/30 text-muted-foreground backdrop-blur-sm">
              {role}
            </span>
          ))}
        </motion.div>
      </section>

      {/* Three Tiers */}
      <section className="relative z-10 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-center mb-4"
          >
            Choose Your Level
          </motion.h2>
          <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
            Start free, go deeper when you're ready
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className={`relative rounded-2xl p-6 transition-all duration-300 ${tier.highlight ? "hover:-translate-y-1" : ""}`}
                style={{
                  background: "hsl(var(--background-card))",
                  border: tier.highlight
                    ? "2px solid hsl(var(--primary) / 0.4)"
                    : "1px solid hsl(var(--border))",
                  boxShadow: tier.highlight
                    ? "0 0 40px hsl(var(--primary) / 0.1)"
                    : "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                {tier.highlight && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                  >
                    Recommended
                  </span>
                )}

                <div className="text-center mb-5 pt-2">
                  <span className="text-4xl block mb-2">{tier.emoji}</span>
                  <h3 className="text-xl font-bold mb-1">{tier.title}</h3>
                  <p className="text-sm" style={{ color: `hsl(${tier.color})` }}>{tier.subtitle}</p>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2
                        className="h-4 w-4 shrink-0"
                        style={{ color: tier.comingSoon ? "hsl(var(--muted-foreground) / 0.4)" : "hsl(var(--primary))" }}
                      />
                      <span className={tier.comingSoon ? "text-muted-foreground/60" : "text-foreground"}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {tier.comingSoon ? (
                  <Button disabled className="w-full h-11 rounded-xl font-semibold" variant="outline">
                    <Lock className="mr-2 h-4 w-4" /> Coming Soon
                  </Button>
                ) : (
                  <Button
                    onClick={handleDemo}
                    className="w-full h-11 rounded-xl font-semibold"
                    variant={tier.highlight ? "default" : "outline"}
                    style={tier.highlight
                      ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
                      : undefined
                    }
                  >
                    {tier.title === "Guest" && <Globe className="mr-2 h-4 w-4" />}
                    {tier.title === "Quick Connect" && <Search className="mr-2 h-4 w-4" />}
                    {tier.cta} {!tier.comingSoon && <ArrowRight className="ml-1 h-4 w-4" />}
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature preview cards */}
      <section className="relative z-10 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-center mb-4"
          >
            See what CreatorBrain can do
          </motion.h2>
          <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
            Every feature works instantly — no setup, no permissions, no waiting
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                onClick={handleDemo}
                className="group cursor-pointer rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "hsl(var(--background-card))",
                  border: "1px solid hsl(var(--border))",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: `hsl(${f.color} / 0.12)` }}
                  >
                    <f.icon className="h-5 w-5" style={{ color: `hsl(${f.color})` }} />
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: `hsl(${f.color} / 0.1)`, color: `hsl(${f.color})` }}
                  >
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Try it now <ArrowRight className="h-3 w-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-center mb-12"
          >
            How It Works
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Explore Demo", desc: "Jump in instantly with our demo channel. See every tool in action.", emoji: "🌐" },
              { step: "02", title: "Paste Your Channel", desc: "Paste your channel URL. We fetch your public data in seconds.", emoji: "🔍" },
              { step: "03", title: "Get Clear Answers", desc: "AI analyses everything. You get exactly what to do next.", emoji: "🎯" },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="text-center rounded-2xl p-6"
                style={{ background: "hsl(var(--background-card))", border: "1px solid hsl(var(--border))" }}
              >
                <span className="text-3xl mb-3 block">{item.emoji}</span>
                <span className="t-label text-primary mb-2 block">Step {item.step}</span>
                <h3 className="font-semibold text-base mb-1.5">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 pb-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center rounded-2xl p-10"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.06), hsl(var(--background-card)))",
            border: "1px solid hsl(var(--primary) / 0.2)"
          }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to stop guessing?</h2>
          <p className="text-muted-foreground mb-6">Join thousands of creators using AI to grow faster</p>
          <Button
            onClick={handleDemo}
            className="h-12 px-8 rounded-xl font-bold gap-2"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            <Sparkles className="h-4 w-4" /> Start Free — No Account Needed
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
