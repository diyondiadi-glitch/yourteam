import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import AppLayout from "./components/AppLayout";
import AuthCallback from "./pages/AuthCallback";
import ComingSoon from "./components/ComingSoon";
import NotFound from "./pages/NotFound";

// Feature pages
import VideoDeath from "./pages/diagnose/VideoDeath";
import ChannelRoast from "./pages/diagnose/ChannelRoast";
import PlateauBreaker from "./pages/diagnose/PlateauBreaker";
import NextVideo from "./pages/strategy/NextVideo";
import TrendRadar from "./pages/strategy/TrendRadar";
import ViralWindow from "./pages/strategy/ViralWindow";
import CompetitorSpy from "./pages/strategy/CompetitorSpy";
import VideoMachine from "./pages/create/VideoMachine";
import ThumbnailLab from "./pages/create/ThumbnailLab";
import HookScore from "./pages/create/HookScore";
import TitleTester from "./pages/create/TitleTester";
import WarRoom from "./pages/analyze/WarRoom";
import CommentMiner from "./pages/analyze/CommentMiner";
import DeadVideoRevival from "./pages/analyze/DeadVideoRevival";
import RecreateBest from "./pages/grow/RecreateBest";
import CollabMatcher from "./pages/grow/CollabMatcher";
import BurnoutRecovery from "./pages/grow/BurnoutRecovery";
import AICoach from "./pages/coach/AICoach";

const queryClient = new QueryClient();

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
          <Route path="/diagnose/roast" element={withLayout(<ChannelRoast />)} />
          <Route path="/diagnose/health-check" element={soon("🏥", "Channel Health Check", "Scan 8 vital signs of your channel's health")} />
          <Route path="/diagnose/plateau" element={withLayout(<PlateauBreaker />)} />
          <Route path="/diagnose/algorithm-map" element={soon("🗺️", "Algorithm Map", "Discover your personal algorithm patterns and sweet spots")} />

          {/* STRATEGY */}
          <Route path="/strategy/next-video" element={withLayout(<NextVideo />)} />
          <Route path="/strategy/trend-radar" element={withLayout(<TrendRadar />)} />
          <Route path="/strategy/idea-validator" element={soon("✅", "Idea Validator", "Validate any video idea before you invest time creating it")} />
          <Route path="/strategy/viral-window" element={withLayout(<ViralWindow />)} />
          <Route path="/strategy/topic-graveyard" element={soon("💀", "Topic Graveyard", "See which topics consistently underperform on your channel")} />
          <Route path="/strategy/competitor-spy" element={withLayout(<CompetitorSpy />)} />

          {/* CREATE */}
          <Route path="/create/video-machine" element={withLayout(<VideoMachine />)} />
          <Route path="/create/thumbnail-lab" element={withLayout(<ThumbnailLab />)} />
          <Route path="/create/hook-score" element={withLayout(<HookScore />)} />
          <Route path="/create/title-tester" element={withLayout(<TitleTester />)} />
          <Route path="/create/thumbnail" element={soon("🖼️", "Thumbnail Advisor", "Get scored thumbnail briefs that boost your CTR")} />
          <Route path="/create/script-improver" element={soon("✍️", "Script Improver", "Improve pacing, storytelling, and retention in any script")} />

          {/* ANALYZE */}
          <Route path="/analyze/war-room" element={withLayout(<WarRoom />)} />
          <Route path="/analyze/shorts-vs-longs" element={soon("⚔️", "Shorts vs Longs Report", "Compare format performance and get your ideal content mix")} />
          <Route path="/analyze/outliers" element={soon("⭐", "Outlier Video Spotter", "Find videos that massively over or underperformed")} />
          <Route path="/analyze/revival" element={withLayout(<DeadVideoRevival />)} />
          <Route path="/analyze/comments" element={withLayout(<CommentMiner />)} />

          {/* GROW */}
          <Route path="/grow/recreate-best" element={withLayout(<RecreateBest />)} />
          <Route path="/grow/collab-matcher" element={withLayout(<CollabMatcher />)} />
          <Route path="/grow/persona" element={soon("👤", "Audience Persona Builder", "Build a detailed profile of your ideal viewer")} />
          <Route path="/grow/sponsor" element={soon("💰", "Sponsor Readiness Score", "Check if you're ready for brand deals")} />
          <Route path="/grow/burnout" element={withLayout(<BurnoutRecovery />)} />

          {/* AI COACH */}
          <Route path="/coach" element={withLayout(<AICoach />)} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
