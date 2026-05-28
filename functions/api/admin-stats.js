function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

export async function onRequestGet({ request, env }) {
  const key = env.ADMIN_DASHBOARD_KEY;
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!key || token !== key) {
    return json({ error: "unauthorized" }, 401);
  }

  const kv = env.STATS_KV;

  // Collect last 30 days of unique visitor counts
  const visitors = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = [
      d.getUTCFullYear(),
      String(d.getUTCMonth() + 1).padStart(2, "0"),
      String(d.getUTCDate()).padStart(2, "0"),
    ].join("-");
    const count = await kv.get(`visitor:count:${dateStr}`);
    visitors.push({ date: dateStr, count: parseInt(count || "0", 10) });
  }

  // Collect all track votes
  const votesList = await kv.list({ prefix: "vote:" });
  const votes = await Promise.all(
    votesList.keys.map(async (k) => {
      const count = await kv.get(k.name);
      return { track: k.name.replace(/^vote:/, ""), votes: parseInt(count || "0", 10) };
    })
  );
  votes.sort((a, b) => b.votes - a.votes);

  return json({ visitors, votes });
}
