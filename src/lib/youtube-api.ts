import { getToken } from "./youtube-auth";

const YT_BASE = "https://www.googleapis.com/youtube/v3";
const YT_API_KEY = "AIzaSyAz-3Zhkq7DaeodW4s_2zTXW_zHvtzqXzc";

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

export interface ChannelData {
  id: string;
  title: string;
  avatar: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  customUrl: string;
}

export async function getMyChannel(): Promise<ChannelData> {
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

export interface VideoData {
  id: string;
  title: string;
  thumbnail: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
}

export async function getRecentVideos(channelId: string, maxResults = 6): Promise<VideoData[]> {
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
