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
}

export default function FeaturePage({ emoji, title, description, children, accentColor }: FeaturePageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Build breadcrumb from path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const mode = pathParts[0] || '';
  const feature = pathParts[1] || '';
  const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
  
  return (
    <div className="p-6 md:p-8 max-w-[920px] mx-auto">
      {/* Breadcrumb */}
      <button 
        onClick={() => navigate('/dashboard')} 
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        Dashboard / {modeLabel} / {title}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-10"
      >
        <span className="text-6xl mb-4 block">{emoji}</span>
        <h1 className="t-page mb-3">{title}</h1>
        <p className="text-lg italic text-muted-foreground max-w-[600px]">{description}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="animate-in"
      >
        {children}
      </motion.div>
    </div>
  );
}
