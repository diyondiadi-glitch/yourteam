import { ReactNode } from "react";
import { motion } from "framer-motion";

interface FeaturePageProps {
  emoji: string;
  title: string;
  description: string;
  children: ReactNode;
  accentColor?: string;
}

export default function FeaturePage({ emoji, title, description, children, accentColor }: FeaturePageProps) {
  return (
    <div className="p-6 md:p-8 max-w-[920px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-10"
      >
        <span className="text-4xl mb-3 block">{emoji}</span>
        <h1 className="t-page mb-3">{title}</h1>
        <p className="t-body max-w-lg">{description}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
