import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ChannelData, VideoData } from "@/lib/youtube-api";
import { formatCount } from "@/lib/utils";

export interface UseChannelDataResult {
  channel: ChannelData | null;
  videos: VideoData[];
  comments: Record<string, any[]>;
  subscribers: number;
  avgViews: number;
  avgLikes: number;
  totalViews: number;
  videoCount: number;
  bestDay: string;
  uploadFrequency: string;
  isPublicData: boolean;
  channelName: string;
  channelAvatar: string;
  channelContext: string;
  isConnected: boolean;
  loading: boolean;
  error: string;
  reload: () => void;
}

export function useChannelData(videoCount?: number): UseChannelDataResult {
  const navigate = useNavigate();
  const [stored, setStored] = useState<string | null>(localStorage.getItem("cb_channel_data"));

  useEffect(() => {
    if (!stored) {
      navigate("/", { replace: true });
    }
  }, [stored, navigate]);

  if (!stored) {
    return {
      channel: null,
      videos: [],
      comments: {},
      subscribers: 0,
      avgViews: 0,
      avgLikes: 0,
      totalViews: 0,
      videoCount: 0,
      bestDay: "Wednesday",
      uploadFrequency: "Weekly",
      isPublicData: true,
      channelName: "",
      channelAvatar: "",
      channelContext: "",
      isConnected: false,
      loading: false,
      error: "",
      reload: () => {
        setStored(localStorage.getItem("cb_channel_data"));
      },
    };
  }

  const data: ChannelData = JSON.parse(stored);
  const videos = videoCount ? data.videos.slice(0, videoCount) : data.videos;

  const channelContext = `Channel: ${data.name}
Subscribers: ${formatCount(data.subscribers)}
Avg Views: ${formatCount(data.avgViews)}
Upload Frequency: ${data.uploadFrequency}
Best Day: ${data.bestDay}

Recent Videos:
${data.videos.slice(0, 5).map(v => `- ${v.title} (${formatCount(v.views)} views)`).join("\n")}`;

  return {
    channel: data,
    videos,
    comments: data.comments,
    subscribers: data.subscribers,
    avgViews: data.avgViews,
    avgLikes: data.avgLikes,
    totalViews: data.totalViews,
    videoCount: data.videoCount,
    bestDay: data.bestDay,
    uploadFrequency: data.uploadFrequency,
    isPublicData: data.isPublicData,
    channelName: data.name,
    channelAvatar: data.avatar,
    channelContext,
    isConnected: true,
    loading: false,
    error: "",
    reload: () => {
      setStored(localStorage.getItem("cb_channel_data"));
    },
  };
}
