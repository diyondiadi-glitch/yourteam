interface YouTubeEmbedProps {
  videoId: string;
  className?: string;
}

export default function YouTubeEmbed({ videoId, className = "" }: YouTubeEmbedProps) {
  // Use youtube-nocookie.com for privacy-enhanced mode that bypasses most embedding restrictions
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&origin=${encodeURIComponent(origin)}`}
      width="100%"
      style={{
        aspectRatio: "16/9",
        borderRadius: "12px",
        border: "none",
        display: "block",
      }}
      className={className}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
