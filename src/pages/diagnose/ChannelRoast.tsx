import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Mic, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeaturePage from "@/components/FeaturePage";
import LoadingSteps from "@/components/LoadingSteps";
import CopyButton from "@/components/CopyButton";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/youtube-auth";
import { getMyChannel, getRecentVideos, getChannelContext, formatCount } from "@/lib/youtube-api";
import { callGroq } from "@/lib/groq-api";

interface RoastLine {
  joke: string;
  serious: string;
}

export default function ChannelRoast() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadStep, setLoadStep] = useState(0);
  const [lines, setLines] = useState<RoastLine[]>([]);
  const [encouragement, setEncouragement] = useState("");
  const [visibleCount, setVisibleCount] = useState(0);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!isAuthenticated()) { navigate("/", { replace: true }); return; }
    loadRoast();
  }, []);

  useEffect(() => {
    if (lines.length > 0 && visibleCount < lines.length) {
      const timer = setTimeout(() => setVisibleCount(c => c + 1), 800);
      return () => clearTimeout(timer);
    }
  }, [lines, visibleCount]);

  async function loadRoast() {
    setLoading(true);
    setLines([]);
    setEncouragement("");
    setVisibleCount(0);
    setExpanded({});
    setLoadStep(0);

    try {
      const ch = await getMyChannel();
      const vids = await getRecentVideos(ch.id, 10);
      setLoadStep(1);

      const context = getChannelContext(ch, vids);
      const best = [...vids].sort((a, b) => b.viewCount - a.viewCount)[0];
      const worst = [...vids].sort((a, b) => a.viewCount - b.viewCount)[0];
      setLoadStep(2);

      const result = await callGroq(
        "You are a brutal comedy roast writer AND a YouTube growth expert. Roast this YouTube channel like you're at a comedy roast — be savage, funny, and ruthless. BUT every single joke must contain a real actionable insight hidden inside the humor. Structure your response as exactly 8 roast lines. For each line output in this exact format:\nROAST: [the joke]\nSERIOUS: [the real advice hidden in the joke]\n\nAfter all 8, add:\nENCOURAGEMENT: [one genuinely encouraging line in gold that shows you believe in them]\n\nUse their actual data to make the roasts specific and personal. Make them laugh AND wince at the same time.",
        `${context}\n\nBest performing: "${best?.title}" (${formatCount(best?.viewCount || 0)} views)\nWorst performing: "${worst?.title}" (${formatCount(worst?.viewCount || 0)} views)\n\nRoast this channel NOW.`
      );

      // Parse the response
      const roastMatches = [...result.matchAll(/ROAST:\s*(.+?)(?:\n|$)/gi)];
      const seriousMatches = [...result.matchAll(/SERIOUS:\s*(.+?)(?:\n|$)/gi)];
      const encouragementMatch = result.match(/ENCOURAGEMENT:\s*(.+)/i);

      const parsed: RoastLine[] = roastMatches.map((m, i) => ({
        joke: m[1].trim(),
        serious: seriousMatches[i]?.[1]?.trim() || "Keep pushing — growth takes time.",
      }));

      setLines(parsed.length > 0 ? parsed : [{ joke: result.slice(0, 200), serious: "See the full roast above." }]);
      setEncouragement(encouragementMatch?.[1]?.trim() || "You've got what it takes. Keep creating.");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Spotlight header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 relative"
      >
        {/* Spotlight effect */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(300px circle at 50% 30%, hsla(0, 80%, 50%, 0.08), transparent 70%)"
        }} />
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative inline-block mb-4"
        >
          <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Mic className="h-10 w-10 text-destructive" />
          </div>
        </motion.div>
        <h1 className="text-3xl font-bold mb-2">The Roast Room</h1>
        <p className="text-muted-foreground max-w-lg mx-auto mb-4">Brutal. Funny. Actually helpful.</p>
        <div className="inline-flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          <Flame className="h-4 w-4" />
          Warning: This AI has no chill. But it will make you better.
        </div>
      </motion.div>

      {loading && (
        <LoadingSteps
          steps={["Studying your channel...", "Writing savage jokes...", "Hiding real advice inside the burns..."]}
          currentStep={loadStep}
        />
      )}

      <AnimatePresence>
        {lines.slice(0, visibleCount).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-4 rounded-xl border border-border bg-card p-5 card-glow"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">🔥</span>
              <div className="flex-1">
                <p className="font-medium">{line.joke}</p>
                <button
                  onClick={() => setExpanded(p => ({ ...p, [i]: !p[i] }))}
                  className="text-xs text-primary mt-2 flex items-center gap-1 hover:underline"
                >
                  {expanded[i] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {expanded[i] ? "Hide" : "Serious Version"}
                </button>
                <AnimatePresence>
                  {expanded[i] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/10"
                    >
                      <p className="text-sm text-muted-foreground">{line.serious}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <CopyButton text={line.joke} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Encouragement */}
      {visibleCount >= lines.length && encouragement && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center"
        >
          <p className="text-lg font-semibold gradient-text">{encouragement}</p>
        </motion.div>
      )}

      {/* Actions */}
      {visibleCount >= lines.length && lines.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center gap-3 mt-6">
          <Button onClick={loadRoast} variant="destructive" className="rounded-xl">
            <RefreshCw className="mr-2 h-4 w-4" /> Roast Me Again
          </Button>
          <CopyButton text={lines.map(l => `🔥 ${l.joke}`).join("\n\n") + `\n\n✨ ${encouragement}`} className="h-10 w-auto px-4 border border-border rounded-xl" />
        </motion.div>
      )}
    </div>
  );
}
