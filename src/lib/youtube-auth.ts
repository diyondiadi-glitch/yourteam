import { supabase } from "./supabase";

// Connection levels
export type ConnectionLevel = "guest" | "quick" | "full";

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
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
      return { error: "Google sign-in failed. Please try Demo Mode to explore the app!" };
    }

    return { error: null };
  } catch (err: any) {
    console.error("Sign-in error:", err);
    return { error: "Could not connect to Google. Please try Demo Mode!" };
  }
}

export function storeToken(token: string) {
  localStorage.setItem("yt_access_token", token);
  localStorage.setItem("connection_level", "full");
}

export function getToken(): string | null {
  return localStorage.getItem("yt_access_token");
}

export function clearToken() {
  localStorage.removeItem("yt_access_token");
  localStorage.removeItem("yt_channel_data");
  localStorage.removeItem("yt_videos");
  localStorage.removeItem("yt_channel_id");
  localStorage.removeItem("user_email");
  localStorage.removeItem("demo_mode");
  localStorage.removeItem("connection_level");
  supabase.auth.signOut();
}

export function setConnectionLevel(level: ConnectionLevel) {
  localStorage.setItem("connection_level", level);
}

export function getConnectionLevel(): ConnectionLevel {
  const level = localStorage.getItem("connection_level");
  if (level === "full" || level === "quick") return level;
  if (localStorage.getItem("demo_mode") === "true") return "guest";
  if (localStorage.getItem("yt_channel_id")) return "quick";
  if (getToken()) return "full";
  return "guest";
}

export function isAuthenticated(): boolean {
  return !!getToken() || localStorage.getItem("demo_mode") === "true" || !!localStorage.getItem("yt_channel_id");
}

export function hasChannelConnected(): boolean {
  return !!localStorage.getItem("yt_channel_id") || localStorage.getItem("demo_mode") === "true";
}

export function needsOnboarding(): boolean {
  const hasAuth = !!getToken();
  const hasChannel = hasChannelConnected();
  return hasAuth && !hasChannel;
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
