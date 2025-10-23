// Custom hook for QB data fetching and management
import { useState, useEffect } from 'react';
import { parseCSV } from '../utils/csvParser.js';
import { combinePlayerDataAcrossYears, processQBData } from '../utils/dataProcessor.js';
import { calculateQBMetrics } from '../utils/qbCalculations.js';

export const useQBData = () => {
  const [qbData, setQbData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Cache duration: 15 minutes
  const CACHE_DURATION = 15 * 60 * 1000;

  const shouldRefreshData = () => {
    if (!lastFetch) return true;
    return Date.now() - lastFetch > CACHE_DURATION;
  };

  const fetchAllQBData = async (yearMode = '2025') => {
    try {
      setLoading(true);
      setError(null);
      const year = parseInt(yearMode);
      console.log(`🔄 Loading QB data from CSV files for ${year}...`);
      
      // Load CSV data files for the specific year only (regular season + playoffs + rushing)
      const responseYear = await fetch(`/data/${year}.csv`);
      const responsePlayoffsYear = await fetch(`/data/${year}playoffs.csv`);
      const responseRushingYear = await fetch(`/data/${year}qbrushing.csv`);
      const responseRushingPlayoffsYear = await fetch(`/data/${year}qbrushingplayoffs.csv`);
      
      if (!responseYear.ok) throw new Error(`Failed to load ${year} data`);
      if (!responsePlayoffsYear.ok) throw new Error(`Failed to load ${year} playoff data`);
      if (!responseRushingYear.ok) throw new Error(`Failed to load ${year} rushing data`);
      if (!responseRushingPlayoffsYear.ok) throw new Error(`Failed to load ${year} playoff rushing data`);
      
      const csvYear = await responseYear.text();
      const csvPlayoffsYear = await responsePlayoffsYear.text();
      const csvRushingYear = await responseRushingYear.text();
      const csvRushingPlayoffsYear = await responseRushingPlayoffsYear.text();
      
      console.log('✅ CSV files loaded successfully');
      
      // Debug: Check raw CSV content
      console.log(`🔍 Raw CSV ${year} length:`, csvYear.length);
      console.log(`🔍 Raw CSV ${year} first 200 chars:`, csvYear.substring(0, 200));
      console.log(`🔍 Raw CSV ${year} first line:`, csvYear.split('\n')[0]);
      
      // Parse CSV data for this specific year
      const qbsYear = parseCSV(csvYear);
      const playoffQbsYear = parseCSV(csvPlayoffsYear);
      const rushingQbsYear = parseCSV(csvRushingYear);
      const rushingPlayoffQbsYear = parseCSV(csvRushingPlayoffsYear);
      
      console.log(`📊 Parsed regular season data: ${qbsYear.length} QBs in ${year}`);
      console.log(`🏆 Parsed playoff data: ${playoffQbsYear.length} QBs in ${year} playoffs`);
      console.log(`🏃 Parsed rushing data: ${rushingQbsYear.length} QBs in ${year}`);
      console.log(`🏃🏆 Parsed playoff rushing data: ${rushingPlayoffQbsYear.length} QBs in ${year}`);
      
      // Debug: Check first few rows of parsed data
      console.log(`🔍 Debug - First 3 rows of ${year} data:`, qbsYear.slice(0, 3));
      console.log('🔍 Debug - Available columns:', Object.keys(qbsYear[0] || {}));
      
      // Combine regular season, playoff, and rushing data for this year
      // We pass data to the appropriate year slot and empty arrays for others
      const emptyArray = [];
      const qbs2024 = year === 2024 ? qbsYear : emptyArray;
      const qbs2023 = year === 2023 ? qbsYear : emptyArray;
      const qbs2022 = year === 2022 ? qbsYear : emptyArray;
      
      const playoffQbs2024 = year === 2024 ? playoffQbsYear : emptyArray;
      const playoffQbs2023 = year === 2023 ? playoffQbsYear : emptyArray;
      const playoffQbs2022 = year === 2022 ? playoffQbsYear : emptyArray;
      
      const rushingQbs2024 = year === 2024 ? rushingQbsYear : emptyArray;
      const rushingQbs2023 = year === 2023 ? rushingQbsYear : emptyArray;
      const rushingQbs2022 = year === 2022 ? rushingQbsYear : emptyArray;
      
      const rushingPlayoffQbs2024 = year === 2024 ? rushingPlayoffQbsYear : emptyArray;
      const rushingPlayoffQbs2023 = year === 2023 ? rushingPlayoffQbsYear : emptyArray;
      const rushingPlayoffQbs2022 = year === 2022 ? rushingPlayoffQbsYear : emptyArray;
      
      // 2025 data
      const qbs2025 = year === 2025 ? qbsYear : emptyArray;
      const playoffQbs2025 = year === 2025 ? playoffQbsYear : emptyArray;
      const rushingQbs2025 = year === 2025 ? rushingQbsYear : emptyArray;
      const rushingPlayoffQbs2025 = year === 2025 ? rushingPlayoffQbsYear : emptyArray;
      
      const combinedQBData = combinePlayerDataAcrossYears(
        qbs2024, qbs2023, qbs2022,
        playoffQbs2024, playoffQbs2023, playoffQbs2022,
        rushingQbs2024, rushingQbs2023, rushingQbs2022,
        rushingPlayoffQbs2024, rushingPlayoffQbs2023, rushingPlayoffQbs2022,
        qbs2025, playoffQbs2025, rushingQbs2025, rushingPlayoffQbs2025
      );
      
      console.log(`📊 Combined data for ${Object.keys(combinedQBData).length} unique quarterbacks in ${year}`);
      
      // Convert combined data to our QB format, passing the year for filtering
      const processedQBs = processQBData(combinedQBData, year);
      
      // Calculate QEI metrics - pass processedQBs as allQBData for z-score calculations
      const qbsWithMetrics = processedQBs.map(qb => {
        const baseScores = calculateQBMetrics(
          qb,
          { offensiveLine: 55, weapons: 30, defense: 15 }, // supportWeights
          { efficiency: 45, protection: 25, volume: 30 }, // statsWeights
          { regularSeason: 65, playoff: 35 }, // teamWeights
          { gameWinningDrives: 40, fourthQuarterComebacks: 25, clutchRate: 15, playoffBonus: 20 }, // clutchWeights
          true, // includePlayoffs
          true, // isSingleYear - all modes are now single-year
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
      console.error('❌ Error loading QB data from CSV:', error);
      setError(`Failed to load QB data: ${error.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllQBData();
  }, []);

  return {
    qbData,
    loading,
    error,
    lastFetch,
    shouldRefreshData,
    fetchAllQBData
  };
}; 