import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingDown, Calendar, CheckCircle } from "lucide-react";
import FeaturePage from "@/components/FeaturePage";
import LoadingSteps from "@/components/LoadingSteps";
import CopyButton from "@/components/CopyButton";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/youtube-auth";
import { getMyChannel, getRecentVideos, getChannelContext } from "@/lib/youtube-api";
import { callGroq, parseJsonFromResponse } from "@/lib/groq-api";

interface PlateauAnalysis {
  plateau_type: string;
  root_cause: string;
  weeks: { week: number; focus: string; videos: string[]; format_change: string }[];
  posting_schedule: string;
}

export default function PlateauBreaker() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadStep, setLoadStep] = useState(0);
  const [analysis, setAnalysis] = useState<PlateauAnalysis | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isAuthenticated()) { navigate("/", { replace: true }); return; }
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoadStep(0);
      const ch = await getMyChannel();
      const vids = await getRecentVideos(ch.id, 20);
      setLoadStep(1);

      const context = getChannelContext(ch, vids);
      setLoadStep(2);

      const result = await callGroq(
        "This creator may be stuck in a growth plateau. Analyse their data and identify: what type of plateau this is (topic exhaustion/packaging decline/posting inconsistency/audience mismatch), the single root cause, and a specific 30-day breakout plan with exact video topics for each week, format changes to try, and posting schedule. Make the plan feel achievable. Return JSON with: plateau_type, root_cause, weeks (array of 4 objects with week number, focus, videos array, format_change), posting_schedule.",
        `${context}\n\nDiagnose the plateau and create a 30-day breakout plan.`
      );

      const parsed = parseJsonFromResponse(result);
      if (parsed) setAnalysis(parsed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <FeaturePage emoji="📉" title="Growth Plateau Breaker" description="Detect plateau patterns and get a 30-day breakout plan">
        <LoadingSteps steps={["Analysing growth patterns...", "Identifying plateau type...", "Building breakout plan..."]} currentStep={loadStep} />
      </FeaturePage>
    );
  }

  return (
    <FeaturePage emoji="📉" title="Growth Plateau Breaker" description="Detect plateau patterns and get a 30-day breakout plan">
      {analysis && (
        <div className="space-y-6">
          {/* Diagnosis */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-destructive/20 bg-card p-6 text-center">
            <TrendingDown className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-xs font-semibold uppercase text-destructive mb-2">Plateau Type</p>
            <p className="text-xl font-bold mb-2">{analysis.plateau_type}</p>
            <p className="text-sm text-muted-foreground">{analysis.root_cause}</p>
          </motion.div>

          {/* 30-day plan */}
          <div>
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" /> 30-Day Breakout Plan
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Schedule: {analysis.posting_schedule}</p>

            <div className="grid md:grid-cols-2 gap-4">
              {analysis.weeks?.map((week, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase text-primary">Week {week.week}</span>
                    <span className="text-xs text-muted-foreground">{week.format_change}</span>
                  </div>
                  <p className="font-semibold mb-3">{week.focus}</p>
                  <div className="space-y-2">
                    {week.videos?.map((vid, j) => {
                      const key = `${i}-${j}`;
                      return (
                        <label key={j} className="flex items-center gap-2 cursor-pointer group">
                          <button
                            onClick={() => setChecked(p => ({ ...p, [key]: !p[key] }))}
                            className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              checked[key] ? "bg-primary border-primary" : "border-border hover:border-primary/50"
                            }`}
                          >
                            {checked[key] && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                          </button>
                          <span className={`text-sm ${checked[key] ? "line-through text-muted-foreground" : ""}`}>{vid}</span>
                        </label>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </FeaturePage>
  );
}
