import { motion } from "framer-motion";
import { Lock, TrendingUp, Eye, DollarSign, MousePointer, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrivateAnalyticsLockProps {
  featureName?: string;
}

export default function PrivateAnalyticsLock({ featureName = "This insight" }: PrivateAnalyticsLockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-8 text-center max-w-lg mx-auto"
      style={{
        background: "linear-gradient(135deg, hsl(var(--background-card)) 0%, hsl(var(--background-section)) 100%)",
        border: "1px solid hsl(var(--border))",
      }}
    >
      <div
        className="h-16 w-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
        style={{ background: "hsl(var(--muted))" }}
      >
        <Lock className="h-7 w-7 text-muted-foreground" />
      </div>

      <h3 className="text-xl font-bold mb-2">Private Analytics Required</h3>
      <p className="text-muted-foreground text-sm mb-6">
        {featureName} needs your private YouTube Studio data.
      </p>

      <div className="space-y-3 text-left mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Connect your YouTube account to unlock:
        </p>
        {[
          { icon: TrendingUp, label: "Exact retention rate with drop-off timestamps" },
          { icon: Eye, label: "Impressions and click-through rate per video" },
          { icon: DollarSign, label: "Revenue estimates and RPM" },
          { icon: MousePointer, label: "Card and end screen click rates" },
          { icon: BarChart3, label: "Traffic source breakdown" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 text-sm">
            <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      <Button disabled className="w-full h-12 rounded-xl font-semibold" variant="outline">
        <Lock className="mr-2 h-4 w-4" /> Connect YouTube Account — Coming Soon
      </Button>

      <p className="text-xs text-muted-foreground mt-4">
        Everything else works perfectly with your public channel data.
      </p>
    </motion.div>
  );
}
