# Deployment — Cloudflare Workers

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

> **Why this matters:** Cloudflare reads the Worker's bindings from `wrangler.toml`, so an
> unreplaced placeholder means the deployment has no database. The site stays up in that case,
> but every section renders empty.

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

## 3. Create the Workers project

In the Cloudflare dashboard: **Workers & Pages → Create → Workers → Import a repository**, pick
the repository, then set:

| Setting | Value |
| --- | --- |
| Production branch | `main` (or the branch you deploy from) |
| **Build command** | `npm run build:ci` |
| **Deploy command** | `npx wrangler deploy` |

> **Both commands matter.** Workers Builds runs the deploy command even when no build command is
> set — and `wrangler deploy` then fails with *"Missing entry-point to Worker script"*, because
> `dist/` was never produced. If you would rather configure only one field, leave the build
> command empty and set the **deploy command to `npm run deploy`**, which builds and deploys in
> one step.

Click **Deploy**. The first build takes 1–2 minutes.

The site deploys as a Worker with static assets: `dist/_worker.js/index.js` handles SSR, and
everything else in `dist/` is served from the CDN. `public/.assetsignore` keeps the compiled
server bundle out of the public asset directory — without it, everything under `src/server/`
would be downloadable from the live site.

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

Then sign in at `https://<your-worker>.workers.dev/login`.

---

## 5. Fill in the clan data

Everything the site still shows as `—` or "not published yet" is edited at **`/admin/settings`**:
Discord invite, clan description, history, values, goals, rules, imprint, privacy notice, social
links. Members, games, events, news, media and achievements have their own admin sections.

Nothing is invented: a field you leave empty stays an honest placeholder on the public site.

---

## 6. Custom domain (optional)

**Worker → Settings → Domains & Routes → Add custom domain.** Cloudflare issues the TLS
certificate automatically.

Canonical URLs, Open Graph tags, the sitemap and the RSS feed derive from the origin of the
incoming request, so they follow the new domain with **no configuration change**. Only if you want
to pin them to one domain regardless of how the site is reached, add a **build** environment
variable in the Worker's build settings (Settings → Build → Variables):

```
PUBLIC_SITE_URL = https://teamfairytight.com
```

It must be a *build* variable, not a runtime `[vars]` entry — it is read while the site is built.

---

## Updating the site

Push to the production branch; Workers Builds rebuilds automatically.

To deploy by hand from your machine:

```bash
npm run deploy        # builds, then runs wrangler deploy
```

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
| `Missing entry-point to Worker script or to assets directory` | The build command did not run, so `dist/` does not exist. Set the build command to `npm run build:ci`, or the deploy command to `npm run deploy`. |
| `It seems that you have run wrangler deploy on a Pages project` | Left over from a Pages-style config. This repo deploys as a Worker; make sure `wrangler.toml` has `main` and `[assets]` and no `pages_build_output_dir`. |
| `Uploading a Pages _worker.js directory as an asset` | `public/.assetsignore` is missing. It must contain `_worker.js`, otherwise the server bundle is published. |
| Build fails with `Invalid binding` or an unknown database | `database_id` in `wrangler.toml` is still the placeholder, or the id does not belong to this account. |
| Site loads, but everything is empty and `/admin` warns "No database bound" | The D1 binding is missing. Check the `[[d1_databases]]` block is committed and redeploy. |
| Site loads, all sections empty, logs show `no such table` | Migrations were not applied to the remote database: `npm run db:migrate:remote`. The site deliberately stays up and shows empty states rather than erroring. |
| Login says the password is wrong although it is right | `email_normalized` is not the lowercased email, or the hash was copied with a line break. |
| Canonical URLs point at `workers.dev` on a custom domain | Only happens if `PUBLIC_SITE_URL` is set to the old value — unset it or correct it. |

---

## Cost

| Service | Free tier | This project |
| --- | --- | --- |
| Workers static assets | Unlimited requests | CSS, icons, images |
| Workers requests | 100 000 requests/day | SSR for every page |
| D1 | 5 GB, 5 M row reads/day | The whole database |

A clan site sits far inside these limits. No paid service is required.
