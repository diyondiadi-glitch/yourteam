// ── CreatorBrain AI Service ─────────────────────────────────────────
// Groq Primary Configuration
const GROQ_KEY = "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";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// OpenRouter Primary Configuration
const OR_KEY = "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";
const OR_URL = "https://openrouter.ai/api/v1/chat/completions";
const OR_HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${OR_KEY}`,
  "HTTP-Referer": "https://creatorbrain.app",
  "X-Title": "CreatorBrain",
};

// Ollama Free API Configuration
const OLLAMA_URL = "https://ollama.freeapi.org/api/chat";
const OLLAMA_MODELS = ["llama3.2", "mistral", "gemma2"];

// OpenRouter Models
const PRIMARY_MODEL = "openai/gpt-4o-mini";
const FALLBACK_MODELS = [
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "google/gemma-3-12b-it:free",
  "qwen/qwen-2.5-72b-instruct:free",
];

export type AIStatus = "working" | "slow" | "failed";
let aiStatus: AIStatus = "working";
const listeners = new Set<(s: AIStatus) => void>();

export function getAIStatus() { return aiStatus; }
export function onAIStatusChange(fn: (s: AIStatus) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function setStatus(s: AIStatus) { aiStatus = s; listeners.forEach(fn => fn(s)); }

const cache = new Map<string, { result: string; ts: number }>();
const CACHE_MS = 45_000;

/**
 * Safe JSON parser that attempts to fix truncated JSON by closing braces/brackets
 */
export function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch (e) {
    // Attempt to fix truncated JSON
    let fixed = text.trim();
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;

    if (openBraces > closeBraces) fixed += "}".repeat(openBraces - closeBraces);
    if (openBrackets > closeBrackets) fixed += "]".repeat(openBrackets - closeBrackets);

    try {
      return JSON.parse(fixed);
    } catch {
      throw e; // If still failing, throw original error
    }
  }
}

export const parseJsonSafely = safeJsonParse;
export const parseJsonFromAI = safeJsonParse;

async function fetchWithTimeout(url: string, options: any, timeoutMs: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function tryOllama(model: string, sys: string, user: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        stream: false,
      }),
    }, 15000);
    if (!res.ok) return null;
    const data = await res.json();
    return data.message?.content ?? null;
  } catch { return null; }
}

async function tryGroq(model: string, sys: string, user: string, maxTokens: number, temp: number, timeout: number): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        max_tokens: maxTokens,
        temperature: temp,
      }),
    }, timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}

async function tryOpenRouter(model: string, sys: string, user: string, maxTokens: number, temp: number, timeout: number): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(OR_URL, {
      method: "POST",
      headers: OR_HEADERS,
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        max_tokens: maxTokens,
        temperature: temp,
      }),
    }, timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const { maxTokens = 2000, temperature = 0.7 } = options ?? {};
  const cacheKey = btoa(unescape(encodeURIComponent(systemPrompt + userPrompt))).slice(0, 200);
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < CACHE_MS) return hit.result;

  setStatus("working");

  // 1. Try Ollama models first (Free)
  for (const model of OLLAMA_MODELS) {
    const r = await tryOllama(model, systemPrompt, userPrompt);
    if (r) {
      cache.set(cacheKey, { result: r, ts: Date.now() });
      return r;
    }
  }

  // 2. Try Groq (Primary High-Speed)
  const groqResult = await tryGroq("llama-3.3-70b-versatile", systemPrompt, userPrompt, maxTokens, temperature, 10000);
  if (groqResult) {
    cache.set(cacheKey, { result: groqResult, ts: Date.now() });
    return groqResult;
  }

  // 3. Try Primary Model (OpenRouter)
  const primaryResult = await tryOpenRouter(PRIMARY_MODEL, systemPrompt, userPrompt, maxTokens, temperature, 20000);
  if (primaryResult) {
    cache.set(cacheKey, { result: primaryResult, ts: Date.now() });
    return primaryResult;
  }

  // 4. Fallback Chain
  setStatus("slow");
  for (const model of FALLBACK_MODELS) {
    const r = await tryOpenRouter(model, systemPrompt, userPrompt, maxTokens, temperature, 15000);
    if (r) {
      cache.set(cacheKey, { result: r, ts: Date.now() });
      return r;
    }
  }

  // 5. Last Resort (Free Groq Model)
  const lastResort = await tryGroq("llama-3.1-8b-instant", systemPrompt, userPrompt, maxTokens, temperature, 10000);
  if (lastResort) {
    cache.set(cacheKey, { result: lastResort, ts: Date.now() });
    return lastResort;
  }

  setStatus("failed");
  throw new Error("All AI models failed. Please check your connection or try again later.");
}

// Alias for callAI as requested
export const callGroq = callAI;

export async function streamAI(
  systemPrompt: string,
  userPrompt: string,
  onChunk: (text: string) => void
): Promise<string> {
  // Simple streaming implementation for compatibility, using the primary model
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 25000);
  
  try {
    const res = await fetch(OR_URL, {
      method: "POST",
      headers: OR_HEADERS,
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        max_tokens: 2000,
        temperature: 0.7,
        stream: true,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(id);
    if (!res.ok || !res.body) return callAI(systemPrompt, userPrompt);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(line => line.trim() !== "");
      for (const line of lines) {
        if (line.includes("[DONE]")) break;
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices?.[0]?.delta?.content || "";
            full += content;
            onChunk(full);
          } catch (e) {
            // Ignore parse errors for partial chunks
          }
        }
      }
    }
    return full;
  } catch (e) {
    clearTimeout(id);
    return callAI(systemPrompt, userPrompt);
  }
}
