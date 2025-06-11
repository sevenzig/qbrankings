import { SCALING_RANGES, PLAYOFF_YEAR_WEIGHTS, REGULAR_SEASON_YEAR_WEIGHTS, STABILITY_YEAR_WEIGHTS } from './constants.js';

// Helper function to calculate weighted playoff wins based on round progression
const calculatePlayoffWeightedWins = (playoffData, team, year, include2024Only = false) => {
  const wins = playoffData.wins || 0;
  const losses = playoffData.losses || 0;
  const totalGames = wins + losses;
  
  if (totalGames === 0) return 0;
  
  // Define playoff weights object - enhanced for 2024-only mode
  const WEIGHTS = include2024Only ? {
    // 2024-only mode: Significantly increased playoff bonuses
    SUPER_BOWL_WIN: 3.0, SUPER_BOWL_LOSS: 1.8, // 5x increase from 0.6/0.3
    CONF_CHAMPIONSHIP_WIN: 2.1, CONF_CHAMPIONSHIP_LOSS: 1.2, // 5x increase from 0.42/0.21
    DIVISIONAL_WIN: 1.5, DIVISIONAL_LOSS: 0.8, // 5x increase from 0.3/0.15
    WILD_CARD_WIN: 1.0, WILD_CARD_LOSS: 0.6 // ~5x increase from 0.21/0.12
  } : {
    // Normal mode: Current reduced values
    SUPER_BOWL_WIN: 0.6, SUPER_BOWL_LOSS: 0.3, // Further reduced from 2.0/1.0
    CONF_CHAMPIONSHIP_WIN: 0.42, CONF_CHAMPIONSHIP_LOSS: 0.21, // Further reduced from 1.4/0.7
    DIVISIONAL_WIN: 0.3, DIVISIONAL_LOSS: 0.15, // Further reduced from 1.0/0.5
    WILD_CARD_WIN: 0.21, WILD_CARD_LOSS: 0.12 // Further reduced from 0.7/0.4
  };
  
  let weightedWins = 0;
  
  // Determine playoff path based on wins/losses pattern
  if (totalGames === 4 && wins === 4) {
    // Won Super Bowl (4-0): WC + Div + Conf + SB wins
    weightedWins = WEIGHTS.WILD_CARD_WIN + WEIGHTS.DIVISIONAL_WIN + 
                  WEIGHTS.CONF_CHAMPIONSHIP_WIN + WEIGHTS.SUPER_BOWL_WIN;
  } else if (totalGames === 4 && wins === 3) {
    // Lost Super Bowl (3-1): WC + Div + Conf wins, SB loss
    weightedWins = WEIGHTS.WILD_CARD_WIN + WEIGHTS.DIVISIONAL_WIN + 
                  WEIGHTS.CONF_CHAMPIONSHIP_WIN + WEIGHTS.SUPER_BOWL_LOSS;
  } else if (totalGames === 3 && wins === 3) {
    // Won Super Bowl from bye (3-0): Div + Conf + SB wins
    weightedWins = WEIGHTS.DIVISIONAL_WIN + WEIGHTS.CONF_CHAMPIONSHIP_WIN + WEIGHTS.SUPER_BOWL_WIN;
  } else if (totalGames === 3 && wins === 2) {
    // Lost Super Bowl from bye or won Conference Championship
    if (team === 'KAN' && year === 2023) { // Known SB winner
      weightedWins = WEIGHTS.DIVISIONAL_WIN + WEIGHTS.CONF_CHAMPIONSHIP_WIN + WEIGHTS.SUPER_BOWL_WIN;
    } else {
      // Assume Conference Championship win then SB loss
      weightedWins = WEIGHTS.DIVISIONAL_WIN + WEIGHTS.CONF_CHAMPIONSHIP_WIN + WEIGHTS.SUPER_BOWL_LOSS;
    }
  } else if (totalGames === 2 && wins === 2) {
    // Won Conference Championship (2-0)
    weightedWins = WEIGHTS.DIVISIONAL_WIN + WEIGHTS.CONF_CHAMPIONSHIP_WIN;
  } else if (totalGames === 2 && wins === 1) {
    // Won one, lost one - could be various scenarios
    if (losses === 1) {
      // Most likely: Won first round, lost second round
      weightedWins = WEIGHTS.WILD_CARD_WIN + WEIGHTS.DIVISIONAL_LOSS;
    }
  } else if (totalGames === 1 && wins === 1) {
    // Won first playoff game only
    weightedWins = WEIGHTS.WILD_CARD_WIN;
  } else if (totalGames === 1 && wins === 0) {
    // Lost first playoff game only
    weightedWins = WEIGHTS.WILD_CARD_LOSS;
  } else {
    // Fallback: use generic weighting based on win/loss ratio
    const winWeight = wins > losses ? WEIGHTS.DIVISIONAL_WIN : WEIGHTS.WILD_CARD_WIN;
    const lossWeight = WEIGHTS.WILD_CARD_LOSS;
    weightedWins = (wins * winWeight) + (losses * lossWeight);
  }
  
  return weightedWins;
};

// Helper function to calculate bye week bonus for QBs who earned their team a first-round bye
const calculateByeWeekBonus = (playoffData, team, year, include2024Only = false) => {
  const totalGames = (playoffData.wins || 0) + (playoffData.losses || 0);
  
  // Teams that earned bye weeks typically play 3 games instead of 4 to reach same level
  // If they played 3 games or fewer and had success, they likely had a bye
  if (totalGames <= 3 && (playoffData.wins || 0) >= 1) {
    // Known bye week teams by year (this could be expanded with more data)
    const byeWeekTeams = {
      2023: ['BAL', 'BUF', 'KC', 'SF', 'DAL', 'DET', 'PHI', 'MIA'], // Top 2 seeds per conference
      2022: ['BUF', 'KC', 'TEN', 'PHI', 'MIN', 'SF', 'BAL', 'CIN'], // Top 2 seeds per conference
      2024: ['KC', 'BUF', 'DET', 'PHI', 'BAL', 'HOU', 'MIN', 'LAR']  // Projected/partial
    };
    
    if (byeWeekTeams[year] && byeWeekTeams[year].includes(team)) {
      return include2024Only ? 1.0 : 0.21; // Enhanced bye bonus for 2024-only mode
    }
  }
  
  return 0;
};

// Enhanced Team Success Score with configurable weights and playoff toggle (0-100)
export const calculateTeamScore = (qbSeasonData, teamWeights = { regularSeason: 65, playoff: 35 }, teamSettings = { includePlayoffs: true, include2024Only: false }) => {
  // Debug logging for when playoffs are disabled
  const includePlayoffs = teamSettings.includePlayoffs;
  const include2024Only = teamSettings.include2024Only;
  const debugMode = !includePlayoffs;
  const playerName = qbSeasonData.years && Object.values(qbSeasonData.years)[0]?.Player;
  
  if (debugMode && playerName) {
    console.log(`🔍 DEBUG TEAM SCORE - ${playerName} (Playoffs ${includePlayoffs ? 'ADJUSTMENT MODE' : 'DISABLED'})`);
    console.log(`🔍 Team Weights: RegSeason=${teamWeights.regularSeason}, Playoff=${teamWeights.playoff}`);
  }
  
  let weightedWinPct = 0;
  let totalWeight = 0;
  let playoffAdjustmentFactor = 1.0; // Default: no playoff adjustment
  
  // Debug data collection
  let debugRegularSeasonData = [];
  
  // First Pass: Calculate strong regular season base scores
  // In 2024-only mode, only process 2024 data with 100% weight
  const regularSeasonYearWeights = include2024Only ? { '2024': 1.0 } : REGULAR_SEASON_YEAR_WEIGHTS;
  
  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = regularSeasonYearWeights[year] || 0;
    if (weight === 0 || !data.QBrec) return;
    
    // Parse regular season QB record (format: "14-3-0")
    const [wins, losses, ties = 0] = data.QBrec.split('-').map(Number);
    const totalGames = wins + losses + ties;
    const regularSeasonWinPct = totalGames > 0 ? wins / totalGames : 0;
    
    // MINIMUM GAMES THRESHOLD: Require at least 4 games started for team success evaluation
    const gamesStarted = parseInt(data.GS) || 0;
    if (gamesStarted < 4) {
      if (debugMode && playerName) {
        console.log(`🔍 ${year}: SKIPPED - Only ${gamesStarted} games started (minimum 4 required)`);
      }
      return;
    }
    
    // Debug: Store regular season data
    if (debugMode && playerName) {
      debugRegularSeasonData.push({
        year,
        record: `${wins}-${losses}-${ties}`,
        winPct: regularSeasonWinPct.toFixed(3),
        weight: weight.toFixed(2),
        hasPlayoffData: !!data.playoffData
      });
    }
    
    // Use regular season win percentage for base calculation
    weightedWinPct += regularSeasonWinPct * weight;
    totalWeight += weight;
  });
  
  if (totalWeight === 0) return 0;
  
  // Normalize regular season weighted win percentage
  weightedWinPct = weightedWinPct / totalWeight;
  
  // Second Pass: Calculate playoff performance adjustment if enabled
  if (includePlayoffs) {
    let totalPlayoffWeight = 0;
    let playoffPerformanceMultiplier = 1.0;
    const playoffYearWeights = include2024Only ? { '2024': 1.0 } : PLAYOFF_YEAR_WEIGHTS;
    
    Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
      const weight = playoffYearWeights[year] || 0;
      if (weight === 0 || !data.playoffData || !data.QBrec) return;
      
      const playoff = data.playoffData;
      const playoffWins = playoff.wins || 0;
      const playoffLosses = playoff.losses || 0;
      const playoffGames = playoffWins + playoffLosses;
      
      // Regular season performance for comparison
      const [regWins, regLosses, regTies = 0] = data.QBrec.split('-').map(Number);
      const regTotalGames = regWins + regLosses + regTies;
      const regWinPct = regTotalGames > 0 ? regWins / regTotalGames : 0;
      
      if (playoffGames > 0 && regTotalGames > 0) {
        // Calculate playoff vs regular season performance
        const playoffWinPct = playoffWins / playoffGames;
        
        // Performance comparison ratio (capped for sanity)
        const performanceRatio = Math.max(0.85, Math.min(1.20, playoffWinPct / Math.max(regWinPct, 0.3)));
        
        // Apply round progression modifier - enhanced for 2024-only mode
        let roundImportanceBonus = 1.0;
        if (playoffGames >= 3 && playoffWins >= 2) {
          // Known Super Bowl results for accurate detection
          const knownSuperBowlWins = {
            'PHI': [2024], // Eagles won 2024 Super Bowl
            'KAN': [2023], // Chiefs won 2023 Super Bowl
            'TAM': [2022], // Bucs won 2022 Super Bowl
            'LAR': [2022] // Rams won 2022 Super Bowl
          };
          
          const knownSuperBowlAppearances = {
            'PHI': [2023, 2024], // Eagles appeared in 2023 (loss) and 2024 (win)
            'KAN': [2022, 2023], // Chiefs appeared in 2022 (loss) and 2023 (win)
            'CIN': [2022], // Bengals appeared in 2022 (loss)
            'SFO': [2023] // 49ers appeared in 2023 (loss)
          };
          
          if (knownSuperBowlWins[data.Team] && knownSuperBowlWins[data.Team].includes(parseInt(year))) {
            roundImportanceBonus = include2024Only ? 1.50 : 1.08; // MASSIVE 50% bonus for SB wins in 2024-only mode
          } else if (knownSuperBowlAppearances[data.Team] && knownSuperBowlAppearances[data.Team].includes(parseInt(year))) {
            roundImportanceBonus = include2024Only ? 1.30 : 1.04; // 30% bonus for SB appearances in 2024-only mode
          } else if (playoffWins >= 2) {
            roundImportanceBonus = include2024Only ? 1.20 : 1.02; // 20% bonus for CCG level in 2024-only mode
          }
        }
        
        // Combine performance ratio with round importance
        const seasonPlayoffMultiplier = performanceRatio * roundImportanceBonus;
        playoffPerformanceMultiplier += (seasonPlayoffMultiplier - 1.0) * weight;
        totalPlayoffWeight += weight;
        
        // Debug for key QBs
        if (data.Player && (data.Player.includes('Mahomes') || data.Player.includes('Allen') || data.Player.includes('Burrow'))) {
          console.log(`🏆 ${data.Player} ${year} PLAYOFF ADJUSTMENT: Regular (${regWinPct.toFixed(3)}) vs Playoff (${playoffWinPct.toFixed(3)}) = Ratio(${performanceRatio.toFixed(3)}) × Round(${roundImportanceBonus.toFixed(3)}) = ${seasonPlayoffMultiplier.toFixed(3)}`);
        }
      }
    });
    
    // Normalize the playoff adjustment
    if (totalPlayoffWeight > 0) {
      playoffAdjustmentFactor = 1.0 + (playoffPerformanceMultiplier / totalPlayoffWeight);
      // Cap the adjustment to prevent extreme swings
      playoffAdjustmentFactor = Math.max(0.92, Math.min(1.12, playoffAdjustmentFactor));
    }
  }
  
  if (debugMode && playerName) {
    console.log(`🔍 REGULAR SEASON DATA:`);
    debugRegularSeasonData.forEach(season => {
      console.log(`🔍   ${season.year}: ${season.record} (${season.winPct}) weight=${season.weight} playoff=${season.hasPlayoffData}`);
    });
    console.log(`🔍 BASE WIN PCT: ${weightedWinPct.toFixed(3)} (total weight: ${totalWeight.toFixed(2)})`);
  }
  
  // Calculate final score using regular season base with playoff adjustment
  // Apply scaling curve and use the appropriate weight allocation
  const totalTeamWeight = teamWeights.regularSeason + teamWeights.playoff;
  const baseScore = Math.pow(weightedWinPct, SCALING_RANGES.WIN_PCT_CURVE) * totalTeamWeight;
  const finalScore = baseScore * playoffAdjustmentFactor;
  
  // Debug final calculation
  if (debugMode && playerName) {
    console.log(`🔍 FINAL CALCULATION:`);
    console.log(`🔍   Base: Win Pct(${weightedWinPct.toFixed(3)})^${SCALING_RANGES.WIN_PCT_CURVE} × ${totalTeamWeight} = ${baseScore.toFixed(1)}`);
    console.log(`🔍   Playoff Adjustment: ${baseScore.toFixed(1)} × ${playoffAdjustmentFactor.toFixed(3)} = ${finalScore.toFixed(1)}`);
    console.log(`🔍 ----------------------------------------`);
  }
  
  // Debug for Mahomes and other elite playoff QBs
  if (qbSeasonData.years && Object.values(qbSeasonData.years)[0]?.Player?.includes('Mahomes')) {
    console.log(`🏆 MAHOMES ADJUSTED TEAM SCORE: Base(${baseScore.toFixed(1)}) × Playoff(${playoffAdjustmentFactor.toFixed(3)}) = ${finalScore.toFixed(1)}`);
    console.log(`🏆 PLAYOFF DATA ${includePlayoffs ? 'ADJUSTMENT APPLIED' : 'EXCLUDED'} - 2024 Only: ${include2024Only}`);
  }
  
  return finalScore;
};