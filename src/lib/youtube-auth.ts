import { supabase } from "./supabase";

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "openid email profile https://www.googleapis.com/auth/youtube.readonly",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("OAuth error:", error);
      return { error: "Google sign-in failed. Please try again." };
    }

    return { error: null };
  } catch (err: any) {
    console.error("Sign-in error:", err);
    return { error: "Could not connect to Google." };
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
  localStorage.removeItem("yt_channel_data");
  localStorage.removeItem("channel_connected");
  localStorage.removeItem("channel_id");
  localStorage.removeItem("user_email");
  supabase.auth.signOut();
}

export function isAuthenticated(): boolean {
  return localStorage.getItem("channel_connected") === "true";
}

// Features that require full OAuth (private analytics)
export const FULL_CONNECT_FEATURES = [
  "/diagnose/algorithm-intelligence",
  "/analyze/war-room",
  "/analyze/best-upload-time",
  "/analyze/subscriber-converter",
  "/diagnose/growth-intelligence",
  "/grow/sponsor",
];

export function requiresFullConnect(path: string): boolean {
  return FULL_CONNECT_FEATURES.some(f => path.startsWith(f));
}
