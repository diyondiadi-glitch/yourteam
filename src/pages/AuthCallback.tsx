import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { extractTokenFromHash, storeToken } from "@/lib/youtube-auth";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = extractTokenFromHash(window.location.hash);
    if (token) {
      storeToken(token);
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Connecting your channel...</p>
    </div>
  );
}
