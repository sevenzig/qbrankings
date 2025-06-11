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

  const fetchAllQBData = async (include2024Only = false) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🔄 Loading QB data from CSV files... (2024 Only: ${include2024Only})`);
      
      // Load CSV data files (regular season + playoffs + rushing)
      const response2024 = await fetch('/data/2024.csv');
      const responsePlayoffs2024 = await fetch('/data/2024playoffs.csv');
      const responseRushing2024 = await fetch('/data/2024qbrushing.csv');
      const responseRushingPlayoffs2024 = await fetch('/data/2024qbrushingplayoffs.csv');
      
      if (!response2024.ok) throw new Error('Failed to load 2024 data');
      if (!responsePlayoffs2024.ok) throw new Error('Failed to load 2024 playoff data');
      if (!responseRushing2024.ok) throw new Error('Failed to load 2024 rushing data');
      if (!responseRushingPlayoffs2024.ok) throw new Error('Failed to load 2024 playoff rushing data');
      
      const csv2024 = await response2024.text();
      const csvPlayoffs2024 = await responsePlayoffs2024.text();
      const csvRushing2024 = await responseRushing2024.text();
      const csvRushingPlayoffs2024 = await responseRushingPlayoffs2024.text();
      
      // Only load multi-year data if not in 2024-only mode
      let csv2023 = '', csv2022 = '', csvPlayoffs2023 = '', csvPlayoffs2022 = '';
      let csvRushing2023 = '', csvRushing2022 = '', csvRushingPlayoffs2023 = '', csvRushingPlayoffs2022 = '';
      
      if (!include2024Only) {
        const response2023 = await fetch('/data/2023.csv');
        const response2022 = await fetch('/data/2022.csv');
        const responsePlayoffs2023 = await fetch('/data/2023playoffs.csv');
        const responsePlayoffs2022 = await fetch('/data/2022playoffs.csv');
        const responseRushing2023 = await fetch('/data/2023qbrushing.csv');
        const responseRushing2022 = await fetch('/data/2022qbrushing.csv');
        const responseRushingPlayoffs2023 = await fetch('/data/2023qbrushingplayoffs.csv');
        const responseRushingPlayoffs2022 = await fetch('/data/2022qbrushingplayoffs.csv');
        
        if (!response2023.ok) throw new Error('Failed to load 2023 data');
        if (!response2022.ok) throw new Error('Failed to load 2022 data');
        if (!responsePlayoffs2023.ok) throw new Error('Failed to load 2023 playoff data');
        if (!responsePlayoffs2022.ok) throw new Error('Failed to load 2022 playoff data');
        if (!responseRushing2023.ok) throw new Error('Failed to load 2023 rushing data');
        if (!responseRushing2022.ok) throw new Error('Failed to load 2022 rushing data');
        if (!responseRushingPlayoffs2023.ok) throw new Error('Failed to load 2023 playoff rushing data');
        if (!responseRushingPlayoffs2022.ok) throw new Error('Failed to load 2022 playoff rushing data');
        
        csv2023 = await response2023.text();
        csv2022 = await response2022.text();
        csvPlayoffs2023 = await responsePlayoffs2023.text();
        csvPlayoffs2022 = await responsePlayoffs2022.text();
        csvRushing2023 = await responseRushing2023.text();
        csvRushing2022 = await responseRushing2022.text();
        csvRushingPlayoffs2023 = await responseRushingPlayoffs2023.text();
        csvRushingPlayoffs2022 = await responseRushingPlayoffs2022.text();
      }
      
      console.log('✅ CSV files loaded successfully');
      
      // Debug: Check raw CSV content
      console.log('🔍 Raw CSV 2024 length:', csv2024.length);
      console.log('🔍 Raw CSV 2024 first 200 chars:', csv2024.substring(0, 200));
      console.log('🔍 Raw CSV 2024 first line:', csv2024.split('\n')[0]);
      
      // Parse CSV data
      const qbs2024 = parseCSV(csv2024);
      const playoffQbs2024 = parseCSV(csvPlayoffs2024);
      const rushingQbs2024 = parseCSV(csvRushing2024);
      const rushingPlayoffQbs2024 = parseCSV(csvRushingPlayoffs2024);
      
      let qbs2023 = [], qbs2022 = [], playoffQbs2023 = [], playoffQbs2022 = [];
      let rushingQbs2023 = [], rushingQbs2022 = [], rushingPlayoffQbs2023 = [], rushingPlayoffQbs2022 = [];
      
      if (!include2024Only) {
        qbs2023 = parseCSV(csv2023);
        qbs2022 = parseCSV(csv2022);
        playoffQbs2023 = parseCSV(csvPlayoffs2023);
        playoffQbs2022 = parseCSV(csvPlayoffs2022);
        rushingQbs2023 = parseCSV(csvRushing2023);
        rushingQbs2022 = parseCSV(csvRushing2022);
        rushingPlayoffQbs2023 = parseCSV(csvRushingPlayoffs2023);
        rushingPlayoffQbs2022 = parseCSV(csvRushingPlayoffs2022);
      }
      
      console.log(`📊 Parsed regular season data: ${qbs2024.length} QBs in 2024${!include2024Only ? `, ${qbs2023.length} in 2023, ${qbs2022.length} in 2022` : ' (2024 only mode)'}`);
      console.log(`🏆 Parsed playoff data: ${playoffQbs2024.length} QBs in 2024 playoffs${!include2024Only ? `, ${playoffQbs2023.length} in 2023 playoffs, ${playoffQbs2022.length} in 2022 playoffs` : ' (2024 only mode)'}`);
      console.log(`🏃 Parsed rushing data: ${rushingQbs2024.length} QBs in 2024${!include2024Only ? `, ${rushingQbs2023.length} in 2023, ${rushingQbs2022.length} in 2022` : ' (2024 only mode)'}`);
      console.log(`🏃🏆 Parsed playoff rushing data: ${rushingPlayoffQbs2024.length} QBs in 2024${!include2024Only ? `, ${rushingPlayoffQbs2023.length} in 2023, ${rushingPlayoffQbs2022.length} in 2022` : ' (2024 only mode)'}`);
      
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
      
      console.log(`📊 Combined data for ${Object.keys(combinedQBData).length} unique quarterbacks${!include2024Only ? ' across 3 seasons' : ' (2024 only)'}`);
      
      // Convert combined data to our QB format
      const processedQBs = processQBData(combinedQBData, include2024Only);
      
      // Calculate QEI metrics
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
      
      console.log(`✅ Successfully processed ${qbsWithMetrics.length} quarterbacks${include2024Only ? ' (2024 only mode)' : ''}`);
      
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