-- Startdaten für den Reitclub Fairy Tight
-- =======================================
-- Enthält drei Arten von Zeilen:
--   1. Systemvorgaben (Ränge, Beitragskategorien) — können so bleiben.
--   2. Bestätigte Clubdaten: das eine Mitglied, das der Club bisher genannt hat.
--      Unbekannte Angaben bleiben NULL; nichts wird geraten.
--   3. Demo-Zeilen, alle mit is_demo = 1 und „Demo …“ im Namen, damit sie als
--      Platzhalter erkennbar sind. Sobald echte Daten da sind, im /admin
--      löschen: DELETE FROM members WHERE is_demo = 1; (ebenso in den anderen
--      Tabellen)

-- 1. Ränge (Standard-Rangordnung — frei umbenennbar oder ersetzbar) -----------
INSERT OR REPLACE INTO ranks (id, label, sort_order, tone) VALUES
  ('owner',      'Clubleitung',              10, 'primary'),
  ('co_owner',   'Stellvertretende Leitung', 20, 'primary'),
  ('leader',     'Stallleitung',             30, 'secondary'),
  ('co_leader',  'Trainingsleitung',         40, 'secondary'),
  ('admin',      'Administration',           50, 'accent'),
  ('moderator',  'Moderation',               60, 'accent'),
  ('officer',    'Turnierleitung',           70, 'accent'),
  ('member',     'Mitglied',                 80, 'neutral'),
  ('trial',      'Probemitglied',            90, 'neutral');

-- 2. Beitragskategorien ------------------------------------------------------
INSERT OR REPLACE INTO news_categories (id, label, sort_order) VALUES
  ('clan',          'Aus dem Club',   10),
  ('community',     'Community',      20),
  ('games',         'Disziplinen',    30),
  ('events',        'Termine',        40),
  ('updates',       'Updates',        50),
  ('announcements', 'Ankündigungen',  60);

-- 3. Bestätigtes Mitglied ----------------------------------------------------
-- Rang und Aufgabe sind noch nicht bestätigt, bleiben also NULL und werden als
-- Platzhalter dargestellt.
INSERT OR IGNORE INTO members (id, slug, username, display_name, rank, status, role, main_game, sort_order, is_visible, is_demo)
VALUES ('mbr_florian', 'florian', 'Florian', 'Florian Clever', NULL, 'offline', NULL, NULL, 10, 1, 0);

-- Es gibt weitere Mitglieder, deren Namen aber nicht vorliegen. Sie kommen
-- hier dazu, sobald sie bestätigt sind — keine Namen erfinden.

-- 4. Demo-Inhalte (deutlich markiert, bei echten Daten löschen) ---------------
INSERT OR IGNORE INTO members (id, slug, username, display_name, rank, status, role, main_game, sort_order, is_visible, is_demo)
VALUES ('mbr_demo1', 'demo-mitglied', 'Demo-Mitglied', 'Demo-Mitglied', 'member', 'online', 'Demo-Aufgabe', 'Demo-Disziplin', 900, 1, 1);

INSERT OR IGNORE INTO games (id, slug, name, genre, platforms, status, description, sort_order, is_demo)
VALUES ('gam_demo1', 'demo-disziplin', 'Demo-Disziplin', 'Demo-Art', '["Training"]', 'planned',
        'Platzhalter, damit sich das Layout ansehen lässt. Durch die Disziplinen ersetzen, die der Club wirklich reitet.', 900, 1);

INSERT OR IGNORE INTO events (id, slug, title, description, game_id, starts_at, host_name, participant_limit, status, is_demo)
VALUES ('evt_demo1', 'demo-termin', 'Demo-Termin',
        'Platzhalter-Termin. Echte Ausritte und Turniere werden im Adminbereich angelegt.',
        'gam_demo1', unixepoch() + 604800, 'Demo-Mitglied', 10, 'upcoming', 1);

INSERT OR IGNORE INTO news (id, slug, title, teaser, content, category_id, author_name, tags, status, published_at, is_demo)
VALUES ('nws_demo1', 'demo-beitrag', 'Demo-Beitrag',
        'Platzhalter-Beitrag, der zeigt, wie Neuigkeiten dargestellt werden.',
        'Das hier ist Platzhaltertext.' || char(10) || char(10) ||
        'Er zeigt das Layout eines Beitrags und ist keine echte Ankündigung von Fairy Tight. Sobald der erste richtige Beitrag steht, im Adminbereich löschen.',
        'clan', 'Demo-Mitglied', '["demo"]', 'published', unixepoch(), 1);

INSERT OR IGNORE INTO achievements (id, slug, title, description, icon, game_id, achieved_at, is_demo)
VALUES ('ach_demo1', 'demo-erfolg', 'Demo-Erfolg',
        'Platzhalter-Eintrag. Hier wird kein echtes Ergebnis behauptet.', '🏆', 'gam_demo1', NULL, 1);
