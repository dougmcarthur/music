const DEFAULT_ALBUM_BASE = "https://dougmcarthur.net/2026-album/";
const DEFAULT_BSIDES_BASE = "https://dougmcarthur.net/mp3/b-sides/";

function getAlbumBase(request) {
  const url = new URL(request.url);
  const collection = (url.searchParams.get("collection") || "main").toLowerCase();
  if (collection === "bsides") {
    return DEFAULT_BSIDES_BASE;
  }
  return DEFAULT_ALBUM_BASE;
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

export async function onRequestGet({ request }) {
  const albumBase = getAlbumBase(request);

  try {
    const url = new URL(request.url);
    const file = url.searchParams.get("file") || "";

    if (!isValidTrackFile(file)) {
      return json({ error: "Invalid file parameter" }, 400);
    }

    const sourceUrl = new URL(file, albumBase).toString();
    const upstream = await fetch(sourceUrl, {
      cf: {
        cacheTtl: 300,
        cacheEverything: true,
      },
    });

    if (!upstream.ok || !upstream.body) {
      return json({ error: `Upstream file fetch failed (${upstream.status})` }, 502);
    }

    const safeFile = file.replace(/["\r\n]/g, "_");
    const headers = new Headers();
    headers.set("content-type", upstream.headers.get("content-type") || "audio/mpeg");
    headers.set("content-disposition", `attachment; filename="${safeFile}"`);
    headers.set("cache-control", "public, max-age=300");

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) {
      headers.set("content-length", contentLength);
    }

    return new Response(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    return json({ error: "Could not download file" }, 500);
  }
}
