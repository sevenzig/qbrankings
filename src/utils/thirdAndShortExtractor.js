/**
 * 3rd & 1-3 Data Extractor Utility
 * 
 * This utility provides functions to extract and analyze 3rd & 1-3 splits data
 * for NFL quarterbacks from the Supabase database.
 */

import { qbDataService } from './supabase.js';

/**
 * Extract all 3rd & 1-3 data for 2024 QBs
 * @returns {Promise<Array>} Array of 3rd & 1-3 splits data
 */
export const extractThirdAndShortData2024 = async () => {
  try {
    console.log('🔄 Extracting 3rd & 1-3 data for all 2024 QBs...');
    
    const data = await qbDataService.fetchThirdAndShortData2024();
    
    console.log(`✅ Successfully extracted ${data.length} records`);
    return data;
    
  } catch (error) {
    console.error('❌ Error extracting 3rd & 1-3 data:', error);
    throw error;
  }
};

/**
 * Extract 3rd & 1-3 data for a specific QB
 * @param {string} pfrId - The PFR ID of the player
 * @param {number} season - The season (default: 2024)
 * @returns {Promise<Array>} Array of 3rd & 1-3 splits data
 */
export const extractThirdAndShortDataForQB = async (pfrId, season = 2024) => {
  try {
    console.log(`🔄 Extracting 3rd & 1-3 data for QB ${pfrId} in ${season}...`);
    
    const data = await qbDataService.fetchThirdAndShortDataForQB(pfrId);
    
    console.log(`✅ Successfully extracted ${data.length} records for QB ${pfrId}`);
    return data;
    
  } catch (error) {
    console.error(`❌ Error extracting 3rd & 1-3 data for QB ${pfrId}:`, error);
    throw error;
  }
};

/**
 * Get summary statistics for 3rd & 1-3 performance
 * @param {number} season - The season (default: 2024)
 * @returns {Promise<Object>} Summary statistics object
 */
export const getThirdAndShortSummary = async (season = 2024) => {
  try {
    console.log(`🔄 Generating 3rd & 1-3 summary for ${season}...`);
    
    const summary = await qbDataService.getThirdAndShortSummary2024();
    
    console.log('✅ Successfully generated summary statistics');
    return summary;
    
  } catch (error) {
    console.error('❌ Error generating 3rd & 1-3 summary:', error);
    throw error;
  }
};

/**
 * Analyze 3rd & 1-3 performance by team
 * @param {Array} data - 3rd & 1-3 data array
 * @returns {Object} Team analysis object
 */
export const analyzeByTeam = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return {};
  }
  
  const teamAnalysis = {};
  
  data.forEach(record => {
    const team = record.team;
    
    if (!teamAnalysis[team]) {
      teamAnalysis[team] = {
        team,
        qbs: new Set(),
        totalAttempts: 0,
        totalCompletions: 0,
        totalYards: 0,
        totalTDs: 0,
        totalInts: 0,
        records: []
      };
    }
    
    teamAnalysis[team].qbs.add(record.player_name);
    teamAnalysis[team].totalAttempts += parseInt(record.att) || 0;
    teamAnalysis[team].totalCompletions += parseInt(record.cmp) || 0;
    teamAnalysis[team].totalYards += parseInt(record.yds) || 0;
    teamAnalysis[team].totalTDs += parseInt(record.td) || 0;
    teamAnalysis[team].totalInts += parseInt(record.int) || 0;
    teamAnalysis[team].records.push(record);
  });
  
  // Calculate rates for each team
  Object.values(teamAnalysis).forEach(team => {
    const attempts = team.totalAttempts;
    team.qbCount = team.qbs.size;
    team.completionRate = attempts > 0 ? (team.totalCompletions / attempts * 100).toFixed(1) : 0;
    team.yardsPerAttempt = attempts > 0 ? (team.totalYards / attempts).toFixed(1) : 0;
    team.tdRate = attempts > 0 ? (team.totalTDs / attempts * 100).toFixed(1) : 0;
    team.intRate = attempts > 0 ? (team.totalInts / attempts * 100).toFixed(1) : 0;
    team.qbs = Array.from(team.qbs);
  });
  
  return teamAnalysis;
};

/**
 * Find QBs with minimum attempts in 3rd & 1-3 situations
 * @param {Array} data - 3rd & 1-3 data array
 * @param {number} minAttempts - Minimum attempts required (default: 10)
 * @returns {Array} Filtered QB data
 */
export const filterByMinimumAttempts = (data, minAttempts = 10) => {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  // Group by QB and sum attempts
  const qbAttempts = {};
  
  data.forEach(record => {
    const qbName = record.player_name;
    if (!qbAttempts[qbName]) {
      qbAttempts[qbName] = {
        player_name: qbName,
        team: record.team,
        pfr_id: record.pfr_id,
        totalAttempts: 0,
        records: []
      };
    }
    
    qbAttempts[qbName].totalAttempts += parseInt(record.att) || 0;
    qbAttempts[qbName].records.push(record);
  });
  
  // Filter by minimum attempts
  return Object.values(qbAttempts)
    .filter(qb => qb.totalAttempts >= minAttempts)
    .sort((a, b) => b.totalAttempts - a.totalAttempts);
};

/**
 * Export 3rd & 1-3 data to CSV format
 * @param {Array} data - 3rd & 1-3 data array
 * @returns {string} CSV formatted string
 */
export const exportToCSV = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }
  
  // Get all unique fields from the data
  const fields = new Set();
  data.forEach(record => {
    Object.keys(record).forEach(key => fields.add(key));
  });
  
  const fieldArray = Array.from(fields);
  
  // Create CSV header
  const header = fieldArray.join(',');
  
  // Create CSV rows
  const rows = data.map(record => {
    return fieldArray.map(field => {
      const value = record[field];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',');
  });
  
  return [header, ...rows].join('\n');
};

/**
 * Get top performers in 3rd & 1-3 situations
 * @param {Array} data - 3rd & 1-3 data array
 * @param {string} metric - Metric to rank by ('completion_rate', 'yards_per_attempt', 'td_rate', 'int_rate')
 * @param {number} minAttempts - Minimum attempts required (default: 10)
 * @param {number} limit - Number of top performers to return (default: 10)
 * @returns {Array} Top performers array
 */
export const getTopPerformers = (data, metric = 'completion_rate', minAttempts = 10, limit = 10) => {
  const qualifiedQBs = filterByMinimumAttempts(data, minAttempts);
  
  // Calculate the specified metric for each QB
  const qbMetrics = qualifiedQBs.map(qb => {
    const totalAttempts = qb.totalAttempts;
    const totalCompletions = qb.records.reduce((sum, record) => sum + (parseInt(record.cmp) || 0), 0);
    const totalYards = qb.records.reduce((sum, record) => sum + (parseInt(record.yds) || 0), 0);
    const totalTDs = qb.records.reduce((sum, record) => sum + (parseInt(record.td) || 0), 0);
    const totalInts = qb.records.reduce((sum, record) => sum + (parseInt(record.int) || 0), 0);
    
    return {
      ...qb,
      completion_rate: totalAttempts > 0 ? (totalCompletions / totalAttempts * 100) : 0,
      yards_per_attempt: totalAttempts > 0 ? (totalYards / totalAttempts) : 0,
      td_rate: totalAttempts > 0 ? (totalTDs / totalAttempts * 100) : 0,
      int_rate: totalAttempts > 0 ? (totalInts / totalAttempts * 100) : 0
    };
  });
  
  // Sort by the specified metric (descending for positive metrics, ascending for negative metrics)
  const isNegativeMetric = metric === 'int_rate';
  qbMetrics.sort((a, b) => {
    if (isNegativeMetric) {
      return a[metric] - b[metric]; // Lower is better for INT%
    } else {
      return b[metric] - a[metric]; // Higher is better for others
    }
  });
  
  return qbMetrics.slice(0, limit);
};

/**
 * Compare two QBs in 3rd & 1-3 situations
 * @param {string} qb1PfrId - First QB's PFR ID
 * @param {string} qb2PfrId - Second QB's PFR ID
 * @param {number} season - The season (default: 2024)
 * @returns {Promise<Object>} Comparison object
 */
export const compareQBs = async (qb1PfrId, qb2PfrId, season = 2024) => {
  try {
    const [qb1Data, qb2Data] = await Promise.all([
      extractThirdAndShortDataForQB(qb1PfrId, season),
      extractThirdAndShortDataForQB(qb2PfrId, season)
    ]);
    
    const qb1Stats = calculateQBStats(qb1Data);
    const qb2Stats = calculateQBStats(qb2Data);
    
    return {
      qb1: qb1Stats,
      qb2: qb2Stats,
      comparison: {
        completionRateDiff: qb1Stats.completionRate - qb2Stats.completionRate,
        yardsPerAttemptDiff: qb1Stats.yardsPerAttempt - qb2Stats.yardsPerAttempt,
        tdRateDiff: qb1Stats.tdRate - qb2Stats.tdRate,
        intRateDiff: qb1Stats.intRate - qb2Stats.intRate
      }
    };
    
  } catch (error) {
    console.error('❌ Error comparing QBs:', error);
    throw error;
  }
};

/**
 * Calculate stats for a QB from raw data
 * @param {Array} data - QB's 3rd & 1-3 data
 * @returns {Object} Calculated stats
 */
const calculateQBStats = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      attempts: 0,
      completions: 0,
      yards: 0,
      tds: 0,
      ints: 0,
      completionRate: 0,
      yardsPerAttempt: 0,
      tdRate: 0,
      intRate: 0
    };
  }
  
  const totalAttempts = data.reduce((sum, record) => sum + (parseInt(record.att) || 0), 0);
  const totalCompletions = data.reduce((sum, record) => sum + (parseInt(record.cmp) || 0), 0);
  const totalYards = data.reduce((sum, record) => sum + (parseInt(record.yds) || 0), 0);
  const totalTDs = data.reduce((sum, record) => sum + (parseInt(record.td) || 0), 0);
  const totalInts = data.reduce((sum, record) => sum + (parseInt(record.int) || 0), 0);
  
  return {
    attempts: totalAttempts,
    completions: totalCompletions,
    yards: totalYards,
    tds: totalTDs,
    ints: totalInts,
    completionRate: totalAttempts > 0 ? (totalCompletions / totalAttempts * 100) : 0,
    yardsPerAttempt: totalAttempts > 0 ? (totalYards / totalAttempt) : 0,
    tdRate: totalAttempts > 0 ? (totalTDs / totalAttempt * 100) : 0,
    intRate: totalAttempts > 0 ? (totalInts / totalAttempt * 100) : 0
  };
};

/**
 * Main function to extract and analyze all 3rd & 1-3 data
 * @returns {Promise<Object>} Complete analysis object
 */
export const analyzeThirdAndShortData = async () => {
  try {
    console.log('🔄 Starting comprehensive 3rd & 1-3 analysis...');
    
    // Extract all data
    const rawData = await extractThirdAndShortData2024();
    
    // Get summary statistics
    const summary = await getThirdAndShortSummary();
    
    // Analyze by team
    const teamAnalysis = analyzeByTeam(rawData);
    
    // Get top performers
    const topCompletionRate = getTopPerformers(rawData, 'completion_rate', 10, 10);
    const topYardsPerAttempt = getTopPerformers(rawData, 'yards_per_attempt', 10, 10);
    const lowestIntRate = getTopPerformers(rawData, 'int_rate', 10, 10);
    
    // Filter QBs with minimum attempts
    const qualifiedQBs = filterByMinimumAttempts(rawData, 10);
    
    const analysis = {
      summary,
      teamAnalysis,
      topPerformers: {
        completionRate: topCompletionRate,
        yardsPerAttempt: topYardsPerAttempt,
        lowestIntRate
      },
      qualifiedQBs,
      rawData,
      exportCSV: () => exportToCSV(rawData)
    };
    
    console.log('✅ Comprehensive analysis complete');
    return analysis;
    
  } catch (error) {
    console.error('❌ Error in comprehensive analysis:', error);
    throw error;
  }
}; 

/**
 * Diagnostic function to check what data exists for a specific QB
 * @param {string} pfrId - The PFR ID of the player
 * @param {number} season - The season (default: 2024)
 * @returns {Promise<Object>} Diagnostic information
 */
export const diagnoseQBData = async (pfrId, season = 2024) => {
  try {
    console.log(`🔍 Diagnosing data for QB ${pfrId} in ${season}...`);
    
    const { supabase } = await import('./supabase.js');
    
    // Check if QB exists in qb_splits_advanced
    const { data: advancedData, error: advancedError } = await supabase
      .from('qb_splits_advanced')
      .select('*')
      .eq('pfr_id', pfrId)
      .eq('season', season);
    
    // Check if QB exists in qb_splits
    const { data: splitsData, error: splitsError } = await supabase
      .from('qb_splits')
      .select('*')
      .eq('pfr_id', pfrId)
      .eq('season', season);
    
    // Check if QB exists in qb_passing_stats
    const { data: passingData, error: passingError } = await supabase
      .from('qb_passing_stats')
      .select('*')
      .eq('pfr_id', pfrId)
      .eq('season', season);
    
    const diagnostic = {
      pfrId,
      season,
      exists: {
        qb_splits_advanced: !advancedError && advancedData && advancedData.length > 0,
        qb_splits: !splitsError && splitsData && splitsData.length > 0,
        qb_passing_stats: !passingError && passingData && passingData.length > 0
      },
      data: {
        qb_splits_advanced: advancedData || [],
        qb_splits: splitsData || [],
        qb_passing_stats: passingData || []
      },
      errors: {
        qb_splits_advanced: advancedError,
        qb_splits: splitsError,
        qb_passing_stats: passingError
      }
    };
    
    console.log(`✅ Diagnostic complete for QB ${pfrId}:`);
    console.log(`- qb_splits_advanced: ${diagnostic.exists.qb_splits_advanced} (${diagnostic.data.qb_splits_advanced.length} records)`);
    console.log(`- qb_splits: ${diagnostic.exists.qb_splits} (${diagnostic.data.qb_splits.length} records)`);
    console.log(`- qb_passing_stats: ${diagnostic.exists.qb_passing_stats} (${diagnostic.data.qb_passing_stats.length} records)`);
    
    if (diagnostic.data.qb_splits_advanced.length > 0) {
      console.log('📋 Sample qb_splits_advanced records:');
      diagnostic.data.qb_splits_advanced.slice(0, 3).forEach((record, index) => {
        console.log(`  ${index + 1}. split: "${record.split}", value: "${record.value}"`);
      });
    }
    
    if (diagnostic.data.qb_splits.length > 0) {
      console.log('📋 Sample qb_splits records:');
      diagnostic.data.qb_splits.slice(0, 3).forEach((record, index) => {
        console.log(`  ${index + 1}. split: "${record.split}", value: "${record.value}"`);
      });
    }
    
    return diagnostic;
    
  } catch (error) {
    console.error(`❌ Error diagnosing QB ${pfrId}:`, error);
    throw error;
  }
}; 