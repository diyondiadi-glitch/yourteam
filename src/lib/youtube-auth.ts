const GOOGLE_CLIENT_ID = "840901451914-65kd836keuut8vjrq8jqkcsiuhtcs2u1.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";
const REDIRECT_URI = "https://yourteam.lovable.app/auth/callback";
const SCOPES = "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly";

export function getRedirectURI(): string {
  return REDIRECT_URI;
}

export function getGoogleOAuthURL(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
  });
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  console.log("🔑 OAuth URL:", url);
  console.log("🔑 Redirect URI:", REDIRECT_URI);
  return url;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Token exchange failed:", error);
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

export function storeToken(token: string) {
  localStorage.setItem("yt_access_token", token);
}

export function getToken(): string | null {
  return localStorage.getItem("yt_access_token");
}

export function clearToken() {
  localStorage.removeItem("yt_access_token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
