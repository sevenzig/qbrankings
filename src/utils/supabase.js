// Supabase client configuration and utilities
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV;

// Validate environment variables with graceful fallback
if (!supabaseUrl || !supabaseAnonKey) {
  if (isDevelopment) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file');
    console.warn('⚠️ Supabase features will be disabled in development mode');
  } else {
    console.warn('⚠️ Supabase environment variables not found - Supabase features disabled');
  }
}

// Create Supabase client with fallback for missing credentials
let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    supabase = null;
  }
} else {
  console.warn('⚠️ Supabase client not initialized - missing credentials');
}

// QB data fetching utilities for 5-table schema
export const qbDataService = {
  /**
   * Fetch all QB data from Supabase using the 5-table schema (no views)
   * @param {boolean} include2024Only - Whether to fetch only 2024 data
   * @returns {Promise<Array>} Array of QB data objects
   */
  async fetchAllQBData(include2024Only = false) {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase not available - returning empty array');
        return [];
      }

      console.log(`🔄 Fetching QB data from Supabase (5-table schema, no views)... (2024 Only: ${include2024Only})`);
      
      // Build query - Query qb_passing_stats directly without JOIN
      // This avoids pfr_id case sensitivity issues between old (presda01) and new (PresDa01) data
      // The qb_passing_stats table already has player_name, so we don't need the players table
      let query = supabase
        .from('qb_passing_stats')
        .select('*')
        .not('gs', 'is', null)  // CRITICAL: Only fetch records with games started data
        .gte('gs', 1)            // Only QBs who actually started games
        .order('rate', { ascending: false });
      
      // Filter by year if 2024-only mode is enabled
      if (include2024Only) {
        query = query.eq('season', 2024);
      }
      
      console.log('🔍 Query filters: gs IS NOT NULL AND gs >= 1');
      if (include2024Only) {
        console.log('🔍 Query filters: season = 2024');
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Supabase query error:', error);
        throw new Error(`Failed to fetch QB data: ${error.message}`);
      }
      
      console.log(`📊 Raw Supabase data count: ${data?.length || 0}`);
      
      // If no data with valid gs, try again WITHOUT the gs filter to diagnose the issue
      if (!data || data.length === 0) {
        console.warn('⚠️ No records found with gs >= 1. Checking if ANY data exists...');
        
        const { data: allData, error: allError } = await supabase
          .from('qb_passing_stats')
          .select('*')
          .order('season', { ascending: false })
          .limit(5);
        
        if (!allError && allData && allData.length > 0) {
          console.error('❌ CRITICAL DATABASE ISSUE:');
          console.error('   Database HAS records but NONE have valid gs (games started) values!');
          console.error('   Sample records:', allData.map(r => ({
            player: r.player_name,
            season: r.season,
            gs: r.gs,
            rate: r.rate,
            qb_rec: r.qb_rec
          })));
          console.error('');
          console.error('🔧 FIX REQUIRED: Your Supabase database needs to be re-imported with proper data.');
          console.error('   The gs (games started) column is NULL for all records.');
          console.error('');
          console.error('💡 SOLUTION: Check your Supabase database configuration');
          console.error('   Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly');
          
          throw new Error('Database has records but gs (games started) is NULL. Please re-import your data.');
        }
        
        throw new Error('No data returned from Supabase - database may be empty or query failed');
      }
      
      if (data && data.length > 0) {
        console.log('🔍 First record fields:', Object.keys(data[0]));
        console.log('🔍 First record sample:', {
          player_name: data[0].players?.player_name,
          season: data[0].season,
          team: data[0].team,
          gs: data[0].gs,
          rate: data[0].rate,
          qb_rec: data[0].qb_rec
        });
        
        // Check for records with non-null gs values
        const recordsWithGames = data.filter(r => r.gs != null && r.gs > 0);
        console.log(`🔍 Records with games started > 0: ${recordsWithGames.length}/${data.length}`);
        if (recordsWithGames.length > 0) {
          console.log('🔍 Sample record with games:', {
            player_name: recordsWithGames[0].player_name,
            season: recordsWithGames[0].season,
            gs: recordsWithGames[0].gs,
            rate: recordsWithGames[0].rate
          });
        } else {
          console.error('❌ CRITICAL: No records have gs (games started) values! Database may be incomplete.');
          console.log('🔍 Checking what fields have data...');
          const sampleRecord = data[0];
          const fieldsWithData = Object.keys(sampleRecord).filter(key => sampleRecord[key] != null);
          console.log('🔍 Fields with non-null values:', fieldsWithData);
        }
      }
      
      // Fetch rushing stats from qb_splits for all years
      const { data: rushingData, error: rushingError } = await supabase
        .from('qb_splits')
        .select('pfr_id, player_name, season, rush_att, rush_yds, rush_td, fmb, fl')
        .eq('split', 'League')
        .eq('value', 'NFL');
      
      if (rushingError) {
        console.warn('⚠️ Could not fetch rushing data:', rushingError);
      }
      
      // Create a map of rushing data by pfr_id and season for quick lookup
      const rushingMap = {};
      if (rushingData) {
        rushingData.forEach(record => {
          const key = `${record.pfr_id}_${record.season}`;
          rushingMap[key] = record;
        });
      }
      
      // Transform the data to match expected format
      const transformedData = data.map(record => {
        const rushingKey = `${record.pfr_id}_${record.season}`;
        const rushingStats = rushingMap[rushingKey];
        return {
          ...record,
          player_name: record.players?.player_name || record.player_name,
          team: record.team, // Use team directly from qb_passing_stats
          team_name: record.team, // Use team code as team name for now
          // Map field names to match expected format
          passer_rating: record.rate,
          games_started: record.gs,
          completions: record.cmp,
          attempts: record.att,
          completion_pct: record.cmp_pct,
          pass_yards: record.yds,
          pass_tds: record.td,
          interceptions: record.int,
          sacks: record.sk,
          sack_yards: record.sk_yds,
          fourth_quarter_comebacks: record.four_qc,
          game_winning_drives: record.gwd,
          // Add rushing data from qb_splits
          rush_att: rushingStats?.rush_att || 0,
          rush_yds: rushingStats?.rush_yds || 0,
          rush_td: rushingStats?.rush_td || 0,
          fumbles: rushingStats?.fmb || 0,
          fumbles_lost: rushingStats?.fl || 0
        };
      });
      
      console.log(`✅ Successfully fetched and transformed ${transformedData.length} QB records from Supabase with rushing data`);
      return transformedData;
      
    } catch (error) {
      console.error('❌ Error fetching QB data from Supabase:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },

  /**
   * Fetch QB data by specific year
   * @param {number} year - The year to fetch data for
   * @returns {Promise<Array>} Array of QB data for the specified year
   */
  async fetchQBDataByYear(year) {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase not available - returning empty array');
        return [];
      }

      console.log(`🔄 Fetching QB data for ${year} from Supabase...`);
      
      // Fetch passing stats
      const { data: passingData, error: passingError } = await supabase
        .from('qb_passing_stats')
        .select('*')
        .eq('season', year)
        .not('gs', 'is', null)  // Only fetch records with games started data
        .gte('gs', 1)            // Only QBs who actually started games
        .order('rate', { ascending: false });
      
      if (passingError) {
        console.error('❌ Supabase query error:', passingError);
        // For historical data, some team codes may not exist - log warning but continue
        if (passingError.message.includes('foreign key') || passingError.message.includes('team')) {
          console.warn(`⚠️ Historical team codes detected for ${year} - some records may have unknown teams`);
        }
        throw new Error(`Failed to fetch ${year} QB data: ${passingError.message}`);
      }
      
      // Fetch rushing stats from qb_splits (League/NFL split contains all rushing data)
      const { data: rushingData, error: rushingError } = await supabase
        .from('qb_splits')
        .select('pfr_id, player_name, season, rush_att, rush_yds, rush_td, fmb, fl')
        .eq('season', year)
        .eq('split', 'League')
        .eq('value', 'NFL');
      
      if (rushingError) {
        console.warn('⚠️ Could not fetch rushing data:', rushingError);
      }
      
      // Create a map of rushing data by pfr_id for quick lookup
      const rushingMap = {};
      if (rushingData) {
        rushingData.forEach(record => {
          rushingMap[record.pfr_id] = record;
        });
      }
      
      // Transform and merge the data
      const transformedData = passingData.map(record => {
        const rushingStats = rushingMap[record.pfr_id];
        return {
          ...record,
          player_name: record.player_name,
          team: record.team, // Use team directly from qb_passing_stats
          team_name: record.team, // Use team code as team name for now
          // Map field names to match expected format
          passer_rating: record.rate,
          games_started: record.gs,
          completions: record.cmp,
          attempts: record.att,
          completion_pct: record.cmp_pct,
          pass_yards: record.yds,
          pass_tds: record.td,
          interceptions: record.int,
          sacks: record.sk,
          sack_yards: record.sk_yds,
          fourth_quarter_comebacks: record.four_qc,
          game_winning_drives: record.gwd,
          // Add rushing data from qb_splits
          rush_att: rushingStats?.rush_att || 0,
          rush_yds: rushingStats?.rush_yds || 0,
          rush_td: rushingStats?.rush_td || 0,
          fumbles: rushingStats?.fmb || 0,
          fumbles_lost: rushingStats?.fl || 0
        };
      });
      
      console.log(`✅ Successfully fetched ${transformedData.length} QB records for ${year} with rushing data`);
      return transformedData;
      
    } catch (error) {
      console.error(`❌ Error fetching ${year} QB data from Supabase:`, error);
      return [];
    }
  },

  /**
   * Fetch QB data by player name
   * @param {string} playerName - The player name to search for
   * @returns {Promise<Array>} Array of QB data for the specified player
   */
  async fetchQBDataByName(playerName) {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase not available - returning empty array');
        return [];
      }

      console.log(`🔄 Fetching QB data for ${playerName} from Supabase...`);
      
      const { data, error } = await supabase
        .from('qb_passing_stats')
        .select('*')
        .ilike('player_name', `%${playerName}%`)
        .order('season', { ascending: false });
      
      if (error) {
        console.error('❌ Supabase query error:', error);
        throw new Error(`Failed to fetch QB data for ${playerName}: ${error.message}`);
      }
      
      // Transform the data to match expected format
      const transformedData = data.map(record => ({
        ...record,
        player_name: record.players?.player_name || record.player_name,
        team: record.team, // Use team directly from qb_passing_stats
        team_name: record.team, // Use team code as team name for now
        // Map field names to match expected format
        passer_rating: record.rate,
        games_started: record.gs,
        completions: record.cmp,
        attempts: record.att,
        completion_pct: record.cmp_pct,
        pass_yards: record.yds,
        pass_tds: record.td,
        interceptions: record.int,
        sacks: record.sk,
        sack_yards: record.sk_yds,
        fourth_quarter_comebacks: record.four_qc,
        game_winning_drives: record.gwd
      }));
      
      console.log(`✅ Successfully fetched ${transformedData.length} records for ${playerName}`);
      return transformedData;
      
    } catch (error) {
      console.error(`❌ Error fetching QB data for ${playerName} from Supabase:`, error);
      return [];
    }
  },

  /**
   * Fetch QB statistics with specific filters
   * @param {Object} filters - Filter options
   * @param {number} [filters.year] - Filter by year
   * @param {string} [filters.team] - Filter by team
   * @param {number} [filters.minGames] - Minimum games played
   * @param {number} [filters.minRating] - Minimum passer rating
   * @returns {Promise<Array>} Filtered QB data
   */
  async fetchQBDataWithFilters(filters = {}) {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase not available - returning empty array');
        return [];
      }

      console.log('🔄 Fetching QB data with filters from Supabase...', filters);
      
      let query = supabase
        .from('qb_passing_stats')
        .select('*');
      
      // Apply filters
      if (filters.year) {
        query = query.eq('season', filters.year);
      }
      
      if (filters.team) {
        query = query.eq('team', filters.team);
      }
      
      if (filters.minGames) {
        query = query.gte('gs', filters.minGames);
      }
      
      if (filters.minRating) {
        query = query.gte('rate', filters.minRating);
      }
      
      const { data, error } = await query.order('rate', { ascending: false });
      
      if (error) {
        console.error('❌ Supabase query error:', error);
        throw new Error(`Failed to fetch filtered QB data: ${error.message}`);
      }
      
      // Transform the data to match expected format
      const transformedData = data.map(record => ({
        ...record,
        player_name: record.players?.player_name || record.player_name,
        team: record.teams?.team_abbr || record.team,
        team_name: record.teams?.team_name,
        // Map field names to match expected format
        passer_rating: record.rate,
        games_started: record.gs,
        completions: record.cmp,
        attempts: record.att,
        completion_pct: record.cmp_pct,
        pass_yards: record.yds,
        pass_tds: record.td,
        interceptions: record.int,
        sacks: record.sk,
        sack_yards: record.sk_yds,
        fourth_quarter_comebacks: record.four_qc,
        game_winning_drives: record.gwd
      }));
      
      console.log(`✅ Successfully fetched ${transformedData.length} QB records with filters`);
      return transformedData;
      
    } catch (error) {
      console.error('❌ Error fetching filtered QB data from Supabase:', error);
      return [];
    }
  },

  /**
   * Fetch detailed player data including splits and advanced stats
   * @param {string} pfrId - The PFR ID of the player
   * @param {number} season - The season to fetch data for
   * @returns {Promise<Object>} Complete player data object
   */
  async fetchPlayerDetailedData(pfrId, season) {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase not available - returning null');
        return null;
      }

      console.log(`🔄 Fetching detailed data for ${pfrId} in ${season}...`);
      
      // Fetch passing stats
      const { data: passingStats, error: passingError } = await supabase
        .from('qb_passing_stats')
        .select(`
          *,
          players!inner(pfr_id, player_name),
          teams!inner(team_abbr, team_name)
        `)
        .eq('pfr_id', pfrId)
        .eq('season', season)
        .single();
      
      if (passingError && passingError.code !== 'PGRST116') {
        throw passingError;
      }
      
      // Fetch splits data
      const { data: splits, error: splitsError } = await supabase
        .from('qb_splits')
        .select('*')
        .eq('pfr_id', pfrId)
        .eq('season', season);
      
      if (splitsError) {
        throw splitsError;
      }
      
      // Fetch advanced splits data
      const { data: advancedSplits, error: advancedError } = await supabase
        .from('qb_splits_advanced')
        .select('*')
        .eq('pfr_id', pfrId)
        .eq('season', season);
      
      if (advancedError) {
        throw advancedError;
      }
      
      // Fetch player info
      const { data: playerInfo, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('pfr_id', pfrId)
        .single();
      
      if (playerError && playerError.code !== 'PGRST116') {
        throw playerError;
      }
      
      const result = {
        player: playerInfo,
        passing_stats: passingStats,
        splits: splits || [],
        splits_advanced: advancedSplits || [],
        season
      };
      
      console.log(`✅ Successfully fetched detailed data for ${pfrId} in ${season}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Error fetching detailed data for ${pfrId} in ${season}:`, error);
      return null;
    }
  },

  /**
   * Fetch splits data by type for a specific player and season
   * @param {string} pfrId - The PFR ID of the player
   * @param {number} season - The season to fetch data for
   * @param {string} splitType - The type of split (e.g., 'Down', 'Place', 'Result')
   * @returns {Promise<Array>} Array of splits data
   */
  async fetchSplitsByType(pfrId, season, splitType) {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase not available - returning empty array');
        return [];
      }

      console.log(`🔄 Fetching ${splitType} splits for ${pfrId} in ${season}...`);
      
      // Try both splits tables
      let splitsData = [];
      
      // Try qb_splits first
      const { data: basicSplits, error: basicError } = await supabase
        .from('qb_splits')
        .select('*')
        .eq('pfr_id', pfrId)
        .eq('season', season)
        .eq('split', splitType);
      
      if (!basicError && basicSplits) {
        splitsData = splitsData.concat(basicSplits);
      }
      
      // Try qb_splits_advanced
      const { data: advancedSplits, error: advancedError } = await supabase
        .from('qb_splits_advanced')
        .select('*')
        .eq('pfr_id', pfrId)
        .eq('season', season)
        .eq('split', splitType);
      
      if (!advancedError && advancedSplits) {
        splitsData = splitsData.concat(advancedSplits);
      }
      
      console.log(`✅ Successfully fetched ${splitsData.length} ${splitType} splits`);
      return splitsData;
      
    } catch (error) {
      console.error(`❌ Error fetching ${splitType} splits for ${pfrId} in ${season}:`, error);
      return [];
    }
  },

  /**
   * Get database statistics for the 5-table schema
   * @returns {Promise<Object>} Database statistics object
   */
  async getDatabaseStats() {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase not available - returning empty object');
        return {};
      }

      console.log('🔄 Fetching database statistics for 5-table schema...');
      
      const tables = ['players', 'qb_passing_stats', 'qb_splits', 'qb_splits_advanced', 'teams'];
      const stats = {};
      
      for (const table of tables) {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`❌ Error counting ${table}:`, error);
          stats[table] = { count: 0, error: error.message };
        } else {
          stats[table] = { count: count || 0, error: null };
        }
      }
      
      console.log('✅ Successfully fetched database statistics');
      return stats;
      
    } catch (error) {
      console.error('❌ Error fetching database statistics:', error);
      return {};
    }
  },

  /**
   * Search players with advanced filters
   * @param {Object} searchParams - Search parameters
   * @param {string} [searchParams.name] - Player name search
   * @param {string} [searchParams.team] - Team filter
   * @param {number} [searchParams.minRating] - Minimum passer rating
   * @param {number} [searchParams.minGames] - Minimum games started
   * @param {number} [searchParams.season] - Specific season
   * @returns {Promise<Array>} Array of matching players
   */
  async searchPlayers(searchParams = {}) {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase not available - returning empty array');
        return [];
      }

      console.log('🔄 Searching players with filters...', searchParams);
      
      let query = supabase
        .from('qb_passing_stats')
        .select('*');
      
      if (searchParams.name) {
        query = query.ilike('player_name', `%${searchParams.name}%`);
      }
      
      if (searchParams.team) {
        query = query.eq('team', searchParams.team);
      }
      
      if (searchParams.minRating) {
        query = query.gte('rate', searchParams.minRating);
      }
      
      if (searchParams.minGames) {
        query = query.gte('gs', searchParams.minGames);
      }
      
      if (searchParams.season) {
        query = query.eq('season', searchParams.season);
      }
      
      const { data, error } = await query
        .order('rate', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('❌ Supabase query error:', error);
        throw new Error(`Failed to search players: ${error.message}`);
      }
      
      // Transform the data to match expected format
      const transformedData = data.map(record => ({
        ...record,
        player_name: record.players?.player_name || record.player_name,
        team: record.team, // Use team directly from qb_passing_stats
        team_name: record.team, // Use team code as team name for now
        // Map field names to match expected format
        passer_rating: record.rate,
        games_started: record.gs,
        completions: record.cmp,
        attempts: record.att,
        completion_pct: record.cmp_pct,
        pass_yards: record.yds,
        pass_tds: record.td,
        interceptions: record.int,
        sacks: record.sk,
        sack_yards: record.sk_yds,
        fourth_quarter_comebacks: record.four_qc,
        game_winning_drives: record.gwd
      }));
      
      console.log(`✅ Found ${transformedData.length} players matching search criteria`);
      return transformedData;
      
    } catch (error) {
      console.error('❌ Error searching players:', error);
      return [];
    }
  },

  /**
   * Fetch 3rd & 1-3 splits data for all 2024 QBs
   * @returns {Promise<Array>} Array of 3rd & 1-3 splits data for all QBs
   */
  async fetchThirdAndShortData2024() {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase not available - returning empty array');
        return [];
      }

      console.log('🔄 Fetching 3rd & 1-3 splits data for all 2024 QBs...');
      
      // Based on diagnostic findings, data is stored as:
      // split = 'Continuation' AND value = '3rd' (for 3rd down)
      // split = 'Yards To Go' AND value = '1-3' (for 1-3 yards)
      
      // First, get all 3rd down data
      const { data: thirdDownData, error: thirdDownError } = await supabase
        .from('qb_splits_advanced')
        .select(`
          *,
          players!inner(pfr_id, player_name),
          qb_passing_stats!inner(team)
        `)
        .eq('split', 'Continuation')
        .eq('value', '3rd')
        .eq('season', 2024);
      
      if (thirdDownError) {
        console.error('❌ Error fetching 3rd down data:', thirdDownError);
        throw thirdDownError;
      }
      
      console.log(`📊 Found ${thirdDownData?.length || 0} QBs with 3rd down data`);
      
      // Then, get all 1-3 yards data
      const { data: yardsData, error: yardsError } = await supabase
        .from('qb_splits_advanced')
        .select(`
          *,
          players!inner(pfr_id, player_name),
          qb_passing_stats!inner(team)
        `)
        .eq('split', 'Yards To Go')
        .eq('value', '1-3')
        .eq('season', 2024);
      
      if (yardsError) {
        console.error('❌ Error fetching 1-3 yards data:', yardsError);
        throw yardsError;
      }
      
      console.log(`📊 Found ${yardsData?.length || 0} QBs with 1-3 yards data`);
      
      // Combine the data - we'll use 3rd down data as primary and merge with 1-3 yards data
      const combinedData = [];
      
      // Create a map of 3rd down data by pfr_id
      const thirdDownMap = {};
      if (thirdDownData) {
        thirdDownData.forEach(record => {
          thirdDownMap[record.pfr_id] = record;
        });
      }
      
      // Create a map of 1-3 yards data by pfr_id
      const yardsMap = {};
      if (yardsData) {
        yardsData.forEach(record => {
          yardsMap[record.pfr_id] = record;
        });
      }
      
      // Combine data for QBs that have both 3rd down and 1-3 yards data
      const allQBs = new Set([
        ...Object.keys(thirdDownMap),
        ...Object.keys(yardsMap)
      ]);
      
      allQBs.forEach(pfrId => {
        const thirdDownRecord = thirdDownMap[pfrId];
        const yardsRecord = yardsMap[pfrId];
        
        // Use 3rd down data as primary, fall back to 1-3 yards data
        const primaryRecord = thirdDownRecord || yardsRecord;
        
        if (primaryRecord) {
          combinedData.push({
            pfr_id: primaryRecord.pfr_id,
            player_name: primaryRecord.players?.player_name || primaryRecord.player_name,
            team: primaryRecord.qb_passing_stats?.team || primaryRecord.team,
            season: primaryRecord.season,
            split: '3rd & 1-3',
            value: '1-3 yards',
            att: primaryRecord.att,
            cmp: primaryRecord.cmp,
            yds: primaryRecord.yds,
            td: primaryRecord.td,
            int: primaryRecord.int,
            rate: primaryRecord.rate,
            // Add calculated fields
            completion_rate: primaryRecord.att > 0 ? (primaryRecord.cmp / primaryRecord.att * 100).toFixed(1) : 0,
            yards_per_attempt: primaryRecord.att > 0 ? (primaryRecord.yds / primaryRecord.att).toFixed(1) : 0,
            td_rate: primaryRecord.att > 0 ? (primaryRecord.td / primaryRecord.att * 100).toFixed(1) : 0,
            int_rate: primaryRecord.att > 0 ? (primaryRecord.int / primaryRecord.att * 100).toFixed(1) : 0
          });
        }
      });
      
      console.log(`✅ Successfully fetched 3rd & 1-3 data for ${combinedData.length} QBs`);
      return combinedData;
      
    } catch (error) {
      console.error('❌ Error fetching 3rd & 1-3 data:', error);
      return [];
    }
  },

  /**
   * Fetch 3rd & 1-3 splits data for a specific QB in 2024
   * @param {string} pfrId - The PFR ID of the player
   * @returns {Promise<Array>} Array of 3rd & 1-3 splits data
   */
  async fetchThirdAndShortDataForQB(pfrId) {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase not available - returning empty array');
        return [];
      }

      console.log(`🔄 Fetching 3rd & 1-3 splits for QB ${pfrId} in 2024...`);
      
      // Based on diagnostic findings, data is stored as:
      // split = 'Continuation' AND value = '3rd' (for 3rd down)
      // split = 'Yards To Go' AND value = '1-3' (for 1-3 yards)
      
      // First, get 3rd down data for this QB
      const { data: thirdDownData, error: thirdDownError } = await supabase
        .from('qb_splits_advanced')
        .select(`
          *,
          players!inner(pfr_id, player_name),
          qb_passing_stats!inner(team)
        `)
        .eq('pfr_id', pfrId)
        .eq('split', 'Continuation')
        .eq('value', '3rd')
        .eq('season', 2024);
      
      if (thirdDownError) {
        console.error('❌ Error fetching 3rd down data:', thirdDownError);
        throw thirdDownError;
      }
      
      // Then, get 1-3 yards data for this QB
      const { data: yardsData, error: yardsError } = await supabase
        .from('qb_splits_advanced')
        .select(`
          *,
          players!inner(pfr_id, player_name),
          qb_passing_stats!inner(team)
        `)
        .eq('pfr_id', pfrId)
        .eq('split', 'Yards To Go')
        .eq('value', '1-3')
        .eq('season', 2024);
      
      if (yardsError) {
        console.error('❌ Error fetching 1-3 yards data:', yardsError);
        throw yardsError;
      }
      
      // Combine the data - use 3rd down data as primary, fall back to 1-3 yards data
      const primaryRecord = thirdDownData?.[0] || yardsData?.[0];
      
      if (!primaryRecord) {
        throw new Error(`No 3rd & 1-3 data found for QB ${pfrId}`);
      }
      
      // Transform the data to match expected format
      const transformedData = [{
        pfr_id: primaryRecord.pfr_id,
        player_name: primaryRecord.players?.player_name || primaryRecord.player_name,
        team: primaryRecord.qb_passing_stats?.team || primaryRecord.team,
        season: primaryRecord.season,
        split: '3rd & 1-3',
        value: '1-3 yards',
        att: primaryRecord.att,
        cmp: primaryRecord.cmp,
        yds: primaryRecord.yds,
        td: primaryRecord.td,
        int: primaryRecord.int,
        rate: primaryRecord.rate,
        // Add calculated fields
        completion_rate: primaryRecord.att > 0 ? (primaryRecord.cmp / primaryRecord.att * 100).toFixed(1) : 0,
        yards_per_attempt: primaryRecord.att > 0 ? (primaryRecord.yds / primaryRecord.att).toFixed(1) : 0,
        td_rate: primaryRecord.att > 0 ? (primaryRecord.td / primaryRecord.att * 100).toFixed(1) : 0,
        int_rate: primaryRecord.att > 0 ? (primaryRecord.int / primaryRecord.att * 100).toFixed(1) : 0
      }];
      
      console.log(`✅ Successfully fetched ${transformedData.length} 3rd & 1-3 splits for QB ${pfrId}`);
      return transformedData;
      
    } catch (error) {
      console.error(`❌ Error fetching 3rd & 1-3 data for QB ${pfrId}:`, error);
      return [];
    }
  },

  /**
   * Get summary statistics for 3rd & 1-3 performance across all 2024 QBs
   * @returns {Promise<Object>} Summary statistics object
   */
  async getThirdAndShortSummary2024() {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase not available - returning empty object');
        return {
          totalQBs: 0,
          totalAttempts: 0,
          totalCompletions: 0,
          totalYards: 0,
          totalTDs: 0,
          totalInts: 0,
          averageCompletionRate: 0,
          averageYardsPerAttempt: 0,
          averageTDsPerAttempt: 0,
          averageIntsPerAttempt: 0,
          qbBreakdown: []
        };
      }

      console.log('🔄 Generating 3rd & 1-3 summary statistics for 2024...');
      
      const allData = await this.fetchThirdAndShortData2024();
      
      if (!allData || allData.length === 0) {
        return {
          totalQBs: 0,
          totalAttempts: 0,
          totalCompletions: 0,
          totalYards: 0,
          totalTDs: 0,
          totalInts: 0,
          averageCompletionRate: 0,
          averageYardsPerAttempt: 0,
          averageTDsPerAttempt: 0,
          averageIntsPerAttempt: 0,
          qbBreakdown: []
        };
      }
      
      // Group by QB
      const qbGroups = {};
      allData.forEach(record => {
        if (!qbGroups[record.player_name]) {
          qbGroups[record.player_name] = {
            player_name: record.player_name,
            team: record.team || 'Unknown',
            pfr_id: record.pfr_id,
            attempts: 0,
            completions: 0,
            yards: 0,
            tds: 0,
            ints: 0,
            completion_rate: 0,
            yards_per_attempt: 0
          };
        }
        
        // Sum up the stats
        qbGroups[record.player_name].attempts += parseInt(record.att) || 0;
        qbGroups[record.player_name].completions += parseInt(record.cmp) || 0;
        qbGroups[record.player_name].yards += parseInt(record.yds) || 0;
        qbGroups[record.player_name].tds += parseInt(record.td) || 0;
        qbGroups[record.player_name].ints += parseInt(record.int) || 0;
      });
      
      // Calculate rates for each QB
      const qbBreakdown = Object.values(qbGroups).map(qb => {
        const attempts = qb.attempts;
        const completions = qb.completions;
        
        return {
          ...qb,
          completion_rate: attempts > 0 ? (completions / attempts * 100).toFixed(1) : 0,
          yards_per_attempt: attempts > 0 ? (qb.yards / attempts).toFixed(1) : 0,
          td_rate: attempts > 0 ? (qb.tds / attempts * 100).toFixed(1) : 0,
          int_rate: attempts > 0 ? (qb.ints / attempts * 100).toFixed(1) : 0
        };
      }).sort((a, b) => b.attempts - a.attempts); // Sort by attempts descending
      
      // Calculate overall totals
      const totals = qbBreakdown.reduce((acc, qb) => {
        acc.attempts += qb.attempts;
        acc.completions += qb.completions;
        acc.yards += qb.yards;
        acc.tds += qb.tds;
        acc.ints += qb.ints;
        return acc;
      }, { attempts: 0, completions: 0, yards: 0, tds: 0, ints: 0 });
      
      const summary = {
        totalQBs: qbBreakdown.length,
        totalAttempts: totals.attempts,
        totalCompletions: totals.completions,
        totalYards: totals.yards,
        totalTDs: totals.tds,
        totalInts: totals.ints,
        averageCompletionRate: totals.attempts > 0 ? (totals.completions / totals.attempts * 100).toFixed(1) : 0,
        averageYardsPerAttempt: totals.attempts > 0 ? (totals.yards / totals.attempts).toFixed(1) : 0,
        averageTDsPerAttempt: totals.attempts > 0 ? (totals.tds / totals.attempts * 100).toFixed(1) : 0,
        averageIntsPerAttempt: totals.attempts > 0 ? (totals.ints / totals.attempts * 100).toFixed(1) : 0,
        qbBreakdown
      };
      
      console.log('✅ Successfully generated 3rd & 1-3 summary statistics');
      return summary;
      
    } catch (error) {
      console.error('❌ Error generating 3rd & 1-3 summary:', error);
      return {
        totalQBs: 0,
        totalAttempts: 0,
        totalCompletions: 0,
        totalYards: 0,
        totalTDs: 0,
        totalInts: 0,
        averageCompletionRate: 0,
        averageYardsPerAttempt: 0,
        averageTDsPerAttempt: 0,
        averageIntsPerAttempt: 0,
        qbBreakdown: []
      };
    }
  },

  /**
   * Diagnostic function to explore what 3rd down data exists in the database
   * @returns {Promise<Object>} Diagnostic information about available data
   */
  async diagnoseThirdDownData() {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase not available - returning empty object');
        return {
          qb_splits_advanced: {},
          qb_splits: {},
          sampleRecords: {}
        };
      }

      console.log('🔍 Diagnosing 3rd down data availability...');
      
      const diagnostics = {
        qb_splits_advanced: {},
        qb_splits: {},
        sampleRecords: {}
      };
      
      // Check qb_splits_advanced table
      console.log('📋 Checking qb_splits_advanced table...');
      
      // Get all unique split values
      const { data: splitValues, error: splitError } = await supabase
        .from('qb_splits_advanced')
        .select('split')
        .eq('season', 2024)
        .not('split', 'is', null);
      
      if (!splitError && splitValues) {
        const uniqueSplits = [...new Set(splitValues.map(r => r.split))];
        diagnostics.qb_splits_advanced.uniqueSplits = uniqueSplits;
        console.log('🔍 Unique splits in qb_splits_advanced:', uniqueSplits);
        
        // Look for 3rd down related splits
        const thirdDownSplits = uniqueSplits.filter(split => 
          split.toLowerCase().includes('3rd') || 
          split.toLowerCase().includes('third') ||
          split.toLowerCase().includes('short')
        );
        console.log('🔍 3rd down related splits:', thirdDownSplits);
        
        // Get sample records for each 3rd down split
        for (const split of thirdDownSplits) {
          const { data: sampleData, error: sampleError } = await supabase
            .from('qb_splits_advanced')
            .select('*')
            .eq('split', split)
            .eq('season', 2024)
            .limit(3);
          
          if (!sampleError && sampleData && sampleData.length > 0) {
            diagnostics.sampleRecords[split] = sampleData;
            console.log(`📋 Sample records for "${split}":`, sampleData.length);
            console.log('   Sample record:', sampleData[0]);
          }
        }
      }
      
      // Check qb_splits table
      console.log('📋 Checking qb_splits table...');
      
      const { data: splitsValues, error: splitsError } = await supabase
        .from('qb_splits')
        .select('split')
        .eq('season', 2024)
        .not('split', 'is', null);
      
      if (!splitsError && splitsValues) {
        const uniqueSplitsSplits = [...new Set(splitsValues.map(r => r.split))];
        diagnostics.qb_splits.uniqueSplits = uniqueSplitsSplits;
        console.log('🔍 Unique splits in qb_splits:', uniqueSplitsSplits);
        
        // Look for 3rd down related splits
        const thirdDownSplitsSplits = uniqueSplitsSplits.filter(split => 
          split.toLowerCase().includes('3rd') || 
          split.toLowerCase().includes('third') ||
          split.toLowerCase().includes('short')
        );
        console.log('🔍 3rd down related splits in qb_splits:', thirdDownSplitsSplits);
      }
      
      // Check what data exists for Mahomes specifically
      console.log('🔍 Checking Mahomes data specifically...');
      const { data: mahomesData, error: mahomesError } = await supabase
        .from('qb_splits_advanced')
        .select('*')
        .eq('pfr_id', 'MahoPa00')
        .eq('season', 2024);
      
      if (!mahomesError && mahomesData) {
        console.log(`📋 Mahomes has ${mahomesData.length} records in qb_splits_advanced`);
        if (mahomesData.length > 0) {
          console.log('📋 Mahomes splits:', mahomesData.map(r => r.split));
          console.log('📋 Mahomes values:', mahomesData.map(r => r.value));
          console.log('📋 Sample Mahomes record:', mahomesData[0]);
        }
        diagnostics.mahomesData = mahomesData;
      }
      
      console.log('✅ Diagnostic complete');
      return diagnostics;
      
    } catch (error) {
      console.error('❌ Error in diagnostic:', error);
      return {
        qb_splits_advanced: {},
        qb_splits: {},
        sampleRecords: {}
      };
    }
  }
};

// Real-time subscription utilities (for future use)
export const realtimeService = {
  /**
   * Subscribe to QB data changes
   * @param {function} callback - Callback function for data changes
   * @returns {function} Unsubscribe function
   */
  subscribeToQBChanges(callback) {
    if (!supabase) {
      console.warn('⚠️ Supabase not available - cannot subscribe to changes');
      return () => {};
    }

    const subscription = supabase
      .channel('qb_data_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'qb_passing_stats' }, 
        (payload) => {
          console.log('🔄 QB passing stats changed:', payload);
          callback(payload);
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'qb_splits' }, 
        (payload) => {
          console.log('🔄 QB splits changed:', payload);
          callback(payload);
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'qb_splits_advanced' }, 
        (payload) => {
          console.log('🔄 QB advanced splits changed:', payload);
          callback(payload);
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }
};

// Export the supabase client (may be null if credentials are missing)
export { supabase };

// Utility function to check if Supabase is available
export const isSupabaseAvailable = () => {
  return supabase !== null;
};

// Enhanced error handler for Supabase operations
export const handleSupabaseError = (error) => {
  if (!supabase) {
    return {
      type: 'SUPABASE_UNAVAILABLE',
      message: 'Supabase is not configured or unavailable',
      details: 'Missing environment variables or connection issues'
    };
  }

  if (error.code === 'PGRST116') {
    return {
      type: 'NO_DATA_FOUND',
      message: 'No data found for the specified criteria',
      details: error.message
    };
  }

  if (error.code === '42501') {
    return {
      type: 'PERMISSION_DENIED',
      message: 'Permission denied for this operation',
      details: error.message
    };
  }

  return {
    type: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    details: error.message
  };
}; 