const GROQ_API_KEY = "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";

export async function generateVerdict(channelData: {
  title: string;
  subscriberCount: number;
  recentVideos: { title: string; viewCount: number; publishedAt: string }[];
}): Promise<string> {
  const videoSummary = channelData.recentVideos
    .map((v) => `"${v.title}" (${v.viewCount} views, ${v.publishedAt})`)
    .join("\n");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are a YouTube growth strategist. Given channel data, provide ONE specific, actionable priority for today in 1-2 sentences. Be specific about what to do and why based on the data. No fluff.",
        },
        {
          role: "user",
          content: `Channel: ${channelData.title}\nSubscribers: ${channelData.subscriberCount}\n\nRecent videos:\n${videoSummary}\n\nWhat is this creator's #1 priority today?`,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Analyze your recent performance and plan your next upload.";
}
