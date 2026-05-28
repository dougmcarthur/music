function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function sha256hex(text) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function onRequestPost({ request, env }) {
  const kv = env.STATS_KV;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = new Date();
  const dateStr = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("-");

  try {
    const hash = await sha256hex(ip + dateStr);
    const dedupKey = `visitor:dedup:${hash}`;

    const existing = await kv.get(dedupKey);
    if (existing !== null) {
      return json({ message: "already counted" });
    }

    // Mark this IP as seen today (25h TTL to span timezone edge cases)
    await kv.put(dedupKey, "1", { expirationTtl: 90000 });

    // Increment daily unique visitor count (keep 90 days)
    const countKey = `visitor:count:${dateStr}`;
    const current = await kv.get(countKey);
    const newCount = (parseInt(current || "0", 10) + 1).toString();
    await kv.put(countKey, newCount, { expirationTtl: 90 * 24 * 60 * 60 });

    return json({ message: "recorded" });
  } catch (err) {
    return json({ error: "failed to record pageview" }, 500);
  }
}
