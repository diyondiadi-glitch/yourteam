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

  async function handleSend(text?: string) {
    const content = text || input.trim();
    if (!content || loading) return;

    const userMsg: Message = { role: "user", content };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setInput("");
    setLoading(true);
    setFollowUpChips([]);

    try {
      const systemPrompt = `You are Max, an elite YouTube strategist. 
      Rules:
      - Every response must reference the creator's actual channel: ${channel?.name}
      - Reference real video titles or specific numbers from their data: ${channelContext}
      - Use their bestDay (${bestDay}) and avgViews (${formatCount(avgViews)}) in recommendations.
      - Never give generic advice.
      - Always end with one specific action the creator can take TODAY.
      - Max 4 sentences unless detail is requested.
      - If they seem burnt out, acknowledge it warmly before advising.
      - Sound like a brilliant friend.`;

      const response = await callAI(systemPrompt, content);
      const assistantMsg: Message = { role: "assistant", content: response };
      const finalMsgs = [...updatedMsgs, assistantMsg];
      setMessages(finalMsgs);
      localStorage.setItem("cb_coach_history", JSON.stringify(finalMsgs));
      setFollowUpChips(["Tell me more", "Give me the action steps"]);
    } catch (e) {
      setMessages([...updatedMsgs, { role: "assistant", content: "Sorry, I hit a snag. Can you try asking that again?" }]);
    } finally {
      setLoading(false);
    }
  }

  const quickActionChips = [
    { label: `Why is my channel ${subscribers < 1000 ? 'slow' : 'plateauing'}?`, icon: BarChart3 },
    { label: `What should I post on ${bestDay}?`, icon: Target },
    { label: "Roast my last video", icon: Flame },
    { label: "Give me my 30-day plan", icon: Zap },
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
                    className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                      m.role === "user" 
                        ? "bg-zinc-800 text-white" 
                        : "bg-zinc-900 border-l-4 border-yellow-500 text-zinc-200"
                    }`}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}
              
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-zinc-900 border-l-4 border-yellow-500 p-4 rounded-2xl flex items-center gap-3">
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
                      onClick={() => handleSend(chip)}
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
                  onClick={() => handleSend(chip.label)}
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
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask Max anything about your channel..."
              className="h-14 bg-zinc-900 border-zinc-800 text-white rounded-2xl px-6 focus-visible:ring-yellow-500/50 pr-16"
            />
            <Button
              size="icon"
              disabled={loading || !input.trim()}
              onClick={() => handleSend()}
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
