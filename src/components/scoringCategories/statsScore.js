import { PERFORMANCE_YEAR_WEIGHTS, PERFORMANCE_PERCENTILES, SCORING_TIERS } from './constants.js';

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

// Linear percentile scoring function
const calculatePercentileScore = (value, metric, maxPoints, inverted = false) => {
  const percentiles = PERFORMANCE_PERCENTILES[metric];
  if (!percentiles) return 0;
  
  let scoreMultiplier;
  
  if (inverted) {
    // Lower values are better (Sack%, Int%, Fumble%)
    if (value <= percentiles.p95) scoreMultiplier = 1.0;       // Elite: 100%
    else if (value <= percentiles.p90) scoreMultiplier = 0.90; // Very Good: 90%
    else if (value <= percentiles.p75) scoreMultiplier = 0.80; // Good: 80%
    else if (value <= percentiles.p50) scoreMultiplier = 0.65; // Average: 65%
    else if (value <= percentiles.p25) scoreMultiplier = 0.50; // Below Average: 50%
    else if (value <= percentiles.p10) scoreMultiplier = 0.35; // Poor: 35%
    else scoreMultiplier = 0.20; // Very Poor: 20%
  } else {
    // Higher values are better (ANY/A, TD%, Comp%)
    if (value >= percentiles.p95) scoreMultiplier = 1.0;       // Elite: 100%
    else if (value >= percentiles.p90) scoreMultiplier = 0.90; // Very Good: 90%
    else if (value >= percentiles.p75) scoreMultiplier = 0.80; // Good: 80%
    else if (value >= percentiles.p50) scoreMultiplier = 0.65; // Average: 65%
    else if (value >= percentiles.p25) scoreMultiplier = 0.50; // Below Average: 50%
    else if (value >= percentiles.p10) scoreMultiplier = 0.35; // Poor: 35%
    else scoreMultiplier = 0.20; // Very Poor: 20%
  }
  
  return scoreMultiplier * maxPoints;
};

// Calculate efficiency subcomponent scores
const calculateEfficiencyScores = (weightedAnyA, weightedTDPct, weightedCmpPct, efficiencyWeights) => {
  const efficiencySubScores = {
    anyA: calculatePercentileScore(weightedAnyA, 'anyA', 100),
    tdPct: calculatePercentileScore(weightedTDPct, 'tdPct', 100),
    completionPct: calculatePercentileScore(weightedCmpPct, 'completionPct', 100)
  };
  
  // Apply hierarchical weighting to efficiency subcomponents
  return calculateHierarchicalScore(efficiencySubScores, efficiencyWeights);
};

// Calculate protection subcomponent scores
const calculateProtectionScores = (weightedSackPct, weightedTurnoverRate, protectionWeights) => {
  const protectionSubScores = {
    sackPct: calculatePercentileScore(weightedSackPct, 'sackPct', 100, true), // Inverted: lower is better
    turnoverRate: calculatePercentileScore(weightedTurnoverRate, 'turnoverRate', 100) // Higher is better (attempts per turnover)
  };
  
  // Apply hierarchical weighting to protection subcomponents
  return calculateHierarchicalScore(protectionSubScores, protectionWeights);
};

// Calculate volume subcomponent scores
const calculateVolumeScores = (totalPassYards, totalPassTDs, totalRushYards, totalRushTDs, totalAttempts, volumeWeights) => {
  const volumeSubScores = {
    passYards: Math.max(0, Math.min(100, (totalPassYards - 3500) / 12.5 + 50)), // Scale around 4000 yards
    passTDs: Math.max(0, Math.min(100, (totalPassTDs - 25) / 0.5 + 50)), // Scale around 30 TDs
    rushYards: Math.max(0, Math.min(100, (totalRushYards - 200) / 8 + 50)), // Scale around 400 yards
    rushTDs: Math.max(0, Math.min(100, totalRushTDs * 12.5 + 25)), // Scale rushing TDs
    totalAttempts: Math.max(0, Math.min(100, (totalAttempts - 450) / 8 + 50)) // Scale around 550 attempts
  };
  
  // Apply hierarchical weighting to volume subcomponents
  return calculateHierarchicalScore(volumeSubScores, volumeWeights);
};

// Volume scoring functions
const calculateVolumeScore = (qbStats) => {
  const passYardsScore = Math.max(0, Math.min(SCORING_TIERS.PASS_YARDS_POINTS, 
    (qbStats.passYards - 3500) / 312.5 * 2 + 4));
    
  const passTDsScore = Math.max(0, Math.min(SCORING_TIERS.PASS_TDS_POINTS,
    (qbStats.passTDs - 25) / 3.57 * 2 + 3.5));
    
  const volumeRespScore = Math.max(0, Math.min(SCORING_TIERS.VOLUME_RESP_POINTS,
    (qbStats.attPerGame - 30) * 0.25 + 2.5));
    
  const rushTDsScore = Math.max(0, Math.min(SCORING_TIERS.RUSH_TDS_POINTS,
    qbStats.rushTDsPerGame * 8));
    
  const rushYardsScore = Math.max(0, Math.min(SCORING_TIERS.RUSH_YARDS_POINTS,
    (qbStats.rushYPG - 15) * 0.2));
    
  return passYardsScore + passTDsScore + volumeRespScore + rushTDsScore + rushYardsScore;
};

const calculateTurnoverBurden = (totalTurnovers) => {
  if (totalTurnovers <= 8) return 2;        // Excellent
  if (totalTurnovers <= 10) return 1;       // Good
  if (totalTurnovers <= 12) return 0;       // Average
  if (totalTurnovers <= 14) return -1;      // Poor
  if (totalTurnovers <= 17) return -2;      // Very Poor
  return -3;                                // Terrible
};

// Enhanced Statistical Performance Score with hierarchical weighting (0-100)
export const calculateStatsScore = (qbSeasonData, statsWeights = { efficiency: 45, protection: 25, volume: 30 }, includePlayoffs = true, include2024Only = false, efficiencyWeights = { anyA: 45, tdPct: 30, completionPct: 25 }, protectionWeights = { sackPct: 60, turnoverRate: 40 }, volumeWeights = { passYards: 25, passTDs: 25, rushYards: 20, rushTDs: 15, totalAttempts: 15 }) => {
  let weightedAnyA = 0;
  let weightedTDPct = 0;
  let weightedCmpPct = 0;
  let weightedSackPct = 0;
  let weightedTurnoverRate = 0;
  let totalPassYards = 0;
  let totalPassTDs = 0;
  let totalRushYards = 0;
  let totalRushTDs = 0;
  let totalVolume = 0;
  let totalAttempts = 0;
  let totalWeight = 0;
  let playoffAdjustmentFactor = 1.0; // Default: no playoff adjustment
  
  // Debug logging for playoff inclusion
  const debugMode = includePlayoffs;
  const playerName = qbSeasonData.years && Object.values(qbSeasonData.years)[0]?.Player;
  
  if (debugMode && playerName && (playerName.includes('Mahomes') || playerName.includes('Hurts') || playerName.includes('Allen'))) {
    console.log(`📊 STATS DEBUG - ${playerName} (Playoffs ${includePlayoffs ? 'ADJUSTMENT MODE' : 'EXCLUDED'})`);
  }
  
  // First Pass: Calculate strong regular season base scores
  // In 2024-only mode, only process 2024 data with 100% weight
  const yearWeights = include2024Only ? { '2024': 1.0 } : PERFORMANCE_YEAR_WEIGHTS;
  
  // Check if player has meaningful current season data before including any historical data
  let hasCurrentSeasonData = false;
  if (qbSeasonData.years && qbSeasonData.years['2024']) {
    const currentSeasonAtts = parseInt(qbSeasonData.years['2024'].Att) || 0;
    hasCurrentSeasonData = currentSeasonAtts >= 50; // Must have meaningful current season participation
  }
  
  // If no meaningful current season data, only use data if include2024Only is false and player has historical significance
  if (!hasCurrentSeasonData && !include2024Only) {
    // For players without current season data, require higher historical thresholds
    let hasSignificantHistoricalData = false;
    Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
      if (year !== '2024') {
        const historicalAtts = parseInt(data.Att) || 0;
        if (historicalAtts >= 200) { // Require substantial historical data (200+ attempts = ~12+ games)
          hasSignificantHistoricalData = true;
        }
      }
    });
    
    if (!hasSignificantHistoricalData) {
      return 0; // Filter out players without either current relevance or historical significance
    }
  }
  
  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = yearWeights[year] || 0;
    if (weight === 0) return;
    
    // Regular season stats only for base calculation
    const regSeasonAtts = parseInt(data.Att) || 0;
    const regSeasonCmps = parseInt(data.Cmp) || 0;
    const regSeasonYds = parseInt(data.Yds) || 0;
    const regSeasonTDs = parseInt(data.TD) || 0;
    const regSeasonInts = parseInt(data.Int) || 0;
    const regSeasonSacks = parseInt(data.Sk) || 0;
    const regSeasonRushYds = parseInt(data.RushingYds) || 0;
    const regSeasonRushTDs = parseInt(data.RushingTDs) || 0;
    const regSeasonRushAtts = parseInt(data.RushingAtt) || 0;
    const regSeasonFumbles = parseInt(data.Fumbles) || 0;
    
    // Skip seasons with insufficient data - use different thresholds for 2024 vs previous years
    if (year === '2024' && include2024Only) {
      // For 2024-only mode: allow any QB with at least 1 attempt
      if (regSeasonAtts < 1) return;
    } else if (year === '2024') {
      // For 2024 in multi-year mode: keep the 50 attempt threshold
      if (regSeasonAtts < 50) return;
    } else {
      // For 2022/2023: Use more lenient threshold to account for historical data
      if (regSeasonAtts < 100) return;
    }
    
    // Calculate regular season statistical rates
    const anyA = data['ANY/A'] || 0;
    const tdPct = regSeasonAtts > 0 ? (regSeasonTDs / regSeasonAtts) * 100 : 0;
    const cmpPct = regSeasonAtts > 0 ? (regSeasonCmps / regSeasonAtts) * 100 : 0;
    const sackPct = (regSeasonAtts + regSeasonSacks) > 0 ? (regSeasonSacks / (regSeasonAtts + regSeasonSacks)) * 100 : 0;
    
    // Calculate turnover rate: (pass attempts + rush attempts) / total turnovers
    const seasonAttempts = regSeasonAtts + regSeasonRushAtts;
    const totalTurnovers = regSeasonInts + regSeasonFumbles;
    const turnoverRate = (totalTurnovers > 0 && seasonAttempts > 0) ? seasonAttempts / totalTurnovers : 999; // High number = good (fewer turnovers per attempt)
    
    // Weight and accumulate regular season stats
    weightedAnyA += anyA * weight;
    weightedTDPct += tdPct * weight;
    weightedCmpPct += cmpPct * weight;
    weightedSackPct += sackPct * weight;
    weightedTurnoverRate += turnoverRate * weight;
    
    totalPassYards += regSeasonYds * weight;
    totalPassTDs += regSeasonTDs * weight;
    totalRushYards += regSeasonRushYds * weight;
    totalRushTDs += regSeasonRushTDs * weight;
    totalVolume += (regSeasonYds + regSeasonRushYds) * weight;
    totalAttempts += (regSeasonAtts + regSeasonRushAtts) * weight;
    totalWeight += weight;
  });
  
  if (totalWeight === 0) return 0;
  
  // Normalize regular season weighted stats
  weightedAnyA = weightedAnyA / totalWeight;
  weightedTDPct = weightedTDPct / totalWeight;
  weightedCmpPct = weightedCmpPct / totalWeight;
  weightedSackPct = weightedSackPct / totalWeight;
  weightedTurnoverRate = weightedTurnoverRate / totalWeight;
  
  totalPassYards = totalPassYards / totalWeight;
  totalPassTDs = totalPassTDs / totalWeight;
  totalRushYards = totalRushYards / totalWeight;
  totalRushTDs = totalRushTDs / totalWeight;
  totalVolume = totalVolume / totalWeight;
  totalAttempts = totalAttempts / totalWeight;
  
  // Calculate hierarchical component scores
  const efficiencyScore = calculateEfficiencyScores(weightedAnyA, weightedTDPct, weightedCmpPct, efficiencyWeights);
  const protectionScore = calculateProtectionScores(weightedSackPct, weightedTurnoverRate, protectionWeights);
  const volumeScore = calculateVolumeScores(totalPassYards, totalPassTDs, totalRushYards, totalRushTDs, totalAttempts, volumeWeights);
  
  // Combine component scores using stats-level weights
  const statsComponentScores = {
    efficiency: efficiencyScore,
    protection: protectionScore,
    volume: volumeScore
  };
  
  let baseStatsScore = calculateHierarchicalScore(statsComponentScores, statsWeights);
  
  // Apply playoff adjustment if enabled (existing playoff logic)
  if (includePlayoffs) {
    let totalPlayoffWeight = 0;
    let playoffPerformanceMultiplier = 1.0;
    
    Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
      const weight = yearWeights[year] || 0;
      if (weight === 0 || !data.playoffData) return;
      
      const playoff = data.playoffData;
      const playoffAtts = parseInt(playoff.attempts) || 0;
      const playoffCmps = parseInt(playoff.completions) || 0;
      const playoffYds = parseInt(playoff.passingYards) || 0;
      const playoffTDs = parseInt(playoff.passingTDs) || 0;
      const playoffInts = parseInt(playoff.interceptions) || 0;
      const playoffSacks = parseInt(playoff.sacks) || 0;
      const playoffRushYds = parseInt(playoff.rushingYards) || 0;
      const playoffRushTDs = parseInt(playoff.rushingTDs) || 0;
      const playoffRushAtts = parseInt(playoff.rushingAttempts) || 0;
      const playoffFumbles = parseInt(playoff.fumbles) || 0;
      
      if (playoffAtts < 10) return; // Skip minimal playoff appearances
      
      // Calculate playoff rates
      const playoffAnyA = playoff.anyPerAttempt || 0;
      const playoffTDPct = playoffAtts > 0 ? (playoffTDs / playoffAtts) * 100 : 0;
      const playoffCmpPct = playoffAtts > 0 ? (playoffCmps / playoffAtts) * 100 : 0;
      const playoffSackPct = (playoffAtts + playoffSacks) > 0 ? (playoffSacks / (playoffAtts + playoffSacks)) * 100 : 0;
      
      const playoffSeasonAttempts = playoffAtts + playoffRushAtts;
      const playoffTotalTurnovers = playoffInts + playoffFumbles;
      const playoffTurnoverRate = (playoffTotalTurnovers > 0 && playoffSeasonAttempts > 0) ? playoffSeasonAttempts / playoffTotalTurnovers : 999;
      
      // Calculate regular season rates for comparison
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
      const regTurnoverRate = (regTotalTurnovers > 0 && regSeasonAttempts > 0) ? regSeasonAttempts / regTotalTurnovers : 999;
      
      // Calculate performance ratios (playoff vs regular season)
      const anyARatio = regAnyA > 0 ? playoffAnyA / regAnyA : 1.0;
      const tdPctRatio = regTDPct > 0 ? playoffTDPct / regTDPct : 1.0;
      const cmpPctRatio = regCmpPct > 0 ? playoffCmpPct / regCmpPct : 1.0;
      const sackPctRatio = regSackPct > 0 ? regSackPct / playoffSackPct : 1.0; // Inverted: lower playoff sack% is better
      const turnoverRatio = regTurnoverRate > 0 ? playoffTurnoverRate / regTurnoverRate : 1.0;
      
      // Calculate weighted performance multiplier
      const performanceMultiplier = (
        (anyARatio * 0.3) +
        (tdPctRatio * 0.25) +
        (cmpPctRatio * 0.2) +
        (sackPctRatio * 0.15) +
        (turnoverRatio * 0.1)
      );
      
      // Weight by playoff sample size and year importance
      const sampleWeight = Math.min(1.0, playoffAtts / 75); // Full weight at 75+ attempts
      playoffPerformanceMultiplier += (performanceMultiplier - 1.0) * sampleWeight * weight;
      totalPlayoffWeight += weight;
      
      if (debugMode && playerName && (playerName.includes('Mahomes') || playerName.includes('Hurts') || playerName.includes('Allen'))) {
        console.log(`   ${year} Playoff Performance: ANY/A(${anyARatio.toFixed(2)}x) TD%(${tdPctRatio.toFixed(2)}x) Comp%(${cmpPctRatio.toFixed(2)}x) → Multiplier(${performanceMultiplier.toFixed(3)})`);
      }
    });
    
    // Apply playoff adjustment
    if (totalPlayoffWeight > 0) {
      const adjustmentStrength = Math.min(0.25, totalPlayoffWeight * 0.15); // Cap at 25% adjustment, scale by playoff experience
      playoffAdjustmentFactor = 1.0 + ((playoffPerformanceMultiplier - 1.0) * adjustmentStrength);
      
      if (debugMode && playerName && (playerName.includes('Mahomes') || playerName.includes('Hurts') || playerName.includes('Allen'))) {
        console.log(`   Final Playoff Adjustment: ${playoffAdjustmentFactor.toFixed(3)}x (Strength: ${adjustmentStrength.toFixed(3)})`);
      }
    }
  }
  
  // Apply playoff adjustment to base stats score
  const finalStatsScore = baseStatsScore * playoffAdjustmentFactor;
  
  // Ensure score stays within 0-100 range
  return Math.max(0, Math.min(100, finalStatsScore));
}; 