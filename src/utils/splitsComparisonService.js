/**
 * Splits Comparison Service
 * 
 * Provides flexible comparison capabilities for any statistic from
 * qb_splits or qb_splits_advanced tables
 */

import { supabase, isSupabaseAvailable } from './supabase.js';
import { 
  getSplitTypeForValue, 
  organizeSplitsByCategory, 
  getPopularSplits as getPopularSplitsFromMapping,
  getSplitTypeDescriptions 
} from './splitsMapping.js';

/**
 * Get all available split types and their values for a given season
 * @param {number} season - The season to fetch data for (default: 2024)
 * @returns {Promise<Object>} Object with split types as keys and arrays of values as values
 */
export const getAvailableSplitTypes = async (season = 2024) => {
  try {
    if (!isSupabaseAvailable()) {
      console.warn('⚠️ Supabase is not available - returning default splits');
      return {
        'Down & Yards to Go': {
          values: ['3rd & 1-3', '3rd & 4-6', '3rd & 7-9', '3rd & 10+'],
          table: 'qb_splits_advanced',
          count: 4
        },
        'Field Position': {
          values: ['Red Zone', 'Own 1-20', 'Own 21-50'],
          table: 'qb_splits_advanced',
          count: 3
        },
        'Quarter': {
          values: ['4th Qtr', '3rd Qtr', '2nd Qtr', '1st Qtr'],
          table: 'qb_splits_advanced',
          count: 4
        },
        'Place': {
          values: ['Home', 'Road'],
          table: 'qb_splits_advanced',
          count: 2
        },
        'Result': {
          values: ['Win', 'Loss'],
          table: 'qb_splits_advanced',
          count: 2
        }
      };
    }

    console.log(`🔄 Fetching available split types for ${season}...`);
    
    // Get all split values from both tables (all stored under 'other' split field)
    let splitsData = null;
    let advancedSplitsData = null;
    
    try {
      const { data, error } = await supabase
        .from('qb_splits')
        .select('split, value')
        .eq('season', season)
        .eq('split', 'other')
        .not('value', 'is', null);
      
      if (!error && data) {
        splitsData = data.map(record => ({ ...record, table_source: 'qb_splits' }));
        console.log(`✅ Found ${data.length} records in qb_splits for ${season}`);
      } else {
        console.log(`⚠️ No data in qb_splits for ${season}:`, error?.message || 'No records found');
      }
    } catch (error) {
      console.log(`⚠️ Error accessing qb_splits:`, error.message);
    }
    
    try {
      const { data, error } = await supabase
        .from('qb_splits_advanced')
        .select('split, value')
        .eq('season', season)
        .eq('split', 'other')
        .not('value', 'is', null);
      
      if (!error && data) {
        advancedSplitsData = data.map(record => ({ ...record, table_source: 'qb_splits_advanced' }));
        console.log(`✅ Found ${data.length} records in qb_splits_advanced for ${season}`);
      } else {
        console.log(`⚠️ No data in qb_splits_advanced for ${season}:`, error?.message || 'No records found');
      }
    } catch (error) {
      console.log(`⚠️ Error accessing qb_splits_advanced:`, error.message);
    }
    
    // Combine all data and organize by proper split categories using local mapping
    const allSplitsData = [...(splitsData || []), ...(advancedSplitsData || [])];
    
    if (allSplitsData.length === 0) {
      console.log('⚠️ No split data found, returning default splits for testing...');
      return {
        'Down & Yards to Go': {
          values: ['3rd & 1-3', '3rd & 4-6', '3rd & 7-9', '3rd & 10+'],
          table: 'qb_splits_advanced',
          count: 4
        },
        'Field Position': {
          values: ['Red Zone', 'Own 1-20', 'Own 21-50'],
          table: 'qb_splits_advanced',
          count: 3
        },
        'Quarter': {
          values: ['4th Qtr', '3rd Qtr', '2nd Qtr', '1st Qtr'],
          table: 'qb_splits_advanced',
          count: 4
        },
        'Place': {
          values: ['Home', 'Road'],
          table: 'qb_splits_advanced',
          count: 2
        },
        'Result': {
          values: ['Win', 'Loss'],
          table: 'qb_splits_advanced',
          count: 2
        }
      };
    }
    
    // Use the mapping system to organize splits by proper categories
    const result = organizeSplitsByCategory(allSplitsData);
    
    console.log(`✅ Found ${Object.keys(result).length} split categories for ${season}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error fetching available split types:', error);
    // Return default splits for testing
    return {
      'Down & Yards to Go': {
        values: ['3rd & 1-3', '3rd & 4-6', '3rd & 7-9', '3rd & 10+'],
        table: 'qb_splits_advanced',
        count: 4
      },
      'Field Position': {
        values: ['Red Zone', 'Own 1-20', 'Own 21-50'],
        table: 'qb_splits_advanced',
        count: 3
      },
      'Quarter': {
        values: ['4th Qtr', '3rd Qtr', '2nd Qtr', '1st Qtr'],
        table: 'qb_splits_advanced',
        count: 4
      },
      'Place': {
        values: ['Home', 'Road'],
        table: 'qb_splits_advanced',
        count: 2
      },
      'Result': {
        values: ['Win', 'Loss'],
        table: 'qb_splits_advanced',
        count: 2
      }
    };
  }
};

/**
 * Get available statistics for a given split type and value
 * @param {string} splitType - The split type (e.g., 'Down', 'Place', 'Result')
 * @param {string} splitValue - The split value (e.g., '3rd', 'Red Zone', 'Win')
 * @param {number} season - The season (default: 2024)
 * @returns {Promise<Array>} Array of available statistics
 */
export const getAvailableStatistics = async (splitType, splitValue, season = 2024) => {
  try {
    if (!isSupabaseAvailable()) {
      console.warn('⚠️ Supabase is not available - returning default statistics');
      return [
        'completions', 'attempts', 'completion_pct', 'yards', 'yards_per_attempt',
        'touchdowns', 'interceptions', 'rating', 'sacks', 'sack_yards'
      ];
    }

    console.log(`🔄 Fetching available statistics for ${splitType} = ${splitValue} in ${season}...`);
    
    // Query database by 'other' split field and specific value, then categorize locally
    console.log(`🔍 Querying by value '${splitValue}' (database uses 'other' as split field)`);
    
    // Try both tables with better error handling
    let sampleRecord = null;
    let tableUsed = '';
    
    // Try qb_splits_advanced first
    try {
      const { data, error } = await supabase
        .from('qb_splits_advanced')
        .select('*')
        .eq('split', 'other')
        .eq('value', splitValue)
        .eq('season', season)
        .limit(1);
      
      if (!error && data && data.length > 0) {
        sampleRecord = data[0];
        tableUsed = 'qb_splits_advanced';
        console.log(`✅ Found sample record in qb_splits_advanced`);
      }
    } catch (error) {
      console.log(`⚠️ Error querying qb_splits_advanced:`, error.message);
    }
    
    // Try qb_splits if no record found
    if (!sampleRecord) {
      try {
        const { data, error } = await supabase
          .from('qb_splits')
          .select('*')
          .eq('split', 'other')
          .eq('value', splitValue)
          .eq('season', season)
          .limit(1);
        
        if (!error && data && data.length > 0) {
          sampleRecord = data[0];
          tableUsed = 'qb_splits';
          console.log(`✅ Found sample record in qb_splits`);
        }
      } catch (error) {
        console.log(`⚠️ Error querying qb_splits:`, error.message);
      }
    }
    
    if (!sampleRecord) {
      console.log(`⚠️ No data found for ${splitType} = ${splitValue} in ${season}`);
      // Return default statistics for testing
      return [
        'completions', 'attempts', 'completion_pct', 'yards', 'yards_per_attempt',
        'touchdowns', 'interceptions', 'rating', 'sacks', 'sack_yards'
      ];
    }
    
    // Get all numeric fields (potential statistics)
    const statistics = [];
    Object.entries(sampleRecord).forEach(([key, value]) => {
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
        statistics.push({
          field: key,
          displayName: formatFieldName(key),
          type: 'numeric',
          sampleValue: value
        });
      }
    });
    
    console.log(`✅ Found ${statistics.length} available statistics`);
    return statistics;
    
  } catch (error) {
    console.error('❌ Error fetching available statistics:', error);
    // Return default statistics for testing
    return [
      { field: 'att', displayName: 'Attempts', type: 'numeric', sampleValue: 25 },
      { field: 'cmp', displayName: 'Completions', type: 'numeric', sampleValue: 18 },
      { field: 'yds', displayName: 'Yards', type: 'numeric', sampleValue: 245 },
      { field: 'td', displayName: 'Touchdowns', type: 'numeric', sampleValue: 3 },
      { field: 'int', displayName: 'Interceptions', type: 'numeric', sampleValue: 1 },
      { field: 'rate', displayName: 'Passer Rating', type: 'numeric', sampleValue: 95.2 },
      { field: 'completion_rate', displayName: 'Completion Rate', type: 'numeric', sampleValue: 72.0 },
      { field: 'yards_per_attempt', displayName: 'Yards/Attempt', type: 'numeric', sampleValue: 9.8 },
      { field: 'td_rate', displayName: 'TD Rate', type: 'numeric', sampleValue: 12.0 },
      { field: 'int_rate', displayName: 'INT Rate', type: 'numeric', sampleValue: 4.0 }
    ];
  }
};

/**
 * Fetch comparison data for a specific split, value, and statistic
 * @param {string} splitType - The split type
 * @param {string} splitValue - The split value
 * @param {string} statistic - The statistic to compare
 * @param {number} season - The season (default: 2024)
 * @param {number} minAttempts - Minimum attempts filter (default: 0)
 * @returns {Promise<Array>} Array of QB comparison data
 */
export const fetchComparisonData = async (splitType, splitValue, statistic, season = 2024, minAttempts = 0) => {
  try {
    console.log(`🔄 Fetching comparison data for ${splitType} = ${splitValue}, stat: ${statistic} in ${season}...`);
    
    // Query database by 'other' split field and specific value, then categorize locally
    console.log(`🔍 Querying by value '${splitValue}' (database uses 'other' as split field)`);
    
    // Try both tables to find data
    let data = [];
    let tableUsed = '';
    
    // Try qb_splits_advanced first
    try {
      const { data: advancedData, error: advancedError } = await supabase
        .from('qb_splits_advanced')
        .select('*')
        .eq('split', 'other')
        .eq('value', splitValue)
        .eq('season', season);
      
      if (!advancedError && advancedData && advancedData.length > 0) {
        data = advancedData;
        tableUsed = 'qb_splits_advanced';
        console.log(`✅ Found ${data.length} records in qb_splits_advanced`);
      }
    } catch (error) {
      console.log(`⚠️ Error querying qb_splits_advanced:`, error.message);
    }
    
    // Try qb_splits if no data found
    if (data.length === 0) {
      try {
        const { data: splitsData, error: splitsError } = await supabase
          .from('qb_splits')
          .select('*')
          .eq('split', 'other')
          .eq('value', splitValue)
          .eq('season', season);
        
        if (!splitsError && splitsData && splitsData.length > 0) {
          data = splitsData;
          tableUsed = 'qb_splits';
          console.log(`✅ Found ${data.length} records in qb_splits`);
        }
      } catch (error) {
        console.log(`⚠️ Error querying qb_splits:`, error.message);
      }
    }
    
    if (data.length === 0) {
      console.log(`⚠️ No data found for ${splitType} = ${splitValue} in ${season}`);
      // Return sample data for testing
      return [
        {
          pfr_id: 'MahoPa00',
          player_name: 'Patrick Mahomes',
          team: 'KAN',
          season: season,
          split_type: splitType,
          split_value: splitValue,
          attempts: 25,
          completions: 18,
          yards: 245,
          touchdowns: 3,
          interceptions: 1,
          passer_rating: 95.2,
          completion_rate: '72.0',
          yards_per_attempt: '9.8',
          td_rate: '12.0',
          int_rate: '4.0',
          table_source: 'sample_data'
        },
        {
          pfr_id: 'AlleJo00',
          player_name: 'Josh Allen',
          team: 'BUF',
          season: season,
          split_type: splitType,
          split_value: splitValue,
          attempts: 30,
          completions: 22,
          yards: 280,
          touchdowns: 2,
          interceptions: 0,
          passer_rating: 98.5,
          completion_rate: '73.3',
          yards_per_attempt: '9.3',
          td_rate: '6.7',
          int_rate: '0.0',
          table_source: 'sample_data'
        }
      ];
    }
    
    // Transform and filter data
    const transformedData = data
      .filter(record => {
        // Filter by minimum attempts if the field exists
        if (minAttempts > 0 && record.att !== undefined) {
          return parseInt(record.att) >= minAttempts;
        }
        return true;
      })
      .map(record => {
        const statValue = parseFloat(record[statistic]) || 0;
        
        // Calculate derived statistics if they don't exist
        const derivedStats = {};
        if (record.att && record.att > 0) {
          if (record.cmp !== undefined) {
            derivedStats.completion_rate = (parseFloat(record.cmp) / parseFloat(record.att) * 100).toFixed(1);
          }
          if (record.yds !== undefined) {
            derivedStats.yards_per_attempt = (parseFloat(record.yds) / parseFloat(record.att)).toFixed(1);
          }
          if (record.td !== undefined) {
            derivedStats.td_rate = (parseFloat(record.td) / parseFloat(record.att) * 100).toFixed(1);
          }
          if (record.int !== undefined) {
            derivedStats.int_rate = (parseFloat(record.int) / parseFloat(record.att) * 100).toFixed(1);
          }
        }
        
        return {
          pfr_id: record.pfr_id,
          player_name: record.player_name,
          team: record.team,
          season: record.season,
          split_type: record.split,
          split_value: record.value,
          attempts: parseInt(record.att) || 0,
          completions: parseInt(record.cmp) || 0,
          yards: parseInt(record.yds) || 0,
          touchdowns: parseInt(record.td) || 0,
          interceptions: parseInt(record.int) || 0,
          passer_rating: parseFloat(record.rate) || 0,
          [statistic]: statValue,
          ...derivedStats,
          table_source: tableUsed
        };
      })
      .sort((a, b) => b[statistic] - a[statistic]); // Sort by the selected statistic
    
    console.log(`✅ Found ${transformedData.length} QBs with data for ${splitType} = ${splitValue}`);
    return transformedData;
    
  } catch (error) {
    console.error('❌ Error fetching comparison data:', error);
    throw error;
  }
};

/**
 * Get top performers for a specific split and statistic
 * @param {string} splitType - The split type
 * @param {string} splitValue - The split value
 * @param {string} statistic - The statistic to rank by
 * @param {number} season - The season (default: 2024)
 * @param {number} minAttempts - Minimum attempts filter (default: 10)
 * @param {number} limit - Number of top performers to return (default: 10)
 * @returns {Promise<Array>} Array of top performers
 */
export const getTopPerformers = async (splitType, splitValue, statistic, season = 2024, minAttempts = 10, limit = 10) => {
  try {
    const data = await fetchComparisonData(splitType, splitValue, statistic, season, minAttempts);
    return data.slice(0, limit);
  } catch (error) {
    console.error('❌ Error getting top performers:', error);
    throw error;
  }
};

/**
 * Get comprehensive comparison data with multiple statistics
 * @param {string} splitType - The split type
 * @param {string} splitValue - The split value
 * @param {Array} statistics - Array of statistics to include
 * @param {number} season - The season (default: 2024)
 * @param {number} minAttempts - Minimum attempts filter (default: 0)
 * @returns {Promise<Object>} Comprehensive comparison data
 */
export const getComprehensiveComparison = async (splitType, splitValue, statistics = [], season = 2024, minAttempts = 0) => {
  try {
    console.log(`🔄 Getting comprehensive comparison for ${splitType} = ${splitValue} in ${season}...`);
    
    // Get base data
    const baseData = await fetchComparisonData(splitType, splitValue, 'att', season, minAttempts);
    
    // Calculate summary statistics
    const summary = {
      total_qbs: baseData.length,
      total_attempts: baseData.reduce((sum, qb) => sum + qb.attempts, 0),
      total_completions: baseData.reduce((sum, qb) => sum + qb.completions, 0),
      total_yards: baseData.reduce((sum, qb) => sum + qb.yards, 0),
      total_touchdowns: baseData.reduce((sum, qb) => sum + qb.touchdowns, 0),
      total_interceptions: baseData.reduce((sum, qb) => sum + qb.interceptions, 0),
      average_completion_rate: baseData.length > 0 ? 
        (baseData.reduce((sum, qb) => sum + parseFloat(qb.completion_rate || 0), 0) / baseData.length).toFixed(1) : 0,
      average_yards_per_attempt: baseData.length > 0 ? 
        (baseData.reduce((sum, qb) => sum + parseFloat(qb.yards_per_attempt || 0), 0) / baseData.length).toFixed(1) : 0,
      average_td_rate: baseData.length > 0 ? 
        (baseData.reduce((sum, qb) => sum + parseFloat(qb.td_rate || 0), 0) / baseData.length).toFixed(1) : 0,
      average_int_rate: baseData.length > 0 ? 
        (baseData.reduce((sum, qb) => sum + parseFloat(qb.int_rate || 0), 0) / baseData.length).toFixed(1) : 0
    };
    
    // Get top performers for each statistic
    const topPerformers = {};
    for (const stat of statistics) {
      try {
        topPerformers[stat] = await getTopPerformers(splitType, splitValue, stat, season, minAttempts, 10);
      } catch (error) {
        console.warn(`⚠️ Could not get top performers for ${stat}:`, error.message);
        topPerformers[stat] = [];
      }
    }
    
    return {
      split_type: splitType,
      split_value: splitValue,
      season,
      summary,
      qb_breakdown: baseData,
      top_performers: topPerformers,
      available_statistics: statistics
    };
    
  } catch (error) {
    console.error('❌ Error getting comprehensive comparison:', error);
    throw error;
  }
};

/**
 * Format field names for display
 * @param {string} fieldName - The raw field name
 * @returns {string} Formatted display name
 */
const formatFieldName = (fieldName) => {
  const fieldMap = {
    'att': 'Attempts',
    'cmp': 'Completions',
    'yds': 'Yards',
    'td': 'Touchdowns',
    'int': 'Interceptions',
    'rate': 'Passer Rating',
    'cmp_pct': 'Completion %',
    'td_pct': 'TD %',
    'int_pct': 'INT %',
    'y_a': 'Yards/Attempt',
    'ay_a': 'Adjusted Yards/Attempt',
    'y_c': 'Yards/Completion',
    'sk': 'Sacks',
    'sk_pct': 'Sack %',
    'ny_a': 'Net Yards/Attempt',
    'any_a': 'Adjusted Net Yards/Attempt',
    'completion_rate': 'Completion Rate',
    'yards_per_attempt': 'Yards/Attempt',
    'td_rate': 'TD Rate',
    'int_rate': 'INT Rate'
  };
  
  return fieldMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Get ALL data for a given split value - comprehensive table view
 * @param {string} splitType - The split type (e.g., 'other')
 * @param {string} splitValue - The split value (e.g., '3rd & 1-3')
 * @param {number} season - The season (default: 2024)
 * @param {number} minAttempts - Minimum attempts filter (default: 0)
 * @returns {Promise<Object>} Complete data for all QBs with all available statistics
 */
export const getAllDataForSplit = async (splitType, splitValue, season = 2024, minAttempts = 0) => {
  try {
    console.log(`🔄 Fetching ALL data for ${splitType} = ${splitValue} in ${season}...`);
    
    // Query database by 'other' split field and specific value, then categorize locally
    console.log(`🔍 Querying by value '${splitValue}' (database uses 'other' as split field)`);
    
    // Try both tables to get complete data
    let splitsData = [];
    let advancedData = [];
    
    // Fetch from qb_splits
    try {
      const { data, error } = await supabase
        .from('qb_splits')
        .select('*')
        .eq('split', 'other')
        .eq('value', splitValue)
        .eq('season', season)
        .gte('att', minAttempts)
        .order('att', { ascending: false });
      
      if (!error && data) {
        splitsData = data.map(record => ({ ...record, table_source: 'qb_splits' }));
        console.log(`✅ Found ${data.length} records in qb_splits`);
      }
    } catch (error) {
      console.log(`⚠️ Error querying qb_splits:`, error.message);
    }
    
    // Fetch from qb_splits_advanced
    try {
      const { data, error } = await supabase
        .from('qb_splits_advanced')
        .select('*')
        .eq('split', 'other')
        .eq('value', splitValue)
        .eq('season', season)
        .gte('att', minAttempts)
        .order('att', { ascending: false });
      
      if (!error && data) {
        advancedData = data.map(record => ({ ...record, table_source: 'qb_splits_advanced' }));
        console.log(`✅ Found ${data.length} records in qb_splits_advanced`);
      }
    } catch (error) {
      console.log(`⚠️ Error querying qb_splits_advanced:`, error.message);
    }
    
    // Combine data from both tables with deduplication
    const allData = [...splitsData, ...advancedData];
    
    // Deduplicate by player_name, prioritizing qb_splits_advanced over qb_splits
    const playerMap = new Map();
    
    allData.forEach(record => {
      const playerName = record.player_name;
      
      if (!playerMap.has(playerName)) {
        // First occurrence of this player
        playerMap.set(playerName, record);
      } else {
        // Player already exists, prioritize qb_splits_advanced
        const existingRecord = playerMap.get(playerName);
        if (record.table_source === 'qb_splits_advanced' && existingRecord.table_source === 'qb_splits') {
          // Replace with advanced data
          playerMap.set(playerName, record);
        }
        // If both are from same table or existing is already advanced, keep existing
      }
    });
    
    // Convert back to array
    const deduplicatedData = Array.from(playerMap.values());
    
    console.log(`✅ Deduplicated from ${allData.length} to ${deduplicatedData.length} unique players`);
    
    if (deduplicatedData.length === 0) {
      console.log(`⚠️ No data found for ${splitType} = ${splitValue} in ${season}`);
      return {
        data: [],
        columns: [],
        summary: {
          total_qbs: 0,
          total_attempts: 0,
          average_completion_rate: 0,
          average_yards_per_attempt: 0
        },
        split_type: splitType,
        split_value: splitValue,
        season: season
      };
    }
    
    // Get all unique column names from the data
    const allColumns = new Set();
    deduplicatedData.forEach(record => {
      Object.keys(record).forEach(key => allColumns.add(key));
    });
    
    // Define column order and display names
    const columnDefinitions = {
      // Core QB info
      'player_name': { displayName: 'Player', type: 'text', order: 1 },
      'team': { displayName: 'Team', type: 'text', order: 2 },
      'pfr_id': { displayName: 'PFR ID', type: 'text', order: 3 },
      
      // Basic stats
      'att': { displayName: 'Attempts', type: 'numeric', order: 4 },
      'cmp': { displayName: 'Completions', type: 'numeric', order: 5 },
      'yds': { displayName: 'Yards', type: 'numeric', order: 6 },
      'td': { displayName: 'Touchdowns', type: 'numeric', order: 7 },
      'int': { displayName: 'Interceptions', type: 'numeric', order: 8 },
      
      // Rate stats
      'completion_rate': { displayName: 'Completion %', type: 'percentage', order: 9 },
      'yards_per_attempt': { displayName: 'Yards/Attempt', type: 'numeric', order: 10 },
      'td_rate': { displayName: 'TD %', type: 'percentage', order: 11 },
      'int_rate': { displayName: 'INT %', type: 'percentage', order: 12 },
      'passer_rating': { displayName: 'Passer Rating', type: 'numeric', order: 13 },
      
      // Advanced stats (if available)
      'sack': { displayName: 'Sacks', type: 'numeric', order: 14 },
      'sack_rate': { displayName: 'Sack %', type: 'percentage', order: 15 },
      'first_down_rate': { displayName: '1st Down %', type: 'percentage', order: 16 },
      'air_yards_per_attempt': { displayName: 'Air Yards/Att', type: 'numeric', order: 17 },
      'yards_after_catch_per_attempt': { displayName: 'YAC/Att', type: 'numeric', order: 18 },
      
      // Additional advanced stats
      'rate': { displayName: 'Rate', type: 'numeric', order: 19 },
      'sk': { displayName: 'Sacks', type: 'numeric', order: 20 },
      'sk_pct': { displayName: 'Sack %', type: 'percentage', order: 21 },
      'ny_a': { displayName: 'Net Yards/Att', type: 'numeric', order: 22 },
      'any_a': { displayName: 'Adj Net Yards/Att', type: 'numeric', order: 23 },
      'ay_a': { displayName: 'Adj Yards/Att', type: 'numeric', order: 24 },
      'y_c': { displayName: 'Yards/Completion', type: 'numeric', order: 25 },
      
      // Metadata (only value, remove split)
      'value': { displayName: 'Value', type: 'text', order: 26 },
      'season': { displayName: 'Season', type: 'numeric', order: 27 },
      'table_source': { displayName: 'Source', type: 'text', order: 28 }
    };
    
    // Create ordered columns array
    const orderedColumns = Array.from(allColumns)
      .filter(col => columnDefinitions[col] && col !== 'split') // Exclude 'split' column
      .sort((a, b) => columnDefinitions[a].order - columnDefinitions[b].order)
      .map(col => ({
        field: col,
        displayName: columnDefinitions[col].displayName,
        type: columnDefinitions[col].type
      }));
    
    // Add any remaining columns that aren't in our definitions
    Array.from(allColumns)
      .filter(col => !columnDefinitions[col])
      .forEach(col => {
        orderedColumns.push({
          field: col,
          displayName: formatFieldName(col),
          type: 'numeric'
        });
      });
    
    // Calculate summary statistics
    const totalQBs = deduplicatedData.length;
    const totalAttempts = deduplicatedData.reduce((sum, qb) => sum + (qb.att || 0), 0);
    const avgCompletionRate = deduplicatedData.reduce((sum, qb) => sum + (qb.completion_rate || 0), 0) / totalQBs;
    const avgYardsPerAttempt = deduplicatedData.reduce((sum, qb) => sum + (qb.yards_per_attempt || 0), 0) / totalQBs;
    
    return {
      data: deduplicatedData,
      columns: orderedColumns,
      summary: {
        total_qbs: totalQBs,
        total_attempts: totalAttempts,
        average_completion_rate: avgCompletionRate.toFixed(1),
        average_yards_per_attempt: avgYardsPerAttempt.toFixed(2)
      },
      split_type: splitType,
      split_value: splitValue,
      season: season
    };
    
  } catch (error) {
    console.error('❌ Error fetching all data for split:', error);
    throw error;
  }
};

/**
 * Get popular split combinations for quick access
 * @returns {Array} Array of popular split combinations
 */
export const getPopularSplits = () => {
  return getPopularSplitsFromMapping();
}; 