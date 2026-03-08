import { supabase } from "./supabase";

const YT_SCOPES = "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly";

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: YT_SCOPES,
      },
    });
    if (error) {
      console.error("OAuth error:", error);
      return { error: "Google sign-in is not configured yet. Please try Demo Mode to explore the app!" };
    }
    return { error: null };
  } catch (err: any) {
    console.error("Sign-in error:", err);
    return { error: "Could not connect to Google. Please try Demo Mode to explore the app!" };
  }
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
  return !!getToken() || localStorage.getItem("demo_mode") === "true";
}
