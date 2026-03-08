import { getToken } from "./youtube-auth";
import { getStoredChannel, getStoredVideos } from "./youtube-public-api";

const YT_BASE = "https://www.googleapis.com/youtube/v3";
const YT_API_KEY = "AIzaSyAz-3Zhkq7DaeodW4s_2zTXW_zHvtzqXzc";

// ── Demo / mock mode ────────────────────────────────────────────────
export function isDemoMode(): boolean {
  return localStorage.getItem("demo_mode") === "true";
}

export function enableDemoMode() {
  localStorage.setItem("demo_mode", "true");
}

export function disableDemoMode() {
  localStorage.removeItem("demo_mode");
}

function useMock(): boolean {
  // If we have stored real channel data from public API, use that instead of mock
  const storedChannel = getStoredChannel();
  if (storedChannel && !isDemoMode()) return false;
  return !getToken() || isDemoMode();
}

// ── Mock data — "Alex Creates" channel ──────────────────────────────
const MOCK_CHANNEL: ChannelData = {
  id: "UCdemo_alexcreates",
  title: "Alex Creates",
  avatar: "https://ui-avatars.com/api/?name=AC&background=f59e0b&color=fff&size=88",
  subscriberCount: 24_700,
  viewCount: 180_000,
  videoCount: 86,
  customUrl: "@alexcreates",
};

const MOCK_VIDEOS: VideoData[] = [
  { id: "v1", title: "My 5 AM Morning Routine That Changed Everything", thumbnail: "https://picsum.photos/seed/ac1/320/180", viewCount: 32_400, likeCount: 1_800, commentCount: 247, publishedAt: "2026-02-28T14:00:00Z" },
  { id: "v2", title: "I Tried Every Productivity App So You Don't Have To", thumbnail: "https://picsum.photos/seed/ac2/320/180", viewCount: 28_100, likeCount: 1_520, commentCount: 198, publishedAt: "2026-02-21T16:00:00Z" },
  { id: "v3", title: "The $300 Desk Setup That Beats a $3000 One", thumbnail: "https://picsum.photos/seed/ac3/320/180", viewCount: 45_600, likeCount: 2_890, commentCount: 412, publishedAt: "2026-02-14T12:00:00Z" },
  { id: "v4", title: "Why Notion Is Killing Your Productivity (Use This Instead)", thumbnail: "https://picsum.photos/seed/ac4/320/180", viewCount: 19_200, likeCount: 980, commentCount: 134, publishedAt: "2026-02-07T10:00:00Z" },
  { id: "v5", title: "How I Automated 80% of My Work With AI Tools", thumbnail: "https://picsum.photos/seed/ac5/320/180", viewCount: 38_900, likeCount: 2_100, commentCount: 326, publishedAt: "2026-01-31T15:00:00Z" },
  { id: "v6", title: "The Minimalist Tech Stack for Content Creators", thumbnail: "https://picsum.photos/seed/ac6/320/180", viewCount: 15_800, likeCount: 890, commentCount: 102, publishedAt: "2026-01-24T11:00:00Z" },
  { id: "v7", title: "I Deleted Social Media for 30 Days — Here's What Happened", thumbnail: "https://picsum.photos/seed/ac7/320/180", viewCount: 52_300, likeCount: 3_200, commentCount: 567, publishedAt: "2026-01-17T09:00:00Z" },
  { id: "v8", title: "Building a Second Brain: My Complete System", thumbnail: "https://picsum.photos/seed/ac8/320/180", viewCount: 22_700, likeCount: 1_340, commentCount: 189, publishedAt: "2026-01-10T14:00:00Z" },
  { id: "v9", title: "The 3 Habits That 10x'd My Output", thumbnail: "https://picsum.photos/seed/ac9/320/180", viewCount: 27_500, likeCount: 1_600, commentCount: 213, publishedAt: "2026-01-03T16:00:00Z" },
  { id: "v10", title: "Best Budget Tech for New YouTubers in 2026", thumbnail: "https://picsum.photos/seed/ac10/320/180", viewCount: 34_100, likeCount: 1_950, commentCount: 278, publishedAt: "2025-12-27T13:00:00Z" },
  { id: "v11", title: "Why I Wake Up at 4:30 AM (Not What You Think)", thumbnail: "https://picsum.photos/seed/ac11/320/180", viewCount: 41_200, likeCount: 2_400, commentCount: 345, publishedAt: "2025-12-20T10:00:00Z" },
  { id: "v12", title: "The ONE Tool That Replaced 10 Apps For Me", thumbnail: "https://picsum.photos/seed/ac12/320/180", viewCount: 18_600, likeCount: 1_020, commentCount: 156, publishedAt: "2025-12-13T12:00:00Z" },
  { id: "v13", title: "How to Focus for 8+ Hours a Day (Science-Based)", thumbnail: "https://picsum.photos/seed/ac13/320/180", viewCount: 29_800, likeCount: 1_700, commentCount: 234, publishedAt: "2025-12-06T15:00:00Z" },
  { id: "v14", title: "iPad vs Laptop for Productivity — The Real Answer", thumbnail: "https://picsum.photos/seed/ac14/320/180", viewCount: 16_400, likeCount: 920, commentCount: 118, publishedAt: "2025-11-29T11:00:00Z" },
  { id: "v15", title: "How I Grew from 0 to 20K Subs in 8 Months", thumbnail: "https://picsum.photos/seed/ac15/320/180", viewCount: 48_900, likeCount: 3_100, commentCount: 489, publishedAt: "2025-11-22T14:00:00Z" },
  { id: "v16", title: "My Exact Workflow for Making YouTube Videos", thumbnail: "https://picsum.photos/seed/ac16/320/180", viewCount: 21_300, likeCount: 1_250, commentCount: 178, publishedAt: "2025-11-15T10:00:00Z" },
  { id: "v17", title: "Stop Multitasking: The Deep Work Method That Works", thumbnail: "https://picsum.photos/seed/ac17/320/180", viewCount: 25_600, likeCount: 1_480, commentCount: 201, publishedAt: "2025-11-08T12:00:00Z" },
  { id: "v18", title: "I Tested 7 AI Writing Tools — Winner Shocked Me", thumbnail: "https://picsum.photos/seed/ac18/320/180", viewCount: 36_700, likeCount: 2_050, commentCount: 312, publishedAt: "2025-11-01T16:00:00Z" },
  { id: "v19", title: "Ergonomic Setup Guide Under $500", thumbnail: "https://picsum.photos/seed/ac19/320/180", viewCount: 13_900, likeCount: 780, commentCount: 94, publishedAt: "2025-10-25T09:00:00Z" },
  { id: "v20", title: "The Dark Side of Hustle Culture (My Honest Take)", thumbnail: "https://picsum.photos/seed/ac20/320/180", viewCount: 31_800, likeCount: 1_860, commentCount: 367, publishedAt: "2025-10-18T13:00:00Z" },
];

const MOCK_COMMENTS: string[] = [
  "Can you do a video on time-blocking with Google Calendar?",
  "This was exactly what I needed, thank you Alex!",
  "Been watching since you had 500 subs, so proud of your growth!",
  "Would love a comparison of Obsidian vs Notion for students",
  "The editing quality keeps getting better every video 🔥",
  "I implemented your morning routine and my productivity doubled",
  "More videos on AI tools for creators please!",
  "You should collab with Ali Abdaal, your styles are so similar",
  "How do you stay consistent with uploads while working full time?",
  "Your desk setup video convinced me to go minimalist",
  "Can you review the new Remarkable tablet?",
  "This video felt a bit short, would love more depth next time",
  "The tip about batching content at 6:42 was incredible",
  "Do a video on how you edit your videos!",
  "What microphone do you use? Audio quality is so clean",
  "I disagree about Notion being bad, it works great for teams",
  "Your productivity system series is the best on YouTube",
  "Please do a what's on my phone video!",
  "The intro music change is fire, what track is that?",
  "Would you ever do a course on building a second brain?",
];

const MOCK_COMPETITOR: ChannelData = {
  id: "UCcomp_techflow",
  title: "TechFlow Daily",
  avatar: "https://ui-avatars.com/api/?name=TF&background=3b82f6&color=fff&size=88",
  subscriberCount: 67_400,
  viewCount: 890_000,
  videoCount: 215,
  customUrl: "@techflowdaily",
};

const MOCK_COMPETITOR_VIDEOS: VideoData[] = [
  { id: "cv1", title: "I Replaced My Entire Workflow With ChatGPT", thumbnail: "https://picsum.photos/seed/cv1/320/180", viewCount: 89_200, likeCount: 4_100, commentCount: 523, publishedAt: "2026-02-25T14:00:00Z" },
  { id: "cv2", title: "Why Most Productivity Advice Is Wrong", thumbnail: "https://picsum.photos/seed/cv2/320/180", viewCount: 45_600, likeCount: 2_300, commentCount: 312, publishedAt: "2026-02-18T10:00:00Z" },
  { id: "cv3", title: "The 5 Apps That Run My Life in 2026", thumbnail: "https://picsum.photos/seed/cv3/320/180", viewCount: 67_800, likeCount: 3_200, commentCount: 401, publishedAt: "2026-02-11T16:00:00Z" },
  { id: "cv4", title: "How to Build an Audience From Zero", thumbnail: "https://picsum.photos/seed/cv4/320/180", viewCount: 34_100, likeCount: 1_800, commentCount: 234, publishedAt: "2026-02-04T12:00:00Z" },
  { id: "cv5", title: "$50 vs $500 vs $5000 Camera for YouTube", thumbnail: "https://picsum.photos/seed/cv5/320/180", viewCount: 112_000, likeCount: 5_600, commentCount: 678, publishedAt: "2026-01-28T15:00:00Z" },
  { id: "cv6", title: "I Tried Being a Minimalist for 30 Days", thumbnail: "https://picsum.photos/seed/cv6/320/180", viewCount: 28_900, likeCount: 1_500, commentCount: 198, publishedAt: "2026-01-21T11:00:00Z" },
  { id: "cv7", title: "Stop Using These Apps Immediately", thumbnail: "https://picsum.photos/seed/cv7/320/180", viewCount: 78_400, likeCount: 3_800, commentCount: 456, publishedAt: "2026-01-14T09:00:00Z" },
  { id: "cv8", title: "The Truth About Making Money Online", thumbnail: "https://picsum.photos/seed/cv8/320/180", viewCount: 56_200, likeCount: 2_900, commentCount: 367, publishedAt: "2026-01-07T14:00:00Z" },
  { id: "cv9", title: "My 2026 Content Strategy Revealed", thumbnail: "https://picsum.photos/seed/cv9/320/180", viewCount: 21_300, likeCount: 1_100, commentCount: 145, publishedAt: "2025-12-31T16:00:00Z" },
  { id: "cv10", title: "Why I Switched From Mac to Linux", thumbnail: "https://picsum.photos/seed/cv10/320/180", viewCount: 41_700, likeCount: 2_100, commentCount: 289, publishedAt: "2025-12-24T13:00:00Z" },
];

// ── Real API fetch ──────────────────────────────────────────────────
async function ytFetch(endpoint: string, params: Record<string, string> = {}) {
  const token = getToken();
  const url = new URL(`${YT_BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token && token !== "authenticated") {
    headers.Authorization = `Bearer ${token}`;
  } else {
    url.searchParams.set("key", YT_API_KEY);
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  return res.json();
}

// ── Types ───────────────────────────────────────────────────────────
export interface ChannelData {
  id: string;
  title: string;
  avatar: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  customUrl: string;
}

export interface VideoData {
  id: string;
  title: string;
  thumbnail: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
}

// ── Exported functions (mock-aware) ─────────────────────────────────
export async function getMyChannel(): Promise<ChannelData> {
  // Check stored real data first
  const stored = getStoredChannel();
  if (stored && !isDemoMode()) {
    return {
      id: stored.id,
      title: stored.title,
      avatar: stored.avatar,
      subscriberCount: stored.subscriberCount,
      viewCount: stored.viewCount,
      videoCount: stored.videoCount,
      customUrl: stored.customUrl,
    };
  }

  if (useMock()) return { ...MOCK_CHANNEL };

  const data = await ytFetch("channels", { part: "snippet,statistics", mine: "true" });
  const ch = data.items?.[0];
  if (!ch) throw new Error("No channel found");
  return {
    id: ch.id,
    title: ch.snippet.title,
    avatar: ch.snippet.thumbnails?.default?.url || "",
    subscriberCount: Number(ch.statistics.subscriberCount),
    viewCount: Number(ch.statistics.viewCount),
    videoCount: Number(ch.statistics.videoCount),
    customUrl: ch.snippet.customUrl || "",
  };
}

export async function getRecentVideos(channelId: string, maxResults = 6): Promise<VideoData[]> {
  // Check stored real data first
  const storedVids = getStoredVideos();
  if (storedVids.length > 0 && !isDemoMode()) {
    return storedVids.slice(0, maxResults).map(v => ({
      id: v.id,
      title: v.title,
      thumbnail: v.thumbnail,
      viewCount: v.viewCount,
      likeCount: v.likeCount,
      commentCount: v.commentCount,
      publishedAt: v.publishedAt,
    }));
  }

  if (useMock()) return MOCK_VIDEOS.slice(0, maxResults).map(v => ({ ...v }));

  const chData = await ytFetch("channels", { part: "contentDetails", id: channelId });
  const uploadPlaylistId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadPlaylistId) return [];

  const plData = await ytFetch("playlistItems", { part: "snippet", playlistId: uploadPlaylistId, maxResults: String(maxResults) });
  const videoIds = plData.items?.map((item: any) => item.snippet.resourceId.videoId) || [];
  if (videoIds.length === 0) return [];

  const vidData = await ytFetch("videos", { part: "snippet,statistics", id: videoIds.join(",") });
  return vidData.items.map((v: any) => ({
    id: v.id,
    title: v.snippet.title,
    thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || "",
    viewCount: Number(v.statistics.viewCount || 0),
    likeCount: Number(v.statistics.likeCount || 0),
    commentCount: Number(v.statistics.commentCount || 0),
    publishedAt: v.snippet.publishedAt,
  }));
}

export async function getVideoComments(videoId: string, maxResults = 50): Promise<string[]> {
  if (useMock()) return MOCK_COMMENTS.slice(0, maxResults);

  try {
    const data = await ytFetch("commentThreads", { part: "snippet", videoId, maxResults: String(maxResults), order: "relevance" });
    return data.items?.map((item: any) => item.snippet.topLevelComment.snippet.textDisplay) || [];
  } catch {
    return [];
  }
}

export async function getChannelById(channelId: string): Promise<ChannelData | null> {
  if (useMock()) return { ...MOCK_COMPETITOR };

  try {
    const data = await ytFetch("channels", { part: "snippet,statistics", id: channelId });
    const ch = data.items?.[0];
    if (!ch) return null;
    return {
      id: ch.id,
      title: ch.snippet.title,
      avatar: ch.snippet.thumbnails?.default?.url || "",
      subscriberCount: Number(ch.statistics.subscriberCount),
      viewCount: Number(ch.statistics.viewCount),
      videoCount: Number(ch.statistics.videoCount),
      customUrl: ch.snippet.customUrl || "",
    };
  } catch {
    return null;
  }
}

export async function searchChannel(query: string): Promise<string | null> {
  if (useMock()) return "UCcomp_techflow";

  try {
    const data = await ytFetch("search", { part: "snippet", q: query, type: "channel", maxResults: "1" });
    return data.items?.[0]?.snippet?.channelId || null;
  } catch {
    return null;
  }
}

export async function getChannelVideos(channelId: string, maxResults = 20): Promise<VideoData[]> {
  if (useMock()) return MOCK_COMPETITOR_VIDEOS.slice(0, maxResults).map(v => ({ ...v }));
  return getRecentVideos(channelId, maxResults);
}

// ── Utility functions ───────────────────────────────────────────────
export function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export function calcChannelScore(videos: VideoData[], subscriberCount: number): number {
  if (videos.length === 0) return 0;
  const avgViews = videos.reduce((s, v) => s + v.viewCount, 0) / videos.length;
  const avgEngagement = videos.reduce((s, v) => s + v.likeCount + v.commentCount, 0) / videos.length;
  const viewRatio = Math.min(avgViews / Math.max(subscriberCount, 1), 1) * 40;
  const engagementScore = Math.min((avgEngagement / Math.max(avgViews, 1)) * 100, 1) * 30;
  const consistencyScore = Math.min(videos.length / 6, 1) * 30;
  return Math.round(viewRatio + engagementScore + consistencyScore);
}

export function getChannelContext(channel: ChannelData, videos: VideoData[]): string {
  const avgViews = videos.length > 0
    ? Math.round(videos.reduce((s, v) => s + v.viewCount, 0) / videos.length)
    : 0;
  const videoSummary = videos
    .map(v => `"${v.title}" - ${v.viewCount} views, ${v.likeCount} likes, ${v.commentCount} comments, published ${v.publishedAt}`)
    .join("\n");

  return `Channel: ${channel.title}
Subscribers: ${formatCount(channel.subscriberCount)}
Total Views: ${formatCount(channel.viewCount)}
Total Videos: ${channel.videoCount}
Average Views per Video: ${formatCount(avgViews)}

Recent Videos:
${videoSummary}`;
}
