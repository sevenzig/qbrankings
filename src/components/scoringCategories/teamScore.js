import { SCALING_RANGES, PLAYOFF_YEAR_WEIGHTS, REGULAR_SEASON_YEAR_WEIGHTS, STABILITY_YEAR_WEIGHTS } from './constants.js';

// Offensive DVOA Data from CSV files
const OFFENSIVE_DVOA_DATA = {
  2024: {
    'BAL': { dvoa: 35.1, rank: 1 },
    'BUF': { dvoa: 20.7, rank: 2 },
    'DET': { dvoa: 19.9, rank: 3 },
    'GB': { dvoa: 17.3, rank: 4 },
    'CIN': { dvoa: 14.0, rank: 5 },
    'WSH': { dvoa: 13.3, rank: 6 },
    'TB': { dvoa: 12.7, rank: 7 },
    'KC': { dvoa: 10.8, rank: 8 },
    'SF': { dvoa: 10.6, rank: 9 },
    'LAR': { dvoa: 9.8, rank: 10 },
    'ARI': { dvoa: 8.4, rank: 11 },
    'LAC': { dvoa: 7.5, rank: 12 },
    'PHI': { dvoa: 4.8, rank: 13 },
    'ATL': { dvoa: 4.4, rank: 14 },
    'MIN': { dvoa: 2.9, rank: 15 },
    'DEN': { dvoa: -0.4, rank: 16 },
    'JAX': { dvoa: -2.1, rank: 17 },
    'SEA': { dvoa: -3.9, rank: 18 },
    'PIT': { dvoa: -5.1, rank: 19 },
    'IND': { dvoa: -5.1, rank: 20 },
    'NYJ': { dvoa: -6.0, rank: 21 },
    'MIA': { dvoa: -9.1, rank: 22 },
    'NO': { dvoa: -9.7, rank: 23 },
    'CAR': { dvoa: -11.6, rank: 24 },
    'DAL': { dvoa: -12.3, rank: 25 },
    'HOU': { dvoa: -12.4, rank: 26 },
    'CHI': { dvoa: -13.1, rank: 27 },
    'NYG': { dvoa: -13.6, rank: 28 },
    'LV': { dvoa: -17.6, rank: 29 },
    'NE': { dvoa: -18.7, rank: 30 },
    'TEN': { dvoa: -23.4, rank: 31 },
    'CLE': { dvoa: -31.7, rank: 32 }
  },
  2023: {
    'SF': { dvoa: 31.8, rank: 1 },
    'MIA': { dvoa: 20.9, rank: 2 },
    'BUF': { dvoa: 20.1, rank: 3 },
    'BAL': { dvoa: 19.1, rank: 4 },
    'DET': { dvoa: 13.8, rank: 5 },
    'GB': { dvoa: 13.0, rank: 6 },
    'LAR': { dvoa: 12.2, rank: 7 },
    'KC': { dvoa: 10.0, rank: 8 },
    'DAL': { dvoa: 8.8, rank: 9 },
    'PHI': { dvoa: 8.3, rank: 10 },
    'CIN': { dvoa: 6.7, rank: 11 },
    'SEA': { dvoa: 6.2, rank: 12 },
    'IND': { dvoa: 1.9, rank: 13 },
    'HOU': { dvoa: 1.0, rank: 14 },
    'PIT': { dvoa: 0.3, rank: 15 },
    'LAC': { dvoa: 0.1, rank: 16 },
    'NO': { dvoa: -0.6, rank: 17 },
    'JAX': { dvoa: -1.3, rank: 18 },
    'DEN': { dvoa: -1.6, rank: 19 },
    'TB': { dvoa: -3.6, rank: 20 },
    'ARI': { dvoa: -4.5, rank: 21 },
    'CHI': { dvoa: -6.5, rank: 22 },
    'MIN': { dvoa: -7.9, rank: 23 },
    'ATL': { dvoa: -9.8, rank: 24 },
    'TEN': { dvoa: -10.1, rank: 25 },
    'WSH': { dvoa: -10.4, rank: 26 },
    'LV': { dvoa: -10.7, rank: 27 },
    'CLE': { dvoa: -12.3, rank: 28 },
    'NE': { dvoa: -17.2, rank: 29 },
    'NYG': { dvoa: -23.0, rank: 30 },
    'CAR': { dvoa: -27.5, rank: 31 },
    'NYJ': { dvoa: -29.8, rank: 32 }
  },
  2022: {
    'KC': { dvoa: 25.2, rank: 1 },
    'BUF': { dvoa: 17.0, rank: 2 },
    'PHI': { dvoa: 15.1, rank: 3 },
    'CIN': { dvoa: 14.2, rank: 4 },
    'DET': { dvoa: 13.3, rank: 5 },
    'SF': { dvoa: 13.2, rank: 6 },
    'MIA': { dvoa: 12.0, rank: 7 },
    'CLE': { dvoa: 8.6, rank: 8 },
    'JAX': { dvoa: 7.7, rank: 9 },
    'NYG': { dvoa: 7.1, rank: 10 },
    'GB': { dvoa: 6.7, rank: 11 },
    'BAL': { dvoa: 6.6, rank: 12 },
    'ATL': { dvoa: 5.8, rank: 13 },
    'SEA': { dvoa: 4.8, rank: 14 },
    'DAL': { dvoa: 2.9, rank: 15 },
    'TB': { dvoa: 0.4, rank: 16 },
    'LV': { dvoa: 0.3, rank: 17 },
    'PIT': { dvoa: -0.1, rank: 18 },
    'LAC': { dvoa: -1.9, rank: 19 },
    'MIN': { dvoa: -3.3, rank: 20 },
    'TEN': { dvoa: -6.1, rank: 21 },
    'NO': { dvoa: -7.0, rank: 22 },
    'LAR': { dvoa: -8.1, rank: 23 },
    'NE': { dvoa: -8.5, rank: 24 },
    'CHI': { dvoa: -8.7, rank: 25 },
    'NYJ': { dvoa: -9.6, rank: 26 },
    'CAR': { dvoa: -10.0, rank: 27 },
    'WSH': { dvoa: -12.4, rank: 28 },
    'DEN': { dvoa: -13.0, rank: 29 },
    'ARI': { dvoa: -15.9, rank: 30 },
    'HOU': { dvoa: -27.6, rank: 31 },
    'IND': { dvoa: -31.7, rank: 32 }
  }
};

// Helper function to calculate offensive DVOA score (0-15 points)
const calculateOffensiveDVOAScore = (team, year) => {
  const yearData = OFFENSIVE_DVOA_DATA[year];
  if (!yearData || !yearData[team]) return 7.5; // League average fallback
  
  const dvoa = yearData[team].dvoa;
  
  // Scale DVOA to 0-15 points
  // Elite offense (30%+) = 15 points
  // Good offense (15%+) = 12 points  
  // Average offense (0%) = 7.5 points
  // Poor offense (-15%) = 3 points
  // Terrible offense (-30%+) = 0 points
  
  // Linear scaling from -35% to +35% DVOA range
  const normalizedDVOA = Math.max(-35, Math.min(35, dvoa));
  const score = ((normalizedDVOA + 35) / 70) * 15;
  
  return Math.max(0, Math.min(15, score));
};

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
      2023: ['KC', 'PHI'], // Top 2 seeds per conference
      2022: ['SF', 'BAL'], // Top 2 seeds per conference
      2024: ['KC', 'DET']  // Top 2 seeds per conference
    };
    
    if (byeWeekTeams[year] && byeWeekTeams[year].includes(team)) {
      return include2024Only ? 1.0 : 0.21; // Enhanced bye bonus for 2024-only mode
    }
  }
  
  return 0;
};

// Enhanced Team Success Score with configurable weights and playoff toggle (0-100)
export const calculateTeamScore = (qbSeasonData, teamWeights = { regularSeason: 50, offenseDVOA: 15, playoff: 35 }, teamSettings = { includePlayoffs: true, include2024Only: false }) => {
  // Debug logging for when playoffs are disabled
  const includePlayoffs = teamSettings.includePlayoffs;
  const include2024Only = teamSettings.include2024Only;
  const debugMode = !includePlayoffs;
  const playerName = qbSeasonData.years && Object.values(qbSeasonData.years)[0]?.Player;
  
  if (debugMode && playerName) {
    console.log(`🔍 DEBUG TEAM SCORE - ${playerName} (Playoffs ${includePlayoffs ? 'ADJUSTMENT MODE' : 'DISABLED'})`);
    console.log(`🔍 Team Weights: RegSeason=${teamWeights.regularSeason}, OffDVOA=${teamWeights.offenseDVOA}, Playoff=${teamWeights.playoff}`);
  }
  
  let weightedWinPct = 0;
  let weightedOffenseDVOA = 0;
  let totalWeight = 0;
  let playoffAdjustmentFactor = 1.0; // Default: no playoff adjustment
  
  // Debug data collection
  let debugRegularSeasonData = [];
  let debugOffenseDVOAData = [];
  
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
    
    // Get team for this season
    const team = data.Team || data.team;
    
    // Calculate offensive DVOA score for this team/year
    const offenseDVOAScore = calculateOffensiveDVOAScore(team, parseInt(year));
    
    // Debug: Store regular season data
    if (debugMode && playerName) {
      debugRegularSeasonData.push({
        year,
        record: `${wins}-${losses}-${ties}`,
        winPct: regularSeasonWinPct.toFixed(3),
        weight: weight.toFixed(2),
        hasPlayoffData: !!data.playoffData
      });
      
      debugOffenseDVOAData.push({
        year,
        team,
        dvoaScore: offenseDVOAScore.toFixed(1),
        weight: weight.toFixed(2)
      });
    }
    
    // Use regular season win percentage for base calculation
    weightedWinPct += regularSeasonWinPct * weight;
    weightedOffenseDVOA += offenseDVOAScore * weight;
    totalWeight += weight;
  });
  
  if (totalWeight === 0) return 0;
  
  // Normalize regular season weighted win percentage and offensive DVOA
  weightedWinPct = weightedWinPct / totalWeight;
  weightedOffenseDVOA = weightedOffenseDVOA / totalWeight;
  
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
      'KAN': [2022, 2023], // Chiefs won 2022 and 2023 Super Bowls (Mahomes)  
      'PHI': [2024] // Eagles won 2024 Super Bowl (Hurts)
    };
    
    const knownSuperBowlAppearances = {
      'PHI': [2022, 2024], // Eagles appeared in 2022 (lost to KC), 2024 (won vs KC - Hurts)
      'KAN': [2022, 2023, 2024], // Chiefs appeared in 2022 (won), 2023 (won), 2024 (lost to PHI - Mahomes)
      'SFO': [2023] // 49ers appeared in 2023 (lost to KC)
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
      // Cap the adjustment to prevent extreme swings - RELAXED CAPS to avoid systematic deflation
      playoffAdjustmentFactor = Math.max(0.98, Math.min(1.20, playoffAdjustmentFactor));
    }
  }
  
  if (debugMode && playerName) {
    console.log(`🔍 REGULAR SEASON DATA:`);
    debugRegularSeasonData.forEach(season => {
      console.log(`🔍   ${season.year}: ${season.record} (${season.winPct}) weight=${season.weight} playoff=${season.hasPlayoffData}`);
    });
    console.log(`🔍 OFFENSIVE DVOA DATA:`);
    debugOffenseDVOAData.forEach(season => {
      console.log(`🔍   ${season.year}: ${season.team} DVOA Score=${season.dvoaScore} weight=${season.weight}`);
    });
    console.log(`🔍 BASE WIN PCT: ${weightedWinPct.toFixed(3)} (total weight: ${totalWeight.toFixed(2)})`);
    console.log(`🔍 BASE OFFENSE DVOA: ${weightedOffenseDVOA.toFixed(1)} (total weight: ${totalWeight.toFixed(2)})`);
  }
  
  // Calculate final score using regular season base, offensive DVOA, and playoff adjustment
  // Apply scaling curve and use the appropriate weight allocation
  const winPctScore = Math.pow(weightedWinPct, SCALING_RANGES.WIN_PCT_CURVE) * teamWeights.regularSeason;
  const offenseDVOAComponent = weightedOffenseDVOA * (teamWeights.offenseDVOA / 15); // Proportional scaling from 0-15 max
  
  // FIXED: Apply playoff adjustment only to win percentage component (where we have playoff data)
  // Leave DVOA component unaffected since we don't have playoff offensive DVOA data
  const adjustedWinPctScore = winPctScore * playoffAdjustmentFactor;
  
  // CAREER PLAYOFF ACHIEVEMENT BONUS: Reward Super Bowl winners and deep playoff runs
  let careerPlayoffScore = 0;
  const achievementYearWeights = include2024Only ? { '2024': 1.0 } : REGULAR_SEASON_YEAR_WEIGHTS;
  
  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = achievementYearWeights[year] || 0;
    if (weight === 0 || !data.playoffData) return;
    
    const playoff = data.playoffData;
    const playoffWins = playoff.wins || 0;
    const playoffLosses = playoff.losses || 0;
    const playoffGames = playoffWins + playoffLosses;
    
    if (playoffGames === 0) return;
    
    // Super Bowl detection with known results
    let isSuperBowlWin = false;
    let isSuperBowlAppearance = false;
    
              const knownSuperBowlWins = {
            'KAN': [2022, 2023], // Chiefs won 2022 and 2023 Super Bowls (Mahomes)
            'PHI': [2024] // Eagles won 2024 Super Bowl (Hurts)
          };
    
              const knownSuperBowlAppearances = {
            'PHI': [2022, 2024], // Eagles appeared in 2022 (lost to KC), 2024 (won vs KC - Hurts)
            'KAN': [2022, 2023, 2024], // Chiefs appeared in 2022 (won), 2023 (won), 2024 (lost to PHI - Mahomes)
            'SFO': [2023] // 49ers appeared in 2023 (lost to KC)
          };
    
    // Check known cases first
    if (knownSuperBowlWins[data.Team] && knownSuperBowlWins[data.Team].includes(parseInt(year))) {
      isSuperBowlWin = true;
      isSuperBowlAppearance = true;
    } else if (knownSuperBowlAppearances[data.Team] && knownSuperBowlAppearances[data.Team].includes(parseInt(year))) {
      isSuperBowlAppearance = true;
    } else {
      // Fallback to game-based detection
      if (playoffGames >= 3 && playoffWins >= 2) {
        if (playoffWins === 4 || (playoffGames === 3 && playoffWins === 3)) {
          isSuperBowlWin = true;
          isSuperBowlAppearance = true;
        } else if (playoffWins === 3 || (playoffGames === 3 && playoffWins === 2)) {
          isSuperBowlAppearance = true;
        }
      }
    }
    
    if (isSuperBowlWin) {
      careerPlayoffScore += 25 * weight; // MASSIVE Super Bowl win bonus
    } else if (isSuperBowlAppearance) {
      careerPlayoffScore += 15 * weight; // Significant SB appearance bonus
    }
    
    // Conference Championship bonus
    if (playoffGames >= 2 && playoffWins >= 2) {
      careerPlayoffScore += 8 * weight; // Conference Championship win bonus
    } else if (playoffGames >= 2 && playoffWins >= 1) {
      careerPlayoffScore += 4 * weight; // Conference Championship appearance bonus
    }
    
    // Base playoff participation bonus
    careerPlayoffScore += playoffGames * 1.5 * weight; // Participation bonus
  });
  
  // Cap career playoff score at reasonable level and apply playoff weight
  const normalizedCareerPlayoffScore = Math.min(35, careerPlayoffScore);
  const weightedCareerPlayoffScore = normalizedCareerPlayoffScore * (teamWeights.playoff / 35); // Scale by playoff weight
  
  const finalScore = adjustedWinPctScore + offenseDVOAComponent + weightedCareerPlayoffScore;
  
  // Debug final calculation
  if (debugMode && playerName) {
    console.log(`🔍 FINAL CALCULATION:`);
    console.log(`🔍   Win Pct: ${weightedWinPct.toFixed(3)}^${SCALING_RANGES.WIN_PCT_CURVE} × ${teamWeights.regularSeason} = ${winPctScore.toFixed(1)}`);
    console.log(`🔍   Offense DVOA: ${weightedOffenseDVOA.toFixed(1)} × ${(teamWeights.offenseDVOA / 15).toFixed(2)} = ${offenseDVOAComponent.toFixed(1)}`);
    console.log(`🔍   Playoff Adjustment: ${winPctScore.toFixed(1)} × ${playoffAdjustmentFactor.toFixed(3)} = ${adjustedWinPctScore.toFixed(1)}`);
    console.log(`🔍   Career Playoff: ${normalizedCareerPlayoffScore.toFixed(1)} × ${(teamWeights.playoff / 35).toFixed(2)} = ${weightedCareerPlayoffScore.toFixed(1)}`);
    console.log(`🔍   Final: ${adjustedWinPctScore.toFixed(1)} + ${offenseDVOAComponent.toFixed(1)} + ${weightedCareerPlayoffScore.toFixed(1)} = ${finalScore.toFixed(1)}`);
    console.log(`🔍 ----------------------------------------`);
  }
  
  // Debug for Mahomes and other elite playoff QBs
  if (qbSeasonData.years && Object.values(qbSeasonData.years)[0]?.Player?.includes('Mahomes')) {
    console.log(`🏆 MAHOMES TEAM SCORE: WinPct(${winPctScore.toFixed(1)}) × Playoff(${playoffAdjustmentFactor.toFixed(3)}) + DVOA(${offenseDVOAComponent.toFixed(1)}) + Career(${weightedCareerPlayoffScore.toFixed(1)}) = ${finalScore.toFixed(1)}`);
    console.log(`🏆 PLAYOFF DATA ${includePlayoffs ? 'ADJUSTMENT APPLIED' : 'EXCLUDED'} - 2024 Only: ${include2024Only}, Playoff Weight: ${teamWeights.playoff}%`);
  }
  
  // Debug for Hurts and other Super Bowl winners
  if (qbSeasonData.years && Object.values(qbSeasonData.years)[0]?.Player?.includes('Hurts')) {
    console.log(`🏆 HURTS TEAM SCORE: WinPct(${winPctScore.toFixed(1)}) × Playoff(${playoffAdjustmentFactor.toFixed(3)}) + DVOA(${offenseDVOAComponent.toFixed(1)}) + Career(${weightedCareerPlayoffScore.toFixed(1)}) = ${finalScore.toFixed(1)}`);
    console.log(`🏆 SUPER BOWL WINNER: Raw Career(${normalizedCareerPlayoffScore.toFixed(1)}) × Weight(${(teamWeights.playoff / 35).toFixed(2)}) = ${weightedCareerPlayoffScore.toFixed(1)} weighted points!`);
  }
  
  return finalScore;
};