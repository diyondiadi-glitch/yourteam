import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2, Loader2, Zap, Target, Flame, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChannelData } from "@/hooks/useChannelData";
import { callAI } from "@/lib/ai-service";
import { formatCount } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AICoach() {
  const { channel, videos, avgViews, bestDay, subscribers, channelContext, isConnected } = useChannelData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [followUpChips, setFollowUpChips] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isConnected) return;
    loadHistory();
  }, [isConnected]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  async function loadHistory() {
    const saved = localStorage.getItem("cb_coach_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setMessages(parsed);
          setInitializing(false);
          return;
        }
      } catch (e) {}
    }
    
    // First time load - generate greeting
    try {
      const latestVideo = videos[0];
      const performance = latestVideo ? (latestVideo.views > avgViews ? "overperformed" : "underperformed") : "published";
      
      const greeting = await callAI(
        `You are Max, an elite YouTube strategist. System Rules:
        - Reference the channel name: ${channel?.name}
        - Reference the latest video: "${latestVideo?.title}" which ${performance}
        - End with the single most important insight about their channel.
        - Sound like a brilliant friend, not a corporate assistant.
        - Max 4 sentences.`,
        `Generate a personalized greeting for ${channel?.name}. Data: ${subscribers} subs, ${formatCount(avgViews)} avg views, best day is ${bestDay}.`
      );
      
      const initialMsgs: Message[] = [{ role: "assistant", content: greeting }];
      setMessages(initialMsgs);
      localStorage.setItem("cb_coach_history", JSON.stringify(initialMsgs));
    } catch (e) {
      const fallback = `Hey! I'm Max. I've been looking at ${channel?.name} and noticed your best day is ${bestDay}. Let's get to work on your next viral hit. What's on your mind?`;
      setMessages([{ role: "assistant", content: fallback }]);
    } finally {
      setInitializing(false);
    }
  }

  async function sendMessage(userText: string) {
    if (!userText.trim()) return;
    setFollowUpChips([]);
    const newHistory = [...messages, { role: "user" as const, content: userText }];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    const stored = localStorage.getItem("cb_channel_data");
    const ch = stored ? JSON.parse(stored) : {};
    const avg = ch.videos?.length ? Math.round(ch.videos.reduce((s:number,v:any)=>s+(v.views||0),0)/ch.videos.length) : 0;

    const historyText = newHistory
      .map(m => `${m.role === "user" ? "User" : "Max"}: ${m.content}`)
      .join("\n");

    const reply = await callAI(
      `You are Max, a brutally honest YouTube growth coach. You know this creator's channel deeply.
Channel: ${ch.name}, ${ch.subscribers} subs, ${avg} avg views.
Recent videos: ${(ch.videos||[]).slice(0,5).map((v:any)=>`"${v.title}" ${v.views}v`).join(" | ")}
RULES: Never repeat a previous message. Always respond directly to what the user just said. Be specific, reference their actual videos and numbers. Keep responses under 4 sentences unless asked for more.`,
      `Conversation so far:\n${historyText}\n\nRespond to the user's latest message now:`
    );

    const finalHistory = [...newHistory, { role: "assistant" as const, content: reply }];
    setMessages(finalHistory);
    localStorage.setItem("cb_coach_history", JSON.stringify(finalHistory));
    setLoading(false);
  }

  const worstVideo = [...(videos || [])].sort((a, b) => (a.views||0) - (b.views||0))[0];
  const bestVideo  = [...(videos || [])].sort((a, b) => (b.views||0) - (a.views||0))[0];
  const subGoal = subscribers < 1000 ? "hitting 1K subs" : subscribers < 10000 ? "hitting 10K subs" : subscribers < 100000 ? "hitting 100K subs" : "doubling my monthly views";
  const quickActionChips = [
    { label: worstVideo ? `Why did "${worstVideo.title.slice(0,34)}${worstVideo.title.length>34?"…":""}" flop?` : "Why is my channel slow?", icon: BarChart3 },
    { label: bestVideo ? `How do I replicate "${bestVideo.title.slice(0,28)}${bestVideo.title.length>28?"…":""}"?` : "What should I post next?", icon: Target },
    { label: "Roast my last 3 videos brutally", icon: Flame },
    { label: `Give me my 30-day plan for ${subGoal}`, icon: Zap },
  ];

  if (!isConnected) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center text-black font-black text-xl">M</div>
          <div>
            <h1 className="font-bold font-display text-lg">AI Coach Max</h1>
            <p className="text-xs text-zinc-500">Your Personal Strategist</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => { localStorage.removeItem("cb_coach_history"); setMessages([]); loadHistory(); }}
          className="text-zinc-500 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Chat
        </Button>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 pr-4 mb-24">
        <div className="space-y-6 pb-4">
          {initializing ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-yellow-500 animate-spin mb-4" />
              <p className="text-zinc-500 text-sm">Max is studying your channel...</p>
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className="max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed"
                    style={m.role === "user" 
                      ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "hsl(var(--foreground))" }
                      : { background: "hsl(var(--background-card))", border: "1px solid rgba(255,255,255,0.07)", borderLeft: "3px solid #facc15", boxShadow: "0 0 0 1px rgba(250,204,21,0.06), 0 4px 20px rgba(250,204,21,0.03)", color: "hsl(var(--foreground))" }
                    }
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}
              
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="p-4 rounded-2xl flex items-center gap-3" style={{ background: "hsl(var(--background-card))", borderLeft: "3px solid #facc15", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-zinc-500 font-medium">Max is thinking...</span>
                  </div>
                </motion.div>
              )}

              {/* Follow-up Chips */}
              {!loading && followUpChips.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-start mt-4">
                  {followUpChips.map(chip => (
                    <button
                      key={chip}
                      onClick={() => sendMessage(chip)}
                      className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Bottom Sticky Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-[280px] p-4 bg-background/80 backdrop-blur-xl border-t border-zinc-800/50 z-20">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length < 3 && !loading && (
            <div className="flex flex-wrap gap-2 justify-center">
              {quickActionChips.map(chip => (
                <button
                  key={chip.label}
                  onClick={() => sendMessage(chip.label)}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
                >
                  <chip.icon className="h-3.5 w-3.5" />
                  {chip.label}
                </button>
              ))}
            </div>
          )}
          
          <div className="relative flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) { sendMessage(input); } }}
              placeholder="Ask Max anything about your channel..."
              className="h-14 bg-zinc-900 border-zinc-800 text-white rounded-2xl px-6 focus-visible:ring-yellow-500/50 pr-16"
            />
            <Button
              size="icon"
              disabled={loading || !input.trim()}
              onClick={() => sendMessage(input)}
              className="absolute right-2 h-10 w-10 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
