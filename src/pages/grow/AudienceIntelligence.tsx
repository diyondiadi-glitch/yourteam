import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FeaturePage from "@/components/FeaturePage";
import LoadingSteps from "@/components/LoadingSteps";
import { useChannelData } from "@/hooks/useChannelData";
import { callAI, parseJsonSafely } from "@/lib/ai-service";
import ShareInsight from "@/components/ShareInsight";
import { AlertCircle, Users, Target, MapPin, Smile, Frown, Lightbulb } from "lucide-react";

export default function AudienceIntelligence() {
  const { channel, videos, loading: dataLoading, channelContext } = useChannelData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audienceData, setAudienceData] = useState<any>(null);

  useEffect(() => {
    if (!channel || !videos?.length) return;
    
    setLoading(true);
    setError(null);
    
    const videoSummary = videos.slice(0, 10).map(v => 
      `"${v.title}" - ${v.views} views`
    ).join(", ");
    
    callAI(
      `You are a YouTube audience analyst. Return ONLY valid JSON, no markdown. 
Format: {"demographics":{"primary_age":"string","gender_split":"string","location":"string"},"psychographics":{"interests":["string"],"motivation":"string","content_preference":"string"},"what_converts":"string","what_repels":"string","ideal_next_video":"string"}`,
      `Channel: ${channel.name}. ${channel.subscribers} subscribers. Avg views: ${channel.avgViews}. Best day: ${channel.bestDay}. Top videos: ${videoSummary}`,
      { maxTokens: 600, temperature: 0.6 }
    ).then(result => {
      const parsed = parseJsonSafely(result);
      if (parsed) setAudienceData(parsed);
      else setError("Could not analyze audience. Try again.");
      setLoading(false);
    }).catch(() => {
      setError("AI failed. Please try again.");
      setLoading(false);
    });
  }, [channel?.id, videos?.length]);

  if (dataLoading || loading) {
    return (
      <FeaturePage emoji="👥" title="Audience Intelligence" description="Who your audience is and what converts them">
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-4"
          >
            <Users className="h-10 w-10 text-primary" />
          </motion.div>
          <p className="text-zinc-400 font-medium">Analyzing audience patterns...</p>
        </div>
      </FeaturePage>
    );
  }

  if (error) {
    return (
      <FeaturePage emoji="👥" title="Audience Intelligence" description="Who your audience is and what converts them">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-white font-bold text-lg mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-sm text-zinc-400 hover:text-white underline"
          >
            Retry analysis
          </button>
        </div>
      </FeaturePage>
    );
  }

  return (
    <FeaturePage emoji="👥" title="Audience Intelligence" description="Who your audience is and what converts them">
      {audienceData ? (
        <div className="space-y-8 pb-20">
          {/* Top Row: Demographics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-5 w-5 text-blue-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Primary Age</p>
              </div>
              <p className="text-2xl font-bold">{audienceData.demographics.primary_age}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-5 w-5 text-purple-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Gender Split</p>
              </div>
              <p className="text-2xl font-bold">{audienceData.demographics.gender_split}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-5 w-5 text-red-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Top Location</p>
              </div>
              <p className="text-2xl font-bold">{audienceData.demographics.location}</p>
            </div>
          </div>

          {/* Middle Row: Psychographics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
              <h3 className="text-xl font-bold font-display mb-6">Audience Interests</h3>
              <div className="flex flex-wrap gap-2">
                {audienceData.psychographics.interests.map((interest: string, i: number) => (
                  <span key={i} className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-full text-sm font-medium text-zinc-300">
                    {interest}
                  </span>
                ))}
              </div>
              <div className="mt-8 pt-8 border-t border-zinc-800 space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Core Motivation</p>
                  <p className="text-zinc-200">{audienceData.psychographics.motivation}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Content Preference</p>
                  <p className="text-zinc-200">{audienceData.psychographics.content_preference}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-green-500/5 border border-green-500/20 p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-3">
                  <Smile className="h-5 w-5 text-green-500" />
                  <p className="font-bold text-green-500">What Converts Them</p>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed">{audienceData.what_converts}</p>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-3">
                  <Frown className="h-5 w-5 text-red-500" />
                  <p className="font-bold text-red-500">What Repels Them</p>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed">{audienceData.what_repels}</p>
              </div>
            </div>
          </div>

          {/* Bottom Row: Next Video Recommendation */}
          <div className="bg-yellow-500 text-black p-8 rounded-3xl relative overflow-hidden shadow-xl shadow-yellow-500/10">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Lightbulb className="h-32 w-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <Lightbulb className="h-6 w-6" />
                <p className="font-black uppercase tracking-widest text-xs opacity-70">Ideal Next Video</p>
              </div>
              <h2 className="text-3xl font-bold font-display leading-tight">{audienceData.ideal_next_video}</h2>
              <p className="mt-4 font-medium opacity-80">This concept bridges your top performance markers with audience core motivations.</p>
            </div>
          </div>

          <ShareInsight title="Audience Intelligence" value={audienceData.demographics.primary_age} subtitle={`Ideal next video: ${audienceData.ideal_next_video}`} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Users className="h-12 w-12 mb-4 opacity-20" />
          <p>No data available for this channel</p>
        </div>
      )}
    </FeaturePage>
  );
}
