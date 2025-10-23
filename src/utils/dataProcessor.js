// Data processing utility functions
import { parseQBRecord } from './csvParser.js';
import { getTeamInfo } from '../constants/teamData.js';

export const combinePlayerDataAcrossYears = (qbs2024, qbs2023, qbs2022, playoffQbs2024, playoffQbs2023, playoffQbs2022, rushingQbs2024, rushingQbs2023, rushingQbs2022, rushingPlayoffQbs2024, rushingPlayoffQbs2023, rushingPlayoffQbs2022, qbs2025 = [], playoffQbs2025 = [], rushingQbs2025 = [], rushingPlayoffQbs2025 = []) => {
  const playerData = {};
  
  // Process each year of data
  const yearsData = [
    { year: 2025, data: qbs2025 },
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
      
      // Check if we already have data for this year (to handle multi-team seasons)
      const existingSeasonIndex = playerData[playerName].seasons.findIndex(s => s.year === year);
      
      if (existingSeasonIndex >= 0) {
        // Player already has data for this year - combine the stats (multi-team season)
        const existingSeason = playerData[playerName].seasons[existingSeasonIndex];
        existingSeason.gamesStarted += gamesStarted;
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
        if (qb.Team && qb.Team.length === 3 && !qb.Team.match(/^\d+TM$/)) {
          if (!existingSeason.teamsPlayed.includes(qb.Team)) {
            existingSeason.teamsPlayed.push(qb.Team);
            existingSeason.gamesStartedPerTeam.push(gamesStarted);
          }
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
          gamesStartedPerTeam: []
        };
        
        // Add the current team to teamsPlayed (skip "2TM", "3TM" etc.)
        if (qb.Team && qb.Team.length === 3 && !qb.Team.match(/^\d+TM$/)) {
          newSeason.teamsPlayed.push(qb.Team);
          newSeason.gamesStartedPerTeam.push(gamesStarted);
        }
        
        playerData[playerName].seasons.push(newSeason);
        
        // Only increment seasons for NEW years
        const career = playerData[playerName].career;
        career.seasons++;
      }
      
      // Always update career totals regardless
      const career = playerData[playerName].career;
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
    { year: 2025, data: playoffQbs2025 },
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
  
  // Process rushing data for regular season
  const rushingYearsData = [
    { year: 2025, data: rushingQbs2025 },
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
    { year: 2025, data: rushingPlayoffQbs2025 },
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
        
        // Adjust threshold based on year (2025 has fewer games)
        // For 2025 mid-season: use 1 game minimum since season is in progress
        const minGames = filterYear === 2025 ? 1 : 9; // Very low threshold for in-progress 2025 season
        const passes = hasYearActivity && totalYearGames >= minGames;
        
        if (!passes) {
          console.log(`🚫 FILTERED OUT ${playerName}: ${filterYear} games=${totalYearGames}, hasActivity=${hasYearActivity}, minRequired=${minGames}`);
        } else {
          console.log(`✅ PASSED ${playerName}: ${filterYear} games=${totalYearGames} (min: ${minGames})`);
        }
        
        return passes;
      } else {
        // For multi-year mode: Original career-based filtering (legacy support)
        const totalGames = data.career.gamesStarted;
        const hasRecentActivity = data.seasons.some(season => season.year >= 2023);
        const passes = totalGames >= 15 && hasRecentActivity;
        
        if (!passes) {
          console.log(`🚫 FILTERED OUT ${playerName}: career games=${totalGames}, recentActivity=${hasRecentActivity}, seasons=${data.career.seasons}`);
        } else {
          console.log(`✅ PASSED ${playerName}: career games=${totalGames}, seasons=${data.career.seasons}`);
        }
        
        return passes; // At least 15 career starts and active recently
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
}; 