import { ReactNode } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import AIStatusDot from "@/components/AIStatusDot";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
            <div className="flex items-center">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              <span className="ml-3 text-sm font-semibold gradient-text">CreatorBrain</span>
            </div>
            <AIStatusDot />
          </header>
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
