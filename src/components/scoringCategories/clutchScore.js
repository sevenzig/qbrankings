import { PERFORMANCE_YEAR_WEIGHTS } from './constants.js';

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

// Enhanced Clutch Performance Score with configurable playoff multipliers (0-100)
export const calculateClutchScore = (qbSeasonData, includePlayoffs = true) => {
  let totalGWD = 0;
  let totalFourthQC = 0;
  let totalGames = 0;
  let totalPlayoffGames = 0;
  let playoffClutchBonus = 0;
  let totalWeight = 0;
  
  // Debug logging for playoff inclusion
  const debugMode = !includePlayoffs;
  const playerName = qbSeasonData.years && Object.values(qbSeasonData.years)[0]?.Player;
  
  if (debugMode && playerName) {
    console.log(`💎 CLUTCH DEBUG - ${playerName} (Playoffs ${includePlayoffs ? 'INCLUDED' : 'EXCLUDED'})`);
  }

  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = PERFORMANCE_YEAR_WEIGHTS[year] || 0;
    if (weight === 0) return;
    
    const gamesStarted = parseInt(data.GS) || 0;
    
    // Regular season clutch stats
    const regSeasonGWD = parseInt(data.GWD) || 0;
    const regSeasonFourthQC = parseInt(data['4QC']) || 0;
    
    let seasonGWD = regSeasonGWD;
    let seasonFourthQC = regSeasonFourthQC;
    let seasonGames = gamesStarted;
    
    // Add playoff clutch stats if available and playoffs are included
    if (data.playoffData && includePlayoffs) {
      const playoff = data.playoffData;
      const playoffGWD = parseInt(playoff.gameWinningDrives) || 0;
      const playoffFourthQC = parseInt(playoff.fourthQuarterComebacks) || 0;
      const playoffGamesStarted = parseInt(playoff.gamesStarted) || 0;
      
      seasonGWD += playoffGWD;
      seasonFourthQC += playoffFourthQC;
      seasonGames += playoffGamesStarted;
      
      // Calculate playoff clutch multiplier for additional bonus
      const playoffClutchMultiplier = calculatePlayoffClutchMultiplier(playoff, data.Team, year);
      const playoffClutchEvents = playoffGWD + playoffFourthQC;
      playoffClutchBonus += playoffClutchEvents * (playoffClutchMultiplier - 1.0) * weight;
      
      totalPlayoffGames += playoffGamesStarted * weight;
      
      if (debugMode && playerName) {
        console.log(`💎 ${year}: Added playoff clutch - ${playoffGWD} GWD, ${playoffFourthQC} 4QC in ${playoffGamesStarted} games`);
      }
    } else if (data.playoffData && debugMode && playerName) {
      console.log(`💎 ${year}: Playoff clutch IGNORED - ${data.playoffData.gameWinningDrives || 0} GWD, ${data.playoffData.fourthQuarterComebacks || 0} 4QC`);
    }
    
    if (debugMode && playerName) {
      console.log(`💎 ${year}: Combined clutch - ${seasonGWD} GWD, ${seasonFourthQC} 4QC in ${seasonGames} games`);
    }
    
    totalGWD += seasonGWD * weight;
    totalFourthQC += seasonFourthQC * weight;
    totalGames += seasonGames * weight;
    totalWeight += weight;
  });

  if (totalWeight === 0 || totalGames === 0) return 0;

  // Normalize weighted totals
  totalGWD = totalGWD / totalWeight;
  totalFourthQC = totalFourthQC / totalWeight;
  totalGames = totalGames / totalWeight;
  totalPlayoffGames = totalPlayoffGames / totalWeight;
  playoffClutchBonus = playoffClutchBonus / totalWeight;

  // Calculate per-game rates
  const gwdPerGame = totalGames > 0 ? totalGWD / totalGames : 0;
  const fourthQCPerGame = totalGames > 0 ? totalFourthQC / totalGames : 0;
  const totalClutchPerGame = gwdPerGame + fourthQCPerGame;

  if (debugMode && playerName) {
    console.log(`💎 FINAL CLUTCH RATES:`);
    console.log(`💎   GWD per game: ${gwdPerGame.toFixed(3)} (${totalGWD.toFixed(1)} total)`);
    console.log(`💎   4QC per game: ${fourthQCPerGame.toFixed(3)} (${totalFourthQC.toFixed(1)} total)`);
    console.log(`💎   Games: ${totalGames.toFixed(1)} total`);
    console.log(`💎 ----------------------------------------`);
  }

  // Core clutch scoring components
  const gwdScore = Math.min(40, gwdPerGame * 120);
  const comebackScore = Math.min(25, fourthQCPerGame * 100);
  const clutchRateScore = Math.min(15, totalClutchPerGame * 50);

  // Playoff success bonus - only applied if playoffs are included
  let playoffSuccessScore = 0;
  if (includePlayoffs && totalPlayoffGames > 0) {
    const playoffWinRate = 0.6; // Simplified - would need actual playoff win rate
    playoffSuccessScore = Math.min(20, playoffWinRate * 20 + totalPlayoffGames * 2);
    playoffSuccessScore += playoffClutchBonus; // Add the multiplier-based bonus
  }

  const finalScore = gwdScore + comebackScore + clutchRateScore + playoffSuccessScore;

  // Quality threshold logging for elite clutch QBs
  if (gwdPerGame >= 0.15 || fourthQCPerGame >= 0.10) {
    console.log(`💎 ELITE CLUTCH QB: ${qbSeasonData.years && Object.values(qbSeasonData.years)[0]?.Player}`);
    console.log(`💎 GWD/Game: ${gwdPerGame.toFixed(3)} | 4QC/Game: ${fourthQCPerGame.toFixed(3)}`);
    console.log(`💎 Component Scores: GWD(${gwdScore.toFixed(1)}) + 4QC(${comebackScore.toFixed(1)}) + Rate(${clutchRateScore.toFixed(1)}) + Playoff(${playoffSuccessScore.toFixed(1)}) = ${finalScore.toFixed(1)}`);
  }

  return finalScore;
}; 