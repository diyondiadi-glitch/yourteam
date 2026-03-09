import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import AppLayout from "./components/AppLayout";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

// Diagnose
import VideoDeath from "./pages/diagnose/VideoDeath";
import ChannelRoast from "./pages/diagnose/ChannelRoast";
import HealthCheck from "./pages/diagnose/HealthCheck";
import GrowthIntelligence from "./pages/diagnose/GrowthIntelligence";
import AlgorithmIntelligence from "./pages/diagnose/AlgorithmIntelligence";

// Create
import VideoMachine from "./pages/create/VideoMachine";
import HookScore from "./pages/create/HookScore";
import TitleTester from "./pages/create/TitleTester";
import ThumbnailStudio from "./pages/create/ThumbnailStudio";
import ScriptImprover from "./pages/create/ScriptImprover";
import Teleprompter from "./pages/create/Teleprompter";

// Grow
import LightningLab from "./pages/grow/LightningLab";
import CompetitorSpy from "./pages/strategy/CompetitorSpy";
import NicheGapRadar from "./pages/grow/NicheGapRadar";
import IdeaValidator from "./pages/strategy/IdeaValidator";
import ViralWindow from "./pages/strategy/ViralWindow";
import HiddenGold from "./pages/grow/HiddenGold";
import SponsorReadiness from "./pages/grow/SponsorReadiness";
import CollabMatcher from "./pages/grow/CollabMatcher";
import BurnoutPredictor from "./pages/grow/BurnoutPredictor";

// Coach
import AICoach from "./pages/coach/AICoach";
import CommentIntelligence from "./pages/grow/CommentIntelligence";
import AudienceIntelligence from "./pages/grow/AudienceIntelligence";
import LaunchPlan from "./pages/grow/LaunchPlan";

const queryClient = new QueryClient();
const withLayout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;

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
          <Route path="/diagnose/health-check" element={withLayout(<HealthCheck />)} />
          <Route path="/diagnose/growth-intelligence" element={withLayout(<GrowthIntelligence />)} />
          <Route path="/diagnose/algorithm-intelligence" element={withLayout(<AlgorithmIntelligence />)} />

          {/* CREATE */}
          <Route path="/create/video-machine" element={withLayout(<VideoMachine />)} />
          <Route path="/create/hook-score" element={withLayout(<HookScore />)} />
          <Route path="/create/title-tester" element={withLayout(<TitleTester />)} />
          <Route path="/create/thumbnail-studio" element={withLayout(<ThumbnailStudio />)} />
          <Route path="/create/script-improver" element={withLayout(<ScriptImprover />)} />
          <Route path="/create/teleprompter" element={withLayout(<Teleprompter />)} />

          {/* GROW */}
          <Route path="/grow/lightning-lab" element={withLayout(<LightningLab />)} />
          <Route path="/strategy/competitor-spy" element={withLayout(<CompetitorSpy />)} />
          <Route path="/grow/niche-gap" element={withLayout(<NicheGapRadar />)} />
          <Route path="/strategy/idea-validator" element={withLayout(<IdeaValidator />)} />
          <Route path="/strategy/viral-window" element={withLayout(<ViralWindow />)} />
          <Route path="/grow/hidden-gold" element={withLayout(<HiddenGold />)} />
          <Route path="/grow/sponsor" element={withLayout(<SponsorReadiness />)} />
          <Route path="/grow/collab-matcher" element={withLayout(<CollabMatcher />)} />
          <Route path="/grow/content-battery" element={withLayout(<BurnoutPredictor />)} />

          {/* COACH */}
          <Route path="/coach" element={withLayout(<AICoach />)} />
          <Route path="/grow/comment-intelligence" element={withLayout(<CommentIntelligence />)} />
          <Route path="/grow/audience-intelligence" element={withLayout(<AudienceIntelligence />)} />
          <Route path="/grow/launch-plan" element={withLayout(<LaunchPlan />)} />

          {/* ANALYZE (Full Connect) */}
          <Route path="/analyze/subscriber-converter" element={withLayout(<SubscriberConverter />)} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
