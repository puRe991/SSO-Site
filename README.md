# Fairy Tight — Website des Reitclubs

Die Plattform des Reitclubs **Fairy Tight (FT)** in Star Stable Online — Team und Community.
Mitglieder, Disziplinen, Termine, Neuigkeiten, Galerie, Erfolge, Bewerbungen, ein
Mitgliederbereich und ein vollständiger Adminbereich, gebaut zum Erweitern statt zum Ersetzen.

---

## Inhalt

- [Technik](#technik)
- [Projektstruktur](#projektstruktur)
- [Installation](#installation)
- [Entwicklung](#entwicklung)
- [Build](#build)
- [Datenbank](#datenbank)
- [Admin einrichten](#admin-einrichten)
- [Deployment auf Cloudflare Workers](#deployment-auf-cloudflare-workers)
- [Umgebungsvariablen](#umgebungsvariablen)
- [Inhaltsmodell & das TBD-System](#inhaltsmodell--das-tbd-system)
- [Sicherheit](#sicherheit)
- [API](#api)
- [Designsystem](#designsystem)
- [Sprache](#sprache)
- [Mögliche Erweiterungen](#mögliche-erweiterungen)

---

## Technik

| Ebene | Wahl | Warum |
| --- | --- | --- |
| Framework | **Astro 5** (SSR) | Liefert standardmäßig null Client-JS — die ganze Seite läuft auf ~2 KB JavaScript. Interaktives wird bewusst dazugeholt. |
| Hosting | **Cloudflare Workers** mit statischen Assets | Kostenloses Kontingent, weltweites CDN, SSR direkt an der Edge. |
| Datenbank | **Cloudflare D1** (SQLite) | Kostenloses Kontingent, gleiche Plattform wie das Hosting, kein zusätzlicher Dienst. |
| ORM | **Drizzle ORM** | Typisierte Abfragen und generierte SQL-Migrationen, keine Codegenerierung zur Laufzeit. |
| Validierung | **Zod** | Ein Schema pro Formular, von Seiten und JSON-API gemeinsam genutzt. |
| Styling | Reines CSS mit **Design-Tokens** | Kein CSS-Framework; das gesamte Theme steht in `src/styles/tokens.css`. |
| Schriften | **Fraunces** + **Nunito**, selbst gehostet | Variable Fonts unter der SIL Open Font License, ausgeliefert aus `public/fonts` — keine Google-CDN-Requests. |
| Auth | Eigene Sessions auf **WebCrypto** | PBKDF2-SHA256 läuft nativ in Workers — keine nativen Module, kein fremder Auth-Dienst. |

Jede Komponente dieses Stacks hat ein kostenloses Kontingent. Nichts davon setzt einen
kostenpflichtigen Dienst voraus.

---

## Projektstruktur

```
src/
├── components/          Wiederverwendbare UI (Button, Card, MemberCard, Navbar, Footer, …)
│   └── admin/           Admin-spezifische Komponenten
├── data/                Zentrale Konfiguration — die eine Quelle der Wahrheit
│   ├── site.config.mjs  Seitenname, URL, Claim
│   ├── clan.config.ts   Clubdaten, Social Links, Aufnahmebedingungen
│   ├── navigation.ts    Haupt-, Footer- und Adminnavigation
│   ├── ranks.ts         Rangordnung + XP-Stufen
│   ├── permissions.ts   Rollen und Rechte (RBAC)
│   └── tbd.ts           TBD-Platzhaltersystem
├── layouts/             BaseLayout, PageLayout, AuthLayout, DashboardLayout
├── lib/                 Framework-unabhängige Helfer (format, text, icons, labels)
├── pages/               Routen (dateibasiert)
│   ├── api/             JSON-API
│   ├── admin/           Adminbereich
│   └── dashboard/       Mitgliederbereich
├── server/              Nur serverseitiger Code — landet nie im Client-Bundle
│   ├── admin/           Ressourcen-Register + gemeinsames CRUD
│   ├── api/             Helfer für API-Antworten
│   ├── database/        Drizzle-Schema und D1-Client
│   ├── security/        Passwort-Hashing, Sessions, CSRF, Rate Limiting
│   ├── services/        Leseschicht (Inhalte, Einstellungen) und Mapper
│   └── validation/      Zod-Schemata
├── styles/              tokens.css (Theme), fonts.css (@font-face) + global.css
├── types/               Gemeinsame Domänentypen
└── middleware.ts        Session-Auflösung, Routen-Schutz, Security-Header

migrations/              Generierte SQL-Migrationen (Drizzle)
public/fonts/            Selbst gehostete Schriften (woff2) + Lizenzhinweis
scripts/                 seed.sql, hash-password.mjs
```

---

## Installation

Voraussetzungen: **Node.js 20+** und npm.

```bash
git clone <repository-url>
cd SSO-Site
npm install
```

---

## Entwicklung

```bash
# 1. Lokale Datenbank anlegen und Schema anwenden
npm run db:migrate:local

# 2. Startdaten laden (Ränge, Kategorien, klar markierte Demo-Zeilen)
npm run db:seed:local

# 3. Entwicklungsserver starten
npm run dev            # http://localhost:4321
```

Der Entwicklungsserver nutzt eine lokale D1-Datenbank (`.wrangler/state`). Auch ohne Datenbank
rendert die Seite — jede Seite fällt dann auf einen ehrlichen Leerzustand zurück, statt
abzustürzen.

Nützliche Befehle:

```bash
npm run check              # Astro- und TypeScript-Prüfung
npm run build              # Typprüfung + Produktions-Build
npm run db:generate        # Migrationen nach Schemaänderungen neu erzeugen
npm run admin:hash -- "…"  # Passwort-Hash für den ersten Admin erzeugen
```

---

## Build

```bash
npm run build      # führt erst `astro check` aus, baut dann nach ./dist
npm run preview    # serviert den gebauten Worker lokal über wrangler (workerd + lokales D1)
```

---

## Datenbank

Das Schema steht in `src/server/database/schema.ts` (Drizzle). Tabellen:

`users`, `sessions`, `rate_limits`, `ranks`, `members`, `social_links`, `games`, `member_games`,
`events`, `event_participants`, `news`, `news_categories`, `media`, `achievements`,
`achievement_members`, `applications`, `contact_messages`, `notifications`, `settings`.

Die Tabellen- und Spaltennamen bleiben bewusst englisch (`games`, `events`, `status = 'upcoming'`),
damit Datenbank, API und Filter-URLs stabil bleiben. Übersetzt wird erst bei der Ausgabe, zentral
in `src/lib/labels.ts`. Aus `games` werden dort die **Disziplinen** des Clubs.

Nach einer Schemaänderung:

```bash
npm run db:generate          # schreibt eine neue Datei nach migrations/
npm run db:migrate:local     # lokal anwenden
npm run db:migrate:remote    # auf der Cloudflare-Datenbank anwenden
```

Die Produktionsdatenbank einmalig anlegen:

```bash
npx wrangler d1 create tft-db
# die zurückgegebene database_id in wrangler.toml eintragen
npm run db:migrate:remote
npx wrangler d1 execute tft-db --remote --file=./scripts/seed.sql
```

> Der Datenbankname `tft-db` stammt noch aus der Zeit vor der Umbenennung. Er ist nur ein
> Cloudflare-Ressourcenname und taucht nirgends auf der Seite auf. Wer ihn ändern möchte, passt
> ihn in `package.json` (die drei `db:`-Skripte) und in `wrangler.toml` an — am besten **bevor**
> die Datenbank angelegt wird.

---

## Admin einrichten

Es gibt kein Standardkonto — eines wird bewusst angelegt:

```bash
npm run admin:hash -- "dein-sehr-sicheres-passwort"
```

Der Befehl gibt ein fertiges `INSERT`-Statement aus. Eigene E-Mail-Adresse eintragen und ausführen:

```bash
npx wrangler d1 execute tft-db --remote --command "INSERT INTO users (...) VALUES (...);"
```

Danach unter `/login` anmelden. Rollen und ihre Rechte stehen in `src/data/permissions.ts`:

| Rolle | Rechte |
| --- | --- |
| `owner` | alles |
| `admin` | Mitglieder, Disziplinen, Neuigkeiten, Termine, Galerie, Erfolge, Bewerbungen |
| `moderator` | Neuigkeiten, Termine, Galerie, Bewerbungen |
| `member` / `user` | nur der Mitgliederbereich |
| `guest` | nur die öffentlichen Seiten |

---

## Deployment auf Cloudflare Workers

**Ausführliche Anleitung: [DEPLOYMENT.md](./DEPLOYMENT.md).** Kurzfassung:

Die D1-Bindung ist in `wrangler.toml` **auskommentiert**, das erste Deployment braucht also noch
keine Datenbank:

```bash
npm run deploy        # baut und deployt
```

Die Seite geht online und zeigt überall Leerzustände. Anmeldung, Mitgliederbereich, Adminbereich,
Bewerbungen und Kontaktformular bleiben aus, solange es keine Datenbank gibt — und sagen das auch.
Wie D1 später dazukommt, steht in
[DEPLOYMENT.md → Adding the database](./DEPLOYMENT.md#adding-the-database).

Für Continuous Deployment das Repository unter Workers & Pages importieren und setzen:

- Build-Befehl: `npm run build:ci`
- Deploy-Befehl: `npx wrangler deploy --config wrangler.toml`

(Oder den Build-Befehl leer lassen und `npm run deploy` als Deploy-Befehl nehmen — das macht beides.)

Der Schalter `--config` ist optional, aber empfehlenswert: Damit scheitert eine veraltete oder
falsche Konfiguration sofort mit einer klaren Meldung, statt erst zu warnen und dann mit dem
irreführenden *„Missing entry-point to Worker script"* abzubrechen.

Die Seite läuft als Worker mit statischen Assets: `dist/_worker.js/index.js` liefert das SSR, der
Rest von `dist/` kommt aus dem CDN, und `public/.assetsignore` verhindert, dass das Server-Bundle
öffentlich ausgeliefert wird. Die Bindungen kommen aus `wrangler.toml`, die dortige `database_id`
muss also echt sein.

Alles passt in das kostenlose Kontingent: 100k Worker-Requests pro Tag, unbegrenzte Requests auf
statische Assets, D1 mit 5 GB und 5 Mio. Zeilenlesungen pro Tag.

## Umgebungsvariablen

| Name | Typ | Zweck |
| --- | --- | --- |
| `DB` | D1-Bindung (`wrangler.toml`), optional | Die Datenbank. Standardmäßig auskommentiert; ohne sie rendert die Seite trotzdem und fällt überall auf Leerzustände zurück. |
| `ASSETS` | Assets-Bindung (`wrangler.toml`) | Statische Dateien, von Workers Assets verdrahtet. |
| `PUBLIC_SITE_URL` | **Build**-Variable, optional | Heftet Canonical- und OG-URLs an eine Domain. Ohne sie nutzt die Seite den Origin der eingehenden Anfrage — auf `workers.dev`, in Previews und auf einer eigenen Domain ist das bereits korrekt. |

Es gelangen keine Geheimnisse in den Browser: Alles unter `src/server/` läuft ausschließlich
serverseitig.

---

## Inhaltsmodell & das TBD-System

Die Seite erfindet keine Clubdaten. Alles Unbestätigte ist ein Platzhalter-Token in
`src/data/tbd.ts` (`DISCORD_URL_TBD`, `CLAN_DESCRIPTION_TBD`, …) und wird als neutrales `—`
ausgegeben, ganz versteckt (Social Links) oder als ausdrückliches „noch nicht veröffentlicht"
dargestellt.

- **Bearbeitbare Inhalte** (Clubbeschreibung, Geschichte, Regeln, Impressum, Datenschutz, Social
  Links) liegen in der Tabelle `settings` und werden unter `/admin/settings` gepflegt. Werte aus
  der Datenbank gehen den Vorgaben in `clan.config.ts` vor.
- **Demo-Zeilen** tragen `is_demo = 1`, sind in der Oberfläche mit **Demo** gekennzeichnet und
  werden durch einen Hinweis angekündigt — sie können also nie für echte Clubdaten gehalten
  werden. Wenn echte Inhalte da sind, einfach löschen:

  ```sql
  DELETE FROM members WHERE is_demo = 1;
  DELETE FROM games WHERE is_demo = 1;
  DELETE FROM events WHERE is_demo = 1;
  DELETE FROM news WHERE is_demo = 1;
  DELETE FROM achievements WHERE is_demo = 1;
  ```

- **Ränge** sind ein änderbarer Vorschlag, keine Behauptung über die Ränge des Clubs. Sie werden
  unter `/admin/ranks` bearbeitet.

---

## Sicherheit

- **Passwörter**: PBKDF2-HMAC-SHA256, 210 000 Iterationen, Salt pro Nutzer, Vergleich in
  konstanter Zeit.
- **Sessions**: zufällige 256-Bit-Tokens; gespeichert wird nur deren SHA-256-Digest. Cookies sind
  `HttpOnly`, `Secure`, `SameSite=Lax` und laufen nach 14 Tagen ab — serverseitig durchgesetzt.
- **CSRF**: Double-Submit-Token in jedem schreibenden Formular, dazu eine `Origin`-Prüfung.
- **RBAC**: durchgesetzt in der Middleware *und* noch einmal in jeder Adminseite und API-Route.
- **Rate Limiting**: feste Zeitfenster in D1 für Login, Registrierung, Bewerbungen und Kontakt.
- **Eingabeprüfung**: Zod auf jedem Schreibpfad; die API liefert Fehler pro Feld. Die deutschen
  Standardmeldungen kommen aus Zods eingebauter Locale (`z.config(z.locales.de())`).
- **XSS**: Nutzerinhalte werden maskiert, bevor Markup dazukommt (`src/lib/text.ts`); nirgends
  `innerHTML` mit ungeprüften Eingaben.
- **SQL-Injection**: alle Abfragen laufen über die Parameterbindung von Drizzle.
- **Header**: CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `Cross-Origin-Opener-Policy` (siehe `src/middleware.ts`).
- **Bot-Schutz**: Honeypot-Felder in den öffentlichen Formularen, still verworfen.
- **Datensparsamkeit**: keine Requests an Dritte. Schriften werden selbst ausgeliefert, die CSP
  erlaubt `font-src 'self'`.
- **Verfügbarkeit**: jeder öffentliche Lesezugriff fällt auf seinen Leerzustand zurück, wenn die
  Datenbank nicht erreichbar ist oder gerade migriert wird — ein Datenbankproblem legt die Seite
  also nie lahm (`safeRead` in `server/services/content.ts`).

---

## API

Alle Endpunkte antworten mit `{ ok: true, data }` oder
`{ ok: false, error: { code, message, fields? } }`.

| Endpunkt | Methode | Hinweise |
| --- | --- | --- |
| `/api/members` | GET | `rank`, `status`, `game`, `q`, `page`, `pageSize` |
| `/api/games` | GET | `status`, `platform`, `q` |
| `/api/events` | GET | `when=upcoming\|past`, `status`, `game`, `limit` |
| `/api/news` | GET | `category`, `q`, `page`, `pageSize` |
| `/api/media` | GET | `category`, `kind`, `limit` |
| `/api/achievements` | GET | — |
| `/api/search` | GET | `q` (mind. 2 Zeichen) |
| `/api/stats` | GET | Kacheln mit dem Clubstatus |
| `/api/applications` | GET | benötigt `manage_applications` |
| `/api/applications` | POST | Bewerbung als JSON (mit Rate Limit) |
| `/api/events/:slug/participate` | POST | Formular + CSRF, Anmeldung nötig |
| `/api/auth/session` | GET | aktuelle Session |
| `/api/auth/logout` | POST | Formular + CSRF |

Die `code`-Werte bleiben stabil und englisch, die `message` ist deutsch.

---

## Designsystem

Alle Farben, Abstände, Typografie, Radien, Schatten und Bewegungen sind Tokens in
`src/styles/tokens.css`. Das Theme ändern heißt: diese eine Datei ändern — keine Komponente
kodiert eine Farbe fest.

**Farbwelt.** Tiefes Waldgrün als Grund, warmes Gold als Leitfarbe, Pergament für Text, Sattelbraun
und ein weiches Himmelstürkis als Gegenstimmen — ein Bild von Wald, Abendlicht und Sattelkammer,
nicht von Neon.

| Rolle | Token | Dunkel (Standard) |
| --- | --- | --- |
| Grund | `--background` | `#0a1a17` |
| Fläche | `--surface` | `#132a24` |
| Text | `--text` | `#f6efe1` |
| Leitfarbe | `--primary` | `--gold-500` `#e0a32a` |
| Zweitfarbe | `--secondary` | `--pine-500` `#2c806d` |
| Akzent | `--accent` | `--sky-400` `#6fc7d8` |
| Links | `--link` | `--gold-300` `#ffd98a` |

**Typografie.** `--font-display` ist **Fraunces** (warme Antiqua, Überschriften, Logo, Buttons),
`--font-body` ist **Nunito** (rund und freundlich, Fließtext und UI). Beide sind Variable Fonts
unter der SIL Open Font License und liegen in `public/fonts` — siehe `public/fonts/README.md`.

**Marke.** Das Logo ist ein selbst gezeichnetes Hufeisen im Ring (`src/components/Logo.astro`),
dieselbe Form in `public/favicon.svg` und auf der Social Card `public/og.svg`. Es wird kein
Spiellogo und keine fremde Grafik verwendet. Sobald es ein echtes Clublogo gibt: Datei nach
`public/` legen und in `Logo.astro` einbinden — damit zieht die ganze Seite auf einmal nach.

Außerdem:

- Dunkel ist der gestaltete Standard; ein warmes Pergament-Thema liegt unter
  `:root[data-theme='light']` bereit.
- `prefers-reduced-motion` schaltet jede Animation ab.
- Fokuszustände, Skip-Link, semantische Landmarks, Alt-Texte und ARIA-Label durchgehend.
- Das Layout ist mobile-first; geprüft bei 390 / 820 / 1440 px, ohne horizontales Scrollen.

---

## Sprache

Die gesamte Oberfläche ist deutsch (`siteConfig.locale = 'de'`, `<html lang="de">`), ebenso Datums-
und Zahlenformate (`Intl` in `src/lib/format.ts`) und die Validierungsmeldungen.

Bewusst **nicht** übersetzt sind die technischen Bezeichner: Routen (`/members`, `/events`),
Tabellen- und Spaltennamen, Status-Werte in der Datenbank, Rollen-IDs und API-Fehlercodes. Sie
sind die stabile Schicht darunter; die Beschriftungen dazu stehen gesammelt in
`src/lib/labels.ts`, `src/data/navigation.ts` und `src/server/admin/resources.ts`.

---

## Mögliche Erweiterungen

Die Architektur lässt bewusst Platz für:

- Discord-OAuth (die Session-Schicht ist anbieterunabhängig)
- Discord-Widget bzw. Live-Serverstatistik
- Club-XP, Stufen und Aktivitätsverfolgung (`members.xp` und `data/ranks.ts` modellieren das schon)
- Forum, Chat, private Nachrichten, Benachrichtigungen (die Tabelle `notifications` existiert)
- Turnierpläne, Ranglisten pro Disziplin, Teams und Startlisten
- Pferdeprofile je Mitglied (Name, Rasse, Disziplin) als eigene Ressource

Eine neue verwaltete Entität braucht **einen Eintrag** in `src/server/admin/resources.ts` — Liste,
Anlegen, Bearbeiten und Löschen werden daraus erzeugt.
