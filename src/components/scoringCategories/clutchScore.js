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

// Enhanced Clutch Performance Score with playoff integration (0-100)
export const calculateClutchScore = (qbSeasonData, includePlayoffs = true, clutchWeights = { gameWinningDrives: 40, fourthQuarterComebacks: 25, clutchRate: 15, playoffBonus: 20 }) => {
  let totalGWD = 0;
  let totalFourthQC = 0;
  let totalGames = 0;
  let totalWeight = 0;
  let playoffAdjustmentFactor = 1.0; // Default: no playoff adjustment
  
  // Debug logging for playoff inclusion
  const debugMode = includePlayoffs;
  const playerName = qbSeasonData.years && Object.values(qbSeasonData.years)[0]?.Player;
  
  if (debugMode && playerName && (playerName.includes('Mahomes') || playerName.includes('Hurts') || playerName.includes('Allen'))) {
    console.log(`💎 CLUTCH DEBUG - ${playerName} (Playoffs ${includePlayoffs ? 'ADJUSTMENT MODE' : 'EXCLUDED'})`);
  }
  
  // First Pass: Calculate strong regular season base scores
  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = PERFORMANCE_YEAR_WEIGHTS[year] || 0;
    if (weight === 0 || !data.GWD || !data['4QC']) return;
    
    // Regular season clutch stats only for base calculation
    const seasonGWD = parseInt(data.GWD) || 0;
    const seasonFourthQC = parseInt(data['4QC']) || 0;
    const seasonGames = parseInt(data.G) || 17;
    
    totalGWD += seasonGWD * weight;
    totalFourthQC += seasonFourthQC * weight;
    totalGames += seasonGames * weight;
    totalWeight += weight;
  });

  if (totalWeight === 0 || totalGames === 0) return 0;

  // Normalize regular season weighted totals for rate calculations
  totalGWD = totalGWD / totalWeight;
  totalFourthQC = totalFourthQC / totalWeight;
  totalGames = totalGames / totalWeight;

  // Second Pass: Calculate playoff clutch performance adjustment if enabled
  if (includePlayoffs) {
    let totalPlayoffWeight = 0;
    let playoffClutchMultiplier = 1.0;
    
    Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
      const weight = PERFORMANCE_YEAR_WEIGHTS[year] || 0;
      if (weight === 0 || !data.playoffData) return;
      
      const playoff = data.playoffData;
      const playoffGWD = parseInt(playoff.gameWinningDrives) || 0;
      const playoffFourthQC = parseInt(playoff.fourthQuarterComebacks) || 0;
      const playoffGamesStarted = parseInt(playoff.gamesStarted) || 0;
      
      // Regular season clutch stats for comparison
      const regSeasonGWD = parseInt(data.GWD) || 0;
      const regSeasonFourthQC = parseInt(data['4QC']) || 0;
      const regSeasonGames = parseInt(data.G) || 17;
      
      if (playoffGamesStarted > 0 && regSeasonGames > 0) {
        // Calculate playoff vs regular season clutch performance rates
        const playoffGWDRate = playoffGWD / playoffGamesStarted;
        const playoffFourthQCRate = playoffFourthQC / playoffGamesStarted;
        const regGWDRate = regSeasonGWD / regSeasonGames;
        const regFourthQCRate = regSeasonFourthQC / regSeasonGames;
        
        // Calculate performance improvement/decline ratios (capped for sanity)
        const gwdRatio = Math.max(0.75, Math.min(1.35, playoffGWDRate / Math.max(regGWDRate, 0.05)));
        const fourthQCRatio = Math.max(0.75, Math.min(1.35, playoffFourthQCRate / Math.max(regFourthQCRate, 0.03)));
        
        // Average the clutch performance ratios
        const avgClutchRatio = (gwdRatio + fourthQCRatio) / 2;
        
        // Apply round progression modifier (modest impact)
        const playoffWins = parseInt(playoff.wins) || 0;
        const playoffLosses = parseInt(playoff.losses) || 0;
        const totalPlayoffGames = playoffWins + playoffLosses;
        
        let roundImportanceBonus = 1.0;
        if (totalPlayoffGames >= 3 && playoffWins >= 2) {
          // Known Super Bowl results for accurate detection
          const knownSuperBowlWins = {
            'KAN': [2023, 2024], 
            'TAM': [2022], 
            'LAR': [2022]
          };
          
          if (knownSuperBowlWins[data.Team] && knownSuperBowlWins[data.Team].includes(parseInt(year))) {
            roundImportanceBonus = 1.10; // 10% bonus for Super Bowl wins with good clutch performance
          } else if (playoffWins >= 2) {
            roundImportanceBonus = 1.05; // 5% bonus for deep playoff clutch moments
          }
        }
        
        // Combine clutch performance ratio with round importance
        const seasonClutchMultiplier = avgClutchRatio * roundImportanceBonus;
        playoffClutchMultiplier += (seasonClutchMultiplier - 1.0) * weight;
        totalPlayoffWeight += weight;
        
        if (debugMode && playerName) {
          console.log(`💎 ${year}: Playoff clutch adjustment - GWD ratio: ${gwdRatio.toFixed(3)}, 4QC ratio: ${fourthQCRatio.toFixed(3)}, Round bonus: ${roundImportanceBonus.toFixed(3)}, Combined: ${seasonClutchMultiplier.toFixed(3)}`);
        }
      }
    });
    
    // Normalize the playoff clutch adjustment
    if (totalPlayoffWeight > 0) {
      playoffAdjustmentFactor = 1.0 + (playoffClutchMultiplier / totalPlayoffWeight);
      // Cap the adjustment to prevent extreme swings
      playoffAdjustmentFactor = Math.max(0.90, Math.min(1.15, playoffAdjustmentFactor));
    }
    
    if (debugMode && playerName) {
      console.log(`💎 Final playoff clutch adjustment factor: ${playoffAdjustmentFactor.toFixed(3)}`);
    }
  }

  // Calculate per-game rates using regular season base
  const gwdPerGame = totalGames > 0 ? totalGWD / totalGames : 0;
  const comebacksPerGame = totalFourthQC / totalGames;
  const totalClutchPerGame = gwdPerGame + comebacksPerGame;

  // Calculate base score components using dynamic weights
  // Scale the max points for each component based on the weight percentages
  const maxGWDPoints = (clutchWeights.gameWinningDrives / 100) * 100;
  const maxComebackPoints = (clutchWeights.fourthQuarterComebacks / 100) * 100;
  const maxClutchRatePoints = (clutchWeights.clutchRate / 100) * 100;
  const maxPlayoffPoints = (clutchWeights.playoffBonus / 100) * 100;
  
  const baseGWDScore = Math.min(maxGWDPoints, gwdPerGame * 120 * (clutchWeights.gameWinningDrives / 40));
  const baseComebackScore = Math.min(maxComebackPoints, comebacksPerGame * 100 * (clutchWeights.fourthQuarterComebacks / 25));
  const baseClutchRateScore = Math.min(maxClutchRatePoints, totalClutchPerGame * 50 * (clutchWeights.clutchRate / 15));
  
  // Calculate playoff bonus based on component weight (replaces old consistency bonus)
  let playoffBonusScore = 0;
  if (clutchWeights.playoffBonus > 0 && includePlayoffs) {
    // Apply playoff adjustment factor to the playoff component only
    playoffBonusScore = Math.min(maxPlayoffPoints, (totalGWD + totalFourthQC) * 2 * playoffAdjustmentFactor * (clutchWeights.playoffBonus / 20));
  }
  
  const baseScore = baseGWDScore + baseComebackScore + baseClutchRateScore + playoffBonusScore;
  
  // Final score is the base score (no additional playoff adjustment since it's built into playoff bonus)
  const finalScore = baseScore;

  if (debugMode && playerName) {
    console.log(`💎 WEIGHTED CLUTCH FINAL: ${finalScore.toFixed(1)}/100`);
    console.log(`💎 Components: GWD(${baseGWDScore.toFixed(1)}) + 4QC(${baseComebackScore.toFixed(1)}) + Rate(${baseClutchRateScore.toFixed(1)}) + PlayoffBonus(${playoffBonusScore.toFixed(1)})`);
    console.log(`💎 Weights: GWD(${clutchWeights.gameWinningDrives}%) + 4QC(${clutchWeights.fourthQuarterComebacks}%) + Rate(${clutchWeights.clutchRate}%) + Playoff(${clutchWeights.playoffBonus}%)`);
    console.log(`💎 Rates: ${gwdPerGame.toFixed(3)} GWD/game, ${comebacksPerGame.toFixed(3)} 4QC/game over ${totalGames.toFixed(1)} weighted games`);
  }

  return finalScore;
}; 