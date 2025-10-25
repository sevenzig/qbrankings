import { PERFORMANCE_YEAR_WEIGHTS } from './constants.js';
import {
  calculateZScore,
  calculateMean,
  calculateStandardDeviation,
  zScoreToPercentile
} from '../../utils/zScoreCalculations.js';
import { 
  fetchClutchSplitsForQB, 
  fetchAllQBsClutchData,
  hasSufficientClutchData 
} from '../../utils/clutchDataService.js';
import { 
  calculateCategoryPerformance,
  calculateAllCategoryPerformance,
  calculateOverallClutchScore
} from '../../utils/clutchMetricsCalculator.js';
import { 
  getClutchCategoryKeys, 
  getClutchCategoryWeights 
} from '../../utils/clutchCategories.js';

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

// Enhanced Clutch Performance Score using situational split data (0-100)
export const calculateClutchScore = (qbSeasonData, includePlayoffs = false, clutchWeights = { gameWinningDrives: 40, fourthQuarterComebacks: 25, clutchRate: 15, playoffBonus: 0 }, filterYear = null, allQBData = []) => {
  try {
    // Debug logging
    const playerName = qbSeasonData.years && Object.values(qbSeasonData.years)[0]?.Player;
    const debugMode = includePlayoffs && playerName && (playerName.includes('Mahomes') || playerName.includes('Hurts') || playerName.includes('Allen'));
    
    if (debugMode) {
      console.log(`💎 CLUTCH DEBUG - ${playerName} (New Split-Based System)`);
    }

    // For now, fall back to the original GWD/4QC system until async data fetching is implemented
    // This maintains compatibility while the new system is being developed
    console.log('🔄 Using fallback GWD/4QC clutch system (new split-based system in development)');
    
    // Original GWD/4QC calculation logic
    let totalGWD = 0;
    let totalFourthQC = 0;
    let totalGames = 0;
    let totalWeight = 0;
    let playoffAdjustmentFactor = 1.0;
    
    const yearWeights = (filterYear && typeof filterYear === 'number')
      ? { [filterYear.toString()]: 1.0 }
      : PERFORMANCE_YEAR_WEIGHTS;
    
    Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
      const weight = yearWeights[year] || 0;
      const gamesPlayed = parseInt(data.G) || 0;
      if (weight === 0 || (!data.GWD && !data['4QC'])) return;
      
      const isSingleYear = filterYear && typeof filterYear === 'number';
      const gamesThreshold = (() => {
        if (isSingleYear) {
          if (filterYear === 2025) return 1;  // Partial season
          return 2;                            // All other years
        }
        return 10;                            // Multi-year
      })();
      if (gamesPlayed < gamesThreshold) return;
      
      const seasonGWD = parseInt(data.GWD) || 0;
      const seasonFourthQC = parseInt(data['4QC']) || 0;
      const seasonGames = parseInt(data.G) || 17;
      
      totalGWD += seasonGWD * weight;
      totalFourthQC += seasonFourthQC * weight;
      totalGames += seasonGames * weight;
      totalWeight += weight;
    });

    if (totalWeight === 0 || totalGames === 0) return 0;

    totalGWD = totalGWD / totalWeight;
    totalFourthQC = totalFourthQC / totalWeight;
    totalGames = totalGames / totalWeight;

    // Playoff adjustment
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
        
        const regSeasonGWD = parseInt(data.GWD) || 0;
        const regSeasonFourthQC = parseInt(data['4QC']) || 0;
        const regSeasonGames = parseInt(data.G) || 17;
        
        if (playoffGamesStarted > 0 && regSeasonGames > 0) {
          const playoffGWDRate = playoffGWD / playoffGamesStarted;
          const playoffFourthQCRate = playoffFourthQC / playoffGamesStarted;
          const regGWDRate = regSeasonGWD / regSeasonGames;
          const regFourthQCRate = regSeasonFourthQC / regSeasonGames;
          
          const gwdRatio = Math.max(0.75, Math.min(1.35, playoffGWDRate / Math.max(regGWDRate, 0.05)));
          const fourthQCRatio = Math.max(0.75, Math.min(1.35, playoffFourthQCRate / Math.max(regFourthQCRate, 0.03)));
          
          const avgClutchRatio = (gwdRatio + fourthQCRatio) / 2;
          
          const playoffWins = parseInt(playoff.wins) || 0;
          const playoffLosses = parseInt(playoff.losses) || 0;
          const totalPlayoffGames = playoffWins + playoffLosses;
          
          let roundImportanceBonus = 1.0;
          if (totalPlayoffGames >= 3 && playoffWins >= 2) {
            const knownSuperBowlWins = {
              'KAN': [2022, 2023],
              'PHI': [2024]
            };
            
            if (knownSuperBowlWins[data.Team] && knownSuperBowlWins[data.Team].includes(parseInt(year))) {
              roundImportanceBonus = 1.10;
            } else if (playoffWins >= 2) {
              roundImportanceBonus = 1.05;
            }
          }
          
          const seasonClutchMultiplier = avgClutchRatio * roundImportanceBonus;
          playoffClutchMultiplier += (seasonClutchMultiplier - 1.0) * weight;
          totalPlayoffWeight += weight;
        }
      });
      
      if (totalPlayoffWeight > 0) {
        playoffAdjustmentFactor = 1.0 + (playoffClutchMultiplier / totalPlayoffWeight);
        playoffAdjustmentFactor = Math.max(0.98, Math.min(1.20, playoffAdjustmentFactor));
      }
    }

    const gwdPerGame = totalGames > 0 ? totalGWD / totalGames : 0;
    const comebacksPerGame = totalFourthQC / totalGames;
    const totalClutchPerGame = gwdPerGame + comebacksPerGame;

    // Calculate z-scores relative to all QBs
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
      let adjustmentSum = 0, weightSum = 0;
      const yearWeights = (filterYear && typeof filterYear === 'number')
        ? { [filterYear.toString()]: 1.0 }
        : PERFORMANCE_YEAR_WEIGHTS;
      
      Object.entries(qb.years).forEach(([year, data]) => {
        const weight = yearWeights[year] || 0;
        if (weight === 0 || !data.playoffData) return;
        adjustmentSum += weight;
        weightSum += weight;
      });
      
      return weightSum > 0 ? 1.0 + (adjustmentSum * 0.1) : 1.0;
    }).filter(v => !isNaN(v) && isFinite(v));

    const gwdZ = calculateZScoreValue(gwdPerGame, allGWDRates);
    const comebackZ = calculateZScoreValue(comebacksPerGame, allFourthQCRates);
    const clutchRateZ = calculateZScoreValue(totalClutchPerGame, allClutchRates);
    // DISABLED: Playoff bonus disabled globally
    const playoffBonusZ = 0; // calculateZScoreValue(playoffAdjustmentFactor, allPlayoffAdjustments);
    
    const clutchComponentZScores = {
      gameWinningDrives: gwdZ,
      fourthQuarterComebacks: comebackZ,
      clutchRate: clutchRateZ,
      playoffBonus: playoffBonusZ
    };
    
    const clutchCompositeZScore = calculateHierarchicalScore(clutchComponentZScores, clutchWeights);

    if (debugMode) {
      console.log(`💎 CLUTCH Z-SCORE CALCULATION (Fallback):`);
      console.log(`💎 Z-Scores: GWD(${gwdZ.toFixed(3)}) + 4QC(${comebackZ.toFixed(3)}) + Rate(${clutchRateZ.toFixed(3)}) + PlayoffBonus(${playoffBonusZ.toFixed(3)})`);
      console.log(`💎 Composite Z-Score: ${clutchCompositeZScore.toFixed(3)}`);
    }

    return clutchCompositeZScore;

  } catch (error) {
    console.error('❌ Error calculating clutch score:', error);
    return 0;
  }
}; 