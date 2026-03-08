import { useState, useEffect, useCallback } from "react";
import { getMyChannel, getRecentVideos, isDemoMode, formatCount, type ChannelData, type VideoData } from "@/lib/youtube-api";
import { getStoredChannel, getStoredVideos } from "@/lib/youtube-public-api";
import { isAuthenticated, hasChannelConnected } from "@/lib/youtube-auth";

export interface UseChannelDataResult {
  channel: ChannelData | null;
  videos: VideoData[];
  loading: boolean;
  error: string;
  isDemo: boolean;
  avgViews: number;
  reload: () => void;
  channelContext: string;
}

export function useChannelData(videoCount = 20): UseChannelDataResult {
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const ch = await getMyChannel();
      setChannel(ch);
      const vids = await getRecentVideos(ch.id, videoCount);
      setVideos(vids);
    } catch (err: any) {
      setError(err.message || "Failed to load channel data");
    } finally {
      setLoading(false);
    }
  }, [videoCount]);

  useEffect(() => {
    if (isAuthenticated() && hasChannelConnected()) {
      load();
    } else {
      setLoading(false);
    }
  }, [load]);

  const avgViews = videos.length > 0
    ? Math.round(videos.reduce((s, v) => s + v.viewCount, 0) / videos.length)
    : 0;

  const channelContext = channel
    ? `Channel: ${channel.title}\nSubscribers: ${formatCount(channel.subscriberCount)}\nAvg Views: ${formatCount(avgViews)}\n\nRecent Videos:\n${videos.map(v => `"${v.title}" - ${v.viewCount} views, ${v.likeCount} likes, ${v.commentCount} comments, published ${v.publishedAt}`).join("\n")}`
    : "";

  return {
    channel,
    videos,
    loading,
    error,
    isDemo: isDemoMode(),
    avgViews,
    reload: load,
    channelContext,
  };
}
