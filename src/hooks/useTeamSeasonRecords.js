// Hook to fetch team season records from Supabase materialized view
import { useState, useEffect, useCallback } from 'react';
import { supabase, handleSupabaseError } from '../utils/supabase.js';

/**
 * useTeamSeasonRecords
 * @param {number} season - target season (e.g., 2024)
 * @returns {{ recordsByTeam: Object, loading: boolean, error: string|null, refresh: Function }}
 */
export const useTeamSeasonRecords = (season) => {
  const [recordsByTeam, setRecordsByTeam] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase || !season) {
        setRecordsByTeam({});
        setLoading(false);
        return;
      }

      const { data, error: qErr } = await supabase
        .from('team_season_records')
        .select('*')
        .eq('season', season);

      if (qErr) {
        throw qErr;
      }

      const map = {};
      (data || []).forEach((row) => {
        const key = (row.team || '').toUpperCase();
        map[key] = {
          team: key,
          season: row.season,
          totalWins: row.total_wins || 0,
          totalLosses: row.total_losses || 0,
          totalTies: row.total_ties || 0,
          totalGames: row.total_games || 0,
          winPct: row.win_pct == null ? null : Number(row.win_pct)
        };
      });

      setRecordsByTeam(map);
      setLoading(false);
    } catch (e) {
      const userErr = handleSupabaseError(e);
      setError(userErr.message || 'Failed to load team season records');
      setLoading(false);
    }
  }, [season]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { recordsByTeam, loading, error, refresh: fetchRecords };
};


