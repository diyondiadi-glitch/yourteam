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
import VideoDetail from "./pages/VideoDetail";

// Diagnose
import VideoDeath from "./pages/diagnose/VideoDeath";
import ChannelRoast from "./pages/diagnose/ChannelRoast";
import HealthCheck from "./pages/diagnose/HealthCheck";
import PlateauBreaker from "./pages/diagnose/PlateauBreaker";
import AlgorithmMap from "./pages/diagnose/AlgorithmMap";

// Strategy
import NextVideo from "./pages/strategy/NextVideo";
import TrendRadar from "./pages/strategy/TrendRadar";
import IdeaValidator from "./pages/strategy/IdeaValidator";
import ViralWindow from "./pages/strategy/ViralWindow";
import TopicGraveyard from "./pages/strategy/TopicGraveyard";
import CompetitorSpy from "./pages/strategy/CompetitorSpy";
import SeriesPlanner from "./pages/strategy/SeriesPlanner";
import CollabScriptGenerator from "./pages/strategy/CollabScriptGenerator";

// Create
import VideoMachine from "./pages/create/VideoMachine";
import ThumbnailLab from "./pages/create/ThumbnailLab";
import HookScore from "./pages/create/HookScore";
import TitleTester from "./pages/create/TitleTester";
import ScriptImprover from "./pages/create/ScriptImprover";

// Analyze
import WarRoom from "./pages/analyze/WarRoom";
import ShortsVsLongs from "./pages/analyze/ShortsVsLongs";
import OutlierSpotter from "./pages/analyze/OutlierSpotter";
import DeadVideoRevival from "./pages/analyze/DeadVideoRevival";
import CommentMiner from "./pages/analyze/CommentMiner";
import TitleGraveyardPage from "./pages/analyze/TitleGraveyard";
import BestUploadTime from "./pages/analyze/BestUploadTime";
import EngagementDrop from "./pages/analyze/EngagementDrop";
import RetentionPredictor from "./pages/analyze/RetentionPredictor";

// Grow
import RecreateBest from "./pages/grow/RecreateBest";
import CollabMatcher from "./pages/grow/CollabMatcher";
import AudiencePersona from "./pages/grow/AudiencePersona";
import SponsorReadiness from "./pages/grow/SponsorReadiness";
import BurnoutRecovery from "./pages/grow/BurnoutRecovery";
import LaunchPlan from "./pages/grow/LaunchPlan";

// Coach
import AICoach from "./pages/coach/AICoach";

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
          <Route path="/video" element={withLayout(<VideoDetail />)} />

          {/* DIAGNOSE */}
          <Route path="/diagnose/video-death" element={withLayout(<VideoDeath />)} />
          <Route path="/diagnose/roast" element={withLayout(<ChannelRoast />)} />
          <Route path="/diagnose/health-check" element={withLayout(<HealthCheck />)} />
          <Route path="/diagnose/plateau" element={withLayout(<PlateauBreaker />)} />
          <Route path="/diagnose/algorithm-map" element={withLayout(<AlgorithmMap />)} />

          {/* STRATEGY */}
          <Route path="/strategy/next-video" element={withLayout(<NextVideo />)} />
          <Route path="/strategy/trend-radar" element={withLayout(<TrendRadar />)} />
          <Route path="/strategy/idea-validator" element={withLayout(<IdeaValidator />)} />
          <Route path="/strategy/viral-window" element={withLayout(<ViralWindow />)} />
          <Route path="/strategy/topic-graveyard" element={withLayout(<TopicGraveyard />)} />
          <Route path="/strategy/competitor-spy" element={withLayout(<CompetitorSpy />)} />
          <Route path="/strategy/series-planner" element={withLayout(<SeriesPlanner />)} />
          <Route path="/strategy/collab-script" element={withLayout(<CollabScriptGenerator />)} />

          {/* CREATE */}
          <Route path="/create/video-machine" element={withLayout(<VideoMachine />)} />
          <Route path="/create/thumbnail-lab" element={withLayout(<ThumbnailLab />)} />
          <Route path="/create/hook-score" element={withLayout(<HookScore />)} />
          <Route path="/create/title-tester" element={withLayout(<TitleTester />)} />
          <Route path="/create/script-improver" element={withLayout(<ScriptImprover />)} />

          {/* ANALYZE */}
          <Route path="/analyze/war-room" element={withLayout(<WarRoom />)} />
          <Route path="/analyze/shorts-vs-longs" element={withLayout(<ShortsVsLongs />)} />
          <Route path="/analyze/outliers" element={withLayout(<OutlierSpotter />)} />
          <Route path="/analyze/revival" element={withLayout(<DeadVideoRevival />)} />
          <Route path="/analyze/comments" element={withLayout(<CommentMiner />)} />
          <Route path="/analyze/title-graveyard" element={withLayout(<TitleGraveyardPage />)} />
          <Route path="/analyze/best-upload-time" element={withLayout(<BestUploadTime />)} />
          <Route path="/analyze/engagement-drop" element={withLayout(<EngagementDrop />)} />
          <Route path="/analyze/retention-predictor" element={withLayout(<RetentionPredictor />)} />

          {/* GROW */}
          <Route path="/grow/recreate-best" element={withLayout(<RecreateBest />)} />
          <Route path="/grow/collab-matcher" element={withLayout(<CollabMatcher />)} />
          <Route path="/grow/persona" element={withLayout(<AudiencePersona />)} />
          <Route path="/grow/sponsor" element={withLayout(<SponsorReadiness />)} />
          <Route path="/grow/burnout" element={withLayout(<BurnoutRecovery />)} />
          <Route path="/grow/launch-plan" element={withLayout(<LaunchPlan />)} />

          {/* AI COACH */}
          <Route path="/coach" element={withLayout(<AICoach />)} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
