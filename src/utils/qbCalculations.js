// QB calculation utility functions
import {
  calculateTeamScore,
  calculateStatsScore,
  calculateClutchScore,
  calculateDurabilityScore,
  calculateSupportScore
} from '../components/scoringCategories/index.js';

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

// Hierarchical weight calculation system
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

export const calculateQBMetrics = (qb, supportWeights = { offensiveLine: 55, weapons: 30, defense: 15 }, statsWeights = { efficiency: 45, protection: 25, volume: 30 }, teamWeights = { regularSeason: 65, playoff: 35 }, clutchWeights = { gameWinningDrives: 40, fourthQuarterComebacks: 25, clutchRate: 15, playoffBonus: 20 }, includePlayoffs = true, include2024Only = false, efficiencyWeights = { anyA: 45, tdPct: 30, completionPct: 25 }, protectionWeights = { sackPct: 60, turnoverRate: 40 }, volumeWeights = { passYards: 25, passTDs: 25, rushYards: 20, rushTDs: 15, totalAttempts: 15 }, durabilityWeights = { availability: 75, consistency: 25 }, allQBData = []) => {
  // Create season data structure for enhanced calculations
  const qbSeasonData = {
    years: {}
  };
  
  // Convert season data to expected format (including playoff data)
  // Filter season data for 2024-only mode if enabled
  let seasonsToProcess = qb.seasonData || [];
  if (include2024Only) {
    seasonsToProcess = seasonsToProcess.filter(season => season.year === 2024);
  }
  
  if (seasonsToProcess.length > 0) {
    seasonsToProcess.forEach(season => {
      qbSeasonData.years[season.year] = {
        // Regular season data
        G: season.gamesStarted,
        GS: season.gamesStarted,
        QBrec: `${season.wins}-${season.losses}-0`,
        Rate: season.passerRating,
        'ANY/A': season.anyPerAttempt || 0,
        'TD%': season.passingTDs / Math.max(1, season.attempts) * 100,
        'Int%': season.interceptions / Math.max(1, season.attempts) * 100,
        'Succ%': season.successRate || 0,
        'Sk%': season.sackPercentage || 0,
        Att: season.attempts,
        Cmp: season.completions,
        Yds: season.passingYards,
        TD: season.passingTDs,
        Int: season.interceptions,
        Sk: season.sacks,
        GWD: season.gameWinningDrives || 0,
        '4QC': season.fourthQuarterComebacks || 0,
        team: season.team,
        teamsPlayed: season.teamsPlayed, // For multi-team seasons
        Team: season.team,
        Player: qb.name,
        Age: season.age,
        
        // Add rushing data
        RushingYds: season.rushingYards || 0,
        RushingTDs: season.rushingTDs || 0,
        Fumbles: season.fumbles || 0,
        
        // Add playoff data if available AND if playoffs are included globally
        playoffData: (season.playoffData && includePlayoffs) ? season.playoffData : null
      };
    });
  }

  // Add current team and player name to season data for contextual calculations
  qbSeasonData.currentTeam = qb.team;
  qbSeasonData.name = qb.name;

  // Calculate scores using hierarchical weight system
  const supportScore = calculateSupportScore(qbSeasonData, supportWeights, include2024Only);
  const teamScore = calculateTeamScore(qbSeasonData, teamWeights, includePlayoffs, include2024Only, supportScore);
  const statsScore = calculateStatsScore(qbSeasonData, statsWeights, includePlayoffs, include2024Only, efficiencyWeights, protectionWeights, volumeWeights);
  const clutchScore = calculateClutchScore(qbSeasonData, includePlayoffs, clutchWeights, include2024Only, allQBData);
  const durabilityScore = calculateDurabilityScore(qbSeasonData, includePlayoffs, include2024Only, durabilityWeights);
  
  return {
    team: teamScore,
    stats: statsScore,
    clutch: clutchScore,
    durability: durabilityScore,
    support: supportScore
  };
};

// Season-specific game start penalty system - Applied per season before weighting
function applyGameStartPenalties(qb, include2024Only = false) {
  let penalties = {
    2024: 1.0,
    2023: 1.0,
    2022: 1.0
  };

  // Get game starts by season
  const gameStarts = {
    2024: 0,
    2023: 0,
    2022: 0
  };

  if (qb.seasonData) {
    qb.seasonData.forEach(season => {
      if (gameStarts[season.year] !== undefined) {
        gameStarts[season.year] = season.gamesStarted || 0;
      }
    });
  }

  if (include2024Only) {
    // 2024-only mode: Only penalize for insufficient 2024 starts
    penalties[2024] = gameStarts[2024] >= 8 ? 1.0 : slidingLogPenalty(gameStarts[2024], 8, 1.2);
  } else {
    // Multi-year mode: Apply penalties to each season individually
    
    // 2024: 8+ games = normal, <8 games = punishment
    if (gameStarts[2024] > 0) {
      penalties[2024] = gameStarts[2024] >= 8 ? 1.0 : slidingLogPenalty(gameStarts[2024], 8, 1.2);
    } else {
      penalties[2024] = 0; // No games = no contribution from this season
    }

    // 2023: 8+ games = normal, <8 games = punishment
    if (gameStarts[2023] > 0) {
      penalties[2023] = gameStarts[2023] >= 8 ? 1.0 : slidingLogPenalty(gameStarts[2023], 8, 1.15);
    } else {
      penalties[2023] = 0; // No games = no contribution from this season
    }
    
    // 2022: 8+ games = normal, <8 games = punishment
    if (gameStarts[2022] > 0) {
      penalties[2022] = gameStarts[2022] >= 8 ? 1.0 : slidingLogPenalty(gameStarts[2022], 8, 1.15);
    } else {
      penalties[2022] = 0; // No games = no contribution from this season
    }
  }

  return penalties;
}

// Sliding penalty function (logarithmic)
function slidingLogPenalty(gamesStarted, threshold, maxPenalty = 1.2) {
  if (gamesStarted >= threshold) return 1.0;
  
  // Ensure minimum penalty factor to prevent complete score elimination
  const minPenaltyFactor = 0.05; // Never reduce score by more than 95%
  
  if (gamesStarted <= 0) return minPenaltyFactor;
  
  const logX = Math.log(gamesStarted);
  const logT = Math.log(threshold);
  const penalty = maxPenalty * (1 - (logX / logT));
  const penaltyFactor = 1.0 - penalty;
  
  // Ensure penalty factor never goes below minimum
  return Math.max(minPenaltyFactor, penaltyFactor);
}

// Main QEI calculation with true hierarchical weighting and per-season penalties
export const calculateQEI = (baseScores, qb, weights, includePlayoffs = true, allQBBaseScores = [], include2024Only = false, allQBsRawQei = null) => {
  // Apply season-specific game start penalties
  const penalties = applyGameStartPenalties(qb, include2024Only);
  
  // Apply penalties to component scores before hierarchical weighting
  // Support is inverted: higher support quality = lower component contribution (achievements less impressive)
  // Reduced adjustment: 50% inversion instead of 100% for more moderate penalty
  const penalizedScores = {
    team: baseScores.team,
    stats: baseScores.stats,
    clutch: baseScores.clutch,
    durability: baseScores.durability,
    support: 100 - (baseScores.support * 0.5) // 50% inversion for moderate penalty
  };

  // In multi-year mode, apply per-season penalties to scores
  // Note: This is a simplified approach - ideally we'd apply penalties to each season's 
  // component scores before combining, but that would require restructuring all scoring functions
  if (!include2024Only) {
    // Calculate effective weight reduction based on season penalties
    // Year weights: 2024: 75%, 2023: 20%, 2022: 5%
    const yearWeights = { 2024: 0.75, 2023: 0.20, 2022: 0.05 };
    const effectiveWeight = (penalties[2024] * yearWeights[2024]) + 
                           (penalties[2023] * yearWeights[2023]) + 
                           (penalties[2022] * yearWeights[2022]);
    
    // Apply the effective weight reduction to all component scores
    Object.keys(penalizedScores).forEach(component => {
      penalizedScores[component] *= effectiveWeight;
    });
  } else {
    // In 2024-only mode, apply 2024 penalty directly
    Object.keys(penalizedScores).forEach(component => {
      penalizedScores[component] *= penalties[2024];
    });
  }

  // Calculate weighted composite score using user's current weights (true hierarchical)
  const compositeScore = calculateHierarchicalScore(penalizedScores, weights);
  
  // Apply experience penalty for rookies and near-rookies in 2024-only mode only
  const experience = qb?.experience || qb?.seasonData?.length || 1;
  let experienceModifier = 1.0;
  if (include2024Only) {
    if (experience === 1) {
      experienceModifier = 0.85; // 15% penalty for 2024 rookies
    } else if (experience === 2) {
      experienceModifier = 0.97; // 3% penalty for second-year QBs
    }
  }
  
  // Calculate final QEI score
  let finalScore = compositeScore * experienceModifier;
  
  // Ensure minimum score of 0
  return Math.max(0, finalScore);
};

// Helper: Normalize QEI scores so top = 100, median = 65, min = 0
function normalizeQeiScores(qeiScores) {
  if (!qeiScores || qeiScores.length === 0) return [];
  const sorted = [...qeiScores].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = sorted[Math.floor(sorted.length / 2)];
  // Avoid divide by zero
  if (max === min) return qeiScores.map(() => 65);
  // Linear stretch: min -> 0, median -> 65, max -> 100
  // For scores below median: scale [min, median] to [0, 65]
  // For scores above median: scale [median, max] to [65, 100]
  return qeiScores.map(score => {
    if (score <= median) {
      return ((score - min) / (median - min)) * 65;
    } else {
      return 65 + ((score - median) / (max - median)) * 35;
    }
  });
}

// Normalize all QEI scores across the dataset
export function normalizeAllQeiScores(qbQeiList) {
  const qeiValues = qbQeiList.map(qb => qb.qei || 0);
  const normalizedValues = normalizeQeiScores(qeiValues);
  
  return qbQeiList.map((qb, index) => ({
    ...qb,
    qei: normalizedValues[index]
  }));
}