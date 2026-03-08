import { getToken } from "./youtube-auth";

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
  return !getToken() || isDemoMode();
}

// ── Mock data ───────────────────────────────────────────────────────
const MOCK_CHANNEL: ChannelData = {
  id: "UCdemo123",
  title: "TechCreator Pro",
  avatar: "https://ui-avatars.com/api/?name=TC&background=6d28d9&color=fff&size=88",
  subscriberCount: 48200,
  viewCount: 3_740_000,
  videoCount: 127,
  customUrl: "@techcreatorpro",
};

const MOCK_VIDEOS: VideoData[] = [
  { id: "v1", title: "I Tried AI Coding Tools For 30 Days — Here's What Happened", thumbnail: "https://picsum.photos/seed/v1/320/180", viewCount: 184_000, likeCount: 9200, commentCount: 743, publishedAt: "2026-02-18T14:00:00Z" },
  { id: "v2", title: "The BEST Productivity Setup for Developers in 2026", thumbnail: "https://picsum.photos/seed/v2/320/180", viewCount: 97_500, likeCount: 5100, commentCount: 312, publishedAt: "2026-02-10T16:00:00Z" },
  { id: "v3", title: "Why I Quit My $200K Job to Make YouTube Videos", thumbnail: "https://picsum.photos/seed/v3/320/180", viewCount: 312_000, likeCount: 18400, commentCount: 1520, publishedAt: "2026-01-28T12:00:00Z" },
  { id: "v4", title: "5 VS Code Extensions You're Missing Out On", thumbnail: "https://picsum.photos/seed/v4/320/180", viewCount: 42_300, likeCount: 2100, commentCount: 189, publishedAt: "2026-01-20T10:00:00Z" },
  { id: "v5", title: "I Built a SaaS in 48 Hours — Full Breakdown", thumbnail: "https://picsum.photos/seed/v5/320/180", viewCount: 156_000, likeCount: 8700, commentCount: 634, publishedAt: "2026-01-12T15:00:00Z" },
  { id: "v6", title: "React vs Vue vs Svelte — The REAL Answer in 2026", thumbnail: "https://picsum.photos/seed/v6/320/180", viewCount: 78_200, likeCount: 3900, commentCount: 892, publishedAt: "2026-01-05T11:00:00Z" },
  { id: "v7", title: "How I Get 10x More Done With This One Trick", thumbnail: "https://picsum.photos/seed/v7/320/180", viewCount: 23_100, likeCount: 1200, commentCount: 98, publishedAt: "2025-12-28T09:00:00Z" },
  { id: "v8", title: "The Truth About Making Money on YouTube", thumbnail: "https://picsum.photos/seed/v8/320/180", viewCount: 201_000, likeCount: 12300, commentCount: 1100, publishedAt: "2025-12-20T14:00:00Z" },
  { id: "v9", title: "Building My Dream Home Office Setup", thumbnail: "https://picsum.photos/seed/v9/320/180", viewCount: 35_400, likeCount: 1800, commentCount: 156, publishedAt: "2025-12-15T16:00:00Z" },
  { id: "v10", title: "Why Every Developer Needs to Learn AI NOW", thumbnail: "https://picsum.photos/seed/v10/320/180", viewCount: 128_000, likeCount: 6400, commentCount: 478, publishedAt: "2025-12-08T13:00:00Z" },
  { id: "v11", title: "I Mass-Applied to 100 Tech Jobs — Results Shocked Me", thumbnail: "https://picsum.photos/seed/v11/320/180", viewCount: 89_300, likeCount: 4500, commentCount: 367, publishedAt: "2025-12-01T10:00:00Z" },
  { id: "v12", title: "Stop Using ChatGPT Wrong — Do This Instead", thumbnail: "https://picsum.photos/seed/v12/320/180", viewCount: 245_000, likeCount: 14200, commentCount: 1340, publishedAt: "2025-11-22T12:00:00Z" },
  { id: "v13", title: "My Honest Review of the M4 MacBook Pro", thumbnail: "https://picsum.photos/seed/v13/320/180", viewCount: 67_800, likeCount: 3400, commentCount: 289, publishedAt: "2025-11-15T15:00:00Z" },
  { id: "v14", title: "Linux vs Mac vs Windows for Coding in 2026", thumbnail: "https://picsum.photos/seed/v14/320/180", viewCount: 54_600, likeCount: 2700, commentCount: 721, publishedAt: "2025-11-08T11:00:00Z" },
  { id: "v15", title: "How I Hit 40K Subscribers in One Year", thumbnail: "https://picsum.photos/seed/v15/320/180", viewCount: 174_000, likeCount: 11200, commentCount: 890, publishedAt: "2025-11-01T14:00:00Z" },
  { id: "v16", title: "The Database No One Talks About (But Should)", thumbnail: "https://picsum.photos/seed/v16/320/180", viewCount: 31_200, likeCount: 1600, commentCount: 134, publishedAt: "2025-10-24T10:00:00Z" },
  { id: "v17", title: "Full Stack App Tutorial — Zero to Production", thumbnail: "https://picsum.photos/seed/v17/320/180", viewCount: 92_100, likeCount: 4800, commentCount: 256, publishedAt: "2025-10-16T12:00:00Z" },
  { id: "v18", title: "I Paid Fiverr Devs to Build My App — Disaster?", thumbnail: "https://picsum.photos/seed/v18/320/180", viewCount: 289_000, likeCount: 16100, commentCount: 1890, publishedAt: "2025-10-08T16:00:00Z" },
  { id: "v19", title: "Top 10 GitHub Repos You Need to Star", thumbnail: "https://picsum.photos/seed/v19/320/180", viewCount: 45_700, likeCount: 2300, commentCount: 178, publishedAt: "2025-10-01T09:00:00Z" },
  { id: "v20", title: "The Dark Side of Being a Tech YouTuber", thumbnail: "https://picsum.photos/seed/v20/320/180", viewCount: 162_000, likeCount: 9800, commentCount: 923, publishedAt: "2025-09-24T13:00:00Z" },
];

const MOCK_COMMENTS: string[] = [
  "Can you make a video on building a Chrome extension?",
  "This was so helpful, saved me hours of work!",
  "I've been following your channel since day 1 and the growth is incredible",
  "Please do a video comparing Supabase vs Firebase in 2026!",
  "The editing in this video is insane 🔥",
  "I tried your method and it actually worked, gained 200 subs in a week",
  "Would love to see more long-form tutorials like this",
  "Bro dropped this and disappeared lol, need more uploads",
  "How do you balance YouTube and your day job?",
  "Your advice on thumbnails completely changed my CTR",
  "Can you review my channel? I'm stuck at 1K subs",
  "This video felt rushed compared to your usual quality",
  "The tip about hooks at 4:32 was pure gold",
  "More collabs with other tech creators please!",
  "What camera and mic do you use? Audio quality is amazing",
  "I disagree with your take on AI replacing developers",
  "Your SaaS breakdown series is the best content on YouTube",
  "Please do a mass-unsubscribe challenge from bad advice channels",
  "The intro was way too long, almost clicked away",
  "You should make a course, I'd buy it instantly",
];

const MOCK_COMPETITOR: ChannelData = {
  id: "UCcomp456",
  title: "CodeMaster Daily",
  avatar: "https://ui-avatars.com/api/?name=CM&background=dc2626&color=fff&size=88",
  subscriberCount: 125_000,
  viewCount: 12_400_000,
  videoCount: 340,
  customUrl: "@codemasterdaily",
};

// ── Real API fetch ──────────────────────────────────────────────────
async function ytFetch(endpoint: string, params: Record<string, string> = {}) {
  const token = getToken();
  const url = new URL(`${YT_BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) {
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
  if (useMock()) return { ...MOCK_CHANNEL };

  const data = await ytFetch("channels", {
    part: "snippet,statistics",
    mine: "true",
  });
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
  if (useMock()) return MOCK_VIDEOS.slice(0, maxResults).map(v => ({ ...v }));

  const chData = await ytFetch("channels", {
    part: "contentDetails",
    id: channelId,
  });
  const uploadPlaylistId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadPlaylistId) return [];

  const plData = await ytFetch("playlistItems", {
    part: "snippet",
    playlistId: uploadPlaylistId,
    maxResults: String(maxResults),
  });
  const videoIds = plData.items?.map((item: any) => item.snippet.resourceId.videoId) || [];
  if (videoIds.length === 0) return [];

  const vidData = await ytFetch("videos", {
    part: "snippet,statistics",
    id: videoIds.join(","),
  });

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
    const data = await ytFetch("commentThreads", {
      part: "snippet",
      videoId,
      maxResults: String(maxResults),
      order: "relevance",
    });
    return data.items?.map((item: any) => item.snippet.topLevelComment.snippet.textDisplay) || [];
  } catch {
    return [];
  }
}

export async function getChannelById(channelId: string): Promise<ChannelData | null> {
  if (useMock()) return { ...MOCK_COMPETITOR };

  try {
    const data = await ytFetch("channels", {
      part: "snippet,statistics",
      id: channelId,
    });
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
  if (useMock()) return "UCcomp456";

  try {
    const data = await ytFetch("search", {
      part: "snippet",
      q: query,
      type: "channel",
      maxResults: "1",
    });
    return data.items?.[0]?.snippet?.channelId || null;
  } catch {
    return null;
  }
}

export async function getChannelVideos(channelId: string, maxResults = 20): Promise<VideoData[]> {
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
