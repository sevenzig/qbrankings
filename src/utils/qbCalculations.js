// QB calculation utility functions
import {
  calculateTeamScore,
  calculateStatsScore,
  calculateClutchScore,
  calculateDurabilityScore,
  calculateSupportScore
} from '../components/scoringCategories/index.js';
import { zScoreToPercentile, calculateVariance } from './zScoreCalculations.js';

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

// Helper: Validate player data for a specific year to prevent flat 50 scores
const validatePlayerDataForYear = (qb, year) => {
  const hasSeasonData = qb.seasonData?.some(season => season.year === year);
  if (!hasSeasonData) {
    console.warn(`⚠️ ${qb.name} has no ${year} season data`);
    return false;
  }
  
  const seasonData = qb.seasonData.find(season => season.year === year);
  if (!seasonData) {
    console.warn(`⚠️ ${qb.name} ${year} season data is null/undefined`);
    return false;
  }
  
  const hasValidStats = seasonData && (
    (seasonData.attempts > 0) || 
    (seasonData.gamesStarted > 0) ||
    (seasonData.passingYards > 0)
  );
  
  if (!hasValidStats) {
    console.warn(`⚠️ ${qb.name} has invalid ${year} stats:`, {
      attempts: seasonData.attempts,
      gamesStarted: seasonData.gamesStarted,
      passingYards: seasonData.passingYards
    });
    return false;
  }
  
  return true;
};

// Helper: Calculate percentile rank of a score within an array
const calculatePercentileRank = (score, sortedArray) => {
  if (sortedArray.length === 0) return 0; // Return 0 instead of 50 for empty arrays
  
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

export const calculateQBMetrics = (qb, supportWeights = { offensiveLine: 55, weapons: 30, defense: 15 }, statsWeights = { efficiency: 45, protection: 25, volume: 30 }, teamWeights = { regularSeason: 100, playoff: 0 }, clutchWeights = { gameWinningDrives: 40, fourthQuarterComebacks: 25, clutchRate: 15, playoffBonus: 20 }, includePlayoffs = false, filterYear = null, efficiencyWeights = { anyA: 45, tdPct: 30, completionPct: 25 }, protectionWeights = { sackPct: 60, turnoverRate: 40 }, volumeWeights = { passYards: 25, passTDs: 25, rushYards: 20, rushTDs: 15, totalAttempts: 15 }, durabilityWeights = { availability: 75, consistency: 25 }, allQBData = [], mainSupportWeight = 0, teamSeasonRecordsBySeason = null) => {
  // Create season data structure for enhanced calculations
  const qbSeasonData = {
    years: {}
  };
  
  // Convert season data to expected format (including playoff data)
  // Filter season data for specific year if provided
  let seasonsToProcess = qb.seasonData || [];
  if (filterYear && typeof filterYear === 'number') {
    seasonsToProcess = seasonsToProcess.filter(season => season.year === filterYear);
  }
  
  if (seasonsToProcess.length > 0) {
    seasonsToProcess.forEach(season => {
      qbSeasonData.years[season.year] = {
        // Regular season data
        G: season.games || season.gamesStarted,
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
        RushingAtt: season.rushingAttempts || 0,
        Fumbles: season.fumbles || 0,
        FumblesLost: season.fumblesLost || 0,
        
        // Add playoff data if available AND if playoffs are included globally
        playoffData: (season.playoffData && includePlayoffs) ? season.playoffData : null
      };
    });
  }

  // Add current team and player name to season data for contextual calculations
  qbSeasonData.currentTeam = qb.team;
  qbSeasonData.name = qb.name;

  // Calculate scores using hierarchical weight system with z-score based calculations
  // Pass filterYear directly to all scoring functions
  const supportScore = calculateSupportScore(qbSeasonData, supportWeights, filterYear, mainSupportWeight);
  const teamScore = calculateTeamScore(qbSeasonData, teamWeights, includePlayoffs, filterYear, supportScore, allQBData, teamSeasonRecordsBySeason);
  const statsScore = calculateStatsScore(qbSeasonData, statsWeights, includePlayoffs, filterYear, efficiencyWeights, protectionWeights, volumeWeights, allQBData);
  const clutchScore = calculateClutchScore(qbSeasonData, includePlayoffs, clutchWeights, filterYear, allQBData);
  const durabilityScore = calculateDurabilityScore(qbSeasonData, includePlayoffs, filterYear, durabilityWeights, allQBData);
  
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
    2025: 1.0,
    2024: 1.0,
    2023: 1.0,
    2022: 1.0
  };

  // Get game starts by season
  const gameStarts = {
    2025: 0,
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
    // Single-year mode: Only penalize for insufficient starts in the active year
    // For 2025 (partial season): Very low threshold (1 game minimum)
    // For other years: 8 games minimum
    penalties[2025] = gameStarts[2025] >= 1 ? 1.0 : 0; // Binary for 2025: played = 1.0, didn't = 0
    penalties[2024] = gameStarts[2024] >= 8 ? 1.0 : slidingLogPenalty(gameStarts[2024], 8, 1.2);
    penalties[2023] = gameStarts[2023] >= 8 ? 1.0 : slidingLogPenalty(gameStarts[2023], 8, 1.15);
    penalties[2022] = gameStarts[2022] >= 8 ? 1.0 : slidingLogPenalty(gameStarts[2022], 8, 1.15);
  } else {
    // Multi-year mode: Apply penalties to each season individually
    
    // 2025: 1+ game = normal (partial season)
    if (gameStarts[2025] > 0) {
      penalties[2025] = 1.0; // No penalty for 2025 partial season
    } else {
      penalties[2025] = 0; // No games = no contribution from this season
    }
    
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

/**
 * Calculate raw z-scores and variance normalization factors for all QBs
 * This is Pass 1 of the two-pass variance normalization system
 * 
 * The two-pass system ensures that user-defined category weights (Team, Stats, etc.)
 * contribute exactly their specified percentage to final scores, regardless of
 * the natural variance of each category.
 * 
 * Pass 1 (this function): Calculate raw z-scores for all QBs and measure variance
 * Pass 2 (in data hook): Normalize z-scores and calculate final QEI
 * 
 * @param {Array} allQBData - Array of all QB objects with season data
 * @param {boolean} includePlayoffs - Whether to include playoff data
 * @param {number|null} filterYear - Specific year to filter, or null for all years
 * @param {Object} supportWeights - Weights for support category components
 * @param {Object} statsWeights - Weights for stats category components
 * @param {Object} teamWeights - Weights for team category components
 * @param {Object} clutchWeights - Weights for clutch category components
 * @param {Object} efficiencyWeights - Weights for efficiency sub-components
 * @param {Object} protectionWeights - Weights for protection sub-components
 * @param {Object} volumeWeights - Weights for volume sub-components
 * @param {Object} durabilityWeights - Weights for durability components
 * @param {number} mainSupportWeight - Main support weight from top-level
 * @returns {Object} { qbRawScores: Map, categoryVariances: Object }
 */
export const calculatePopulationScoresAndVariances = (
  allQBData,
  includePlayoffs,
  filterYear,
  supportWeights,
  statsWeights,
  teamWeights,
  clutchWeights,
  efficiencyWeights,
  protectionWeights,
  volumeWeights,
  durabilityWeights,
  mainSupportWeight
) => {
  // Map to store raw z-scores for each QB (keyed by QB name)
  const qbRawScores = new Map();
  
  // Arrays to collect z-scores by category for variance calculation
  const categoryZScores = {
    team: [],
    stats: [],
    clutch: [],
    durability: [],
    support: []
  };
  
  // Calculate raw z-scores for all QBs
  allQBData.forEach(qb => {
    const rawScores = calculateQBMetrics(
      qb,
      supportWeights,
      statsWeights,
      teamWeights,
      clutchWeights,
      includePlayoffs,
      filterYear,
      efficiencyWeights,
      protectionWeights,
      volumeWeights,
      durabilityWeights,
      allQBData,
      mainSupportWeight
    );
    
    // Store raw scores for this QB
    qbRawScores.set(qb.name, rawScores);
    
    // Collect z-scores for variance calculation
    Object.keys(rawScores).forEach(category => {
      const score = rawScores[category];
      if (isFinite(score) && !isNaN(score)) {
        categoryZScores[category].push(score);
      }
    });
  });
  
  // Calculate variance for each category
  const categoryVariances = {};
  Object.keys(categoryZScores).forEach(category => {
    categoryVariances[category] = calculateVariance(categoryZScores[category]);
  });
  
  // Log variance information for debugging
  console.log('📊 Category Z-Score Variances (Pre-Normalization):', {
    team: categoryVariances.team?.toFixed(4),
    stats: categoryVariances.stats?.toFixed(4),
    clutch: categoryVariances.clutch?.toFixed(4),
    durability: categoryVariances.durability?.toFixed(4),
    support: categoryVariances.support?.toFixed(4)
  });
  
  // Log scaling factors that will be applied
  console.log('📐 Variance Normalization Scaling Factors:', {
    team: (Math.sqrt(1.0 / categoryVariances.team)).toFixed(4),
    stats: (Math.sqrt(1.0 / categoryVariances.stats)).toFixed(4),
    clutch: (Math.sqrt(1.0 / categoryVariances.clutch)).toFixed(4),
    durability: (Math.sqrt(1.0 / categoryVariances.durability)).toFixed(4),
    support: (Math.sqrt(1.0 / categoryVariances.support)).toFixed(4)
  });
  
  return { qbRawScores, categoryVariances };
};

// Main QEI calculation with variance-normalized scores
export const calculateQEI = (baseScores, qb, weights, includePlayoffs = true, allQBBaseScores = [], filterYear = null, allQBsRawQei = null, isNormalized = false) => {
  // Apply season-specific game start penalties
  const isSingleYear = filterYear !== null && typeof filterYear === 'number';
  const penalties = applyGameStartPenalties(qb, isSingleYear);
  
  // baseScores now contain composite z-scores from each category
  // We need to flatten the hierarchy to preserve variance
  const qbName = qb?.name || 'Unknown QB';
  const isKeyQB = qbName.includes('Hurts') || qbName.includes('Burrow') || qbName.includes('Jackson') || qbName.includes('Allen');
  
  if (isKeyQB) {
    const scoreType = isNormalized ? 'VARIANCE-NORMALIZED' : 'RAW';
    console.log(`🔍 QEI ${scoreType} Z-SCORE CALCULATION ${qbName}: baseScores (composite z-scores):`, {
      team: baseScores.team?.toFixed(3),
      stats: baseScores.stats?.toFixed(3),
      clutch: baseScores.clutch?.toFixed(3),
      durability: baseScores.durability?.toFixed(3),
      support: baseScores.support?.toFixed(3)
    });
    if (isNormalized) {
      console.log(`✅ Using VARIANCE-NORMALIZED z-scores for ${qbName} - all categories have equal variance`);
    }
  }
  
  // INVERT support z-score: Higher support (good cast) becomes negative contribution
  // Lower support (bad cast) becomes positive contribution
  // This creates the penalty/reward system where good supporting casts hurt QB ranking
  const invertedSupportZScore = -(baseScores.support || 0);
  
  // DURABILITY CONVERSION: Durability now returns 0-100 score, not z-score
  // Convert to z-score for hierarchical calculation
  // 100 (full season) = +2.0 SD, 50 (half season) = 0.0 SD, 0 (no games) = -2.0 SD
  // Handle missing durability data more gracefully - use 0 instead of defaulting to 50
  const durabilityScore = baseScores.durability;
  const durabilityZScore = (durabilityScore != null && !isNaN(durabilityScore)) 
    ? ((durabilityScore - 50) / 25)
    : 0; // Use 0 z-score for missing durability data instead of defaulting to 50
  
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
  if (!isSingleYear) {
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
    // In single-year mode, apply the year's penalty directly
    const yearPenalty = penalties[filterYear] || 1.0;
    Object.keys(contextualScores).forEach(component => {
      if (isNaN(contextualScores[component]) || !isFinite(contextualScores[component])) {
        contextualScores[component] = 0;
      }
      contextualScores[component] *= yearPenalty;
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
    const normalizationNote = isNormalized ? ' (VARIANCE-NORMALIZED)' : '';
    console.log(`🧮 HIERARCHICAL Z-SCORE CALC ${qbName}${normalizationNote}:`);
    console.log(`   Z-Scores: Team(${contextualScores.team.toFixed(3)}) Stats(${contextualScores.stats.toFixed(3)}) Clutch(${contextualScores.clutch.toFixed(3)}) Durability(${contextualScores.durability.toFixed(3)}) Support(${contextualScores.support.toFixed(3)})`);
    console.log(`   Weights: Team(${topLevelWeights.team}) Stats(${topLevelWeights.stats}) Clutch(${topLevelWeights.clutch}) Durability(${topLevelWeights.durability}) Support(${topLevelWeights.support})`);
    if (isNormalized && qb.categoryVariances) {
      console.log(`   Category Variances: Team(${qb.categoryVariances.team?.toFixed(4)}) Stats(${qb.categoryVariances.stats?.toFixed(4)}) Clutch(${qb.categoryVariances.clutch?.toFixed(4)}) Durability(${qb.categoryVariances.durability?.toFixed(4)}) Support(${qb.categoryVariances.support?.toFixed(4)})`);
    }
    console.log(`   Composite Z-Score: ${compositeZScore.toFixed(3)}`);
  }
  
  // Special validation and debug logging for specific year players to diagnose flat 50 scores
  if (filterYear === 2025 || filterYear === 2024) {
    // Validate player data for the filter year before calculation
    if (!validatePlayerDataForYear(qb, filterYear)) {
      console.error(`❌ ${qbName} failed ${filterYear} data validation - returning 0 QEI`);
      return 0;
    }
    
    console.log(`🔍 ${filterYear} QEI CALCULATION ${qbName}:`, {
      baseScores: {
        team: baseScores.team?.toFixed(3),
        stats: baseScores.stats?.toFixed(3),
        clutch: baseScores.clutch?.toFixed(3),
        durability: baseScores.durability?.toFixed(3),
        support: baseScores.support?.toFixed(3)
      },
      weights: topLevelWeights,
      durabilityScore: durabilityScore,
      durabilityZScore: durabilityZScore?.toFixed(3),
      contextualScores: {
        team: contextualScores.team?.toFixed(3),
        stats: contextualScores.stats?.toFixed(3),
        clutch: contextualScores.clutch?.toFixed(3),
        durability: contextualScores.durability?.toFixed(3),
        support: contextualScores.support?.toFixed(3)
      }
    });
  }
  
  // Apply experience penalty for rookies and near-rookies in single-year mode only
  const experience = qb?.experience || qb?.seasonData?.length || 1;
  let experienceModifier = 1.0;
  if (isSingleYear) {
    if (experience === 1) {
      experienceModifier = 0.85; // 15% penalty for rookies
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