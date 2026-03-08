import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, Shield, Target, Crosshair, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FeaturePage from "@/components/FeaturePage";
import LoadingSteps from "@/components/LoadingSteps";
import CopyButton from "@/components/CopyButton";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/youtube-auth";
import { getMyChannel, getRecentVideos, getChannelContext, searchChannel, getChannelById, getChannelVideos, formatCount, type ChannelData, type VideoData } from "@/lib/youtube-api";
import { callGroq, parseJsonFromResponse } from "@/lib/groq-api";

interface SpyReport {
  they_win_at: string[];
  you_win_at: string[];
  steal_these: { strength: string; how_to_steal: string }[];
  exploit_these: { weakness: string; how_to_exploit: string }[];
  topic_gaps: string[];
}

export default function CompetitorSpy() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [myChannel, setMyChannel] = useState<ChannelData | null>(null);
  const [competitor, setCompetitor] = useState<ChannelData | null>(null);
  const [report, setReport] = useState<SpyReport | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { navigate("/", { replace: true }); return; }
  }, []);

  async function analyze() {
    if (!query.trim()) return;
    setLoading(true);
    setReport(null);
    setLoadStep(0);

    try {
      const ch = await getMyChannel();
      setMyChannel(ch);
      const myVids = await getRecentVideos(ch.id, 10);
      setLoadStep(1);

      // Search for competitor
      const compId = await searchChannel(query);
      if (!compId) throw new Error("Channel not found");
      const comp = await getChannelById(compId);
      if (!comp) throw new Error("Channel not found");
      setCompetitor(comp);
      const compVids = await getChannelVideos(compId, 10);
      setLoadStep(2);

      const myContext = getChannelContext(ch, myVids);
      const compSummary = `Competitor: ${comp.title}\nSubscribers: ${formatCount(comp.subscriberCount)}\nTotal Views: ${formatCount(comp.viewCount)}\nRecent Videos:\n${compVids.map(v => `"${v.title}" - ${v.viewCount} views`).join("\n")}`;

      const result = await callGroq(
        "Compare these two YouTube channels. Identify: why the competitor is winning or losing, their exact title formula pattern, topics they own that this creator hasn't covered, topics this creator covers better, 3 specific things this creator should steal from the competitor, 3 weaknesses in the competitor's strategy to exploit. Return JSON with: they_win_at (array of strings), you_win_at (array of strings), steal_these (array of {strength, how_to_steal}), exploit_these (array of {weakness, how_to_exploit}), topic_gaps (array of topics the competitor covers that you don't).",
        `YOUR CHANNEL:\n${myContext}\n\nCOMPETITOR:\n${compSummary}`
      );

      const parsed = parseJsonFromResponse(result);
      if (parsed) setReport(parsed);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <FeaturePage emoji="🕵️" title="Intelligence Report" description="Spy on competitors and find strategic advantages">
      <div className="max-w-xl mx-auto mb-8">
        <div className="flex gap-3">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Enter competitor channel name..."
            className="h-12 rounded-xl"
            onKeyDown={e => e.key === "Enter" && analyze()}
          />
          <Button size="lg" className="h-12 px-6 rounded-xl" onClick={analyze} disabled={loading || !query.trim()}>
            <Eye className="mr-2 h-4 w-4" /> Spy
          </Button>
        </div>
      </div>

      {loading && (
        <LoadingSteps steps={["Gathering your channel data...", "Infiltrating competitor channel...", "Generating intelligence report..."]} currentStep={loadStep} />
      )}

      {report && competitor && (
        <div className="space-y-6">
          {/* Channel comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-primary/20 bg-card p-5 text-center">
              <img src={myChannel?.avatar} className="h-12 w-12 rounded-full mx-auto mb-2" />
              <p className="font-semibold">{myChannel?.title}</p>
              <p className="text-sm text-muted-foreground">{formatCount(myChannel?.subscriberCount || 0)} subs</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <img src={competitor.avatar} className="h-12 w-12 rounded-full mx-auto mb-2" />
              <p className="font-semibold">{competitor.title}</p>
              <p className="text-sm text-muted-foreground">{formatCount(competitor.subscriberCount)} subs</p>
            </div>
          </div>

          {/* Win comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-destructive/20 bg-card p-5">
              <h3 className="text-sm font-semibold uppercase text-destructive mb-3">They Win At</h3>
              {report.they_win_at?.map((s, i) => (
                <p key={i} className="text-sm text-muted-foreground mb-2">• {s}</p>
              ))}
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-success/20 bg-card p-5">
              <h3 className="text-sm font-semibold uppercase text-success mb-3">You Win At</h3>
              {report.you_win_at?.map((s, i) => (
                <p key={i} className="text-sm text-muted-foreground mb-2">• {s}</p>
              ))}
            </motion.div>
          </div>

          {/* Steal & Exploit */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Steal These</h3>
              {report.steal_these?.map((s, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4 card-glow">
                  <p className="text-sm font-medium mb-1">{s.strength}</p>
                  <p className="text-xs text-muted-foreground">{s.how_to_steal}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><Crosshair className="h-4 w-4 text-destructive" /> Exploit These</h3>
              {report.exploit_these?.map((s, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4 card-glow">
                  <p className="text-sm font-medium mb-1">{s.weakness}</p>
                  <p className="text-xs text-muted-foreground">{s.how_to_exploit}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Topic gaps */}
          {report.topic_gaps?.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-3">Topic Gaps (they cover, you don't)</h3>
              <div className="flex flex-wrap gap-2">
                {report.topic_gaps.map((t, i) => (
                  <Button key={i} variant="outline" size="sm" onClick={() => navigate(`/create/video-machine?topic=${encodeURIComponent(t)}`)}>
                    {t} <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </FeaturePage>
  );
}
