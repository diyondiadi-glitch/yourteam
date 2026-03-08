import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Mic, ChevronDown, ChevronUp, RefreshCw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingSteps from "@/components/LoadingSteps";
import CopyButton from "@/components/CopyButton";
import DemoBanner from "@/components/DemoBanner";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/youtube-auth";
import { getMyChannel, getRecentVideos, getChannelContext, formatCount } from "@/lib/youtube-api";
import { callGroq, parseJsonFromResponse } from "@/lib/groq-api";

interface RoastSegment {
  setup: string;
  punchline: string;
  real_truth: string;
  fix_action: string;
  weakness_category: string;
}

interface RoastData {
  opening: string;
  roasts: RoastSegment[];
  redemption_speech: string;
  final_verdict: string;
}

const HEAT_LEVELS = [
  { label: "Mild", emoji: "🌶️", value: "mild" },
  { label: "Medium", emoji: "🌶️🌶️", value: "medium" },
  { label: "Nuclear", emoji: "🌶️🌶️🌶️", value: "nuclear" },
];

export default function ChannelRoast() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [heatLevel, setHeatLevel] = useState("medium");
  const [roastData, setRoastData] = useState<RoastData | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [showRedemption, setShowRedemption] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { navigate("/", { replace: true }); return; }
  }, []);

  useEffect(() => {
    if (roastData && visibleCount < roastData.roasts.length) {
      const timer = setTimeout(() => setVisibleCount(c => c + 1), 1400);
      return () => clearTimeout(timer);
    }
    if (roastData && visibleCount >= roastData.roasts.length && !showRedemption) {
      const timer = setTimeout(() => setShowRedemption(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [roastData, visibleCount, showRedemption]);

  async function loadRoast() {
    setLoading(true);
    setRoastData(null);
    setVisibleCount(0);
    setFlipped({});
    setShowRedemption(false);
    setStarted(true);
    setLoadStep(0);

    try {
      const ch = await getMyChannel();
      const vids = await getRecentVideos(ch.id, 15);
      setLoadStep(1);

      const context = getChannelContext(ch, vids);
      const best = [...vids].sort((a, b) => b.viewCount - a.viewCount)[0];
      const worst = [...vids].sort((a, b) => a.viewCount - b.viewCount)[0];

      const gaps = vids.slice(0, -1).map((v, i) => {
        const next = vids[i + 1];
        return Math.round((new Date(v.publishedAt).getTime() - new Date(next.publishedAt).getTime()) / 86400000);
      });
      const maxGap = Math.max(...gaps, 0);
      setLoadStep(2);

      const result = await callGroq(
        `You are Dave Chappelle meets a YouTube algorithm PhD. You are performing a roast of this creator's channel at Madison Square Garden. The audience knows YouTube. Be SAVAGE. Be SPECIFIC. Every single joke must reference their REAL data — their actual video titles, their actual view counts, their actual posting gaps. If they have a video that got low views, DESTROY it. If they haven't posted consistently, DESTROY that. NEVER be generic. Then reveal that inside every joke is a real truth that would double their views if they acted on it. Savageness level: ${heatLevel}. Return JSON with this EXACT structure: {"opening": "2 lines of crowd-work about the channel in general", "roasts": [{"setup": "setup line", "punchline": "devastating punchline", "real_truth": "the real insight hidden in the joke", "fix_action": "one specific action to fix this", "weakness_category": "thumbnails|titles|consistency|engagement|niche|content"}], "redemption_speech": "a genuinely encouraging speech where every joke becomes serious advice", "final_verdict": "one sentence defining what this channel actually is and what it needs to become"}. Generate exactly 6 roast segments.`,
        `${context}\n\nBest performing: "${best?.title}" (${formatCount(best?.viewCount || 0)} views)\nWorst performing: "${worst?.title}" (${formatCount(worst?.viewCount || 0)} views)\nLongest gap between uploads: ${maxGap} days\n\nRoast this channel NOW. Level: ${heatLevel.toUpperCase()}`
      );

      const parsed = parseJsonFromResponse(result);
      if (parsed) {
        setRoastData(parsed);
      } else {
        // Fallback parse
        setRoastData({
          opening: result.slice(0, 200),
          roasts: [{ setup: "Couldn't parse the roast", punchline: "But trust me, it was brutal", real_truth: "Try again", fix_action: "Click roast again", weakness_category: "content" }],
          redemption_speech: "You've got potential. Keep going.",
          final_verdict: "A creator on the verge of something great."
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const categoryColors: Record<string, string> = {
    thumbnails: "--cat-create",
    titles: "--cat-strategy",
    consistency: "--warning",
    engagement: "--cat-analyze",
    niche: "--cat-strategy",
    content: "--cat-diagnose",
  };

  return (
    <div className="min-h-screen relative">
      {/* Dark red atmosphere */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at top, hsl(0 60% 8%) 0%, hsl(var(--background)) 60%)"
      }} />

      <div className="relative p-6 md:p-8 max-w-4xl mx-auto">
        <DemoBanner />

        {/* Spotlight header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 relative"
        >
          {/* Spotlight cone */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(200px circle at 50% 20%, hsl(0 80% 50% / 0.1), transparent 70%)"
          }} />

          <motion.div
            animate={started ? {} : { scale: [1, 1.06, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="relative inline-block mb-5"
          >
            <div className="h-24 w-24 rounded-full flex items-center justify-center mx-auto" style={{
              background: "radial-gradient(circle, hsl(var(--destructive) / 0.2) 0%, transparent 70%)"
            }}>
              <Mic className="h-12 w-12" style={{ color: "hsl(var(--destructive))" }} />
            </div>
          </motion.div>

          <h1 className="t-page text-3xl md:text-4xl mb-2">The Roast Room</h1>
          <p className="t-body max-w-md mx-auto mb-5">Brutal. Funny. Actually helpful.</p>

          <div className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold" style={{
            background: "hsl(var(--destructive) / 0.08)",
            border: "1px solid hsl(var(--destructive) / 0.2)",
            color: "hsl(var(--destructive))"
          }}>
            <Flame className="h-4 w-4" />
            ⚠️ ROAST ZONE — Your feelings are not protected here
          </div>
        </motion.div>

        {/* Heat level selector */}
        {!started && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center mb-8">
            <p className="t-label text-muted-foreground mb-4">How savage?</p>
            <div className="inline-flex gap-2 rounded-xl p-1.5" style={{ background: "hsl(var(--background-section))" }}>
              {HEAT_LEVELS.map(h => (
                <button
                  key={h.value}
                  onClick={() => setHeatLevel(h.value)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    heatLevel === h.value ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={heatLevel === h.value ? {
                    background: "hsl(var(--destructive) / 0.15)",
                    color: "hsl(var(--destructive))"
                  } : undefined}
                >
                  {h.emoji} {h.label}
                </button>
              ))}
            </div>
            <div className="mt-6">
              <Button
                size="lg"
                className="rounded-xl px-10 h-14 text-lg font-bold"
                style={{ background: "hsl(var(--destructive))", color: "white" }}
                onClick={loadRoast}
              >
                <Flame className="mr-2 h-5 w-5" /> Roast My Channel
              </Button>
            </div>
          </motion.div>
        )}

        {loading && (
          <LoadingSteps
            steps={["Studying your channel for weaknesses...", "Writing savage, personalized jokes...", "Hiding real advice inside every burn..."]}
            currentStep={loadStep}
          />
        )}

        {/* Opening */}
        {roastData && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-8 rounded-xl p-5"
            style={{ background: "hsl(var(--background-section))" }}
          >
            <p className="text-lg font-medium italic text-muted-foreground">"{roastData.opening}"</p>
          </motion.div>
        )}

        {/* Progress */}
        {roastData && visibleCount > 0 && visibleCount < roastData.roasts.length && (
          <div className="text-center mb-4">
            <span className="t-label text-muted-foreground">Roast {visibleCount} of {roastData.roasts.length}</span>
          </div>
        )}

        {/* Roast segments */}
        <AnimatePresence>
          {roastData?.roasts.slice(0, visibleCount).map((roast, i) => {
            const isFlipped = flipped[i];
            const catColor = categoryColors[roast.weakness_category] || "--cat-diagnose";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-4"
              >
                <div
                  className="cb-card p-6 relative overflow-hidden transition-all duration-300"
                  style={{
                    borderColor: isFlipped ? "hsl(var(--success) / 0.3)" : "hsl(var(--destructive) / 0.2)",
                    boxShadow: isFlipped
                      ? "0 0 20px hsl(var(--success) / 0.08)"
                      : "0 0 20px hsl(var(--destructive) / 0.06)"
                  }}
                >
                  {/* Category badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="t-label px-2.5 py-1 rounded-full text-[10px]" style={{
                      background: `hsl(var(${catColor}) / 0.12)`,
                      color: `hsl(var(${catColor}))`
                    }}>
                      {roast.weakness_category?.toUpperCase()}
                    </span>
                    <CopyButton text={`${roast.setup} ${roast.punchline}`} />
                  </div>

                  {!isFlipped ? (
                    <>
                      <p className="t-body mb-2">{roast.setup}</p>
                      <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-base font-bold mb-4"
                        style={{ color: "hsl(var(--destructive))" }}
                      >
                        🔥 {roast.punchline}
                      </motion.p>
                      <button
                        onClick={() => setFlipped(p => ({ ...p, [i]: true }))}
                        className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                        style={{ color: "hsl(var(--success))" }}
                      >
                        <ChevronDown className="h-3.5 w-3.5" /> Reveal the TRUTH
                      </button>
                    </>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="rounded-lg p-4 mb-3" style={{ background: "hsl(var(--success) / 0.06)", borderLeft: "3px solid hsl(var(--success))" }}>
                        <p className="text-sm font-semibold mb-1" style={{ color: "hsl(var(--success))" }}>The Real Truth</p>
                        <p className="t-body text-sm">{roast.real_truth}</p>
                      </div>
                      <div className="rounded-lg p-3" style={{ background: "hsl(var(--info) / 0.06)", borderLeft: "3px solid hsl(var(--info))" }}>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: "hsl(var(--info))" }}>Fix Action</p>
                        <p className="text-xs text-muted-foreground">{roast.fix_action}</p>
                      </div>
                      <button
                        onClick={() => setFlipped(p => ({ ...p, [i]: false }))}
                        className="flex items-center gap-1 text-xs text-muted-foreground mt-3 hover:text-foreground"
                      >
                        <ChevronUp className="h-3.5 w-3.5" /> Back to joke
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Redemption speech */}
        {showRedemption && roastData && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 rounded-xl p-8 text-center"
              style={{
                background: "linear-gradient(135deg, hsl(var(--success) / 0.06) 0%, hsl(var(--background-card)) 100%)",
                border: "1px solid hsl(var(--success) / 0.2)"
              }}
            >
              <p className="t-label mb-3" style={{ color: "hsl(var(--success))" }}>✨ REAL TALK REDEMPTION</p>
              <p className="text-base leading-relaxed text-muted-foreground max-w-2xl mx-auto">{roastData.redemption_speech}</p>
            </motion.div>

            {/* Final verdict */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6 cb-card-glow p-8 text-center"
              style={{ borderColor: "hsl(var(--primary) / 0.4)" }}
            >
              <p className="t-label text-primary mb-3">THE VERDICT</p>
              <p className="text-xl font-bold gradient-text">{roastData.final_verdict}</p>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex justify-center gap-3 mt-6"
            >
              <Button
                onClick={() => { setStarted(false); setRoastData(null); }}
                className="rounded-xl"
                style={{ background: "hsl(var(--destructive))", color: "white" }}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Roast Me Again
              </Button>
              <CopyButton
                text={roastData.roasts.map(r => `🔥 ${r.punchline}`).join("\n\n") + `\n\n✨ ${roastData.final_verdict}`}
                className="h-10 w-auto px-4 border border-border rounded-xl"
              />
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
