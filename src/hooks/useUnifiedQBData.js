// Unified QB data hook that can switch between CSV and Supabase data sources
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQBData } from './useQBData.js';
import { useSupabaseQBData } from './useSupabaseQBData.js';

export const useUnifiedQBData = (initialDataSource = 'supabase') => {
  const [dataSource, setDataSource] = useState(initialDataSource);
  const [isSwitching, setIsSwitching] = useState(false);

  // Initialize both data hooks (React hooks must be called unconditionally)
  // Only the active one will be used based on dataSource
  const csvData = useQBData();
  const supabaseData = useSupabaseQBData();

  // Select the active data source
  const activeData = useMemo(() => {
    return dataSource === 'csv' ? csvData : supabaseData;
  }, [dataSource, csvData, supabaseData]);

  // Switch data source with loading state
  const switchDataSource = useCallback(async (newDataSource) => {
    if (newDataSource === dataSource) return;
    
    setIsSwitching(true);
    setDataSource(newDataSource);
    
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSwitching(false);
  }, [dataSource]);

  // Determine if we should show loading state
  const isLoading = useMemo(() => {
    return activeData.loading || isSwitching;
  }, [activeData.loading, isSwitching]);

  // Get the current error state
  const error = useMemo(() => {
    return activeData.error;
  }, [activeData.error]);

  // Determine if Supabase is available
  const isSupabaseAvailable = useMemo(() => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      return !!(supabaseUrl && supabaseAnonKey);
    } catch {
      return false;
    }
  }, []);

  // Warn if Supabase is not available (CSV fallback can be used if needed)
  useEffect(() => {
    if (dataSource === 'supabase' && !isSupabaseAvailable) {
      console.error('❌ Supabase not available - data cannot be loaded. Please check environment variables.');
      console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    }
  }, [dataSource, isSupabaseAvailable]);

  // Return unified interface
  return {
    // Data state
    qbData: activeData.qbData,
    loading: isLoading,
    error,
    lastFetch: activeData.lastFetch,
    
    // Data source state
    dataSource,
    isSupabaseAvailable,
    isSwitching,
    
    // Actions
    switchDataSource,
    shouldRefreshData: activeData.shouldRefreshData,
    fetchAllQBData: activeData.fetchAllQBData,
    fetchQBDataByYear: activeData.fetchQBDataByYear,
    fetchQBDataByName: activeData.fetchQBDataByName,
    fetchQBDataWithFilters: activeData.fetchQBDataWithFilters,
    
    // Source-specific methods (for advanced usage)
    csvData: dataSource === 'csv' ? csvData : null,
    supabaseData: dataSource === 'supabase' ? supabaseData : null
  };
}; 