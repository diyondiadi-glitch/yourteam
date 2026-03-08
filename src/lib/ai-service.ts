const GROQ_API_KEY = "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";

const models = [
  "llama-3.3-70b-versatile",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
];

// Track rate limit status globally
let aiStatus: "ok" | "slow" | "limited" = "ok";
let cooldownUntil = 0;
const statusListeners: Set<(s: typeof aiStatus) => void> = new Set();

export function getAIStatus() { return aiStatus; }
export function onAIStatusChange(fn: (s: typeof aiStatus) => void) {
  statusListeners.add(fn);
  return () => statusListeners.delete(fn);
}
function setStatus(s: typeof aiStatus) {
  aiStatus = s;
  statusListeners.forEach(fn => fn(s));
}

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const { maxTokens = 2000, temperature = 0.7 } = options || {};

  // If we're in cooldown, wait
  const now = Date.now();
  if (cooldownUntil > now) {
    const wait = cooldownUntil - now;
    if (wait > 15000) {
      setStatus("limited");
      throw new Error(`AI is cooling down. Please retry in ${Math.ceil(wait / 1000)}s.`);
    }
    await new Promise(r => setTimeout(r, wait));
  }

  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: models[modelIndex],
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_tokens: maxTokens,
            temperature,
          }),
        });

        if (res.status === 429) {
          // Parse retry-after from error body
          try {
            const err = await res.json();
            const match = err.error?.message?.match(/try again in (\d+)m/i);
            if (match) {
              const mins = parseInt(match[1]);
              cooldownUntil = Date.now() + mins * 60 * 1000;
            } else {
              cooldownUntil = Date.now() + 30000;
            }
          } catch {
            cooldownUntil = Date.now() + 30000;
          }
          setStatus("limited");
          // Try next model immediately
          break;
        }

        if (!res.ok) continue;

        const data = await res.json();
        setStatus("ok");
        return data.choices?.[0]?.message?.content || "";
      } catch (err) {
        if (attempt === 0) await new Promise(r => setTimeout(r, 500));
      }
    }
  }
  setStatus("limited");
  throw new Error("All AI models unavailable. Please try again in 30 seconds.");
}

export async function streamAI(
  systemPrompt: string,
  userPrompt: string,
  onChunk: (text: string) => void
): Promise<string> {
  // Use first available model with streaming
  for (const model of models.slice(0, 3)) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 2000,
          temperature: 0.7,
          stream: true,
        }),
      });

      if (res.status === 429) continue;
      if (!res.ok) continue;

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
      setStatus("ok");
      return full;
    } catch {
      continue;
    }
  }
  setStatus("limited");
  throw new Error("AI streaming unavailable. Please try again shortly.");
}

export function parseJsonFromAI(text: string): any {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\[[\s\S]*\])/) || text.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1]); } catch { /* fallback */ }
  }
  try { return JSON.parse(text); } catch { return null; }
}
