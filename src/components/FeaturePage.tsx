import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface FeaturePageProps {
  emoji: string;
  title: string;
  description: string;
  children: ReactNode;
  accentColor?: string;
  badge?: string;
}

export default function FeaturePage({ emoji, title, description, children, accentColor, badge }: FeaturePageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const section = pathParts[0]?.toUpperCase() || "";
  const sectionColors: Record<string, string> = {
    diagnose: "hsl(var(--cat-diagnose))",
    create: "hsl(var(--cat-create))",
    grow: "hsl(var(--cat-grow))",
    analyze: "hsl(var(--cat-analyze))",
    strategy: "hsl(var(--cat-strategy))",
    coach: "hsl(var(--cat-coach))",
  };
  const color = accentColor || sectionColors[pathParts[0]] || "hsl(var(--primary))";

  return (
    <div className="p-6 md:p-8 max-w-[920px] mx-auto">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors group"
      >
        <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
        {section}
        <span className="opacity-40">/</span>
        {title}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-start gap-4 mb-8"
      >
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${color}15` }}
        >
          {emoji}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="t-page mb-0">{title}</h1>
            {badge && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-[500px]">{description}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.25 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
