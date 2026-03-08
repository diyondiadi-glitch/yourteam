import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeCodeForToken, storeToken, getRedirectURI } from "@/lib/youtube-auth";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Copy, CheckCircle } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Processing...");
  const [copied, setCopied] = useState(false);
  const redirectUri = getRedirectURI();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam);
      return;
    }

    const code = searchParams.get("code");
    if (code) {
      setStatus("Exchanging code for token...");
      exchangeCodeForToken(code)
        .then((token) => {
          storeToken(token);
          navigate("/dashboard", { replace: true });
        })
        .catch((err) => {
          console.error("OAuth error:", err);
          setError(err.message || "token_exchange_failed");
        });
    } else {
      setError("No authorization code received");
    }
  }, [navigate, searchParams]);

  function handleCopy() {
    navigator.clipboard.writeText(redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{status}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-lg w-full rounded-xl border border-border bg-card p-8 text-center space-y-6">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Almost there! One quick fix needed</h1>
          <p className="text-muted-foreground">
            {error.includes("token_exchange") 
              ? "The token exchange failed. Please try again."
              : "Google requires you to whitelist the redirect URI in your Cloud Console."}
          </p>
        </div>
        <div className="rounded-lg bg-secondary p-4 text-left space-y-3">
          <p className="text-sm font-semibold">Redirect URI:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-background rounded px-3 py-2 text-primary break-all">
              {redirectUri}
            </code>
            <Button variant="ghost" size="icon" onClick={handleCopy} className="shrink-0">
              {copied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <Button className="w-full rounded-xl" onClick={() => navigate("/")}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
