import { PERFORMANCE_YEAR_WEIGHTS } from './constants.js';
import {
  calculateZScore,
  calculateMean,
  calculateStandardDeviation,
  zScoreToPercentile
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

// Helper function to calculate average clutch multiplier based on playoff progression
const calculatePlayoffClutchMultiplier = (playoffData, team, year) => {
  const wins = playoffData.wins || 0;
  const losses = playoffData.losses || 0;
  const totalGames = wins + losses;
  
  if (totalGames === 0) return 1.06; // Default multiplier (further reduced by 70% from 1.2)
  
  const CLUTCH_MULTIPLIERS = {
    WILD_CARD: 1.06, DIVISIONAL: 1.08, // Further reduced by 70% from 1.2/1.4
    CONF_CHAMPIONSHIP: 1.12, SUPER_BOWL: 1.22 // Further reduced by 70% from 1.8/2.4
  };
  
  let totalMultiplier = 0;
  let gameCount = 0;
  
  // Estimate which rounds were played based on games and outcomes
  if (totalGames === 4) {
    // Played all 4 rounds (no bye)
    totalMultiplier += CLUTCH_MULTIPLIERS.WILD_CARD + CLUTCH_MULTIPLIERS.DIVISIONAL + 
                      CLUTCH_MULTIPLIERS.CONF_CHAMPIONSHIP + CLUTCH_MULTIPLIERS.SUPER_BOWL;
    gameCount = 4;
  } else if (totalGames === 3) {
    // Had bye, played 3 rounds  
    totalMultiplier += CLUTCH_MULTIPLIERS.DIVISIONAL + CLUTCH_MULTIPLIERS.CONF_CHAMPIONSHIP + 
                      CLUTCH_MULTIPLIERS.SUPER_BOWL;
    gameCount = 3;
  } else if (totalGames === 2) {
    // Two rounds - assume divisional and conf championship for successful teams
    totalMultiplier += CLUTCH_MULTIPLIERS.DIVISIONAL + CLUTCH_MULTIPLIERS.CONF_CHAMPIONSHIP;
    gameCount = 2;
  } else if (totalGames === 1) {
    // One round - assume wild card for most teams
    totalMultiplier += CLUTCH_MULTIPLIERS.WILD_CARD;
    gameCount = 1;
  }
  
  return gameCount > 0 ? totalMultiplier / gameCount : 1.06;
};

/**
 * Calculate z-score (not percentile)
 * Uses statistical standardization for more accurate scoring
 */
const calculateZScoreValue = (value, allValues, inverted = false) => {
  if (!allValues || allValues.length === 0) return 0; // Default to league average (z=0)
  
  const validValues = allValues.filter(v => v !== null && !isNaN(v) && isFinite(v));
  if (validValues.length < 2) return 0;
  
  const mean = calculateMean(validValues);
  const stdDev = calculateStandardDeviation(validValues, mean);
  const zScore = calculateZScore(value, mean, stdDev, inverted);
  
  return zScore;
};

// Enhanced Clutch Performance Score with playoff integration (0-100)
export const calculateClutchScore = (qbSeasonData, includePlayoffs = true, clutchWeights = { gameWinningDrives: 40, fourthQuarterComebacks: 25, clutchRate: 15, playoffBonus: 20 }, filterYear = null, allQBData = []) => {
  let totalGWD = 0;
  let totalFourthQC = 0;
  let totalGames = 0;
  let totalWeight = 0;
  let playoffAdjustmentFactor = 1.0; // Default: no playoff adjustment
  
  // Debug logging for playoff inclusion
  const debugMode = includePlayoffs;
  const playerName = qbSeasonData.years && Object.values(qbSeasonData.years)[0]?.Player;
  
  if (debugMode && playerName && (playerName.includes('Mahomes') || playerName.includes('Hurts') || playerName.includes('Allen'))) {
    console.log(`💎 CLUTCH DEBUG - ${playerName} (Playoffs ${includePlayoffs ? 'ADJUSTMENT MODE' : 'EXCLUDED'})`);
  }
  
  // First Pass: Calculate strong regular season base scores
  // In single-year mode, only process that specific year with 100% weight
  const yearWeights = (filterYear && typeof filterYear === 'number')
    ? { [filterYear.toString()]: 1.0 }
    : PERFORMANCE_YEAR_WEIGHTS;
  
  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = yearWeights[year] || 0;
    const gamesPlayed = parseInt(data.G) || 0;
    if (weight === 0 || (!data.GWD && !data['4QC'])) return;
    
    // Apply games threshold - lower for single-year mode (9 games) vs multi-year (10 games)
    const isSingleYear = filterYear && typeof filterYear === 'number';
    const gamesThreshold = isSingleYear ? 9 : 10;
    if (gamesPlayed < gamesThreshold) return;
    
    // Regular season clutch stats only for base calculation
    const seasonGWD = parseInt(data.GWD) || 0;
    const seasonFourthQC = parseInt(data['4QC']) || 0;
    const seasonGames = parseInt(data.G) || 17;
    
    totalGWD += seasonGWD * weight;
    totalFourthQC += seasonFourthQC * weight;
    totalGames += seasonGames * weight;
    totalWeight += weight;
  });

  if (totalWeight === 0 || totalGames === 0) return 0;

  // Normalize regular season weighted totals for rate calculations
  totalGWD = totalGWD / totalWeight;
  totalFourthQC = totalFourthQC / totalWeight;
  totalGames = totalGames / totalWeight;

  // Second Pass: Calculate playoff clutch performance adjustment if enabled
  if (includePlayoffs) {
    let totalPlayoffWeight = 0;
    let playoffClutchMultiplier = 1.0;
    
    Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
      const weight = yearWeights[year] || 0;
      if (weight === 0 || !data.playoffData) return;
      
      const playoff = data.playoffData;
      const playoffGWD = parseInt(playoff.gameWinningDrives) || 0;
      const playoffFourthQC = parseInt(playoff.fourthQuarterComebacks) || 0;
      const playoffGamesStarted = parseInt(playoff.gamesStarted) || 0;
      
      // Regular season clutch stats for comparison
      const regSeasonGWD = parseInt(data.GWD) || 0;
      const regSeasonFourthQC = parseInt(data['4QC']) || 0;
      const regSeasonGames = parseInt(data.G) || 17;
      
      if (playoffGamesStarted > 0 && regSeasonGames > 0) {
        // Calculate playoff vs regular season clutch performance rates
        const playoffGWDRate = playoffGWD / playoffGamesStarted;
        const playoffFourthQCRate = playoffFourthQC / playoffGamesStarted;
        const regGWDRate = regSeasonGWD / regSeasonGames;
        const regFourthQCRate = regSeasonFourthQC / regSeasonGames;
        
        // Calculate performance improvement/decline ratios (capped for sanity)
        const gwdRatio = Math.max(0.75, Math.min(1.35, playoffGWDRate / Math.max(regGWDRate, 0.05)));
        const fourthQCRatio = Math.max(0.75, Math.min(1.35, playoffFourthQCRate / Math.max(regFourthQCRate, 0.03)));
        
        // Average the clutch performance ratios
        const avgClutchRatio = (gwdRatio + fourthQCRatio) / 2;
        
        // Apply round progression modifier (modest impact)
        const playoffWins = parseInt(playoff.wins) || 0;
        const playoffLosses = parseInt(playoff.losses) || 0;
        const totalPlayoffGames = playoffWins + playoffLosses;
        
        let roundImportanceBonus = 1.0;
        if (totalPlayoffGames >= 3 && playoffWins >= 2) {
          // Known Super Bowl results for accurate detection
          const knownSuperBowlWins = {
            'KAN': [2022, 2023], // Chiefs won 2022 and 2023 Super Bowls (Mahomes)
            'PHI': [2024] // Eagles won 2024 Super Bowl (Hurts)
          };
          
          if (knownSuperBowlWins[data.Team] && knownSuperBowlWins[data.Team].includes(parseInt(year))) {
            roundImportanceBonus = 1.10; // Consistent across both modes
          } else if (playoffWins >= 2) {
            roundImportanceBonus = 1.05; // Consistent across both modes
          }
        }
        
        // Combine clutch performance ratio with round importance
        const seasonClutchMultiplier = avgClutchRatio * roundImportanceBonus;
        playoffClutchMultiplier += (seasonClutchMultiplier - 1.0) * weight;
        totalPlayoffWeight += weight;
        
        if (debugMode && playerName) {
          console.log(`💎 ${year}: Playoff clutch adjustment - GWD ratio: ${gwdRatio.toFixed(3)}, 4QC ratio: ${fourthQCRatio.toFixed(3)}, Round bonus: ${roundImportanceBonus.toFixed(3)}, Combined: ${seasonClutchMultiplier.toFixed(3)}`);
        }
      }
    });
    
    // Normalize the playoff clutch adjustment
    if (totalPlayoffWeight > 0) {
      playoffAdjustmentFactor = 1.0 + (playoffClutchMultiplier / totalPlayoffWeight);
      // Cap the adjustment to prevent extreme swings - RELAXED CAPS to avoid systematic deflation
      playoffAdjustmentFactor = Math.max(0.98, Math.min(1.20, playoffAdjustmentFactor));
    }
    
    if (debugMode && playerName) {
      console.log(`💎 Final playoff clutch adjustment factor: ${playoffAdjustmentFactor.toFixed(3)}`);
    }
  }

  // Calculate per-game rates using regular season base
  const gwdPerGame = totalGames > 0 ? totalGWD / totalGames : 0;
  const comebacksPerGame = totalFourthQC / totalGames;
  const totalClutchPerGame = gwdPerGame + comebacksPerGame;

  // RELATIVE PERCENTILE-BASED CLUTCH SCORING - Following normalization rules
  // Step 1: Calculate metrics for all QBs to establish distributions
  const allGWDRates = allQBData.map(qb => {
    if (!qb.years) return 0;
    const yearWeights = (filterYear && typeof filterYear === 'number')
      ? { [filterYear.toString()]: 1.0 }
      : PERFORMANCE_YEAR_WEIGHTS;
    let gwdSum = 0, gamesSum = 0, weightSum = 0;
    
    Object.entries(qb.years).forEach(([year, data]) => {
      const weight = yearWeights[year] || 0;
      if (weight === 0 || !data.GWD) return;
      const gwd = parseInt(data.GWD) || 0;
      const games = parseInt(data.G) || 17;
      gwdSum += gwd * weight;
      gamesSum += games * weight;
      weightSum += weight;
    });
    
    return weightSum > 0 ? (gwdSum / weightSum) / (gamesSum / weightSum) : 0;
  }).filter(v => !isNaN(v) && isFinite(v));

  const allFourthQCRates = allQBData.map(qb => {
    if (!qb.years) return 0;
    const yearWeights = (filterYear && typeof filterYear === 'number')
      ? { [filterYear.toString()]: 1.0 }
      : PERFORMANCE_YEAR_WEIGHTS;
    let qcSum = 0, gamesSum = 0, weightSum = 0;
    
    Object.entries(qb.years).forEach(([year, data]) => {
      const weight = yearWeights[year] || 0;
      if (weight === 0 || !data['4QC']) return;
      const qc = parseInt(data['4QC']) || 0;
      const games = parseInt(data.G) || 17;
      qcSum += qc * weight;
      gamesSum += games * weight;
      weightSum += weight;
    });
    
    return weightSum > 0 ? (qcSum / weightSum) / (gamesSum / weightSum) : 0;
  }).filter(v => !isNaN(v) && isFinite(v));

  const allClutchRates = allQBData.map(qb => {
    if (!qb.years) return 0;
    const yearWeights = (filterYear && typeof filterYear === 'number')
      ? { [filterYear.toString()]: 1.0 }
      : PERFORMANCE_YEAR_WEIGHTS;
    let totalClutch = 0, gamesSum = 0, weightSum = 0;
    
    Object.entries(qb.years).forEach(([year, data]) => {
      const weight = yearWeights[year] || 0;
      if (weight === 0 || (!data.GWD && !data['4QC'])) return;
      const gwd = parseInt(data.GWD) || 0;
      const qc = parseInt(data['4QC']) || 0;
      const games = parseInt(data.G) || 17;
      totalClutch += (gwd + qc) * weight;
      gamesSum += games * weight;
      weightSum += weight;
    });
    
    return weightSum > 0 ? (totalClutch / weightSum) / (gamesSum / weightSum) : 0;
  }).filter(v => !isNaN(v) && isFinite(v));

  const allPlayoffAdjustments = allQBData.map(qb => {
    if (!qb.years || !includePlayoffs) return 1.0;
    // Calculate playoff adjustment factor for each QB (simplified)
    let adjustmentSum = 0, weightSum = 0;
    const yearWeights = (filterYear && typeof filterYear === 'number')
      ? { [filterYear.toString()]: 1.0 }
      : PERFORMANCE_YEAR_WEIGHTS;
    
    Object.entries(qb.years).forEach(([year, data]) => {
      const weight = yearWeights[year] || 0;
      if (weight === 0 || !data.playoffData) return;
      adjustmentSum += weight; // Basic playoff participation bonus
      weightSum += weight;
    });
    
    return weightSum > 0 ? 1.0 + (adjustmentSum * 0.1) : 1.0; // Small playoff bonus
  }).filter(v => !isNaN(v) && isFinite(v));

  // Step 2: Score current QB relative to all others using z-scores (not percentiles)
  const gwdZ = calculateZScoreValue(gwdPerGame, allGWDRates);
  const comebackZ = calculateZScoreValue(comebacksPerGame, allFourthQCRates);
  const clutchRateZ = calculateZScoreValue(totalClutchPerGame, allClutchRates);
  const playoffBonusZ = calculateZScoreValue(playoffAdjustmentFactor, allPlayoffAdjustments);
  
  // Calculate weighted average of z-scores using sub-component weights
  const clutchComponentZScores = {
    gameWinningDrives: gwdZ,
    fourthQuarterComebacks: comebackZ,
    clutchRate: clutchRateZ,
    playoffBonus: playoffBonusZ
  };
  
  // Use hierarchical scoring on z-scores
  const clutchCompositeZScore = calculateHierarchicalScore(clutchComponentZScores, clutchWeights);

  if (debugMode && playerName) {
    console.log(`💎 CLUTCH Z-SCORE CALCULATION:`);
    console.log(`💎 Z-Scores: GWD(${gwdZ.toFixed(3)}) + 4QC(${comebackZ.toFixed(3)}) + Rate(${clutchRateZ.toFixed(3)}) + PlayoffBonus(${playoffBonusZ.toFixed(3)})`);
    console.log(`💎 Weights: GWD(${clutchWeights.gameWinningDrives}%) + 4QC(${clutchWeights.fourthQuarterComebacks}%) + Rate(${clutchWeights.clutchRate}%) + Playoff(${clutchWeights.playoffBonus}%)`);
    console.log(`💎 Composite Z-Score: ${clutchCompositeZScore.toFixed(3)}`);
    console.log(`💎 Raw Rates: ${gwdPerGame.toFixed(3)} GWD/game, ${comebacksPerGame.toFixed(3)} 4QC/game (relative to ${allGWDRates.length} QBs)`);
  }

  // Return z-score for higher-level composite calculation
  return clutchCompositeZScore;
}; 