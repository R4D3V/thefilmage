# The Filmage — website & admin

Astro 7 · TypeScript (strict) · Tailwind 4 · Neon PostgreSQL · Drizzle ORM · Cloudinary · Cloudflare · GSAP (reveal animations only)

Public site: `/`, `/services`, `/work`, `/work/:slug`, `/about`, `/contact`.
Admin: `/admin` (dashboard, projects, services, testimonials, messages, settings).

---

## 1. Local setup

```bash
npm install
cp .env.example .env            # used by drizzle-kit and the scripts
cp .dev.vars.example .dev.vars  # used by `npm run dev` (Cloudflare runtime)
```

Fill **both** files with the same values (see section 4), then:

```bash
npm run db:generate   # create SQL migration from src/db/schema.ts (first time / after schema edits)
npm run db:migrate    # apply migrations to Neon
npm run db:seed       # categories, the 5 services from the business card, default settings
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='at-least-12-characters' npm run admin:create
npm run dev
```

Open `http://localhost:4321/admin/login`. After creating the admin, delete `ADMIN_PASSWORD` from `.env`.

> The session cookie is `Secure`. Browsers treat `http://localhost` as secure, so it works locally; on other
> HTTP hosts (e.g. a LAN IP) login will not stick — use `localhost` or HTTPS.

Scripts: `dev`, `build`, `preview`, `lint`, `format`, `typecheck`, `db:generate`, `db:migrate`, `db:studio`, `db:seed`, `admin:create`.

## 2. Neon database

1. Sign up at neon.com → **New project** (pick a region close to your Cloudflare audience; Uganda → Europe/Frankfurt is usually the closest).
2. Dashboard → **Connect** → copy the **pooled** connection string (host contains `-pooler`). It looks like
   `postgresql://user:pass@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require`.
3. Put it in `DATABASE_URL`.

## 3. Cloudinary

1. Sign up at cloudinary.com. From **Dashboard → Product Environment Credentials** copy *Cloud name*, *API key*, *API secret*.
2. (Recommended) **Settings → Security**: leave "Resource list" restricted; no unsigned upload presets are needed — all uploads are server-signed.
3. Uploads land in `filmage/projects`, `filmage/services`, `filmage/testimonials`, `filmage/settings`.
4. Images are delivered with `f_auto,q_auto` (AVIF/WebP automatically) at responsive widths; videos get a poster frame and
   are `preload="none"` so nothing large downloads until played.

## 4. Environment variables

| Variable | Where | Notes |
|---|---|---|
| `DATABASE_URL` | secret | Neon pooled string |
| `CLOUDINARY_CLOUD_NAME` | secret/var | public in delivery URLs anyway |
| `CLOUDINARY_API_KEY` | secret | |
| `CLOUDINARY_API_SECRET` | **secret** | server only; never reaches the browser |
| `AUTH_SECRET` | **secret** | `openssl rand -base64 48`; changing it logs everyone out |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | local only | read only by `npm run admin:create` |

Real `.env` / `.dev.vars` are git-ignored. Never commit them.

## 5. Deploy to Cloudflare

**Pages vs Workers.** Cloudflare now recommends *Workers (with static assets)* for new projects, and `@astrojs/cloudflare`
builds for it by default (`dist/server/wrangler.json` is generated). It lives under the same **Workers & Pages** area of the
dashboard and gives the same result: global CDN, your custom domain, git-based deploys. This repo is configured for that.
Classic Pages Functions need manual extra config in current Astro versions, so use Workers unless you have a reason not to.

### Option A — connect GitHub (recommended)
1. Push this folder to a GitHub repo.
2. Cloudflare dashboard → **Workers & Pages → Create → Import a repository**.
3. Build command: `npm run build` · Deploy command: `npx wrangler deploy`.
4. **Settings → Variables and Secrets**: add the five variables from section 4 (use *Secret* type for the sensitive ones).
5. Deploy.

### Option B — from your machine
```bash
npx wrangler login
npm run build
npx wrangler secret put DATABASE_URL            # repeat for each secret in section 4
npx wrangler secret put CLOUDINARY_API_SECRET
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_CLOUD_NAME
npx wrangler secret put AUTH_SECRET
npx wrangler deploy
```
(Run `wrangler deploy` once first if the Worker doesn't exist yet, then add the secrets.)

Notes: the adapter also declares a `SESSION` KV binding and an `IMAGES` binding; this app doesn't use them (auth is
cookie-based), and Wrangler provisions KV automatically. They can be ignored.

### Custom domain
Worker → **Settings → Domains & Routes → Add → Custom domain** → `thefilmage.com` (the domain's DNS must be on Cloudflare;
otherwise add the domain to Cloudflare first and switch nameservers at the registrar).
Then set `site` in `astro.config.mjs` to the real domain (sitemap, canonical URLs and Open Graph use it) and redeploy.

### First production admin
Run migrations and `admin:create` from your machine with `DATABASE_URL` pointed at the production Neon database (the same
database the deployed site uses). Then sign in at `https://your-domain/admin/login`.

## 6. After first login — content checklist
1. **Settings**: logo, favicon, OG image, hero video, WhatsApp number (digits only, with country code, e.g. `2567…`), social URLs,
   About text, team (`Name | Role` per line), stats (`150+ | Projects delivered` per line).
2. **Projects**: upload cover + gallery, choose a category, tick *Published*; tick *Featured* to show it on the home page.
3. **Testimonials**: add and publish.
4. Send a test message from `/contact` and confirm it appears in **Messages**.

## 7. Architecture
```
src/
  components/   Header, Footer, ProjectCard, Uploader (admin), Motion (GSAP)
  layouts/      Base (public SEO shell), Admin
  pages/        public pages · admin/* · api/admin/sign-upload.ts · robots.txt.ts
  db/           schema.ts (tables, FKs, indexes) · client.ts (Neon + Drizzle)
  lib/          env, password (PBKDF2), session (HMAC cookie), cloudinary, validation (zod), ratelimit, admin helpers, settings
  middleware.ts auth gate for /admin and /api/admin + security headers
scripts/        seed.ts, create-admin.ts
```
All pages are server-rendered on demand (they read live content from Neon). Public pages ship no framework JS; GSAP is
loaded only on pages with reveal elements and only when the visitor has not requested reduced motion.

## 8. Security summary
- Passwords: PBKDF2-SHA256 (100k iterations, per-user salt); sessions: HMAC-signed, `HttpOnly`, `Secure`, `SameSite=Strict`, 7 days.
- Every `/admin` page and `/api/admin` route is checked in middleware against the database user.
- Forms are protected by Astro's origin check (`security.checkOrigin`) plus `SameSite=Strict`.
- Contact form: zod validation, control-character stripping, honeypot, 5 messages/hour per IP (IP stored only as a hash).
- Uploads: server-signed, allowed formats enforced by Cloudinary, saved IDs must be inside `filmage/`.
- Output is escaped by Astro; secrets are only read server-side.

## 9. Known limitations / production considerations
- **Login rate limiting is not implemented** (the contact form's is). Add Cloudflare WAF rate limiting on `/admin/login`
  (Security → WAF → Rate limiting rules) or reuse `src/lib/ratelimit.ts` in the login page.
- **Upload size limits are enforced in the browser only.** Set limits in Cloudinary (Settings → Upload) for real enforcement.
- Single admin role; no password-reset flow (re-run `admin:create` with a new password).
- Contact messages are stored only; there is no email notification. Check **Messages** or add a mail provider later.
- Categories are managed by seed/DB (`npm run db:studio`); there is no admin screen for them yet.
- Drag-and-drop reordering is up/down buttons.
- Deleting from the admin removes the Cloudinary assets too — that is irreversible.
- Not yet tested against live Neon/Cloudinary/Cloudflare accounts in the environment this was written in; do the checklist in
  section 6 on a preview deployment first.
- Neon free-tier databases sleep when idle; the first request after a pause can take about a second.
