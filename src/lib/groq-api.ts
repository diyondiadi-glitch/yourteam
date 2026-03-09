import { callAI, streamAI, parseJsonSafely } from "./ai-service";

export const callGroq = callAI;
export const streamGroq = streamAI;
export const parseJsonFromResponse = parseJsonSafely;

export async function generateVerdict(channelData: {
  title: string;
  subscriberCount: number;
  recentVideos: { title: string; viewCount: number; publishedAt: string }[];
}): Promise<string> {
  const videoSummary = channelData.recentVideos
    .map((v) => `"${v.title}" (${v.viewCount} views, ${v.publishedAt})`)
    .join("\n");

  return callAI(
    "You are a YouTube growth strategist. Given channel data, provide ONE specific, actionable priority for today in 1-2 sentences. Be specific about what to do and why based on the data. No fluff.",
    `Channel: ${channelData.title}\nSubscribers: ${channelData.subscriberCount}\n\nRecent videos:\n${videoSummary}\n\nWhat is this creator's #1 priority today?`
  );
}
