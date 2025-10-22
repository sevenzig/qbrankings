// QB calculation utility functions
import {
  calculateTeamScore,
  calculateStatsScore,
  calculateClutchScore,
  calculateDurabilityScore,
  calculateSupportScore
} from '../components/scoringCategories/index.js';
import { zScoreToPercentile } from './zScoreCalculations.js';

// Helper function to normalize weights within a group
const normalizeWeights = (weights) => {
  if (!weights || typeof weights !== 'object') {
    return {};
  }
  
  const total = Object.values(weights).reduce((sum, weight) => {
    const w = parseFloat(weight) || 0;
    return sum + (isNaN(w) || !isFinite(w) ? 0 : w);
  }, 0);
  
  if (total === 0) return weights;
  
  const normalized = {};
  Object.keys(weights).forEach(key => {
    const weight = parseFloat(weights[key]) || 0;
    normalized[key] = (isNaN(weight) || !isFinite(weight)) ? 0 : weight / total;
  });
  return normalized;
};

// Legacy function - kept for compatibility but no longer used
const calculateSupportAdjustedScore = (rawScore, supportQuality, allQBBaseScores, category, supportWeight) => {
  // This function is no longer used - replaced with direct support adjustment factor
  return rawScore;
};

// Helper: Calculate percentile rank of a score within an array
const calculatePercentileRank = (score, sortedArray) => {
  if (sortedArray.length === 0) return 50;
  
  let rank = 0;
  for (let i = 0; i < sortedArray.length; i++) {
    if (sortedArray[i] < score) rank++;
    else if (sortedArray[i] === score) rank += 0.5;
  }
  
  return (rank / sortedArray.length) * 100;
};

// Helper: Calculate what score corresponds to a given percentile
const calculateScoreAtPercentile = (percentile, sortedArray) => {
  if (sortedArray.length === 0) return 0;
  
  const index = (percentile / 100) * (sortedArray.length - 1);
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  
  if (lowerIndex === upperIndex) {
    return sortedArray[lowerIndex];
  }
  
  const weight = index - lowerIndex;
  return sortedArray[lowerIndex] * (1 - weight) + sortedArray[upperIndex] * weight;
};

// Helper: Calculate support adjustment factor - INVERTS support quality as penalty/reward
const calculateSupportAdjustmentFactor = (supportQuality, supportWeight) => {
  // INVERSION LOGIC: Higher support = penalty, Lower support = reward
  // The adjustment strength scales with support weight (0-100%)
  const adjustmentStrength = supportWeight / 100; // 0.0 to 1.0
  
  // Calculate adjustment based on INVERTED support quality
  // Good support (high numbers) = penalty when support weight increases
  // Poor support (low numbers) = reward when support weight increases
  
  let adjustmentFactor;
  
  if (supportQuality >= 80) {
    // Elite support: PENALTY scales from 0% to 15% as support weight increases
    const penaltyAmount = 0.15 * adjustmentStrength;
    adjustmentFactor = 1.0 - penaltyAmount;
  } else if (supportQuality >= 60) {
    // Good support: PENALTY scales from 0% to 8% as support weight increases  
    const penaltyAmount = 0.08 * adjustmentStrength;
    adjustmentFactor = 1.0 - penaltyAmount;
  } else if (supportQuality >= 40) {
    // Average support: REWARD scales from 0% to 5% as support weight increases
    const rewardAmount = 0.05 * adjustmentStrength;
    adjustmentFactor = 1.0 + rewardAmount;
  } else if (supportQuality >= 20) {
    // Poor support: REWARD scales from 0% to 15% as support weight increases
    const rewardAmount = 0.15 * adjustmentStrength;
    adjustmentFactor = 1.0 + rewardAmount;
  } else {
    // Terrible support: REWARD scales from 0% to 20% as support weight increases
    const rewardAmount = 0.20 * adjustmentStrength;
    adjustmentFactor = 1.0 + rewardAmount;
  }
  
  // TEST VERIFICATION: Log the calculation for debugging
  if (supportWeight > 0) {
    const qbName = 'TEST_QB';
    const adjustmentType = adjustmentFactor > 1.0 ? 'REWARD' : 'PENALTY';
    const adjustmentPercent = ((adjustmentFactor - 1.0) * 100).toFixed(1);
    console.log(`🧪 TEST INVERSION: Support(${supportQuality}) @ Weight(${supportWeight}%) -> ${adjustmentType} ${adjustmentPercent}% (Factor: ${adjustmentFactor.toFixed(3)})`);
  }
  
  return Math.max(0.75, Math.min(1.25, adjustmentFactor)); // Safety bounds
};

// Hierarchical weight calculation system - PRESERVES VARIANCE by using RAW weights
// This prevents z-score compression that occurs with normalization at each level
export const calculateHierarchicalScore = (componentScores, weights) => {
  // DO NOT normalize weights here - use raw weights to preserve z-score magnitude
  // Normalization only happens at the final QEI calculation
  let weightedSum = 0;
  let totalWeight = 0;
  
  Object.keys(componentScores).forEach(key => {
    if (weights[key] !== undefined) {
      const score = componentScores[key] || 0;
      const weight = parseFloat(weights[key]) || 0;
      
      // Ensure both score and weight are valid numbers
      if (!isNaN(score) && isFinite(score) && !isNaN(weight) && isFinite(weight) && weight > 0) {
        weightedSum += score * weight;
        totalWeight += weight;
      }
    }
  });
  
  // Normalize by total weight to get weighted average
  if (totalWeight === 0 || isNaN(weightedSum) || !isFinite(weightedSum)) {
    return 0;
  }
  
  return weightedSum / totalWeight;
};

export const calculateQBMetrics = (qb, supportWeights = { offensiveLine: 55, weapons: 30, defense: 15 }, statsWeights = { efficiency: 45, protection: 25, volume: 30 }, teamWeights = { regularSeason: 65, playoff: 35 }, clutchWeights = { gameWinningDrives: 40, fourthQuarterComebacks: 25, clutchRate: 15, playoffBonus: 20 }, includePlayoffs = true, include2024Only = false, efficiencyWeights = { anyA: 45, tdPct: 30, completionPct: 25 }, protectionWeights = { sackPct: 60, turnoverRate: 40 }, volumeWeights = { passYards: 25, passTDs: 25, rushYards: 20, rushTDs: 15, totalAttempts: 15 }, durabilityWeights = { availability: 75, consistency: 25 }, allQBData = [], mainSupportWeight = 0) => {
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
        gamesStartedPerTeam: season.gamesStartedPerTeam, // Games started with each team
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

  // Calculate scores using hierarchical weight system with z-score based calculations
  const supportScore = calculateSupportScore(qbSeasonData, supportWeights, include2024Only, mainSupportWeight);
  const teamScore = calculateTeamScore(qbSeasonData, teamWeights, includePlayoffs, include2024Only, supportScore, allQBData);
  const statsScore = calculateStatsScore(qbSeasonData, statsWeights, includePlayoffs, include2024Only, efficiencyWeights, protectionWeights, volumeWeights, allQBData);
  const clutchScore = calculateClutchScore(qbSeasonData, includePlayoffs, clutchWeights, include2024Only, allQBData);
  const durabilityScore = calculateDurabilityScore(qbSeasonData, includePlayoffs, include2024Only, durabilityWeights, allQBData);
  
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

// Main QEI calculation with FLATTENED weighting to preserve variance
export const calculateQEI = (baseScores, qb, weights, includePlayoffs = true, allQBBaseScores = [], include2024Only = false, allQBsRawQei = null) => {
  // Apply season-specific game start penalties
  const penalties = applyGameStartPenalties(qb, include2024Only);
  
  // baseScores now contain composite z-scores from each category
  // We need to flatten the hierarchy to preserve variance
  const qbName = qb?.name || 'Unknown QB';
  const isKeyQB = qbName.includes('Hurts') || qbName.includes('Burrow') || qbName.includes('Jackson') || qbName.includes('Allen');
  
  if (isKeyQB) {
    console.log(`🔍 QEI FLATTENED Z-SCORE CALCULATION ${qbName}: baseScores (composite z-scores):`, {
      team: baseScores.team?.toFixed(3),
      stats: baseScores.stats?.toFixed(3),
      clutch: baseScores.clutch?.toFixed(3),
      durability: baseScores.durability?.toFixed(3),
      support: baseScores.support?.toFixed(3)
    });
  }
  
  // INVERT support z-score: Higher support (good cast) becomes negative contribution
  // Lower support (bad cast) becomes positive contribution
  // This creates the penalty/reward system where good supporting casts hurt QB ranking
  const invertedSupportZScore = -(baseScores.support || 0);
  
  // DURABILITY CONVERSION: Durability now returns 0-100 score, not z-score
  // Convert to z-score for hierarchical calculation
  // 100 (full season) = +2.0 SD, 50 (half season) = 0.0 SD, 0 (no games) = -2.0 SD
  const durabilityZScore = ((baseScores.durability || 50) - 50) / 25;
  
  // Use composite z-scores as-is (they already include sub-component weighting)
  let contextualScores = {
    team: baseScores.team || 0,
    stats: baseScores.stats || 0,
    clutch: baseScores.clutch || 0,
    durability: durabilityZScore,  // Converted from 0-100 to z-score
    support: invertedSupportZScore  // INVERTED: good support becomes penalty
  };
  
  if (isKeyQB) {
    console.log(`🔄 SUPPORT INVERSION ${qbName}:`);
    console.log(`   Original Support Z-Score: ${(baseScores.support || 0).toFixed(3)}`);
    console.log(`   Inverted Support Z-Score: ${invertedSupportZScore.toFixed(3)}`);
    console.log(`   Effect: ${invertedSupportZScore > 0 ? 'REWARD (bad cast)' : 'PENALTY (good cast)'}`);
  }

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
    Object.keys(contextualScores).forEach(component => {
      if (isNaN(contextualScores[component]) || !isFinite(contextualScores[component])) {
        contextualScores[component] = 0;
      }
      contextualScores[component] *= effectiveWeight;
    });
  } else {
    // In 2024-only mode, apply 2024 penalty directly
    Object.keys(contextualScores).forEach(component => {
      if (isNaN(contextualScores[component]) || !isFinite(contextualScores[component])) {
        contextualScores[component] = 0;
      }
      contextualScores[component] *= penalties[2024];
    });
  }

  // Extract only top-level weights for hierarchical calculation
  const topLevelWeights = {
    team: weights.team || 0,
    stats: weights.stats || 0,
    clutch: weights.clutch || 0,
    durability: weights.durability || 0,
    support: weights.support || 0
  };

  // Calculate weighted composite z-score using user's current weights (true hierarchical)
  const compositeZScore = calculateHierarchicalScore(contextualScores, topLevelWeights);
  
  // DEBUG: Show the hierarchical z-score calculation for key QBs
  if (isKeyQB) {
    console.log(`🧮 HIERARCHICAL Z-SCORE CALC ${qbName}:`);
    console.log(`   Z-Scores: Team(${contextualScores.team.toFixed(3)}) Stats(${contextualScores.stats.toFixed(3)}) Clutch(${contextualScores.clutch.toFixed(3)}) Durability(${contextualScores.durability.toFixed(3)}) Support(${contextualScores.support.toFixed(3)})`);
    console.log(`   Weights: Team(${topLevelWeights.team}) Stats(${topLevelWeights.stats}) Clutch(${topLevelWeights.clutch}) Durability(${topLevelWeights.durability}) Support(${topLevelWeights.support})`);
    console.log(`   Composite Z-Score: ${compositeZScore.toFixed(3)}`);
  }
  
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
  
  // Apply experience penalty to composite z-score
  const adjustedCompositeZScore = compositeZScore * experienceModifier;
  
  // **CRITICAL STEP**: Convert final composite z-score to percentile (0-100)
  const finalPercentile = zScoreToPercentile(adjustedCompositeZScore);
  
  // Ensure minimum score of 0 and handle NaN/Infinity
  if (isNaN(finalPercentile) || !isFinite(finalPercentile)) {
    return 0;
  }
  
  // DEBUG: Show final score calculation for key QBs
  if (isKeyQB) {
    console.log(`🏆 FINAL QEI ${qbName}:`);
    console.log(`   Composite Z-Score: ${compositeZScore.toFixed(3)}`);
    console.log(`   Experience Modifier: ${experienceModifier.toFixed(3)}`);
    console.log(`   Adjusted Z-Score: ${adjustedCompositeZScore.toFixed(3)}`);
    console.log(`   Final Percentile: ${finalPercentile.toFixed(2)}`);
    console.log(`───────────────────────────────────────────────────────────────────────`);
  }
  
  // Return percentile (0-100)
  return finalPercentile;
};