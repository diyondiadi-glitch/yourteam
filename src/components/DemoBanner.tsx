import { useState } from "react";
import { isDemoMode } from "@/lib/youtube-api";
import { useNavigate } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";

export default function DemoBanner() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  if (!isDemoMode() || dismissed) return null;

  return (
    <div className="demo-banner flex items-center justify-between px-5 rounded-none -mx-6 md:-mx-8 -mt-6 md:-mt-8 mb-6">
      <p className="text-sm font-bold">
        ⚡ You're viewing Alex Creates demo data — Connect your YouTube to see YOUR real insights
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            localStorage.removeItem("demo_mode");
            navigate("/");
          }}
          className="flex items-center gap-1.5 bg-black text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-black/80 transition-colors"
        >
          Connect YouTube <ArrowRight className="h-3 w-3" />
        </button>
        <button onClick={() => setDismissed(true)} className="hover:opacity-70 transition-opacity">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
