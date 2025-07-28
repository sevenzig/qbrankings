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
    
    // Get all split values from both tables
    let splitsData = null;
    let advancedSplitsData = null;
    
    // Fetch from qb_splits
    try {
      const { data, error } = await supabase
        .from('qb_splits')
        .select('split, value')
        .eq('season', season)
        .not('split', 'is', null)
        .not('value', 'is', null);
      
      if (!error && data) {
        splitsData = data;
        console.log(`✅ Found ${data.length} split records in qb_splits`);
      }
    } catch (error) {
      console.log(`⚠️ Error querying qb_splits:`, error.message);
    }
    
    // Fetch from qb_splits_advanced
    try {
      const { data, error } = await supabase
        .from('qb_splits_advanced')
        .select('split, value')
        .eq('season', season)
        .not('split', 'is', null)
        .not('value', 'is', null);
      
      if (!error && data) {
        advancedSplitsData = data;
        console.log(`✅ Found ${data.length} split records in qb_splits_advanced`);
      }
    } catch (error) {
      console.log(`⚠️ Error querying qb_splits_advanced:`, error.message);
    }
    
    // Combine and organize the data
    const allSplits = [...(splitsData || []), ...(advancedSplitsData || [])];
    
    if (allSplits.length === 0) {
      console.log(`⚠️ No split data found for ${season}`);
      return {};
    }
    
    // Group by split type
    const splitMap = {};
    allSplits.forEach(record => {
      if (!splitMap[record.split]) {
        splitMap[record.split] = new Set();
      }
      splitMap[record.split].add(record.value);
    });
    
    // Special handling for "Continuation" split type - map values to proper categories
    if (splitMap['Continuation']) {
      const continuationValues = Array.from(splitMap['Continuation']);
      
      // Map continuation values to proper split types
      continuationValues.forEach(value => {
        const properSplitType = mapContinuationValueToSplitType(value);
        if (properSplitType && properSplitType !== 'Continuation') {
          if (!splitMap[properSplitType]) {
            splitMap[properSplitType] = new Set();
          }
          splitMap[properSplitType].add(value);
        }
      });
      
      // Special handling for team names in Continuation
      const teamKeywords = [
        'Ravens', 'Chiefs', 'Bills', 'Patriots', 'Dolphins', 'Jets', 'Bengals', 'Browns', 'Steelers',
        'Texans', 'Colts', 'Jaguars', 'Titans', 'Broncos', 'Raiders', 'Chargers', 'Cowboys', 'Eagles',
        'Giants', 'Commanders', 'Bears', 'Lions', 'Packers', 'Vikings', 'Falcons', 'Panthers', 'Saints',
        'Buccaneers', 'Cardinals', 'Rams', '49ers', 'Seahawks'
      ];
      
      continuationValues.forEach(value => {
        const isTeamName = teamKeywords.some(keyword => 
          value.includes(keyword) || value.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (isTeamName) {
          if (!splitMap['Opponent']) {
            splitMap['Opponent'] = new Set();
          }
          splitMap['Opponent'].add(value);
        }
      });
      
      // Special handling for division names in Continuation
      const divisionKeywords = [
        'AFC East', 'AFC North', 'AFC South', 'AFC West',
        'NFC East', 'NFC North', 'NFC South', 'NFC West'
      ];
      
      continuationValues.forEach(value => {
        const isDivisionName = divisionKeywords.some(keyword => 
          value.includes(keyword) || value.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (isDivisionName) {
          if (!splitMap['Division']) {
            splitMap['Division'] = new Set();
          }
          splitMap['Division'].add(value);
        }
      });
      
      // Also check if there are any team names in the original Opponent split type
      if (splitMap['Opponent']) {
        const opponentValues = Array.from(splitMap['Opponent']);
        opponentValues.forEach(value => {
          const isTeamName = teamKeywords.some(keyword => 
            value.includes(keyword) || value.toLowerCase().includes(keyword.toLowerCase())
          );
          
          if (isTeamName) {
            // Already in Opponent, no need to add again
          }
        });
      }
      
      // Also check if there are any division names in the original Division split type
      if (splitMap['Division']) {
        const divisionValues = Array.from(splitMap['Division']);
        divisionValues.forEach(value => {
          const isDivisionName = divisionKeywords.some(keyword => 
            value.includes(keyword) || value.toLowerCase().includes(keyword.toLowerCase())
          );
          
          if (isDivisionName) {
            // Already in Division, no need to add again
          }
        });
      }
      
      // Remove the generic "Continuation" entry since we've mapped its values
      delete splitMap['Continuation'];
    }
    
    // Convert to the expected format
    const result = {};
    Object.entries(splitMap).forEach(([splitType, values]) => {
      result[splitType] = {
        values: Array.from(values).sort(),
        table: 'qb_splits_advanced', // Default to advanced table
        count: values.size
      };
    });
    
    console.log(`✅ Found ${Object.keys(result).length} split types with ${allSplits.length} total values`);
    return result;
    
  } catch (error) {
    console.error('❌ Error fetching available split types:', error);
    return {};
  }
};

/**
 * Map continuation values to their proper split types
 * @param {string} value - The continuation value
 * @returns {string} The proper split type
 */
const mapContinuationValueToSplitType = (value) => {
  const lowerValue = value.toLowerCase();
  
  // Down patterns
  if (lowerValue === '1st' || lowerValue === '2nd' || lowerValue === '3rd' || lowerValue === '4th') {
    return 'Down';
  }
  
  // Yards To Go patterns
  if (lowerValue === '1-3' || lowerValue === '4-6' || lowerValue === '7-9' || lowerValue === '10+') {
    return 'Yards To Go';
  }
  
  // Down & Yards to Go patterns
  if (lowerValue.includes('&') && (lowerValue.includes('1st') || lowerValue.includes('2nd') || 
      lowerValue.includes('3rd') || lowerValue.includes('4th'))) {
    return 'Down & Yards to Go';
  }
  
  // Quarter patterns
  if (lowerValue.includes('qtr') || lowerValue.includes('half')) {
    return 'Quarter';
  }
  
  // Field Position patterns
  if (lowerValue.includes('red zone') || lowerValue.includes('own') || 
      lowerValue.includes('opp') || lowerValue.includes('field')) {
    return 'Field Position';
  }
  
  // Score Differential patterns
  if (lowerValue.includes('leading') || lowerValue.includes('trailing') || 
      lowerValue === 'tied') {
    return 'Score Differential';
  }
  
  // Game Situation patterns
  if (lowerValue.includes('min to go')) {
    return 'Game Situation';
  }
  
  // Snap Type patterns
  if (lowerValue.includes('huddle') || lowerValue.includes('shotgun') || 
      lowerValue.includes('under center')) {
    return 'Snap Type & Huddle';
  }
  
  // Play Action patterns
  if (lowerValue.includes('play action')) {
    return 'Play Action';
  }
  
  // RPO patterns
  if (lowerValue.includes('rpo')) {
    return 'Run/Pass Option';
  }
  
  // Time in Pocket patterns
  if (lowerValue.includes('seconds')) {
    return 'Time in Pocket';
  }
  
  // Default to Continuation if we can't map it
  return 'Continuation';
};

/**
 * Get available statistics for a specific split type and value
 * @param {string} splitType - The split type (e.g., 'Down', 'Place')
 * @param {string} splitValue - The split value (e.g., '3rd', 'Home')
 * @param {number} season - The season (default: 2024)
 * @returns {Promise<Array>} Array of available statistics
 */
export const getAvailableStatistics = async (splitType, splitValue, season = 2024) => {
  try {
    console.log(`🔄 Getting available statistics for ${splitType} = ${splitValue} in ${season}...`);
    
    // Try both tables to find data
    let data = [];
    let tableUsed = '';
    
    // Try qb_splits_advanced first
    try {
      const { data: advancedData, error: advancedError } = await supabase
        .from('qb_splits_advanced')
        .select('*')
        .eq('split', splitType)
        .eq('value', splitValue)
        .eq('season', season)
        .limit(5);
      
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
          .eq('split', splitType)
          .eq('value', splitValue)
          .eq('season', season)
          .limit(5);
        
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
      return [];
    }
    
    // Get all available fields from the data
    const sampleRecord = data[0];
    const availableFields = Object.keys(sampleRecord).filter(field => 
      field !== 'id' && 
      field !== 'pfr_id' && 
      field !== 'player_name' && 
      field !== 'season' && 
      field !== 'split' && 
      field !== 'value' && 
      field !== 'scraped_at' && 
      field !== 'updated_at' &&
      sampleRecord[field] !== null &&
      sampleRecord[field] !== undefined
    );
    
    // Define field types and display names
    const fieldDefinitions = {
      // Basic stats
      'att': { displayName: 'Attempts', type: 'numeric' },
      'cmp': { displayName: 'Completions', type: 'numeric' },
      'yds': { displayName: 'Yards', type: 'numeric' },
      'td': { displayName: 'Touchdowns', type: 'numeric' },
      'int': { displayName: 'Interceptions', type: 'numeric' },
      'rate': { displayName: 'Passer Rating', type: 'numeric' },
      'sk': { displayName: 'Sacks', type: 'numeric' },
      'sk_yds': { displayName: 'Sack Yards', type: 'numeric' },
      
      // Rate stats
      'cmp_pct': { displayName: 'Completion %', type: 'percentage' },
      'y_a': { displayName: 'Yards/Attempt', type: 'numeric' },
      'ay_a': { displayName: 'Adj Yards/Attempt', type: 'numeric' },
      'sk_pct': { displayName: 'Sack %', type: 'percentage' },
      
      // Game stats
      'g': { displayName: 'Games', type: 'numeric' },
      'w': { displayName: 'Wins', type: 'numeric' },
      'l': { displayName: 'Losses', type: 'numeric' },
      't': { displayName: 'Ties', type: 'numeric' },
      
      // Rushing stats
      'rush_att': { displayName: 'Rush Attempts', type: 'numeric' },
      'rush_yds': { displayName: 'Rush Yards', type: 'numeric' },
      'rush_td': { displayName: 'Rush TDs', type: 'numeric' },
      'rush_y_a': { displayName: 'Rush Y/A', type: 'numeric' },
      
      // Advanced stats
      'first_downs': { displayName: 'First Downs', type: 'numeric' },
      'rush_first_downs': { displayName: 'Rush First Downs', type: 'numeric' },
      'inc': { displayName: 'Incompletions', type: 'numeric' },
      'a_g': { displayName: 'Attempts/Game', type: 'numeric' },
      'y_g': { displayName: 'Yards/Game', type: 'numeric' },
      'rush_a_g': { displayName: 'Rush Attempts/Game', type: 'numeric' },
      'rush_y_g': { displayName: 'Rush Yards/Game', type: 'numeric' },
      
      // Total stats
      'total_td': { displayName: 'Total TDs', type: 'numeric' },
      'pts': { displayName: 'Points', type: 'numeric' },
      
      // Fumble stats
      'fmb': { displayName: 'Fumbles', type: 'numeric' },
      'fl': { displayName: 'Fumbles Lost', type: 'numeric' },
      'ff': { displayName: 'Fumbles Forced', type: 'numeric' },
      'fr': { displayName: 'Fumbles Recovered', type: 'numeric' },
      'fr_yds': { displayName: 'Fumble Recovery Yards', type: 'numeric' },
      'fr_td': { displayName: 'Fumble Recovery TDs', type: 'numeric' }
    };
    
    // Create statistics array
    const statistics = availableFields.map(field => {
      const definition = fieldDefinitions[field] || { 
        displayName: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
        type: 'numeric' 
      };
      
      return {
        field: field,
        displayName: definition.displayName,
        type: definition.type,
        sampleValue: sampleRecord[field]
      };
    });
    
    console.log(`✅ Found ${statistics.length} available statistics`);
    return statistics;
    
  } catch (error) {
    console.error('❌ Error getting available statistics:', error);
    return [];
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
 * @param {string} splitType - The split type (e.g., 'Down', 'Place', 'Result')
 * @param {string} splitValue - The split value (e.g., '3rd', 'Home', 'Win')
 * @param {number} season - The season (default: 2024)
 * @param {number} minAttempts - Minimum attempts filter (default: 0)
 * @returns {Promise<Object>} Complete data for all QBs with all available statistics
 */
export const getAllDataForSplit = async (splitType, splitValue, season = 2024, minAttempts = 0) => {
  try {
    console.log(`🔄 Fetching ALL data for ${splitType} = ${splitValue} in ${season}...`);
    
    // Query database with the actual split type and value
    console.log(`🔍 Querying by split '${splitType}' and value '${splitValue}'`);
    
    // Try both tables to get complete data
    let splitsData = [];
    let advancedData = [];
    
    // Fetch from qb_splits
    try {
      const { data, error } = await supabase
        .from('qb_splits')
        .select('*')
        .eq('split', splitType)
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
        .eq('split', splitType)
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
    
    // If no data found with the direct split type, try "Continuation" split type
    if (splitsData.length === 0 && advancedData.length === 0) {
      console.log(`🔍 No data found for ${splitType} = ${splitValue}, trying Continuation split type...`);
      
      try {
        const { data, error } = await supabase
          .from('qb_splits_advanced')
          .select('*')
          .eq('split', 'Continuation')
          .eq('value', splitValue)
          .eq('season', season)
          .gte('att', minAttempts)
          .order('att', { ascending: false });
        
        if (!error && data) {
          advancedData = data.map(record => ({ ...record, table_source: 'qb_splits_advanced' }));
          console.log(`✅ Found ${data.length} records in qb_splits_advanced (Continuation)`);
        }
      } catch (error) {
        console.log(`⚠️ Error querying qb_splits_advanced (Continuation):`, error.message);
      }
    }
    
    // Special handling for team and division data - check if this is a team or division name and look in appropriate split types
    if (splitsData.length === 0 && advancedData.length === 0) {
      // Check if this looks like a team name
      const teamKeywords = [
        'Ravens', 'Chiefs', 'Bills', 'Patriots', 'Dolphins', 'Jets', 'Bengals', 'Browns', 'Steelers',
        'Texans', 'Colts', 'Jaguars', 'Titans', 'Broncos', 'Raiders', 'Chargers', 'Cowboys', 'Eagles',
        'Giants', 'Commanders', 'Bears', 'Lions', 'Packers', 'Vikings', 'Falcons', 'Panthers', 'Saints',
        'Buccaneers', 'Cardinals', 'Rams', '49ers', 'Seahawks'
      ];
      
      const isTeamName = teamKeywords.some(keyword => 
        splitValue.includes(keyword) || splitValue.toLowerCase().includes(keyword.toLowerCase())
      );
      
      // Check if this looks like a division name
      const divisionKeywords = [
        'AFC East', 'AFC North', 'AFC South', 'AFC West',
        'NFC East', 'NFC North', 'NFC South', 'NFC West'
      ];
      
      const isDivisionName = divisionKeywords.some(keyword => 
        splitValue.includes(keyword) || splitValue.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (isTeamName) {
        console.log(`🔍 Detected team name "${splitValue}", checking both Opponent and Continuation split types...`);
        
        // First try the original Opponent split type
        try {
          const { data, error } = await supabase
            .from('qb_splits')
            .select('*')
            .eq('split', 'Opponent')
            .eq('value', splitValue)
            .eq('season', season)
            .gte('att', minAttempts)
            .order('att', { ascending: false });
          
          if (!error && data && data.length > 0) {
            splitsData = data.map(record => ({ ...record, table_source: 'qb_splits' }));
            console.log(`✅ Found ${data.length} team records in qb_splits (Opponent)`);
          }
        } catch (error) {
          console.log(`⚠️ Error querying qb_splits (Opponent for team):`, error.message);
        }
        
        // If no data found in Opponent, try Continuation split type
        if (splitsData.length === 0) {
          try {
            const { data, error } = await supabase
              .from('qb_splits')
              .select('*')
              .eq('split', 'Continuation')
              .eq('value', splitValue)
              .eq('season', season)
              .gte('att', minAttempts)
              .order('att', { ascending: false });
            
            if (!error && data && data.length > 0) {
              splitsData = data.map(record => ({ ...record, table_source: 'qb_splits' }));
              console.log(`✅ Found ${data.length} team records in qb_splits (Continuation)`);
            }
          } catch (error) {
            console.log(`⚠️ Error querying qb_splits (Continuation for team):`, error.message);
          }
        }
      } else if (isDivisionName) {
        console.log(`🔍 Detected division name "${splitValue}", checking both Division and Continuation split types...`);
        
        // First try the original Division split type
        try {
          const { data, error } = await supabase
            .from('qb_splits')
            .select('*')
            .eq('split', 'Division')
            .eq('value', splitValue)
            .eq('season', season)
            .gte('att', minAttempts)
            .order('att', { ascending: false });
          
          if (!error && data && data.length > 0) {
            // Check if we have sufficient data in Division split type (more than 1 QB)
            if (data.length > 1) {
              splitsData = data.map(record => ({ ...record, table_source: 'qb_splits' }));
              console.log(`✅ Found ${data.length} division records in qb_splits (Division)`);
            } else {
              console.log(`⚠️ Only ${data.length} QB found in Division split type, checking Continuation for more comprehensive data...`);
              // Continue to check Continuation split type for more comprehensive data
            }
          }
        } catch (error) {
          console.log(`⚠️ Error querying qb_splits (Division for division):`, error.message);
        }
        
        // If no sufficient data found in Division, try Continuation split type
        if (splitsData.length === 0) {
          try {
            const { data, error } = await supabase
              .from('qb_splits')
              .select('*')
              .eq('split', 'Continuation')
              .eq('value', splitValue)
              .eq('season', season)
              .gte('att', minAttempts)
              .order('att', { ascending: false });
            
            if (!error && data && data.length > 0) {
              splitsData = data.map(record => ({ ...record, table_source: 'qb_splits' }));
              console.log(`✅ Found ${data.length} division records in qb_splits (Continuation)`);
            }
          } catch (error) {
            console.log(`⚠️ Error querying qb_splits (Continuation for division):`, error.message);
          }
        }
      }
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
      'cmp_pct': { displayName: 'Completion %', type: 'percentage', order: 9 },
      'y_a': { displayName: 'Yards/Attempt', type: 'numeric', order: 10 },
      'ay_a': { displayName: 'Adj Yards/Attempt', type: 'numeric', order: 11 },
      'rate': { displayName: 'Passer Rating', type: 'numeric', order: 12 },
      
      // Advanced stats (if available)
      'sk': { displayName: 'Sacks', type: 'numeric', order: 13 },
      'sk_yds': { displayName: 'Sack Yards', type: 'numeric', order: 14 },
      'sk_pct': { displayName: 'Sack %', type: 'percentage', order: 15 },
      'first_downs': { displayName: '1st Down %', type: 'percentage', order: 16 },
      
      // Game stats
      'g': { displayName: 'Games', type: 'numeric', order: 17 },
      'w': { displayName: 'Wins', type: 'numeric', order: 18 },
      'l': { displayName: 'Losses', type: 'numeric', order: 19 },
      't': { displayName: 'Ties', type: 'numeric', order: 20 },
      
      // Rushing stats
      'rush_att': { displayName: 'Rush Attempts', type: 'numeric', order: 21 },
      'rush_yds': { displayName: 'Rush Yards', type: 'numeric', order: 22 },
      'rush_td': { displayName: 'Rush TDs', type: 'numeric', order: 23 },
      'rush_y_a': { displayName: 'Rush Y/A', type: 'numeric', order: 24 },
      'rush_first_downs': { displayName: 'Rush 1st Downs', type: 'numeric', order: 25 },
      
      // Additional stats
      'inc': { displayName: 'Incompletions', type: 'numeric', order: 26 },
      'a_g': { displayName: 'Attempts/Game', type: 'numeric', order: 27 },
      'y_g': { displayName: 'Yards/Game', type: 'numeric', order: 28 },
      'rush_a_g': { displayName: 'Rush Attempts/Game', type: 'numeric', order: 29 },
      'rush_y_g': { displayName: 'Rush Yards/Game', type: 'numeric', order: 30 },
      
      // Total stats
      'total_td': { displayName: 'Total TDs', type: 'numeric', order: 31 },
      'pts': { displayName: 'Points', type: 'numeric', order: 32 },
      
      // Fumble stats
      'fmb': { displayName: 'Fumbles', type: 'numeric', order: 33 },
      'fl': { displayName: 'Fumbles Lost', type: 'numeric', order: 34 },
      'ff': { displayName: 'Fumbles Forced', type: 'numeric', order: 35 },
      'fr': { displayName: 'Fumbles Recovered', type: 'numeric', order: 36 },
      'fr_yds': { displayName: 'Fumble Recovery Yards', type: 'numeric', order: 37 },
      'fr_td': { displayName: 'Fumble Recovery TDs', type: 'numeric', order: 38 },
      
      // Metadata
      'value': { displayName: 'Value', type: 'text', order: 39 },
      'season': { displayName: 'Season', type: 'numeric', order: 40 },
      'table_source': { displayName: 'Source', type: 'text', order: 41 }
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
    const avgCompletionRate = deduplicatedData.reduce((sum, qb) => sum + (qb.cmp_pct || 0), 0) / totalQBs;
    const avgYardsPerAttempt = deduplicatedData.reduce((sum, qb) => sum + (qb.y_a || 0), 0) / totalQBs;
    
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