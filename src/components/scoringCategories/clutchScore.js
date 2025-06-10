import { YEAR_WEIGHTS } from './constants.js';

// Helper function to calculate average clutch multiplier based on playoff progression
const calculatePlayoffClutchMultiplier = (playoffData, team, year) => {
  const wins = playoffData.wins || 0;
  const losses = playoffData.losses || 0;
  const totalGames = wins + losses;
  
  if (totalGames === 0) return 1.06; // Default multiplier (further reduced by 70% from 1.2)
  
  const CLUTCH_MULTIPLIERS = {
    WILD_CARD: 1.06, DIVISIONAL: 1.08, // Further reduced by 70% from 1.2/1.4
    CONF_CHAMPIONSHIP: 1.12, SUPER_BOWL: 1.22 // Further reduced by 70% from 1.8/2.4
  };
  
  let totalMultiplier = 0;
  let gameCount = 0;
  
  // Estimate which rounds were played based on games and outcomes
  if (totalGames === 4) {
    // Played all 4 rounds (no bye)
    totalMultiplier += CLUTCH_MULTIPLIERS.WILD_CARD + CLUTCH_MULTIPLIERS.DIVISIONAL + 
                      CLUTCH_MULTIPLIERS.CONF_CHAMPIONSHIP + CLUTCH_MULTIPLIERS.SUPER_BOWL;
    gameCount = 4;
  } else if (totalGames === 3) {
    // Had bye, played 3 rounds  
    totalMultiplier += CLUTCH_MULTIPLIERS.DIVISIONAL + CLUTCH_MULTIPLIERS.CONF_CHAMPIONSHIP + 
                      CLUTCH_MULTIPLIERS.SUPER_BOWL;
    gameCount = 3;
  } else if (totalGames === 2) {
    // Two rounds - assume divisional and conf championship for successful teams
    totalMultiplier += CLUTCH_MULTIPLIERS.DIVISIONAL + CLUTCH_MULTIPLIERS.CONF_CHAMPIONSHIP;
    gameCount = 2;
  } else if (totalGames === 1) {
    // One round - assume wild card for most teams
    totalMultiplier += CLUTCH_MULTIPLIERS.WILD_CARD;
    gameCount = 1;
  }
  
  return gameCount > 0 ? totalMultiplier / gameCount : 1.06;
};

// Enhanced Clutch Performance Score with Playoff Weighting (0-100)
export const calculateClutchScore = (qbSeasonData) => {
  // Further reduced playoff multipliers (additional 70% reduction)
  const PLAYOFF_CLUTCH_MULTIPLIERS = {
    WILD_CARD: 1.06,     // Wild card clutch moments worth 1.06x regular season (reduced from 1.2)
    DIVISIONAL: 1.08,    // Divisional round clutch moments worth 1.08x (reduced from 1.4)
    CONF_CHAMPIONSHIP: 1.12, // Conference championship clutch moments worth 1.12x (reduced from 1.8)
    SUPER_BOWL: 1.22     // Super Bowl clutch moments worth 1.22x regular season (reduced from 2.4)
  };
  
  let totalGWD = 0;
  let totalFourthQC = 0;
  let totalGames = 0;
  let totalPlayoffWins = 0;
  let totalPlayoffGames = 0;
  let weightSum = 0;
  
  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = YEAR_WEIGHTS[year] || 0;
    if (weight === 0) return;
    
    // Regular season clutch stats
    const regularGWD = data.GWD || 0;
    const regularFourthQC = data['4QC'] || 0;
    const regularGames = data.G || 0;
    
    // Apply regular season with normal weighting
    totalGWD += regularGWD * weight;
    totalFourthQC += regularFourthQC * weight;
    totalGames += regularGames * weight;
    
    // Add playoff data with round-specific clutch weighting if available
    if (data.playoffData) {
      const playoff = data.playoffData;
      
      // Calculate weighted playoff clutch based on likely round progression
      const clutchMultiplier = calculatePlayoffClutchMultiplier(playoff, data.Team, year);
      
      const playoffGWD = (playoff.gameWinningDrives || 0) * clutchMultiplier;
      const playoffFourthQC = (playoff.fourthQuarterComebacks || 0) * clutchMultiplier;
      const playoffGames = playoff.gamesPlayed || 0;
      const playoffWins = playoff.wins || 0;
      
      totalGWD += playoffGWD * weight;
      totalFourthQC += playoffFourthQC * weight;
      totalGames += playoffGames * weight; // Include playoff games in total games for rate
      totalPlayoffWins += playoffWins * weight;
      totalPlayoffGames += playoffGames * weight;
      
      // Debug for key QBs
      if (data.Player && (data.Player.includes('Mahomes') || data.Player.includes('Allen') || data.Player.includes('Burrow'))) {
        console.log(`🏆 ${data.Player} ${year} CLUTCH: Regular (${regularGWD} GWD, ${regularFourthQC} 4QC) + Playoff (${playoff.gameWinningDrives} GWD, ${playoff.fourthQuarterComebacks} 4QC, Multiplier: ${clutchMultiplier.toFixed(1)}x)`);
      }
    }
    
    weightSum += weight;
  });
  
  if (weightSum === 0) return 0;
  
  // Normalize by total weight
  totalGWD = totalGWD / weightSum;
  totalFourthQC = totalFourthQC / weightSum;
  totalGames = totalGames / weightSum;
  totalPlayoffWins = totalPlayoffWins / weightSum;
  totalPlayoffGames = totalPlayoffGames / weightSum;
  
  // Calculate per-game clutch averages
  const gwdPerGame = totalGames > 0 ? totalGWD / totalGames : 0;
  const comebacksPerGame = totalGames > 0 ? totalFourthQC / totalGames : 0;
  
  // Game Winning Drives per game - Primary clutch metric (0-40 points)
  const gwdScore = Math.min(40, gwdPerGame * 120); // Scale: 0.33 GWD/game = max points
  
  // 4th Quarter Comebacks per game (0-25 points)
  const comebackScore = Math.min(25, comebacksPerGame * 100); // Scale: 0.25 comebacks/game = max points
  
  // Total clutch opportunities per game (0-15 points)
  const totalClutchPerGame = gwdPerGame + comebacksPerGame;
  const clutchRateScore = Math.min(15, totalClutchPerGame * 50); // Combined clutch rate
  
  // REBALANCED PLAYOFF CLUTCH SCORING:
  // - Wild Card clutch moments: 2.0x multiplier
  // - Divisional clutch moments: 2.5x multiplier  
  // - Conference Championship clutch moments: 3.5x multiplier
  // - Super Bowl clutch moments: 5.0x multiplier
  
  // Enhanced playoff success bonus (0-20 points)
  let playoffSuccessScore = 0;
  if (totalPlayoffGames > 0) {
    const playoffWinRate = totalPlayoffWins / totalPlayoffGames;
    playoffSuccessScore = Math.min(20, playoffWinRate * 20 + totalPlayoffGames * 2); // Win rate + participation bonus
  }
  
  // Debug for clutch leaders
  if (gwdPerGame >= 0.15 || comebacksPerGame >= 0.10) {
    console.log(`🎯 CLUTCH: ${Object.values(qbSeasonData.years)[0]?.Player || 'Unknown'}: ${gwdPerGame.toFixed(3)} GWD/game, ${comebacksPerGame.toFixed(3)} 4QC/game -> Score: ${(gwdScore + comebackScore + clutchRateScore + playoffSuccessScore).toFixed(1)}/100`);
  }
  
  return gwdScore + comebackScore + clutchRateScore + playoffSuccessScore;
}; 