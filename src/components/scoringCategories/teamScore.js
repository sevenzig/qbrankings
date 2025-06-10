import { SCALING_RANGES, YEAR_WEIGHTS } from './constants.js';

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

// Enhanced Team Success Score with Playoff Integration (0-100)
export const calculateTeamScore = (qbSeasonData) => {
  // NEW: Comprehensive Playoff Round Weighting System
  const PLAYOFF_WEIGHTS = {
    // Super Bowl (Championship Game)
    SUPER_BOWL_WIN: 5.0,
    SUPER_BOWL_LOSS: 2.5,
    
    // Conference Championship 
    CONF_CHAMPIONSHIP_WIN: 3.5,
    CONF_CHAMPIONSHIP_LOSS: 1.8,
    
    // Divisional Round
    DIVISIONAL_WIN: 2.5,
    DIVISIONAL_LOSS: 1.3,
    
    // Wild Card Round
    WILD_CARD_WIN: 1.8,
    WILD_CARD_LOSS: 1.0,
    
    // First-round bye bonus (equivalent to wild card win for earning the bye)
    BYE_WEEK_BONUS: 1.8
  };
  
  let weightedWinPct = 0;
  let weightedAvailability = 0;
  let playoffWinBonus = 0;
  let totalWeight = 0;
  
  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = YEAR_WEIGHTS[year] || 0;
    if (weight === 0 || !data.QBrec) return;
    
    // Parse regular season QB record (format: "14-3-0")
    const [wins, losses, ties = 0] = data.QBrec.split('-').map(Number);
    let totalWins = wins;
    let totalGames = wins + losses + ties;
    
    // Add playoff performance with round-specific weighting
    if (data.playoffData) {
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
    }
    
    const combinedWinPct = totalGames > 0 ? totalWins / totalGames : 0;
    
    // Games started availability (regular season + playoffs)
    const regularGames = data.GS || 0;
    const playoffGames = data.playoffData ? (data.playoffData.gamesStarted || 0) : 0;
    const totalPossibleGames = 17 + (data.playoffData ? 4 : 0); // Assume up to 4 playoff games possible
    const availability = Math.min(1, (regularGames + playoffGames) / totalPossibleGames);
    
    weightedWinPct += combinedWinPct * weight;
    weightedAvailability += availability * weight;
    totalWeight += weight;
  });
  
  if (totalWeight === 0) return 0;
  
  // Normalize for missing years
  weightedWinPct = weightedWinPct / totalWeight;
  weightedAvailability = weightedAvailability / totalWeight;
  playoffWinBonus = playoffWinBonus / totalWeight;
  
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
    const weight = YEAR_WEIGHTS[year] || 0;
    if (weight === 0 || !data.playoffData) return;
    
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
      careerPlayoffScore += 15 * weight; // Reduced SB win bonus (70% reduction from 50)
    } else if (isSuperBowlAppearance) {
      superBowlAppearances += weight;
      careerPlayoffScore += 9 * weight; // Reduced SB appearance bonus (70% reduction from 30)
    }
    
    // Detect Conference Championship appearances
    if (playoffGames >= 2 && playoffWins >= 1) {
      if (playoffWins >= 2) {
        confChampWins += weight;
        confChampAppearances += weight;
        careerPlayoffScore += 2.4 * weight; // Further reduced bonus for conf champ wins (70% reduction from 8)
      } else if (playoffGames >= 2) {
        confChampAppearances += weight;
        careerPlayoffScore += 1.2 * weight; // Further reduced bonus for conf champ appearances (70% reduction from 4)
      }
    }
    
    // Base playoff participation bonus (further reduced by 70%)
    careerPlayoffScore += playoffGames * 0.36 * weight; // 0.36 points per playoff game (reduced from 1.2)
  });
  
  // Regular season win percentage (0-50 points, increased by 25% from 40)
  const regSeasonScore = Math.pow(weightedWinPct, SCALING_RANGES.WIN_PCT_CURVE) * 50;
  
  // Availability bonus (0-15 points, reduced)
  const availabilityScore = weightedAvailability * 15;
  
  // Career playoff achievement score (0-45 points, massively increased)
  const normalizedPlayoffScore = Math.min(45, careerPlayoffScore);
  
  const finalScore = regSeasonScore + availabilityScore + normalizedPlayoffScore;
  
  // Debug for Mahomes and other elite playoff QBs
  if (qbSeasonData.years && Object.values(qbSeasonData.years)[0]?.Player?.includes('Mahomes')) {
    console.log(`🏆 MAHOMES TEAM SCORE: RegSeason(${regSeasonScore.toFixed(1)}) + Avail(${availabilityScore.toFixed(1)}) + Playoffs(${normalizedPlayoffScore.toFixed(1)}) = ${finalScore.toFixed(1)}`);
    console.log(`🏆 MAHOMES PLAYOFF RESUME: ${superBowlWins.toFixed(1)} SB wins, ${superBowlAppearances.toFixed(1)} SB apps, ${confChampWins.toFixed(1)} Conf wins`);
  }
  
  return Math.min(100, finalScore);
}; 