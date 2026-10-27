// GET /api/translate?q=서대문자연사박물관 -> { en: "Seodaemun Museum of Natural History" }
// Korean place/program name -> English (Cloudflare Workers AI). Each name is translated once, then cached for a year.
export async function onRequestGet(context) {
  const { request, env, waitUntil } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q || q.length > 80) return new Response("bad", { status: 400 });
  if (!env.AI) return new Response("AI binding missing", { status: 501 });
  const cache = caches.default;
  const key = new Request(`${url.origin}/api/translate?q=${encodeURIComponent(q)}`);
  const hit = await cache.match(key);
  if (hit) return hit;
  try {
    const r = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: "You translate Korean place names and trip titles into their commonly used English name (use the official English name for museums, palaces, parks and other landmarks when one exists; otherwise romanize and add the type, e.g. Museum, Park). Reply with the English name only, no quotes, no explanation." },
        { role: "user", content: q },
      ],
      max_tokens: 40,
    });
    const en = String((r && (r.response || r.result)) || "").trim().split("\n")[0].replace(/^["'“”]+|["'“”]+$/g, "").slice(0, 80);
    if (!en) return new Response("empty", { status: 502 });
    const res = new Response(JSON.stringify({ en }), { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=31536000, immutable" } });
    const put = cache.put(key, res.clone());
    if (waitUntil) waitUntil(put);
    return res;
  } catch (e) {
    return new Response("translate failed", { status: 502 });
  }
}
