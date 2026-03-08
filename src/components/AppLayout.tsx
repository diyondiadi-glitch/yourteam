import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModeSwitcher, { type ModeId } from "@/components/ModeSwitcher";
import ContextSidebar from "@/components/ContextSidebar";
import { isAuthenticated } from "@/lib/youtube-auth";

export default function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const [mode, setMode] = useState<ModeId>("diagnose");

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/", { replace: true });
    } else {
      setChecked(true);
    }
  }, [navigate]);

  if (!checked) return null;

  return (
    <div className="min-h-screen flex flex-col w-full">
      <ModeSwitcher onModeChange={setMode} />
      <div className="flex-1 flex min-h-0">
        <ContextSidebar mode={mode} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
