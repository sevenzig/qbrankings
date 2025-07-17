// Supabase client configuration and utilities
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file');
  throw new Error('Supabase configuration is missing');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// QB data fetching utilities
export const qbDataService = {
  /**
   * Fetch all QB data from Supabase using the season summary view
   * @param {boolean} include2024Only - Whether to fetch only 2024 data
   * @returns {Promise<Array>} Array of QB data objects
   */
  async fetchAllQBData(include2024Only = false) {
    try {
      console.log(`🔄 Fetching QB data from Supabase... (2024 Only: ${include2024Only})`);
      
      let query = supabase
        .from('qb_season_summary')
        .select('*')
        .order('passer_rating', { ascending: false });
      
      // Filter by year if 2024-only mode is enabled
      if (include2024Only) {
        query = query.eq('season', 2024);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Supabase query error:', error);
        throw new Error(`Failed to fetch QB data: ${error.message}`);
      }
      
      console.log(`✅ Successfully fetched ${data.length} QB records from Supabase`);
      return data;
      
    } catch (error) {
      console.error('❌ Error fetching QB data from Supabase:', error);
      throw error;
    }
  },

  /**
   * Fetch QB data by specific year
   * @param {number} year - The year to fetch data for
   * @returns {Promise<Array>} Array of QB data for the specified year
   */
  async fetchQBDataByYear(year) {
    try {
      console.log(`🔄 Fetching QB data for ${year} from Supabase...`);
      
      const { data, error } = await supabase
        .from('qb_season_summary')
        .select('*')
        .eq('season', year)
        .order('passer_rating', { ascending: false });
      
      if (error) {
        console.error('❌ Supabase query error:', error);
        throw new Error(`Failed to fetch ${year} QB data: ${error.message}`);
      }
      
      console.log(`✅ Successfully fetched ${data.length} QB records for ${year}`);
      return data;
      
    } catch (error) {
      console.error(`❌ Error fetching ${year} QB data from Supabase:`, error);
      throw error;
    }
  },

  /**
   * Fetch QB data by player name
   * @param {string} playerName - The player name to search for
   * @returns {Promise<Array>} Array of QB data for the specified player
   */
  async fetchQBDataByName(playerName) {
    try {
      console.log(`🔄 Fetching QB data for ${playerName} from Supabase...`);
      
      const { data, error } = await supabase
        .from('qb_season_summary')
        .select('*')
        .ilike('player_name', `%${playerName}%`)
        .order('season', { ascending: false });
      
      if (error) {
        console.error('❌ Supabase query error:', error);
        throw new Error(`Failed to fetch QB data for ${playerName}: ${error.message}`);
      }
      
      console.log(`✅ Successfully fetched ${data.length} records for ${playerName}`);
      return data;
      
    } catch (error) {
      console.error(`❌ Error fetching QB data for ${playerName} from Supabase:`, error);
      throw error;
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
      console.log('🔄 Fetching QB data with filters from Supabase...', filters);
      
      let query = supabase
        .from('qb_season_summary')
        .select('*');
      
      // Apply filters
      if (filters.year) {
        query = query.eq('season', filters.year);
      }
      
      if (filters.team) {
        query = query.eq('team', filters.team);
      }
      
      if (filters.minGames) {
        query = query.gte('games_started', filters.minGames);
      }
      
      if (filters.minRating) {
        query = query.gte('passer_rating', filters.minRating);
      }
      
      const { data, error } = await query.order('passer_rating', { ascending: false });
      
      if (error) {
        console.error('❌ Supabase query error:', error);
        throw new Error(`Failed to fetch filtered QB data: ${error.message}`);
      }
      
      console.log(`✅ Successfully fetched ${data.length} QB records with filters`);
      return data;
      
    } catch (error) {
      console.error('❌ Error fetching filtered QB data from Supabase:', error);
      throw error;
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
      console.log(`🔄 Fetching detailed data for ${pfrId} in ${season}...`);
      
      // Fetch passing stats
      const { data: passingStats, error: passingError } = await supabase
        .from('qb_passing_stats')
        .select('*')
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
      throw error;
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
      console.log(`🔄 Fetching ${splitType} splits for ${pfrId} in ${season}...`);
      
      const { data, error } = await supabase
        .rpc('get_splits_by_type', {
          target_pfr_id: pfrId,
          target_season: season,
          split_type: splitType
        });
      
      if (error) {
        throw error;
      }
      
      console.log(`✅ Successfully fetched ${data.length} ${splitType} splits`);
      return data;
      
    } catch (error) {
      console.error(`❌ Error fetching ${splitType} splits:`, error);
      throw error;
    }
  },

  /**
   * Get database statistics
   * @returns {Promise<Array>} Array of table statistics
   */
  async getDatabaseStats() {
    try {
      console.log('🔄 Fetching database statistics...');
      
      const { data, error } = await supabase
        .from('database_stats')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Successfully fetched database statistics');
      return data;
      
    } catch (error) {
      console.error('❌ Error fetching database statistics:', error);
      throw error;
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
      console.log('🔄 Searching players with filters...', searchParams);
      
      let query = supabase
        .from('qb_season_summary')
        .select('*');
      
      if (searchParams.name) {
        query = query.ilike('player_name', `%${searchParams.name}%`);
      }
      
      if (searchParams.team) {
        query = query.eq('team', searchParams.team);
      }
      
      if (searchParams.minRating) {
        query = query.gte('passer_rating', searchParams.minRating);
      }
      
      if (searchParams.minGames) {
        query = query.gte('games_started', searchParams.minGames);
      }
      
      if (searchParams.season) {
        query = query.eq('season', searchParams.season);
      }
      
      const { data, error } = await query
        .order('passer_rating', { ascending: false })
        .limit(50);
      
      if (error) {
        throw error;
      }
      
      console.log(`✅ Found ${data.length} players matching search criteria`);
      return data;
      
    } catch (error) {
      console.error('❌ Error searching players:', error);
      throw error;
    }
  },

  /**
   * Fetch 3rd & 1-3 splits data for all 2024 QBs
   * @returns {Promise<Array>} Array of 3rd & 1-3 splits data for all QBs
   */
  async fetchThirdAndShortData2024() {
    try {
      console.log('🔄 Fetching 3rd & 1-3 splits data for all 2024 QBs...');
      
      // Try multiple possible table structures for 3rd & 1-3 data
      let thirdDownData = [];
      let thirdDownError = null;
      
      // Try qb_splits_advanced first - exact match for 3rd & 1-3
      const { data: advancedData, error: advancedError } = await supabase
        .from('qb_splits_advanced')
        .select('*')
        .eq('split', 'other')
        .eq('value', '3rd & 1-3')
        .eq('season', 2024);
      
      console.log('🔍 Exact query results:', { 
        advancedData: advancedData?.length || 0, 
        advancedError: advancedError ? advancedError.message : null 
      });
      
      if (!advancedError && advancedData && advancedData.length > 0) {
        thirdDownData = advancedData;
        console.log(`✅ Found ${thirdDownData.length} records in qb_splits_advanced`);
      } else {
        // Try qb_splits table
        const { data: splitsData, error: splitsError } = await supabase
          .from('qb_splits')
          .select('*')
          .eq('split', 'other')
          .eq('value', '3rd & 1-3')
          .eq('season', 2024);
        
        if (!splitsError && splitsData && splitsData.length > 0) {
          thirdDownData = splitsData;
          console.log(`✅ Found ${thirdDownData.length} records in qb_splits`);
        } else {
          // Try different value formats
          const { data: altData, error: altError } = await supabase
            .from('qb_splits_advanced')
            .select('*')
            .eq('split', 'other')
            .eq('season', 2024)
            .or('value.eq.3rd & 1-3,value.eq.3rd and 1-3,value.eq.1-3');
          
          console.log('🔍 Split-only query results:', { 
            altData: altData?.length || 0, 
            altError: altError ? altError.message : null 
          });
          if (altData && altData.length > 0) {
            console.log('🔍 Sample altData record:', altData[0]);
          }
          
          if (!altError && altData && altData.length > 0) {
            thirdDownData = altData;
            console.log(`✅ Found ${thirdDownData.length} records with split='3rd & 1-3' (any value)`);
          } else {
                      // Try looking for 3rd & 1-3 data specifically (not all 3rd down)
          const { data: broadData, error: broadError } = await supabase
            .from('qb_splits_advanced')
            .select('*')
            .eq('season', 2024)
            .eq('split', 'other')
            .or('value.eq.3rd & 1-3,value.eq.3rd and 1-3,value.eq.1-3,value.eq.3rd');
          
          console.log('🔍 Broad query results:', { 
            broadData: broadData?.length || 0, 
            broadError: broadError ? broadError.message : null 
          });
          if (broadData && broadData.length > 0) {
            console.log('🔍 Sample broadData record:', broadData[0]);
          }
            
            if (!broadError && broadData && broadData.length > 0) {
              thirdDownData = broadData;
              console.log(`✅ Found ${thirdDownData.length} records with broad 3rd/1-3 search`);
            } else {
              thirdDownError = new Error('No 3rd & 1-3 data found in any table');
            }
          }
        }
      }
      
      if (thirdDownError) {
        throw thirdDownError;
      }
      
      console.log(`📊 Found ${thirdDownData.length} QBs with 3rd & 1-3 data in 2024`);
      
      // Transform the data to match expected format
      const thirdAndShortData = thirdDownData.map(record => ({
        pfr_id: record.pfr_id,
        player_name: record.player_name,
        team: record.team,
        season: record.season,
        split: '3rd & 1-3',
        value: '1-3 yards',
        att: record.att,
        cmp: record.cmp,
        yds: record.yds,
        td: record.td,
        int: record.int,
        rate: record.rate,
        // Add calculated fields
        completion_rate: record.att > 0 ? (record.cmp / record.att * 100).toFixed(1) : 0,
        yards_per_attempt: record.att > 0 ? (record.yds / record.att).toFixed(1) : 0,
        td_rate: record.att > 0 ? (record.td / record.att * 100).toFixed(1) : 0,
        int_rate: record.att > 0 ? (record.int / record.att * 100).toFixed(1) : 0
      }));
      
      console.log(`✅ Successfully fetched 3rd & 1-3 data for ${thirdAndShortData.length} QBs`);
      return thirdAndShortData;
      
    } catch (error) {
      console.error('❌ Error fetching 3rd & 1-3 data:', error);
      throw error;
    }
  },

  /**
   * Fetch 3rd & 1-3 splits data for a specific QB in 2024
   * @param {string} pfrId - The PFR ID of the player
   * @returns {Promise<Array>} Array of 3rd & 1-3 splits data
   */
  async fetchThirdAndShortDataForQB(pfrId) {
    try {
      console.log(`🔄 Fetching 3rd & 1-3 splits for QB ${pfrId} in 2024...`);
      
      // Try multiple possible table structures for 3rd & 1-3 data
      let data = [];
      let error = null;
      
      // Try qb_splits_advanced first
      const { data: advancedData, error: advancedError } = await supabase
        .from('qb_splits_advanced')
        .select('*')
        .eq('pfr_id', pfrId)
        .eq('split', 'other')
        .eq('value', '3rd & 1-3')
        .eq('season', 2024);
      
      if (!advancedError && advancedData && advancedData.length > 0) {
        data = advancedData;
      } else {
        // Try qb_splits table
        const { data: splitsData, error: splitsError } = await supabase
          .from('qb_splits')
          .select('*')
          .eq('pfr_id', pfrId)
          .eq('split', 'other')
          .eq('value', '3rd & 1-3')
          .eq('season', 2024);
        
        if (!splitsError && splitsData && splitsData.length > 0) {
          data = splitsData;
        } else {
          // Try different value formats
          const { data: altData, error: altError } = await supabase
            .from('qb_splits_advanced')
            .select('*')
            .eq('pfr_id', pfrId)
            .eq('split', 'other')
            .eq('season', 2024)
            .or('value.eq.3rd & 1-3,value.eq.3rd and 1-3,value.eq.1-3');
          
          if (!altError && altData && altData.length > 0) {
            data = altData;
          } else {
            // Try looking for 3rd & 1-3 data specifically (not all 3rd down)
            const { data: broadData, error: broadError } = await supabase
              .from('qb_splits_advanced')
              .select('*')
              .eq('pfr_id', pfrId)
              .eq('season', 2024)
              .eq('split', 'other')
              .or('value.eq.3rd & 1-3,value.eq.3rd and 1-3,value.eq.1-3,value.eq.3rd');
            
            if (!broadError && broadData && broadData.length > 0) {
              data = broadData;
            } else {
              error = new Error(`No 3rd & 1-3 data found for QB ${pfrId}`);
            }
          }
        }
      }
      
      if (error) {
        throw error;
      }
      
      // Transform the data to match expected format
      const transformedData = data.map(record => ({
        pfr_id: record.pfr_id,
        player_name: record.player_name,
        team: record.team,
        season: record.season,
        split: '3rd & 1-3',
        value: '1-3 yards',
        att: record.att,
        cmp: record.cmp,
        yds: record.yds,
        td: record.td,
        int: record.int,
        rate: record.rate,
        // Add calculated fields
        completion_rate: record.att > 0 ? (record.cmp / record.att * 100).toFixed(1) : 0,
        yards_per_attempt: record.att > 0 ? (record.yds / record.att).toFixed(1) : 0,
        td_rate: record.att > 0 ? (record.td / record.att * 100).toFixed(1) : 0,
        int_rate: record.att > 0 ? (record.int / record.att * 100).toFixed(1) : 0
      }));
      
      console.log(`✅ Successfully fetched ${transformedData.length} 3rd & 1-3 splits for QB ${pfrId}`);
      return transformedData;
      
    } catch (error) {
      console.error(`❌ Error fetching 3rd & 1-3 data for QB ${pfrId}:`, error);
      throw error;
    }
  },

  /**
   * Get summary statistics for 3rd & 1-3 performance across all 2024 QBs
   * @returns {Promise<Object>} Summary statistics object
   */
  async getThirdAndShortSummary2024() {
    try {
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
      
      // If any QBs have missing team info, try to fetch it from main QB data
      const qbsWithMissingTeams = qbBreakdown.filter(qb => !qb.team || qb.team === 'Unknown');
      if (qbsWithMissingTeams.length > 0) {
        console.log(`🔍 Fetching team info for ${qbsWithMissingTeams.length} QBs with missing team data...`);
        
        try {
          const { data: qbData, error: qbError } = await supabase
            .from('qb_passing_stats')
            .select('pfr_id, team')
            .eq('season', 2024)
            .in('pfr_id', qbsWithMissingTeams.map(qb => qb.pfr_id));
          
          if (!qbError && qbData) {
            const teamMap = {};
            qbData.forEach(qb => {
              teamMap[qb.pfr_id] = qb.team;
            });
            
            // Update QBs with missing team info
            qbBreakdown.forEach(qb => {
              if (!qb.team || qb.team === 'Unknown') {
                qb.team = teamMap[qb.pfr_id] || 'Unknown';
              }
            });
            
            console.log(`✅ Updated team info for ${Object.keys(teamMap).length} QBs`);
          }
        } catch (error) {
          console.warn('⚠️ Could not fetch team info from main QB data:', error.message);
        }
      }
      
      console.log('✅ Successfully generated 3rd & 1-3 summary statistics');
      return summary;
      
    } catch (error) {
      console.error('❌ Error generating 3rd & 1-3 summary:', error);
      throw error;
    }
  },

  /**
   * Diagnostic function to explore what 3rd down data exists in the database
   * @returns {Promise<Object>} Diagnostic information about available data
   */
  async diagnoseThirdDownData() {
    try {
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
      throw error;
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

// Error handling utilities
export const handleSupabaseError = (error) => {
  console.error('Supabase error:', error);
  
  if (error.code === 'PGRST116') {
    return 'No data found for the specified criteria';
  }
  
  if (error.code === 'PGRST301') {
    return 'Invalid filter parameters';
  }
  
  if (error.message.includes('JWT')) {
    return 'Authentication error - please check your credentials';
  }
  
  return error.message || 'An unexpected error occurred';
};

// Export default client for direct use
export default supabase; 