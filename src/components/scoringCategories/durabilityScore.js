import { STABILITY_YEAR_WEIGHTS } from './constants.js';

// Linear Durability Score that complements existing logarithmic penalty system (0-100)
export const calculateDurabilityScore = (qbSeasonData, includePlayoffs = true, include2024Only = false, durabilityWeights = { availability: 75, consistency: 25 }) => {
  
  // In 2024-only mode, only process 2024 data with 100% weight
  const yearWeights = include2024Only ? { '2024': 1.0 } : STABILITY_YEAR_WEIGHTS;
  
  // Calculate total weighted games played
  let totalWeightedGames = 0;
  let totalWeightSum = 0;
  let validSeasons = 0;
  
  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = yearWeights[year] || 0;
    if (weight === 0) return;
    
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
    
    // Count valid seasons for consistency scoring
    if (gamesStarted >= 4) { // Must have meaningful participation
      validSeasons++;
    }
    
    totalWeightedGames += totalGames * weight;
    totalWeightSum += weight;
  });
  
  if (totalWeightSum === 0) return 0;
  
  // LINEAR AVAILABILITY SCORING
  // Mode-specific thresholds that align with logarithmic penalty thresholds
  let maxGames, minThreshold, availabilityScore;
  
  if (include2024Only) {
    // 2024-only mode: Per-season linear scale from 9-17 games
    const avgGamesPerSeason = totalWeightedGames / totalWeightSum;
    maxGames = 17; // Perfect attendance (17 regular season games)
    minThreshold = 9; // Matches logarithmic penalty threshold
    
    if (avgGamesPerSeason >= maxGames) {
      availabilityScore = 100;
    } else if (avgGamesPerSeason <= minThreshold) {
      availabilityScore = 0; // Logarithmic penalty will handle further reduction
    } else {
      // Linear scale from 9 games (0 points) to 17 games (100 points)
      availabilityScore = ((avgGamesPerSeason - minThreshold) / (maxGames - minThreshold)) * 100;
    }
  } else {
    // 3-year mode: Total games across all years
    maxGames = 51; // 17 games × 3 years (perfect attendance)
    minThreshold = 15; // Matches logarithmic penalty threshold for 3-year mode
    
    if (totalWeightedGames >= maxGames) {
      availabilityScore = 100;
    } else if (totalWeightedGames <= minThreshold) {
      availabilityScore = 0; // Logarithmic penalty will handle further reduction
    } else {
      // Linear scale from 15 total games (0 points) to 51 total games (100 points)
      availabilityScore = ((totalWeightedGames - minThreshold) / (maxGames - minThreshold)) * 100;
    }
  }
  
  // CONSISTENCY SCORING - Simplified to complement availability
  // Rewards consistent performance across multiple seasons (3-year mode only)
  let consistencyScore = 50; // Default for 2024-only mode
  
  if (!include2024Only) {
    // Multi-year consistency bonus based on number of seasons with meaningful participation
    if (validSeasons >= 3) {
      consistencyScore = 85; // High consistency across all 3 years
    } else if (validSeasons >= 2) {
      consistencyScore = 70; // Good consistency across 2 years
    } else {
      consistencyScore = 35; // Limited consistency data
    }
  }
  
  // Apply durability sub-component weights
  const availabilityNormalized = Math.max(0, Math.min(100, availabilityScore));
  const consistencyNormalized = Math.max(0, Math.min(100, consistencyScore));

  // Calculate weighted average of normalized scores using sub-component weights
  const totalDurabilitySubWeights = durabilityWeights.availability + durabilityWeights.consistency;
  
  let finalScore = 0;
  if (totalDurabilitySubWeights > 0) {
    finalScore = ((availabilityNormalized * durabilityWeights.availability) +
                  (consistencyNormalized * durabilityWeights.consistency)) / totalDurabilitySubWeights;
  }

  return finalScore;
}; 