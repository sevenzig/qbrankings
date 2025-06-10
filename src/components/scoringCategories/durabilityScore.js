import { STABILITY_YEAR_WEIGHTS } from './constants.js';

// Enhanced Durability Score with comprehensive availability tracking (0-100)
export const calculateDurabilityScore = (qbSeasonData, includePlayoffs = true) => {
  let weightedAvailability = 0;
  let fullSeasonCount = 0;
  let nearFullSeasonCount = 0;
  let totalSeasonsPlayed = 0;
  let totalWeight = 0;
  
  // Debug logging for playoff inclusion
  const debugMode = !includePlayoffs;
  const playerName = qbSeasonData.years && Object.values(qbSeasonData.years)[0]?.Player;
  
  if (debugMode && playerName) {
    console.log(`⚡ DURABILITY DEBUG - ${playerName} (Playoffs ${includePlayoffs ? 'INCLUDED' : 'EXCLUDED'})`);
  }

  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = STABILITY_YEAR_WEIGHTS[year] || 0;
    if (weight === 0) return;
    
    const gamesStarted = parseInt(data.GS) || 0;
    let totalGames = gamesStarted;
    let possibleGames = 17; // Regular season games
    
    // Add playoff games if available and playoffs are included
    if (data.playoffData && includePlayoffs) {
      const playoff = data.playoffData;
      const playoffGamesStarted = parseInt(playoff.gamesStarted) || 0;
      totalGames += playoffGamesStarted;
      
      // Teams that make playoffs can potentially play up to 4 additional games
      const maxPlayoffGames = 4;
      possibleGames += maxPlayoffGames;
      
      if (debugMode && playerName) {
        console.log(`⚡ ${year}: Added ${playoffGamesStarted} playoff games (total: ${totalGames}/${possibleGames})`);
      }
    } else if (data.playoffData && debugMode && playerName) {
      console.log(`⚡ ${year}: Playoff games IGNORED - would have added ${data.playoffData.gamesStarted || 0} games`);
    }
    
    const availability = Math.min(1, totalGames / possibleGames);
    
    if (debugMode && playerName) {
      console.log(`⚡ ${year}: ${totalGames}/${possibleGames} games = ${(availability * 100).toFixed(1)}% availability`);
    }
    
    // Count season types for consistency bonuses
    if (totalGames >= 16) {
      fullSeasonCount += weight;
    } else if (totalGames >= 14) {
      nearFullSeasonCount += weight;
    }
    
    totalSeasonsPlayed += weight;
    weightedAvailability += availability * weight;
    totalWeight += weight;
  });

  if (totalWeight === 0) return 0;

  // Normalize weighted values
  weightedAvailability = weightedAvailability / totalWeight;
  fullSeasonCount = fullSeasonCount / totalWeight;
  nearFullSeasonCount = nearFullSeasonCount / totalWeight;
  totalSeasonsPlayed = totalSeasonsPlayed / totalWeight;

  if (debugMode && playerName) {
    console.log(`⚡ FINAL DURABILITY METRICS:`);
    console.log(`⚡   Weighted availability: ${(weightedAvailability * 100).toFixed(1)}%`);
    console.log(`⚡   Full seasons: ${fullSeasonCount.toFixed(1)}`);
    console.log(`⚡   Near-full seasons: ${nearFullSeasonCount.toFixed(1)}`);
    console.log(`⚡ ----------------------------------------`);
  }

  // Core availability score (0-80 points)
  const availabilityScore = weightedAvailability * 80;

  // Consistency bonuses (0-20 points total)
  const fullSeasonBonus = Math.min(10, fullSeasonCount * 5); // Up to 10 points for full seasons
  const nearFullSeasonBonus = Math.min(5, nearFullSeasonCount * 2.5); // Up to 5 points for near-full seasons
  
  // Multi-year consistency bonus (0-5 points)
  const multiYearBonus = totalSeasonsPlayed >= 3 ? 5 : 0;

  const consistencyScore = fullSeasonBonus + nearFullSeasonBonus + multiYearBonus;
  const finalScore = availabilityScore + consistencyScore;

  // Debug for durability leaders or concerning cases
  if (availabilityScore >= 80 || availabilityScore < 40) {
    console.log(`⚡ DURABILITY: ${playerName}: ${(weightedAvailability * 100).toFixed(1)}% availability → ${finalScore.toFixed(1)}/100 points`);
    console.log(`⚡   Breakdown: Availability(${availabilityScore.toFixed(1)}) + Consistency(${consistencyScore.toFixed(1)}) = ${finalScore.toFixed(1)}`);
  }

  return finalScore;
}; 