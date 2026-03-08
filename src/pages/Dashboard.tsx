import { motion } from "framer-motion";
import { TrendingUp, Eye, Upload, Star, Zap, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const metrics = [
  { label: "Subscribers", value: "12.4K", change: "+2.3%", icon: TrendingUp, positive: true },
  { label: "Avg Views", value: "8,291", change: "+5.1%", icon: Eye, positive: true },
  { label: "Upload Streak", value: "3 weeks", change: "On track", icon: Upload, positive: true },
  { label: "Channel Score", value: "74/100", change: "Good", icon: Star, positive: true },
];

const recentVideos = [
  { title: "Why I Quit My Job to Be a Creator", views: "14.2K", date: "3 days ago", thumb: "🎬" },
  { title: "The Algorithm Secret Nobody Talks About", views: "9.8K", date: "1 week ago", thumb: "🤖" },
  { title: "My Filming Setup Tour 2025", views: "6.1K", date: "2 weeks ago", thumb: "📷" },
  { title: "How I Edit Videos in 30 Minutes", views: "11.3K", date: "2 weeks ago", thumb: "✂️" },
  { title: "Creator Burnout: My Honest Story", views: "18.7K", date: "3 weeks ago", thumb: "💔" },
  { title: "5 Tools Every YouTuber Needs", views: "7.4K", date: "3 weeks ago", thumb: "🛠️" },
];

const dailyBrief = [
  "Your last video is outperforming your 30-day average by 23% — ride the momentum with a follow-up this week.",
  "Tuesday 6PM has been your best upload time. Your next video should go live then.",
  "3 viewers asked for a 'day in the life' video in recent comments — high demand signal.",
];

const stagger = {
  container: { transition: { staggerChildren: 0.08 } },
  item: { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 } },
};

export default function Dashboard() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Channel Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
          🎥
        </div>
        <div>
          <h1 className="text-2xl font-bold">Your Channel</h1>
          <p className="text-sm text-muted-foreground">Connect your YouTube channel to see real data</p>
        </div>
      </motion.div>

      {/* Verdict Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-primary/20 bg-primary/5 p-6 animate-pulse-glow"
      >
        <div className="flex items-start gap-3">
          <Zap className="h-6 w-6 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Your #1 Priority Today</p>
            <p className="text-lg font-medium">
              Post a follow-up to "Creator Burnout" — it's your best performer this month and viewers are asking for more. Use a curiosity-gap title.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Metrics */}
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {metrics.map((m) => (
          <motion.div key={m.label} variants={stagger.item} className="metric-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{m.label}</span>
              <m.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{m.value}</p>
            <p className="text-xs text-success mt-1">{m.change}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Videos */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Recent Videos</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {recentVideos.map((v) => (
              <div key={v.title} className="rounded-xl border border-border bg-card p-4 card-glow flex gap-3 items-start">
                <div className="h-12 w-16 rounded-lg bg-secondary flex items-center justify-center text-xl shrink-0">
                  {v.thumb}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{v.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{v.views} views</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{v.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Brief */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Daily Brief</h2>
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            {dailyBrief.map((tip, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Quick Actions</h3>
            {["Analyze Latest Video", "Get Next Idea", "Check Competitors"].map((action) => (
              <Button key={action} variant="ghost-muted" className="w-full justify-between rounded-lg h-10 text-sm">
                {action}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
