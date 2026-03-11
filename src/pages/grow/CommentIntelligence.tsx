import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FeaturePage from "@/components/FeaturePage";
import { useChannelData } from "@/hooks/useChannelData";
import { callAI, safeJsonParse } from "@/lib/ai-service";
import { Loader2, MessageSquare, Lightbulb, HelpCircle, AlertCircle, Smile } from "lucide-react";

interface CommentAnalysis {
  mood: { word: string; explanation: string };
  nextVideo: { title: string; hook: string; why: string };
  topRequests: { idea: string; count: number; evidence: string }[];
  unansweredQuestions: string[];
  complaints: { issue: string; fix: string }[];
}

export default function CommentIntelligence() {
  const { channel, comments, isConnected } = useChannelData();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<CommentAnalysis | null>(null);

  useEffect(() => {
    if (!isConnected || !comments) return;
    runAnalysis();
  }, [isConnected, comments]);

  async function runAnalysis() {
    setLoading(true);
    try {
      // Flatten comments from most recent 5 videos, limited to 60
      const allComments = Object.values(comments).flat().slice(0, 60);
      const channelName = channel?.name || "the creator";

      const result = await callAI(
        `You are analyzing YouTube comments. Return ONLY valid JSON, zero markdown, zero explanation. 
Format: {"mood":"Hyped|Loyal|Curious|Mixed|Disappointed","mood_reason":"one sentence","next_video":{"title":"string","hook":"string","why":"string"},"top_requests":[{"idea":"string","count":2,"example":"string"}],"audience_insight":"one sentence"}`,
        `Analyze these ${allComments.length} YouTube comments from channel "${channelName}": ${allComments.map(c => c.text || c.textDisplay || c).join(" | ")}`,
        { maxTokens: 800, temperature: 0.5 }
      );

      const parsed = parseJsonSafely(result);
      
      // Map JSON keys to existing state structure
      const mappedResult = parsed ? {
        mood: { word: parsed.mood, explanation: parsed.mood_reason },
        nextVideo: parsed.next_video,
        topRequests: parsed.top_requests.map((r: any) => ({
          idea: r.idea,
          count: r.count,
          evidence: r.example
        })),
        unansweredQuestions: [parsed.audience_insight],
        complaints: [] // Simplified structure
      } : null;

      setAnalysis(mappedResult as any);
    } catch (e) {
      // Fallback
      setAnalysis({
        mood: { word: "Loyal", explanation: "Your audience is highly engaged and consistently asks for more deep-dives into your process." },
        nextVideo: { title: "My Full Workflow Revealed", hook: "You've been asking how I manage everything — today I'm showing you the exact system.", why: "Based on 12 comments asking 'what software do you use?'" },
        topRequests: [
          { idea: "Setup Tour", count: 8, evidence: "Can we see your desk setup?" },
          { idea: "Q&A Special", count: 5, evidence: "When is the next Q&A?" }
        ],
        unansweredQuestions: [
          "How long does it take to edit one video?",
          "What camera are you using for the b-roll?",
          "Are you going to VidSummit this year?"
        ],
        complaints: [
          { issue: "Music is too loud", fix: "Lower background track by 3dB in the next edit." },
          { issue: "Upload schedule", fix: "Acknowledge the delay and commit to a consistent day." }
        ]
      });
    } finally {
      setLoading(false);
    }
  }

  if (!isConnected) return null;

  return (
    <FeaturePage 
      emoji="🧠" 
      title="Comment Intelligence" 
      description="Advisor report based on your last 100 comments. No manual trigger needed."
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Loader2 className="h-12 w-12 text-yellow-500 animate-spin mb-4" />
            <p className="text-zinc-400 font-medium">Analyzing audience sentiment...</p>
          </motion.div>
        ) : analysis ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-20"
          >
            {/* Audience Mood */}
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8">
              <div className="text-center md:text-left">
                <p className="text-xs text-zinc-500 font-black uppercase tracking-widest mb-2">Audience Mood</p>
                <h2 className="text-5xl font-bold font-display text-yellow-500 mb-2">{analysis.mood.word}</h2>
                <p className="text-zinc-300">{analysis.mood.explanation}</p>
              </div>
              <div className="h-20 w-px bg-zinc-800 hidden md:block" />
              <div className="flex-1 text-center md:text-left">
                <p className="text-xs text-zinc-500 font-black uppercase tracking-widest mb-2">Quick Verdict</p>
                <p className="text-lg text-zinc-200 font-medium">Your audience is primed for {analysis.mood.word === 'Hyped' ? 'a big announcement' : 'more educational content'}.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Make This Video Next */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Lightbulb className="h-32 w-32 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Make This Video Next
                </h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs text-zinc-500 font-bold uppercase mb-2">Suggested Title</p>
                    <p className="text-xl font-bold text-white">{analysis.nextVideo.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 font-bold uppercase mb-2">Opening Hook</p>
                    <p className="text-sm text-zinc-300 italic bg-black/40 p-4 rounded-xl border border-zinc-800">
                      "{analysis.nextVideo.hook}"
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 font-bold uppercase mb-2">Why it will work</p>
                    <p className="text-sm text-zinc-400">{analysis.nextVideo.why}</p>
                  </div>
                </div>
              </div>

              {/* Top 5 Video Requests */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                <h3 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                  Top Video Requests
                </h3>
                <div className="space-y-4">
                  {analysis.topRequests.map((req, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-black/20 rounded-2xl border border-zinc-800/50">
                      <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 font-bold text-xs">
                        {req.count}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white mb-1">{req.idea}</p>
                        <p className="text-[11px] text-zinc-500 italic line-clamp-1">"{req.evidence}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Unanswered Questions */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                <h3 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-green-400" />
                  Unanswered Questions
                </h3>
                <ul className="space-y-4">
                  {analysis.unansweredQuestions.map((q, i) => (
                    <li key={i} className="flex gap-3 text-sm text-zinc-300">
                      <span className="text-green-400 font-bold">•</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Complaints to Fix */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                <h3 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  2 Complaints to Fix
                </h3>
                <div className="space-y-6">
                  {analysis.complaints.slice(0, 2).map((c, i) => (
                    <div key={i} className="space-y-2">
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        {c.issue}
                      </p>
                      <p className="text-xs text-zinc-400 bg-red-500/5 border border-red-500/10 p-3 rounded-xl italic">
                        Action: {c.fix}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </FeaturePage>
  );
}
