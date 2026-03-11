// ── YouTube API Logic ─────────────────────────────────────────

const YT_KEYS = [
  "AIzaSyDy3LNCFTUSqrpmfA-TvkyRqCIryORegkA",
  "AIzaSyAz-3Zhkq7DaeodW4s_2zTXW_zHvtzqXzc",
];

let currentKeyIndex = 0;

export interface ChannelData {
  id: string;
  name: string;
  title?: string;
  handle: string;
  description: string;
  avatar: string;
  banner: string | null;
  subscribers: number;
  subscriberCount?: number;
  totalViews: number;
  viewCount?: number;
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
  viewCount?: number;
  likes: number;
  likeCount?: number;
  comments: number;
  commentCount?: number;
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

async function fetchWithKeyRotation(baseUrl: string): Promise<any> {
  let keysTried = 0;
  
  while (keysTried < YT_KEYS.length) {
    const url = `${baseUrl}&key=${YT_KEYS[currentKeyIndex]}`;
    try {
      const res = await fetch(url);
      const text = await res.text();
      
      // 1. Check if text starts with < (HTML error page)
      if (text.trim().startsWith("<")) {
        console.warn(`HTML response from YouTube API with key ${currentKeyIndex}, rotating...`);
        currentKeyIndex = (currentKeyIndex + 1) % YT_KEYS.length;
        keysTried++;
        continue;
      }
      
      const data = JSON.parse(text);
      
      // 2. Check for 403/429 errors in JSON
      if (data.error && (data.error.code === 403 || data.error.code === 429)) {
        console.warn(`Quota error from YouTube API with key ${currentKeyIndex}, rotating...`);
        currentKeyIndex = (currentKeyIndex + 1) % YT_KEYS.length;
        keysTried++;
        continue;
      }
      
      return data;
    } catch (err) {
      console.error(`Fetch error with key ${currentKeyIndex}:`, err);
      currentKeyIndex = (currentKeyIndex + 1) % YT_KEYS.length;
      keysTried++;
    }
  }
  
  throw new Error("YouTube API keys exhausted or unavailable. Please try again later.");
}

export async function fetchCompleteChannelData(
  input: string,
  onProgress?: (progress: FetchProgress) => void
): Promise<ChannelData> {
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

  onProgress?.({ step: "finding", message: "Connecting to YouTube...", percent: 5 });

  let channelData: any = null;

  // Try handle-based fetch first
  if (handle) {
    const handleToTry = handle.startsWith("@") ? handle.substring(1) : handle;
    const data = await fetchWithKeyRotation(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings,contentDetails&forHandle=${handleToTry}`
    );
    channelData = data.items?.[0] || null;
    if (!channelData) {
      onProgress?.({ step: "finding", message: "Searching for channel...", percent: 8 });
    }
  }

  // Try channel ID fetch
  if (!channelData && channelId) {
    const data = await fetchWithKeyRotation(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings,contentDetails&id=${channelId}`
    );
    channelData = data.items?.[0] || null;
    if (!channelData) {
      onProgress?.({ step: "finding", message: "Searching by ID...", percent: 10 });
    }
  }

  // Try search as last resort
  if (!channelData && handle) {
    onProgress?.({ step: "finding", message: "Searching YouTube...", percent: 12 });
    const searchHandle = handle.replace("@", "");
    const searchData = await fetchWithKeyRotation(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${searchHandle}`
    );
    const firstResult = searchData.items?.[0];
    if (firstResult) {
      channelId = firstResult.snippet.channelId;
      const channelDataRes = await fetchWithKeyRotation(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings,contentDetails&id=${channelId}`
      );
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

  let allVideoIds: string[] = [];
  let nextPageToken = "";

  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${uploadsPlaylistId}&maxResults=50${nextPageToken ? "&pageToken=" + nextPageToken : ""}`;
    const data = await fetchWithKeyRotation(url);

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

  let allVideos: any[] = [];
  for (let i = 0; i < allVideoIds.length; i += 50) {
    const batch = allVideoIds.slice(i, i + 50).join(",");
    const data = await fetchWithKeyRotation(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${batch}`
    );
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

  const recentVideos = allVideos.slice(0, 5); // Fetches comments from most recent 5 videos as per Section 7
  const commentsMap: Record<string, CommentData[]> = {};

  for (let idx = 0; idx < recentVideos.length; idx++) {
    const video = recentVideos[idx];
    try {
      const data = await fetchWithKeyRotation(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${video.id}&maxResults=100&order=relevance`
      );
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
    message: "Building AI insights...",
    channelName,
    videoCount: allVideos.length,
    percent: 85,
  });

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

  const subs = parseInt(channelData.statistics?.subscriberCount || 0);
  const totViews = parseInt(channelData.statistics?.viewCount || 0);
  const vidCount = parseInt(channelData.statistics?.videoCount || 0);

  const result: ChannelData = {
    id: channelId,
    name: channelName,
    title: channelName,
    handle: channelData.snippet.customUrl || handle,
    description: channelData.snippet.description,
    avatar:
      channelData.snippet.thumbnails?.high?.url ||
      channelData.snippet.thumbnails?.default?.url,
    banner: channelData.brandingSettings?.image?.bannerExternalUrl || null,
    subscribers: subs,
    subscriberCount: subs,
    totalViews: totViews,
    viewCount: totViews,
    videoCount: vidCount,
    createdAt: channelData.snippet.publishedAt,
    country: channelData.snippet.country || "Unknown",
    avgViews,
    avgLikes,
    avgComments,
    bestDay,
    avgDaysBetweenUploads,
    uploadFrequency:
      avgDaysBetweenUploads <= 1
        ? "Daily"
        : avgDaysBetweenUploads <= 3
          ? "2-3 times/week"
          : avgDaysBetweenUploads <= 7
            ? "Weekly"
            : "Monthly",
    videos: sortedVideos.map((v) => ({
      id: v.id,
      title: v.snippet.title,
      description: v.snippet.description,
      thumbnail:
        v.snippet.thumbnails?.maxres?.url ||
        v.snippet.thumbnails?.high?.url ||
        v.snippet.thumbnails?.default?.url,
      publishedAt: v.snippet.publishedAt,
      duration: v.contentDetails.duration,
      views: parseInt(v.statistics?.viewCount || 0),
      viewCount: parseInt(v.statistics?.viewCount || 0),
      likes: parseInt(v.statistics?.likeCount || 0),
      likeCount: parseInt(v.statistics?.likeCount || 0),
      comments: parseInt(v.statistics?.commentCount || 0),
      commentCount: parseInt(v.statistics?.commentCount || 0),
      tags: v.snippet.tags || [],
      categoryId: v.snippet.categoryId,
      defaultLanguage: v.snippet.defaultLanguage,
      isShort:
        v.contentDetails.duration.includes("S") &&
        !v.contentDetails.duration.includes("M") &&
        !v.contentDetails.duration.includes("H"),
    })),
    comments: commentsMap,
    fetchedAt: new Date().toISOString(),
    isPublicData: true,
  };

  onProgress?.({ step: "done", message: "Ready!", channelName, percent: 100 });
  return result;
}

export function calcChannelScore(videos: VideoData[], subscribers: number): number {
  if (!videos.length) return 0;
  const avgViews = videos.reduce((sum, v) => sum + v.views, 0) / videos.length;
  const viewScore = Math.min((avgViews / Math.max(subscribers, 1)) * 100, 50);
  const consistencyScore = Math.min(videos.length / 10, 25);
  const engagementScore = 25; // Placeholder for simplicity
  return Math.round(viewScore + consistencyScore + engagementScore);
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

export function clearChannelData() {
  localStorage.removeItem("cb_channel_data");
}

export function isChannelConnected(): boolean {
  return !!localStorage.getItem("cb_channel_data");
}

export function getMyChannel(): ChannelData {
  const stored = localStorage.getItem("cb_channel_data");
  if (!stored) throw new Error("No channel connected");
  return JSON.parse(stored);
}

export function getRecentVideos(channelId: string, count: number = 10): VideoData[] {
  const data = getMyChannel();
  return data.videos.slice(0, count);
}

export function getChannelContext(channel: ChannelData, videos: VideoData[]): string {
  return `Channel: ${channel.name}
Subscribers: ${channel.subscribers}
Avg Views: ${channel.avgViews}
Recent Videos:
${videos.map(v => `- ${v.title} (${v.views} views)`).join("\n")}`;
}

export async function searchChannel(query: string): Promise<any> {
  const data = await fetchWithKeyRotation(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}`
  );
  return data.items || [];
}

export async function getChannelById(id: string): Promise<any> {
  const data = await fetchWithKeyRotation(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings,contentDetails&id=${id}`
  );
  return data.items?.[0] || null;
}

export async function getChannelVideos(channelId: string, maxResults: number = 50): Promise<any> {
  const channelData = await getChannelById(channelId);
  const uploadsPlaylistId = channelData?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) return [];

  const data = await fetchWithKeyRotation(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}`
  );
  
  const videoIds = (data.items || []).map((i: any) => i.contentDetails.videoId).join(",");
  const videosData = await fetchWithKeyRotation(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}`
  );
  
  return (videosData.items || []).map((v: any) => ({
    id: v.id,
    title: v.snippet.title,
    thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url,
    publishedAt: v.snippet.publishedAt,
    views: parseInt(v.statistics?.viewCount || 0),
    likes: parseInt(v.statistics?.likeCount || 0),
    comments: parseInt(v.statistics?.commentCount || 0),
  }));
}

export function getVideoComments(videoId: string, maxResults: number = 100): string[] {
  const data = getMyChannel();
  const comments = data.comments[videoId] || [];
  return comments.slice(0, maxResults).map(c => c.text);
}
