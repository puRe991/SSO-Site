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

## 1. The database is optional to start with

The D1 binding is **commented out** in `wrangler.toml`, so the first deploy needs no database at
all. The site comes up and every page renders its empty state.

What works without a database: all public pages, navigation, search (empty), the sitemap, the RSS
feed, the legal pages. What does not: login, the member dashboard, the admin area, applications
and the contact form — each says so plainly instead of pretending to work.

Verified on the Workers runtime with no binding present: 23 of 23 routes return 200.

Skip ahead to step 2 if you just want the site live. To switch the database on, see
[Adding the database](#adding-the-database) below — it takes about two minutes and can be done at
any time.

## 2. Create the Workers project

In the Cloudflare dashboard: **Workers & Pages → Create → Workers → Import a repository**, pick
the repository, then set:

| Setting | Value |
| --- | --- |
| Production branch | `main` (or the branch you deploy from) |
| **Build command** | `npm run build:ci` |
| **Deploy command** | `npx wrangler deploy --config wrangler.toml` |

> **Both details matter.**
>
> *The build command:* Workers Builds runs the deploy command even when no build command is set,
> and `wrangler deploy` then fails with *"Missing entry-point to Worker script"* because `dist/`
> was never produced.
>
> *The `--config` flag:* optional, but it turns a confusing failure into a clear one. Without it,
> a `wrangler.toml` that still declares `pages_build_output_dir` only produces a warning, the
> confirmation prompt is auto-answered in CI, and the deploy then fails with the unrelated-looking
> *"Missing entry-point to Worker script"*. With `--config`, the same situation fails immediately
> with *"It looks like you've run a Workers-specific command in a Pages project."*
>
> If you would rather configure only one field, leave the build command empty and set the
> **deploy command to `npm run deploy`**, which does both with the flag already in place.

Click **Deploy**. The first build takes 1–2 minutes.

The site deploys as a Worker with static assets: `dist/_worker.js/index.js` handles SSR, and
everything else in `dist/` is served from the CDN. `public/.assetsignore` keeps the compiled
server bundle out of the public asset directory — without it, everything under `src/server/`
would be downloadable from the live site.

## 3. Fill in the clan data

This needs the database (see [Adding the database](#adding-the-database)) — the admin area is
where the content lives.

Everything the site shows as `—` or "not published yet" is edited at **`/admin/settings`**:
Discord invite, clan description, history, values, goals, rules, imprint, privacy notice, social
links. Members, games, events, news, media and achievements have their own admin sections.

Nothing is invented: a field you leave empty stays an honest placeholder on the public site.

---

## 4. Custom domain (optional)

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

## Adding the database

Everything above works without D1. This section turns on logins, the admin area, applications and
all managed content.

**1. Create the database.** Either in the dashboard (Storage & Databases → D1 → Create) or:

```bash
npx wrangler login
npx wrangler d1 create tft-db
```

It prints a `database_id`.

**2. Enable the binding.** In `wrangler.toml`, uncomment the four `[[d1_databases]]` lines and
paste the id:

```toml
[[d1_databases]]
binding = "DB"
database_name = "tft-db"
database_id = "8f2c1e40-....-............"   # ← your id
migrations_dir = "migrations"
```

A binding with the placeholder id fails the whole deployment with
`binding DB of type d1 must have a valid database_id specified [10021]`, which is why it ships
commented out.

**3. Create the schema and seed it.**

```bash
npx wrangler d1 migrations apply tft-db --remote
npx wrangler d1 execute tft-db --remote --file=./scripts/seed.sql
```

`--remote` targets the real Cloudflare database; without it you are working on the local copy used
by `npm run dev`.

**4. Create the first admin account.** There is no default account.

```bash
npm run admin:hash -- "a-long-password-you-choose"
```

It prints a ready-made `INSERT`. Put your own email address in and run it:

```bash
npx wrangler d1 execute tft-db --remote --command "INSERT INTO users (...) VALUES (...);"
```

`email_normalized` must be the lowercased email — that is the column the login looks up.

**5. Commit and push.** The next build deploys with the database attached; sign in at
`/login` and fill in the clan data at `/admin/settings`.

## Updating the site

Push to the production branch; Workers Builds rebuilds automatically.

To deploy by hand from your machine:

```bash
npm run deploy        # builds, then deploys with an explicit --config
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
| `binding DB of type d1 must have a valid database_id specified [code: 10021]` | The `database_id` in `wrangler.toml` is still the placeholder. Run `npx wrangler d1 create tft-db` (step 1 of this guide) and commit the real id. Everything else in the deploy already works at this point. |
| `Failed to match Worker name … expected "sso-site"` | The `name` in `wrangler.toml` differs from the Worker in Cloudflare. Workers Builds overrides it and opens a PR to correct it; set `name` to match instead. |
| `Missing entry-point to Worker script or to assets directory` | Either `dist/` does not exist (the build command did not run — set it to `npm run build:ci`), or the build checked out a commit whose `wrangler.toml` still has `pages_build_output_dir` and no `main`. |
| `It seems that you have run wrangler deploy on a Pages project` | The **loaded** `wrangler.toml` contains `pages_build_output_dir`. It is not about Astro or the adapter: with the Workers config in this repo the message does not appear. If you see it, the build is using an older commit — check which commit the build cloned. |
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
