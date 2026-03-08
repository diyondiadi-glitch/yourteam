import { ReactNode } from "react";
import { motion } from "framer-motion";
import DemoBanner from "./DemoBanner";

interface FeaturePageProps {
  emoji: string;
  title: string;
  description: string;
  children: ReactNode;
}

export default function FeaturePage({ emoji, title, description, children }: FeaturePageProps) {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <DemoBanner />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <span className="text-5xl mb-4 block">{emoji}</span>
        <h1 className="feature-title mb-2">{title}</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">{description}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
