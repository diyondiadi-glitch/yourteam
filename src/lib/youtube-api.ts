const YT_API_KEY = "AIzaSyAz-3Zhkq7DaeodW4s_2zTXW_zHvtzqXzc";

export interface ChannelData {
  id: string;
  name: string;
  handle: string;
  description: string;
  avatar: string;
  banner: string | null;
  subscribers: number;
  totalViews: number;
  videoCount: number;
  createdAt: string;
  country: string;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  bestDay: string;
  avgDaysBetweenUploads: number;
  uploadFrequency: string;
  videos: VideoData[];
  comments: Record<string, CommentData[]>;
  fetchedAt: string;
  isPublicData: boolean;
}

export interface VideoData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
  categoryId: string;
  defaultLanguage?: string;
  isShort: boolean;
}

export interface CommentData {
  id: string;
  text: string;
  likes: number;
  author: string;
  authorAvatar: string;
  publishedAt: string;
  replyCount: number;
}

export type FetchProgress = {
  step: "finding" | "videos" | "comments" | "insights" | "done";
  message: string;
  channelName?: string;
  videoCount?: number;
  percent: number;
};

export async function fetchCompleteChannelData(
  input: string,
  onProgress?: (progress: FetchProgress) => void
): Promise<ChannelData> {
  // Clean the input
  let cleaned = input
    .trim()
    .replace("https://", "")
    .replace("http://", "")
    .replace("www.", "")
    .replace("youtube.com/", "")
    .replace("youtu.be/", "");

  let handle = "";
  let channelId = "";

  if (cleaned.startsWith("@")) {
    handle = cleaned.split("/")[0].split("?")[0];
  } else if (cleaned.startsWith("channel/")) {
    channelId = cleaned.replace("channel/", "").split("/")[0].split("?")[0];
  } else if (cleaned.startsWith("c/")) {
    handle = cleaned.replace("c/", "").split("/")[0].split("?")[0];
  } else if (cleaned.includes("@")) {
    handle = "@" + cleaned.split("@")[1].split("/")[0].split("?")[0];
  } else {
    handle = cleaned.split("/")[0].split("?")[0];
  }

  onProgress?.({ step: "finding", message: "Finding your channel...", percent: 5 });

  // Try fetching by handle
  let channelData: any = null;

  if (handle) {
    const handleToTry = handle.startsWith("@") ? handle.substring(1) : handle;
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings,contentDetails&forHandle=${handleToTry}&key=${YT_API_KEY}`
    );
    const data = await res.json();
    if (data.error?.code === 403) {
      throw new Error("API quota exceeded. Please try again tomorrow.");
    }
    channelData = data.items?.[0] || null;
  }

  // Try fetching by channel ID if handle failed
  if (!channelData && channelId) {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings,contentDetails&id=${channelId}&key=${YT_API_KEY}`
    );
    const data = await res.json();
    if (data.error?.code === 403) {
      throw new Error("API quota exceeded. Please try again tomorrow.");
    }
    channelData = data.items?.[0] || null;
  }

  // Try searching by username as last resort
  if (!channelData && handle) {
    const searchHandle = handle.replace("@", "");
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${searchHandle}&key=${YT_API_KEY}`
    );
    const data = await res.json();
    if (data.error?.code === 403) {
      throw new Error("API quota exceeded. Please try again tomorrow.");
    }
    const firstResult = data.items?.[0];
    if (firstResult) {
      channelId = firstResult.snippet.channelId;
      const channelRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings,contentDetails&id=${channelId}&key=${YT_API_KEY}`
      );
      const channelDataRes = await channelRes.json();
      channelData = channelDataRes.items?.[0] || null;
    }
  }

  if (!channelData) {
    throw new Error("Channel not found. Try using the format: youtube.com/@yourhandle");
  }

  channelId = channelData.id;
  const channelName = channelData.snippet.title;
  const uploadsPlaylistId = channelData.contentDetails?.relatedPlaylists?.uploads;

  onProgress?.({
    step: "finding",
    message: `Found — ${channelName}`,
    channelName,
    percent: 15,
  });

  if (!uploadsPlaylistId) {
    throw new Error("Could not access this channel's videos");
  }

  onProgress?.({ step: "videos", message: "Loading videos...", channelName, percent: 20 });

  // Fetch all video IDs from uploads playlist
  let allVideoIds: string[] = [];
  let nextPageToken = "";

  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${YT_API_KEY}${nextPageToken ? "&pageToken=" + nextPageToken : ""}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) break;

    allVideoIds = [
      ...allVideoIds,
      ...(data.items || []).map((i: any) => i.contentDetails.videoId),
    ];
    nextPageToken = data.nextPageToken || "";

    onProgress?.({
      step: "videos",
      message: `Loading ${allVideoIds.length} videos...`,
      channelName,
      videoCount: allVideoIds.length,
      percent: 20 + Math.min(allVideoIds.length / 200, 1) * 25,
    });
  } while (nextPageToken && allVideoIds.length < 200);

  // Fetch video statistics in batches of 50
  let allVideos: any[] = [];
  for (let i = 0; i < allVideoIds.length; i += 50) {
    const batch = allVideoIds.slice(i, i + 50).join(",");
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${batch}&key=${YT_API_KEY}`
    );
    const data = await res.json();
    allVideos = [...allVideos, ...(data.items || [])];

    onProgress?.({
      step: "videos",
      message: `Loaded ${allVideos.length} videos...`,
      channelName,
      videoCount: allVideos.length,
      percent: 45 + (i / allVideoIds.length) * 15,
    });
  }

  onProgress?.({
    step: "comments",
    message: "Reading comments...",
    channelName,
    videoCount: allVideos.length,
    percent: 60,
  });

  // Fetch comments for last 10 videos
  const recentVideos = allVideos.slice(0, 10);
  const commentsMap: Record<string, CommentData[]> = {};

  for (let idx = 0; idx < recentVideos.length; idx++) {
    const video = recentVideos[idx];
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${video.id}&maxResults=100&order=relevance&key=${YT_API_KEY}`
      );
      const data = await res.json();
      if (!data.error) {
        commentsMap[video.id] = (data.items || []).map((item: any) => ({
          id: item.id,
          text: item.snippet.topLevelComment.snippet.textDisplay,
          likes: item.snippet.topLevelComment.snippet.likeCount,
          author: item.snippet.topLevelComment.snippet.authorDisplayName,
          authorAvatar: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
          publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
          replyCount: item.snippet.totalReplyCount,
        }));
      }
    } catch {
      commentsMap[video.id] = [];
    }

    onProgress?.({
      step: "comments",
      message: `Reading comments... (${idx + 1}/${recentVideos.length})`,
      channelName,
      videoCount: allVideos.length,
      percent: 60 + ((idx + 1) / recentVideos.length) * 20,
    });
  }

  onProgress?.({
    step: "insights",
    message: "Building your insights...",
    channelName,
    videoCount: allVideos.length,
    percent: 85,
  });

  // Calculate channel analytics from public data
  const avgViews =
    allVideos.length > 0
      ? Math.round(
          allVideos.reduce((sum, v) => sum + parseInt(v.statistics?.viewCount || 0), 0) /
            allVideos.length
        )
      : 0;

  const avgLikes =
    allVideos.length > 0
      ? Math.round(
          allVideos.reduce((sum, v) => sum + parseInt(v.statistics?.likeCount || 0), 0) /
            allVideos.length
        )
      : 0;

  const avgComments =
    allVideos.length > 0
      ? Math.round(
          allVideos.reduce((sum, v) => sum + parseInt(v.statistics?.commentCount || 0), 0) /
            allVideos.length
        )
      : 0;

  // Detect upload frequency
  const sortedVideos = [...allVideos].sort(
    (a, b) => new Date(b.snippet.publishedAt).getTime() - new Date(a.snippet.publishedAt).getTime()
  );

  const recentDates = sortedVideos.slice(0, 10).map((v) => new Date(v.snippet.publishedAt));
  let avgDaysBetweenUploads = 7;
  if (recentDates.length > 1) {
    const gaps = recentDates
      .slice(0, -1)
      .map((date, i) => (date.getTime() - recentDates[i + 1].getTime()) / (1000 * 60 * 60 * 24));
    avgDaysBetweenUploads = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  }

  // Detect best performing day
  const dayPerformance: Record<string, { total: number; count: number }> = {};
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  allVideos.forEach((v) => {
    const day = days[new Date(v.snippet.publishedAt).getDay()];
    if (!dayPerformance[day]) dayPerformance[day] = { total: 0, count: 0 };
    dayPerformance[day].total += parseInt(v.statistics?.viewCount || 0);
    dayPerformance[day].count++;
  });
  const bestDay =
    Object.entries(dayPerformance)
      .map(([day, data]) => ({ day, avg: data.total / data.count }))
      .sort((a, b) => b.avg - a.avg)[0]?.day || "Wednesday";

  // Build the complete channel object
  const result: ChannelData = {
    id: channelId,
    name: channelName,
    handle: channelData.snippet.customUrl || handle,
    description: channelData.snippet.description,
    avatar:
      channelData.snippet.thumbnails?.high?.url ||
      channelData.snippet.thumbnails?.default?.url,
    banner: channelData.brandingSettings?.image?.bannerExternalUrl || null,
    subscribers: parseInt(channelData.statistics?.subscriberCount || 0),
    totalViews: parseInt(channelData.statistics?.viewCount || 0),
    videoCount: parseInt(channelData.statistics?.videoCount || 0),
    createdAt: channelData.snippet.publishedAt,
    country: channelData.snippet.country || "Unknown",
    avgViews,
    avgLikes,
    avgComments,
    bestDay,
    avgDaysBetweenUploads,
    uploadFrequency:
      avgDaysBetweenUploads <= 3
        ? "Daily"
        : avgDaysBetweenUploads <= 7
          ? "Weekly"
          : avgDaysBetweenUploads <= 14
            ? "Bi-weekly"
            : "Monthly",
    videos: sortedVideos.map((v) => ({
      id: v.id,
      title: v.snippet.title,
      description: v.snippet.description || "",
      thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url,
      publishedAt: v.snippet.publishedAt,
      duration: v.contentDetails?.duration || "PT0S",
      views: parseInt(v.statistics?.viewCount || 0),
      likes: parseInt(v.statistics?.likeCount || 0),
      comments: parseInt(v.statistics?.commentCount || 0),
      tags: v.snippet.tags || [],
      categoryId: v.snippet.categoryId,
      defaultLanguage: v.snippet.defaultLanguage,
      isShort:
        parseInt(v.statistics?.viewCount || 0) > 0 &&
        (v.contentDetails?.duration || "").includes("PT") &&
        !v.contentDetails?.duration?.includes("H") &&
        parseInt(v.contentDetails?.duration?.replace(/[^0-9]/g, "") || "0") <= 60,
    })),
    comments: commentsMap,
    fetchedAt: new Date().toISOString(),
    isPublicData: true,
  };

  // Save everything to localStorage
  localStorage.setItem("yt_channel_data", JSON.stringify(result));
  localStorage.setItem("channel_connected", "true");
  localStorage.setItem("channel_id", channelId);

  onProgress?.({
    step: "done",
    message: "Ready!",
    channelName,
    videoCount: allVideos.length,
    percent: 100,
  });

  return result;
}

// ── Utility functions ───────────────────────────────────
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
  const avgViews = videos.reduce((s, v) => s + v.views, 0) / videos.length;
  const avgEngagement = videos.reduce((s, v) => s + v.likes + v.comments, 0) / videos.length;
  const viewRatio = Math.min(avgViews / Math.max(subscriberCount, 1), 1) * 40;
  const engagementScore = Math.min((avgEngagement / Math.max(avgViews, 1)) * 100, 1) * 30;
  const consistencyScore = Math.min(videos.length / 6, 1) * 30;
  return Math.round(viewRatio + engagementScore + consistencyScore);
}

export function getChannelContext(channel: ChannelData): string {
  const videoSummary = channel.videos
    .slice(0, 10)
    .map(
      (v) =>
        `"${v.title}" - ${v.views} views, ${v.likes} likes, ${v.comments} comments, published ${v.publishedAt}`
    )
    .join("\n");

  return `Channel: ${channel.name}
Subscribers: ${formatCount(channel.subscribers)}
Total Views: ${formatCount(channel.totalViews)}
Total Videos: ${channel.videoCount}
Average Views per Video: ${formatCount(channel.avgViews)}
Upload Frequency: ${channel.uploadFrequency}
Best Performing Day: ${channel.bestDay}

Recent Videos:
${videoSummary}`;
}

export function isChannelConnected(): boolean {
  return localStorage.getItem("channel_connected") === "true";
}

export function clearChannelData(): void {
  localStorage.removeItem("yt_channel_data");
  localStorage.removeItem("channel_connected");
  localStorage.removeItem("channel_id");
}
