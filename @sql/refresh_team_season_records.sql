-- Refresh helper for team_season_records materialized view

-- Enable required extension for concurrent refresh dependency tracking (optional)
-- CREATE EXTENSION IF NOT EXISTS pg_cron; -- if you plan to schedule refreshes

-- Concurrent refresh to avoid locking readers
REFRESH MATERIALIZED VIEW CONCURRENTLY team_season_records;

-- Recreate indexes if needed (Postgres preserves indexes on CONCURRENTLY)
-- CREATE INDEX IF NOT EXISTS idx_team_season_records_season_team
--   ON team_season_records (season, team);
-- CREATE INDEX IF NOT EXISTS idx_team_season_records_win_pct
--   ON team_season_records (win_pct DESC NULLS LAST);


