import { isDemoMode } from "@/lib/youtube-api";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Youtube } from "lucide-react";

export default function DemoBanner() {
  const navigate = useNavigate();
  if (!isDemoMode()) return null;

  return (
    <div className="rounded-xl border-2 border-primary bg-primary/10 px-5 py-3 flex items-center justify-between gap-4 mb-6">
      <p className="text-sm font-semibold">
        👋 You are viewing demo data. Connect your YouTube channel to see your real insights.
      </p>
      <Button
        size="sm"
        className="shrink-0"
        onClick={() => {
          localStorage.removeItem("demo_mode");
          navigate("/");
        }}
      >
        <Youtube className="mr-2 h-4 w-4" /> Connect Channel
      </Button>
    </div>
  );
}
