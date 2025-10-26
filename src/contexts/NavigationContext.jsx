/**
 * NavigationContext - Shared state for navigation menu and QB ranking controls
 * 
 * Performance Optimizations:
 * 1. Memoized context value to prevent unnecessary re-renders
 * 2. Single context for all navigation-related state
 * 3. Optimized for slide menu integration
 */
import React, { createContext, useContext, useState, useCallback, memo } from 'react';

const NavigationContext = createContext();

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export const NavigationProvider = memo(({ children }) => {
  // Philosophy preset state
  const [currentPreset, setCurrentPreset] = useState('default');
  
  // Weight controls state - Pure QB Quality Focus (NFL Scout Optimized)
  const [weights, setWeights] = useState({
    team: 0,      // Team success removed - focus on individual QB performance
    stats: 100,   // Pure statistical evaluation of QB ability
    clutch: 0,    // Clutch performance removed - focus on consistent production
    durability: 0, // Durability removed - focus on per-game performance
    support: 0    // Supporting cast removed - isolate QB talent
  });
  
  // Global settings state
  const [includePlayoffs, setIncludePlayoffs] = useState(false);
  const [yearMode, setYearMode] = useState('2025');

  // Preset change handler
  const handlePresetChange = useCallback((presetId) => {
    setCurrentPreset(presetId);
  }, []);

  // Weight change handler
  const handleWeightsChange = useCallback((newWeights) => {
    setWeights(newWeights);
  }, []);

  // Playoff toggle handler
  const handleIncludePlayoffsChange = useCallback((value) => {
    setIncludePlayoffs(value);
  }, []);

  // Year mode change handler
  const handleYearModeChange = useCallback((mode) => {
    setYearMode(mode);
  }, []);

  const contextValue = {
    // State
    currentPreset,
    weights,
    includePlayoffs,
    yearMode,
    
    // Handlers
    onPresetChange: handlePresetChange,
    onWeightsChange: handleWeightsChange,
    onIncludePlayoffsChange: handleIncludePlayoffsChange,
    onYearModeChange: handleYearModeChange
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
});

export default NavigationContext;
