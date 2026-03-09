import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { storeToken, isAuthenticated } from "@/lib/youtube-auth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError("Authentication failed. Please try again.");
        setTimeout(() => navigate("/?error=auth_failed"), 2000);
        return;
      }

      const accessToken = session.provider_token;
      if (accessToken) {
        storeToken(accessToken);
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError("Something went wrong. Redirecting...");
      setTimeout(() => navigate("/"), 2000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {error ? (
          <p className="text-destructive">{error}</p>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Completing sign-in...</p>
          </>
        )}
      </div>
    </div>
  );
}
