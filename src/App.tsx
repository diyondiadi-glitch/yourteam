import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import AppLayout from "./components/AppLayout";
import VideoDeath from "./pages/diagnose/VideoDeath";
import AuthCallback from "./pages/AuthCallback";
import ComingSoon from "./components/ComingSoon";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrap a page in the app layout
const withLayout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;

const soon = (emoji: string, title: string, desc: string) =>
  withLayout(<ComingSoon emoji={emoji} title={title} description={desc} />);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/dashboard" element={withLayout(<Dashboard />)} />

          {/* DIAGNOSE */}
          <Route path="/diagnose/video-death" element={withLayout(<VideoDeath />)} />
          <Route path="/diagnose/health-check" element={soon("🏥", "Channel Health Check", "Scan 8 vital signs of your channel's health")} />
          <Route path="/diagnose/plateau" element={soon("📉", "Growth Plateau Breaker", "Detect plateau patterns and get a 30-day breakout plan")} />
          <Route path="/diagnose/algorithm-map" element={soon("🗺️", "Algorithm Map", "Discover your personal algorithm patterns and sweet spots")} />

          {/* STRATEGY */}
          <Route path="/strategy/next-video" element={soon("💡", "What Should I Make Next?", "Get 5 ranked video ideas based on real demand signals")} />
          <Route path="/strategy/idea-validator" element={soon("✅", "Idea Validator", "Validate any video idea before you invest time creating it")} />
          <Route path="/strategy/viral-window" element={soon("⏰", "Viral Window Predictor", "Catch rising topics before your competitors do")} />
          <Route path="/strategy/topic-graveyard" element={soon("💀", "Topic Graveyard", "See which topics consistently underperform on your channel")} />
          <Route path="/strategy/competitor-spy" element={soon("🕵️", "Competitor Spy", "Track up to 5 competitors and find content gaps")} />

          {/* CREATE */}
          <Route path="/create/video-machine" element={soon("⚡", "60-Minute Video Machine", "Generate a complete video package from one idea")} />
          <Route path="/create/hook-score" element={soon("🎣", "Hook Score", "Score and rewrite your video hooks for maximum retention")} />
          <Route path="/create/title-tester" element={soon("🔤", "Title Split Tester", "Compare titles head-to-head with AI scoring")} />
          <Route path="/create/thumbnail" element={soon("🖼️", "Thumbnail Advisor", "Get scored thumbnail briefs that boost your CTR")} />
          <Route path="/create/script-improver" element={soon("✍️", "Script Improver", "Improve pacing, storytelling, and retention in any script")} />

          {/* ANALYZE */}
          <Route path="/analyze/war-room" element={soon("🚨", "First Hour War Room", "Monitor new uploads in real-time with action alerts")} />
          <Route path="/analyze/shorts-vs-longs" element={soon("⚔️", "Shorts vs Longs Report", "Compare format performance and get your ideal content mix")} />
          <Route path="/analyze/outliers" element={soon("⭐", "Outlier Video Spotter", "Find videos that massively over or underperformed")} />
          <Route path="/analyze/revival" element={soon("👻", "Dead Video Revival", "Revive underperforming videos with current trend potential")} />
          <Route path="/analyze/comments" element={soon("💬", "Comment Gold Miner", "Extract video ideas your audience is begging for")} />

          {/* GROW */}
          <Route path="/grow/recreate-best" element={soon("🔁", "Recreate Your Best Video", "Find your outlier formula and replicate it")} />
          <Route path="/grow/persona" element={soon("👤", "Audience Persona Builder", "Build a detailed profile of your ideal viewer")} />
          <Route path="/grow/sponsor" element={soon("💰", "Sponsor Readiness Score", "Check if you're ready for brand deals")} />
          <Route path="/grow/burnout" element={soon("🔋", "Burnout Recovery Mode", "A light 4-week schedule to maintain your channel stress-free")} />

          {/* AI COACH */}
          <Route path="/coach" element={soon("🤖", "Personal AI Coach", "Chat with an AI that knows everything about your channel")} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
