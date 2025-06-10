import { SCALING_RANGES, PLAYOFF_YEAR_WEIGHTS, REGULAR_SEASON_YEAR_WEIGHTS, STABILITY_YEAR_WEIGHTS } from './constants.js';

// Helper function to calculate weighted playoff wins based on round progression
const calculatePlayoffWeightedWins = (playoffData, team, year) => {
  const wins = playoffData.wins || 0;
  const losses = playoffData.losses || 0;
  const totalGames = wins + losses;
  
  if (totalGames === 0) return 0;
  
  // Define playoff weights object (additional 70% reduction)
  const WEIGHTS = {
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
const calculateByeWeekBonus = (playoffData, team, year) => {
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
      return 0.21; // Further reduced by 70% from 0.7 - they "earned" that win by getting the bye
    }
  }
  
  return 0;
};

// Enhanced Team Success Score with configurable weights and playoff toggle (0-100)
export const calculateTeamScore = (qbSeasonData, teamWeights = { regularSeason: 65, playoff: 35 }, teamSettings = { includePlayoffs: true }) => {
  // Debug logging for when playoffs are disabled
  const includePlayoffs = teamSettings.includePlayoffs;
  const debugMode = !includePlayoffs;
  const playerName = qbSeasonData.years && Object.values(qbSeasonData.years)[0]?.Player;
  
  if (debugMode && playerName) {
    console.log(`🔍 DEBUG TEAM SCORE - ${playerName} (Playoffs ${includePlayoffs ? 'ENABLED' : 'DISABLED'})`);
    console.log(`🔍 Team Weights: RegSeason=${teamWeights.regularSeason}, Playoff=${teamWeights.playoff}`);
  }
  
  // NEW: Comprehensive Playoff Round Weighting System
  const PLAYOFF_WEIGHTS = {
    // Super Bowl (Championship Game) - Reduced impact
    SUPER_BOWL_WIN: 2.0,     // Reduced from 5.0
    SUPER_BOWL_LOSS: 1.0,    // Reduced from 2.5
    
    // Conference Championship - Reduced impact
    CONF_CHAMPIONSHIP_WIN: 1.5,   // Reduced from 3.5
    CONF_CHAMPIONSHIP_LOSS: 0.8,  // Reduced from 1.8
    
    // Divisional Round - Reduced impact
    DIVISIONAL_WIN: 1.2,     // Reduced from 2.5
    DIVISIONAL_LOSS: 0.6,    // Reduced from 1.3
    
    // Wild Card Round - Reduced impact
    WILD_CARD_WIN: 0.9,      // Reduced from 1.8
    WILD_CARD_LOSS: 0.5,     // Reduced from 1.0
    
    // First-round bye bonus (equivalent to wild card win for earning the bye)
    BYE_WEEK_BONUS: 0.9      // Reduced from 1.8
  };
  
  let weightedWinPct = 0;
  let playoffWinBonus = 0;
  let totalWeight = 0;
  
  // Debug data collection
  let debugRegularSeasonData = [];
  
  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = REGULAR_SEASON_YEAR_WEIGHTS[year] || 0;
    if (weight === 0 || !data.QBrec) return;
    
    // Parse regular season QB record (format: "14-3-0")
    const [wins, losses, ties = 0] = data.QBrec.split('-').map(Number);
    let totalWins = wins;
    let totalGames = wins + losses + ties;
    const regularSeasonWinPct = totalGames > 0 ? wins / totalGames : 0;
    
    // MINIMUM GAMES THRESHOLD: Require at least 4 games started for team success evaluation
    // This prevents inflated scores from small sample sizes (e.g., Kenny Pickett's 1-0 record)
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
    
    // Add playoff performance with round-specific weighting (if enabled)
    if (data.playoffData && includePlayoffs) {
      const playoff = data.playoffData;
      const playoffWins = playoff.wins || 0;
      const playoffLosses = playoff.losses || 0;
      const playoffGames = playoffWins + playoffLosses;
      
      // Calculate weighted playoff performance based on round progression
      const playoffWeightedWins = calculatePlayoffWeightedWins(playoff, data.Team, year);
      const byeWeekBonus = calculateByeWeekBonus(playoff, data.Team, year);
      
      // Add weighted playoff wins and bye bonus
      totalWins += playoffWeightedWins + byeWeekBonus;
      totalGames += playoffGames;
      
      // Additional playoff success bonus (reduced since weighting is now more sophisticated)
      if (playoffGames > 0) {
        const playoffWinRate = playoffWins / playoffGames;
        playoffWinBonus += playoffWinRate * playoffGames * weight * 0.18; // Further reduced by 70% from 0.6
      }
      
      // Debug for key QBs
      if (data.Player && (data.Player.includes('Mahomes') || data.Player.includes('Allen') || data.Player.includes('Burrow'))) {
        console.log(`🏆 ${data.Player} ${year} TEAM: Regular (${wins}-${losses}) + Playoff (${playoffWins}-${playoffLosses}), Weighted wins: ${playoffWeightedWins.toFixed(1)}, Bye bonus: ${byeWeekBonus.toFixed(1)}`);
      }
    } else if (debugMode && playerName && data.playoffData) {
      // Debug: Show what playoff data would have been used
      const playoff = data.playoffData;
      console.log(`🔍 ${year}: Playoff data IGNORED - ${playoff.wins || 0}-${playoff.losses || 0} playoff record`);
    }
    
    const combinedWinPct = totalGames > 0 ? totalWins / totalGames : 0;
    
    if (debugMode && playerName) {
      console.log(`🔍 ${year}: ${data.QBrec} regular season -> Combined: ${totalWins.toFixed(1)}/${totalGames} = ${combinedWinPct.toFixed(3)} (weight: ${weight.toFixed(2)})`);
    }
    
    weightedWinPct += combinedWinPct * weight;
    totalWeight += weight;
  });
  
  if (totalWeight === 0) return 0;
  
  // Normalize for missing years
  weightedWinPct = weightedWinPct / totalWeight;
  playoffWinBonus = playoffWinBonus / totalWeight;
  
  if (debugMode && playerName) {
    console.log(`🔍 REGULAR SEASON DATA:`);
    debugRegularSeasonData.forEach(season => {
      console.log(`🔍   ${season.year}: ${season.record} (${season.winPct}) weight=${season.weight} playoff=${season.hasPlayoffData}`);
    });
    console.log(`🔍 WEIGHTED WIN PCT: ${weightedWinPct.toFixed(3)} (total weight: ${totalWeight.toFixed(2)})`);
  }
  
  // MAJOR REBALANCING: Separate regular season success from playoff success
  // This ensures deep playoff runs (especially Super Bowl appearances) are properly valued
  
  // Calculate separate playoff achievement score based on career playoff success
  let careerPlayoffScore = 0;
  let totalPlayoffGames = 0;
  let superBowlAppearances = 0;
  let superBowlWins = 0;
  let confChampAppearances = 0;
  let confChampWins = 0;
  
  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = PLAYOFF_YEAR_WEIGHTS[year] || 0;
    if (weight === 0 || !data.playoffData || !includePlayoffs) return;
    
    const playoff = data.playoffData;
    const playoffWins = playoff.wins || 0;
    const playoffLosses = playoff.losses || 0;
    const playoffGames = playoffWins + playoffLosses;
    
    if (playoffGames === 0) return;
    
    totalPlayoffGames += playoffGames * weight;
    
    // Enhanced Super Bowl detection with known historical data
    let isSuperBowlWin = false;
    let isSuperBowlAppearance = false;
    
    // Known Super Bowl results for accurate detection
    const knownSuperBowlWins = {
      'KAN': [2023, 2024], // Mahomes SB wins
      'TAM': [2022], // Brady's final SB
      'LAR': [2022] // Stafford SB win
    };
    
    const knownSuperBowlAppearances = {
      'KAN': [2022, 2023, 2024], // Mahomes appearances
      'PHI': [2023], // Hurts SB loss
      'CIN': [2022], // Burrow SB loss
      'SFO': [2023] // Purdy SB loss
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
      superBowlWins += weight;
      superBowlAppearances += weight;
      careerPlayoffScore += 18 * weight; // Reduced from 50 to 18 (64% reduction)
    } else if (isSuperBowlAppearance) {
      superBowlAppearances += weight;
      careerPlayoffScore += 12 * weight; // Reduced from 35 to 12 (66% reduction)
    }
    
    // Detect Conference Championship appearances
    if (playoffGames >= 2 && playoffWins >= 1) {
      if (playoffWins >= 2) {
        confChampWins += weight;
        confChampAppearances += weight;
        careerPlayoffScore += 9 * weight; // Reduced from 25 to 9 (64% reduction)
      } else if (playoffGames >= 2) {
        confChampAppearances += weight;
        careerPlayoffScore += 6 * weight; // Reduced from 18 to 6 (67% reduction)
      }
    }
    
    // Additional bonuses for divisional round and wild card success
    if (playoffGames >= 1) {
      if (playoffWins >= 1) {
        careerPlayoffScore += 4 * weight; // Reduced from 12 to 4 (67% reduction)
      }
      if (playoffGames >= 2) {
        careerPlayoffScore += 3 * weight; // Reduced from 8 to 3 (62% reduction)
      }
    }
    
    // Base playoff participation bonus (generous for all playoff appearances)
    careerPlayoffScore += playoffGames * 2 * weight; // Reduced from 6 to 2 (67% reduction)
  });
  
  // Regular season win percentage (0-{teamWeights.regularSeason} points)
  const regSeasonScore = Math.pow(weightedWinPct, SCALING_RANGES.WIN_PCT_CURVE) * teamWeights.regularSeason;
  
  // Career playoff achievement score (0-{teamWeights.playoff} points)
  const maxPlayoffPoints = includePlayoffs ? teamWeights.playoff : 0;
  const normalizedPlayoffScore = Math.min(maxPlayoffPoints, careerPlayoffScore);
  
  // CRITICAL FIX: When playoffs are disabled, normalize regular season score to use full team weight
  let finalRegSeasonScore = regSeasonScore;
  if (!includePlayoffs) {
    // If playoffs are disabled, scale regular season score to use the full weight
    const totalTeamWeight = teamWeights.regularSeason + teamWeights.playoff;
    finalRegSeasonScore = regSeasonScore * (totalTeamWeight / teamWeights.regularSeason);
    
    if (debugMode && playerName) {
      console.log(`🔍 PLAYOFF DISABLED ADJUSTMENT:`);
      console.log(`🔍   Original reg season score: ${regSeasonScore.toFixed(1)}`);
      console.log(`🔍   Scale factor: ${totalTeamWeight}/${teamWeights.regularSeason} = ${(totalTeamWeight / teamWeights.regularSeason).toFixed(2)}`);
      console.log(`🔍   Adjusted reg season score: ${finalRegSeasonScore.toFixed(1)}`);
    }
  }
  
  const finalScore = finalRegSeasonScore + normalizedPlayoffScore;
  
  // Debug final calculation
  if (debugMode && playerName) {
    console.log(`🔍 FINAL CALCULATION:`);
    console.log(`🔍   Regular Season: ${weightedWinPct.toFixed(3)}^${SCALING_RANGES.WIN_PCT_CURVE} × ${teamWeights.regularSeason} = ${finalRegSeasonScore.toFixed(1)}`);
    console.log(`🔍   Playoff Score: ${careerPlayoffScore.toFixed(1)} → capped at ${maxPlayoffPoints} = ${normalizedPlayoffScore.toFixed(1)}`);
    console.log(`🔍   TOTAL: ${finalRegSeasonScore.toFixed(1)} + ${normalizedPlayoffScore.toFixed(1)} = ${finalScore.toFixed(1)}`);
    console.log(`🔍 ----------------------------------------`);
  }
  
  // Debug for Mahomes and other elite playoff QBs
  if (qbSeasonData.years && Object.values(qbSeasonData.years)[0]?.Player?.includes('Mahomes')) {
    console.log(`🏆 MAHOMES TEAM SCORE (${teamWeights.regularSeason}/${teamWeights.playoff}): RegSeason(${finalRegSeasonScore.toFixed(1)}) + Playoffs(${normalizedPlayoffScore.toFixed(1)}) = ${finalScore.toFixed(1)}`);
    console.log(`🏆 MAHOMES PLAYOFF RESUME: ${superBowlWins.toFixed(1)} SB wins, ${superBowlAppearances.toFixed(1)} SB apps, ${confChampWins.toFixed(1)} Conf wins`);
    console.log(`🏆 PLAYOFF DATA ${includePlayoffs ? 'INCLUDED' : 'EXCLUDED'}`);
  }
  
  return finalScore;
};