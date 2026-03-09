const GROQ_KEY = "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";
const OPENROUTER_KEY = "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";

// Groq models — fastest, try first
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
];

// OpenRouter free models — updated working names as of 2025
const OR_MODELS = [
  "meta-llama/llama-3.2-3b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "qwen/qwen-2-7b-instruct:free",
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-7b-instruct:free",
  "microsoft/phi-3-mini-128k-instruct:free",
];

// Cache to avoid hammering APIs with duplicate requests
const cache = new Map<string, { result: string; ts: number }>();
const CACHE_MS = 45_000;

type AIStatus = "ok" | "slow" | "limited";
let aiStatus: AIStatus = "ok";
const listeners = new Set<(s: AIStatus) => void>();
export function getAIStatus() { return aiStatus; }
export function onAIStatusChange(fn: (s: AIStatus) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function setStatus(s: AIStatus) {
  aiStatus = s;
  listeners.forEach(fn => fn(s));
}

// Fetch with timeout so nothing hangs forever
async function fetchWithTimeout(url: string, opts: RequestInit, ms = 12000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function tryGroq(model: string, sys: string, user: string, maxTokens: number, temp: number): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: sys }, { role: "user", content: user }],
          max_tokens: maxTokens,
          temperature: temp,
        }),
      }
    );
    if (res.status === 429) return null;
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function tryOpenRouter(model: string, sys: string, user: string, maxTokens: number, temp: number): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          "HTTP-Referer": "https://creatorbrain.app",
          "X-Title": "CreatorBrain",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: sys }, { role: "user", content: user }],
          max_tokens: maxTokens,
          temperature: temp,
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.warn(`OpenRouter ${model} failed ${res.status}:`, err.slice(0, 200));
      return null;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.warn(`OpenRouter ${model} threw:`, e);
    return null;
  }
}

// ── Main function — tries all providers, never throws "busy" ───
export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const { maxTokens = 2000, temperature = 0.7 } = options ?? {};

  const cacheKey = (systemPrompt + userPrompt).slice(0, 200);
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < CACHE_MS) return hit.result;

  // Round 1 — try all Groq models
  for (const model of GROQ_MODELS) {
    const r = await tryGroq(model, systemPrompt, userPrompt, maxTokens, temperature);
    if (r) {
      setStatus("ok");
      cache.set(cacheKey, { result: r, ts: Date.now() });
      return r;
    }
  }

  // Round 2 — Groq exhausted, try OpenRouter silently
  setStatus("slow");
  for (const model of OR_MODELS) {
    const r = await tryOpenRouter(model, systemPrompt, userPrompt, maxTokens, temperature);
    if (r) {
      setStatus("ok");
      cache.set(cacheKey, { result: r, ts: Date.now() });
      return r;
    }
  }

  // Round 3 — everything failed, try Groq smallest model one more time after short wait
  await new Promise(res => setTimeout(res, 3000));
  const last = await tryGroq("llama3-8b-8192", systemPrompt, userPrompt, Math.min(maxTokens, 800), temperature);
  if (last) {
    setStatus("ok");
    cache.set(cacheKey, { result: last, ts: Date.now() });
    return last;
  }

  setStatus("limited");
  // Return a graceful degraded response instead of throwing
  return `Unable to generate AI insights right now. Your channel data has loaded successfully — please try this analysis again in 30 seconds.`;
}

// ── Streaming ───────────────────────────────────────────────────
export async function streamAI(
  systemPrompt: string,
  userPrompt: string,
  onChunk: (text: string) => void
): Promise<string> {
  for (const model of GROQ_MODELS.slice(0, 3)) {
    try {
      const res = await fetchWithTimeout(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            max_tokens: 2000,
            temperature: 0.7,
            stream: true,
          }),
        },
        20000
      );
      if (res.status === 429 || !res.ok) continue;

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, i).trim();
          buf = buf.slice(i + 1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const chunk = JSON.parse(json);
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) { full += content; onChunk(content); }
          } catch { /* partial */ }
        }
      }
      setStatus("ok");
      return full;
    } catch { continue; }
  }
  // Fall back to non-streaming
  const result = await callAI(systemPrompt, userPrompt);
  onChunk(result);
  return result;
}

// ── JSON helpers ───────────────────────────────────────────────
export function parseJsonSafely(text: string): any {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const s = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(s); } catch {}
  const obj = s.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch {} }
  const arr = s.match(/\[[\s\S]*\]/);
  if (arr) { try { return JSON.parse(arr[0]); } catch {} }
  return null;
}

export const parseJsonFromAI = parseJsonSafely;
export const parseJsonFromResponse = parseJsonSafely;
export default callAI;
