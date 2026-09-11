-- Seed data for Team Fairy Tight
-- ==============================
-- Contains three kinds of rows:
--   1. System defaults (ranks, news categories) — safe to keep.
--   2. Confirmed clan data: the one member the clan has named so far.
--      Unknown attributes stay NULL; nothing is guessed.
--   3. Demo rows, all flagged is_demo = 1 and named "Demo …" so they are
--      recognisable as placeholders. Delete them in /admin once real data
--      exists: DELETE FROM members WHERE is_demo = 1; (same for other tables)

-- 1. Ranks (default hierarchy — rename or replace freely) ---------------------
INSERT OR REPLACE INTO ranks (id, label, sort_order, tone) VALUES
  ('owner',      'Owner',      10, 'primary'),
  ('co_owner',   'Co-Owner',   20, 'primary'),
  ('leader',     'Leader',     30, 'secondary'),
  ('co_leader',  'Co-Leader',  40, 'secondary'),
  ('admin',      'Admin',      50, 'accent'),
  ('moderator',  'Moderator',  60, 'accent'),
  ('officer',    'Officer',    70, 'accent'),
  ('member',     'Member',     80, 'neutral'),
  ('trial',      'Trial',      90, 'neutral');

-- 2. News categories ---------------------------------------------------------
INSERT OR REPLACE INTO news_categories (id, label, sort_order) VALUES
  ('clan',          'Clan News',     10),
  ('community',     'Community',     20),
  ('games',         'Games',         30),
  ('events',        'Events',        40),
  ('updates',       'Updates',       50),
  ('announcements', 'Announcements', 60);

-- 3. Confirmed member --------------------------------------------------------
-- Rank and role are not confirmed yet, so they stay NULL and render as TBD.
INSERT OR IGNORE INTO members (id, slug, username, display_name, rank, status, role, main_game, sort_order, is_visible, is_demo)
VALUES ('mbr_florian', 'florian', 'Florian', 'Florian Clever', NULL, 'offline', NULL, NULL, 10, 1, 0);

-- Three further members are known to exist but were not named. Add them here
-- as they are confirmed — do not invent names.

-- 4. Demo content (clearly marked, delete once real data exists) --------------
INSERT OR IGNORE INTO members (id, slug, username, display_name, rank, status, role, main_game, sort_order, is_visible, is_demo)
VALUES ('mbr_demo1', 'demo-member', 'Demo Member', 'Demo Member', 'member', 'online', 'Demo role', 'Demo Game', 900, 1, 1);

INSERT OR IGNORE INTO games (id, slug, name, genre, platforms, status, description, sort_order, is_demo)
VALUES ('gam_demo1', 'demo-game', 'Demo Game', 'Demo genre', '["PC"]', 'planned',
        'Placeholder entry so the layout can be reviewed. Replace with the games the clan actually plays.', 900, 1);

INSERT OR IGNORE INTO events (id, slug, title, description, game_id, starts_at, host_name, participant_limit, status, is_demo)
VALUES ('evt_demo1', 'demo-event', 'Demo Event',
        'Placeholder event. Real clan evenings and tournaments are created in the admin area.',
        'gam_demo1', unixepoch() + 604800, 'Demo Member', 10, 'upcoming', 1);

INSERT OR IGNORE INTO news (id, slug, title, teaser, content, category_id, author_name, tags, status, published_at, is_demo)
VALUES ('nws_demo1', 'demo-article', 'Demo Article',
        'Placeholder article showing how news items are displayed.',
        'This is placeholder content.' || char(10) || char(10) ||
        'It demonstrates the article layout and is not a real Team Fairy Tight announcement. Delete it in the admin area once the first real article exists.',
        'clan', 'Demo Member', '["demo"]', 'published', unixepoch(), 1);

INSERT OR IGNORE INTO achievements (id, slug, title, description, icon, game_id, achieved_at, is_demo)
VALUES ('ach_demo1', 'demo-achievement', 'Demo Achievement',
        'Placeholder entry. No real result is claimed here.', '🏆', 'gam_demo1', NULL, 1);
