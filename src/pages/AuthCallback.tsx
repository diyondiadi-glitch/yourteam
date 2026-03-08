import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.setItem("yt_access_token", session.access_token || "authenticated");
          localStorage.setItem("user_email", session.user?.email || "");
          navigate("/dashboard", { replace: true });
          return;
        }

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        if (accessToken) {
          localStorage.setItem("yt_access_token", accessToken);
          navigate("/dashboard", { replace: true });
          return;
        }

        navigate("/?error=auth_failed", { replace: true });
      } catch {
        navigate("/?error=auth_failed", { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}
