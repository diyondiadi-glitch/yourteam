import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { storeToken } from "@/lib/youtube-auth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    async function handleCallback() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const providerToken = data.session?.provider_token;
        if (providerToken) {
          storeToken(providerToken);
          navigate("/dashboard", { replace: true });
        } else {
          setStatus("No provider token received. Please try again.");
          setTimeout(() => navigate("/", { replace: true }), 2000);
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setStatus("Authentication failed. Redirecting...");
        setTimeout(() => navigate("/", { replace: true }), 2000);
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">{status}</p>
    </div>
  );
}
