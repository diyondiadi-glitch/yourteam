import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    async function handleCallback() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.provider_token) {
          localStorage.setItem("yt_access_token", session.provider_token);
          window.location.href = "/dashboard";
        } else {
          setStatus("No provider token received. Please try again.");
          setTimeout(() => { window.location.href = "/"; }, 2000);
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setStatus("Authentication failed. Redirecting...");
        setTimeout(() => { window.location.href = "/"; }, 2000);
      }
    }
    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">{status}</p>
    </div>
  );
}
