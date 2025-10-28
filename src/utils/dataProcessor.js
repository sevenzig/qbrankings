// Data processing utility functions
import { getTeamInfo } from '../constants/teamData.js';

// Parse QB record string (e.g., "12-4" -> {wins: 12, losses: 4, winPercentage: 0.75})
export const parseQBRecord = (qbRecord) => {
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

export const combinePlayerDataAcrossYears = (qbs2024, qbs2023, qbs2022, playoffQbs2024, playoffQbs2023, playoffQbs2022, qbs2025 = [], playoffQbs2025 = []) => {
  const playerData = {};
  
  // Process each year of data - LEGACY CSV FUNCTION
  // This function is deprecated and only used for CSV data processing
  const yearsData = [
    { year: 2025, data: qbs2025 },
    { year: 2024, data: qbs2024 },
    { year: 2023, data: qbs2023 },
    { year: 2022, data: qbs2022 }
  ];
  
  yearsData.forEach(({ year, data }) => {
    data.forEach(qb => {
      // Only process quarterbacks with valid data - explicitly exclude HB, FB, WR
      if (qb.Pos !== 'QB' || !qb.Player || !qb.Team || qb.Team.length > 3) {
        return;
      }
      
      // Additional position filtering to exclude non-QB positions
      const excludedPositions = ['HB', 'FB', 'WR'];
      if (excludedPositions.includes(qb.Pos)) {
        return;
      }
      
      const playerName = qb.Player.trim();
      const gamesStarted = parseInt(qb.GS) || 0;
      const games = parseInt(qb.G) || gamesStarted;
      
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
            games: 0,
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
      
      // Check if we already have data for this year (to handle multi-team seasons)
      const existingSeasonIndex = playerData[playerName].seasons.findIndex(s => s.year === year);
      
      if (existingSeasonIndex >= 0) {
        // Player already has data for this year - combine the stats (multi-team season)
        const existingSeason = playerData[playerName].seasons[existingSeasonIndex];
        existingSeason.gamesStarted += gamesStarted;
        existingSeason.games += games;
        existingSeason.wins += qbRecord.wins;
        existingSeason.losses += qbRecord.losses;
        existingSeason.passingYards += yearYards;
        existingSeason.passingTDs += yearTDs;
        existingSeason.interceptions += parseInt(qb.Int) || 0;
        existingSeason.completions += parseInt(qb.Cmp) || 0;
        existingSeason.attempts += parseInt(qb.Att) || 0;
        existingSeason.gameWinningDrives += parseInt(qb.ClutchGWD) || 0;
        existingSeason.fourthQuarterComebacks += parseInt(qb.ClutchFourthQC) || 0;
        
        // Track all teams played for during this season (skip "2TM", "3TM" etc.)
        if (!existingSeason.teamsPlayed) {
          existingSeason.teamsPlayed = [];
        }
        if (!existingSeason.gamesStartedPerTeam) {
          existingSeason.gamesStartedPerTeam = [];
        }
        if (!existingSeason.teamStats) {
          existingSeason.teamStats = {};
        }
        
        if (qb.Team && qb.Team.length === 3 && !qb.Team.match(/^\d+TM$/)) {
          if (!existingSeason.teamsPlayed.includes(qb.Team)) {
            existingSeason.teamsPlayed.push(qb.Team);
            existingSeason.gamesStartedPerTeam.push(gamesStarted);
          }
          
          // Store team-specific stats for detailed breakdown
          existingSeason.teamStats[qb.Team] = {
            gamesStarted,
            wins: qbRecord.wins,
            losses: qbRecord.losses,
            passingYards: yearYards,
            passingTDs: yearTDs,
            interceptions: parseInt(qb.Int) || 0,
            completions: parseInt(qb.Cmp) || 0,
            attempts: parseInt(qb.Att) || 0,
            passerRating,
            gameWinningDrives: parseInt(qb.ClutchGWD) || 0,
            fourthQuarterComebacks: parseInt(qb.ClutchFourthQC) || 0
          };
        }
        
        // Update weighted averages
        const totalGames = existingSeason.gamesStarted;
        if (totalGames > 0) {
          existingSeason.winPercentage = (existingSeason.wins + existingSeason.losses) > 0 ? 
            existingSeason.wins / (existingSeason.wins + existingSeason.losses) : 0;
        }
      } else {
        // Add new season data
        const newSeason = {
          year,
          team: qb.Team,
          age: parseInt(qb.Age) || 25,
          gamesStarted,
          games,
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
          fourthQuarterComebacks: parseInt(qb.ClutchFourthQC) || 0,
          teamsPlayed: [],
          gamesStartedPerTeam: [],
          teamStats: {}
        };
        
        // Add the current team to teamsPlayed (skip "2TM", "3TM" etc.)
        if (qb.Team && qb.Team.length === 3 && !qb.Team.match(/^\d+TM$/)) {
          newSeason.teamsPlayed.push(qb.Team);
          newSeason.gamesStartedPerTeam.push(gamesStarted);
          
          // Store team-specific stats
          newSeason.teamStats[qb.Team] = {
            gamesStarted,
            wins: qbRecord.wins,
            losses: qbRecord.losses,
            passingYards: yearYards,
            passingTDs: yearTDs,
            interceptions: parseInt(qb.Int) || 0,
            completions: parseInt(qb.Cmp) || 0,
            attempts: parseInt(qb.Att) || 0,
            passerRating,
            gameWinningDrives: parseInt(qb.ClutchGWD) || 0,
            fourthQuarterComebacks: parseInt(qb.ClutchFourthQC) || 0
          };
        }
        
        playerData[playerName].seasons.push(newSeason);
        
        // Only increment seasons for NEW years
        const career = playerData[playerName].career;
        career.seasons++;
      }
      
      // Always update career totals regardless
      const career = playerData[playerName].career;
      career.gamesStarted += gamesStarted;
      career.games += games;
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
    { year: 2025, data: playoffQbs2025 },
    { year: 2024, data: playoffQbs2024 },
    { year: 2023, data: playoffQbs2023 },
    { year: 2022, data: playoffQbs2022 }
  ];

  playoffYearsData.forEach(({ year, data }) => {
    data.forEach(qb => {
      // Only process quarterbacks with valid data - explicitly exclude HB, FB, WR
      if (qb.Pos !== 'QB' || !qb.Player || !qb.Team || qb.Team.length > 3) {
        return;
      }
      
      // Additional position filtering to exclude non-QB positions
      const excludedPositions = ['HB', 'FB', 'WR'];
      if (excludedPositions.includes(qb.Pos)) {
        return;
      }
      
      const playerName = qb.Player.trim();
      
      // Only add playoff data if the player already exists (played regular season)
      if (!playerData[playerName]) return;
      
      const qbRecord = parseQBRecord(qb.QBrec);
      const gamesStarted = parseInt(qb.GS) || 0;
      const gamesPlayed = parseInt(qb.G) || 0;
      const attempts = parseInt(qb.Att) || 0;
      
      // THRESHOLD: Only count playoff experience for QBs with 15+ pass attempts
      // This filters out backup QBs who only played a few snaps
      if (attempts < 15) {
        if (playerName.includes('Mahomes') || playerName.includes('Hurts') || playerName.includes('Burrow')) {
          console.log(`🚫 FILTERED OUT ${playerName} ${year} PLAYOFFS: Only ${attempts} attempts (< 15 threshold)`);
        }
        return;
      }
      
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
           attempts: attempts,
           completions: parseInt(qb.Cmp) || 0,
           passerRating: parseFloat(qb.Rate) || 0,
           gameWinningDrives: parseInt(qb.ClutchGWD) || 0,
           fourthQuarterComebacks: parseInt(qb.ClutchFourthQC) || 0,
           anyPerAttempt: parseFloat(qb.AnyPerAttempt) || 0,
           successRate: parseFloat(qb.SuccessRate) || 0,
           sackPercentage: parseFloat(qb.SackPct) || 0
         };
        
        // Debug playoff data for key QBs
        if (playerName.includes('Mahomes') || playerName.includes('Hurts') || playerName.includes('Burrow')) {
          console.log(`🏆 ${playerName} ${year} PLAYOFFS QUALIFIED: ${attempts} attempts, ${season.playoffData.gamesPlayed} games, ${qbRecord.wins}-${qbRecord.losses} record`);
        }
      }
    });
  });
  
  // Note: Rushing data is now fetched directly from Supabase qb_splits table
  // Data is merged in the Supabase queries
  
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

/**
 * Process QB data from Supabase - supports any year dynamically
 * @param {Array} rawData - Raw data from Supabase
 * @param {number|null} filterYear - Year to filter by (null for all years)
 * @returns {Array} Processed QB data
 */
export const processSupabaseQBData = (rawData, filterYear = null) => {
  const modeLabel = filterYear ? `${filterYear}` : 'all-years';
  console.log(`🔍 DEBUG processSupabaseQBData - Processing ${rawData.length} records in ${modeLabel} mode`);
  
  // STEP 1: Deduplicate records by pfr_id + season + team combination
  // This prevents database duplicates from causing double-counting
  const deduplicatedData = [];
  const seenKeys = new Set();
  const duplicateLog = {};
  
  rawData.forEach(record => {
    const playerName = record.player_name || 'Unknown Player';
    const seasonYear = parseInt(record.season) || 0;
    const team = record.team || 'UNK';
    const pfrId = record.pfr_id || '';
    
    // Create unique key: pfr_id + season + team
    // IMPORTANT: Use lowercase pfr_id to handle case-insensitive duplicates (e.g., "goffja00" vs "GoffJa00")
    const uniqueKey = `${pfrId.toLowerCase()}_${seasonYear}_${team}`;
    
    if (seenKeys.has(uniqueKey)) {
      // Duplicate detected - log it
      if (!duplicateLog[playerName]) {
        duplicateLog[playerName] = [];
      }
      duplicateLog[playerName].push({
        year: seasonYear,
        team: team,
        gs: record.gs,
        qb_rec: record.qb_rec
      });
      console.warn(`⚠️ DUPLICATE DETECTED: ${playerName} ${seasonYear} ${team} - skipping duplicate record`);
      return; // Skip this duplicate
    }
    
    seenKeys.add(uniqueKey);
    deduplicatedData.push(record);
  });
  
  // Log summary of duplicates found
  if (Object.keys(duplicateLog).length > 0) {
    console.warn(`🚨 Found duplicates for ${Object.keys(duplicateLog).length} players:`);
    Object.entries(duplicateLog).forEach(([player, dups]) => {
      console.warn(`   ${player}: ${dups.length} duplicate(s) across years ${[...new Set(dups.map(d => d.year))].join(', ')}`);
    });
  }
  
  console.log(`✅ Deduplicated: ${rawData.length} → ${deduplicatedData.length} records`);
  
  const playerData = {};
  
  // STEP 2: Process deduplicated records
  deduplicatedData.forEach(record => {
    const playerName = record.player_name || 'Unknown Player';
    const seasonYear = parseInt(record.season) || 0;
    const gamesStarted = parseInt(record.gs) || 0;
    
    // Skip invalid records
    if (!playerName || seasonYear === 0 || gamesStarted === 0) {
      return;
    }
    
    // Initialize player data if first time seeing this player
    if (!playerData[playerName]) {
      playerData[playerName] = {
        seasons: [],
        career: {
          seasons: 0,
          gamesStarted: 0,
          games: 0,
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
          totalPasserRatingPoints: 0,
          rushingYards: 0,
          rushingTDs: 0,
          fumblesLost: 0
        }
      };
    }
    
    // Parse QB record (e.g., "15-2-0" or "15-2")
    let wins = 0, losses = 0;
    if (record.qb_rec) {
      const recordParts = record.qb_rec.split('-');
      wins = parseInt(recordParts[0]) || 0;
      losses = parseInt(recordParts[1]) || 0;
      
      // Diagnostic logging for specific problematic players
      if ((playerName === 'Russell Wilson' || playerName === 'Kirk Cousins' || playerName === 'Jared Goff') && seasonYear === 2017) {
        console.warn(`🔍 DATABASE qb_rec for ${playerName} ${seasonYear}:`, {
          qb_rec: record.qb_rec,
          parsed_wins: wins,
          parsed_losses: losses,
          gs: gamesStarted,
          team: record.team,
          pfr_id: record.pfr_id
        });
      }
    }
    
    // Check if we already have data for this year (to handle multi-team seasons)
    const existingSeasonIndex = playerData[playerName].seasons.findIndex(s => s.year === seasonYear);
    
    if (existingSeasonIndex >= 0) {
      // Update existing season data (multi-team season)
      // Note: Career totals should NOT be updated here - they were already added when the season was first created
      const existingSeason = playerData[playerName].seasons[existingSeasonIndex];
      
      console.log(`🔄 Multi-team season: ${playerName} ${seasonYear} - adding ${record.team} (${gamesStarted} GS, ${wins}-${losses})`);
      
      existingSeason.gamesStarted += gamesStarted;
      existingSeason.wins += wins;
      existingSeason.losses += losses;
      
      // Update other season stats
      existingSeason.passingYards += parseInt(record.yds) || 0;
      existingSeason.passingTDs += parseInt(record.td) || 0;
      existingSeason.interceptions += parseInt(record.int) || 0;
      existingSeason.completions += parseInt(record.cmp) || 0;
      existingSeason.attempts += parseInt(record.att) || 0;
      
      // Track teams played
      if (!existingSeason.teamsPlayed.includes(record.team)) {
        existingSeason.teamsPlayed.push(record.team);
        existingSeason.gamesStartedPerTeam.push(gamesStarted);
      }
      
      // Store team-specific stats
      existingSeason.teamStats[record.team] = {
        gamesStarted: gamesStarted,
        wins: wins,
        losses: losses,
        passingYards: parseInt(record.yds) || 0,
        passingTDs: parseInt(record.td) || 0,
        interceptions: parseInt(record.int) || 0,
        completions: parseInt(record.cmp) || 0,
        attempts: parseInt(record.att) || 0,
        passerRating: parseFloat(record.rate) || 0,
        gameWinningDrives: parseInt(record.gwd || record.GWD || record.game_winning_drives) || 0,
        fourthQuarterComebacks: parseInt(record.four_qc || record['4QC'] || record.fourth_quarter_comebacks) || 0
      };
      
      // Recalculate win percentage
      const totalGames = existingSeason.wins + existingSeason.losses;
      existingSeason.winPercentage = totalGames > 0 ? existingSeason.wins / totalGames : 0;
      
    } else {
      // Create new season data
      const seasonData = {
        year: seasonYear,
        team: record.team || 'UNK',
        gamesStarted: gamesStarted,
        wins: wins,
        losses: losses,
        winPercentage: (wins + losses) > 0 ? wins / (wins + losses) : 0,
        passingYards: parseInt(record.yds) || 0,
        passingTDs: parseInt(record.td) || 0,
        interceptions: parseInt(record.int) || 0,
        completions: parseInt(record.cmp) || 0,
        attempts: parseInt(record.att) || 0,
        passerRating: parseFloat(record.rate) || 0,
        gameWinningDrives: parseInt(record.gwd || record.GWD || record.game_winning_drives) || 0,
        fourthQuarterComebacks: parseInt(record.four_qc || record['4QC'] || record.fourth_quarter_comebacks) || 0,
        age: parseInt(record.age) || 0,
        teamsPlayed: [record.team || 'UNK'],
        gamesStartedPerTeam: [gamesStarted],
        teamStats: {
          [record.team || 'UNK']: {
            gamesStarted: gamesStarted,
            wins: wins,
            losses: losses,
            passingYards: parseInt(record.yds) || 0,
            passingTDs: parseInt(record.td) || 0,
            interceptions: parseInt(record.int) || 0,
            completions: parseInt(record.cmp) || 0,
            attempts: parseInt(record.att) || 0,
            passerRating: parseFloat(record.rate) || 0,
            gameWinningDrives: parseInt(record.gwd || record.GWD || record.game_winning_drives) || 0,
            fourthQuarterComebacks: parseInt(record.four_qc || record['4QC'] || record.fourth_quarter_comebacks) || 0
          }
        }
      };
      
      playerData[playerName].seasons.push(seasonData);
      playerData[playerName].career.seasons += 1;
      playerData[playerName].career.gamesStarted += gamesStarted;
      playerData[playerName].career.wins += wins;
      playerData[playerName].career.losses += losses;
      playerData[playerName].career.passingYards += parseInt(record.yds) || 0;
      playerData[playerName].career.passingTDs += parseInt(record.td) || 0;
      playerData[playerName].career.interceptions += parseInt(record.int) || 0;
      playerData[playerName].career.completions += parseInt(record.cmp) || 0;
      playerData[playerName].career.attempts += parseInt(record.att) || 0;
    }
    
    // Update career win percentage
    const totalCareerGames = playerData[playerName].career.wins + playerData[playerName].career.losses;
    playerData[playerName].career.winPercentage = totalCareerGames > 0 ? 
      playerData[playerName].career.wins / totalCareerGames : 0;
  });
  
  // Sort seasons by year (most recent first)
  Object.values(playerData).forEach(player => {
    player.seasons.sort((a, b) => b.year - a.year);
  });
  
  // Convert to array format and apply filtering
  const processedQBs = Object.entries(playerData)
    .filter(([playerName, data]) => {
      if (filterYear) {
        // For single-year mode: Require meaningful playing time in that specific year
        const hasYearActivity = data.seasons.some(season => season.year === filterYear);
        const totalYearGames = data.seasons
          .filter(season => season.year === filterYear)
          .reduce((sum, season) => sum + (season.gamesStarted || 0), 0);
        
        // Adjust threshold based on year (2025 has fewer games, pre-1967 had shorter seasons)
        const minGames = (() => {
          if (filterYear === 2025) return 1;  // Partial season
          if (filterYear < 1967) return 1;   // Pre-merger era (shorter seasons)
          return 2;                           // Modern era (1967+)
        })();
        const passes = hasYearActivity && totalYearGames >= minGames;
        
        if (!passes) {
          console.log(`🚫 FILTERED OUT ${playerName}: ${filterYear} games=${totalYearGames}, hasActivity=${hasYearActivity}, minRequired=${minGames}`);
        } else {
          console.log(`✅ PASSED ${playerName}: ${filterYear} games=${totalYearGames} (min: ${minGames})`);
        }
        
        return passes;
      } else {
        // For multi-year mode: Career-based filtering with comprehensive historical support
        const totalGames = data.career.gamesStarted;
        
        // Check for different activity periods
        const hasRecentActivity = data.seasons.some(season => season.year >= 2023);
        const hasModernActivity = data.seasons.some(season => season.year >= 2008 && season.year < 2023);
        const hasHistoricalSignificance = data.seasons.some(season => {
          const year = season.year;
          const games = season.gamesStarted || 0;
          // Pre-1967 players need fewer games due to shorter seasons
          return year < 1967 && games >= 5;
        });
        
        // More inclusive filtering: require sufficient career games AND any meaningful activity period
        const passes = totalGames >= 15 && (hasRecentActivity || hasModernActivity || hasHistoricalSignificance);
        
        if (!passes) {
          console.log(`🚫 FILTERED OUT ${playerName}: career games=${totalGames}, recentActivity=${hasRecentActivity}, modernActivity=${hasModernActivity}, historicalSignificance=${hasHistoricalSignificance}, seasons=${data.career.seasons}`);
        } else {
          console.log(`✅ PASSED ${playerName}: career games=${totalGames}, recentActivity=${hasRecentActivity}, modernActivity=${hasModernActivity}, historicalSignificance=${hasHistoricalSignificance}, seasons=${data.career.seasons}`);
        }
        
        return passes;
      }
    })
    .map(([playerName, data], index) => {
      // For single-year mode, use the team from the selected season
      // For multi-year mode, use the most recent season
      const targetSeason = filterYear 
        ? data.seasons.find(season => season.year === filterYear) || data.seasons[0]
        : data.seasons[0];
      
      const teamInfo = getTeamInfo(targetSeason.team);
      
      const qbObject = {
        id: `qb-${index + 1}`,
        name: playerName,
        team: targetSeason.team,
        teamId: teamInfo.id,
        teamName: teamInfo.name,
        teamLogo: teamInfo.logo,
        jerseyNumber: '',
        experience: data.career.seasons,
        age: targetSeason.age,
        wins: filterYear ? targetSeason.wins : data.career.wins,
        losses: filterYear ? targetSeason.losses : data.career.losses,
        winPercentage: filterYear ? targetSeason.winPercentage : data.career.winPercentage,
        combinedRecord: filterYear 
          ? `${targetSeason.wins}-${targetSeason.losses} (${targetSeason.winPercentage.toFixed(3)})`
          : `${data.career.wins}-${data.career.losses} (${data.career.winPercentage.toFixed(3)})`,
        stats: {
          gamesStarted: data.career.gamesStarted,
          games: data.career.gamesStarted,
          yardsPerGame: data.career.gamesStarted > 0 ? 
            (data.career.passingYards + (data.career.rushingYards || 0)) / data.career.gamesStarted : 0,
          tdsPerGame: data.career.gamesStarted > 0 ? 
            (data.career.passingTDs + (data.career.rushingTDs || 0)) / data.career.gamesStarted : 0,
          turnoversPerGame: data.career.gamesStarted > 0 ? 
            (data.career.interceptions + (data.career.fumbles || 0)) / data.career.gamesStarted : 0,
          totalYards: data.career.passingYards + (data.career.rushingYards || 0),
          totalTDs: data.career.passingTDs + (data.career.rushingTDs || 0),
          totalTurnovers: data.career.interceptions + (data.career.fumbles || 0),
          passerRating: data.career.avgPasserRating
        },
        seasonData: data.seasons,
        stats2024: `3-Year Avg: ${((data.career.passingYards + (data.career.rushingYards || 0)) / Math.max(1, data.career.gamesStarted)).toFixed(1)} yds/g`
      };
      
      return qbObject;
    });
  
  console.log(`📊 After filtering: ${processedQBs.length} QBs passed threshold requirements`);
  return processedQBs;
};

export const processQBData = (combinedQBData, filterYear = null) => {
  const modeLabel = filterYear ? `${filterYear}` : 'all-years';
  console.log(`🔍 DEBUG processQBData - Processing ${Object.keys(combinedQBData).length} players in ${modeLabel} mode`);
  
  return Object.entries(combinedQBData)
    .filter(([playerName, data]) => {
      if (filterYear) {
        // For single-year mode: Require meaningful playing time in that specific year
        const hasYearActivity = data.seasons.some(season => season.year === filterYear);
        const totalYearGames = data.seasons
          .filter(season => season.year === filterYear)
          .reduce((sum, season) => sum + (season.gamesStarted || 0), 0);
        
        // Adjust threshold based on year (2025 has fewer games, pre-1967 had shorter seasons)
        // For 2025 mid-season: use 1 game minimum since season is in progress
        // For pre-1967: use 1 game minimum due to shorter seasons and different era
        // For all other years: use 2 games minimum
        const minGames = (() => {
          if (filterYear === 2025) return 1;  // Partial season
          if (filterYear < 1967) return 1;   // Pre-merger era (shorter seasons)
          return 2;                           // Modern era (1967+)
        })();
        const passes = hasYearActivity && totalYearGames >= minGames;
        
        if (!passes) {
          console.log(`🚫 FILTERED OUT ${playerName}: ${filterYear} games=${totalYearGames}, hasActivity=${hasYearActivity}, minRequired=${minGames}`);
        } else {
          console.log(`✅ PASSED ${playerName}: ${filterYear} games=${totalYearGames} (min: ${minGames})`);
        }
        
        return passes;
      } else {
        // For multi-year mode: Career-based filtering with comprehensive historical support
        const totalGames = data.career.gamesStarted;
        
        // Check for different activity periods
        const hasRecentActivity = data.seasons.some(season => season.year >= 2023);
        const hasModernActivity = data.seasons.some(season => season.year >= 2008 && season.year < 2023);
        const hasHistoricalSignificance = data.seasons.some(season => {
          const year = season.year;
          const games = season.gamesStarted || 0;
          // Pre-1967 players need fewer games due to shorter seasons
          return year < 1967 && games >= 5;
        });
        
        // More inclusive filtering: require sufficient career games AND any meaningful activity period
        const passes = totalGames >= 15 && (hasRecentActivity || hasModernActivity || hasHistoricalSignificance);
        
        if (!passes) {
          console.log(`🚫 FILTERED OUT ${playerName}: career games=${totalGames}, recentActivity=${hasRecentActivity}, modernActivity=${hasModernActivity}, historicalSignificance=${hasHistoricalSignificance}, seasons=${data.career.seasons}`);
        } else {
          console.log(`✅ PASSED ${playerName}: career games=${totalGames}, recentActivity=${hasRecentActivity}, modernActivity=${hasModernActivity}, historicalSignificance=${hasHistoricalSignificance}, seasons=${data.career.seasons}`);
        }
        
        return passes; // At least 15 career starts and (recent activity OR modern activity OR historical significance)
      }
    })
    .map(([playerName, data], index) => {
      const mostRecentSeason = data.seasons[0]; // Already sorted by year desc
      const teamInfo = getTeamInfo(mostRecentSeason.team);
      
      const qbObject = {
        id: `qb-${index + 1}`,
        name: playerName,
        team: mostRecentSeason.team,
        teamId: teamInfo.id,
        teamName: teamInfo.name,
        teamLogo: teamInfo.logo,
        jerseyNumber: '',
        experience: data.career.seasons,
        age: targetSeason.age,
        wins: data.career.wins,
        losses: data.career.losses,
        winPercentage: data.career.winPercentage,
        combinedRecord: `${data.career.wins}-${data.career.losses} (${data.career.winPercentage.toFixed(3)})`,
        stats: {
          gamesStarted: data.career.gamesStarted,
          games: data.career.games,
          // Per-game averages - total yards, TDs, and turnovers (pass + rush) - using games played
          yardsPerGame: data.career.games > 0 ? 
            (data.career.passingYards + (data.career.rushingYards || 0)) / data.career.games : 0,
          tdsPerGame: data.career.games > 0 ? 
            (data.career.passingTDs + (data.career.rushingTDs || 0)) / data.career.games : 0,
          turnoversPerGame: data.career.games > 0 ? 
            (data.career.interceptions + (data.career.fumbles || 0)) / data.career.games : 0,
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
}; 