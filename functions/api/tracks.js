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
      "cache-control": "public, max-age=300",
    },
  });
}

function getFileName(urlString) {
  const url = new URL(urlString);
  const segments = url.pathname.split("/").filter(Boolean);
  return decodeURIComponent(segments[segments.length - 1] || "");
}

export async function onRequestGet({ request }) {
  const albumBase = getAlbumBase(request);

  try {
    const upstream = await fetch(albumBase, {
      headers: {
        "user-agent": "music-pages-track-loader/1.0",
      },
      cf: {
        cacheTtl: 300,
        cacheEverything: true,
      },
    });

    if (!upstream.ok) {
      return json({ error: `Upstream fetch failed (${upstream.status})` }, 502);
    }

    const html = await upstream.text();
    const hrefRegex = /href\s*=\s*["']([^"']+\.mp3(?:\?[^"']*)?)["']/gi;
    const seen = new Set();
    const tracks = [];
    let match;

    while ((match = hrefRegex.exec(html)) !== null) {
      try {
        const absolute = new URL(match[1], albumBase).toString();
        const file = getFileName(absolute);
        if (!file || seen.has(file.toLowerCase())) {
          continue;
        }
        seen.add(file.toLowerCase());
        tracks.push({ file, url: absolute });
      } catch {
        // Skip malformed URLs in directory listings.
      }
    }

    tracks.sort((a, b) => a.file.localeCompare(b.file, undefined, { numeric: true }));

    return json({ tracks });
  } catch (error) {
    return json({ error: "Could not load tracks" }, 500);
  }
}
