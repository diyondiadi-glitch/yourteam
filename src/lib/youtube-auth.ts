import { supabase } from "./supabase";

const YT_SCOPES = "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly";

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      scopes: YT_SCOPES,
      redirectTo: window.location.origin + "/auth/callback",
    },
  });
  if (error) throw error;
}

export function storeToken(token: string) {
  localStorage.setItem("yt_access_token", token);
}

export function getToken(): string | null {
  return localStorage.getItem("yt_access_token");
}

export function clearToken() {
  localStorage.removeItem("yt_access_token");
  supabase.auth.signOut();
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
