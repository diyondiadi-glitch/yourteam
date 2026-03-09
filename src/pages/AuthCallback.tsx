import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import OnboardingModal from "@/components/OnboardingModal";
import { hasChannelConnected } from "@/lib/youtube-auth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.setItem("yt_access_token", session.access_token || "authenticated");
          localStorage.setItem("user_email", session.user?.email || "");
          
          // Check if user already has a channel connected
          if (hasChannelConnected()) {
            navigate("/dashboard", { replace: true });
          } else {
            // Show onboarding to connect channel
            setShowOnboarding(true);
            setChecking(false);
          }
          return;
        }

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        if (accessToken) {
          localStorage.setItem("yt_access_token", accessToken);
          if (hasChannelConnected()) {
            navigate("/dashboard", { replace: true });
          } else {
            setShowOnboarding(true);
            setChecking(false);
          }
          return;
        }

        navigate("/?error=auth_failed", { replace: true });
      } catch {
        navigate("/?error=auth_failed", { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  function handleOnboardingComplete() {
    navigate("/dashboard", { replace: true });
  }

  if (showOnboarding) {
    return <OnboardingModal onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}
