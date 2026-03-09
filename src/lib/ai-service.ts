const GROQ_KEY = "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";
const OPENROUTER_KEY = "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";

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "gemma2-9b-it",
];

const OPENROUTER_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "google/gemma-2-9b-it:free",
  "microsoft/phi-3-mini-128k-instruct:free",
];

const cache = new Map<string, { result: string; ts: number }>();
const CACHE_TTL = 30_000;

type AIStatus = "ok" | "slow" | "limited";
let aiStatus: AIStatus = "ok";
const statusListeners = new Set<(s: AIStatus) => void>();

export function getAIStatus() { return aiStatus; }
export function onAIStatusChange(fn: (s: AIStatus) => void) {
  statusListeners.add(fn);
  return () => statusListeners.delete(fn);
}
function setStatus(s: AIStatus) {
  aiStatus = s;
  statusListeners.forEach(fn => fn(s));
}

async function callGroqModel(
  model: string, system: string, user: string, maxTokens: number, temperature: number
): Promise<string | null> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        max_tokens: maxTokens, temperature,
      }),
    });
    if (res.status === 429 || !res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

async function callOpenRouterModel(
  model: string, system: string, user: string, maxTokens: number, temperature: number
): Promise<string | null> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "CreatorBrain",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        max_tokens: maxTokens, temperature,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number; skipChannelCheck?: boolean }
): Promise<string> {
  const { maxTokens = 2000, temperature = 0.7 } = options || {};

  const cacheKey = systemPrompt.slice(0, 80) + userPrompt.slice(0, 80);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.result;

  // Try Groq first
  for (const model of GROQ_MODELS) {
    const result = await callGroqModel(model, systemPrompt, userPrompt, maxTokens, temperature);
    if (result) {
      setStatus("ok");
      cache.set(cacheKey, { result, ts: Date.now() });
      return result;
    }
  }

  // Fallback to OpenRouter
  setStatus("slow");
  for (const model of OPENROUTER_MODELS) {
    const result = await callOpenRouterModel(model, systemPrompt, userPrompt, maxTokens, temperature);
    if (result) {
      setStatus("ok");
      cache.set(cacheKey, { result, ts: Date.now() });
      return result;
    }
  }

  setStatus("limited");
  throw new Error("AI is temporarily unavailable. Please try again in 30 seconds.");
}

export async function streamAI(
  systemPrompt: string, userPrompt: string, onChunk: (text: string) => void
): Promise<string> {
  for (const model of GROQ_MODELS.slice(0, 2)) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
          max_tokens: 2000, temperature: 0.7, stream: true,
        }),
      });
      if (res.status === 429 || !res.ok) continue;
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "", buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const chunk = JSON.parse(json);
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) { full += content; onChunk(content); }
          } catch {}
        }
      }
      setStatus("ok");
      return full;
    } catch { continue; }
  }

  const result = await callAI(systemPrompt, userPrompt);
  onChunk(result);
  return result;
}

export function parseJsonSafely(text: string): any {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const stripped = text.replace(/```(?:json)?\s*/gi, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(stripped); } catch {}
  const obj = stripped.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch {} }
  const arr = stripped.match(/\[[\s\S]*\]/);
  if (arr) { try { return JSON.parse(arr[0]); } catch {} }
  return null;
}

export const parseJsonFromAI = parseJsonSafely;
