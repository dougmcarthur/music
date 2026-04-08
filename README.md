# music

A simple Cloudflare Pages site with an embedded audio player for listening to demos of Doug McArthur's upcoming 2026 album.

## How it works

The page loads tracks through a Cloudflare Pages Function (`/api/tracks`) that fetches and parses `https://dougmcarthur.net/2026-album/` server-side, then populates a custom HTML5 audio player. This avoids browser CORS issues when listing `.mp3` files from the remote directory.

Audio source base URLs are configurable through environment variables, so you can migrate storage to Cloudflare R2 without changing frontend code:

- `MAIN_AUDIO_BASE_URL` (defaults to `https://dougmcarthur.net/2026-album/`)
- `BSIDES_AUDIO_BASE_URL` (defaults to `https://dougmcarthur.net/mp3/b-sides/`)

Set these in Cloudflare Pages project environment variables (Production/Preview) or in `wrangler.toml` for local development.

## Deploy

Deploys automatically via [Cloudflare Pages](https://pages.cloudflare.com/) on push.

Cloudflare must treat this repo as a Pages project, not a Workers project.

Use these Pages settings:

- Framework preset: None
- Build command: leave empty
- Build output directory: `public`

If you use a custom deploy command, it must be:

```bash
npx wrangler pages deploy public
```

Do not use `npx wrangler deploy` for this repo. That is a Workers command and will fail in Cloudflare Pages.

To preview locally:

```bash
npm install
npm run dev
```

To deploy manually:

```bash
npm run deploy
```
