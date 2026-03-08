import { isDemoMode } from "@/lib/youtube-api";
import { ArrowRight, Youtube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface ConnectChannelCTAProps {
  featureName?: string;
}

export default function ConnectChannelCTA({ featureName = "this feature" }: ConnectChannelCTAProps) {
  const navigate = useNavigate();
  if (!isDemoMode()) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-xl p-6 text-center"
      style={{
        background: "linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, hsl(var(--background-card)) 100%)",
        border: "1px solid hsl(var(--primary) / 0.25)",
      }}
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <Youtube className="h-5 w-5 text-primary" />
        <p className="text-sm font-bold text-primary">This was demo data</p>
      </div>
      <p className="text-lg font-bold mb-1">See YOUR real results</p>
      <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
        Connect your YouTube channel to get personalised insights based on your actual videos and audience.
      </p>
      <button
        onClick={() => {
          localStorage.removeItem("demo_mode");
          navigate("/");
        }}
        className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all"
        style={{
          background: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
        }}
      >
        Connect My Channel <ArrowRight className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
