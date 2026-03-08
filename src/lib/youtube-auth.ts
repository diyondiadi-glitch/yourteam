import { supabase } from "./supabase";

const YT_SCOPES = "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly";

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        skipBrowserRedirect: true,
        scopes: YT_SCOPES,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("OAuth error:", error);
      return { error: "Google sign-in is not configured yet. Please try Demo Mode to explore the app!" };
    }

    if (data?.url) {
      // Open popup for OAuth
      const popup = window.open(data.url, "oauth", "width=500,height=600,scrollbars=yes");
      
      return new Promise((resolve) => {
        const interval = setInterval(async () => {
          try {
            if (popup?.closed) {
              clearInterval(interval);
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.provider_token) {
                localStorage.setItem("yt_access_token", session.provider_token);
                localStorage.setItem("yt_refresh_token", session.provider_refresh_token || "");
                localStorage.setItem("user_email", session.user?.email || "");
                resolve({ error: null });
              } else {
                resolve({ error: "No token received. Please try Demo Mode." });
              }
            }
          } catch {
            clearInterval(interval);
            resolve({ error: "Authentication failed. Please try Demo Mode." });
          }
        }, 500);

        // Timeout after 2 minutes
        setTimeout(() => {
          clearInterval(interval);
          if (!popup?.closed) popup?.close();
          resolve({ error: "Authentication timed out. Please try Demo Mode." });
        }, 120000);
      });
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
