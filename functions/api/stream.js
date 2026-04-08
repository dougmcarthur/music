const DEFAULT_ALBUM_BASE = "https://dougmcarthur.net/2026-album/";
const DEFAULT_BSIDES_BASE = "https://dougmcarthur.net/mp3/b-sides/";

function getAlbumBase(request, env) {
  const url = new URL(request.url);
  const collection = (url.searchParams.get("collection") || "main").toLowerCase();
  if (collection === "bsides") {
    return env?.BSIDES_AUDIO_BASE_URL || DEFAULT_BSIDES_BASE;
  }
  return env?.MAIN_AUDIO_BASE_URL || DEFAULT_ALBUM_BASE;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function isValidTrackFile(file) {
  if (!file) return false;
  if (!/\.mp3$/i.test(file)) return false;
  if (file.includes("/") || file.includes("\\")) return false;
  if (file.includes("..")) return false;
  return true;
}

export async function onRequestGet({ request, env }) {
  const albumBase = getAlbumBase(request, env);

  try {
    const requestUrl = new URL(request.url);
    const file = requestUrl.searchParams.get("file") || "";

    if (!isValidTrackFile(file)) {
      return json({ error: "Invalid file parameter" }, 400);
    }

    const sourceUrl = new URL(file, albumBase).toString();
    const headers = new Headers();
    const range = request.headers.get("range");
    if (range) {
      headers.set("range", range);
    }

    const upstream = await fetch(sourceUrl, {
      method: "GET",
      headers,
      cf: {
        cacheTtl: 300,
        cacheEverything: true,
      },
    });

    if (!upstream.ok && upstream.status !== 206) {
      return json({ error: `Upstream stream failed (${upstream.status})` }, 502);
    }

    const outHeaders = new Headers();
    outHeaders.set("content-type", upstream.headers.get("content-type") || "audio/mpeg");
    outHeaders.set("cache-control", "public, max-age=300");

    const passThroughHeaders = ["accept-ranges", "content-length", "content-range", "etag", "last-modified"];
    for (const name of passThroughHeaders) {
      const value = upstream.headers.get(name);
      if (value) outHeaders.set(name, value);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: outHeaders,
    });
  } catch {
    return json({ error: "Could not stream file" }, 500);
  }
}
