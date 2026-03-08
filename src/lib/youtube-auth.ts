const GOOGLE_CLIENT_ID = "840901451914-65kd836keuut8vjrq8jqkcsiuhtcs2u1.apps.googleusercontent.com";
const SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
].join(" ");

export function getRedirectURI(): string {
  return `${window.location.origin}/auth/callback`;
}

export function getGoogleOAuthURL(): string {
  const redirectUri = getRedirectURI();
  console.log("🔑 OAuth Redirect URI (add this to Google Cloud Console):", redirectUri);
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: SCOPES,
    access_type: "online",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function extractTokenFromHash(hash: string): string | null {
  const params = new URLSearchParams(hash.replace("#", ""));
  return params.get("access_token");
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
