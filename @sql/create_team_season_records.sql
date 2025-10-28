-- Team Season Records Materialized View
-- Purpose: Aggregate W/L/T across all QBs for a team-season from qb_passing_stats
-- Notes:
--  - Deduplicates to one row per (pfr_id, season, team) to avoid double counting
--  - Excludes combined rows like '2TM' and any team values containing ','
--  - Parses qb_rec in formats 'W-L' or 'W-L-T'; missing ties default to 0
--  - Excludes partial 2025 season from aggregates

-- Optional: drop existing objects
-- DROP MATERIALIZED VIEW IF EXISTS team_season_records;

CREATE MATERIALIZED VIEW IF NOT EXISTS team_season_records AS
WITH per_qb AS (
  SELECT DISTINCT ON (pfr_id, season, UPPER(team))
    UPPER(team) AS team,
    season,
    pfr_id,
    COALESCE(gs, 0) AS gs,
    COALESCE(NULLIF(split_part(qb_rec, '-', 1), '')::int, 0) AS w,
    COALESCE(NULLIF(split_part(qb_rec, '-', 2), '')::int, 0) AS l,
    COALESCE(NULLIF(split_part(qb_rec, '-', 3), '')::int, 0) AS t
  FROM qb_passing_stats
  WHERE team IS NOT NULL
    AND team <> ''
    AND pos = 'QB'
    AND season <= 2024
    AND UPPER(team) <> '2TM'
    AND team NOT LIKE '%,%'
    AND COALESCE(gs, 0) >= 0
    AND qb_rec IS NOT NULL
    AND qb_rec <> ''
  ORDER BY pfr_id, season, UPPER(team), gs DESC, rate DESC
)
SELECT
  team,
  season,
  SUM(w) AS total_wins,
  SUM(l) AS total_losses,
  SUM(t) AS total_ties,
  SUM(w + l + t) AS total_games,
  CASE WHEN (SUM(w) + SUM(l) + SUM(t)) > 0
       THEN SUM(w)::decimal / (SUM(w) + SUM(l) + SUM(t))
       ELSE NULL END AS win_pct
FROM per_qb
GROUP BY team, season
ORDER BY season DESC, team ASC;

-- Indexes for fast lookups
-- Required for CONCURRENTLY refresh: a unique index with no WHERE clause
CREATE UNIQUE INDEX IF NOT EXISTS uq_team_season_records_season_team
  ON team_season_records (season, team);

CREATE INDEX IF NOT EXISTS idx_team_season_records_win_pct
  ON team_season_records (win_pct DESC NULLS LAST);

-- Grant read permissions (Supabase anon/authenticated)
GRANT SELECT ON team_season_records TO anon, authenticated;


