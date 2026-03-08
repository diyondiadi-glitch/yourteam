const YT_API_KEY = "AIzaSyAz-3Zhkq7DaeodW4s_2zTXW_zHvtzqXzc";
const YT_BASE = "https://www.googleapis.com/youtube/v3";

async function ytPublicFetch(endpoint: string, params: Record<string, string>) {
  const url = new URL(`${YT_BASE}/${endpoint}`);
  params.key = YT_API_KEY;
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `YouTube API error: ${res.status}`);
  }
  return res.json();
}

export interface PublicChannelData {
  id: string;
  title: string;
  avatar: string;
  banner: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  customUrl: string;
  description: string;
}

export interface PublicVideoData {
  id: string;
  title: string;
  thumbnail: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  duration: string;
}

function parseHandle(input: string): { type: "handle" | "id" | "custom"; value: string } {
  const trimmed = input.trim();

  // @handle format
  if (trimmed.startsWith("@")) return { type: "handle", value: trimmed };

  // URL formats
  const handleMatch = trimmed.match(/youtube\.com\/@([^/?&#]+)/);
  if (handleMatch) return { type: "handle", value: `@${handleMatch[1]}` };

  const channelIdMatch = trimmed.match(/youtube\.com\/channel\/([^/?&#]+)/);
  if (channelIdMatch) return { type: "id", value: channelIdMatch[1] };

  const customMatch = trimmed.match(/youtube\.com\/c\/([^/?&#]+)/);
  if (customMatch) return { type: "custom", value: customMatch[1] };

  // Could be a raw channel ID (starts with UC)
  if (trimmed.startsWith("UC") && trimmed.length > 20) return { type: "id", value: trimmed };

  // Treat as handle
  return { type: "handle", value: `@${trimmed}` };
}

export async function fetchChannelByUrl(channelUrl: string): Promise<PublicChannelData | null> {
  const parsed = parseHandle(channelUrl);

  let data;
  if (parsed.type === "id") {
    data = await ytPublicFetch("channels", {
      part: "snippet,statistics,brandingSettings",
      id: parsed.value,
    });
  } else {
    // forHandle works for @handles
    data = await ytPublicFetch("channels", {
      part: "snippet,statistics,brandingSettings",
      forHandle: parsed.value.replace("@", ""),
    });
  }

  const ch = data.items?.[0];
  if (!ch) {
    // Fallback: search
    const searchData = await ytPublicFetch("search", {
      part: "snippet",
      q: channelUrl,
      type: "channel",
      maxResults: "1",
    });
    const searchId = searchData.items?.[0]?.snippet?.channelId;
    if (!searchId) return null;
    const retryData = await ytPublicFetch("channels", {
      part: "snippet,statistics,brandingSettings",
      id: searchId,
    });
    const retryCh = retryData.items?.[0];
    if (!retryCh) return null;
    return mapChannel(retryCh);
  }
  return mapChannel(ch);
}

function mapChannel(ch: any): PublicChannelData {
  return {
    id: ch.id,
    title: ch.snippet.title,
    avatar: ch.snippet.thumbnails?.medium?.url || ch.snippet.thumbnails?.default?.url || "",
    banner: ch.brandingSettings?.image?.bannerExternalUrl || "",
    subscriberCount: Number(ch.statistics.subscriberCount || 0),
    viewCount: Number(ch.statistics.viewCount || 0),
    videoCount: Number(ch.statistics.videoCount || 0),
    customUrl: ch.snippet.customUrl || "",
    description: ch.snippet.description || "",
  };
}

export async function fetchChannelVideos(channelId: string, maxResults = 50): Promise<PublicVideoData[]> {
  const channelRes = await ytPublicFetch("channels", {
    part: "contentDetails",
    id: channelId,
  });
  const uploadsId = channelRes.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) return [];

  const videosRes = await ytPublicFetch("playlistItems", {
    part: "snippet,contentDetails",
    playlistId: uploadsId,
    maxResults: String(maxResults),
  });

  const videoIds = videosRes.items?.map((v: any) => v.contentDetails.videoId).join(",");
  if (!videoIds) return [];

  const statsRes = await ytPublicFetch("videos", {
    part: "statistics,contentDetails,snippet",
    id: videoIds,
  });

  return (statsRes.items || []).map((v: any) => ({
    id: v.id,
    title: v.snippet.title,
    thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || "",
    viewCount: Number(v.statistics.viewCount || 0),
    likeCount: Number(v.statistics.likeCount || 0),
    commentCount: Number(v.statistics.commentCount || 0),
    publishedAt: v.snippet.publishedAt,
    duration: v.contentDetails?.duration || "",
  }));
}

export async function fetchVideoComments(videoId: string, maxResults = 100) {
  try {
    const res = await ytPublicFetch("commentThreads", {
      part: "snippet",
      videoId,
      maxResults: String(maxResults),
      order: "relevance",
    });
    return (res.items || []).map((item: any) => ({
      text: item.snippet.topLevelComment.snippet.textDisplay,
      likes: item.snippet.topLevelComment.snippet.likeCount,
      author: item.snippet.topLevelComment.snippet.authorDisplayName,
    }));
  } catch {
    return [];
  }
}

// Store/retrieve channel data from localStorage
export function storeChannelData(channel: PublicChannelData, videos: PublicVideoData[]) {
  localStorage.setItem("yt_channel_data", JSON.stringify(channel));
  localStorage.setItem("yt_videos", JSON.stringify(videos));
  localStorage.setItem("yt_channel_id", channel.id);
}

export function getStoredChannel(): PublicChannelData | null {
  try {
    return JSON.parse(localStorage.getItem("yt_channel_data") || "null");
  } catch { return null; }
}

export function getStoredVideos(): PublicVideoData[] {
  try {
    return JSON.parse(localStorage.getItem("yt_videos") || "[]");
  } catch { return []; }
}
