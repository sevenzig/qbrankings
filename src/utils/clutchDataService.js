/**
 * Clutch Data Service
 * 
 * Fetches and aggregates situational split data from Supabase for clutch performance analysis.
 * Handles data from both qb_splits and qb_splits_advanced tables.
 */

import { supabase, isSupabaseAvailable } from './supabase.js';
import { getClutchCategory } from './clutchCategories.js';

/**
 * Fetch clutch splits data for a specific QB and category
 * @param {string} pfr_id - The QB's PFR ID
 * @param {Array<number>} seasons - Array of seasons to fetch
 * @param {string} categoryKey - The clutch category key
 * @returns {Promise<Object>} Aggregated stats for the category
 */
export const fetchClutchSplitsForQB = async (pfr_id, seasons, categoryKey) => {
  try {
    if (!isSupabaseAvailable()) {
      console.warn('⚠️ Supabase not available for clutch data');
      return getEmptyStats();
    }

    const category = getClutchCategory(categoryKey);
    if (!category) {
      console.error(`❌ Unknown clutch category: ${categoryKey}`);
      return getEmptyStats();
    }

    console.log(`🔄 Fetching clutch splits for ${pfr_id} in category ${categoryKey}...`);

    // Get all split values for this category
    const splitValues = category.getAllSplitValues();
    const splitType = category.getSplitType();

    // Fetch from qb_splits_advanced (primary source for situational stats)
    const { data: advancedData, error: advancedError } = await supabase
      .from('qb_splits_advanced')
      .select('*')
      .eq('pfr_id', pfr_id)
      .in('season', seasons)
      .eq('split', splitType)
      .in('value', splitValues)
      .gte('att', 1); // Only records with attempts

    if (advancedError) {
      console.error(`❌ Error fetching advanced splits:`, advancedError);
      return getEmptyStats();
    }

    // Fetch from qb_splits for fumble data (needed for turnover rate)
    const { data: splitsData, error: splitsError } = await supabase
      .from('qb_splits')
      .select('*')
      .eq('pfr_id', pfr_id)
      .in('season', seasons)
      .eq('split', splitType)
      .in('value', splitValues)
      .gte('att', 1);

    if (splitsError) {
      console.warn(`⚠️ Error fetching fumble data:`, splitsError);
    }

    // Aggregate the data
    const aggregatedStats = aggregateSplitStats(advancedData || [], splitsData || []);

    console.log(`✅ Found ${aggregatedStats.totalAttempts} attempts for ${categoryKey}`);
    return aggregatedStats;

  } catch (error) {
    console.error(`❌ Error fetching clutch splits for ${pfr_id}:`, error);
    return getEmptyStats();
  }
};

/**
 * Fetch clutch splits data for all QBs in a category (for z-score calculations)
 * @param {Array<number>} seasons - Array of seasons to fetch
 * @param {string} categoryKey - The clutch category key
 * @returns {Promise<Array>} Array of QB stats for the category
 */
export const fetchAllQBsClutchData = async (seasons, categoryKey) => {
  try {
    if (!isSupabaseAvailable()) {
      console.warn('⚠️ Supabase not available for clutch data');
      return [];
    }

    const category = getClutchCategory(categoryKey);
    if (!category) {
      console.error(`❌ Unknown clutch category: ${categoryKey}`);
      return [];
    }

    console.log(`🔄 Fetching all QBs clutch data for category ${categoryKey}...`);

    const splitValues = category.getAllSplitValues();
    const splitType = category.getSplitType();

    // Fetch from qb_splits_advanced
    const { data: advancedData, error: advancedError } = await supabase
      .from('qb_splits_advanced')
      .select('*')
      .in('season', seasons)
      .eq('split', splitType)
      .in('value', splitValues)
      .gte('att', 1);

    if (advancedError) {
      console.error(`❌ Error fetching advanced splits:`, advancedError);
      return [];
    }

    // Fetch from qb_splits for fumble data
    const { data: splitsData, error: splitsError } = await supabase
      .from('qb_splits')
      .select('*')
      .in('season', seasons)
      .eq('split', splitType)
      .in('value', splitValues)
      .gte('att', 1);

    if (splitsError) {
      console.warn(`⚠️ Error fetching fumble data:`, splitsError);
    }

    // Group by QB and aggregate
    const qbStatsMap = new Map();

    // Process advanced data
    (advancedData || []).forEach(record => {
      const key = `${record.pfr_id}_${record.season}`;
      if (!qbStatsMap.has(key)) {
        qbStatsMap.set(key, {
          pfr_id: record.pfr_id,
          player_name: record.player_name,
          season: record.season,
          advancedRecords: [],
          splitsRecords: []
        });
      }
      qbStatsMap.get(key).advancedRecords.push(record);
    });

    // Process splits data
    (splitsData || []).forEach(record => {
      const key = `${record.pfr_id}_${record.season}`;
      if (qbStatsMap.has(key)) {
        qbStatsMap.get(key).splitsRecords.push(record);
      }
    });

    // Aggregate stats for each QB
    const allQBStats = [];
    qbStatsMap.forEach((qbData, key) => {
      const aggregatedStats = aggregateSplitStats(qbData.advancedRecords, qbData.records);
      if (aggregatedStats.totalAttempts >= 10) { // Minimum threshold
        allQBStats.push({
          pfr_id: qbData.pfr_id,
          player_name: qbData.player_name,
          season: qbData.season,
          ...aggregatedStats
        });
      }
    });

    console.log(`✅ Found ${allQBStats.length} QBs with sufficient data for ${categoryKey}`);
    return allQBStats;

  } catch (error) {
    console.error(`❌ Error fetching all QBs clutch data:`, error);
    return [];
  }
};

/**
 * Aggregate multiple split records into combined stats
 * @param {Array} advancedRecords - Records from qb_splits_advanced
 * @param {Array} splitsRecords - Records from qb_splits
 * @returns {Object} Aggregated statistics
 */
export const aggregateSplitStats = (advancedRecords, splitsRecords) => {
  if (!advancedRecords || advancedRecords.length === 0) {
    return getEmptyStats();
  }

  // Aggregate advanced stats
  const aggregated = {
    totalAttempts: 0,
    totalCompletions: 0,
    totalYards: 0,
    totalTouchdowns: 0,
    totalInterceptions: 0,
    totalFirstDowns: 0,
    totalSacks: 0,
    totalSackYards: 0,
    totalFumbles: 0,
    totalFumblesLost: 0,
    totalRushAttempts: 0,
    totalRushYards: 0,
    totalRushTouchdowns: 0,
    recordCount: advancedRecords.length
  };

  // Sum up all the stats
  advancedRecords.forEach(record => {
    aggregated.totalAttempts += parseInt(record.att) || 0;
    aggregated.totalCompletions += parseInt(record.cmp) || 0;
    aggregated.totalYards += parseInt(record.yds) || 0;
    aggregated.totalTouchdowns += parseInt(record.td) || 0;
    aggregated.totalInterceptions += parseInt(record.int) || 0;
    aggregated.totalFirstDowns += parseInt(record.first_downs) || 0;
    aggregated.totalSacks += parseInt(record.sk) || 0;
    aggregated.totalSackYards += parseInt(record.sk_yds) || 0;
    aggregated.totalRushAttempts += parseInt(record.rush_att) || 0;
    aggregated.totalRushYards += parseInt(record.rush_yds) || 0;
    aggregated.totalRushTouchdowns += parseInt(record.rush_td) || 0;
  });

  // Add fumble data from splits records
  splitsRecords.forEach(record => {
    aggregated.totalFumbles += parseInt(record.fmb) || 0;
    aggregated.totalFumblesLost += parseInt(record.fl) || 0;
  });

  // Calculate derived metrics
  const totalDropbacks = aggregated.totalAttempts + aggregated.totalSacks;
  
  return {
    ...aggregated,
    // Basic rates
    completionRate: aggregated.totalAttempts > 0 ? aggregated.totalCompletions / aggregated.totalAttempts : 0,
    touchdownRate: aggregated.totalAttempts > 0 ? aggregated.totalTouchdowns / aggregated.totalAttempts : 0,
    interceptionRate: aggregated.totalAttempts > 0 ? aggregated.totalInterceptions / aggregated.totalAttempts : 0,
    conversionRate: aggregated.totalAttempts > 0 ? aggregated.totalFirstDowns / aggregated.totalAttempts : 0,
    sackRate: totalDropbacks > 0 ? aggregated.totalSacks / totalDropbacks : 0,
    
    // Advanced metrics
    anyPerAttempt: calculateAnyPerAttempt(aggregated),
    yardsPerAttempt: aggregated.totalAttempts > 0 ? aggregated.totalYards / aggregated.totalAttempts : 0,
    
    // Turnover rate (interceptions + fumbles lost)
    turnoverRate: aggregated.totalAttempts > 0 ? 
      (aggregated.totalInterceptions + aggregated.totalFumblesLost) / aggregated.totalAttempts : 0,
    
    // Rushing metrics
    rushYardsPerAttempt: aggregated.totalRushAttempts > 0 ? 
      aggregated.totalRushYards / aggregated.totalRushAttempts : 0,
    rushTouchdownRate: aggregated.totalRushAttempts > 0 ? 
      aggregated.totalRushTouchdowns / aggregated.totalRushAttempts : 0
  };
};

/**
 * Calculate ANY/A (Adjusted Net Yards per Attempt)
 * Formula: (pass yards + 20*(pass TD) - 45*(interceptions) - sack yards)/(passing attempts + sacks)
 * @param {Object} stats - Aggregated statistics
 * @returns {number} ANY/A value
 */
const calculateAnyPerAttempt = (stats) => {
  const totalDropbacks = stats.totalAttempts + stats.totalSacks;
  if (totalDropbacks === 0) return 0;
  
  const numerator = stats.totalYards + 
                   (20 * stats.totalTouchdowns) - 
                   (45 * stats.totalInterceptions) - 
                   stats.totalSackYards;
  
  return numerator / totalDropbacks;
};

/**
 * Get empty stats object for when no data is available
 * @returns {Object} Empty stats with zero values
 */
const getEmptyStats = () => ({
  totalAttempts: 0,
  totalCompletions: 0,
  totalYards: 0,
  totalTouchdowns: 0,
  totalInterceptions: 0,
  totalFirstDowns: 0,
  totalSacks: 0,
  totalSackYards: 0,
  totalFumbles: 0,
  totalFumblesLost: 0,
  totalRushAttempts: 0,
  totalRushYards: 0,
  totalRushTouchdowns: 0,
  recordCount: 0,
  completionRate: 0,
  touchdownRate: 0,
  interceptionRate: 0,
  conversionRate: 0,
  sackRate: 0,
  anyPerAttempt: 0,
  yardsPerAttempt: 0,
  turnoverRate: 0,
  rushYardsPerAttempt: 0,
  rushTouchdownRate: 0
});

/**
 * Check if a QB has sufficient data for clutch analysis
 * @param {Object} stats - Aggregated statistics
 * @param {number} minAttempts - Minimum attempts threshold (default: 10)
 * @returns {boolean} True if QB has sufficient data
 */
export const hasSufficientClutchData = (stats, minAttempts = 10) => {
  return stats.totalAttempts >= minAttempts;
};

/**
 * Get available split types and values for a season
 * @param {number} season - The season to check
 * @returns {Promise<Object>} Available split types and values
 */
export const getAvailableSplitData = async (season = 2024) => {
  try {
    if (!isSupabaseAvailable()) {
      return {};
    }

    // Get unique split types and values from both tables
    const { data: advancedData, error: advancedError } = await supabase
      .from('qb_splits_advanced')
      .select('split, value')
      .eq('season', season)
      .not('split', 'is', null)
      .not('value', 'is', null);

    const { data: splitsData, error: splitsError } = await supabase
      .from('qb_splits')
      .select('split, value')
      .eq('season', season)
      .not('split', 'is', null)
      .not('value', 'is', null);

    if (advancedError || splitsError) {
      console.error('❌ Error fetching available split data:', advancedError || splitsError);
      return {};
    }

    // Combine and organize the data
    const allSplits = [...(advancedData || []), ...(splitsData || [])];
    const splitMap = {};

    allSplits.forEach(record => {
      if (!splitMap[record.split]) {
        splitMap[record.split] = new Set();
      }
      splitMap[record.split].add(record.value);
    });

    // Convert to expected format
    const result = {};
    Object.entries(splitMap).forEach(([splitType, values]) => {
      result[splitType] = Array.from(values).sort();
    });

    return result;

  } catch (error) {
    console.error('❌ Error getting available split data:', error);
    return {};
  }
};
