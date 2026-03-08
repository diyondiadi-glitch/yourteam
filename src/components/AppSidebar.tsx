import {
  Home, Search, Target, PenTool, BarChart3, DollarSign, Bot,
  AlertTriangle, HeartPulse, TrendingDown, Map,
  Lightbulb, CheckCircle, Clock, Skull, Eye,
  Timer, FileText, Type, Image, Sparkles,
  Activity, GitCompare, Star, Ghost,
  MessageSquare, Copy, Users, BadgeDollarSign, Battery,
  Wand2, Flame, Palette, Radio, Handshake,
  CalendarClock, TrendingUp,
  ListOrdered, PenLine,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { getToken } from "@/lib/youtube-auth";
import { isDemoMode } from "@/lib/youtube-api";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const nav = [
  { section: null, color: "", items: [
    { title: "Dashboard", url: "/dashboard", icon: Home },
  ]},
  { section: "🔍 DIAGNOSE", color: "cat-diagnose", items: [
    { title: "Why Did My Video Die?", url: "/diagnose/video-death", icon: AlertTriangle },
    { title: "Channel Roast Mode", url: "/diagnose/roast", icon: Flame },
    { title: "Channel Health Check", url: "/diagnose/health-check", icon: HeartPulse },
    { title: "Growth Plateau Breaker", url: "/diagnose/plateau", icon: TrendingDown },
    { title: "Algorithm Map", url: "/diagnose/algorithm-map", icon: Map },
  ]},
  { section: "🎯 STRATEGY", color: "cat-strategy", items: [
    { title: "What Should I Make Next?", url: "/strategy/next-video", icon: Lightbulb },
    { title: "Trend News Feed", url: "/strategy/trend-radar", icon: Radio },
    { title: "Idea Validator", url: "/strategy/idea-validator", icon: CheckCircle },
    { title: "Viral Window Predictor", url: "/strategy/viral-window", icon: Clock },
    { title: "Topic Graveyard", url: "/strategy/topic-graveyard", icon: Skull },
    { title: "Competitor Spy", url: "/strategy/competitor-spy", icon: Eye },
    { title: "Series Planner", url: "/strategy/series-planner", icon: ListOrdered },
    { title: "Collab Script Generator", url: "/strategy/collab-script", icon: PenLine },
  ]},
  { section: "✍️ CREATE", color: "cat-create", items: [
    { title: "60-Min Video Machine", url: "/create/video-machine", icon: Timer },
    { title: "Thumbnail A/B Generator", url: "/create/thumbnail-lab", icon: Palette },
    { title: "Hook Score", url: "/create/hook-score", icon: Sparkles },
    { title: "Title Split Tester", url: "/create/title-tester", icon: Type },
    { title: "Thumbnail Advisor", url: "/create/thumbnail", icon: Image },
    { title: "Script Improver", url: "/create/script-improver", icon: Wand2 },
  ]},
  { section: "📊 ANALYZE", color: "cat-analyze", items: [
    { title: "First Hour War Room", url: "/analyze/war-room", icon: Activity },
    { title: "Shorts vs Longs Report", url: "/analyze/shorts-vs-longs", icon: GitCompare },
    { title: "Outlier Video Spotter", url: "/analyze/outliers", icon: Star },
    { title: "Dead Video Revival", url: "/analyze/revival", icon: Ghost },
    { title: "Comment Gold Miner", url: "/analyze/comments", icon: MessageSquare },
    { title: "Title Graveyard", url: "/analyze/title-graveyard", icon: Skull },
    { title: "Best Upload Time", url: "/analyze/best-upload-time", icon: CalendarClock },
    { title: "Engagement Drop Detector", url: "/analyze/engagement-drop", icon: TrendingDown },
  ]},
  { section: "💰 GROW", color: "cat-grow", items: [
    { title: "Recreate Your Best Video", url: "/grow/recreate-best", icon: Copy },
    { title: "Collab Matcher", url: "/grow/collab-matcher", icon: Handshake },
    { title: "Audience Persona Builder", url: "/grow/persona", icon: Users },
    { title: "Sponsor Readiness Score", url: "/grow/sponsor", icon: BadgeDollarSign },
    { title: "Burnout Recovery Mode", url: "/grow/burnout", icon: Battery },
  ]},
  { section: "🤖 AI COACH", color: "", items: [
    { title: "Personal AI Coach", url: "/coach", icon: Bot },
  ]},
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string>("");

  useEffect(() => {
    // Load channel info for avatar
    if (getToken() || isDemoMode()) {
      import("@/lib/youtube-api").then(({ getMyChannel }) => {
        getMyChannel().then(ch => {
          setAvatar(ch.avatar);
          setChannelName(ch.title);
        }).catch(() => {});
      });
    }
  }, []);

  return (
    <Sidebar collapsible="icon" className="border-r border-border sidebar-gradient">
      <SidebarContent className="scrollbar-thin py-2">
        {/* Creator Avatar */}
        {avatar && (
          <div className={`px-3 py-3 mb-1 flex items-center gap-3 border-b border-border ${collapsed ? "justify-center" : ""}`}>
            <img src={avatar} alt={channelName} className="h-8 w-8 rounded-full object-cover border border-primary/30" />
            {!collapsed && <span className="text-sm font-semibold truncate">{channelName}</span>}
          </div>
        )}

        {nav.map((group, gi) => (
          <SidebarGroup key={gi}>
            {group.section && (
              <>
                {gi > 1 && <div className="mx-3 my-2 border-t border-border/50" />}
                <SidebarGroupLabel className="section-label">
                  {collapsed ? group.section.split(" ")[0] : group.section}
                </SidebarGroupLabel>
              </>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className={`text-sm transition-all rounded-lg px-3 py-2 relative ${
                            active
                              ? "bg-primary/10 text-foreground font-medium"
                              : "text-muted-foreground/70 hover:text-foreground hover:bg-secondary"
                          }`}
                          activeClassName="bg-primary/10 text-foreground font-medium"
                        >
                          {active && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary shadow-[0_0_8px_hsla(48,96%,53%,0.6)]" />
                          )}
                          <item.icon className="mr-2.5 h-4 w-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
