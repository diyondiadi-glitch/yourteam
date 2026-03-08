import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingDown, Calendar, CheckCircle, Clock, Video } from "lucide-react";
import FeaturePage from "@/components/FeaturePage";
import LoadingSteps from "@/components/LoadingSteps";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/youtube-auth";
import { getMyChannel, getRecentVideos, getChannelContext } from "@/lib/youtube-api";
import { callGroq, parseJsonFromResponse } from "@/lib/groq-api";

interface PlateauAnalysis {
  plateau_type: string;
  root_cause: string;
  weeks: { week: number; focus: string; videos: string[]; format_change: string }[];
  posting_schedule: any;
}

function parseSchedule(schedule: any): { frequency: string; days: string; time: string } {
  if (typeof schedule === "string") {
    try {
      const parsed = JSON.parse(schedule);
      return {
        frequency: parsed.frequency || schedule,
        days: parsed.days || "",
        time: parsed.time || "",
      };
    } catch {
      return { frequency: schedule, days: "", time: "" };
    }
  }
  if (typeof schedule === "object" && schedule !== null) {
    return {
      frequency: schedule.frequency || "",
      days: Array.isArray(schedule.days) ? schedule.days.join(", ") : (schedule.days || ""),
      time: schedule.time || "",
    };
  }
  return { frequency: "3 videos per week", days: "", time: "" };
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
        "This creator may be stuck in a growth plateau. Analyse their data and identify: what type of plateau this is (topic exhaustion/packaging decline/posting inconsistency/audience mismatch), the single root cause, and a specific 30-day breakout plan with exact video topics for each week, format changes to try, and posting schedule. Make the plan feel achievable. Return JSON with: plateau_type, root_cause, weeks (array of 4 objects with week number, focus, videos array of exactly 3 strings, format_change), posting_schedule (object with frequency, days, time).",
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

  const totalTasks = analysis?.weeks?.reduce((s, w) => s + (w.videos?.length || 0), 0) || 0;
  const completedTasks = Object.values(checked).filter(Boolean).length;

  if (loading) {
    return (
      <FeaturePage emoji="📉" title="Growth Plateau Breaker" description="Detect plateau patterns and get a 30-day breakout plan">
        <LoadingSteps steps={["Analysing growth patterns...", "Identifying plateau type...", "Building breakout plan..."]} currentStep={loadStep} />
      </FeaturePage>
    );
  }

  const schedule = analysis ? parseSchedule(analysis.posting_schedule) : null;

  return (
    <FeaturePage emoji="📉" title="Growth Plateau Breaker" description="Detect plateau patterns and get a 30-day breakout plan">
      {analysis && (
        <div className="space-y-8">
          {/* Plateau Type Badge */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-3 rounded-2xl border-2 border-destructive/30 bg-destructive/10 px-8 py-4">
              <TrendingDown className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-xs font-semibold uppercase text-destructive tracking-wider">Plateau Type</p>
                <p className="text-2xl font-bold">{analysis.plateau_type}</p>
              </div>
            </div>
            <p className="text-muted-foreground text-center max-w-md">{analysis.root_cause}</p>
          </motion.div>

          {/* Progress Bar */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="section-header">📋 30-Day Plan Progress</p>
              <span className="data-number text-2xl">{completedTasks}/{totalTasks}</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                className="h-full bg-primary rounded-full"
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Schedule Cards */}
          {schedule && (
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
                <Video className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Frequency</p>
                <p className="font-bold">{schedule.frequency}</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
                <Calendar className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Best Days</p>
                <p className="font-bold">{schedule.days || "Mon, Wed, Fri"}</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
                <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Upload Time</p>
                <p className="font-bold">{schedule.time || "2:00 PM"}</p>
              </div>
            </div>
          )}

          {/* Kanban Board */}
          <div>
            <h2 className="section-header flex items-center gap-2 mb-5">
              <Calendar className="h-5 w-5 text-primary" /> Content Calendar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analysis.weeks?.map((week, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-xl border border-border bg-card flex flex-col"
                >
                  {/* Column Header */}
                  <div className="p-4 border-b border-border bg-secondary/30 rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-primary">Week {week.week}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {week.format_change}
                      </span>
                    </div>
                    <p className="text-sm font-semibold mt-1">{week.focus}</p>
                  </div>

                  {/* Video Cards */}
                  <div className="p-3 space-y-2 flex-1">
                    {week.videos?.map((vid, j) => {
                      const key = `${i}-${j}`;
                      const done = checked[key];
                      return (
                        <div
                          key={j}
                          onClick={() => setChecked(p => ({ ...p, [key]: !p[key] }))}
                          className={`rounded-lg border p-3 cursor-pointer transition-all ${
                            done
                              ? "border-primary/30 bg-primary/5 opacity-70"
                              : "border-border bg-background hover:border-primary/20 hover:bg-secondary/30"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              done ? "bg-primary border-primary" : "border-muted-foreground/30"
                            }`}>
                              {done && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <span className={`text-sm leading-snug ${done ? "line-through text-muted-foreground" : ""}`}>
                              {vid}
                            </span>
                          </div>
                        </div>
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
