import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getAIStatus, onAIStatusChange } from "@/lib/ai-service";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function AIStatusDot() {
  const [status, setStatus] = useState(getAIStatus);

  useEffect(() => {
    const unsub = onAIStatusChange(setStatus);
    return () => { unsub(); };
  }, []);

  const colors = {
    working: "bg-success",
    slow: "bg-yellow-500",
    failed: "bg-destructive",
  };

  const labels = {
    working: "AI ready",
    slow: "AI switching models...",
    failed: "Retrying...",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 cursor-default">
          <motion.div
            className={`h-2 w-2 rounded-full ${colors[status]}`}
            animate={status === "failed" ? { scale: [1, 1.3, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          {status !== "working" && (
            <span className="text-[10px] text-muted-foreground hidden sm:inline">{labels[status]}</span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{labels[status]}</p>
      </TooltipContent>
    </Tooltip>
  );
}
