import { STABILITY_YEAR_WEIGHTS } from './constants.js';

/**
 * Linear-scaled Durability Score (0-100)
 * Uses absolute benchmarks rather than z-scores
 * - Availability: 17 starts per season = 100, scales linearly down
 * - Consistency: Number of valid seasons with 8+ starts
 */
export const calculateDurabilityScore = (qbSeasonData, includePlayoffs = true, include2024Only = false, durabilityWeights = { availability: 75, consistency: 25 }, allQBData = []) => {
  
  // In 2024-only mode, only process 2024 data with 100% weight
  const yearWeights = include2024Only ? { '2024': 1.0 } : STABILITY_YEAR_WEIGHTS;
  
  // AVAILABILITY SCORING: Linear scale based on games started
  // Target: 17 regular season games (18 including playoffs for deep runs)
  const MAX_GAMES_PER_SEASON = includePlayoffs ? 18 : 17; // Allow for 1 playoff game credit
  
  let totalWeightedGames = 0;
  let totalWeightSum = 0;
  let validSeasons = 0;
  let totalPossibleSeasons = 0;
  
  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = yearWeights[year] || 0;
    if (weight === 0) return;
    
    totalPossibleSeasons++;
    
    const gamesStarted = parseInt(data.GS) || 0;
    let totalGames = gamesStarted;
    
    // Add playoff games if available and playoffs are included
    if (data.playoffData && includePlayoffs) {
      const playoffGamesStarted = parseInt(data.playoffData.gamesStarted) || 0;
      totalGames += playoffGamesStarted;
      
      // In 2024-only mode, give extra credit for deep playoff runs
      if (include2024Only && year === '2024') {
        const playoffWins = parseInt(data.playoffData.wins) || 0;
        // Conference Championship teams get moderate boost  
        if (playoffWins >= 2) {
          totalGames += 1; // Bonus equivalent to 1 extra game for CCG+ teams
        }
      }
    }
    
    // Count valid seasons for consistency scoring (8+ starts = meaningful contribution)
    if (gamesStarted >= 8) {
      validSeasons++;
    }
    
    totalWeightedGames += totalGames * weight;
    totalWeightSum += weight;
  });
  
  if (totalWeightSum === 0) return 0;
  
  // Calculate average games per season
  const avgGamesPerSeason = totalWeightedGames / totalWeightSum;
  
  // AVAILABILITY SCORE: Linear scale (0-100)
  // 17+ games = 100, 0 games = 0, linear in between
  const availabilityScore = Math.min(100, (avgGamesPerSeason / MAX_GAMES_PER_SEASON) * 100);
  
  // CONSISTENCY SCORE: Percentage of available seasons where QB was healthy starter
  // In 2024-only mode: 1 season possible, so it's binary (100 if valid, 0 if not)
  // In multi-year mode: percentage of seasons with 8+ starts
  let consistencyScore = 0;
  if (totalPossibleSeasons > 0) {
    consistencyScore = (validSeasons / totalPossibleSeasons) * 100;
  }
  
  // In single-season mode (2024-only), consistency doesn't apply
  // Only use availability score
  const normalizedWeights = normalizeWeights(durabilityWeights);
  let compositeDurabilityScore;
  
  if (include2024Only) {
    // Single season mode: ignore consistency component entirely
    compositeDurabilityScore = availabilityScore;
  } else {
    // Multi-year mode: apply both components
    compositeDurabilityScore = 
      (availabilityScore * normalizedWeights.availability) + 
      (consistencyScore * normalizedWeights.consistency);
  }
  
  // Return raw 0-100 score (NOT converted to z-score or percentile)
  // This gives absolute scoring: 17 games = 100 score, regardless of population
  return compositeDurabilityScore;
};

// Helper function to normalize weights
const normalizeWeights = (weights) => {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  if (total === 0) return weights;
  const normalized = {};
  Object.keys(weights).forEach(key => {
    normalized[key] = weights[key] / total;
  });
  return normalized;
}; 