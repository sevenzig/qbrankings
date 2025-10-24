// Custom hook for Supabase QB data fetching and management
import { useState, useEffect, useCallback } from 'react';
import { qbDataService, handleSupabaseError } from '../utils/supabase.js';
import { calculateQBMetrics } from '../utils/qbCalculations.js';
import { 
  transformSeasonSummaryToCSV, 
  validateDataStructure,
  logTransformationStats,
  getSeasonDataForCalculations
} from '../utils/supabaseDataTransformer.js';
import { combinePlayerDataAcrossYears, processQBData } from '../utils/dataProcessor.js';

export const useSupabaseQBData = () => {
  const [qbData, setQbData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Cache duration: 15 minutes for regular data, 60 minutes for 2025 to prevent flat 50 scores
  const CACHE_DURATION = 15 * 60 * 1000;
  const CACHE_DURATION_2025 = 60 * 60 * 1000; // 1 hour for 2025 data

  const shouldRefreshData = useCallback((yearMode = '2024') => {
    if (!lastFetch) return true;
    const cacheDuration = yearMode === '2025' ? CACHE_DURATION_2025 : CACHE_DURATION;
    return Date.now() - lastFetch > cacheDuration;
  }, [lastFetch]);

  const fetchAllQBData = useCallback(async (yearMode = '2025') => {
    try {
      setLoading(true);
      setError(null);
      
      const yearModeLabel = `${yearMode}`;
      console.log(`🔄 Loading QB data from Supabase... (Mode: ${yearModeLabel})`);
      
      // Parse year mode to numeric value
      const year = parseInt(yearMode);
      
      // Fetch data from Supabase for specific year
      const rawData = await qbDataService.fetchQBDataByYear(year);
      
      console.log(`📊 Supabase returned ${rawData ? rawData.length : 0} records`);
      
      // Debug: Check what years are in the data
      if (rawData && rawData.length > 0) {
        const uniqueYears = [...new Set(rawData.map(r => r.season))];
        console.log(`📅 Years in data: ${uniqueYears.join(', ')}`);
        if (uniqueYears.some(y => y !== year)) {
          console.error(`❌ ERROR: ${year} mode but got data from years: ${uniqueYears.join(', ')}`);
        }
      }
      
      // Check if we got any data
      if (!rawData || rawData.length === 0) {
        throw new Error('No data returned from Supabase - database may be empty or query failed');
      }
      
      console.log('🔍 DEBUG - First raw record:', rawData[0]);
      console.log('🔍 DEBUG - Available fields:', Object.keys(rawData[0] || {}));
      
      // Validate data structure
      if (!validateDataStructure(rawData)) {
        throw new Error('Invalid data structure received from Supabase');
      }
      
      // Group data by player name to create combined player data structure
      const playerData = {};
      
      rawData.forEach(record => {
        const playerName = record.player_name || 'Unknown Player';
        const seasonYear = parseInt(record.season) || year;
        const gamesStarted = parseInt(record.gs) || 0;
        
        // Extra safety: Skip records that don't match our year mode
        if (seasonYear !== year) {
          console.warn(`⚠️ Skipping ${playerName} ${seasonYear} - not ${year}`);
          return;
        }
        
        console.log(`🔍 DEBUG - Processing ${playerName} for season ${seasonYear}: ${gamesStarted} games started`);
        
        // Initialize player data if first time seeing this player
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
        }
        
        // Create season data object with flexible field mapping
        const seasonData = {
          year: seasonYear, // CRITICAL: Map 'season' to 'year'
          team: record.team || 'UNK',
          age: parseInt(record.age) || 25,
          gamesStarted: gamesStarted, // CRITICAL: Map 'gs' to 'gamesStarted'
          wins: wins,
          losses: losses,
          winPercentage: (wins + losses) > 0 ? wins / (wins + losses) : 0,
          passingYards: parseInt(record.yds) || 0,
          passingTDs: parseInt(record.td) || 0,
          interceptions: parseInt(record.int) || 0,
          completions: parseInt(record.cmp) || 0,
          attempts: parseInt(record.att) || 0,
          passerRating: parseFloat(record.rate) || 0,
          // Try multiple possible field names for success rate
          successRate: parseFloat(record.succ_pct || record['Succ%'] || record.success_pct) || 0,
          // Try multiple possible field names for sack percentage
          sackPercentage: parseFloat(record.sk_pct || record['Sk%'] || record.sack_pct) || 0,
          // Try multiple possible field names for ANY/A
          anyPerAttempt: parseFloat(record.any_a || record['ANY/A'] || record.adjusted_net_yards_per_attempt) || 0,
          // Clutch stats
          gameWinningDrives: parseInt(record.gwd || record.GWD || record.game_winning_drives) || 0,
          fourthQuarterComebacks: parseInt(record.four_qc || record['4QC'] || record.fourth_quarter_comebacks) || 0,
          // Rushing stats (now comes from merged Supabase data)
          rushingYards: parseInt(record.rush_yds || record.RushingYds || 0) || 0,
          rushingTDs: parseInt(record.rush_td || record.RushingTDs || 0) || 0,
          rushingAttempts: parseInt(record.rush_att || record.RushingAtt || 0) || 0,
          fumbles: parseInt(record.fumbles || record.Fumbles || 0) || 0,
          fumblesLost: parseInt(record.fumbles_lost || record.FumblesLost || 0) || 0
        };
        
        // Add season to player's seasons array
        playerData[playerName].seasons.push(seasonData);
        
        // Update career totals
        const career = playerData[playerName].career;
        career.gamesStarted += gamesStarted;
        career.wins += wins;
        career.losses += losses;
        career.passingYards += seasonData.passingYards;
        career.passingTDs += seasonData.passingTDs;
        career.interceptions += seasonData.interceptions;
        career.completions += seasonData.completions;
        career.attempts += seasonData.attempts;
        career.rushingYards += seasonData.rushingYards;
        career.rushingTDs += seasonData.rushingTDs;
        career.fumbles += seasonData.fumbles;
        career.fumblesLost += seasonData.fumblesLost;
        
        // Track passer rating for weighted averaging
        if (seasonData.passerRating > 0 && gamesStarted > 0) {
          career.totalPasserRatingPoints += seasonData.passerRating * gamesStarted;
        }
      });
      
      // Calculate final career averages and count unique seasons
      Object.values(playerData).forEach(player => {
        const career = player.career;
        const totalGames = career.gamesStarted;
        
        // Count unique seasons
        const uniqueSeasons = new Set(player.seasons.map(s => s.year));
        career.seasons = uniqueSeasons.size;
        
        // Calculate win percentage
        const totalDecisionGames = career.wins + career.losses;
        career.winPercentage = totalDecisionGames > 0 ? career.wins / totalDecisionGames : 0;
        
        // Calculate weighted average passer rating
        career.avgPasserRating = totalGames > 0 ? career.totalPasserRatingPoints / totalGames : 0;
        
        // Sort seasons by year (most recent first)
        player.seasons.sort((a, b) => b.year - a.year);
      });
      
      console.log(`✅ Built player data structure for ${Object.keys(playerData).length} unique players`);
      
      // Log sample player data for debugging
      const samplePlayerName = Object.keys(playerData)[0];
      if (samplePlayerName) {
        const samplePlayer = playerData[samplePlayerName];
        console.log('🔍 DEBUG - Sample player:', samplePlayerName);
        console.log('  Seasons:', samplePlayer.seasons.map(s => `${s.year}: ${s.gamesStarted} games`).join(', '));
        console.log('  Career:', {
          seasons: samplePlayer.career.seasons,
          gamesStarted: samplePlayer.career.gamesStarted,
          wins: samplePlayer.career.wins,
          losses: samplePlayer.career.losses
        });
      }
      
      // Process QB data to create the final structure with stats property
      // Pass the specific year for filtering
      let processedQBs = processQBData(playerData, year);
      
      // Additional filtering: only include QBs who have started games in this year
      processedQBs = processedQBs.filter(qb => {
        // Check if QB has any season data for this year with games started > 0
        const hasYearGames = qb.seasonData?.some(season => 
          season.year === year && season.gamesStarted > 0
        );
        return hasYearGames;
      });
      console.log(`📊 ${year} Filter: ${processedQBs.length} QBs have played in ${year} season`);
      
      if (processedQBs.length === 0) {
        console.warn(`⚠️ WARNING: 0 QBs found for ${year} after filtering!`);
        console.warn(`   This could mean:`);
        console.warn(`   1. No data exists in database for ${year}`);
        console.warn(`   2. All QBs were filtered out due to games started threshold`);
        console.warn(`   3. Data structure mismatch (check rawData)`);
      }
      
      console.log(`📊 After filtering: ${processedQBs.length} QBs passed threshold requirements`);
      
      // Special handling for 2025 mode to prevent flat 50 scores
      if (yearMode === '2025') {
        console.log('🔍 2025 Mode: Validating partial season data integrity');
        const valid2025QBs = processedQBs.filter(qb => {
          const has2025Data = qb.seasonData?.some(season => season.year === 2025);
          if (!has2025Data) {
            console.warn(`⚠️ ${qb.name} has no 2025 data - excluding from rankings`);
            return false;
          }
          
          // Additional validation for 2025 data quality
          const season2025 = qb.seasonData.find(season => season.year === 2025);
          const hasValidStats = season2025 && (
            (season2025.attempts > 0) || 
            (season2025.gamesStarted > 0) ||
            (season2025.passingYards > 0)
          );
          
          if (!hasValidStats) {
            console.warn(`⚠️ ${qb.name} has invalid 2025 stats - excluding from rankings`);
            return false;
          }
          
          return true;
        });
        
        if (valid2025QBs.length === 0) {
          console.error('❌ No valid 2025 QBs found after data refresh');
          setError('No valid 2025 quarterback data available');
          setLoading(false);
          return;
        }
        
        console.log(`✅ 2025 Mode: ${valid2025QBs.length} QBs passed validation`);
        processedQBs = valid2025QBs;
      }
      
      // Calculate QEI metrics for each QB - pass processedQBs as allQBData for z-score calculations
      const qbsWithMetrics = processedQBs.map(qb => {
        const baseScores = calculateQBMetrics(
          qb,
          { offensiveLine: 55, weapons: 30, defense: 15 }, // supportWeights
          { efficiency: 45, protection: 25, volume: 30 }, // statsWeights
          { regularSeason: 65, playoff: 35 }, // teamWeights
          { gameWinningDrives: 40, fourthQuarterComebacks: 25, clutchRate: 15, playoffBonus: 20 }, // clutchWeights
          true, // includePlayoffs
          year, // filterYear - pass the specific year being viewed
          { anyA: 45, tdPct: 30, completionPct: 25 }, // efficiencyWeights
          { sackPct: 60, turnoverRate: 40 }, // protectionWeights
          { passYards: 25, passTDs: 25, rushYards: 20, rushTDs: 15, totalAttempts: 15 }, // volumeWeights
          { availability: 75, consistency: 25 }, // durabilityWeights
          processedQBs, // allQBData for z-score calculations
          0 // mainSupportWeight
        );
        return {
          ...qb,
          baseScores
        };
      });

      setQbData(qbsWithMetrics);
      setLastFetch(Date.now());
      setLoading(false);
      
      console.log(`✅ Successfully processed ${qbsWithMetrics.length} quarterbacks from Supabase (${yearModeLabel})`);
      
    } catch (error) {
      console.error('❌ Error loading QB data from Supabase:', error);
      const userFriendlyError = handleSupabaseError(error);
      setError(`Failed to load QB data: ${userFriendlyError}`);
      setLoading(false);
    }
  }, []);

  // Force refresh by clearing cache and refetching
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refreshing QB data - clearing cache and refetching');
    setLastFetch(null);
    setQbData([]);
    // Trigger a new fetch
    await fetchAllQBData();
  }, [fetchAllQBData]);

  const fetchQBDataByYear = useCallback(async (year) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Loading QB data for ${year} from Supabase...`);
      
      const rawData = await qbDataService.fetchQBDataByYear(year);
      
      // Validate and transform data
      if (!validateDataStructure(rawData)) {
        throw new Error('Invalid data structure received from Supabase');
      }
      
      const transformedData = transformSeasonSummaryToCSV(rawData);
      
      // Convert to season data format for processing
      const seasonData = getSeasonDataForCalculations(rawData);
      
      // Group data by player name to create combined player data
      const playerData = {};
      seasonData.forEach(season => {
        // Extract player name from the raw data
        const rawRecord = rawData.find(r => r.season === season.year && r.team === season.team);
        const playerName = rawRecord?.player_name || 'Unknown Player';
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
              totalPasserRatingPoints: 0,
              rushingYards: 0,
              rushingTDs: 0,
              fumblesLost: 0
            }
          };
        }
        
        // Add season data
        playerData[playerName].seasons.push(season);
        
        // Update career totals
        const career = playerData[playerName].career;
        career.seasons++;
        career.gamesStarted += season.gamesStarted || 0;
        career.wins += season.wins || 0;
        career.losses += season.losses || 0;
        career.passingYards += season.passingYards || 0;
        career.passingTDs += season.passingTDs || 0;
        career.interceptions += season.interceptions || 0;
        career.completions += season.completions || 0;
        career.attempts += season.attempts || 0;
        career.rushingYards += season.rushingYards || 0;
        career.rushingTDs += season.rushingTDs || 0;
        career.fumbles += season.fumbles || 0;
        
        // Track passer rating for averaging
        if (season.passerRating > 0) {
          career.totalPasserRatingPoints += season.passerRating * (season.gamesStarted || 0);
        }
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
      });
      
      // Process QB data to create the final structure with stats property
      const processedQBs = processQBData(playerData, false); // Don't filter for 2024 only when fetching by year
      
      // Calculate QEI metrics for each QB - pass processedQBs as allQBData for z-score calculations
      const qbsWithMetrics = processedQBs.map(qb => {
        const baseScores = calculateQBMetrics(
          qb,
          { offensiveLine: 55, weapons: 30, defense: 15 }, // supportWeights
          { efficiency: 45, protection: 25, volume: 30 }, // statsWeights
          { regularSeason: 65, playoff: 35 }, // teamWeights
          { gameWinningDrives: 40, fourthQuarterComebacks: 25, clutchRate: 15, playoffBonus: 20 }, // clutchWeights
          true, // includePlayoffs
          false, // include2024Only
          { anyA: 45, tdPct: 30, completionPct: 25 }, // efficiencyWeights
          { sackPct: 60, turnoverRate: 40 }, // protectionWeights
          { passYards: 25, passTDs: 25, rushYards: 20, rushTDs: 15, totalAttempts: 15 }, // volumeWeights
          { availability: 75, consistency: 25 }, // durabilityWeights
          processedQBs, // allQBData for z-score calculations
          0 // mainSupportWeight
        );
        return {
          ...qb,
          baseScores
        };
      });

      setQbData(qbsWithMetrics);
      setLastFetch(Date.now());
      setLoading(false);
      
      console.log(`✅ Successfully processed ${qbsWithMetrics.length} quarterbacks for ${year}`);
      
    } catch (error) {
      console.error(`❌ Error loading ${year} QB data from Supabase:`, error);
      const userFriendlyError = handleSupabaseError(error);
      setError(`Failed to load ${year} QB data: ${userFriendlyError}`);
      setLoading(false);
    }
  }, []);

  const fetchQBDataByName = useCallback(async (playerName) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Loading QB data for ${playerName} from Supabase...`);
      
      const rawData = await qbDataService.fetchQBDataByName(playerName);
      
      // Validate and transform data
      if (!validateDataStructure(rawData)) {
        throw new Error('Invalid data structure received from Supabase');
      }
      
      const transformedData = transformSeasonSummaryToCSV(rawData);
      
      // Convert to season data format for processing
      const seasonData = getSeasonDataForCalculations(rawData);
      
      // Group data by player name to create combined player data
      const playerData = {};
      seasonData.forEach(season => {
        // Extract player name from the raw data
        const rawRecord = rawData.find(r => r.season === season.year && r.team === season.team);
        const playerName = rawRecord?.player_name || 'Unknown Player';
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
              totalPasserRatingPoints: 0,
              rushingYards: 0,
              rushingTDs: 0,
              fumblesLost: 0
            }
          };
        }
        
        // Add season data
        playerData[playerName].seasons.push(season);
        
        // Update career totals
        const career = playerData[playerName].career;
        career.seasons++;
        career.gamesStarted += season.gamesStarted || 0;
        career.wins += season.wins || 0;
        career.losses += season.losses || 0;
        career.passingYards += season.passingYards || 0;
        career.passingTDs += season.passingTDs || 0;
        career.interceptions += season.interceptions || 0;
        career.completions += season.completions || 0;
        career.attempts += season.attempts || 0;
        career.rushingYards += season.rushingYards || 0;
        career.rushingTDs += season.rushingTDs || 0;
        career.fumbles += season.fumbles || 0;
        
        // Track passer rating for averaging
        if (season.passerRating > 0) {
          career.totalPasserRatingPoints += season.passerRating * (season.gamesStarted || 0);
        }
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
      });
      
      // Process QB data to create the final structure with stats property
      const processedQBs = processQBData(playerData, false); // Don't filter for 2024 only when fetching by name
      
      // Calculate QEI metrics for each QB - pass processedQBs as allQBData for z-score calculations
      const qbsWithMetrics = processedQBs.map(qb => {
        const baseScores = calculateQBMetrics(
          qb,
          { offensiveLine: 55, weapons: 30, defense: 15 }, // supportWeights
          { efficiency: 45, protection: 25, volume: 30 }, // statsWeights
          { regularSeason: 65, playoff: 35 }, // teamWeights
          { gameWinningDrives: 40, fourthQuarterComebacks: 25, clutchRate: 15, playoffBonus: 20 }, // clutchWeights
          true, // includePlayoffs
          false, // include2024Only
          { anyA: 45, tdPct: 30, completionPct: 25 }, // efficiencyWeights
          { sackPct: 60, turnoverRate: 40 }, // protectionWeights
          { passYards: 25, passTDs: 25, rushYards: 20, rushTDs: 15, totalAttempts: 15 }, // volumeWeights
          { availability: 75, consistency: 25 }, // durabilityWeights
          processedQBs, // allQBData for z-score calculations
          0 // mainSupportWeight
        );
        return {
          ...qb,
          baseScores
        };
      });

      setQbData(qbsWithMetrics);
      setLastFetch(Date.now());
      setLoading(false);
      
      console.log(`✅ Successfully processed ${qbsWithMetrics.length} records for ${playerName}`);
      
    } catch (error) {
      console.error(`❌ Error loading QB data for ${playerName} from Supabase:`, error);
      const userFriendlyError = handleSupabaseError(error);
      setError(`Failed to load QB data for ${playerName}: ${userFriendlyError}`);
      setLoading(false);
    }
  }, []);

  const fetchQBDataWithFilters = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading QB data with filters from Supabase...', filters);
      
      const rawData = await qbDataService.fetchQBDataWithFilters(filters);
      
      // Validate and transform data
      if (!validateDataStructure(rawData)) {
        throw new Error('Invalid data structure received from Supabase');
      }
      
      const transformedData = transformSeasonSummaryToCSV(rawData);
      
      // Convert to season data format for processing
      const seasonData = getSeasonDataForCalculations(rawData);
      
      // Group data by player name to create combined player data
      const playerData = {};
      seasonData.forEach(season => {
        // Extract player name from the raw data
        const rawRecord = rawData.find(r => r.season === season.year && r.team === season.team);
        const playerName = rawRecord?.player_name || 'Unknown Player';
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
              totalPasserRatingPoints: 0,
              rushingYards: 0,
              rushingTDs: 0,
              fumblesLost: 0
            }
          };
        }
        
        // Add season data
        playerData[playerName].seasons.push(season);
        
        // Update career totals
        const career = playerData[playerName].career;
        career.seasons++;
        career.gamesStarted += season.gamesStarted || 0;
        career.wins += season.wins || 0;
        career.losses += season.losses || 0;
        career.passingYards += season.passingYards || 0;
        career.passingTDs += season.passingTDs || 0;
        career.interceptions += season.interceptions || 0;
        career.completions += season.completions || 0;
        career.attempts += season.attempts || 0;
        career.rushingYards += season.rushingYards || 0;
        career.rushingTDs += season.rushingTDs || 0;
        career.fumbles += season.fumbles || 0;
        
        // Track passer rating for averaging
        if (season.passerRating > 0) {
          career.totalPasserRatingPoints += season.passerRating * (season.gamesStarted || 0);
        }
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
      });
      
      // Process QB data to create the final structure with stats property
      const processedQBs = processQBData(playerData, false); // Don't filter for 2024 only when fetching with filters
      
      // Calculate QEI metrics for each QB - pass processedQBs as allQBData for z-score calculations
      const qbsWithMetrics = processedQBs.map(qb => {
        const baseScores = calculateQBMetrics(
          qb,
          { offensiveLine: 55, weapons: 30, defense: 15 }, // supportWeights
          { efficiency: 45, protection: 25, volume: 30 }, // statsWeights
          { regularSeason: 65, playoff: 35 }, // teamWeights
          { gameWinningDrives: 40, fourthQuarterComebacks: 25, clutchRate: 15, playoffBonus: 20 }, // clutchWeights
          true, // includePlayoffs
          false, // include2024Only
          { anyA: 45, tdPct: 30, completionPct: 25 }, // efficiencyWeights
          { sackPct: 60, turnoverRate: 40 }, // protectionWeights
          { passYards: 25, passTDs: 25, rushYards: 20, rushTDs: 15, totalAttempts: 15 }, // volumeWeights
          { availability: 75, consistency: 25 }, // durabilityWeights
          processedQBs, // allQBData for z-score calculations
          0 // mainSupportWeight
        );
        return {
          ...qb,
          baseScores
        };
      });

      setQbData(qbsWithMetrics);
      setLastFetch(Date.now());
      setLoading(false);
      
      console.log(`✅ Successfully processed ${qbsWithMetrics.length} QBs with filters`);
      
    } catch (error) {
      console.error('❌ Error loading filtered QB data from Supabase:', error);
      const userFriendlyError = handleSupabaseError(error);
      setError(`Failed to load filtered QB data: ${userFriendlyError}`);
      setLoading(false);
    }
  }, []);

  // Auto-fetch data on mount
  useEffect(() => {
    fetchAllQBData();
  }, []); // Remove fetchAllQBData dependency to prevent infinite loop

  return {
    qbData,
    loading,
    error,
    lastFetch,
    shouldRefreshData,
    fetchAllQBData,
    fetchQBDataByYear,
    fetchQBDataByName,
    fetchQBDataWithFilters,
    forceRefresh
  };
}; 