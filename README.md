# Team Fairy Tight — Clan Website

The official platform of **Team Fairy Tight (TFT)** — a gaming clan, team and community.
Members, games, events, news, media, achievements, applications, a member dashboard and a full
admin area, built to be extended rather than replaced.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Installation](#installation)
- [Development](#development)
- [Build](#build)
- [Database](#database)
- [Admin setup](#admin-setup)
- [Deployment on Cloudflare Pages](#deployment-on-cloudflare-pages)
- [Environment variables](#environment-variables)
- [Content model & the TBD system](#content-model--the-tbd-system)
- [Security](#security)
- [API](#api)
- [Design system](#design-system)
- [Future extensions](#future-extensions)

---

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Astro 5** (SSR) | Ships zero client JS by default — the whole site runs on ~2 KB of JavaScript. Interactive parts are opt-in. |
| Hosting | **Cloudflare Pages** + Pages Functions | Free tier, global CDN, SSR at the edge. |
| Database | **Cloudflare D1** (SQLite) | Free tier, same platform as the hosting, no extra service to run. |
| ORM | **Drizzle ORM** | Typed queries and generated SQL migrations; no runtime code generation. |
| Validation | **Zod** | One schema per form, reused by pages and the JSON API. |
| Styling | Plain CSS with **design tokens** | No build-time framework; the entire theme lives in `src/styles/tokens.css`. |
| Auth | Custom sessions on **WebCrypto** | PBKDF2-SHA256 works natively in Workers — no native modules, no third-party auth service. |

Everything in this stack has a free tier. Nothing requires a paid service.

---

## Project structure

```
src/
├── components/          Reusable UI (Button, Card, MemberCard, Navbar, Footer, …)
│   └── admin/           Admin-specific components
├── data/                Central configuration — the single source of truth
│   ├── site.config.mjs  Site name, URL, tagline
│   ├── clan.config.ts   Clan data, social links, join requirements
│   ├── navigation.ts    Main, footer and admin navigation
│   ├── ranks.ts         Rank hierarchy + XP levels
│   ├── permissions.ts   Roles and permissions (RBAC)
│   └── tbd.ts           TBD placeholder system
├── layouts/             BaseLayout, PageLayout, AuthLayout, DashboardLayout
├── lib/                 Framework-agnostic helpers (format, text, icons)
├── pages/               Routes (file-based)
│   ├── api/             JSON API
│   ├── admin/           Admin area
│   └── dashboard/       Member area
├── server/              Server-only code — never bundled into the client
│   ├── admin/           Resource registry + shared CRUD handling
│   ├── api/             API response helpers
│   ├── database/        Drizzle schema and D1 client
│   ├── security/        Password hashing, sessions, CSRF, rate limiting
│   ├── services/        Read layer (content, settings) and mappers
│   └── validation/      Zod schemas
├── styles/              tokens.css (theme) + global.css
├── types/               Shared domain types
└── middleware.ts        Session resolution, route guards, security headers

migrations/              Generated SQL migrations (Drizzle)
scripts/                 seed.sql, hash-password.mjs
```

---

## Installation

Requirements: **Node.js 20+** and npm.

```bash
git clone <repository-url>
cd SSO-Site
npm install
```

---

## Development

```bash
# 1. Create the local database and apply the schema
npm run db:migrate:local

# 2. Load seed data (ranks, categories, clearly marked demo rows)
npm run db:seed:local

# 3. Start the dev server
npm run dev            # http://localhost:4321
```

The dev server uses a local D1 database (`.wrangler/state`). Without a database the site still
renders — every page falls back to an honest empty state instead of failing.

Useful commands:

```bash
npm run check              # Astro + TypeScript check
npm run build              # type check + production build
npm run db:generate        # regenerate migrations after schema changes
npm run admin:hash -- "…"  # generate a password hash for the first admin
```

---

## Build

```bash
npm run build      # runs `astro check` first, then builds into ./dist
npm run preview    # serves the build through wrangler
```

---

## Database

The schema lives in `src/server/database/schema.ts` (Drizzle). Tables:

`users`, `sessions`, `rate_limits`, `ranks`, `members`, `social_links`, `games`, `member_games`,
`events`, `event_participants`, `news`, `news_categories`, `media`, `achievements`,
`achievement_members`, `applications`, `contact_messages`, `notifications`, `settings`.

After changing the schema:

```bash
npm run db:generate          # writes a new file to migrations/
npm run db:migrate:local     # apply locally
npm run db:migrate:remote    # apply to the Cloudflare database
```

Create the production database once:

```bash
npx wrangler d1 create tft-db
# paste the returned database_id into wrangler.toml
npm run db:migrate:remote
npx wrangler d1 execute tft-db --remote --file=./scripts/seed.sql
```

---

## Admin setup

There is no default account — one is created deliberately:

```bash
npm run admin:hash -- "your-very-secure-password"
```

The command prints a ready-made `INSERT` statement. Put your email address in and run it:

```bash
npx wrangler d1 execute tft-db --remote --command "INSERT INTO users (...) VALUES (...);"
```

Then sign in at `/login`. Roles and their permissions are defined in `src/data/permissions.ts`:

| Role | Permissions |
| --- | --- |
| `owner` | everything |
| `admin` | members, games, news, events, media, achievements, applications |
| `moderator` | news, events, media, applications |
| `member` / `user` | member area only |
| `guest` | public pages only |

---

## Deployment on Cloudflare Pages

1. **Create the database** and paste its `database_id` into `wrangler.toml` (see above).
2. **Connect the repository** in the Cloudflare dashboard → Workers & Pages → Create → Pages.
3. **Build settings:**
   - Build command: `npm run build:ci`
   - Output directory: `dist`
4. **Bindings** (Settings → Functions):
   - D1 database: variable name `DB` → `tft-db`
5. **Variables:**
   - `PUBLIC_SITE_URL` = your final URL (e.g. `https://teamfairytight.com`)
6. **Deploy.** Apply migrations against the remote database once (`npm run db:migrate:remote`).

Everything used here fits in Cloudflare's free tier: Pages (unlimited static requests, 100k
function requests/day) and D1 (5 GB storage, 5M row reads/day).

---

## Environment variables

| Name | Type | Purpose |
| --- | --- | --- |
| `PUBLIC_SITE_URL` | Variable | Canonical URL, used for SEO tags and the sitemap. |
| `DB` | D1 binding | The database. Without it the site runs read-only with empty states. |

No secrets are ever exposed to the browser: everything under `src/server/` runs server-side only.

---

## Content model & the TBD system

The site never invents clan data. Anything unconfirmed is a placeholder token in
`src/data/tbd.ts` (`DISCORD_URL_TBD`, `CLAN_DESCRIPTION_TBD`, …) and is rendered as a neutral
`—`, hidden entirely (social links), or shown as an explicit "not published yet" state.

- **Editable content** (clan description, history, rules, imprint, privacy, social links) lives in
  the `settings` table and is edited at `/admin/settings`. Database values override the defaults in
  `clan.config.ts`.
- **Demo rows** are flagged `is_demo = 1`, labelled **Demo** in the UI and announced by a banner, so
  they can never be mistaken for real clan data. Remove them when real content exists:

  ```sql
  DELETE FROM members WHERE is_demo = 1;
  DELETE FROM games WHERE is_demo = 1;
  DELETE FROM events WHERE is_demo = 1;
  DELETE FROM news WHERE is_demo = 1;
  DELETE FROM achievements WHERE is_demo = 1;
  ```

- **Ranks** are a configurable proposal, not a claim about ranks the clan uses. Edit them at
  `/admin/ranks`.

---

## Security

- **Passwords**: PBKDF2-HMAC-SHA256, 210 000 iterations, per-user salt, constant-time comparison.
- **Sessions**: random 256-bit tokens; only their SHA-256 digest is stored. Cookies are
  `HttpOnly`, `Secure`, `SameSite=Lax`, with a 14-day expiry that is enforced server-side.
- **CSRF**: double-submit token on every mutating form, plus an `Origin` check.
- **RBAC**: enforced in middleware *and* again in every admin page and API route.
- **Rate limiting**: D1-backed fixed windows on login, registration, applications and contact.
- **Input validation**: Zod on every write path; the API returns field-level errors.
- **XSS**: user content is escaped before any markup is added (`src/lib/text.ts`); no
  `innerHTML` of raw input anywhere.
- **SQL injection**: all queries go through Drizzle's parameter binding.
- **Headers**: CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `Cross-Origin-Opener-Policy` (see `src/middleware.ts`).
- **Bot protection**: honeypot fields on public forms, silently discarded.

---

## API

All endpoints return `{ ok: true, data }` or `{ ok: false, error: { code, message, fields? } }`.

| Endpoint | Method | Notes |
| --- | --- | --- |
| `/api/members` | GET | `rank`, `status`, `game`, `q`, `page`, `pageSize` |
| `/api/games` | GET | `status`, `platform`, `q` |
| `/api/events` | GET | `when=upcoming\|past`, `status`, `game`, `limit` |
| `/api/news` | GET | `category`, `q`, `page`, `pageSize` |
| `/api/media` | GET | `category`, `kind`, `limit` |
| `/api/achievements` | GET | — |
| `/api/search` | GET | `q` (min. 2 characters) |
| `/api/stats` | GET | Clan status tiles |
| `/api/applications` | GET | Requires `manage_applications` |
| `/api/applications` | POST | JSON application submission (rate limited) |
| `/api/events/:slug/participate` | POST | Form + CSRF, requires login |
| `/api/auth/session` | GET | Current session |
| `/api/auth/logout` | POST | Form + CSRF |

---

## Design system

All colours, spacing, typography, radii, shadows and motion are tokens in
`src/styles/tokens.css`. Changing the theme means changing that one file — no component hardcodes
a colour.

- Dark mode is the designed-for default; an optional light palette is defined via
  `:root[data-theme='light']`.
- `prefers-reduced-motion` disables every animation.
- Focus states, skip link, semantic landmarks, alt texts and ARIA labels throughout.
- Layout is mobile-first; verified at 390 / 820 / 1440 px with no horizontal scrolling.

---

## Future extensions

The architecture deliberately leaves room for:

- Discord OAuth and Steam login (the session layer is provider-agnostic)
- Discord widget / live server statistics
- Clan XP, levels and activity tracking (`members.xp` and `data/ranks.ts` already model this)
- Forum, chat, private messages, notifications (`notifications` table exists)
- Tournaments, clan wars, squads, matchmaking
- Game API integrations (Steam, Battle.net, Riot, Epic, Xbox, PlayStation)

New managed entities need **one entry** in `src/server/admin/resources.ts` — list, create, edit and
delete views are generated from it.
