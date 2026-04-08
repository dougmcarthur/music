# music

A simple Cloudflare Pages site with an embedded audio player for listening to demos of Doug McArthur's upcoming 2026 album.

## How it works

The page dynamically fetches the track listing from `https://dougmcarthur.net/2026-album/`, parses the directory index for `.mp3` files, and populates a custom HTML5 audio player. No build step required — it's a single static HTML file.

## Deploy

Deploys automatically via [Cloudflare Pages](https://pages.cloudflare.com/) on push.

To preview locally:

```bash
npm install
npm run dev
```

To deploy manually:

```bash
npm run deploy
```
