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

// Hierarchical weight calculation system
const calculateHierarchicalScore = (componentScores, weights) => {
  const normalizedWeights = normalizeWeights(weights);
  let weightedSum = 0;
  
  Object.keys(componentScores).forEach(key => {
    if (normalizedWeights[key] !== undefined) {
      const score = componentScores[key] || 0;
      const weight = normalizedWeights[key] || 0;
      
      // Ensure both score and weight are valid numbers
      if (!isNaN(score) && isFinite(score) && !isNaN(weight) && isFinite(weight)) {
        weightedSum += score * weight;
      }
    }
  });
  
  // Ensure the result is a valid number
  if (isNaN(weightedSum) || !isFinite(weightedSum)) {
    return 0;
  }
  
  return weightedSum;
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
  const supportScore = calculateSupportScore(qbSeasonData, supportWeights, include2024Only, mainSupportWeight);
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
  
  // Enhanced support-based contextual reweighting using comprehensive support data
  // This normalizes QB performance relative to others in similar support situations
  const supportQuality = baseScores.support || 50;
  const supportWeight = weights.support || 0;
  
  // Debug support weight extraction - FORCE DEBUG FOR KEY QBs
  const qbName = qb?.name || 'Unknown QB';
  const isKeyQB = qbName.includes('Hurts') || qbName.includes('Burrow') || qbName.includes('Jackson') || qbName.includes('Allen');
  
  if (isKeyQB || supportWeight > 0) {
    console.log(`🔍 QEI CALCULATION ${qbName}: supportWeight=${supportWeight}, supportQuality=${supportQuality.toFixed(1)}, baseScores:`, baseScores);
  }
  
  let contextualScores = {
    team: baseScores.team || 0,
    stats: baseScores.stats || 0,
    clutch: baseScores.clutch || 0,
    durability: baseScores.durability || 0,
    support: supportQuality
  };
  
  // CORE FIX: Support should work as a PENALTY/REWARD system, not additive
  // When support weight increases, good support should HURT QEI, poor support should HELP QEI
  if (supportWeight > 0) {
    // Calculate the support adjustment as a modifier to other scores, not an additive component
    const supportAdjustmentFactor = calculateSupportAdjustmentFactor(supportQuality, supportWeight);
    
    // Apply the support adjustment to team and stats scores (most affected by support context)
    contextualScores.team = (baseScores.team || 0) * supportAdjustmentFactor;
    contextualScores.stats = (baseScores.stats || 0) * supportAdjustmentFactor;
    
    // Apply lighter adjustment to clutch and durability  
    const lighterAdjustment = 1 + (supportAdjustmentFactor - 1) * 0.3;
    contextualScores.clutch = (baseScores.clutch || 0) * lighterAdjustment;
    contextualScores.durability = (baseScores.durability || 0) * lighterAdjustment;
    
    // Set support score to 0 so it doesn't add to the final score - it's now a modifier, not additive
    contextualScores.support = 0;
    
    if (isKeyQB) {
      console.log(`🔧 SUPPORT AS MODIFIER ${qbName}: Factor(${supportAdjustmentFactor.toFixed(3)}) applied to other scores`);
      console.log(`   Team: ${(baseScores.team || 0).toFixed(1)} → ${contextualScores.team.toFixed(1)}`);
      console.log(`   Stats: ${(baseScores.stats || 0).toFixed(1)} → ${contextualScores.stats.toFixed(1)}`);
    }
  }
  
  // REMOVED: Support adjustment logic now handled in calculateSupportScore function
  // The support score now comes pre-adjusted based on the main support weight
  // No additional adjustment needed here since inversion is applied at score calculation

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
  // Handle both simple weight objects and philosophy preset objects
  const topLevelWeights = {
    team: weights.team || 0,
    stats: weights.stats || 0,
    clutch: weights.clutch || 0,
    durability: weights.durability || 0,
    support: weights.support || 0
  };
  
  // If support weight > 0, redistribute that weight to other categories since support is now a modifier
  if (supportWeight > 0) {
    const totalOtherWeights = topLevelWeights.team + topLevelWeights.stats + topLevelWeights.clutch + topLevelWeights.durability;
    if (totalOtherWeights > 0) {
      // Redistribute support weight proportionally to other categories
      const redistributionFactor = (totalOtherWeights + supportWeight) / totalOtherWeights;
      topLevelWeights.team *= redistributionFactor;
      topLevelWeights.stats *= redistributionFactor;
      topLevelWeights.clutch *= redistributionFactor;
      topLevelWeights.durability *= redistributionFactor;
    }
    topLevelWeights.support = 0; // Support doesn't get direct weight since it's a modifier
    
    if (isKeyQB) {
      console.log(`📊 WEIGHT REDISTRIBUTION ${qbName}: Support weight(${supportWeight}) redistributed to other categories`);
      console.log(`   Adjusted weights: Team(${topLevelWeights.team.toFixed(1)}) Stats(${topLevelWeights.stats.toFixed(1)}) Clutch(${topLevelWeights.clutch.toFixed(1)}) Durability(${topLevelWeights.durability.toFixed(1)})`);
    }
  }

  // Calculate weighted composite score using user's current weights (true hierarchical)
  const compositeScore = calculateHierarchicalScore(contextualScores, topLevelWeights);
  
  // DEBUG: Show the hierarchical score calculation for key QBs
  if (isKeyQB || supportWeight > 0) {
    console.log(`🧮 HIERARCHICAL CALC ${qbName}:`);
    console.log(`   Scores: Team(${contextualScores.team.toFixed(1)}) Stats(${contextualScores.stats.toFixed(1)}) Clutch(${contextualScores.clutch.toFixed(1)}) Durability(${contextualScores.durability.toFixed(1)}) Support(${contextualScores.support.toFixed(1)})`);
    console.log(`   Weights: Team(${topLevelWeights.team}) Stats(${topLevelWeights.stats}) Clutch(${topLevelWeights.clutch}) Durability(${topLevelWeights.durability}) Support(${topLevelWeights.support})`);
    console.log(`   Composite Score: ${compositeScore.toFixed(3)}`);
    
    // Show individual contributions
    const teamContrib = contextualScores.team * topLevelWeights.team;
    const statsContrib = contextualScores.stats * topLevelWeights.stats;
    const clutchContrib = contextualScores.clutch * topLevelWeights.clutch;
    const durabilityContrib = contextualScores.durability * topLevelWeights.durability;
    const supportContrib = contextualScores.support * topLevelWeights.support;
    const totalWeight = Object.values(topLevelWeights).reduce((sum, w) => sum + w, 0);
    
    console.log(`   Contributions: Team(${teamContrib.toFixed(2)}) Stats(${statsContrib.toFixed(2)}) Clutch(${clutchContrib.toFixed(2)}) Durability(${durabilityContrib.toFixed(2)}) Support(${supportContrib.toFixed(2)})`);
    console.log(`   Total Weight: ${totalWeight}, Weighted Sum: ${(teamContrib + statsContrib + clutchContrib + durabilityContrib + supportContrib).toFixed(3)}`);
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
  
  // Calculate final QEI score
  let finalScore = compositeScore * experienceModifier;
  
  // Ensure minimum score of 0 and handle NaN/Infinity
  if (isNaN(finalScore) || !isFinite(finalScore)) {
    finalScore = 0;
  }
  
  // DEBUG: Show final score calculation for key QBs
  if (isKeyQB || supportWeight > 0) {
    console.log(`🏆 FINAL QEI ${qbName}: Composite(${compositeScore.toFixed(3)}) × Experience(${experienceModifier.toFixed(3)}) = Final(${finalScore.toFixed(3)})`);
    console.log(`───────────────────────────────────────────────────────────────────────`);
  }
  
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