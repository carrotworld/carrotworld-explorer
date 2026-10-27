// GET /api/tts?w=airport -> a natural English voice for one word or short phrase (Cloudflare Workers AI, MeloTTS).
// Each word is made once, then kept in Cloudflare's cache for a year, so the cost stays tiny.
export async function onRequestGet(context) {
  const { request, env, waitUntil } = context;
  const url = new URL(request.url);
  const w = (url.searchParams.get("w") || "").trim().toLowerCase();
  if (!w || w.length > 60 || !/^[a-z0-9 '’.,!?-]+$/.test(w)) return new Response("bad word", { status: 400 });
  if (!env.AI) return new Response("AI binding missing", { status: 501 });
  const cache = caches.default;
  const key = new Request(`${url.origin}/api/tts?w=${encodeURIComponent(w)}`);
  const hit = await cache.match(key);
  if (hit) return hit;
  try {
    const r = await env.AI.run("@cf/myshell-ai/melotts", { prompt: w, lang: "en" });
    const b64 = typeof r === "string" ? r : r && r.audio;
    if (!b64) return new Response("no audio", { status: 502 });
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const isWav = bin.slice(0, 4) === "RIFF";
    const res = new Response(bytes, { headers: { "Content-Type": isWav ? "audio/wav" : "audio/mpeg", "Cache-Control": "public, max-age=31536000, immutable" } });
    const put = cache.put(key, res.clone());
    if (waitUntil) waitUntil(put);
    return res;
  } catch (e) {
    return new Response("tts failed", { status: 502 });
  }
}
