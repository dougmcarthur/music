function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function sanitizeTrack(name) {
  if (!name || typeof name !== "string") return null;
  if (name.length > 200) return null;
  if (!/\.mp3$/i.test(name)) return null;
  if (name.includes("/") || name.includes("\\") || name.includes("..")) return null;
  return name;
}

// GET /api/votes?track=filename.mp3 — return current vote count
export async function onRequestGet({ request, env }) {
  const kv = env.STATS_KV;
  const url = new URL(request.url);
  const track = sanitizeTrack(url.searchParams.get("track"));

  if (!track) {
    return json({ error: "invalid track" }, 400);
  }

  const count = await kv.get(`vote:${track}`);
  return json({ track, votes: parseInt(count || "0", 10) });
}

// POST /api/votes?track=filename.mp3 — increment vote count
export async function onRequestPost({ request, env }) {
  const kv = env.STATS_KV;
  const url = new URL(request.url);
  const track = sanitizeTrack(url.searchParams.get("track"));

  if (!track) {
    return json({ error: "invalid track" }, 400);
  }

  const current = await kv.get(`vote:${track}`);
  const newCount = (parseInt(current || "0", 10) + 1).toString();
  await kv.put(`vote:${track}`, newCount);

  return json({ track, votes: parseInt(newCount, 10) });
}
