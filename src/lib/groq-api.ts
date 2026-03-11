import { callAI, parseJsonSafely } from "@/lib/ai-service";
export const callGroq = callAI;
export const parseJsonFromResponse = parseJsonSafely;
export async function generateVerdict(channel: { title: string; subscriberCount: number; recentVideos: { title: string; viewCount: number; publishedAt: string }[] }): Promise<string> {
  return callAI(
    "You are a YouTube growth expert. Give ONE specific actionable insight in 2 sentences max. No fluff.",
    `Channel: ${channel.title}, ${channel.subscriberCount} subs. Recent: ${channel.recentVideos.slice(0,5).map(v => `"${v.title}" (${v.viewCount} views)`).join(", ")}`
  );
}
