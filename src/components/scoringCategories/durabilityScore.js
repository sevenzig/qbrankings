import { YEAR_WEIGHTS } from './constants.js';

// True Durability Score - Pure availability metrics (0-100)
export const calculateDurabilityScore = (qbSeasonData) => {
  let totalGamesPlayed = 0;
  let totalPossibleGames = 0;
  let weightedAvailability = 0;
  let totalWeight = 0;
  let consistencyBonus = 0;
  
  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = YEAR_WEIGHTS[year] || 0;
    if (weight === 0) return;
    
    // Games started this season (0-17)
    const gamesStarted = data.GS || 0;
    const possibleGames = 17; // NFL season length
    
    // Season availability percentage (0-1 scale)
    const seasonAvailability = Math.min(1, gamesStarted / possibleGames);
    
    // Accumulate totals for overall durability
    totalGamesPlayed += gamesStarted;
    totalPossibleGames += possibleGames;
    
    // Weight this season's availability
    weightedAvailability += seasonAvailability * weight;
    totalWeight += weight;
    
    // Consistency bonus for playing full/near-full seasons
    if (gamesStarted >= 16) {
      consistencyBonus += weight * 10; // 10 point bonus for full availability
    } else if (gamesStarted >= 14) {
      consistencyBonus += weight * 5;  // 5 point bonus for near-full availability
    }
  });
  
  if (totalWeight === 0) return 0;
  
  // Calculate weighted availability (0-1 scale)
  const avgAvailability = weightedAvailability / totalWeight;
  
  // Overall 3-year availability vs 51 total possible games
  const overallAvailability = Math.min(1, totalGamesPlayed / 51);
  
  // Availability score - heavily weighted (0-80 points)
  const availabilityScore = avgAvailability * 80;
  
  // Multi-year consistency bonus (0-20 points)
  const yearsActive = Object.keys(qbSeasonData.years || {}).length;
  const consistencyScore = Math.min(20, consistencyBonus + (yearsActive >= 3 ? 5 : 0));
  
  return Math.min(100, availabilityScore + consistencyScore);
}; 