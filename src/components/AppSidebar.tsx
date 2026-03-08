import {
  Home, Target, PenTool, BarChart3, Bot,
  AlertTriangle, HeartPulse, TrendingDown, Map,
  Lightbulb, CheckCircle, Clock, Skull, Eye,
  Timer, Type, Image, Sparkles,
  Activity, GitCompare, Star, Ghost,
  MessageSquare, Copy, Users, BadgeDollarSign, Battery,
  Wand2, Flame, Palette, Radio, Handshake,
  CalendarClock, TrendingUp,
  ListOrdered, PenLine, Settings, Zap, Youtube,
  Gauge, CalendarDays,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
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
  { section: null, color: "", cssVar: "", items: [
    { title: "Dashboard", url: "/dashboard", icon: Home },
  ]},
  { section: "DIAGNOSE", color: "cat-diagnose", cssVar: "--cat-diagnose", items: [
    { title: "Why Did My Video Die?", url: "/diagnose/video-death", icon: AlertTriangle },
    { title: "Channel Roast Mode", url: "/diagnose/roast", icon: Flame },
    { title: "Channel Health Check", url: "/diagnose/health-check", icon: HeartPulse },
    { title: "Growth Plateau Breaker", url: "/diagnose/plateau", icon: TrendingDown },
    { title: "Algorithm DNA", url: "/diagnose/algorithm-map", icon: Map },
  ]},
  { section: "STRATEGY", color: "cat-strategy", cssVar: "--cat-strategy", items: [
    { title: "What Should I Make Next?", url: "/strategy/next-video", icon: Lightbulb },
    { title: "Trend News Feed", url: "/strategy/trend-radar", icon: Radio },
    { title: "Idea Validator", url: "/strategy/idea-validator", icon: CheckCircle },
    { title: "Viral Window Predictor", url: "/strategy/viral-window", icon: Clock },
    { title: "Topic Graveyard", url: "/strategy/topic-graveyard", icon: Skull },
    { title: "Competitor Spy", url: "/strategy/competitor-spy", icon: Eye },
    { title: "Series Planner", url: "/strategy/series-planner", icon: ListOrdered },
    { title: "Collab Script Generator", url: "/strategy/collab-script", icon: PenLine },
  ]},
  { section: "CREATE", color: "cat-create", cssVar: "--cat-create", items: [
    { title: "60-Min Video Machine", url: "/create/video-machine", icon: Timer },
    { title: "Thumbnail A/B Lab", url: "/create/thumbnail-lab", icon: Palette },
    { title: "Hook Score", url: "/create/hook-score", icon: Sparkles },
    { title: "Title Split Tester", url: "/create/title-tester", icon: Type },
    { title: "Script Improver", url: "/create/script-improver", icon: Wand2 },
  ]},
  { section: "ANALYZE", color: "cat-analyze", cssVar: "--cat-analyze", items: [
    { title: "First Hour War Room", url: "/analyze/war-room", icon: Activity },
    { title: "Shorts vs Longs Report", url: "/analyze/shorts-vs-longs", icon: GitCompare },
    { title: "Outlier Video Spotter", url: "/analyze/outliers", icon: Star },
    { title: "Dead Video Revival", url: "/analyze/revival", icon: Ghost },
    { title: "Comment Gold Miner", url: "/analyze/comments", icon: MessageSquare },
    { title: "Title Graveyard", url: "/analyze/title-graveyard", icon: Skull },
    { title: "Best Upload Time", url: "/analyze/best-upload-time", icon: CalendarClock },
    { title: "Engagement Drop", url: "/analyze/engagement-drop", icon: TrendingDown },
    { title: "Retention Predictor", url: "/analyze/retention-predictor", icon: Gauge },
  ]},
  { section: "GROW", color: "cat-grow", cssVar: "--cat-grow", items: [
    { title: "Recreate Your Best", url: "/grow/recreate-best", icon: Copy },
    { title: "Collab Matcher", url: "/grow/collab-matcher", icon: Handshake },
    { title: "Audience Persona", url: "/grow/persona", icon: Users },
    { title: "Sponsor Readiness", url: "/grow/sponsor", icon: BadgeDollarSign },
    { title: "Burnout Recovery", url: "/grow/burnout", icon: Battery },
    { title: "30-Day Launch Plan", url: "/grow/launch-plan", icon: CalendarDays },
  ]},
  { section: "AI COACH", color: "cat-coach", cssVar: "--cat-coach", items: [
    { title: "Personal AI Coach", url: "/coach", icon: Bot },
  ]},
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string>("");
  const isConnected = !!getToken();

  useEffect(() => {
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
    <Sidebar collapsible="icon" className="border-r border-border/50 sidebar-gradient">
      <SidebarContent className="scrollbar-thin py-3">
        {/* Logo */}
        <div className={`px-4 pb-3 mb-1 border-b border-border/30 ${collapsed ? "text-center" : ""}`}>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary shrink-0" />
            {!collapsed && (
              <div>
                <span className="text-sm font-bold text-foreground">CreatorBrain</span>
                <span className="text-[10px] text-muted-foreground ml-1.5">v2.0</span>
              </div>
            )}
          </div>
        </div>

        {/* Avatar */}
        {avatar && (
          <div className={`px-4 py-3 mb-1 flex items-center gap-3 border-b border-border/30 ${collapsed ? "justify-center" : ""}`}>
            <img src={avatar} alt={channelName} className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/30" />
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{channelName}</p>
                {isDemoMode() && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-warning">Demo Mode</span>
                )}
              </div>
            )}
          </div>
        )}

        {nav.map((group, gi) => {
          const sectionActive = group.items.some(i => location.pathname === i.url);
          return (
            <SidebarGroup key={gi} className={gi > 0 ? "mt-1" : ""}>
              {group.section && (
                <SidebarGroupLabel
                  className="t-label px-4 py-2"
                  style={{ color: `hsl(var(${group.cssVar || "--muted-foreground"}))` }}
                >
                  {collapsed ? group.section.charAt(0) : group.section}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const active = location.pathname === item.url;
                    const catColor = group.cssVar || "--primary";
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            className={`text-[13px] transition-all duration-150 rounded-lg px-3 py-2 relative group ${
                              active
                                ? "text-foreground font-medium"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            activeClassName="text-foreground font-medium"
                            style={active ? {
                              backgroundColor: `hsl(var(${catColor}) / 0.08)`,
                            } : undefined}
                          >
                            {active && (
                              <span
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                                style={{
                                  backgroundColor: `hsl(var(${catColor}))`,
                                  boxShadow: `0 0 8px hsl(var(${catColor}) / 0.6)`,
                                }}
                              />
                            )}
                            <item.icon className="mr-2.5 h-4 w-4 shrink-0 transition-colors" style={active ? { color: `hsl(var(${catColor}))` } : undefined} />
                            {!collapsed && <span className="truncate">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        {/* Bottom section */}
        <div className="mt-auto pt-3 px-3 border-t border-border/30 space-y-1">
          {!isConnected && !collapsed && (
            <button
              onClick={() => { localStorage.removeItem("demo_mode"); navigate("/"); }}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Youtube className="h-4 w-4" />
              Connect YouTube
            </button>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
