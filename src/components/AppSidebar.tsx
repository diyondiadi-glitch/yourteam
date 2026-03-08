import {
  Home, Search, Target, PenTool, BarChart3, DollarSign, Bot,
  AlertTriangle, HeartPulse, TrendingDown, Map,
  Lightbulb, CheckCircle, Clock, Skull, Eye,
  Timer, FileText, Type, Image, Sparkles,
  Activity, GitCompare, Star, Ghost,
  MessageSquare, Copy, Users, BadgeDollarSign, Battery,
  Wand2, Flame, Palette, Radio, Handshake,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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
  { section: null, items: [
    { title: "Dashboard", url: "/dashboard", icon: Home },
  ]},
  { section: "🔍 DIAGNOSE", items: [
    { title: "Why Did My Video Die?", url: "/diagnose/video-death", icon: AlertTriangle },
    { title: "Channel Roast Mode", url: "/diagnose/roast", icon: Flame },
    { title: "Channel Health Check", url: "/diagnose/health-check", icon: HeartPulse },
    { title: "Growth Plateau Breaker", url: "/diagnose/plateau", icon: TrendingDown },
    { title: "Algorithm Map", url: "/diagnose/algorithm-map", icon: Map },
  ]},
  { section: "🎯 STRATEGY", items: [
    { title: "What Should I Make Next?", url: "/strategy/next-video", icon: Lightbulb },
    { title: "Trend News Feed", url: "/strategy/trend-radar", icon: Radio },
    { title: "Idea Validator", url: "/strategy/idea-validator", icon: CheckCircle },
    { title: "Viral Window Predictor", url: "/strategy/viral-window", icon: Clock },
    { title: "Topic Graveyard", url: "/strategy/topic-graveyard", icon: Skull },
    { title: "Competitor Spy", url: "/strategy/competitor-spy", icon: Eye },
  ]},
  { section: "✍️ CREATE", items: [
    { title: "60-Min Video Machine", url: "/create/video-machine", icon: Timer },
    { title: "Thumbnail A/B Generator", url: "/create/thumbnail-lab", icon: Palette },
    { title: "Hook Score", url: "/create/hook-score", icon: Sparkles },
    { title: "Title Split Tester", url: "/create/title-tester", icon: Type },
    { title: "Thumbnail Advisor", url: "/create/thumbnail", icon: Image },
    { title: "Script Improver", url: "/create/script-improver", icon: Wand2 },
  ]},
  { section: "📊 ANALYZE", items: [
    { title: "First Hour War Room", url: "/analyze/war-room", icon: Activity },
    { title: "Shorts vs Longs Report", url: "/analyze/shorts-vs-longs", icon: GitCompare },
    { title: "Outlier Video Spotter", url: "/analyze/outliers", icon: Star },
    { title: "Dead Video Revival", url: "/analyze/revival", icon: Ghost },
    { title: "Comment Gold Miner", url: "/analyze/comments", icon: MessageSquare },
  ]},
  { section: "💰 GROW", items: [
    { title: "Recreate Your Best Video", url: "/grow/recreate-best", icon: Copy },
    { title: "Collab Matcher", url: "/grow/collab-matcher", icon: Handshake },
    { title: "Audience Persona Builder", url: "/grow/persona", icon: Users },
    { title: "Sponsor Readiness Score", url: "/grow/sponsor", icon: BadgeDollarSign },
    { title: "Burnout Recovery Mode", url: "/grow/burnout", icon: Battery },
  ]},
  { section: "🤖 AI COACH", items: [
    { title: "Personal AI Coach", url: "/coach", icon: Bot },
  ]},
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border sidebar-gradient">
      <SidebarContent className="scrollbar-thin py-2">
        {nav.map((group, gi) => (
          <SidebarGroup key={gi}>
            {group.section && (
              <SidebarGroupLabel className="section-label">
                {collapsed ? group.section.split(" ")[0] : group.section}
              </SidebarGroupLabel>
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
                          className={`text-sm transition-colors rounded-lg px-3 py-2 ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                          activeClassName="bg-primary/10 text-primary font-medium"
                        >
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
