# Deployment — Cloudflare Pages

Complete walkthrough from an empty Cloudflare account to a live site. Everything below fits in
Cloudflare's free tier.

**Time needed:** about 15 minutes.

---

## 0. Prerequisites

- A Cloudflare account (free) — <https://dash.cloudflare.com/sign-up>
- The repository pushed to GitHub
- Node.js 20+ locally

```bash
npm install
npx wrangler login      # opens a browser, authorises the CLI
```

---

## 1. Create the database

D1 is Cloudflare's SQLite. The free tier covers 5 GB storage and 5 million row reads per day.

```bash
npx wrangler d1 create tft-db
```

The command prints something like:

```
[[d1_databases]]
binding = "DB"
database_name = "tft-db"
database_id = "8f2c1e40-....-............"
```

**Copy the `database_id` into `wrangler.toml`**, replacing `PASTE_YOUR_D1_DATABASE_ID_HERE`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "tft-db"
database_id = "8f2c1e40-....-............"   # ← your id
migrations_dir = "migrations"
```

> **Why this matters:** `wrangler.toml` sets `pages_build_output_dir`, so Cloudflare Pages reads
> the project's bindings from this file and **ignores bindings configured in the dashboard**. An
> unreplaced placeholder means the deployment has no database.

Commit the change:

```bash
git add wrangler.toml && git commit -m "Add D1 database id" && git push
```

---

## 2. Create the schema and seed it

```bash
npx wrangler d1 migrations apply tft-db --remote
npx wrangler d1 execute tft-db --remote --file=./scripts/seed.sql
```

`--remote` targets the real Cloudflare database; without it you are working on the local copy used
by `npm run dev`.

The seed adds the rank hierarchy, news categories, the one confirmed member, and a handful of rows
flagged `is_demo` so the layout has something to show. Delete the demo rows once real content
exists (see README → Content model).

---

## 3. Create the Pages project

In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**, pick the
repository, then set:

| Setting | Value |
| --- | --- |
| Production branch | `main` (or the branch you deploy from) |
| Framework preset | None |
| Build command | `npm run build:ci` |
| Build output directory | `dist` |

`build:ci` runs the plain Astro build. The `npm run build` script additionally runs `astro check`,
which is what you want locally but only slows a deploy down.

Click **Save and Deploy**. The first build takes 1–2 minutes.

---

## 4. Create the first admin account

There is no default account. Generate a hash:

```bash
npm run admin:hash -- "a-long-password-you-choose"
```

It prints a ready-made `INSERT`. Put your own email address in and run it against the remote
database:

```bash
npx wrangler d1 execute tft-db --remote --command \
  "INSERT INTO users (id, email, email_normalized, password_hash, role) \
   VALUES ('usr_xxxxx', 'you@example.com', 'you@example.com', 'pbkdf2\$210000\$...', 'owner');"
```

`email_normalized` must be the lowercased email — that is the column the login looks up.

Then sign in at `https://<your-project>.pages.dev/login`.

---

## 5. Fill in the clan data

Everything the site still shows as `—` or "not published yet" is edited at **`/admin/settings`**:
Discord invite, clan description, history, values, goals, rules, imprint, privacy notice, social
links. Members, games, events, news, media and achievements have their own admin sections.

Nothing is invented: a field you leave empty stays an honest placeholder on the public site.

---

## 6. Custom domain (optional)

**Pages project → Custom domains → Set up a domain.** Cloudflare issues the TLS certificate
automatically.

Canonical URLs, Open Graph tags, the sitemap and the RSS feed derive from the origin of the
incoming request, so they follow the new domain with **no configuration change**. Only if you want
to pin them to one domain regardless of how the site is reached, add a **build** environment
variable in the Pages dashboard (Settings → Environment variables → Build):

```
PUBLIC_SITE_URL = https://teamfairytight.com
```

It must be a *build* variable, not a runtime `[vars]` entry — it is read while the site is built.

---

## Updating the site

Push to the production branch; Pages rebuilds automatically. Pull requests get their own preview
deployment.

After changing the database schema:

```bash
npm run db:generate            # writes a new file to migrations/
npm run db:migrate:local       # try it locally first
npm run db:migrate:remote      # then apply to production
```

---

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Build fails with `Invalid binding` or an unknown database | `database_id` in `wrangler.toml` is still the placeholder, or the id does not belong to this account. |
| Site loads, but everything is empty and `/admin` warns "No database bound" | The D1 binding is missing. Check the `[[d1_databases]]` block is committed and redeploy. |
| Site loads, all sections empty, logs show `no such table` | Migrations were not applied to the remote database: `npm run db:migrate:remote`. The site deliberately stays up and shows empty states rather than erroring. |
| Login says the password is wrong although it is right | `email_normalized` is not the lowercased email, or the hash was copied with a line break. |
| Canonical URLs point at `pages.dev` on a custom domain | Only happens if `PUBLIC_SITE_URL` is set to the old value — unset it or correct it. |

---

## Cost

| Service | Free tier | This project |
| --- | --- | --- |
| Pages (static) | Unlimited requests | All assets |
| Pages Functions | 100 000 requests/day | SSR for every page |
| D1 | 5 GB, 5 M row reads/day | The whole database |

A clan site sits far inside these limits. No paid service is required.
