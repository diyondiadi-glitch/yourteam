import { supabase } from "./supabase";

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "openid email profile",
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
  supabase.auth.signOut();
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
