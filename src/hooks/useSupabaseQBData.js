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

  // Cache duration: 15 minutes (same as CSV version)
  const CACHE_DURATION = 15 * 60 * 1000;

  const shouldRefreshData = useCallback(() => {
    if (!lastFetch) return true;
    return Date.now() - lastFetch > CACHE_DURATION;
  }, [lastFetch]);

  const fetchAllQBData = useCallback(async (include2024Only = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Loading QB data from Supabase... (2024 Only: ${include2024Only})`);
      
      // Fetch data from Supabase
      const rawData = await qbDataService.fetchAllQBData(include2024Only);
      
      // Validate data structure
      if (!validateDataStructure(rawData)) {
        throw new Error('Invalid data structure received from Supabase');
      }
      
      // Transform data to CSV format for compatibility
      const transformedData = transformSeasonSummaryToCSV(rawData);
      logTransformationStats(rawData, transformedData);
      
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
              rushingTDs: 0
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
      const processedQBs = processQBData(playerData, include2024Only);
      
      // Calculate QEI metrics for each QB
      const qbsWithMetrics = processedQBs.map(qb => {
        const baseScores = calculateQBMetrics(qb);
        return {
          ...qb,
          baseScores
        };
      });

      setQbData(qbsWithMetrics);
      setLastFetch(Date.now());
      setLoading(false);
      
      console.log(`✅ Successfully processed ${qbsWithMetrics.length} quarterbacks from Supabase${include2024Only ? ' (2024 only mode)' : ''}`);
      
    } catch (error) {
      console.error('❌ Error loading QB data from Supabase:', error);
      const userFriendlyError = handleSupabaseError(error);
      setError(`Failed to load QB data: ${userFriendlyError}`);
      setLoading(false);
    }
  }, []);

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
              rushingTDs: 0
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
      
      // Calculate QEI metrics for each QB
      const qbsWithMetrics = processedQBs.map(qb => {
        const baseScores = calculateQBMetrics(qb);
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
              rushingTDs: 0
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
      
      // Calculate QEI metrics for each QB
      const qbsWithMetrics = processedQBs.map(qb => {
        const baseScores = calculateQBMetrics(qb);
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
              rushingTDs: 0
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
      
      // Calculate QEI metrics for each QB
      const qbsWithMetrics = processedQBs.map(qb => {
        const baseScores = calculateQBMetrics(qb);
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
  }, [fetchAllQBData]);

  return {
    qbData,
    loading,
    error,
    lastFetch,
    shouldRefreshData,
    fetchAllQBData,
    fetchQBDataByYear,
    fetchQBDataByName,
    fetchQBDataWithFilters
  };
}; 