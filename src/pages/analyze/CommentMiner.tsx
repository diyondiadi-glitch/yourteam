import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Lightbulb, Heart, HelpCircle, AlertCircle, ArrowRight } from "lucide-react";
import FeaturePage from "@/components/FeaturePage";
import LoadingSteps from "@/components/LoadingSteps";
import CopyButton from "@/components/CopyButton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/youtube-auth";
import { getMyChannel, getRecentVideos, getVideoComments, getChannelContext } from "@/lib/youtube-api";
import { callGroq, parseJsonFromResponse } from "@/lib/groq-api";

interface CommentAnalysis {
  video_ideas: { idea: string; demand_score: number; quote: string }[];
  questions: { question: string; quote: string }[];
  emotional_themes: { theme: string; sentiment: string }[];
  superfans: { name: string; comment: string }[];
  complaints: { complaint: string; quote: string }[];
}

export default function CommentMiner() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadStep, setLoadStep] = useState(0);
  const [analysis, setAnalysis] = useState<CommentAnalysis | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { navigate("/", { replace: true }); return; }
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoadStep(0);
      const ch = await getMyChannel();
      const vids = await getRecentVideos(ch.id, 10);
      setLoadStep(1);

      const commentPromises = vids.map(v => getVideoComments(v.id, 30));
      const commentArrays = await Promise.all(commentPromises);
      const allComments = commentArrays.flat();
      setLoadStep(2);

      const context = getChannelContext(ch, vids);
      const result = await callGroq(
        "Analyse all these YouTube comments. Extract: 1) Top 10 video ideas explicitly or implicitly requested by viewers with demand score 1-100, 2) Top questions that reveal content gaps, 3) Emotional themes — what are viewers feeling, 4) Superfan comments that show deep loyalty, 5) Complaints that reveal what confused viewers. Format as JSON with fields: video_ideas (array of {idea, demand_score, quote}), questions (array of {question, quote}), emotional_themes (array of {theme, sentiment}), superfans (array of {name, comment}), complaints (array of {complaint, quote}).",
        `${context}\n\nCOMMENTS FROM LAST 10 VIDEOS (${allComments.length} total):\n${allComments.slice(0, 200).join("\n---\n")}`
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
      <FeaturePage emoji="⛏️" title="Mining for Gold" description="Extracting video ideas your audience is begging for">
        <LoadingSteps steps={["Fetching your videos...", "Mining comments...", "Extracting golden insights..."]} currentStep={loadStep} />
      </FeaturePage>
    );
  }

  return (
    <FeaturePage emoji="⛏️" title="Mining for Gold" description="Extracting video ideas your audience is begging for">
      {analysis && (
        <div className="space-y-8">
          {/* Video Ideas */}
          <section>
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-primary" /> Video Ideas From Your Audience
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {analysis.video_ideas?.map((idea, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-xl border border-border bg-card p-5 card-glow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold">{idea.idea}</p>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">{idea.demand_score}</span>
                  </div>
                  <p className="text-xs text-muted-foreground italic mb-3">"{idea.quote}"</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${idea.demand_score}%` }}
                        transition={{ duration: 0.8, delay: i * 0.08 + 0.3 }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => navigate(`/create/video-machine?topic=${encodeURIComponent(idea.idea)}`)}>
                      Build <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Questions */}
          {analysis.questions?.length > 0 && (
            <section>
              <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <HelpCircle className="h-5 w-5 text-warning" /> Content Gap Questions
              </h2>
              <div className="space-y-3">
                {analysis.questions.map((q, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-4 flex items-start gap-3">
                    <HelpCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{q.question}</p>
                      <p className="text-xs text-muted-foreground mt-1 italic">"{q.quote}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Superfans */}
          {analysis.superfans?.length > 0 && (
            <section>
              <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <Heart className="h-5 w-5 text-destructive" /> Superfan Highlights
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {analysis.superfans.map((f, i) => (
                  <div key={i} className="rounded-lg border border-primary/10 bg-card p-4">
                    <p className="text-xs text-primary font-semibold mb-1">{f.name || "Anonymous"}</p>
                    <p className="text-sm italic text-muted-foreground">"{f.comment}"</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Complaints */}
          {analysis.complaints?.length > 0 && (
            <section>
              <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-destructive" /> Viewer Complaints
              </h2>
              <div className="space-y-3">
                {analysis.complaints.map((c, i) => (
                  <div key={i} className="rounded-lg border border-destructive/10 bg-card p-4">
                    <p className="text-sm font-medium">{c.complaint}</p>
                    <p className="text-xs text-muted-foreground mt-1 italic">"{c.quote}"</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </FeaturePage>
  );
}
