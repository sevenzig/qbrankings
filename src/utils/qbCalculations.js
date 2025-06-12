// QB calculation utility functions
import {
  calculateTeamScore,
  calculateStatsScore,
  calculateClutchScore,
  calculateDurabilityScore,
  calculateSupportScore
} from '../components/scoringCategories/index.js';





export const calculateQBMetrics = (qb, supportWeights = { offensiveLine: 55, weapons: 30, defense: 15 }, statsWeights = { efficiency: 45, protection: 25, volume: 30 }, teamWeights = { regularSeason: 65, playoff: 35 }, clutchWeights = { gameWinningDrives: 40, fourthQuarterComebacks: 25, clutchRate: 15, playoffBonus: 20 }, includePlayoffs = true, include2024Only = false, efficiencyWeights = { anyA: 45, tdPct: 30, completionPct: 25 }, protectionWeights = { sackPct: 60, turnoverRate: 40 }, volumeWeights = { passYards: 25, passTDs: 25, rushYards: 20, rushTDs: 15, totalAttempts: 15 }, durabilityWeights = { availability: 75, consistency: 25 }) => {
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

  // Calculate Support Score FIRST (required for contextual adjustment inside team score)
  const supportScore = calculateSupportScore(qbSeasonData, supportWeights, include2024Only);

  // Calculate Team Score with correct parameter order and contextual support adjustment
  const teamScore = calculateTeamScore(qbSeasonData, teamWeights, includePlayoffs, include2024Only, supportScore);
  
  // Calculate Stats Score using season data
  const statsScore = calculateStatsScore(qbSeasonData, statsWeights, includePlayoffs, include2024Only, efficiencyWeights, protectionWeights, volumeWeights);
  
  // Calculate Clutch Score
  const clutchScore = calculateClutchScore(qbSeasonData, includePlayoffs, clutchWeights, include2024Only);
  
  // Calculate Durability Score
  const durabilityScore = calculateDurabilityScore(qbSeasonData, includePlayoffs, include2024Only, durabilityWeights);
  
  // NOTE: supportScore already calculated above, remove redundant computation block.
  
  return {
    team: teamScore,
    stats: statsScore,
    clutch: clutchScore,
    durability: durabilityScore,
    support: supportScore
  };
};

// Sliding penalty function (logarithmic)
function slidingLogPenalty(gamesStarted, threshold, maxPenalty = 0.4) {
  if (gamesStarted >= threshold) return 1.0;
  if (gamesStarted <= 0) return 1.0 - maxPenalty;
  const logX = Math.log(gamesStarted);
  const logT = Math.log(threshold);
  const penalty = maxPenalty * (1 - (logX / logT));
  return 1.0 - penalty;
}

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

// Main QEI calculation (single QB)
export const calculateQEI = (baseScores, qb, weights, includePlayoffs = true, allQBBaseScores = [], include2024Only = false, allQBsRawQei = null) => {
  // Calculate total weight for normalization
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  
  if (totalWeight === 0) return 0;

  // Apply sliding penalty for limited playing time
  let playTimePenalty = 1.0;
  if (include2024Only) {
    // 2024-only mode: penalize if <8 starts in 2024
    const season2024 = qb.seasonData?.find(season => season.year === 2024);
    const gamesStarted2024 = season2024?.gamesStarted || 0;
    playTimePenalty = slidingLogPenalty(gamesStarted2024, 8, 0.4);
  } else {
    // Multi-year mode: penalize if <8 starts in any of 2022, 2023, 2024
    const years = [2022, 2023, 2024];
    let penaltyProduct = 1.0;
    years.forEach(year => {
      const season = qb.seasonData?.find(season => season.year === year);
      const gamesStarted = season?.gamesStarted || 0;
      penaltyProduct *= slidingLogPenalty(gamesStarted, 8, 0.4);
    });
    playTimePenalty = penaltyProduct;
  }
  
  // Get support score for context adjustment - use FIXED weights to avoid slider interference
  const contextSupportScore = calculateSupportScore(qb.seasonData, { offensiveLine: 55, weapons: 30, defense: 15 }, include2024Only);
  
  // Calculate weighted sum of all components
  // Each component is already normalized to 0-100 scale
  // SUPPORT WORKS INVERSELY: Higher support quality = lower score (achievements less impressive)
  const weightedSum = (
    (baseScores.team * weights.team) +
    (baseScores.stats * weights.stats) +
    (baseScores.clutch * weights.clutch) +
    (baseScores.durability * weights.durability) +
    ((100 - baseScores.support) * weights.support)  // INVERTED: Good support = penalty, poor support = bonus
  );
  
  // Normalize by total weight to get base score
  let baseScore = weightedSum / totalWeight;
  
  // GENTLE support adjustment: Subtle context-aware scaling using FIXED support evaluation
  // Elite support gets small discount, poor support gets small boost
  const supportAdjustment = (50 - contextSupportScore) / 500; // Very gentle: ranges from -0.1 to +0.1 (10% max adjustment)
  const contextAdjustedScore = baseScore * (1 + supportAdjustment);
  
  // Apply experience penalty for rookies and near-rookies in 3-year mode
  const experience = qb?.experience || qb?.seasonData?.length || 1;
  let experienceModifier = 1.0;
  if (!include2024Only) {
    if (experience === 1) {
      experienceModifier = 0.85; // 15% penalty for 2024 rookies
    } else if (experience === 2) {
      experienceModifier = 0.97; // 3% penalty for second-year QBs
    }
  }
  
  // Apply experience modifier and play time penalty
  let finalScore = contextAdjustedScore * experienceModifier * playTimePenalty;
  
  // Only cap at 0 for minimum score
  finalScore = Math.max(0, finalScore);
  
  // Debug logging for significant adjustments
  if (Math.abs(supportAdjustment) > 0.02 && qb?.name) {
    const adjustmentPercent = (supportAdjustment * 100).toFixed(1);
    console.log(`🏟️ GENTLE CONTEXT ADJUSTMENT - ${qb.name}: ${adjustmentPercent}% (Context Support: ${contextSupportScore.toFixed(1)}, Base: ${baseScore.toFixed(1)} -> Final: ${finalScore.toFixed(1)})`);
  }
  
  if (playTimePenalty < 0.95 && qb?.name) {
    const penaltyPercent = ((1 - playTimePenalty) * 100).toFixed(1);
    console.log(`⚠️ PLAY TIME PENALTY - ${qb.name}: ${penaltyPercent}% reduction (Final QEI: ${finalScore.toFixed(1)})`);
  }
  
  // If allQBsRawQei is provided, do normalization
  if (Array.isArray(allQBsRawQei) && allQBsRawQei.length > 0) {
    // Insert this QB's raw score into the array at the correct index
    // (Assume the calling code will handle this for batch normalization)
    // Just return the raw score for now; normalization will be handled in batch
    return finalScore;
  }

  return finalScore;
};

// Batch QEI normalization utility
export function normalizeAllQeiScores(qbQeiList) {
  // qbQeiList: Array of { qb, rawQei, ... }
  const rawScores = qbQeiList.map(q => q.rawQei);
  const normalized = normalizeQeiScores(rawScores);
  return qbQeiList.map((q, i) => ({ ...q, normalizedQei: normalized[i] }));
}