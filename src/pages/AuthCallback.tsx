import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.provider_token) {
          localStorage.setItem("yt_access_token", session.provider_token);
          localStorage.setItem("yt_refresh_token", session.provider_refresh_token || "");
          localStorage.setItem("user_email", session.user?.email || "");
          navigate("/dashboard", { replace: true });
          return;
        }

        // Fallback: try getting token from URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        if (accessToken) {
          localStorage.setItem("yt_access_token", accessToken);
          navigate("/dashboard", { replace: true });
          return;
        }

        setStatus("No provider token received. Redirecting...");
        setTimeout(() => navigate("/?error=auth_failed", { replace: true }), 2000);
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setStatus("Authentication failed. Redirecting...");
        setTimeout(() => navigate("/", { replace: true }), 2000);
      }
    };
    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
