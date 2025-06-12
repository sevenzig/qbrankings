import {
  calculateTeamScore,
  calculateStatsScore,
  calculateClutchScore,
  calculateDurabilityScore,
  calculateSupportScore
} from '../components/scoringCategories/index.js';

export const calculateQEI = (
  qbData,
  weights,
  includePlayoffs,
  include2024Only
) => {
  const {
    team,
    stats,
    intangibles, // New top-level weight for the combined score
    support,
    durabilityAdjustment, // Keep adjustments separate
    longevityAdjustment,
  } = weights;

  // Calculate the support score first, as it may influence other scores
  const supportScore = calculateSupportScore(qbData, includePlayoffs, include2024Only);

  // Dynamically adjust weights based on support score
  // If support is poor (low score), put more weight on individual stats.
  // If support is great (high score), team performance and intangibles are more reflective.
  const supportFactor = (100 - supportScore) / 100; // Factor from 0 (great support) to 1 (poor support)
  const dynamicStatsWeight = stats + (10 * supportFactor); // Boost stats weight if support is poor
  const dynamicTeamWeight = team - (10 * supportFactor); // Reduce team weight if support is poor

  // Calculate individual scoring components
  const teamScore = calculateTeamScore(qbData, includePlayoffs, include2024Only, supportScore); // Pass supportScore to teamScore
  const statsScore = calculateStatsScore(qbData, includePlayoffs, include2024Only);
  const intangiblesScore = calculateIntangiblesScore(qbData, includePlayoffs, include2024Only); // Use the new intangibles score

  // Normalize the dynamic weights to ensure they sum to the original total
  const baseTotal = stats + team + intangibles + support;
  const dynamicTotal = dynamicStatsWeight + dynamicTeamWeight + intangibles + support;
  const normalizationFactor = baseTotal / dynamicTotal;

  const normalizedStatsWeight = dynamicStatsWeight * normalizationFactor;
  const normalizedTeamWeight = dynamicTeamWeight * normalizationFactor;
  const normalizedIntangiblesWeight = intangibles * normalizationFactor;
  const normalizedSupportWeight = support * normalizationFactor;

  // Calculate the weighted sum of the scores
  const weightedScore =
    teamScore * normalizedTeamWeight +
    statsScore * normalizedStatsWeight +
    intangiblesScore * normalizedIntangiblesWeight +
    supportScore * normalizedSupportWeight;

  const totalWeight = normalizedTeamWeight + normalizedStatsWeight + normalizedIntangiblesWeight + normalizedSupportWeight;

  if (totalWeight === 0) return 0;

  // Calculate the base QEI score
  let qeiScore = weightedScore / totalWeight;

  // Apply adjustments for limited playing time and durability
  const gamesPlayed = qbData.seasons.reduce((acc, season) => acc + season.gamesPlayed, 0);
  const avgGamesPlayed = gamesPlayed / qbData.seasons.length;

  if (avgGamesPlayed < durabilityAdjustment.minGames) {
    const adjustmentFactor =
      (durabilityAdjustment.minGames - avgGamesPlayed) * durabilityAdjustment.penalty;
    qeiScore *= (1 - adjustmentFactor);
  }

  // Apply longevity bonus/penalty
  const yearsExperience = qbData.seasons.length;
  if (yearsExperience <= longevityAdjustment.shortCareerThreshold) {
    qeiScore *= longevityAdjustment.shortCareerFactor;
  } else if (yearsExperience >= longevityAdjustment.longCareerThreshold) {
    qeiScore *= longevityAdjustment.longCareerFactor;
  }

  return Math.max(0, Math.min(100, qeiScore));
}; 