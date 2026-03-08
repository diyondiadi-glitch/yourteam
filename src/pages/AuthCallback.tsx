import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { extractTokenFromHash, storeToken, getRedirectURI } from "@/lib/youtube-auth";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Copy, CheckCircle } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const redirectUri = getRedirectURI();

  useEffect(() => {
    // Check for error in query params (Google redirects errors as query params)
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam);
      return;
    }

    // Check for token in hash (success case)
    const token = extractTokenFromHash(window.location.hash);
    if (token) {
      storeToken(token);
      navigate("/dashboard", { replace: true });
    } else if (!window.location.hash) {
      setError("redirect_uri_mismatch");
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
        <p className="text-muted-foreground">Connecting your channel...</p>
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
            Google requires you to whitelist the redirect URI in your Cloud Console.
          </p>
        </div>

        <div className="rounded-lg bg-secondary p-4 text-left space-y-3">
          <p className="text-sm font-semibold">Add this redirect URI to your Google Cloud Console:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-background rounded px-3 py-2 text-primary break-all">
              {redirectUri}
            </code>
            <Button variant="ghost-muted" size="icon" onClick={handleCopy} className="shrink-0">
              {copied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="text-left text-sm text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">Steps:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener" className="text-primary underline">Google Cloud Console → Credentials</a></li>
            <li>Click your OAuth 2.0 Client ID</li>
            <li>Under "Authorized redirect URIs", add the URI above</li>
            <li>Under "Authorized JavaScript origins", add: <code className="text-primary">{window.location.origin}</code></li>
            <li>Click Save, then try connecting again</li>
          </ol>
        </div>

        <Button variant="hero" className="w-full rounded-xl" onClick={() => navigate("/")}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
