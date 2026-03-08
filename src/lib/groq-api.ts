const GROQ_API_KEY = "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";
const GROQ_MODEL = "llama3-70b-8192";

export async function callGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function streamGroq(
  systemPrompt: string,
  userPrompt: string,
  onChunk: (text: string) => void
): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
      stream: true,
    }),
  });
  if (!res.ok) throw new Error(`Groq API error: ${res.status}`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") break;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          full += content;
          onChunk(content);
        }
      } catch { /* partial */ }
    }
  }
  return full;
}

export function parseJsonFromResponse(text: string): any {
  // Try to extract JSON from markdown code blocks or raw text
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\[[\s\S]*\])/) || text.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1]); } catch { /* fallback */ }
  }
  try { return JSON.parse(text); } catch { return null; }
}

export async function generateVerdict(channelData: {
  title: string;
  subscriberCount: number;
  recentVideos: { title: string; viewCount: number; publishedAt: string }[];
}): Promise<string> {
  const videoSummary = channelData.recentVideos
    .map((v) => `"${v.title}" (${v.viewCount} views, ${v.publishedAt})`)
    .join("\n");

  return callGroq(
    "You are a YouTube growth strategist. Given channel data, provide ONE specific, actionable priority for today in 1-2 sentences. Be specific about what to do and why based on the data. No fluff.",
    `Channel: ${channelData.title}\nSubscribers: ${channelData.subscriberCount}\n\nRecent videos:\n${videoSummary}\n\nWhat is this creator's #1 priority today?`
  );
}
