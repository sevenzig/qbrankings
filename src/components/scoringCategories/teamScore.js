import { SCALING_RANGES, PLAYOFF_YEAR_WEIGHTS, REGULAR_SEASON_YEAR_WEIGHTS, STABILITY_YEAR_WEIGHTS } from './constants.js';
import {
  calculateZScore,
  calculateMean,
  calculateStandardDeviation,
  zScoreToPercentile
} from '../../utils/zScoreCalculations.js';
import { calculateHierarchicalScore } from '../../utils/qbCalculations.js';

/**
 * Calculate reliability-adjusted win percentage for early season data
 * Blends raw win percentage with league average based on sample size
 * @param {number} wins - Number of wins
 * @param {number} totalGames - Total games played
 * @param {number} minGames - Minimum games for full reliability (default: 8)
 * @returns {number} Reliability-adjusted win percentage
 */
const calculateReliabilityAdjustedWinPct = (wins, totalGames, minGames = 8) => {
  if (totalGames === 0) return 0.5; // Default to league average if no games
  
  const rawWinPct = wins / totalGames;
  
  // If we have enough games, use raw win percentage
  if (totalGames >= minGames) {
    return rawWinPct;
  }
  
  // For small sample sizes, blend with league average
  const sampleSizeFactor = totalGames / minGames;
  const leagueAverage = 0.5;
  
  // Blend raw win% with league average based on sample size
  return (rawWinPct * sampleSizeFactor) + (leagueAverage * (1 - sampleSizeFactor));
};

/*
 * TEAM ABBREVIATION AUDIT: All 32 NFL Teams Coverage
 * 
 * Primary Standard Abbreviations (32 teams):
 * AFC East: BUF, MIA, NE, NYJ
 * AFC North: BAL, CIN, CLE, PIT  
 * AFC South: HOU, IND, JAX, TEN
 * AFC West: DEN, KC, LAC, LV
 * NFC East: DAL, NYG, PHI, WAS
 * NFC North: CHI, DET, GB, MIN
 * NFC South: ATL, CAR, NO, TB
 * NFC West: ARI, LAR, SF, SEA
 * 
 * Alternative Abbreviations Supported:
 * KC/KAN (Chiefs), SF/SFO (49ers), WAS/WSH (Commanders), 
 * TB/TAM (Bucs), LV/LVR (Raiders), NE/NWE (Patriots), 
 * NO/NOR (Saints), GB/GNB (Packers)
 */

// Offensive DVOA Data from CSV files - EXACT MATCH to provided CSVs
const OFFENSIVE_DVOA_DATA = {
  2024: {
    'BAL': { dvoa: 35.1, rank: 1 },
    'DET': { dvoa: 19.9, rank: 3 },
    'GB': { dvoa: 17.3, rank: 4 },
    'GNB': { dvoa: 17.3, rank: 4 }, // Alternative abbreviation for Green Bay Packers
    'BUF': { dvoa: 20.7, rank: 2 },
    'PHI': { dvoa: 4.8, rank: 13 },
    'DEN': { dvoa: -0.4, rank: 16 },
    'MIN': { dvoa: 2.9, rank: 15 },
    'KC': { dvoa: 10.8, rank: 8 },
    'KAN': { dvoa: 10.8, rank: 8 }, // Alternative abbreviation for Kansas City Chiefs
    'LAC': { dvoa: 7.5, rank: 12 },
    'WAS': { dvoa: 13.3, rank: 6 },
    'WSH': { dvoa: 13.3, rank: 6 }, // Alternative abbreviation for Washington Commanders
    'TB': { dvoa: 12.7, rank: 7 },
    'TAM': { dvoa: 12.7, rank: 7 }, // Alternative abbreviation for Tampa Bay Buccaneers
    'ARI': { dvoa: 8.4, rank: 11 },
    'CIN': { dvoa: 14.0, rank: 5 },
    'SF': { dvoa: 10.6, rank: 9 },
    'SFO': { dvoa: 10.6, rank: 9 }, // Alternative abbreviation for San Francisco 49ers
    'PIT': { dvoa: -5.1, rank: 19 },
    'HOU': { dvoa: -12.4, rank: 26 },
    'LAR': { dvoa: 9.8, rank: 10 },
    'SEA': { dvoa: -3.9, rank: 18 },
    'IND': { dvoa: -5.1, rank: 20 },
    'ATL': { dvoa: 4.4, rank: 14 },
    'MIA': { dvoa: -9.1, rank: 22 },
    'NO': { dvoa: -9.7, rank: 23 },
    'NOR': { dvoa: -9.7, rank: 23 }, // Alternative abbreviation for New Orleans Saints
    'NYJ': { dvoa: -6.0, rank: 21 },
    'DAL': { dvoa: -12.3, rank: 25 },
    'CHI': { dvoa: -13.1, rank: 27 },
    'JAX': { dvoa: -2.1, rank: 17 },
    'LV': { dvoa: -17.6, rank: 29 },
    'LVR': { dvoa: -17.6, rank: 29 }, // Alternative abbreviation for Las Vegas Raiders
    'NYG': { dvoa: -13.6, rank: 28 },
    'NE': { dvoa: -18.7, rank: 30 },
    'NWE': { dvoa: -18.7, rank: 30 }, // Alternative abbreviation for New England Patriots
    'CAR': { dvoa: -11.6, rank: 24 },
    'TEN': { dvoa: -23.4, rank: 31 },
    'CLE': { dvoa: -31.7, rank: 32 }
  },
  2023: {
    'SF': { dvoa: 31.8, rank: 1 },
    'SFO': { dvoa: 31.8, rank: 1 }, // Alternative abbreviation for San Francisco 49ers
    'MIA': { dvoa: 20.9, rank: 2 },
    'BUF': { dvoa: 20.1, rank: 3 },
    'BAL': { dvoa: 19.1, rank: 4 },
    'DET': { dvoa: 13.8, rank: 5 },
    'GB': { dvoa: 13.0, rank: 6 },
    'GNB': { dvoa: 13.0, rank: 6 }, // Alternative abbreviation for Green Bay Packers
    'LAR': { dvoa: 12.2, rank: 7 },
    'KC': { dvoa: 10.0, rank: 8 },
    'KAN': { dvoa: 10.0, rank: 8 }, // Alternative abbreviation for Kansas City Chiefs
    'DAL': { dvoa: 8.8, rank: 9 },
    'PHI': { dvoa: 8.3, rank: 10 },
    'CIN': { dvoa: 6.7, rank: 11 },
    'SEA': { dvoa: 6.2, rank: 12 },
    'IND': { dvoa: 1.9, rank: 13 },
    'HOU': { dvoa: 1.0, rank: 14 },
    'PIT': { dvoa: 0.3, rank: 15 },
    'LAC': { dvoa: 0.1, rank: 16 },
    'NO': { dvoa: -0.6, rank: 17 },
    'NOR': { dvoa: -0.6, rank: 17 }, // Alternative abbreviation for New Orleans Saints
    'JAX': { dvoa: -1.3, rank: 18 },
    'DEN': { dvoa: -1.6, rank: 19 },
    'TB': { dvoa: -3.6, rank: 20 },
    'TAM': { dvoa: -3.6, rank: 20 }, // Alternative abbreviation for Tampa Bay Buccaneers
    'ARI': { dvoa: -4.5, rank: 21 },
    'CHI': { dvoa: -6.5, rank: 22 },
    'MIN': { dvoa: -7.9, rank: 23 },
    'ATL': { dvoa: -9.8, rank: 24 },
    'TEN': { dvoa: -10.1, rank: 25 },
    'WSH': { dvoa: -10.4, rank: 26 },
    'WAS': { dvoa: -10.4, rank: 26 }, // Alternative abbreviation for Washington Commanders
    'LV': { dvoa: -10.7, rank: 27 },
    'LVR': { dvoa: -10.7, rank: 27 }, // Alternative abbreviation for Las Vegas Raiders
    'CLE': { dvoa: -12.3, rank: 28 },
    'NE': { dvoa: -17.2, rank: 29 },
    'NWE': { dvoa: -17.2, rank: 29 }, // Alternative abbreviation for New England Patriots
    'NYG': { dvoa: -23.0, rank: 30 },
    'CAR': { dvoa: -27.5, rank: 31 },
    'NYJ': { dvoa: -29.8, rank: 32 }
  },
  2022: {
    'KC': { dvoa: 25.2, rank: 1 },
    'KAN': { dvoa: 25.2, rank: 1 }, // Alternative abbreviation for Kansas City Chiefs
    'BUF': { dvoa: 17.0, rank: 2 },
    'PHI': { dvoa: 15.1, rank: 3 },
    'CIN': { dvoa: 14.2, rank: 4 },
    'DET': { dvoa: 13.3, rank: 5 },
    'SF': { dvoa: 13.2, rank: 6 },
    'SFO': { dvoa: 13.2, rank: 6 }, // Alternative abbreviation for San Francisco 49ers
    'MIA': { dvoa: 12.0, rank: 7 },
    'CLE': { dvoa: 8.6, rank: 8 },
    'JAX': { dvoa: 7.7, rank: 9 },
    'NYG': { dvoa: 7.1, rank: 10 },
    'GB': { dvoa: 6.7, rank: 11 },
    'GNB': { dvoa: 6.7, rank: 11 }, // Alternative abbreviation for Green Bay Packers
    'BAL': { dvoa: 6.6, rank: 12 },
    'ATL': { dvoa: 5.8, rank: 13 },
    'SEA': { dvoa: 4.8, rank: 14 },
    'DAL': { dvoa: 2.9, rank: 15 },
    'TB': { dvoa: 0.4, rank: 16 },
    'TAM': { dvoa: 0.4, rank: 16 }, // Alternative abbreviation for Tampa Bay Buccaneers
    'LV': { dvoa: 0.3, rank: 17 },
    'LVR': { dvoa: 0.3, rank: 17 }, // Alternative abbreviation for Las Vegas Raiders
    'PIT': { dvoa: -0.1, rank: 18 },
    'LAC': { dvoa: -1.9, rank: 19 },
    'MIN': { dvoa: -3.3, rank: 20 },
    'TEN': { dvoa: -6.1, rank: 21 },
    'NO': { dvoa: -7.0, rank: 22 },
    'NOR': { dvoa: -7.0, rank: 22 }, // Alternative abbreviation for New Orleans Saints
    'LAR': { dvoa: -8.1, rank: 23 },
    'NE': { dvoa: -8.5, rank: 24 },
    'NWE': { dvoa: -8.5, rank: 24 }, // Alternative abbreviation for New England Patriots
    'CHI': { dvoa: -8.7, rank: 25 },
    'NYJ': { dvoa: -9.6, rank: 26 },
    'CAR': { dvoa: -10.0, rank: 27 },
    'WSH': { dvoa: -12.4, rank: 28 },
    'WAS': { dvoa: -12.4, rank: 28 }, // Alternative abbreviation for Washington Commanders
    'DEN': { dvoa: -13.0, rank: 29 },
    'ARI': { dvoa: -15.9, rank: 30 },
    'HOU': { dvoa: -27.6, rank: 31 },
    'IND': { dvoa: -31.7, rank: 32 }
  }
};

// --- Playoff Progression Constants (2023 & 2024) ---
// These objects map team abbreviations to their playoff entry and furthest round reached for each year.
const playoffProgress2023 = {
  BAL: { entry: "Divisional", reached: "Conference", result: "Lost" },
  BUF: { entry: "Wildcard", reached: "Divisional", result: "Lost" },
  KAN: { entry: "Wildcard", reached: "Super Bowl", result: "Won" },
  HOU: { entry: "Wildcard", reached: "Divisional", result: "Lost" },
  CLE: { entry: "Wildcard", reached: "Wildcard", result: "Lost" },
  MIA: { entry: "Wildcard", reached: "Wildcard", result: "Lost" },
  PIT: { entry: "Wildcard", reached: "Wildcard", result: "Lost" },
  SFO: { entry: "Divisional", reached: "Super Bowl", result: "Lost" },
  DAL: { entry: "Wildcard", reached: "Wildcard", result: "Lost" },
  DET: { entry: "Wildcard", reached: "Conference", result: "Lost" },
  TAM: { entry: "Wildcard", reached: "Divisional", result: "Lost" },
  PHI: { entry: "Wildcard", reached: "Wildcard", result: "Lost" },
  LAR: { entry: "Wildcard", reached: "Wildcard", result: "Lost" },
  GNB: { entry: "Wildcard", reached: "Divisional", result: "Lost" }
};
const playoffProgress2024 = {
  KAN: { entry: "Divisional", reached: "Super Bowl", result: "Lost" },
  BUF: { entry: "Wildcard", reached: "Conference", result: "Lost" },
  BAL: { entry: "Wildcard", reached: "Divisional", result: "Lost" },
  HOU: { entry: "Wildcard", reached: "Divisional", result: "Lost" },
  LAC: { entry: "Wildcard", reached: "Wildcard", result: "Lost" },
  PIT: { entry: "Wildcard", reached: "Wildcard", result: "Lost" },
  DEN: { entry: "Wildcard", reached: "Wildcard", result: "Lost" },
  DET: { entry: "Divisional", reached: "Divisional", result: "Lost" },
  PHI: { entry: "Wildcard", reached: "Super Bowl", result: "Won" },
  TAM: { entry: "Wildcard", reached: "Wildcard", result: "Lost" },
  LAR: { entry: "Wildcard", reached: "Divisional", result: "Lost" },
  MIN: { entry: "Wildcard", reached: "Wildcard", result: "Lost" },
  WAS: { entry: "Wildcard", reached: "Conference", result: "Lost" },
  GNB: { entry: "Wildcard", reached: "Wildcard", result: "Lost" }
};

// Helper to get playoff progression for a team/year
function getPlayoffProgress(team, year) {
  if (parseInt(year) === 2023) return playoffProgress2023[team] || null;
  if (parseInt(year) === 2024) return playoffProgress2024[team] || null;
  return null;
}

/**
 * Calculate z-score based offensive DVOA score using standardized statistics
 * Converts DVOA values to z-scores for accurate comparison
 * Handles multi-team seasons by weighting DVOA based on games started with each team
 */
const calculateOffensiveDVOAScore = (team, year, allTeams = null, teamsPlayed = null, gamesStartedPerTeam = null) => {
  // DVOA scoring disabled globally - return neutral score (0 z-score)
  console.log(`📊 DVOA DISABLED: Returning neutral score (0 z-score) for ${team} in ${year}`);
  return 0;
  
  // Original DVOA calculation disabled below
  /*
  const yearData = OFFENSIVE_DVOA_DATA[year];
  
  // Handle multi-team seasons (2TM, 3TM, etc.)
  if (team && team.match(/^\d+TM$/) && teamsPlayed && teamsPlayed.length > 0) {
    // Calculate weighted DVOA based on teams actually played for
    let totalWeight = 0;
    let weightedDVOA = 0;
    
    teamsPlayed.forEach((actualTeam, index) => {
      const teamData = yearData[actualTeam];
      if (teamData) {
        // Use games started per team if available, otherwise equal weight
        const weight = (gamesStartedPerTeam && gamesStartedPerTeam[index]) || 1;
        weightedDVOA += teamData.dvoa * weight;
        totalWeight += weight;
      } else {
        console.warn(`⚠️ DVOA LOOKUP FAILED: Team "${actualTeam}" not found in ${year} data for multi-team season`);
      }
    });
    
    if (totalWeight > 0) {
      const avgDVOA = weightedDVOA / totalWeight;
      
      // Calculate z-score using the weighted average
      const teams = allTeams || Object.keys(yearData);
      const dvoaValues = teams.map(t => yearData[t]?.dvoa || 0);
      const mean = calculateMean(dvoaValues);
      const stdDev = calculateStandardDeviation(dvoaValues, mean);
      const zScore = calculateZScore(avgDVOA, mean, stdDev, false);
      
      console.log(`📊 Multi-team DVOA (${year}): ${teamsPlayed.join('/')} → Weighted avg=${avgDVOA.toFixed(1)} (z=${zScore.toFixed(2)})`);
      return zScore;
    } else {
      // Fallback if no valid teams found
      console.warn(`⚠️ No valid teams found for multi-team season: ${team} in ${year}`);
      return 0; // Return 0 z-score (league average) as fallback
    }
  }
  
  // Original single-team logic
  if (!yearData || !yearData[team]) {
    console.warn(`⚠️ DVOA LOOKUP FAILED: Team "${team}" not found in ${year} data`);
    return 0; // Return 0 z-score (league average) as fallback
  }

  const teamData = yearData[team];
  const dvoa = teamData.dvoa;
  
  // Calculate population statistics for this year
  const teams = allTeams || Object.keys(yearData);
  const dvoaValues = teams.map(t => yearData[t]?.dvoa || 0);
  
  const mean = calculateMean(dvoaValues);
  const stdDev = calculateStandardDeviation(dvoaValues, mean);
  
  // Calculate z-score (higher DVOA is better)
  const zScore = calculateZScore(dvoa, mean, stdDev, false);
  
  // Return z-score (not percentile) for composite calculation
  return zScore;
  */
};

// Helper function to calculate weighted playoff wins based on round progression
const calculatePlayoffWeightedWins = (playoffData, team, year, filterYear = null) => {
  const wins = playoffData.wins || 0;
  const losses = playoffData.losses || 0;
  const totalGames = wins + losses;
  
  if (totalGames === 0) return 0;
  
  // Define playoff weights object - NORMALIZED across both modes
  const WEIGHTS = {
    // Consistent playoff weights for both 2024-only and 3-year modes
    SUPER_BOWL_WIN: 0.6, SUPER_BOWL_LOSS: 0.3,
    CONF_CHAMPIONSHIP_WIN: 0.42, CONF_CHAMPIONSHIP_LOSS: 0.21,
    DIVISIONAL_WIN: 0.3, DIVISIONAL_LOSS: 0.15,
    WILD_CARD_WIN: 0.21, WILD_CARD_LOSS: 0.12
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
const calculateByeWeekBonus = (playoffData, team, year, filterYear = null) => {
  const totalGames = (playoffData.wins || 0) + (playoffData.losses || 0);
  
  // Teams that earned bye weeks typically play 3 games instead of 4 to reach same level
  // If they played 3 games or fewer and had success, they likely had a bye
  if (totalGames <= 3 && (playoffData.wins || 0) >= 1) {
    // Known bye week teams by year (this could be expanded with more data)
    const byeWeekTeams = {
      2025: ['KC', 'DET'], // Update with actual 2025 teams
      2024: ['KC', 'DET'],  // Top 2 seeds per conference
      2023: ['KC', 'PHI'], // Top 2 seeds per conference
      2022: ['SF', 'BAL'] // Top 2 seeds per conference
    };
    
    if (byeWeekTeams[year] && byeWeekTeams[year].includes(team)) {
      return 0.21; // Consistent bye bonus for both modes
    }
  }
  
  return 0;
};

// Enhanced Team Success Score with configurable weights and playoff toggle (0-100)
export const calculateTeamScore = (
  qbData,
  teamWeights = { regularSeason: 100, offenseDVOA: 0, playoff: 0 },
  includePlayoffs = false, // Force disable playoffs globally
  filterYear = null, // CHANGED: from include2024Only boolean to filterYear number
  supportScore = 50, // Default to average support if not provided
  allQBData = [] // Population data for z-score calculations
) => {
  // Debug logging for when playoffs are disabled
  const debugMode = !includePlayoffs;
  const playerName = qbData.years && Object.values(qbData.years)[0]?.Player;
  
  // Always debug for Mahomes and Goff to diagnose ranking issue
  const isDebugQB = playerName && (playerName.includes('Mahomes') || playerName.includes('Goff'));
  
  if (debugMode && playerName) {
    console.log(`🔍 DEBUG TEAM SCORE - ${playerName} (Playoffs ${includePlayoffs ? 'ADJUSTMENT MODE' : 'DISABLED'})`);
  }
  
  if (isDebugQB) {
    console.log(`\n🔍 ========== TEAM SCORE DEBUG: ${playerName} ==========`);
    console.log(`🔍 Team Weights: RegSeason=${teamWeights.regularSeason}, DVOA=${teamWeights.offenseDVOA}, Playoff=${teamWeights.playoff}`);
    console.log(`🔍 Include Playoffs: ${includePlayoffs}, Filter Year: ${filterYear || 'all'}`);
  }
  
  let weightedWinPct = 0;
  let weightedOffenseDVOA = 0;
  let totalWeight = 0;
  let playoffAdjustmentFactor = 1.0; // Default: no playoff adjustment
  
  // Debug data collection
  let debugRegularSeasonData = [];
  let debugOffenseDVOAData = [];
  
  // First Pass: Calculate strong regular season base scores
  // In single-year mode, only process that specific year with 100% weight
  const regularSeasonYearWeights = (filterYear && typeof filterYear === 'number')
    ? { [filterYear.toString()]: 1.0 }
    : REGULAR_SEASON_YEAR_WEIGHTS;
  
  Object.entries(qbData.years || {}).forEach(([year, data]) => {
    const weight = regularSeasonYearWeights[year] || 0;
    if (weight === 0 || !data.QBrec) return;
    
    // Parse regular season QB record (format: "14-3-0")
    const [wins, losses, ties = 0] = data.QBrec.split('-').map(Number);
    const totalGames = wins + losses + ties;
    const regularSeasonWinPct = calculateReliabilityAdjustedWinPct(wins, totalGames);
    
    // MINIMUM GAMES THRESHOLD: For single-year mode, require at least 2 starts (1 for 2025 and pre-1967); for multi-year, require 10 starts
    const gamesStarted = parseInt(data.GS) || 0;
    const gamesThreshold = (() => {
      if (filterYear && typeof filterYear === 'number') {
        if (filterYear === 2025) return 1;  // Partial season
        if (filterYear < 1967) return 1;   // Pre-merger era (shorter seasons)
        return 2;                            // Modern era (1967+)
      }
      return 10;                            // Multi-year threshold
    })();
    if (gamesStarted < gamesThreshold) {
      if (debugMode && playerName) {
        console.log(`🔍 ${year}: SKIPPED - Only ${gamesStarted} games started (minimum required)`);
      }
      return;
    }
    
    // Get team for this season
    const team = data.Team || data.team;
    const teamsPlayed = data.teamsPlayed || [];
    const gamesStartedPerTeam = data.gamesStartedPerTeam || [];
    
    // Calculate offensive DVOA score for this team/year (DISABLED - returns 0)
    const offenseDVOAScore = calculateOffensiveDVOAScore(team, parseInt(year), null, teamsPlayed, gamesStartedPerTeam);
    
    // Debug: Store regular season data
    if ((debugMode && playerName) || isDebugQB) {
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
  
  // Second Pass: Calculate playoff performance adjustment if enabled AND weighted
  // CRITICAL: Only apply adjustment when includePlayoffs is true AND playoff weight > 0
  // DISABLED: Playoff scoring disabled globally
  if (false && includePlayoffs && teamWeights.playoff > 0) {
    let totalPlayoffWeight = 0;
    let playoffPerformanceMultiplier = 1.0;
    const playoffYearWeights = (filterYear && typeof filterYear === 'number')
      ? { [filterYear.toString()]: 1.0 }
      : PLAYOFF_YEAR_WEIGHTS;
    
    Object.entries(qbData.years || {}).forEach(([year, data]) => {
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
        
        // Apply round progression modifier - NORMALIZED across both modes
        let roundImportanceBonus = 1.0;
        const progress = getPlayoffProgress(data.Team, year);
        if (progress) {
          if (progress.reached === "Super Bowl" && progress.result === "Won") {
            roundImportanceBonus = 1.08; // Consistent across both modes
          } else if (progress.reached === "Super Bowl") {
            roundImportanceBonus = 1.04; // Consistent across both modes
          } else if (progress.reached === "Conference") {
            roundImportanceBonus = 1.02; // Consistent across both modes
          } else if (progress.reached === "Divisional") {
            roundImportanceBonus = 1.01; // Consistent across both modes
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
  
  if ((debugMode && playerName) || isDebugQB) {
    console.log(`🔍 REGULAR SEASON DATA:`);
    debugRegularSeasonData.forEach(season => {
      console.log(`🔍   ${season.year}: ${season.record} (${season.winPct}) weight=${season.weight} playoff=${season.hasPlayoffData}`);
    });
    console.log(`🔍 OFFENSIVE OUTPUT DATA:`);
    debugOffenseDVOAData.forEach(season => {
      console.log(`🔍   ${season.year}: ${season.team} Output Score=${season.dvoaScore} weight=${season.weight}`);
    });
    console.log(`🔍 BASE WIN PCT: ${weightedWinPct.toFixed(3)} (total weight: ${totalWeight.toFixed(2)})`);
    console.log(`🔍 BASE OFFENSE OUTPUT: ${weightedOffenseDVOA.toFixed(1)} (total weight: ${totalWeight.toFixed(2)})`);
  }
  
    // CAREER PLAYOFF ACHIEVEMENT BONUS: Only calculate if playoffs are enabled
  let careerPlayoffScore = 0;
  
  // DISABLED: Playoff scoring disabled globally
  if (false && includePlayoffs) {
    const achievementYearWeights = (filterYear && typeof filterYear === 'number')
      ? { [filterYear.toString()]: 1.0 }
      : REGULAR_SEASON_YEAR_WEIGHTS;

    Object.entries(qbData.years || {}).forEach(([year, data]) => {
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
    let isConferenceChampWin = false;
    let isConferenceChampAppearance = false;
    const progress = getPlayoffProgress(data.Team, year);
    if (progress) {
      if (progress.reached === "Super Bowl" && progress.result === "Won") {
        isSuperBowlWin = true;
        isSuperBowlAppearance = true;
        isConferenceChampWin = true;
        isConferenceChampAppearance = true;
      } else if (progress.reached === "Super Bowl") {
        isSuperBowlAppearance = true;
        isConferenceChampWin = true;
        isConferenceChampAppearance = true;
      } else if (progress.reached === "Conference") {
        isConferenceChampWin = true;
        isConferenceChampAppearance = true;
      } else if (progress.reached === "Divisional") {
        isConferenceChampAppearance = true;
      }
    }

    // DRASTICALLY REDUCED bonuses to prevent score inflation
    if (isSuperBowlWin) {
      careerPlayoffScore += 5 * weight; // Reduced from 25 to 5
    } else if (isSuperBowlAppearance) {
      careerPlayoffScore += 3 * weight; // Reduced from 15 to 3
    }
    if (isConferenceChampWin) {
      careerPlayoffScore += 2 * weight; // Reduced from 8 to 2
    } else if (isConferenceChampAppearance) {
      careerPlayoffScore += 1 * weight; // Reduced from 4 to 1
    }
    careerPlayoffScore += playoffGames * 0.5 * weight; // Reduced from 1.5 to 0.5
    });
  }

  // Cap career playoff score at much lower level to prevent inflation
  const normalizedCareerPlayoffScore = Math.min(15, careerPlayoffScore); // Reduced from 35 to 15

  // Z-SCORE BASED TEAM COMPONENT CALCULATION - Return composite z-score
  
  // Convert win percentage to z-score using actual population data
  let winPctZ = 0;
  
  if (isDebugQB) {
    console.log(`🔍 allQBData available: ${allQBData ? 'YES' : 'NO'}, length: ${allQBData?.length || 0}`);
  }
  
  if (allQBData && allQBData.length > 0) {
    // Calculate actual population statistics from all QBs
    const regularSeasonYearWeights = (filterYear && typeof filterYear === 'number')
      ? { [filterYear.toString()]: 1.0 }
      : REGULAR_SEASON_YEAR_WEIGHTS;
    const winPctValues = [];
    
    if (isDebugQB) {
      console.log(`🔍 Processing ${allQBData.length} QBs for win% population stats...`);
    }
    
    allQBData.forEach(qb => {
      // Handle both formats: years object (transformed) or seasonData array (raw)
      if (qb.years) {
        // Transformed format
        Object.entries(qb.years).forEach(([year, data]) => {
          const weight = regularSeasonYearWeights[year] || 0;
          if (weight === 0 || !data.QBrec) return;
          
          const gamesStarted = parseInt(data.GS) || 0;
          const gamesThreshold = (() => {
            if (filterYear && typeof filterYear === 'number') {
              if (filterYear === 2025) return 1;  // Partial season
              return 2;                            // All other years
            }
            return 10;                            // Multi-year threshold
          })();
          if (gamesStarted < gamesThreshold) {
            return;
          }
          
          const [wins, losses, ties = 0] = data.QBrec.split('-').map(Number);
          const totalGames = wins + losses + ties;
          const winPct = calculateReliabilityAdjustedWinPct(wins, totalGames);
          
          if (!isNaN(winPct) && isFinite(winPct)) {
            winPctValues.push(winPct);
          }
        });
      } else if (qb.seasonData) {
        // Raw seasonData format
        const seasonsToUse = (filterYear && typeof filterYear === 'number')
          ? qb.seasonData.filter(s => s.year === filterYear)
          : qb.seasonData;
          
        seasonsToUse.forEach(season => {
          const year = season.year.toString();
          const weight = regularSeasonYearWeights[year] || 0;
          if (weight === 0) return;
          
          const gamesStarted = season.gamesStarted || 0;
          const gamesThreshold = (() => {
            if (filterYear && typeof filterYear === 'number') {
              if (filterYear === 2025) return 1;  // Partial season
              return 2;                            // All other years
            }
            return 10;                            // Multi-year threshold
          })();
          if (gamesStarted < gamesThreshold) {
            return;
          }
          
          const wins = season.wins || 0;
          const losses = season.losses || 0;
          const totalGames = wins + losses;
          const winPct = calculateReliabilityAdjustedWinPct(wins, totalGames);
          
          if (!isNaN(winPct) && isFinite(winPct)) {
            winPctValues.push(winPct);
          }
        });
      }
    });
    
    if (isDebugQB) {
      console.log(`🔍 Collected ${winPctValues.length} win% values from population`);
    }
    
    if (winPctValues.length > 0) {
      const winPctMean = calculateMean(winPctValues);
      const winPctStdDev = calculateStandardDeviation(winPctValues, winPctMean);
      winPctZ = calculateZScore(weightedWinPct, winPctMean, winPctStdDev, false);
      
      if ((debugMode && playerName) || isDebugQB) {
        console.log(`🔍 WIN PCT Z-SCORE: Population mean=${winPctMean.toFixed(3)}, stdDev=${winPctStdDev.toFixed(3)}, ${playerName} winPct=${weightedWinPct.toFixed(3)} → z=${winPctZ.toFixed(3)}`);
        console.log(`🔍 Population size: ${winPctValues.length} QBs`);
      }
    } else {
      // Fallback to hardcoded values if no population data available
      if (isDebugQB) {
        console.log(`🔍 ⚠️ NO POPULATION DATA FOUND - Using fallback hardcoded values`);
      }
      const winPctMean = 0.5;
      const winPctStdDev = 0.12;
      winPctZ = calculateZScore(weightedWinPct, winPctMean, winPctStdDev, false);
    }
  } else {
    // Fallback to hardcoded values if allQBData not provided
    if (isDebugQB) {
      console.log(`🔍 ⚠️ allQBData NOT PROVIDED - Using fallback hardcoded values`);
    }
    const winPctMean = 0.5;
    const winPctStdDev = 0.12;
    winPctZ = calculateZScore(weightedWinPct, winPctMean, winPctStdDev, false);
  }
  
  // weightedOffenseDVOA is now a z-score from calculateOffensiveDVOAScore
  const offenseDVOAZ = weightedOffenseDVOA;
  
  // Playoff score: convert from 0-15 scale to z-score
  // Assume mean playoff score = 5, stdDev = 4
  const playoffMean = 5;
  const playoffStdDev = 4;
  const careerPlayoffZ = calculateZScore(normalizedCareerPlayoffScore, playoffMean, playoffStdDev, false);

  // Use the provided teamWeights for weighted z-score combination
  const teamComponentZScores = {
    regularSeason: winPctZ,
    offenseDVOA: offenseDVOAZ, 
    playoff: careerPlayoffZ
  };

  // Calculate hierarchical z-score composite
  const teamCompositeZScore = calculateHierarchicalScore(teamComponentZScores, teamWeights);
  
  // Apply playoff adjustment to the composite z-score
  const adjustedTeamCompositeZScore = teamCompositeZScore * playoffAdjustmentFactor;
  
  // Return z-score (not percentile) for higher-level composite calculation
  
  // Debug final calculation
  if ((debugMode && playerName) || isDebugQB) {
    console.log(`🔍 TEAM Z-SCORE CALCULATION:`);
    console.log(`🔍   Regular Season Z: ${winPctZ.toFixed(3)} (weight: ${teamWeights.regularSeason || 0}%)`);
    console.log(`🔍   Offense DVOA Z: ${offenseDVOAZ.toFixed(3)} (weight: ${teamWeights.offenseDVOA || 0}%)`);
    console.log(`🔍   Career Playoff Z: ${careerPlayoffZ.toFixed(3)} (weight: ${teamWeights.playoff || 0}%)`);
    console.log(`🔍   Composite Z-Score: ${teamCompositeZScore.toFixed(3)}`);
    console.log(`🔍   Playoff Adjustment: ${teamCompositeZScore.toFixed(3)} × ${playoffAdjustmentFactor.toFixed(3)} = ${adjustedTeamCompositeZScore.toFixed(3)}`);
    console.log(`🔍 ========== END ${playerName} ==========\n`);
  }

  // Debug for Mahomes and other elite playoff QBs
  if (qbData.years && Object.values(qbData.years)[0]?.Player?.includes('Mahomes')) {
    console.log(`🏆 MAHOMES TEAM Z-SCORE: RegSeason(${winPctZ.toFixed(2)}) + DVOA(${offenseDVOAZ.toFixed(2)}) + Career(${careerPlayoffZ.toFixed(2)}) × Playoff(${playoffAdjustmentFactor.toFixed(3)}) = ${adjustedTeamCompositeZScore.toFixed(2)}`);
    console.log(`🏆 PLAYOFF DATA ${includePlayoffs ? 'ADJUSTMENT APPLIED' : 'EXCLUDED'} - Filter Year: ${filterYear || 'all'}`);
  }

  // Debug for Hurts and other Super Bowl winners
  if (qbData.years && Object.values(qbData.years)[0]?.Player?.includes('Hurts')) {
    console.log(`🏆 HURTS TEAM Z-SCORE: RegSeason(${winPctZ.toFixed(2)}) + DVOA(${offenseDVOAZ.toFixed(2)}) + Career(${careerPlayoffZ.toFixed(2)}) × Playoff(${playoffAdjustmentFactor.toFixed(3)}) = ${adjustedTeamCompositeZScore.toFixed(2)}`);
    console.log(`🏆 SUPER BOWL WINNER: Raw Career Score(${normalizedCareerPlayoffScore.toFixed(1)})`);
  }
  
  // Return composite z-score for higher-level calculation
  return adjustedTeamCompositeZScore;
};

// VALIDATION FUNCTION: Verify all 32 NFL teams are covered in DVOA data
export const validateTeamCoverage = () => {
  const requiredTeams = [
    'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 
    'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 
    'LAC', 'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG', 
    'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS'
  ];
  
  const alternativeTeams = [
    'GNB', 'KAN', 'WSH', 'SFO', 'TAM', 'LVR', 'NWE', 'NOR'
  ];
  
  console.log('=== TEAM COVERAGE VALIDATION ===');
  
  Object.entries(OFFENSIVE_DVOA_DATA).forEach(([year, yearData]) => {
    const availableTeams = Object.keys(yearData);
    const missingRequired = requiredTeams.filter(team => !availableTeams.includes(team));
    const presentAlternatives = alternativeTeams.filter(team => availableTeams.includes(team));
    
    console.log(`${year}:`);
    console.log(`  ✅ Required teams: ${32 - missingRequired.length}/32`);
    if (missingRequired.length > 0) {
      console.log(`  ❌ Missing: ${missingRequired.join(', ')}`);
    }
    console.log(`  🔄 Alternative abbreviations: ${presentAlternatives.join(', ')}`);
    console.log(`  📊 Total teams in data: ${availableTeams.length}`);
  });
  
  console.log('=== END VALIDATION ===');
};

// Auto-run validation on module load
validateTeamCoverage();