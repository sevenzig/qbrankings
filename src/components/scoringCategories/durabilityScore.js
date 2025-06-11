import { STABILITY_YEAR_WEIGHTS } from './constants.js';

// Enhanced Durability Score with comprehensive availability tracking (0-100)
export const calculateDurabilityScore = (qbSeasonData, includePlayoffs = true, include2024Only = false) => {
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

  // In 2024-only mode, only process 2024 data with 100% weight
  const yearWeights = include2024Only ? { '2024': 1.0 } : STABILITY_YEAR_WEIGHTS;
  
  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = yearWeights[year] || 0;
    if (weight === 0) return;
    
    const gamesStarted = parseInt(data.GS) || 0;
    let totalGames = gamesStarted;
    let possibleGames = 17; // Regular season games
    
    // Add playoff games if available and playoffs are included
    if (data.playoffData && includePlayoffs) {
      const playoff = data.playoffData;
      const playoffGamesStarted = parseInt(playoff.gamesStarted) || 0;
      const playoffWins = parseInt(playoff.wins) || 0;
      totalGames += playoffGamesStarted;
      
      // In 2024-only mode, give extra credit for deep playoff runs
      if (include2024Only && year === '2024') {
        // Check known Super Bowl data for additional bonuses
        const knownSuperBowlWins = {
          'Philadelphia Eagles': [2024]
        };
        const knownSuperBowlAppearances = {
          'Kansas City Chiefs': [2024],
          'Philadelphia Eagles': [2024]
        };
        
        // Super Bowl WINNERS get MASSIVE durability boost
        if (knownSuperBowlWins[data.Team] && knownSuperBowlWins[data.Team].includes(parseInt(year))) {
          totalGames += 4; // BONUS equivalent to 4 extra games for SB WINNERS
        }
        // Super Bowl participants get big durability boost
        else if ((playoffWins >= 3 || (playoffWins >= 2 && playoffGamesStarted >= 3)) ||
                 (knownSuperBowlAppearances[data.Team] && knownSuperBowlAppearances[data.Team].includes(parseInt(year)))) {
          totalGames += 2; // Bonus equivalent to 2 extra games for SB teams
        }
        // Conference Championship teams get moderate boost  
        else if (playoffWins >= 2) {
          totalGames += 1; // Bonus equivalent to 1 extra game for CCG teams
        }
      }
      
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