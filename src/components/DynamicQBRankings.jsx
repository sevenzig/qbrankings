import React, { useState, useEffect } from 'react';

const DynamicQBRankings = () => {
  const [qbData, setQbData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [weights, setWeights] = useState({
    team: 30,
    stats: 40,
    clutch: 15,
    durability: 10,
    support: 5
  });
  const [currentPreset, setCurrentPreset] = useState('balanced');

  // Cache duration: 15 minutes
  const CACHE_DURATION = 15 * 60 * 1000;

  // Statistical Scaling Constants - Based on CSV data analysis
  const SCALING_RANGES = {
    // Efficiency Metrics
    PASSER_RATING: { threshold: 75, scale: 1.8, max: 25 }, // 75+ rating gets points
    ANY_A: { threshold: 4.5, scale: 7, max: 35 }, // 4.5+ ANY/A gets points
    Y_A: { threshold: 6.0, scale: 5, max: 15 }, // 6.0+ Y/A gets points
    
    // Percentage Metrics  
    TD_PCT: { threshold: 3.0, scale: 4, max: 20 }, // 3.0%+ TD rate
    INT_PCT: { threshold: 3.5, scale: -6, max: 15 }, // Lower INT% is better
    SUCCESS_RATE: { threshold: 40, scale: 0.5, max: 10 }, // 40%+ success rate
    SACK_PCT: { threshold: 12, scale: -3, max: 30 }, // Lower sack% is better
    
    // Volume Metrics
    PASSING_YARDS: { threshold: 3000, scale: 0.000005, max: 8 }, // 3000+ yards
    PASSING_TDS: { threshold: 20, scale: 0.3, max: 7 }, // 20+ TDs
    
    // Clutch Metrics
    GWD_TOTAL: { scale: 10, max: 50 }, // 10 points per GWD, max 50
    FOURTH_QC: { scale: 7.5, max: 30 }, // 7.5 points per 4QC, max 30
    CLUTCH_RATE: { scale: 50, max: 20 }, // GWD per game rate
    
    // Win Percentage
    WIN_PCT_CURVE: 0.6, // Exponential curve favoring winners
    AVAILABILITY_WEIGHT: 20 // Games started bonus
  };

  useEffect(() => {
    fetchAllQBData();
  }, []);

  const shouldRefreshData = () => {
    if (!lastFetch) return true;
    return Date.now() - lastFetch > CACHE_DURATION;
  };

  // CSV parsing functions
  const parseCSV = (csvText) => {
    if (!csvText || csvText.trim().length === 0) {
      console.warn('Empty CSV text provided');
      return [];
    }
    
    const lines = csvText.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      console.warn('No lines found in CSV');
      return [];
    }
    
    console.log(`🔍 CSV has ${lines.length} lines`);
    
    const headers = lines[0].split(',').map(h => h.trim());
    console.log('🔍 Headers found:', headers);
    
    const dataRows = lines.slice(1)
      .map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((header, headerIndex) => {
          obj[header] = values[headerIndex] || '';
        });
        
        // IMPORTANT FIX: Handle duplicate 'Yds' columns and extract all missing data
        // Column 11 = Passing Yards (what we want)
        // Column 17 = Succ% (Success Rate)
        // Column 25 = Sack Yards (what we were accidentally getting)  
        // Column 27 = Sk% (Sack Percentage)
        // Column 29 = ANY/A (Adjusted Net Yards per Attempt)
        // Column 30 = 4QC (4th Quarter Comebacks)
        // Column 31 = GWD (Game Winning Drives)
        // Look for additional rushing columns if present
        if (values.length > 30) {
          obj.PassingYds = values[11] || '0';  // Force passing yards
          obj.SuccessRate = values[17] || '0'; // Success rate (column 18, index 17)
          obj.SackYds = values[25] || '0';     // Separate sack yards
          obj.SackPct = values[27] || '0';     // Sack percentage (column 28, index 27)
          obj.AnyPerAttempt = values[29] || '0'; // ANY/A (column 30, index 29)
          obj.ClutchFourthQC = values[30] || '0'; // 4th Quarter Comebacks (column 31, index 30)
          obj.ClutchGWD = values[31] || '0';     // Game Winning Drives (column 32, index 31)
          
          // Check for rushing stats in extended columns (if available)
          if (values.length > 35) {
            obj.RushingAtt = values[32] || '0';   // Rushing attempts
            obj.RushingYds = values[33] || '0';   // Rushing yards  
            obj.RushingTDs = values[34] || '0';   // Rushing touchdowns
            obj.RushingYPA = values[35] || '0';   // Rushing yards per attempt
          }
        }
        
        // Debug first few rows
        if (index < 3) {
          console.log(`🔍 Row ${index + 1}:`, obj);
        }
        
        return obj;
      })
      .filter(obj => {
        // More lenient filtering - just check if Player field exists and isn't empty
        const hasPlayer = obj.Player && obj.Player.trim() !== '' && obj.Player !== 'Player';
        if (!hasPlayer && obj.Player) {
          console.log('🔍 Filtered out row with Player:', obj.Player);
        }
        return hasPlayer;
      });
    
    console.log(`🔍 Parsed ${dataRows.length} valid data rows`);
    return dataRows;
  };

  const parseQBRecord = (qbRecord) => {
    if (!qbRecord || qbRecord === '') {
      return { wins: 0, losses: 0, winPercentage: 0 };
    }
    
    const parts = qbRecord.split('-');
    const wins = parseInt(parts[0]) || 0;
    const losses = parseInt(parts[1]) || 0;
    const ties = parseInt(parts[2]) || 0;
    
    const totalGames = wins + losses + ties;
    const winPercentage = totalGames > 0 ? wins / totalGames : 0;
    
    return { wins, losses, winPercentage };
  };

  const getTeamInfo = (teamAbbr) => {
    const teamMap = {
      'ARI': { id: '22', name: 'Arizona Cardinals', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png' },
      'ATL': { id: '1', name: 'Atlanta Falcons', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png' },
      'BAL': { id: '33', name: 'Baltimore Ravens', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png' },
      'BUF': { id: '2', name: 'Buffalo Bills', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png' },
      'CAR': { id: '29', name: 'Carolina Panthers', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png' },
      'CHI': { id: '3', name: 'Chicago Bears', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png' },
      'CIN': { id: '4', name: 'Cincinnati Bengals', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png' },
      'CLE': { id: '5', name: 'Cleveland Browns', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png' },
      'DAL': { id: '6', name: 'Dallas Cowboys', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png' },
      'DEN': { id: '7', name: 'Denver Broncos', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png' },
      'DET': { id: '8', name: 'Detroit Lions', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png' },
      'GB': { id: '9', name: 'Green Bay Packers', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png' },
      'GNB': { id: '9', name: 'Green Bay Packers', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png' },
      'HOU': { id: '34', name: 'Houston Texans', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png' },
      'IND': { id: '11', name: 'Indianapolis Colts', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png' },
      'JAX': { id: '30', name: 'Jacksonville Jaguars', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png' },
      'KC': { id: '12', name: 'Kansas City Chiefs', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png' },
      'KAN': { id: '12', name: 'Kansas City Chiefs', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png' },
      'LV': { id: '13', name: 'Las Vegas Raiders', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png' },
      'LVR': { id: '13', name: 'Las Vegas Raiders', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png' },
      'LAC': { id: '24', name: 'Los Angeles Chargers', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png' },
      'LAR': { id: '14', name: 'Los Angeles Rams', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png' },
      'MIA': { id: '15', name: 'Miami Dolphins', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png' },
      'MIN': { id: '16', name: 'Minnesota Vikings', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png' },
      'NE': { id: '17', name: 'New England Patriots', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png' },
      'NWE': { id: '17', name: 'New England Patriots', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png' },
      'NO': { id: '18', name: 'New Orleans Saints', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png' },
      'NOR': { id: '18', name: 'New Orleans Saints', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png' },
      'NYG': { id: '19', name: 'New York Giants', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png' },
      'NYJ': { id: '20', name: 'New York Jets', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png' },
      'PHI': { id: '21', name: 'Philadelphia Eagles', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png' },
      'PIT': { id: '23', name: 'Pittsburgh Steelers', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png' },
      'SF': { id: '25', name: 'San Francisco 49ers', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png' },
      'SFO': { id: '25', name: 'San Francisco 49ers', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png' },
      'SEA': { id: '26', name: 'Seattle Seahawks', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png' },
      'TB': { id: '27', name: 'Tampa Bay Buccaneers', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png' },
      'TAM': { id: '27', name: 'Tampa Bay Buccaneers', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png' },
      'TEN': { id: '10', name: 'Tennessee Titans', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png' },
      'WSH': { id: '28', name: 'Washington Commanders', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png' },
      'WAS': { id: '28', name: 'Washington Commanders', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png' }
    };
    
    return teamMap[teamAbbr] || { id: '0', name: teamAbbr, logo: '' };
  };

  const combinePlayerDataAcrossYears = (qbs2024, qbs2023, qbs2022, playoffQbs2024, playoffQbs2023, playoffQbs2022, rushingQbs2024, rushingQbs2023, rushingQbs2022, rushingPlayoffQbs2024, rushingPlayoffQbs2023, rushingPlayoffQbs2022) => {
    const playerData = {};
    
    // Process each year of data
    const yearsData = [
      { year: 2024, data: qbs2024 },
      { year: 2023, data: qbs2023 },
      { year: 2022, data: qbs2022 }
    ];
    
    yearsData.forEach(({ year, data }) => {
      data.forEach(qb => {
        // Only process quarterbacks with valid data
        if (qb.Pos !== 'QB' || !qb.Player || !qb.Team || qb.Team.length > 3) {
          return;
        }
        
        const playerName = qb.Player.trim();
        const gamesStarted = parseInt(qb.GS) || 0;
        
        // Include ALL games from ALL seasons - no minimum threshold
        
        // Debug specific players
        if (playerName.includes('Mahomes')) {
          console.log(`✅ MAHOMES ${year} PASSING: ${parseInt(qb.PassingYds) || 0} yards, ${parseInt(qb.TD) || 0} TDs`);
        }
        if (playerName.includes('Rodgers')) {
          console.log(`✅ RODGERS ${year} PASSING: ${gamesStarted} games started, ${parseInt(qb.PassingYds) || 0} yards, ${parseInt(qb.TD) || 0} TDs`);
        }
        
        if (!playerData[playerName]) {
          playerData[playerName] = {
            seasons: [],
            career: {
              seasons: 0,
              gamesStarted: 0,
              wins: 0,
              losses: 0,
              winPercentage: 0,
              passingYards: 0,
              passingTDs: 0,
              interceptions: 0,
              fumbles: 0,
              completions: 0,
              attempts: 0,
              avgPasserRating: 0,
              totalPasserRatingPoints: 0
            }
          };
        }
        
        const qbRecord = parseQBRecord(qb.QBrec);
        const passerRating = parseFloat(qb.Rate) || 0;
        const yearYards = parseInt(qb.PassingYds) || 0;  // Use PassingYds which correctly extracts column 12
        const yearTDs = parseInt(qb.TD) || 0;
        
        // Add season data
        playerData[playerName].seasons.push({
          year,
          team: qb.Team,
          age: parseInt(qb.Age) || 25,
          gamesStarted,
          wins: qbRecord.wins,
          losses: qbRecord.losses,
          winPercentage: qbRecord.winPercentage,
          passingYards: yearYards,
          passingTDs: yearTDs,
          interceptions: parseInt(qb.Int) || 0,
          completions: parseInt(qb.Cmp) || 0,
          attempts: parseInt(qb.Att) || 0,
          passerRating,
          successRate: parseFloat(qb.SuccessRate) || 0,
          sackPercentage: parseFloat(qb.SackPct) || 0,
          anyPerAttempt: parseFloat(qb.AnyPerAttempt) || 0,
          gameWinningDrives: parseInt(qb.ClutchGWD) || 0,
          fourthQuarterComebacks: parseInt(qb.ClutchFourthQC) || 0
        });
        
        // Update career totals
        const career = playerData[playerName].career;
        career.seasons++;
        career.gamesStarted += gamesStarted;
        career.wins += qbRecord.wins;
        career.losses += qbRecord.losses;
        career.passingYards += yearYards;
        career.passingTDs += yearTDs;
        career.interceptions += parseInt(qb.Int) || 0;
        career.completions += parseInt(qb.Cmp) || 0;
        career.attempts += parseInt(qb.Att) || 0;
        
        // Debug career accumulation
        if (playerName.includes('Mahomes')) {
          console.log(`✅ MAHOMES ${year} PASSING: ${yearYards} yards added, career total now: ${career.passingYards}`);
        }
        if (playerName.includes('Rodgers')) {
          console.log(`✅ RODGERS ${year} PASSING: ${gamesStarted} games added, career games now: ${career.gamesStarted}`);
        }
        
        // Track passer rating for averaging (weighted by games started)
        if (passerRating > 0) {
          career.totalPasserRatingPoints += passerRating * gamesStarted;
        }
      });
    });

    // Process playoff data separately with higher clutch weighting
    const playoffYearsData = [
      { year: 2024, data: playoffQbs2024 },
      { year: 2023, data: playoffQbs2023 },
      { year: 2022, data: playoffQbs2022 }
    ];

    playoffYearsData.forEach(({ year, data }) => {
      data.forEach(qb => {
        // Only process quarterbacks with valid data
        if (qb.Pos !== 'QB' || !qb.Player || !qb.Team || qb.Team.length > 3) {
          return;
        }
        
        const playerName = qb.Player.trim();
        
        // Only add playoff data if the player already exists (played regular season)
        if (!playerData[playerName]) return;
        
        const qbRecord = parseQBRecord(qb.QBrec);
        const gamesStarted = parseInt(qb.GS) || 0;
        const gamesPlayed = parseInt(qb.G) || 0;
        
        // Add playoff data to the existing regular season data for this year
        const existingSeasonIndex = playerData[playerName].seasons.findIndex(s => s.year === year);
        if (existingSeasonIndex >= 0) {
          const season = playerData[playerName].seasons[existingSeasonIndex];
          
                     // Add playoff-specific data
           season.playoffData = {
             gamesPlayed: gamesPlayed,
             gamesStarted: gamesStarted,
             wins: qbRecord.wins,
             losses: qbRecord.losses,
             winPercentage: qbRecord.winPercentage,
             passingYards: parseInt(qb.PassingYds) || 0,
             passingTDs: parseInt(qb.TD) || 0,
             interceptions: parseInt(qb.Int) || 0,
             attempts: parseInt(qb.Att) || 0,
             completions: parseInt(qb.Cmp) || 0,
             passerRating: parseFloat(qb.Rate) || 0,
             gameWinningDrives: parseInt(qb.ClutchGWD) || 0,
             fourthQuarterComebacks: parseInt(qb.ClutchFourthQC) || 0,
             anyPerAttempt: parseFloat(qb.AnyPerAttempt) || 0,
             successRate: parseFloat(qb.SuccessRate) || 0,
             sackPercentage: parseFloat(qb.SackPct) || 0
           };
          
          // Debug playoff data for Mahomes
          if (playerName.includes('Mahomes')) {
            console.log(`🏆 MAHOMES ${year} PLAYOFFS: ${season.playoffData.gamesPlayed} games, ${season.playoffData.gameWinningDrives} GWD, ${season.playoffData.fourthQuarterComebacks} 4QC`);
          }
        }
      });
    });
    
    // Process rushing data for regular season
    const rushingYearsData = [
      { year: 2024, data: rushingQbs2024 },
      { year: 2023, data: rushingQbs2023 },
      { year: 2022, data: rushingQbs2022 }
    ];

    rushingYearsData.forEach(({ year, data }) => {
      data.forEach(qb => {
        // Only process quarterbacks with valid data - rushing CSV uses Pos▲ column
        const position = qb.Pos || qb['Pos▲'] || '';
        if (position !== 'QB' || !qb.Player || !qb.Team || qb.Team.length > 3) {
          return;
        }
        
        const playerName = qb.Player.trim();
        
        // Only add rushing data if the player already exists (played regular season passing)
        if (!playerData[playerName]) return;
        
        // Add rushing data to the existing regular season data for this year
        const existingSeasonIndex = playerData[playerName].seasons.findIndex(s => s.year === year);
        if (existingSeasonIndex >= 0) {
          const season = playerData[playerName].seasons[existingSeasonIndex];
          
          // Add rushing statistics
          season.rushingYards = parseInt(qb.Yds) || 0;
          season.rushingTDs = parseInt(qb.TD) || 0;
          season.rushingAttempts = parseInt(qb.Att) || 0;
          season.fumbles = parseInt(qb.Fmb) || 0;
          
          // Update career rushing totals
          const career = playerData[playerName].career;
          career.rushingYards = (career.rushingYards || 0) + season.rushingYards;
          career.rushingTDs = (career.rushingTDs || 0) + season.rushingTDs;
          career.fumbles = (career.fumbles || 0) + season.fumbles;
          
          // Debug for mobile QBs and Mahomes
          if (season.rushingYards > 200 || playerName.includes('Mahomes')) {
            console.log(`🏃 RUSHING ${playerName} ${year}: ${season.rushingYards} yards, ${season.rushingTDs} TDs, ${season.fumbles} fumbles`);
            if (playerName.includes('Mahomes')) {
              console.log(`🏃 MAHOMES ${year} RUSHING: ${season.rushingYards} yards added, career rushing total now: ${career.rushingYards}`);
            }
          }
        }
      });
    });

    // Process rushing playoff data
    const rushingPlayoffYearsData = [
      { year: 2024, data: rushingPlayoffQbs2024 },
      { year: 2023, data: rushingPlayoffQbs2023 },
      { year: 2022, data: rushingPlayoffQbs2022 }
    ];

    rushingPlayoffYearsData.forEach(({ year, data }) => {
      data.forEach(qb => {
        // Only process quarterbacks with valid data - rushing CSV uses Pos▲ column
        const position = qb.Pos || qb['Pos▲'] || '';
        if (position !== 'QB' || !qb.Player || !qb.Team || qb.Team.length > 3) {
          return;
        }
        
        const playerName = qb.Player.trim();
        
        // Only add rushing playoff data if the player already exists
        if (!playerData[playerName]) return;
        
        // Add rushing playoff data to the existing season
        const existingSeasonIndex = playerData[playerName].seasons.findIndex(s => s.year === year);
        if (existingSeasonIndex >= 0) {
          const season = playerData[playerName].seasons[existingSeasonIndex];
          
          // Ensure playoff data exists
          if (!season.playoffData) {
            season.playoffData = {};
          }
          
          // Add rushing playoff statistics
          season.playoffData.rushingYards = parseInt(qb.Yds) || 0;
          season.playoffData.rushingTDs = parseInt(qb.TD) || 0;
          season.playoffData.rushingAttempts = parseInt(qb.Att) || 0;
          season.playoffData.fumbles = parseInt(qb.Fmb) || 0;
          
          // Debug rushing playoff data for mobile QBs
          if (season.playoffData.rushingYards > 50) {
            console.log(`🏃🏆 PLAYOFF RUSHING ${playerName} ${year}: ${season.playoffData.rushingYards} yards, ${season.playoffData.rushingTDs} TDs`);
          }
        }
      });
    });
    
    // Calculate final career averages
    Object.values(playerData).forEach(player => {
      const career = player.career;
      const totalGames = career.gamesStarted;
      
      // Calculate win percentage
      const totalDecisionGames = career.wins + career.losses;
      career.winPercentage = totalDecisionGames > 0 ? career.wins / totalDecisionGames : 0;
      
      // Calculate weighted average passer rating
      career.avgPasserRating = totalGames > 0 ? career.totalPasserRatingPoints / totalGames : 0;
      
      // Sort seasons by year (most recent first)
      player.seasons.sort((a, b) => b.year - a.year);
      
      // Debug final Mahomes data (simplified)
      if (player.seasons.some(s => s.team === 'KAN')) {
        console.log(`✅ MAHOMES FINAL CAREER: Passing=${career.passingYards}, Rushing=${career.rushingYards || 0}, Total=${career.passingYards + (career.rushingYards || 0)} yards over ${career.gamesStarted} games`);
      }
    });
    
    return playerData;
  };

  const fetchAllQBData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading QB data from CSV files...');
      
      // Load CSV data files (regular season + playoffs + rushing)
      const response2024 = await fetch('/data/2024.csv');
      const response2023 = await fetch('/data/2023.csv');
      const response2022 = await fetch('/data/2022.csv');
      const responsePlayoffs2024 = await fetch('/data/2024playoffs.csv');
      const responsePlayoffs2023 = await fetch('/data/2023playoffs.csv');
      const responsePlayoffs2022 = await fetch('/data/2022playoffs.csv');
      const responseRushing2024 = await fetch('/data/2024qbrushing.csv');
      const responseRushing2023 = await fetch('/data/2023qbrushing.csv');
      const responseRushing2022 = await fetch('/data/2022qbrushing.csv');
      const responseRushingPlayoffs2024 = await fetch('/data/2024qbrushingplayoffs.csv');
      const responseRushingPlayoffs2023 = await fetch('/data/2023qbrushingplayoffs.csv');
      const responseRushingPlayoffs2022 = await fetch('/data/2022qbrushingplayoffs.csv');
      
      if (!response2024.ok) throw new Error('Failed to load 2024 data');
      if (!response2023.ok) throw new Error('Failed to load 2023 data');
      if (!response2022.ok) throw new Error('Failed to load 2022 data');
      if (!responsePlayoffs2024.ok) throw new Error('Failed to load 2024 playoff data');
      if (!responsePlayoffs2023.ok) throw new Error('Failed to load 2023 playoff data');
      if (!responsePlayoffs2022.ok) throw new Error('Failed to load 2022 playoff data');
      if (!responseRushing2024.ok) throw new Error('Failed to load 2024 rushing data');
      if (!responseRushing2023.ok) throw new Error('Failed to load 2023 rushing data');
      if (!responseRushing2022.ok) throw new Error('Failed to load 2022 rushing data');
      if (!responseRushingPlayoffs2024.ok) throw new Error('Failed to load 2024 playoff rushing data');
      if (!responseRushingPlayoffs2023.ok) throw new Error('Failed to load 2023 playoff rushing data');
      if (!responseRushingPlayoffs2022.ok) throw new Error('Failed to load 2022 playoff rushing data');
      
      const csv2024 = await response2024.text();
      const csv2023 = await response2023.text();
      const csv2022 = await response2022.text();
      const csvPlayoffs2024 = await responsePlayoffs2024.text();
      const csvPlayoffs2023 = await responsePlayoffs2023.text();
      const csvPlayoffs2022 = await responsePlayoffs2022.text();
      const csvRushing2024 = await responseRushing2024.text();
      const csvRushing2023 = await responseRushing2023.text();
      const csvRushing2022 = await responseRushing2022.text();
      const csvRushingPlayoffs2024 = await responseRushingPlayoffs2024.text();
      const csvRushingPlayoffs2023 = await responseRushingPlayoffs2023.text();
      const csvRushingPlayoffs2022 = await responseRushingPlayoffs2022.text();
      
      console.log('✅ CSV files loaded successfully');
      
      // Debug: Check raw CSV content
      console.log('🔍 Raw CSV 2024 length:', csv2024.length);
      console.log('🔍 Raw CSV 2024 first 200 chars:', csv2024.substring(0, 200));
      console.log('🔍 Raw CSV 2024 first line:', csv2024.split('\n')[0]);
      
      // Parse CSV data from all three years (regular season + playoffs + rushing)
      const qbs2024 = parseCSV(csv2024);
      const qbs2023 = parseCSV(csv2023);
      const qbs2022 = parseCSV(csv2022);
      const playoffQbs2024 = parseCSV(csvPlayoffs2024);
      const playoffQbs2023 = parseCSV(csvPlayoffs2023);
      const playoffQbs2022 = parseCSV(csvPlayoffs2022);
      const rushingQbs2024 = parseCSV(csvRushing2024);
      const rushingQbs2023 = parseCSV(csvRushing2023);
      const rushingQbs2022 = parseCSV(csvRushing2022);
      const rushingPlayoffQbs2024 = parseCSV(csvRushingPlayoffs2024);
      const rushingPlayoffQbs2023 = parseCSV(csvRushingPlayoffs2023);
      const rushingPlayoffQbs2022 = parseCSV(csvRushingPlayoffs2022);
      
      console.log(`📊 Parsed regular season data: ${qbs2024.length} QBs in 2024, ${qbs2023.length} in 2023, ${qbs2022.length} in 2022`);
      console.log(`🏆 Parsed playoff data: ${playoffQbs2024.length} QBs in 2024 playoffs, ${playoffQbs2023.length} in 2023 playoffs, ${playoffQbs2022.length} in 2022 playoffs`);
      console.log(`🏃 Parsed rushing data: ${rushingQbs2024.length} QBs in 2024, ${rushingQbs2023.length} in 2023, ${rushingQbs2022.length} in 2022`);
      console.log(`🏃🏆 Parsed playoff rushing data: ${rushingPlayoffQbs2024.length} QBs in 2024, ${rushingPlayoffQbs2023.length} in 2023, ${rushingPlayoffQbs2022.length} in 2022`);
      
      // Debug: Check first few rows of parsed data
      console.log('🔍 Debug - First 3 rows of 2024 data:', qbs2024.slice(0, 3));
      console.log('🔍 Debug - Available columns:', Object.keys(qbs2024[0] || {}));
      
      // Combine regular season, playoff, and rushing data from all years by player name
      const combinedQBData = combinePlayerDataAcrossYears(
        qbs2024, qbs2023, qbs2022,
        playoffQbs2024, playoffQbs2023, playoffQbs2022,
        rushingQbs2024, rushingQbs2023, rushingQbs2022,
        rushingPlayoffQbs2024, rushingPlayoffQbs2023, rushingPlayoffQbs2022
      );
      
      console.log(`📊 Combined data for ${Object.keys(combinedQBData).length} unique quarterbacks across 3 seasons`);
      
      // Convert combined data to our QB format
      const processedQBs = Object.entries(combinedQBData)
        .filter(([playerName, data]) => {
          // Filter for QBs with meaningful career data
          const totalGames = data.career.gamesStarted;
          const hasRecentActivity = data.seasons.some(season => season.year >= 2023);
          return totalGames >= 10 && hasRecentActivity; // At least 10 career starts and active recently
        })
        .map(([playerName, data], index) => {
          const mostRecentSeason = data.seasons[0]; // Already sorted by year desc
          const teamInfo = getTeamInfo(mostRecentSeason.team);
          
          return {
            id: `qb-${index + 1}`,
            name: playerName,
            team: mostRecentSeason.team,
            teamId: teamInfo.id,
            teamName: teamInfo.name,
            teamLogo: teamInfo.logo,
            jerseyNumber: '',
            experience: data.career.seasons,
            age: mostRecentSeason.age,
            wins: data.career.wins,
            losses: data.career.losses,
            winPercentage: data.career.winPercentage,
            combinedRecord: `${data.career.wins}-${data.career.losses} (${data.career.winPercentage.toFixed(3)})`,
            stats: {
              gamesStarted: data.career.gamesStarted,
              // Per-game averages - total yards, TDs, and turnovers (pass + rush)
              yardsPerGame: data.career.gamesStarted > 0 ? 
                (data.career.passingYards + (data.career.rushingYards || 0)) / data.career.gamesStarted : 0,
              tdsPerGame: data.career.gamesStarted > 0 ? 
                (data.career.passingTDs + (data.career.rushingTDs || 0)) / data.career.gamesStarted : 0,
              turnoversPerGame: data.career.gamesStarted > 0 ? 
                (data.career.interceptions + (data.career.fumbles || 0)) / data.career.gamesStarted : 0,
              // Keep some totals for reference
              totalYards: data.career.passingYards + (data.career.rushingYards || 0),
              totalTDs: data.career.passingTDs + (data.career.rushingTDs || 0),
              totalTurnovers: data.career.interceptions + (data.career.fumbles || 0),
              passerRating: data.career.avgPasserRating
            },
            // Add season breakdown for detailed view
            seasonData: data.seasons,
            stats2024: `3-Year Avg: ${((data.career.passingYards + (data.career.rushingYards || 0)) / Math.max(1, data.career.gamesStarted)).toFixed(1)} yds/g, ${((data.career.passingTDs + (data.career.rushingTDs || 0)) / Math.max(1, data.career.gamesStarted)).toFixed(2)} TDs/g, ${((data.career.interceptions + (data.career.fumbles || 0)) / Math.max(1, data.career.gamesStarted)).toFixed(2)} TO/g`
          };
          
          // Debug Mahomes final calculation
          if (playerName.includes('Mahomes')) {
            const totalYards = data.career.passingYards + (data.career.rushingYards || 0);
            const totalTDs = data.career.passingTDs + (data.career.rushingTDs || 0);
            const totalTurnovers = data.career.interceptions + (data.career.fumbles || 0);
            const yardsPerGame = totalYards / data.career.gamesStarted;
            console.log(`🎯 MAHOMES FINAL CALC: Pass(${data.career.passingYards}) + Rush(${data.career.rushingYards || 0}) = ${totalYards} total yards over ${data.career.gamesStarted} games = ${yardsPerGame.toFixed(1)} yds/g`);
            console.log(`🎯 MAHOMES FINAL TDs: Pass(${data.career.passingTDs}) + Rush(${data.career.rushingTDs || 0}) = ${totalTDs} total TDs = ${(totalTDs / data.career.gamesStarted).toFixed(2)} TDs/g`);
            console.log(`🎯 MAHOMES FINAL TOs: Int(${data.career.interceptions}) + Fum(${data.career.fumbles || 0}) = ${totalTurnovers} total TOs = ${(totalTurnovers / data.career.gamesStarted).toFixed(2)} TOs/g`);
          }
          
          return qbObject;
        });
      
      // Calculate QEI metrics
      const qbsWithMetrics = processedQBs.map(qb => calculateQBMetrics(qb));
      
      setQbData(qbsWithMetrics);
      setLastFetch(Date.now());
      setLoading(false);
      
      console.log(`✅ Successfully processed ${qbsWithMetrics.length} quarterbacks`);
      
    } catch (error) {
      console.error('❌ Error loading QB data from CSV:', error);
      setError(`Failed to load QB data: ${error.message}`);
      setLoading(false);
    }
  };

  const calculateQBMetrics = (qb) => {
    // Create season data structure for enhanced calculations
    const qbSeasonData = {
      years: {}
    };
    
    // Convert season data to expected format (including playoff data)
    if (qb.seasonData && qb.seasonData.length > 0) {
      qb.seasonData.forEach(season => {
        qbSeasonData.years[season.year] = {
          // Regular season data
          G: season.gamesStarted,
          GS: season.gamesStarted,
          QBrec: `${season.wins}-${season.losses}-0`,
          Rate: season.passerRating,
          'ANY/A': season.anyPerAttempt || 0,
          'TD%': season.passingTDs / Math.max(1, season.attempts) * 100,
          'Int%': season.interceptions / Math.max(1, season.attempts) * 100,
          'Succ%': season.successRate || 0,
          'Sk%': season.sackPercentage || 0,
          Yds: season.passingYards,
          TD: season.passingTDs,
          GWD: season.gameWinningDrives || 0,
          '4QC': season.fourthQuarterComebacks || 0,
          Team: season.team,
          Player: qb.name,
          Age: season.age,
          
          // Add rushing data
          RushingYds: season.rushingYards || 0,
          RushingTDs: season.rushingTDs || 0,
          Fumbles: season.fumbles || 0,
          
          // Add playoff data if available
          playoffData: season.playoffData || null
        };
      });
    }

    const baseScores = {
      team: calculateTeamScore(qbSeasonData),
      stats: calculateStatsScore(qbSeasonData),
      clutch: calculateClutchScore(qbSeasonData),
      durability: calculateDurabilityScore(qbSeasonData),
      support: calculateSupportScore(qb) // Pass full QB object for multi-team support
    };

    return {
      ...qb,
      baseScores,
      qei: 0 // Will be calculated with current weights
    };
  };

  // Enhanced Team Success Score with Playoff Integration (0-100)
  const calculateTeamScore = (qbSeasonData) => {
    const yearWeights = { 2024: 0.55, 2023: 0.35, 2022: 0.10 };
    const PLAYOFF_WIN_BONUS = 1.5; // Playoff wins worth 1.5x regular season wins
    
    let weightedWinPct = 0;
    let weightedAvailability = 0;
    let playoffWinBonus = 0;
    let totalWeight = 0;
    
    Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
      const weight = yearWeights[year] || 0;
      if (weight === 0 || !data.QBrec) return;
      
      // Parse regular season QB record (format: "14-3-0")
      const [wins, losses, ties = 0] = data.QBrec.split('-').map(Number);
      let totalWins = wins;
      let totalGames = wins + losses + ties;
      
      // Add playoff performance if available
      if (data.playoffData) {
        const playoff = data.playoffData;
        const playoffWins = playoff.wins || 0;
        const playoffLosses = playoff.losses || 0;
        const playoffGames = playoffWins + playoffLosses;
        
        // Playoff wins get bonus weighting
        totalWins += playoffWins * PLAYOFF_WIN_BONUS;
        totalGames += playoffGames;
        
        // Additional playoff success bonus
        if (playoffGames > 0) {
          const playoffWinRate = playoffWins / playoffGames;
          playoffWinBonus += playoffWinRate * playoffGames * weight * 3; // Big bonus for playoff success
        }
        
        // Debug for Mahomes
        if (data.Player && data.Player.includes('Mahomes')) {
          console.log(`🏆 MAHOMES ${year} TEAM: Regular (${wins}-${losses}) + Playoff (${playoffWins}-${playoffLosses}), Total weighted wins: ${totalWins.toFixed(1)}`);
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
    
    // Win percentage with exponential curve (0-70 points, reduced to make room for playoff bonus)
    const winScore = Math.pow(weightedWinPct, SCALING_RANGES.WIN_PCT_CURVE) * 70;
    
    // Availability bonus (0-20 points)
    const availabilityScore = weightedAvailability * SCALING_RANGES.AVAILABILITY_WEIGHT;
    
    // Playoff success bonus (0-10 points)
    const playoffBonusScore = Math.min(10, playoffWinBonus);
    
    return Math.min(100, winScore + availabilityScore + playoffBonusScore);
  };

  // Enhanced Statistical Performance Score with Holistic Approach (0-100)
  const calculateStatsScore = (qbSeasonData) => {
    const yearWeights = { 2024: 0.55, 2023: 0.35, 2022: 0.10 };
    const PLAYOFF_STATS_WEIGHT = 1.25; // Playoff stats weighted 25% higher (pressure situations)
    
    // Holistic scoring weights - balanced approach for complete QB evaluation  
    let weightedScores = {
      efficiency: 0,      // ANY/A, Success Rate (30 points)
      productivity: 0,    // Per-game yards, TDs (35 points) 
      ballSecurity: 0,    // INT%, Sack avoidance, Turnover rate (25 points) - INCREASED
      playmaking: 0,      // Big play ability, Versatility (10 points)
    };
    let totalWeight = 0;
    
    Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
      const weight = yearWeights[year] || 0;
      if (weight === 0) return;
      
      // Calculate regular season stats first
      let totalAnyA = data['ANY/A'] || 0;
      let totalRating = data.Rate || 0;
      let totalTdPct = data['TD%'] || 0;
      let totalIntPct = data['Int%'] || 0;
      let totalPassingYards = data.Yds || 0;
      let totalPassingTDs = data.TD || 0;
      let totalSuccessRate = data['Succ%'] || 0;
      let totalSackPct = data['Sk%'] || 0;
      let totalGames = data.G || 1;
      
      // Initialize rushing stats (extract from CSV data)
      let totalRushingYards = data.RushingYds || 0;
      let totalRushingTDs = data.RushingTDs || 0;
      
      // Integrate playoff stats with bonus weighting if available
      if (data.playoffData) {
        const playoff = data.playoffData;
        const playoffGames = playoff.gamesPlayed || 0;
        
        if (playoffGames > 0) {
          // Weight playoff stats higher and combine with regular season
          const regularGames = data.G || 0;
          const combinedGames = regularGames + playoffGames;
          
          // Calculate weighted averages (playoff stats get bonus weight)
          const playoffAnyA = (playoff.anyPerAttempt || 0) * PLAYOFF_STATS_WEIGHT;
          const playoffRating = (playoff.passerRating || 0) * PLAYOFF_STATS_WEIGHT;
          const playoffSuccessRate = (playoff.successRate || 0) * PLAYOFF_STATS_WEIGHT;
          const playoffSackPct = (playoff.sackPercentage || 0) / PLAYOFF_STATS_WEIGHT; // Lower is better
          
          // For percentage stats, weight by games
          totalAnyA = regularGames > 0 ? 
            (totalAnyA * regularGames + playoffAnyA * playoffGames) / (regularGames + playoffGames * PLAYOFF_STATS_WEIGHT) : 
            playoffAnyA;
          
          totalRating = regularGames > 0 ? 
            (totalRating * regularGames + playoffRating * playoffGames) / (regularGames + playoffGames * PLAYOFF_STATS_WEIGHT) : 
            playoffRating;
            
          totalSuccessRate = regularGames > 0 ? 
            (totalSuccessRate * regularGames + playoffSuccessRate * playoffGames) / (regularGames + playoffGames * PLAYOFF_STATS_WEIGHT) : 
            playoffSuccessRate;
            
          totalSackPct = regularGames > 0 ? 
            (totalSackPct * regularGames + playoffSackPct * playoffGames) / (regularGames + playoffGames * PLAYOFF_STATS_WEIGHT) : 
            playoffSackPct;
          
          // For volume stats, add playoff production (weighted)
          totalPassingYards += (playoff.passingYards || 0) * PLAYOFF_STATS_WEIGHT;
          totalPassingTDs += (playoff.passingTDs || 0) * PLAYOFF_STATS_WEIGHT;
          totalRushingYards += (playoff.rushingYards || 0) * PLAYOFF_STATS_WEIGHT;
          totalRushingTDs += (playoff.rushingTDs || 0) * PLAYOFF_STATS_WEIGHT;
          
          // Recalculate TD% and INT% with combined data
          const totalAttempts = (data.Att || 0) + (playoff.attempts || 0);
          if (totalAttempts > 0) {
            totalTdPct = (totalPassingTDs / totalAttempts) * 100;
            totalIntPct = ((data.Int || 0) + (playoff.interceptions || 0)) / totalAttempts * 100;
          }
          
          totalGames = combinedGames;
          
          // Debug for Mahomes
          if (data.Player && data.Player.includes('Mahomes')) {
            console.log(`🏆 MAHOMES ${year} STATS: Regular (${data.Rate?.toFixed(1)} rating, ${data['ANY/A']?.toFixed(1)} ANY/A) + Playoff (${playoff.passerRating?.toFixed(1)} rating, ${playoff.anyPerAttempt?.toFixed(1)} ANY/A) = Combined (${totalRating.toFixed(1)} rating, ${totalAnyA.toFixed(1)} ANY/A)`);
          }
        }
      }
      
      // === HOLISTIC SCORING SYSTEM ===
      
      // Calculate per-game averages
      const gamesPlayed = Math.max(1, totalGames);
      const yardsPerGame = (totalPassingYards * 0.8 + totalRushingYards * 0.2) / gamesPlayed;
      const tdsPerGame = (totalPassingTDs + totalRushingTDs) / gamesPlayed;
      const yardsPerAttempt = (data.Att || 0) > 0 ? totalPassingYards / (data.Att || 1) : 0;
      
      // 1. EFFICIENCY (30 points) - Core QB metrics
      let efficiencyScore = 0;
      
      // ANY/A - Best overall efficiency metric (0-20 points)
      efficiencyScore += Math.max(0, Math.min(20, (totalAnyA - 4.0) * 5.0));
      
      // Success Rate - Consistent play effectiveness (0-10 points)
      efficiencyScore += Math.max(0, Math.min(10, (totalSuccessRate - 35) * 0.3));
      
      // 2. PRODUCTIVITY (35 points) - Per-game offensive production
      let productivityScore = 0;
      
      // Yards per game (75% passing, 25% rushing) (0-15 points)
      productivityScore += Math.max(0, Math.min(15, (yardsPerGame - 150) * 0.06));
      
      // TDs per game (passing + rushing) - HEAVILY WEIGHTED (0-20 points)
      productivityScore += Math.max(0, Math.min(20, (tdsPerGame - 0.5) * 10));
      
      // 3. BALL SECURITY (25 points) - Protecting possessions - INCREASED WEIGHT
      let ballSecurityScore = 0;
      
      // INT Rate - Lower is better, MORE HEAVILY PENALIZED (0-15 points)
      ballSecurityScore += Math.max(0, Math.min(15, (3.8 - totalIntPct) * 4.5)); // Increased penalty weight
      
      // Sack Avoidance - QB responsibility (0-6 points)
      ballSecurityScore += Math.max(0, Math.min(6, (10 - totalSackPct) * 0.6));
      
      // Turnover Rate - Additional penalty for high-turnover QBs (0-4 points)
      const totalInts = (data.Int || 0) + (data.playoffData?.interceptions || 0);
      const totalFumbles = (data.Fumbles || 0) + (data.playoffData?.fumbles || 0);
      const totalTurnovers = totalInts + totalFumbles;
      const turnoversPerGame = totalTurnovers / gamesPlayed;
      ballSecurityScore += Math.max(0, Math.min(4, (1.5 - turnoversPerGame) * 3)); // Heavy penalty for turnovers per game
      
      // 4. PLAYMAKING (10 points) - Big play ability and versatility
      let playmakingScore = 0;
      
      // TD Rate - Redzone efficiency (0-6 points)
      playmakingScore += Math.max(0, Math.min(6, (totalTdPct - 2.5) * 2.0));
      
      // Y/A - Big play potential (0-4 points)
      playmakingScore += Math.max(0, Math.min(4, (yardsPerAttempt - 6.0) * 2.0));
      
      // Debug for comparison of ball security between QBs
      if (data.Player && (turnoversPerGame >= 1.0 || tdsPerGame >= 2.0 || data.Player.includes('Mahomes') || data.Player.includes('Allen') || data.Player.includes('Mayfield') || data.Player.includes('Herbert') || data.Player.includes('Burrow'))) {
        const ballSecurityGrade = turnoversPerGame <= 1.0 ? 'EXCELLENT' : turnoversPerGame <= 1.5 ? 'GOOD' : turnoversPerGame <= 2.0 ? 'AVERAGE' : 'POOR';
        console.log(`📊 STATS ${data.Player} ${year}: ${yardsPerGame.toFixed(0)} ypg, ${tdsPerGame.toFixed(1)} td/g, ${turnoversPerGame.toFixed(2)} to/g (${ballSecurityGrade}) -> Ball Security: ${ballSecurityScore.toFixed(1)}/25`);
      }
      
      // Apply weight to each component
      weightedScores.efficiency += efficiencyScore * weight;
      weightedScores.productivity += productivityScore * weight;
      weightedScores.ballSecurity += ballSecurityScore * weight;
      weightedScores.playmaking += playmakingScore * weight;
      totalWeight += weight;
    });
    
    if (totalWeight === 0) return 0;
    
    // Normalize all scores by total weight
    Object.keys(weightedScores).forEach(key => {
      weightedScores[key] = weightedScores[key] / totalWeight;
    });
    
    return Object.values(weightedScores).reduce((sum, score) => sum + score, 0);
  };

  // Enhanced Clutch Performance Score with Playoff Weighting (0-100)
  const calculateClutchScore = (qbSeasonData) => {
    const yearWeights = { 2024: 0.55, 2023: 0.35, 2022: 0.10 };
    const PLAYOFF_MULTIPLIER = 3.0; // Playoff clutch moments worth 3x regular season
    
    let totalGWD = 0;
    let totalFourthQC = 0;
    let totalGames = 0;
    let totalPlayoffWins = 0;
    let totalPlayoffGames = 0;
    let weightSum = 0;
    
    Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
      const weight = yearWeights[year] || 0;
      if (weight === 0) return;
      
      // Regular season clutch stats
      const regularGWD = data.GWD || 0;
      const regularFourthQC = data['4QC'] || 0;
      const regularGames = data.G || 0;
      
      // Apply regular season with normal weighting
      totalGWD += regularGWD * weight;
      totalFourthQC += regularFourthQC * weight;
      totalGames += regularGames * weight;
      
      // Add playoff data with higher clutch weighting if available
      if (data.playoffData) {
        const playoff = data.playoffData;
        
        // Playoff GWD and 4QC are worth significantly more
        const playoffGWD = (playoff.gameWinningDrives || 0) * PLAYOFF_MULTIPLIER;
        const playoffFourthQC = (playoff.fourthQuarterComebacks || 0) * PLAYOFF_MULTIPLIER;
        const playoffGames = playoff.gamesPlayed || 0;
        const playoffWins = playoff.wins || 0;
        
        totalGWD += playoffGWD * weight;
        totalFourthQC += playoffFourthQC * weight;
        totalGames += playoffGames * weight; // Include playoff games in total games for rate
        totalPlayoffWins += playoffWins * weight;
        totalPlayoffGames += playoffGames * weight;
        
        // Debug for Mahomes
        if (data.Player && data.Player.includes('Mahomes')) {
          console.log(`🏆 MAHOMES ${year} CLUTCH: Regular (${regularGWD} GWD, ${regularFourthQC} 4QC) + Playoff (${playoff.gameWinningDrives} GWD, ${playoff.fourthQuarterComebacks} 4QC, ${playoffWins}-${playoff.losses} record)`);
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
    
    // NEW: Playoff success bonus (0-20 points)
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

  // True Durability Score - Pure availability metrics (0-100)
  const calculateDurabilityScore = (qbSeasonData) => {
    const yearWeights = { 2024: 0.55, 2023: 0.35, 2022: 0.10 };
    let totalGamesPlayed = 0;
    let totalPossibleGames = 0;
    let weightedAvailability = 0;
    let totalWeight = 0;
    let consistencyBonus = 0;
    
    Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
      const weight = yearWeights[year] || 0;
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

  // Supporting Cast Difficulty Adjustment (0-100)
  // Higher score = More "extra credit" for QB in difficult situation
  const calculateSupportScore = (qbData) => {
    // Handle multi-team QBs - get all teams from their season data
    const currentTeam = qbData.currentTeam || qbData.team;
    let teamsPlayed = [currentTeam];
    
    // Check if QB has seasonData with multiple teams
    if (qbData.seasonData && qbData.seasonData.length > 0) {
      const allTeams = qbData.seasonData.map(season => season.team).filter(team => team);
      teamsPlayed = [...new Set(allTeams)]; // Remove duplicates
    }
    
    // Offensive Line Quality (0-35 points) - Protection & Run Blocking
    const offensiveLineGrades = {
      'DEN': 35,  // #1 PBWR + RBWR in 2024, elite across board
      'PHI': 32,  // Elite talent, Mailata/Johnson/Dickerson core
      'DET': 31,  // Sewell/Ragnow anchors, consistent excellence  
      'TB': 30,   // Wirfs elite, excellent pass protection unit
      'BAL': 29,  // Stanley healthy, top RBWR performance
      'BUF': 28,  // Elite sack rate, clean pocket leader
      'ATL': 26,  // Lindstrom elite RG, solid overall unit
      'LAR': 25,  // Strong when healthy, good YBC numbers
      'LAC': 24,  // Slater/Alt excellent bookends, interior improved
      'CAR': 23,  // Hunt addition major upgrade, solid metrics
      'MIN': 22,  // Darrisaw return + Kelly/Fries upgrades
      'CHI': 21,  // Thuney/Jackson/Dalman major FA additions
      'KC': 20,   // Lost Thuney/interior depth, LT issues
      'ARI': 19,  // Johnson Jr. solid, consistent low pressure rate
      'GB': 18,   // Tom excellent RT, Banks addition
      'PIT': 18,  // Young core developing, Frazier/McCormick
      'IND': 17,  // Lost Kelly/Fries, Nelson/Raimann still solid
      'SF': 17,   // Williams aging, struggled without him
      'NYJ': 16,  // Fashanu developing, decent interior trio
      'LV': 15,   // Miller + Powers-Johnson core, needs depth
      'JAX': 14,  // Lost key veterans, average metrics
      'WAS': 14,  // Tunsil helps but unit needs more talent
      'TEN': 13,  // Moore/Zeitler upgrades from terrible base
      'NO': 12,   // Banks first-rounder, still rebuilding
      'CLE': 12,  // Health/age concerns, inconsistent
      'CIN': 11,  // Persistent bottom-tier protection
      'DAL': 11,  // Booker drafted but Guyton/line struggles
      'MIA': 10,  // Bottom tier run blocking, needs overhaul
      'NYG': 10,  // Thomas when healthy, rest very poor
      'SEA': 9,   // Zabel drafted, but major work needed
      'HOU': 8,   // Traded Tunsil, among worst units
      'NE': 6     // Bottom of NFL, Wallace/rookie protection
    };
    
    // Weapons Quality (0-40 points) - WRs, TEs, RBs
    const weaponsGrades = {
      'KC': 30,   // Kelce elite TE, Rice (1400+ yds), Worthy speed, Hunt
      'CIN': 38,  // Chase elite, Higgins when healthy, solid depth
      'MIA': 36,  // Hill (1799 yds), Waddle, explosive speed combo
      'MIN': 35,  // Jefferson elite (1533 yds), Addison solid, Hockenson
      'PHI': 34,  // AJ Brown, Smith, Goedert, Barkley elite RB
      'BUF': 33,  // Cooper trade, Diggs gone but still solid
      'LAC': 32,  // Allen/Williams/McConkey emerged, depth improved
      'HOU': 31,  // Diggs trade, Collins/Dell, weapons upgraded
      'DET': 30,  // Williams/St. Brown elite, LaPorta, Montgomery/Gibbs
      'DAL': 29,  // CeeDee elite (1749 yds), lacks consistent depth
      'TB': 28,   // Evans (1004 yds), Godwin injured, Bucky Irving
      'SF': 27,   // Deebo/Aiyuk solid, Kittle, CMC when healthy
      'WSH': 26,  // McLaurin solid, Daniels weapons developing
      'JAX': 25,  // Kirk/Ridley/Thomas decent trio
      'ATL': 24,  // London emerging, Pitts potential, Bijan
      'LAR': 23,  // Kupp/Puka when healthy, depth concerns
      'SEA': 22,  // Metcalf (1297 yds), Lockett aging, JSN
      'ARI': 21,  // Harrison Jr. ROY candidate, Marvin, McBride
      'NO': 20,   // Olave solid, Kamara, Thomas limited
      'LV': 19,   // Adams elite (1243 yds) but limited support
      'BAL': 23,  // Andrews/Flowers, Lamar running ability
      'DEN': 17,  // Sutton solid, Jeudy traded, limited depth
      'GB': 16,   // Watson injured, Dobbs limited, Jacobs added
      'IND': 15,  // Richardson weapons still developing, limited
      'TEN': 14,  // Hopkins gone, Ridley/Boyd limited
      'PIT': 13,  // Pickens solid, TE/depth issues
      'CHI': 12,  // Moore/Odunze promising but developing
      'CLE': 11,  // Cooper solid, very limited depth
      'NYJ': 10,  // Adams trade, Wilson limited, rebuilding
      'NYG': 9,   // Nabers promising rookie, very limited depth
      'NE': 8,    // Rebuilding receiving corps, limited talent
      'CAR': 7    // Rebuilding everything, very limited weapons
    };
    
    // Defense Quality (0-25 points) - How much defense helps QB
    // Better defense = more opportunities, field position, leads, turnovers
    const defenseGrades = {
      'BAL': 25,  // #1 defense, elite pass rush + secondary
      'BUF': 24,  // Von Miller, elite secondary, great overall
      'KC': 23,   // Elite takeaways/turnovers, Spagnuolo system
      'PIT': 22,  // Watt, Fitzpatrick, consistently strong
      'SF': 21,   // Elite when healthy, pass rush + secondary
      'MIA': 20,  // Improved significantly, solid overall
      'DET': 20,  // Hutchinson emerging, improving overall
      'PHI': 19,  // Talented but inconsistent performance
      'HOU': 19,  // Young defense improving rapidly
      'MIN': 18,  // Solid overall, Flores system working
      'DEN': 18,  // Surtain elite, solid pass rush
      'TB': 17,   // Bowles system creates opportunities
      'LAC': 17,  // Bosa elite, Mack/others solid
      'DAL': 16,  // Parsons elite, secondary inconsistent
      'SEA': 16,  // Williams trade helped, solid overall
      'CLE': 15,  // Garrett elite, rest struggling
      'IND': 15,  // Decent overall, helps Richardson
      'WSH': 14,  // Young defense developing quickly
      'LAR': 13,  // Donald gone, rebuilding but talent
      'CIN': 6,  // Pass rush improved, secondary issues
      'NO': 12,   // Cap casualties hurt depth
      'ATL': 12,  // Inconsistent unit, some talent
      'JAX': 11,  // Josh Allen solid, limited overall
      'GB': 11,   // Jaire elite, rest inconsistent
      'ARI': 10,  // Young players learning, improving
      'TEN': 9,   // Poor overall unit, few playmakers
      'NYJ': 9,   // Sauce good, overall unit poor
      'CHI': 8,   // Young unit learning, limited talent
      'LV': 8,    // Crosby good, rest struggling
      'NYG': 7,   // Rebuilding defense, limited talent
      'NE': 6,    // Rebuilding everything, bottom tier
      'CAR': 5    // Among worst in league, very limited
    };
    
    // Calculate weighted average support based on all teams played
    let totalSupportQuality = 0;
    let gamesWeightedSum = 0;
    
    if (qbData.seasonData && qbData.seasonData.length > 0) {
      // Weight by games started with each team
      qbData.seasonData.forEach(season => {
        const team = season.team;
        const gamesStarted = season.gamesStarted || 1;
        
        const oLineScore = offensiveLineGrades[team] || 15;
        const weaponsScore = weaponsGrades[team] || 20;
        const defenseScore = defenseGrades[team] || 12;
        
        const teamSupportQuality = oLineScore + weaponsScore + defenseScore;
        totalSupportQuality += teamSupportQuality * gamesStarted;
        gamesWeightedSum += gamesStarted;
      });
    }
    
    const rawSupportQuality = gamesWeightedSum > 0 ? 
      totalSupportQuality / gamesWeightedSum : 
      (offensiveLineGrades[currentTeam] || 15) + (weaponsGrades[currentTeam] || 20) + (defenseGrades[currentTeam] || 12);
     
     // CORRECT LOGIC: Poor supporting cast = Higher difficulty adjustment score
     // Scale from 0-100 where higher score = more "extra credit" for difficult situation
     // Teams with GOOD support (high rawSupportQuality) should get LOW scores
     // Teams with POOR support (low rawSupportQuality) should get HIGH scores
     
     // Calculate max possible support quality (35 + 40 + 25 = 100)
     const maxSupportQuality = 100;
     
     // Invert and scale: excellent support = low score, poor support = high score
     const difficultyAdjustment = Math.max(0, Math.min(100, (maxSupportQuality - rawSupportQuality) * (100 / maxSupportQuality)));
     
     // Debug for major teams or multi-team QBs
     if (['KC', 'BUF', 'CIN', 'BAL', 'CAR', 'NYG', 'MIN', 'TB'].includes(currentTeam) || teamsPlayed.length > 1) {
       const teamsText = teamsPlayed.length > 1 ? `Teams: ${teamsPlayed.join(', ')}` : `Team: ${currentTeam}`;
       const supportLevel = rawSupportQuality >= 80 ? 'EXCELLENT' : rawSupportQuality >= 60 ? 'GOOD' : rawSupportQuality >= 40 ? 'AVERAGE' : 'POOR';
       console.log(`🔍 SUPPORT ${teamsText}: Raw Quality(${rawSupportQuality.toFixed(1)}) - ${supportLevel} -> Difficulty Score(${difficultyAdjustment.toFixed(1)}) [Higher = More Extra Credit for Poor Support]`);
     }
     
     return difficultyAdjustment;
  };

  const calculateQEI = (baseScores, qb) => {
    // Calculate total weight for normalization
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    
    if (totalWeight === 0) return 0;
    
    // Calculate weighted score with proper normalization
    const weightedScore = (
      (baseScores.team * weights.team) +
      (baseScores.stats * weights.stats) +
      (baseScores.clutch * weights.clutch) +
      (baseScores.durability * weights.durability) +
      (baseScores.support * weights.support)
    ) / totalWeight; // Normalize by total weight to handle weights > 100%
    
    // Apply dynamic scaling based on weight distribution
    // This ensures that top performers in heavily weighted categories can reach elite tiers
    const maxWeight = Math.max(...Object.values(weights));
    const dominanceRatio = totalWeight > 0 ? maxWeight / totalWeight : 0;
    const isSpecialized = dominanceRatio >= 0.7; // If one category is 70%+ of total weight
    
    let finalScore;
    if (isSpecialized) {
      // Apply specialized scaling - boost scores for focused evaluations
      const specialistBoost = 1.2 + (dominanceRatio - 0.7) * 1.0; // 1.2x to 1.5x boost based on dominance
      finalScore = weightedScore * specialistBoost;
    } else {
      // Enhanced scaling for balanced evaluations - boost to make elite tiers reachable
      const balancedBoost = 1.15; // 15% boost for balanced approaches
      finalScore = weightedScore * balancedBoost;
    }
    
    // Apply experience modifier - slight penalty for inexperienced QBs
    const experience = qb?.experience || qb?.seasonData?.length || 1;
    let experienceModifier = 1.0;
    
    if (experience === 1) {
      experienceModifier = 0.95; // 5% penalty for rookies/1-year QBs
      if (qb?.name && (qb.name.includes('Williams') || qb.name.includes('Daniels') || qb.name.includes('Maye') || qb.name.includes('Nix'))) {
        console.log(`👶 ROOKIE PENALTY: ${qb.name} (${experience} yr) - 5% reduction applied`);
      }
    } else if (experience === 2) {
      experienceModifier = 0.98; // 2% penalty for second-year QBs
      if (qb?.name && (qb.name.includes('Young') || qb.name.includes('Stroud') || qb.name.includes('Richardson'))) {
        console.log(`🧑 SECOND-YEAR PENALTY: ${qb.name} (${experience} yrs) - 2% reduction applied`);
      }
    }
    // 3+ years: no penalty (1.0x modifier)
    
    return Math.min(100, finalScore * experienceModifier);
  };

  const updateWeight = (category, value) => {
    setWeights(prev => ({
      ...prev,
      [category]: parseInt(value)
    }));
    setCurrentPreset('custom'); // Reset to custom when manually adjusting
  };

  // Updated Philosophy Presets
  const philosophyPresets = {
    winner: {
      team: 55, stats: 25, clutch: 15, durability: 5, support: 0,
      description: "Winning is everything - team success dominates"
    },
    
    analyst: {
      team: 10, stats: 65, clutch: 15, durability: 5, support: 5,
      description: "Numbers don't lie - statistical excellence"
    },
    
    clutch: {
      team: 25, stats: 30, clutch: 35, durability: 5, support: 5,
      description: "Pressure makes diamonds - big moments matter most"
    },
    
    balanced: {
      team: 30, stats: 40, clutch: 15, durability: 10, support: 5,
      description: "Well-rounded evaluation of all factors"
    },
    
    context: {
      team: 25, stats: 35, clutch: 15, durability: 10, support: 15,
      description: "Context matters - extra credit for difficult situations"
    }
  };

  const applyPreset = (presetName) => {
    const preset = philosophyPresets[presetName];
    // Extract only the weight categories, exclude the description
    const { description, ...weightCategories } = preset;
    setWeights(weightCategories);
    setCurrentPreset(presetName);
  };

  const getCurrentPresetDescription = () => {
    console.log('Current preset:', currentPreset);
    
    if (currentPreset === 'custom') {
      return "Custom settings - adjust sliders to match your QB evaluation philosophy";
    }
    
    const preset = philosophyPresets[currentPreset];
    if (preset && preset.description) {
      return preset.description;
    }
    
    return "Custom settings";
  };

  const getQEIColor = (qei) => {
    if (qei >= 90) return 'bg-gradient-to-r from-yellow-400/30 to-orange-400/30 text-yellow-200'; // Gold - Elite
    if (qei >= 80) return 'bg-gradient-to-r from-gray-300/30 to-gray-400/30 text-gray-200'; // Silver - Excellent
    if (qei >= 70) return 'bg-gradient-to-r from-amber-600/30 to-amber-700/30 text-amber-200'; // Bronze - Very Good
    if (qei >= 60) return 'bg-gradient-to-r from-green-500/30 to-green-600/30 text-green-200'; // Green - Good
    return 'bg-white/10 text-white'; // Standard
  };

  // Calculate QEI with current weights
  const rankedQBs = qbData
    .map(qb => ({
      ...qb,
      qei: calculateQEI(qb.baseScores, qb)
    }))
    .sort((a, b) => b.qei - a.qei);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-6">🏈</div>
          <h2 className="text-3xl font-bold mb-4">Loading NFL Quarterbacks...</h2>
          <div className="space-y-2 text-blue-200">
            <p>📊 Loading quarterback data from CSV files</p>
            <p>📈 Parsing 2024 season statistics</p>
            <p>🔢 Calculating QEI performance metrics</p>
            <p>🏆 Ranking elite quarterbacks</p>
          </div>
          <div className="mt-6 text-yellow-300">
            ⏳ Processing CSV data...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-700 p-6 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Failed to Load QB Data</h2>
          <p className="text-red-200 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg font-bold transition-colors"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🏈 NFL QB Rankings</h1>
          <p className="text-blue-200">3-Year NFL analysis (2022-2024) • Career quarterback rankings • Dynamic QEI</p>
          <div className="mt-4 text-sm text-blue-300">
            📊 {rankedQBs.length} Active Quarterbacks • 🎛️ Customizable Weights • 📈 Multi-Year Career Data
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">🎯 Customize Your QB Philosophy</h3>
          
          {/* Philosophy Presets */}
          <div className="mb-6">
            <h4 className="text-white font-medium mb-3">Quick Philosophy Presets:</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => applyPreset('winner')}
                className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-200 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🏆 Winner
              </button>
              <button
                onClick={() => applyPreset('analyst')}
                className="bg-green-600/20 hover:bg-green-600/30 text-green-200 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                📊 Analyst
              </button>
              <button
                onClick={() => applyPreset('clutch')}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-200 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                💎 Clutch
              </button>
              <button
                onClick={() => applyPreset('balanced')}
                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ⚖️ Balanced
              </button>
              <button
                onClick={() => applyPreset('context')}
                className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🏢 Context
              </button>
            </div>
            <div className="text-sm text-blue-200 italic">
              💡 Current Philosophy: {currentPreset === 'winner' ? 'Winning is everything - team success dominates' : 
                                     currentPreset === 'analyst' ? 'Numbers don\'t lie - statistical excellence' :
                                     currentPreset === 'clutch' ? 'Pressure makes diamonds - big moments matter most' :
                                     currentPreset === 'balanced' ? 'Well-rounded evaluation of all factors' :
                                     currentPreset === 'context' ? 'Context matters - extra credit for difficult situations' :
                                     'Custom settings - adjust sliders to match your QB evaluation philosophy'}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(weights).map(([category, value]) => (
              <div key={category} className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-white font-medium capitalize">{category}</label>
                  <span className="bg-green-500/30 text-green-100 px-2 py-1 rounded text-sm">
                    {value}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) => updateWeight(category, e.target.value)}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-xs text-blue-200 mt-1">
                  {category === 'team' && 'Win-loss record, playoff success'}
                  {category === 'stats' && 'ANY/A, success rate, production'}
                  {category === 'clutch' && 'Game-winning drives, 4QC'}
                  {category === 'durability' && 'Games started, consistency'}
                  {category === 'support' && 'Extra credit for poor supporting cast'}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <span className={`text-lg font-bold ${totalWeight === 100 ? 'text-green-400' : 'text-red-400'}`}>
              Total Weight: {totalWeight}%
            </span>
          </div>
        </div>

        {/* Live Rankings Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/20">
            <h3 className="text-xl font-bold text-white">🏆 QB Rankings ({rankedQBs.length} Active QBs)</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-white font-bold">Rank</th>
                  <th className="px-4 py-3 text-left text-white font-bold">QB</th>
                  <th className="px-4 py-3 text-center text-white font-bold">Team</th>
                  <th className="px-4 py-3 text-center text-white font-bold">QEI</th>
                  <th className="px-4 py-3 text-center text-white font-bold">Team Record</th>
                  <th className="px-4 py-3 text-center text-white font-bold">Per-Game Averages</th>
                  <th className="px-4 py-3 text-center text-white font-bold">Seasons</th>
                  <th className="px-4 py-3 text-center text-white font-bold">Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {rankedQBs.map((qb, index) => (
                  <tr 
                    key={qb.id} 
                    className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20' :
                      index === 2 ? 'bg-gradient-to-r from-amber-600/20 to-amber-700/20' :
                      index < 8 ? 'bg-green-500/10' : 'bg-blue-500/5'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-xl font-bold text-white">#{index + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-bold text-white">{qb.name}</div>
                        <div className="text-xs text-blue-200">{qb.experience} seasons • Age {qb.age}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center">
                        {qb.teamLogo && (
                          <img src={qb.teamLogo} alt={qb.team} className="w-6 h-6 mr-2" />
                        )}
                        <span className="font-bold text-white">{qb.team}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className={`inline-block px-3 py-1 rounded-lg ${getQEIColor(qb.qei)}`}>
                        <span className="text-xl font-bold">{qb.qei.toFixed(1)}</span>
                        <div className="text-xs opacity-75">
                          {qb.qei >= 90 ? 'Elite' : qb.qei >= 80 ? 'Excellent' : qb.qei >= 70 ? 'Very Good' : qb.qei >= 60 ? 'Good' : 'Average'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-blue-200">{qb.combinedRecord}</td>
                    <td className="px-4 py-3 text-center text-blue-200">
                      <div>{qb.stats.yardsPerGame.toFixed(1)} yds/g</div>
                      <div className="text-xs">{qb.stats.tdsPerGame.toFixed(2)} TD/g, {qb.stats.turnoversPerGame.toFixed(2)} TO/g</div>
                    </td>
                    <td className="px-4 py-3 text-center text-white">
                      <div>{qb.experience}</div>
                      <div className="text-xs text-blue-200">{qb.stats.gamesStarted} starts</div>
                    </td>
                    <td className="px-4 py-3 text-center text-blue-200">{qb.stats.passerRating.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-blue-300">
          <p>🚀 Dynamic Rankings • 📈 3-Year Career Analysis • 🎛️ Customizable Weights</p>
          {lastFetch && (
            <p className="text-sm mt-2">
              Last updated: {new Date(lastFetch).toLocaleTimeString()} 
              {shouldRefreshData() ? ' (Data may be stale)' : ' (Fresh data)'}
            </p>
          )}
          <button 
            onClick={fetchAllQBData}
            className="mt-4 bg-blue-500/20 hover:bg-blue-500/30 px-6 py-2 rounded-lg font-bold transition-colors"
          >
            🔄 Refresh ESPN Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default DynamicQBRankings; 