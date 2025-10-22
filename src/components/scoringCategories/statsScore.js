import { PERFORMANCE_YEAR_WEIGHTS } from './constants.js';
import {
  calculateZScore,
  calculateMean,
  calculateStandardDeviation,
  zScoreToPercentile,
  calculateCompositeZScore
} from '../../utils/zScoreCalculations.js';

// Helper function to normalize weights within a group
const normalizeWeights = (weights) => {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  if (total === 0) return weights;
  
  const normalized = {};
  Object.keys(weights).forEach(key => {
    normalized[key] = weights[key] / total;
  });
  return normalized;
};

// Hierarchical weight calculation
const calculateHierarchicalScore = (componentScores, weights) => {
  const normalizedWeights = normalizeWeights(weights);
  let weightedSum = 0;
  
  Object.keys(componentScores).forEach(key => {
    if (normalizedWeights[key] !== undefined) {
      weightedSum += componentScores[key] * normalizedWeights[key];
    }
  });
  
  return weightedSum;
};

/**
 * Extract stat values from all QBs for a specific year and stat
 * @param {Object} allQBsYearData - Object mapping QB names to their year data
 * @param {Function} statExtractor - Function to extract stat from year data
 * @returns {number[]} Array of stat values
 */
const extractStatValues = (allQBsYearData, statExtractor) => {
  return Object.values(allQBsYearData)
    .map(statExtractor)
    .filter(val => typeof val === 'number' && !isNaN(val) && isFinite(val));
};

/**
 * Calculate z-score based efficiency scores
 * Uses z-scores for ANY/A, TD%, and Completion%
 */
const calculateEfficiencyZScores = (qbSeasonData, allQBData, efficiencyWeights, includePlayoffs, include2024Only) => {
  const yearWeights = include2024Only ? { '2024': 1.0 } : PERFORMANCE_YEAR_WEIGHTS;
  
  // Collect z-scores for each efficiency stat across years
  const yearlyZScores = {
    anyA: [],
    tdPct: [],
    completionPct: []
  };
  
  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = yearWeights[year] || 0;
    if (weight === 0) return;
    
    const regSeasonAtts = parseInt(data.Att) || 0;
    
    // Apply attempt thresholds
    if (year === '2024' && include2024Only && regSeasonAtts < 150) return;
    if (year === '2024' && !include2024Only && regSeasonAtts < 150) return;
    if (year !== '2024' && regSeasonAtts < 200) return;
    
    // Build population data for this year across all QBs
    const yearDataForAllQBs = {};
    allQBData.forEach(qb => {
      // Handle both seasonData array and years object format
      let qbYearData = null;
      if (qb.years && qb.years[year]) {
        qbYearData = qb.years[year];
      } else if (qb.seasonData) {
        const season = qb.seasonData.find(s => s.year === parseInt(year));
        if (season) {
          // Convert season format to years format
          qbYearData = {
            Att: season.attempts,
            Cmp: season.completions,
            Yds: season.passingYards,
            TD: season.passingTDs,
            Int: season.interceptions,
            Sk: season.sacks || 0,
            'ANY/A': season.anyPerAttempt || 0,
            RushingYds: season.rushingYards || 0,
            RushingTDs: season.rushingTDs || 0,
            RushingAtt: season.rushingAttempts || 0,
            Fumbles: season.fumbles || 0,
            Player: qb.name
          };
        }
      }
      
      if (qbYearData) {
        const qbAtts = parseInt(qbYearData.Att) || 0;
        
        // Apply same thresholds
        let meetsThreshold = false;
        if (year === '2024' && include2024Only && qbAtts >= 150) meetsThreshold = true;
        if (year === '2024' && !include2024Only && qbAtts >= 150) meetsThreshold = true;
        if (year !== '2024' && qbAtts >= 200) meetsThreshold = true;
        
        if (meetsThreshold) {
          yearDataForAllQBs[qb.name || qbYearData.Player] = qbYearData;
        }
      }
    });
    
    if (Object.keys(yearDataForAllQBs).length === 0) return;
    
    // Calculate population statistics for ANY/A
    const anyAValues = extractStatValues(yearDataForAllQBs, d => d['ANY/A'] || 0);
    const anyAMean = calculateMean(anyAValues);
    const anyAStdDev = calculateStandardDeviation(anyAValues, anyAMean);
    const anyAValue = data['ANY/A'] || 0;
    const anyAZ = calculateZScore(anyAValue, anyAMean, anyAStdDev, false);
    yearlyZScores.anyA.push({ zScore: anyAZ, weight });
    
    // Calculate population statistics for TD%
    const tdPctValues = extractStatValues(yearDataForAllQBs, d => {
      const atts = parseInt(d.Att) || 0;
      const tds = parseInt(d.TD) || 0;
      return atts > 0 ? (tds / atts) * 100 : 0;
    });
    const tdPctMean = calculateMean(tdPctValues);
    const tdPctStdDev = calculateStandardDeviation(tdPctValues, tdPctMean);
    const tdPctValue = regSeasonAtts > 0 ? ((parseInt(data.TD) || 0) / regSeasonAtts) * 100 : 0;
    const tdPctZ = calculateZScore(tdPctValue, tdPctMean, tdPctStdDev, false);
    yearlyZScores.tdPct.push({ zScore: tdPctZ, weight });
    
    // Calculate population statistics for Completion%
    const cmpPctValues = extractStatValues(yearDataForAllQBs, d => {
      const atts = parseInt(d.Att) || 0;
      const cmps = parseInt(d.Cmp) || 0;
      return atts > 0 ? (cmps / atts) * 100 : 0;
    });
    const cmpPctMean = calculateMean(cmpPctValues);
    const cmpPctStdDev = calculateStandardDeviation(cmpPctValues, cmpPctMean);
    const cmpPctValue = regSeasonAtts > 0 ? ((parseInt(data.Cmp) || 0) / regSeasonAtts) * 100 : 0;
    const cmpPctZ = calculateZScore(cmpPctValue, cmpPctMean, cmpPctStdDev, false);
    yearlyZScores.completionPct.push({ zScore: cmpPctZ, weight });
  });
  
  // Calculate weighted average z-scores across years
  const avgZScores = {};
  Object.keys(yearlyZScores).forEach(stat => {
    let weightedSum = 0;
    let totalWeight = 0;
    yearlyZScores[stat].forEach(({ zScore, weight }) => {
      weightedSum += zScore * weight;
      totalWeight += weight;
    });
    avgZScores[stat] = totalWeight > 0 ? weightedSum / totalWeight : 0;
  });
  
  // Keep as z-scores for hierarchical weighting
  const efficiencyZScores = {
    anyA: avgZScores.anyA,
    tdPct: avgZScores.tdPct,
    completionPct: avgZScores.completionPct
  };
  
  // Apply hierarchical weighting to z-scores (returns composite z-score)
  return calculateHierarchicalScore(efficiencyZScores, efficiencyWeights);
};

/**
 * Calculate z-score based protection scores
 * Uses z-scores for Sack% and Turnover Rate
 */
const calculateProtectionZScores = (qbSeasonData, allQBData, protectionWeights, includePlayoffs, include2024Only) => {
  const yearWeights = include2024Only ? { '2024': 1.0 } : PERFORMANCE_YEAR_WEIGHTS;
  
  const yearlyZScores = {
    sackPct: [],
    turnoverRate: []
  };
  
  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = yearWeights[year] || 0;
    if (weight === 0) return;
    
    const regSeasonAtts = parseInt(data.Att) || 0;
    const regSeasonSacks = parseInt(data.Sk) || 0;
    const regSeasonRushAtts = parseInt(data.RushingAtt) || 0;
    const regSeasonInts = parseInt(data.Int) || 0;
    const regSeasonFumbles = parseInt(data.Fumbles) || 0;
    
    // Apply attempt thresholds
    if (year === '2024' && include2024Only && regSeasonAtts < 150) return;
    if (year === '2024' && !include2024Only && regSeasonAtts < 150) return;
    if (year !== '2024' && regSeasonAtts < 200) return;
    
    // Build population data for this year
    const yearDataForAllQBs = {};
    allQBData.forEach(qb => {
      // Handle both seasonData array and years object format
      let qbYearData = null;
      if (qb.years && qb.years[year]) {
        qbYearData = qb.years[year];
      } else if (qb.seasonData) {
        const season = qb.seasonData.find(s => s.year === parseInt(year));
        if (season) {
          // Convert season format to years format
          qbYearData = {
            Att: season.attempts,
            Cmp: season.completions,
            Yds: season.passingYards,
            TD: season.passingTDs,
            Int: season.interceptions,
            Sk: season.sacks || 0,
            'ANY/A': season.anyPerAttempt || 0,
            RushingYds: season.rushingYards || 0,
            RushingTDs: season.rushingTDs || 0,
            RushingAtt: season.rushingAttempts || 0,
            Fumbles: season.fumbles || 0,
            Player: qb.name
          };
        }
      }
      
      if (qbYearData) {
        const qbAtts = parseInt(qbYearData.Att) || 0;
        
        let meetsThreshold = false;
        if (year === '2024' && include2024Only && qbAtts >= 150) meetsThreshold = true;
        if (year === '2024' && !include2024Only && qbAtts >= 150) meetsThreshold = true;
        if (year !== '2024' && qbAtts >= 200) meetsThreshold = true;
        
        if (meetsThreshold) {
          yearDataForAllQBs[qb.name || qbYearData.Player] = qbYearData;
        }
      }
    });
    
    if (Object.keys(yearDataForAllQBs).length === 0) return;
    
    // Calculate Sack% z-score (lower is better, so invert)
    const sackPctValues = extractStatValues(yearDataForAllQBs, d => {
      const atts = parseInt(d.Att) || 0;
      const sacks = parseInt(d.Sk) || 0;
      return (atts + sacks) > 0 ? (sacks / (atts + sacks)) * 100 : 0;
    });
    const sackPctMean = calculateMean(sackPctValues);
    const sackPctStdDev = calculateStandardDeviation(sackPctValues, sackPctMean);
    const sackPctValue = (regSeasonAtts + regSeasonSacks) > 0 ? 
      (regSeasonSacks / (regSeasonAtts + regSeasonSacks)) * 100 : 0;
    const sackPctZ = calculateZScore(sackPctValue, sackPctMean, sackPctStdDev, true); // Inverted
    yearlyZScores.sackPct.push({ zScore: sackPctZ, weight });
    
    // Calculate Turnover Rate z-score (attempts per turnover - higher is better)
    const turnoverRateValues = extractStatValues(yearDataForAllQBs, d => {
      const atts = parseInt(d.Att) || 0;
      const rushAtts = parseInt(d.RushingAtt) || 0;
      const ints = parseInt(d.Int) || 0;
      const fumbles = parseInt(d.Fumbles) || 0;
      const totalTurnovers = ints + fumbles;
      const seasonAttempts = atts + rushAtts;
      return totalTurnovers > 0 && seasonAttempts > 0 ? seasonAttempts / totalTurnovers : 999;
    });
    const turnoverRateMean = calculateMean(turnoverRateValues);
    const turnoverRateStdDev = calculateStandardDeviation(turnoverRateValues, turnoverRateMean);
    const seasonAttempts = regSeasonAtts + regSeasonRushAtts;
    const totalTurnovers = regSeasonInts + regSeasonFumbles;
    const turnoverRateValue = totalTurnovers > 0 && seasonAttempts > 0 ? 
      seasonAttempts / totalTurnovers : 999;
    const turnoverRateZ = calculateZScore(turnoverRateValue, turnoverRateMean, turnoverRateStdDev, false);
    yearlyZScores.turnoverRate.push({ zScore: turnoverRateZ, weight });
  });
  
  // Calculate weighted average z-scores
  const avgZScores = {};
  Object.keys(yearlyZScores).forEach(stat => {
    let weightedSum = 0;
    let totalWeight = 0;
    yearlyZScores[stat].forEach(({ zScore, weight }) => {
      weightedSum += zScore * weight;
      totalWeight += weight;
    });
    avgZScores[stat] = totalWeight > 0 ? weightedSum / totalWeight : 0;
  });
  
  // Keep as z-scores for hierarchical weighting
  const protectionZScores = {
    sackPct: avgZScores.sackPct,
    turnoverRate: avgZScores.turnoverRate
  };
  
  return calculateHierarchicalScore(protectionZScores, protectionWeights);
};

/**
 * Calculate z-score based volume scores
 * Uses z-scores for Pass Yards, Pass TDs, Rush Yards, Rush TDs, Total Attempts
 */
const calculateVolumeZScores = (qbSeasonData, allQBData, volumeWeights, includePlayoffs, include2024Only) => {
  const yearWeights = include2024Only ? { '2024': 1.0 } : PERFORMANCE_YEAR_WEIGHTS;
  
  const yearlyZScores = {
    passYards: [],
    passTDs: [],
    rushYards: [],
    rushTDs: [],
    totalAttempts: []
  };
  
  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = yearWeights[year] || 0;
    if (weight === 0) return;
    
    const regSeasonAtts = parseInt(data.Att) || 0;
    
    // Apply attempt thresholds
    if (year === '2024' && include2024Only && regSeasonAtts < 150) return;
    if (year === '2024' && !include2024Only && regSeasonAtts < 150) return;
    if (year !== '2024' && regSeasonAtts < 200) return;
    
    // Build population data
    const yearDataForAllQBs = {};
    allQBData.forEach(qb => {
      // Handle both seasonData array and years object format
      let qbYearData = null;
      if (qb.years && qb.years[year]) {
        qbYearData = qb.years[year];
      } else if (qb.seasonData) {
        const season = qb.seasonData.find(s => s.year === parseInt(year));
        if (season) {
          // Convert season format to years format
          qbYearData = {
            Att: season.attempts,
            Cmp: season.completions,
            Yds: season.passingYards,
            TD: season.passingTDs,
            Int: season.interceptions,
            Sk: season.sacks || 0,
            'ANY/A': season.anyPerAttempt || 0,
            RushingYds: season.rushingYards || 0,
            RushingTDs: season.rushingTDs || 0,
            RushingAtt: season.rushingAttempts || 0,
            Fumbles: season.fumbles || 0,
            Player: qb.name
          };
        }
      }
      
      if (qbYearData) {
        const qbAtts = parseInt(qbYearData.Att) || 0;
        
        let meetsThreshold = false;
        if (year === '2024' && include2024Only && qbAtts >= 150) meetsThreshold = true;
        if (year === '2024' && !include2024Only && qbAtts >= 150) meetsThreshold = true;
        if (year !== '2024' && qbAtts >= 200) meetsThreshold = true;
        
        if (meetsThreshold) {
          yearDataForAllQBs[qb.name || qbYearData.Player] = qbYearData;
        }
      }
    });
    
    if (Object.keys(yearDataForAllQBs).length === 0) return;
    
    // Pass Yards z-score
    const passYardsValues = extractStatValues(yearDataForAllQBs, d => parseInt(d.Yds) || 0);
    const passYardsMean = calculateMean(passYardsValues);
    const passYardsStdDev = calculateStandardDeviation(passYardsValues, passYardsMean);
    const passYardsValue = parseInt(data.Yds) || 0;
    const passYardsZ = calculateZScore(passYardsValue, passYardsMean, passYardsStdDev, false);
    yearlyZScores.passYards.push({ zScore: passYardsZ, weight });
    
    // Pass TDs z-score
    const passTDsValues = extractStatValues(yearDataForAllQBs, d => parseInt(d.TD) || 0);
    const passTDsMean = calculateMean(passTDsValues);
    const passTDsStdDev = calculateStandardDeviation(passTDsValues, passTDsMean);
    const passTDsValue = parseInt(data.TD) || 0;
    const passTDsZ = calculateZScore(passTDsValue, passTDsMean, passTDsStdDev, false);
    yearlyZScores.passTDs.push({ zScore: passTDsZ, weight });
    
    // Rush Yards z-score
    const rushYardsValues = extractStatValues(yearDataForAllQBs, d => parseInt(d.RushingYds) || 0);
    const rushYardsMean = calculateMean(rushYardsValues);
    const rushYardsStdDev = calculateStandardDeviation(rushYardsValues, rushYardsMean);
    const rushYardsValue = parseInt(data.RushingYds) || 0;
    const rushYardsZ = calculateZScore(rushYardsValue, rushYardsMean, rushYardsStdDev, false);
    yearlyZScores.rushYards.push({ zScore: rushYardsZ, weight });
    
    // Rush TDs z-score
    const rushTDsValues = extractStatValues(yearDataForAllQBs, d => parseInt(d.RushingTDs) || 0);
    const rushTDsMean = calculateMean(rushTDsValues);
    const rushTDsStdDev = calculateStandardDeviation(rushTDsValues, rushTDsMean);
    const rushTDsValue = parseInt(data.RushingTDs) || 0;
    const rushTDsZ = calculateZScore(rushTDsValue, rushTDsMean, rushTDsStdDev, false);
    yearlyZScores.rushTDs.push({ zScore: rushTDsZ, weight });
    
    // Total Attempts z-score
    const totalAttemptsValues = extractStatValues(yearDataForAllQBs, d => {
      const atts = parseInt(d.Att) || 0;
      const rushAtts = parseInt(d.RushingAtt) || 0;
      return atts + rushAtts;
    });
    const totalAttemptsMean = calculateMean(totalAttemptsValues);
    const totalAttemptsStdDev = calculateStandardDeviation(totalAttemptsValues, totalAttemptsMean);
    const totalAttemptsValue = regSeasonAtts + (parseInt(data.RushingAtt) || 0);
    const totalAttemptsZ = calculateZScore(totalAttemptsValue, totalAttemptsMean, totalAttemptsStdDev, false);
    yearlyZScores.totalAttempts.push({ zScore: totalAttemptsZ, weight });
  });
  
  // Calculate weighted average z-scores
  const avgZScores = {};
  Object.keys(yearlyZScores).forEach(stat => {
    let weightedSum = 0;
    let totalWeight = 0;
    yearlyZScores[stat].forEach(({ zScore, weight }) => {
      weightedSum += zScore * weight;
      totalWeight += weight;
    });
    avgZScores[stat] = totalWeight > 0 ? weightedSum / totalWeight : 0;
  });
  
  // Keep as z-scores for hierarchical weighting
  const volumeZScores = {
    passYards: avgZScores.passYards,
    passTDs: avgZScores.passTDs,
    rushYards: avgZScores.rushYards,
    rushTDs: avgZScores.rushTDs,
    totalAttempts: avgZScores.totalAttempts
  };
  
  return calculateHierarchicalScore(volumeZScores, volumeWeights);
};

/**
 * Enhanced Statistical Performance Score with Z-Score calculations (0-100)
 */
export const calculateStatsScore = (
  qbSeasonData, 
  statsWeights = { efficiency: 45, protection: 25, volume: 30 }, 
  includePlayoffs = true, 
  include2024Only = false, 
  efficiencyWeights = { anyA: 45, tdPct: 30, completionPct: 25 }, 
  protectionWeights = { sackPct: 60, turnoverRate: 40 }, 
  volumeWeights = { passYards: 25, passTDs: 25, rushYards: 20, rushTDs: 15, totalAttempts: 15 },
  allQBData = []
) => {
  // Ensure we have all QB data for population statistics
  if (!allQBData || allQBData.length === 0) {
    console.warn('⚠️ No allQBData provided to calculateStatsScore - cannot calculate z-scores');
    return 0;
  }
  
  // Check if player has meaningful data
  let hasCurrentSeasonData = false;
  if (qbSeasonData.years && qbSeasonData.years['2024']) {
    const currentSeasonAtts = parseInt(qbSeasonData.years['2024'].Att) || 0;
    hasCurrentSeasonData = currentSeasonAtts >= 50;
  }
  
  if (!hasCurrentSeasonData && !include2024Only) {
    let hasSignificantHistoricalData = false;
    Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
      if (year !== '2024') {
        const historicalAtts = parseInt(data.Att) || 0;
        if (historicalAtts >= 200) {
          hasSignificantHistoricalData = true;
        }
      }
    });
    
    if (!hasSignificantHistoricalData) {
      return 0;
    }
  }
  
  // Calculate z-score based component scores
  const efficiencyScore = calculateEfficiencyZScores(qbSeasonData, allQBData, efficiencyWeights, includePlayoffs, include2024Only);
  const protectionScore = calculateProtectionZScores(qbSeasonData, allQBData, protectionWeights, includePlayoffs, include2024Only);
  const volumeScore = calculateVolumeZScores(qbSeasonData, allQBData, volumeWeights, includePlayoffs, include2024Only);
  
  // Debug logging for key QBs
  const playerName = qbSeasonData.name || (qbSeasonData.years && Object.values(qbSeasonData.years)[0]?.Player);
  if (playerName && (playerName.includes('Mahomes') || playerName.includes('Allen') || playerName.includes('Jackson'))) {
    console.log(`📊 STATS Z-SCORES ${playerName}:`);
    console.log(`   Efficiency Z: ${efficiencyScore.toFixed(3)} (weight: ${statsWeights.efficiency})`);
    console.log(`   Protection Z: ${protectionScore.toFixed(3)} (weight: ${statsWeights.protection})`);
    console.log(`   Volume Z: ${volumeScore.toFixed(3)} (weight: ${statsWeights.volume})`);
  }
  
  // Combine component scores using stats-level weights
  const statsComponentScores = {
    efficiency: efficiencyScore,
    protection: protectionScore,
    volume: volumeScore
  };
  
  const baseStatsScore = calculateHierarchicalScore(statsComponentScores, statsWeights);
  
  if (playerName && (playerName.includes('Mahomes') || playerName.includes('Allen') || playerName.includes('Jackson'))) {
    console.log(`   → Stats Composite Z: ${baseStatsScore.toFixed(3)}`);
  }
  
  // Apply playoff adjustment if enabled (maintain existing playoff logic)
  let playoffAdjustmentFactor = 1.0;
  
  if (includePlayoffs) {
    const yearWeights = include2024Only ? { '2024': 1.0 } : PERFORMANCE_YEAR_WEIGHTS;
    let totalPlayoffWeight = 0;
    let playoffPerformanceMultiplier = 1.0;
    
    Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
      const weight = yearWeights[year] || 0;
      if (weight === 0 || !data.playoffData) return;
      
      const playoff = data.playoffData;
      const playoffAtts = parseInt(playoff.attempts) || 0;
      if (playoffAtts < 10) return;
      
      const playoffCmps = parseInt(playoff.completions) || 0;
      const playoffTDs = parseInt(playoff.passingTDs) || 0;
      const playoffInts = parseInt(playoff.interceptions) || 0;
      const playoffSacks = parseInt(playoff.sacks) || 0;
      const playoffRushAtts = parseInt(playoff.rushingAttempts) || 0;
      const playoffFumbles = parseInt(playoff.fumbles) || 0;
      
      const playoffAnyA = playoff.anyPerAttempt || 0;
      const playoffTDPct = playoffAtts > 0 ? (playoffTDs / playoffAtts) * 100 : 0;
      const playoffCmpPct = playoffAtts > 0 ? (playoffCmps / playoffAtts) * 100 : 0;
      const playoffSackPct = (playoffAtts + playoffSacks) > 0 ? (playoffSacks / (playoffAtts + playoffSacks)) * 100 : 0;
      
      const playoffSeasonAttempts = playoffAtts + playoffRushAtts;
      const playoffTotalTurnovers = playoffInts + playoffFumbles;
      const playoffTurnoverRate = (playoffTotalTurnovers > 0 && playoffSeasonAttempts > 0) ? 
        playoffSeasonAttempts / playoffTotalTurnovers : 999;
      
      const regSeasonAtts = parseInt(data.Att) || 0;
      const regSeasonCmps = parseInt(data.Cmp) || 0;
      const regSeasonTDs = parseInt(data.TD) || 0;
      const regSeasonInts = parseInt(data.Int) || 0;
      const regSeasonSacks = parseInt(data.Sk) || 0;
      const regSeasonRushAtts = parseInt(data.RushingAtt) || 0;
      const regSeasonFumbles = parseInt(data.Fumbles) || 0;
      
      const regAnyA = data['ANY/A'] || 0;
      const regTDPct = regSeasonAtts > 0 ? (regSeasonTDs / regSeasonAtts) * 100 : 0;
      const regCmpPct = regSeasonAtts > 0 ? (regSeasonCmps / regSeasonAtts) * 100 : 0;
      const regSackPct = (regSeasonAtts + regSeasonSacks) > 0 ? (regSeasonSacks / (regSeasonAtts + regSeasonSacks)) * 100 : 0;
      
      const regSeasonAttempts = regSeasonAtts + regSeasonRushAtts;
      const regTotalTurnovers = regSeasonInts + regSeasonFumbles;
      const regTurnoverRate = (regTotalTurnovers > 0 && regSeasonAttempts > 0) ? 
        regSeasonAttempts / regTotalTurnovers : 999;
      
      const anyARatio = regAnyA > 0 ? playoffAnyA / regAnyA : 1.0;
      const tdPctRatio = regTDPct > 0 ? playoffTDPct / regTDPct : 1.0;
      const cmpPctRatio = regCmpPct > 0 ? playoffCmpPct / regCmpPct : 1.0;
      const sackPctRatio = regSackPct > 0 ? regSackPct / playoffSackPct : 1.0;
      const turnoverRatio = regTurnoverRate > 0 ? playoffTurnoverRate / regTurnoverRate : 1.0;
      
      const performanceMultiplier = (
        (anyARatio * 0.3) +
        (tdPctRatio * 0.25) +
        (cmpPctRatio * 0.2) +
        (sackPctRatio * 0.15) +
        (turnoverRatio * 0.1)
      );
      
      const sampleWeight = Math.min(1.0, playoffAtts / 75);
      playoffPerformanceMultiplier += (performanceMultiplier - 1.0) * sampleWeight * weight;
      totalPlayoffWeight += weight;
    });
    
    if (totalPlayoffWeight > 0) {
      const adjustmentStrength = Math.min(0.25, totalPlayoffWeight * 0.15);
      playoffAdjustmentFactor = 1.0 + ((playoffPerformanceMultiplier - 1.0) * adjustmentStrength);
    }
  }
  
  // Apply playoff adjustment to z-score
  const adjustedStatsZScore = baseStatsScore * playoffAdjustmentFactor;
  
  // Return z-score (not percentile) for composite calculation
  return adjustedStatsZScore;
};
