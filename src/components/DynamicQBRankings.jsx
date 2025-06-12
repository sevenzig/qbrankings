/**
 * DynamicQBRankings - Main QB rankings component with performance optimizations
 * 
 * Performance Optimizations:
 * 1. Memoized all event handlers with useCallback to prevent unnecessary re-renders
 * 2. Memoized expensive calculations (rankedQBs, totalWeight, preset descriptions)
 * 3. Split large component into focused sub-components:
 *    - GlobalSettings: Playoff and 2024-only toggles
 *    - WeightControls: Main weight sliders with show/hide details
 *    - QBRankingsTable: QB rankings table with optimized row rendering
 *    - WeightSlider: Individual weight slider component
 * 4. Extracted utility functions to dedicated components to reduce main component size
 * 5. Used React.memo for all sub-components to prevent unnecessary re-renders
 */
import React, { useState, useEffect, useMemo, useCallback, startTransition } from 'react';
import { useQBData } from '../hooks/useQBData.js';
import { calculateQEI, calculateQBMetrics } from '../utils/qbCalculations.js';
import { getQEIColor } from '../utils/uiHelpers.js';
import { PHILOSOPHY_PRESETS, getTeamInfo } from '../constants/teamData.js';
import { 
  calculateTeamScore, 
  calculateStatsScore, 
  calculateClutchScore, 
  calculateDurabilityScore, 
  calculateSupportScore
} from './scoringCategories/index.js';
import GlobalSettings from './GlobalSettings.jsx';
import WeightControls from './WeightControls.jsx';
import QBRankingsTable from './QBRankingsTable.jsx';
import ShareModal from './ShareModal.jsx';
import { captureTop10QBsScreenshot } from '../utils/screenshotUtils.js';

const DynamicQBRankings = ({ onShowDocumentation }) => {
  const { qbData, loading, error, lastFetch, shouldRefreshData, fetchAllQBData } = useQBData();
  
  const [weights, setWeights] = useState({
    team: 35,
    stats: 35,
    clutch: 5,
    durability: 10,
    support: 15
  });
  const [currentPreset, setCurrentPreset] = useState('default');
  const [isCustomizeAccordionOpen, setIsCustomizeAccordionOpen] = useState(false);
  const [supportWeights, setSupportWeights] = useState({
    offensiveLine: 34,
    weapons: 33,
    defense: 33
  });
  const [showSupportDetails, setShowSupportDetails] = useState(false);
  const [statsWeights, setStatsWeights] = useState({
    efficiency: 34,      // ANY/A, TD%, Completion%
    protection: 33,      // Sack%, Int%, Fumble%
    volume: 33          // Volume and production metrics
  });
  const [showStatsDetails, setShowStatsDetails] = useState(false);
  const [showEfficiencyDetails, setShowEfficiencyDetails] = useState(false);
  const [showProtectionDetails, setShowProtectionDetails] = useState(false);
  const [showVolumeDetails, setShowVolumeDetails] = useState(false);
  
  // Sub-component weights for stats categories
  const [efficiencyWeights, setEfficiencyWeights] = useState({
    anyA: 45,           // Adjusted Net Yards per Attempt
    tdPct: 30,          // Touchdown percentage
    completionPct: 25   // Completion percentage
  });
  const [protectionWeights, setProtectionWeights] = useState({
    sackPct: 60,        // Sack percentage
    turnoverRate: 40    // Combined turnover rate (attempts/turnovers)
  });
  const [volumeWeights, setVolumeWeights] = useState({
    passYards: 25,      // Passing yards
    passTDs: 25,        // Passing touchdowns
    rushYards: 20,      // Rushing yards
    rushTDs: 15,        // Rushing touchdowns
    totalAttempts: 15   // Total attempts (pass + rush)
  });
  const [teamWeights, setTeamWeights] = useState({
    regularSeason: 50,   // Regular season win percentage
    offenseDVOA: 50,     // Offensive output performance
    playoff: 0           // Career playoff achievement score (disabled by default)
  });
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [clutchWeights, setClutchWeights] = useState({
    gameWinningDrives: 25,    // GWD score component
    fourthQuarterComebacks: 25, // 4QC score component
    clutchRate: 25,           // Combined clutch rate score
    playoffBonus: 25          // Playoff success bonus (disabled when playoffs off)
  });
  const [showClutchDetails, setShowClutchDetails] = useState(false);
  const [durabilityWeights, setDurabilityWeights] = useState({
    availability: 50,         // Season availability score
    consistency: 50           // Multi-year consistency bonus
  });
  const [showDurabilityDetails, setShowDurabilityDetails] = useState(false);

  // Global playoff inclusion toggle - affects ALL calculations
  const [includePlayoffs, setIncludePlayoffs] = useState(false);

  // Global 2024-only toggle - affects ALL data loading and disables year-based sliders
  const [include2024Only, setInclude2024Only] = useState(false);

  // Scroll to top functionality
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Input validation helper function
  const validateNumberInput = useCallback((value, min = 0, max = 100) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return min;
    return Math.max(min, Math.min(max, numValue));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Effect to automatically adjust clutch weights when playoff toggle changes
  useEffect(() => {
    if (!includePlayoffs) {
      // When playoffs are disabled, set playoff bonus to 0% and redistribute to other components
      setClutchWeights(prev => {
        if (prev.playoffBonus === 0) return prev; // Already adjusted
        
        // New balanced defaults when no playoffs: GWD 50%, 4QC 30%, Rate 20%
        return {
          gameWinningDrives: 50,    // Increased from 40%
          fourthQuarterComebacks: 30, // Increased from 25%
          clutchRate: 20,           // Increased from 15%
          playoffBonus: 0           // Disabled
        };
      });
    } else {
      // When playoffs are re-enabled, restore balanced defaults
      setClutchWeights(prev => {
        if (prev.playoffBonus > 0) return prev; // Already has playoff bonus
        
        // Restore original balanced defaults: GWD 40%, 4QC 25%, Rate 15%, Playoff 20%
        return {
          gameWinningDrives: 40,
          fourthQuarterComebacks: 25,
          clutchRate: 15,
          playoffBonus: 20
        };
      });
    }
  }, [includePlayoffs]); // Run when includePlayoffs changes

  const updateWeight = useCallback((category, value) => {
    const validatedValue = validateNumberInput(value, 0, 100);
    setWeights(prev => ({
      ...prev,
      [category]: validatedValue
    }));
    setCurrentPreset('custom'); // Reset to custom when manually adjusting
  }, [validateNumberInput]);

  const updateSupportWeight = useCallback((component, value) => {
    const validatedValue = validateNumberInput(value, 0, 100);
    setSupportWeights(prev => {
      return { ...prev, [component]: validatedValue };
    });
  }, [validateNumberInput]);

  const updateStatsWeight = useCallback((component, value) => {
    const validatedValue = validateNumberInput(value, 0, 100);
    setStatsWeights(prev => {
      return { ...prev, [component]: validatedValue };
    });
  }, [validateNumberInput]);

  const updateEfficiencyWeight = useCallback((component, value) => {
    const validatedValue = validateNumberInput(value, 0, 100);
    setEfficiencyWeights(prev => {
      return { ...prev, [component]: validatedValue };
    });
  }, [validateNumberInput]);

  const updateProtectionWeight = useCallback((component, value) => {
    const validatedValue = validateNumberInput(value, 0, 100);
    setProtectionWeights(prev => {
      return { ...prev, [component]: validatedValue };
    });
  }, [validateNumberInput]);

  const updateVolumeWeight = useCallback((component, value) => {
    const validatedValue = validateNumberInput(value, 0, 100);
    setVolumeWeights(prev => {
      return { ...prev, [component]: validatedValue };
    });
  }, [validateNumberInput]);

  const updateTeamWeight = useCallback((component, value) => {
    // If playoffs are disabled, freeze the playoff slider and don't allow changes
    if (!includePlayoffs && component === 'playoff') {
      return;
    }
    
    const validatedValue = validateNumberInput(value, 0, 100);
    setTeamWeights(prev => {
      // When playoffs are disabled, ensure playoff stays at 0% but allow other components to be updated
      if (!includePlayoffs) {
        return { 
          ...prev, 
          [component]: validatedValue,
          playoff: 0  // Keep playoff at 0 when disabled
        };
      }
      
      return { ...prev, [component]: validatedValue };
    });
  }, [includePlayoffs, validateNumberInput]);

  const updateClutchWeight = useCallback((component, value) => {
    // If playoffs are disabled, freeze the playoff bonus slider and don't allow changes
    if (!includePlayoffs && component === 'playoffBonus') {
      return;
    }
    
    const validatedValue = validateNumberInput(value, 0, 100);
    setClutchWeights(prev => {
      // When playoffs are disabled, automatically set playoffBonus to 0%
      if (!includePlayoffs && component === 'playoffBonus') {
        return prev; // Don't change anything
      }
      
      return { ...prev, [component]: validatedValue };
    });
  }, [includePlayoffs, validateNumberInput]);

  const updateDurabilityWeight = useCallback((component, value) => {
    const validatedValue = validateNumberInput(value, 0, 100);
    setDurabilityWeights(prev => {
      return { ...prev, [component]: validatedValue };
    });
  }, [validateNumberInput]);

  const applyPreset = useCallback((presetName) => {
    const preset = PHILOSOPHY_PRESETS[presetName];
    if (!preset) return;
    
    // Extract only the weight categories, exclude the description and sub-component weights
    const { description, supportWeights, statsWeights, teamWeights, clutchWeights, durabilityWeights, ...weightCategories } = preset;
    
    // Use startTransition to batch all state updates for better performance
    startTransition(() => {
      setWeights(weightCategories);
      setCurrentPreset(presetName);
      
      // Apply sub-component weights if they exist in the preset
      if (supportWeights) {
        setSupportWeights(supportWeights);
      }
      
      if (statsWeights) {
        setStatsWeights(statsWeights);
      }
      
      if (teamWeights) {
        setTeamWeights(teamWeights);
      }
      
      if (clutchWeights) {
        setClutchWeights(clutchWeights);
      }
      
      if (durabilityWeights) {
        setDurabilityWeights(durabilityWeights);
      }
    });
  }, []);

  const normalizeWeights = useCallback(() => {
    const currentTotal = Object.values(weights).reduce((sum, val) => sum + val, 0);
    
    if (currentTotal === 0) {
      // If all weights are 0, reset to balanced preset
      applyPreset('balanced');
      return;
    }
    
    if (currentTotal === 100) {
      // Already at 100%, no need to normalize
      return;
    }
    
    // Calculate normalized weights preserving ratios
    const normalizedWeights = {};
    Object.entries(weights).forEach(([category, value]) => {
      normalizedWeights[category] = Math.round((value / currentTotal) * 100);
    });
    
    // Handle rounding errors - ensure total is exactly 100
    const normalizedTotal = Object.values(normalizedWeights).reduce((sum, val) => sum + val, 0);
    const difference = 100 - normalizedTotal;
    
    if (difference !== 0) {
      // Adjust the largest weight to make total exactly 100
      const largestCategory = Object.entries(normalizedWeights)
        .reduce((max, [category, value]) => value > max.value ? { category, value } : max, { category: null, value: 0 });
      
      if (largestCategory.category) {
        normalizedWeights[largestCategory.category] += difference;
      }
    }
    
    setWeights(normalizedWeights);
    setCurrentPreset('custom');
  }, [weights, applyPreset]);

  // Normalization functions for sub-components
  const normalizeSupportWeights = useCallback(() => {
    const currentTotal = Object.values(supportWeights).reduce((sum, val) => sum + val, 0);
    
    if (currentTotal === 0) {
      // Reset to default if all are 0
      setSupportWeights({ offensiveLine: 55, weapons: 30, defense: 15 });
      return;
    }
    
    if (currentTotal === 100) return;
    
    const normalizedWeights = {};
    Object.entries(supportWeights).forEach(([category, value]) => {
      normalizedWeights[category] = Math.round((value / currentTotal) * 100);
    });
    
    // Handle rounding errors
    const normalizedTotal = Object.values(normalizedWeights).reduce((sum, val) => sum + val, 0);
    const difference = 100 - normalizedTotal;
    
    if (difference !== 0) {
      const largestCategory = Object.entries(normalizedWeights)
        .reduce((max, [category, value]) => value > max.value ? { category, value } : max, { category: null, value: 0 });
      
      if (largestCategory.category) {
        normalizedWeights[largestCategory.category] += difference;
      }
    }
    
    setSupportWeights(normalizedWeights);
  }, [supportWeights]);

  const normalizeStatsWeights = useCallback(() => {
    const currentTotal = Object.values(statsWeights).reduce((sum, val) => sum + val, 0);
    
    if (currentTotal === 0) {
      setStatsWeights({ efficiency: 45, protection: 25, volume: 30 });
      return;
    }
    
    if (currentTotal === 100) return;
    
    const normalizedWeights = {};
    Object.entries(statsWeights).forEach(([category, value]) => {
      normalizedWeights[category] = Math.round((value / currentTotal) * 100);
    });
    
    const normalizedTotal = Object.values(normalizedWeights).reduce((sum, val) => sum + val, 0);
    const difference = 100 - normalizedTotal;
    
    if (difference !== 0) {
      const largestCategory = Object.entries(normalizedWeights)
        .reduce((max, [category, value]) => value > max.value ? { category, value } : max, { category: null, value: 0 });
      
      if (largestCategory.category) {
        normalizedWeights[largestCategory.category] += difference;
      }
    }
    
    setStatsWeights(normalizedWeights);
  }, [statsWeights]);

  const normalizeEfficiencyWeights = useCallback(() => {
    const currentTotal = Object.values(efficiencyWeights).reduce((sum, val) => sum + val, 0);
    if (currentTotal === 0) {
      setEfficiencyWeights({ anyA: 45, tdPct: 30, completionPct: 25 });
      return;
    }
    if (currentTotal === 100) return;
    
    const normalizedWeights = {};
    Object.entries(efficiencyWeights).forEach(([category, value]) => {
      normalizedWeights[category] = Math.round((value / currentTotal) * 100);
    });
    
    const normalizedTotal = Object.values(normalizedWeights).reduce((sum, val) => sum + val, 0);
    const difference = 100 - normalizedTotal;
    
    if (difference !== 0) {
      const largestCategory = Object.entries(normalizedWeights)
        .reduce((max, [category, value]) => value > max.value ? { category, value } : max, { category: null, value: 0 });
      
      if (largestCategory.category) {
        normalizedWeights[largestCategory.category] += difference;
      }
    }
    
    setEfficiencyWeights(normalizedWeights);
  }, [efficiencyWeights]);

  const normalizeProtectionWeights = useCallback(() => {
    const currentTotal = Object.values(protectionWeights).reduce((sum, val) => sum + val, 0);
    if (currentTotal === 0) {
      setProtectionWeights({ sackPct: 60, turnoverRate: 40 });
      return;
    }
    if (currentTotal === 100) return;
    
    const normalizedWeights = {};
    Object.entries(protectionWeights).forEach(([category, value]) => {
      normalizedWeights[category] = Math.round((value / currentTotal) * 100);
    });
    
    const normalizedTotal = Object.values(normalizedWeights).reduce((sum, val) => sum + val, 0);
    const difference = 100 - normalizedTotal;
    
    if (difference !== 0) {
      const largestCategory = Object.entries(normalizedWeights)
        .reduce((max, [category, value]) => value > max.value ? { category, value } : max, { category: null, value: 0 });
      
      if (largestCategory.category) {
        normalizedWeights[largestCategory.category] += difference;
      }
    }
    
    setProtectionWeights(normalizedWeights);
  }, [protectionWeights]);

  const normalizeVolumeWeights = useCallback(() => {
    const currentTotal = Object.values(volumeWeights).reduce((sum, val) => sum + val, 0);
    if (currentTotal === 0) {
      setVolumeWeights({ passYards: 25, passTDs: 25, rushYards: 20, rushTDs: 15, totalAttempts: 15 });
      return;
    }
    if (currentTotal === 100) return;
    
    const normalizedWeights = {};
    Object.entries(volumeWeights).forEach(([category, value]) => {
      normalizedWeights[category] = Math.round((value / currentTotal) * 100);
    });
    
    const normalizedTotal = Object.values(normalizedWeights).reduce((sum, val) => sum + val, 0);
    const difference = 100 - normalizedTotal;
    
    if (difference !== 0) {
      const largestCategory = Object.entries(normalizedWeights)
        .reduce((max, [category, value]) => value > max.value ? { category, value } : max, { category: null, value: 0 });
      
      if (largestCategory.category) {
        normalizedWeights[largestCategory.category] += difference;
      }
    }
    
    setVolumeWeights(normalizedWeights);
  }, [volumeWeights]);

  const normalizeTeamWeights = useCallback(() => {
    const currentTotal = Object.values(teamWeights).reduce((sum, val) => sum + val, 0);
    
    if (currentTotal === 0) {
      setTeamWeights({ regularSeason: 65, offenseDVOA: 15, playoff: 35 });
      return;
    }
    
    if (currentTotal === 100) return;
    
    const normalizedWeights = {};
    Object.entries(teamWeights).forEach(([category, value]) => {
      normalizedWeights[category] = Math.round((value / currentTotal) * 100);
    });
    
    const normalizedTotal = Object.values(normalizedWeights).reduce((sum, val) => sum + val, 0);
    const difference = 100 - normalizedTotal;
    
    if (difference !== 0) {
      const largestCategory = Object.entries(normalizedWeights)
        .reduce((max, [category, value]) => value > max.value ? { category, value } : max, { category: null, value: 0 });
      
      if (largestCategory.category) {
        normalizedWeights[largestCategory.category] += difference;
      }
    }
    
    setTeamWeights(normalizedWeights);
  }, [teamWeights]);

  const normalizeClutchWeights = useCallback(() => {
    const currentTotal = Object.values(clutchWeights).reduce((sum, val) => sum + val, 0);
    
    if (currentTotal === 0) {
      setClutchWeights({ gameWinningDrives: 40, fourthQuarterComebacks: 25, clutchRate: 15, playoffBonus: 20 });
      return;
    }
    
    if (currentTotal === 100) return;
    
    const normalizedWeights = {};
    Object.entries(clutchWeights).forEach(([category, value]) => {
      normalizedWeights[category] = Math.round((value / currentTotal) * 100);
    });
    
    const normalizedTotal = Object.values(normalizedWeights).reduce((sum, val) => sum + val, 0);
    const difference = 100 - normalizedTotal;
    
    if (difference !== 0) {
      const largestCategory = Object.entries(normalizedWeights)
        .reduce((max, [category, value]) => value > max.value ? { category, value } : max, { category: null, value: 0 });
      
      if (largestCategory.category) {
        normalizedWeights[largestCategory.category] += difference;
      }
    }
    
    setClutchWeights(normalizedWeights);
  }, [clutchWeights]);

  const normalizeDurabilityWeights = useCallback(() => {
    const currentTotal = Object.values(durabilityWeights).reduce((sum, val) => sum + val, 0);
    
    if (currentTotal === 0) {
      setDurabilityWeights({ availability: 75, consistency: 25 });
      return;
    }
    
    if (currentTotal === 100) return;
    
    const normalizedWeights = {};
    Object.entries(durabilityWeights).forEach(([category, value]) => {
      normalizedWeights[category] = Math.round((value / currentTotal) * 100);
    });
    
    const normalizedTotal = Object.values(normalizedWeights).reduce((sum, val) => sum + val, 0);
    const difference = 100 - normalizedTotal;
    
    if (difference !== 0) {
      const largestCategory = Object.entries(normalizedWeights)
        .reduce((max, [category, value]) => value > max.value ? { category, value } : max, { category: null, value: 0 });
      
      if (largestCategory.category) {
        normalizedWeights[largestCategory.category] += difference;
      }
    }
    
    setDurabilityWeights(normalizedWeights);
  }, [durabilityWeights]);

  const getCurrentPresetDescription = useMemo(() => {
    console.log('Current preset:', currentPreset);
    
    if (currentPreset === 'custom') {
      return "Custom settings - adjust sliders to match your QB evaluation philosophy";
    }
    
    const preset = PHILOSOPHY_PRESETS[currentPreset];
    if (preset && preset.description) {
      return preset.description;
    }
    
    return "Custom settings";
  }, [currentPreset]);

  // URL sharing functions - COMPACT: Much shorter URLs focusing on essentials
  const encodeSettings = (weights, supportWeights, statsWeights, teamWeights, clutchWeights, durabilityWeights, includePlayoffs, include2024Only, fullDetail = false) => {
    if (fullDetail) {
      // Full detail mode - includes all sub-component weights (longer URLs)
      const settingsObj = {
        w: [weights.team, weights.stats, weights.clutch, weights.durability, weights.support],
        sp: [supportWeights.offensiveLine, supportWeights.weapons, supportWeights.defense],
        st: [statsWeights.efficiency, statsWeights.protection, statsWeights.volume],
        tm: [teamWeights.regularSeason, teamWeights.offenseDVOA, teamWeights.playoff],
        cl: [clutchWeights.gameWinningDrives, clutchWeights.fourthQuarterComebacks, clutchWeights.clutchRate, clutchWeights.playoffBonus],
        dr: [durabilityWeights.availability, durabilityWeights.consistency],
        pf: includePlayoffs ? 1 : 0,
        y24: include2024Only ? 1 : 0
      };
      
      const jsonString = JSON.stringify(settingsObj);
      return btoa(jsonString).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=+$/, '');
    } else {
      // Compact mode - only main weights and global settings (much shorter)
      const compactArray = [
        weights.team, weights.stats, weights.clutch, weights.durability, weights.support,
        includePlayoffs ? 1 : 0,
        include2024Only ? 1 : 0
      ];
      
      // Convert to compact string format: "35.35.5.10.15.0.0"
      return compactArray.join('.');
    }
  };

  const decodeSettings = (encodedSettings) => {
    try {
      // Handle multiple formats: dots (new compact), pipes (old), or Base64 (full detail)
      if (encodedSettings.includes('.') && !encodedSettings.includes('|')) {
        // New compact format: "35.35.5.10.15.0.0"
        const values = encodedSettings.split('.').map(v => parseInt(v));
        if (values.length >= 5 && values.every(v => !isNaN(v) && v >= 0 && v <= 100)) {
          const result = {
            weights: {
              team: values[0],
              stats: values[1],
              clutch: values[2],
              durability: values[3],
              support: values[4]
            }
          };
          
          // Global settings if present
          if (values.length >= 6) {
            result.includePlayoffs = values[5] === 1;
          }
          if (values.length >= 7) {
            result.include2024Only = values[6] === 1;
          }
          
          return result;
        }
        return null;
      } else if (encodedSettings.includes('|')) {
        // Legacy pipe format - keep existing decode logic
        const sections = encodedSettings.split('|');
        if (sections.length < 2) {
          // Legacy format - just main weights
          const values = encodedSettings.split(',').map(v => parseInt(v));
          if (values.length === 5 && values.every(v => !isNaN(v) && v >= 0 && v <= 100)) {
            return {
              weights: {
                team: values[0],
                stats: values[1],
                clutch: values[2],
                durability: values[3],
                support: values[4]
              }
            };
          }
          return null;
        }

        // Old pipe-separated format
        const mainValues = sections[0].split(',').map(v => parseInt(v));
        if (mainValues.length !== 5 || !mainValues.every(v => !isNaN(v) && v >= 0 && v <= 100)) {
          return null;
        }

        const result = {
          weights: {
            team: mainValues[0],
            stats: mainValues[1],
            clutch: mainValues[2],
            durability: mainValues[3],
            support: mainValues[4]
          }
        };

        // Support weights (optional)
        if (sections[1]) {
          const supportValues = sections[1].split(',').map(v => parseInt(v));
          if (supportValues.length === 3 && supportValues.every(v => !isNaN(v) && v >= 0 && v <= 100)) {
            result.supportWeights = {
              offensiveLine: supportValues[0],
              weapons: supportValues[1],
              defense: supportValues[2]
            };
          }
        }

        // Stats weights (optional)
        if (sections[2]) {
          const statsValues = sections[2].split(',').map(v => parseInt(v));
          if (statsValues.length === 3 && statsValues.every(v => !isNaN(v) && v >= 0 && v <= 100)) {
            result.statsWeights = {
              efficiency: statsValues[0],
              protection: statsValues[1],
              volume: statsValues[2]
            };
          }
        }

        // Team weights (optional)
        if (sections[3]) {
          const teamValues = sections[3].split(',').map(v => parseInt(v));
          if (teamValues.length === 3 && teamValues.every(v => !isNaN(v) && v >= 0 && v <= 100)) {
            result.teamWeights = {
              regularSeason: teamValues[0],
              offenseDVOA: teamValues[1],
              playoff: teamValues[2]
            };
          } else if (teamValues.length === 2 && teamValues.every(v => !isNaN(v) && v >= 0 && v <= 100)) {
            // Legacy format - convert to new format
            result.teamWeights = {
              regularSeason: teamValues[0],
              offenseDVOA: 15, // Default value
              playoff: teamValues[1]
            };
          }
        }

        // Clutch weights (optional)
        if (sections[4]) {
          const clutchValues = sections[4].split(',').map(v => parseInt(v));
          if (clutchValues.length === 4 && clutchValues.every(v => !isNaN(v) && v >= 0 && v <= 100)) {
            result.clutchWeights = {
              gameWinningDrives: clutchValues[0],
              fourthQuarterComebacks: clutchValues[1],
              clutchRate: clutchValues[2],
              playoffBonus: clutchValues[3]
            };
          }
        }

        // Durability weights (optional)
        if (sections[5]) {
          const durabilityValues = sections[5].split(',').map(v => parseInt(v));
          if (durabilityValues.length === 2 && durabilityValues.every(v => !isNaN(v) && v >= 0 && v <= 100)) {
            result.durabilityWeights = {
              availability: durabilityValues[0],
              consistency: durabilityValues[1]
            };
          }
        }

        // Global settings (optional) - now at index 6 in new format, but also check index 4 for old format
        const settingsIndex = sections.length === 7 ? 6 : sections.length === 5 ? 4 : -1;
        if (settingsIndex >= 0 && sections[settingsIndex]) {
          const settingValues = sections[settingsIndex].split(',').map(v => parseInt(v));
          if (settingValues.length >= 1 && !isNaN(settingValues[0])) {
            result.includePlayoffs = settingValues[0] === 1;
          }
          if (settingValues.length >= 2 && !isNaN(settingValues[1])) {
            result.include2024Only = settingValues[1] === 1;
          }
        }

        return result;
      } else {
        // Base64 format (full detail)
        // Restore padding and reverse URL-safe characters
        const padded = encodedSettings + '='.repeat((4 - encodedSettings.length % 4) % 4);
        const base64 = padded.replace(/[-_]/g, c => c === '-' ? '+' : '/');
        
        const jsonString = atob(base64);
        const settingsObj = JSON.parse(jsonString);
        
        // Validate the structure
        if (!settingsObj.w || !Array.isArray(settingsObj.w) || settingsObj.w.length !== 5) {
          return null;
        }
        
        const result = {
          weights: {
            team: settingsObj.w[0],
            stats: settingsObj.w[1],
            clutch: settingsObj.w[2],
            durability: settingsObj.w[3],
            support: settingsObj.w[4]
          }
        };
        
        // Apply sub-component weights if present
        if (settingsObj.sp && Array.isArray(settingsObj.sp) && settingsObj.sp.length === 3) {
          result.supportWeights = {
            offensiveLine: settingsObj.sp[0],
            weapons: settingsObj.sp[1],
            defense: settingsObj.sp[2]
          };
        }
        
        if (settingsObj.st && Array.isArray(settingsObj.st) && settingsObj.st.length === 3) {
          result.statsWeights = {
            efficiency: settingsObj.st[0],
            protection: settingsObj.st[1],
            volume: settingsObj.st[2]
          };
        }
        
        if (settingsObj.tm && Array.isArray(settingsObj.tm) && settingsObj.tm.length === 3) {
          result.teamWeights = {
            regularSeason: settingsObj.tm[0],
            offenseDVOA: settingsObj.tm[1],
            playoff: settingsObj.tm[2]
          };
        }
        
        if (settingsObj.cl && Array.isArray(settingsObj.cl) && settingsObj.cl.length === 4) {
          result.clutchWeights = {
            gameWinningDrives: settingsObj.cl[0],
            fourthQuarterComebacks: settingsObj.cl[1],
            clutchRate: settingsObj.cl[2],
            playoffBonus: settingsObj.cl[3]
          };
        }
        
        if (settingsObj.dr && Array.isArray(settingsObj.dr) && settingsObj.dr.length === 2) {
          result.durabilityWeights = {
            availability: settingsObj.dr[0],
            consistency: settingsObj.dr[1]
          };
        }
        
        if (settingsObj.pf !== undefined) {
          result.includePlayoffs = settingsObj.pf === 1;
        }
        
        if (settingsObj.y24 !== undefined) {
          result.include2024Only = settingsObj.y24 === 1;
        }
        
        return result;
      }
    } catch (e) {
      console.warn('Failed to decode settings from URL', e);
    }
    return null;
  };

  const generateShareLink = useCallback((fullDetail = false) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const encodedSettings = encodeSettings(weights, supportWeights, statsWeights, teamWeights, clutchWeights, durabilityWeights, includePlayoffs, include2024Only, fullDetail);
    const presetParam = currentPreset !== 'custom' ? `&preset=${currentPreset}` : '';
    return `${baseUrl}?s=${encodedSettings}${presetParam}`;
  }, [weights, supportWeights, statsWeights, teamWeights, clutchWeights, durabilityWeights, includePlayoffs, include2024Only, currentPreset]);

  // Helper: Normalize QEI scores so median = 65, with mode-specific scaling
  const normalizeQeiScores = useCallback((qeiScores) => {
    if (!qeiScores || qeiScores.length === 0) return [];
    const sorted = [...qeiScores].sort((a, b) => a - b);
    const min = sorted[0];
    const median = sorted[Math.floor(sorted.length / 2)];
    
    // Avoid divide by zero
    if (sorted.every(score => score === median)) return qeiScores.map(() => 65);
    
    // Calculate scaling factors
    const medianToMinRange = median - min;
    
    return qeiScores.map(score => {
      if (score <= median) {
        // Scale [min, median] to [0, 65]
        return medianToMinRange > 0 ? ((score - min) / medianToMinRange) * 65 : 65;
      } else {
        // Mode-specific scaling for above-median scores
        if (include2024Only) {
          // 2024-only mode: More generous scaling to account for limited data
          // Each point above median = 1.5 points above 65 (vs 1.0 in 3-year mode)
          return 65 + ((score - median) * 1.5);
        } else {
          // 3-year mode: Standard scaling
          // Each point above median = 1 point above 65
          return 65 + (score - median);
        }
      }
    });
  }, [include2024Only]);

  // Calculate QEI with current weights and dynamic component calculations
  const rankedQBs = useMemo(() => {
    // First pass: Calculate all base scores
    const qbsWithBaseScores = qbData.map(qb => {
              const baseScores = calculateQBMetrics(qb, supportWeights, statsWeights, teamWeights, clutchWeights, includePlayoffs, include2024Only, efficiencyWeights, protectionWeights, volumeWeights, durabilityWeights);
      return {
        ...qb,
        baseScores
      };
    });
    
    // Extract all base scores for support rebalancing
    const allQBBaseScores = qbsWithBaseScores.map(qb => qb.baseScores);
    
    // Second pass: Calculate raw QEI scores
    const qbsWithRawQei = qbsWithBaseScores.map(qb => ({
      ...qb,
      rawQei: calculateQEI(qb.baseScores, qb, weights, includePlayoffs, allQBBaseScores, include2024Only)
    }));
    
    // Third pass: Normalize QEI scores so top = 100, median = 65, min = 0
    const rawScores = qbsWithRawQei.map(qb => qb.rawQei);
    const normalizedScores = normalizeQeiScores(rawScores);
    
    // Final pass: Apply normalized scores and sort
    return qbsWithRawQei
      .map((qb, index) => ({
        ...qb,
        qei: normalizedScores[index]
      }))
      .sort((a, b) => b.qei - a.qei);
  }, [qbData, weights, supportWeights, statsWeights, teamWeights, clutchWeights, includePlayoffs, include2024Only, efficiencyWeights, protectionWeights, volumeWeights, durabilityWeights, normalizeQeiScores]);

  const totalWeight = useMemo(() => 
    Object.values(weights).reduce((a, b) => a + b, 0), 
    [weights]
  );

  // Memoized handlers for showing/hiding details
  const showDetailsHandlers = useMemo(() => ({
    team: () => setShowTeamDetails(!showTeamDetails),
    stats: () => setShowStatsDetails(!showStatsDetails),
    clutch: () => setShowClutchDetails(!showClutchDetails),
    durability: () => setShowDurabilityDetails(!showDurabilityDetails),
    support: () => setShowSupportDetails(!showSupportDetails),
    efficiency: () => setShowEfficiencyDetails(!showEfficiencyDetails),
    protection: () => setShowProtectionDetails(!showProtectionDetails),
    volume: () => setShowVolumeDetails(!showVolumeDetails)
  }), [showTeamDetails, showStatsDetails, showClutchDetails, showDurabilityDetails, showSupportDetails, showEfficiencyDetails, showProtectionDetails, showVolumeDetails]);

  const showDetailsState = useMemo(() => ({
    team: showTeamDetails,
    stats: showStatsDetails,
    clutch: showClutchDetails,
    durability: showDurabilityDetails,
    support: showSupportDetails,
    efficiency: showEfficiencyDetails,
    protection: showProtectionDetails,
    volume: showVolumeDetails
  }), [showTeamDetails, showStatsDetails, showClutchDetails, showDurabilityDetails, showSupportDetails, showEfficiencyDetails, showProtectionDetails, showVolumeDetails]);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareModalScreenshotUrl, setShareModalScreenshotUrl] = useState(null);
  const [shareModalLink, setShareModalLink] = useState('');
  const [shareModalType, setShareModalType] = useState('quick');
  const [isScreenshotLoading, setIsScreenshotLoading] = useState(false);

  // Share functionality
  const handleShare = useCallback(async (shareType = 'quick') => {
    try {
      setIsScreenshotLoading(true);
      const shareLink = generateShareLink(shareType === 'quick' ? 'quick' : 'full');
      
      // Take screenshot
      const { blobUrl } = await captureTop10QBsScreenshot(rankedQBs, { includePlayoffs, include2024Only });
      setShareModalScreenshotUrl(blobUrl);
      setShareModalLink(shareLink);
      setShareModalType(shareType === 'quick' ? 'quick' : 'full');
      setIsShareModalOpen(true);
    } catch (err) {
      console.error('Failed to share:', err);
      alert('Failed to generate screenshot or copy link.');
    } finally {
      setIsScreenshotLoading(false);
    }
  }, [generateShareLink, rankedQBs, includePlayoffs, include2024Only]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Load settings from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedSettings = urlParams.get('s'); // New format
    const encodedWeights = urlParams.get('w'); // Legacy format
    const preset = urlParams.get('preset');
    
    // Try new format first, then legacy format
    const settingsToLoad = encodedSettings || encodedWeights;
    
    if (settingsToLoad) {
      const decodedSettings = decodeSettings(settingsToLoad);
      if (decodedSettings) {
        // Apply main weights
        if (decodedSettings.weights) {
          setWeights(decodedSettings.weights);
        }
        
        // Apply support weights if present
        if (decodedSettings.supportWeights) {
          setSupportWeights(decodedSettings.supportWeights);
        }
        
        // Apply stats weights if present
        if (decodedSettings.statsWeights) {
          setStatsWeights(decodedSettings.statsWeights);
        }
        
        // Apply team weights if present
        if (decodedSettings.teamWeights) {
          setTeamWeights(decodedSettings.teamWeights);
        }
        
        // Apply clutch weights if present
        if (decodedSettings.clutchWeights) {
          setClutchWeights(decodedSettings.clutchWeights);
        }
        
        // Apply durability weights if present
        if (decodedSettings.durabilityWeights) {
          setDurabilityWeights(decodedSettings.durabilityWeights);
        }
        
        // Apply global settings if present
        if (decodedSettings.includePlayoffs !== undefined) {
          setIncludePlayoffs(decodedSettings.includePlayoffs);
        }
        
        // Apply 2024-only setting if present
        if (decodedSettings.include2024Only !== undefined) {
          setInclude2024Only(decodedSettings.include2024Only);
        }
        
        setCurrentPreset(preset && PHILOSOPHY_PRESETS[preset] ? preset : 'custom');
      }
    } else if (preset && PHILOSOPHY_PRESETS[preset]) {
      // Call applyPreset directly here instead of using it as a dependency
      const presetData = PHILOSOPHY_PRESETS[preset];
      if (presetData) {
        const { description, ...weightCategories } = presetData;
        
        startTransition(() => {
          setWeights(weightCategories);
          setCurrentPreset(preset);
          
          if (preset === 'default') {
            setSupportWeights({
              offensiveLine: 34,
              weapons: 33,
              defense: 33
            });
            
            setStatsWeights({
              efficiency: 34,
              protection: 33,
              volume: 33
            });
            
            setTeamWeights({
              regularSeason: 50,
              offenseDVOA: 50,
              playoff: 0
            });
            
            setClutchWeights({
              gameWinningDrives: 25,
              fourthQuarterComebacks: 25,
              clutchRate: 25,
              playoffBonus: 25
            });
            
            setDurabilityWeights({
              availability: 50,
              consistency: 50
            });
          }
        });
      }
    }
  }, []); // Only run once on mount - removed problematic dependency

  // Effect to automatically adjust team weights when playoff toggle changes
  useEffect(() => {
    if (includePlayoffs) {
      setTeamWeights({ regularSeason: 33, offenseDVOA: 33, playoff: 34 });
    } else {
      setTeamWeights({ regularSeason: 50, offenseDVOA: 50, playoff: 0 });
    }
  }, [includePlayoffs]);

  // Refetch data when 2024-only toggle changes
  useEffect(() => {
    if (fetchAllQBData) {
      fetchAllQBData(include2024Only);
    }
  }, [include2024Only]); // Removed fetchAllQBData dependency to prevent infinite loop

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
          <p className="text-blue-200">
            {include2024Only ? '2024 NFL season analysis • Single-year quarterback rankings • Dynamic QEI' : '3-Year NFL analysis (2022-2024) • Career quarterback rankings • Dynamic QEI'}
          </p>
        </div>

        {/* Quick Philosophy Presets - Outside Accordion */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4">⚡ Quick Philosophy Presets</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => applyPreset('default')}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-600/20 hover:bg-gray-600/30 text-gray-200"
            >
              ⚙️ Default
            </button>
            <button
              onClick={() => applyPreset('winner')}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-200"
            >
              🏆 Winner
            </button>
            <button
              onClick={() => applyPreset('analyst')}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-green-600/20 hover:bg-green-600/30 text-green-200"
            >
              📊 Analyst
            </button>
            <button
              onClick={() => applyPreset('context')}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-purple-600/20 hover:bg-purple-600/30 text-purple-200"
            >
              🏢 Context
            </button>
          </div>
          <div className="text-sm text-blue-200 italic">
            💡 Current Philosophy: {getCurrentPresetDescription}
          </div>
        </div>

        {/* Customize Your QB Philosophy - Accordion */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl mb-8">
          {/* Accordion Header */}
          <div 
            className="p-6 cursor-pointer hover:bg-white/5 transition-colors select-none"
            onClick={() => setIsCustomizeAccordionOpen(!isCustomizeAccordionOpen)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">🎯 Customize Your QB Philosophy</h3>
                <p className="text-blue-200 text-sm mt-1">
                  Advanced settings to fine-tune weightings and components
                </p>
              </div>
              <div className="ml-6 flex items-center justify-center">
                <div className={`
                  w-8 h-8 rounded-full bg-white/10 border border-white/20 
                  flex items-center justify-center
                  transition-all duration-300 ease-in-out
                  hover:bg-white/20 hover:border-white/30
                  ${isCustomizeAccordionOpen ? 'rotate-180 bg-blue-500/30 border-blue-400/50' : 'rotate-0'}
                `}>
                  <svg 
                    className="w-4 h-4 text-white transition-colors duration-300" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 9l-7 7-7-7" 
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Accordion Content */}
          {isCustomizeAccordionOpen && (
            <div className="border-t border-white/10">
              <div className="p-6">
                <GlobalSettings
                  includePlayoffs={includePlayoffs}
                  onIncludePlayoffsChange={setIncludePlayoffs}
                  include2024Only={include2024Only}
                  onInclude2024OnlyChange={setInclude2024Only}
                />
          
                <WeightControls
                  weights={weights}
                  onUpdateWeight={updateWeight}
                  onNormalizeWeights={normalizeWeights}
                  showDetails={showDetailsState}
                  onShowDetails={showDetailsHandlers}
                  // Sub-component weights and handlers
                  supportWeights={supportWeights}
                  onUpdateSupportWeight={updateSupportWeight}
                  onNormalizeSupportWeights={normalizeSupportWeights}
                            statsWeights={statsWeights}
          onUpdateStatsWeight={updateStatsWeight}
          onNormalizeStatsWeights={normalizeStatsWeights}
          efficiencyWeights={efficiencyWeights}
          onUpdateEfficiencyWeight={updateEfficiencyWeight}
          onNormalizeEfficiencyWeights={normalizeEfficiencyWeights}
          protectionWeights={protectionWeights}
          onUpdateProtectionWeight={updateProtectionWeight}
          onNormalizeProtectionWeights={normalizeProtectionWeights}
          volumeWeights={volumeWeights}
          onUpdateVolumeWeight={updateVolumeWeight}
          onNormalizeVolumeWeights={normalizeVolumeWeights}
                  teamWeights={teamWeights}
                  onUpdateTeamWeight={updateTeamWeight}
                  onNormalizeTeamWeights={normalizeTeamWeights}
                  clutchWeights={clutchWeights}
                  onUpdateClutchWeight={updateClutchWeight}
                  onNormalizeClutchWeights={normalizeClutchWeights}
                  durabilityWeights={durabilityWeights}
                  onUpdateDurabilityWeight={updateDurabilityWeight}
                  onNormalizeDurabilityWeights={normalizeDurabilityWeights}
                  includePlayoffs={includePlayoffs}
                />
              </div>
            </div>
          )}
        </div>

        {/* Share Button Section */}
        <div className="text-center mb-8 text-blue-300">
          <div className="flex flex-wrap justify-center gap-3 mb-2">
            <button 
              id="share-button-top"
              onClick={() => handleShare('quick')}
              className="bg-blue-500/20 hover:bg-blue-500/30 px-6 py-3 rounded-lg font-bold transition-colors text-white"
              disabled={isScreenshotLoading}
            >
              {isScreenshotLoading ? '⏳ Generating...' : '🔗 Quick Share'}
            </button>
            <button 
              onClick={() => handleShare('full')}
              className="bg-purple-500/20 hover:bg-purple-500/30 px-6 py-3 rounded-lg font-bold transition-colors text-purple-200 hover:text-white"
              disabled={isScreenshotLoading}
            >
              {isScreenshotLoading ? '⏳ Generating...' : '📋 Full Detail Share'}
            </button>
          </div>
          <p className="text-xs text-blue-400">
            🚀 <strong>Quick Share</strong>: Super short URLs (main weights only) • 
            📊 <strong>Full Detail</strong>: All sub-component weights included
          </p>
        </div>

        {/* Live Rankings Table */}
        <QBRankingsTable 
          rankedQBs={rankedQBs} 
          includePlayoffs={includePlayoffs}
          include2024Only={include2024Only}
        />

        {/* Footer */}
        <div className="text-center mt-8 text-blue-300">
          <p>🚀 Dynamic Rankings • 📈 3-Year Career Analysis • 🎛️ Customizable Weights</p>
          {lastFetch && (
            <p className="text-sm mt-2">
              Last updated: {new Date(lastFetch).toLocaleTimeString()} 
              {shouldRefreshData() ? ' (Data may be stale)' : ' (Fresh data)'}
            </p>
          )}
          <div className="mt-4 space-y-2">
            <div className="flex flex-wrap justify-center gap-3 mb-2">
              <button 
                id="share-button"
                onClick={() => handleShare('quick')}
                className="bg-blue-500/20 hover:bg-blue-500/30 px-5 py-2 rounded-lg font-bold transition-colors"
                disabled={isScreenshotLoading}
              >
                {isScreenshotLoading ? '⏳ Generating...' : '🔗 Quick Share'}
              </button>
              <button 
                onClick={() => handleShare('full')}
                className="bg-purple-500/20 hover:bg-purple-500/30 px-5 py-2 rounded-lg font-bold transition-colors text-purple-200 hover:text-white"
                disabled={isScreenshotLoading}
              >
                {isScreenshotLoading ? '⏳ Generating...' : '📋 Full Detail Share'}
              </button>
            </div>
            <p className="text-xs text-blue-400">
              🚀 <strong>Quick Share</strong>: Ultra-short URLs perfect for chat apps 
              <br />📊 <strong>Full Detail</strong>: Includes all sub-component weight customizations
            </p>
            <div className="mt-4 pt-4 border-t border-white/10">
              <button 
                onClick={onShowDocumentation}
                className="bg-purple-500/20 hover:bg-purple-500/30 px-6 py-2 rounded-lg font-bold transition-colors text-purple-200 hover:text-white"
              >
                📚 View Scoring Methodology & Documentation
              </button>
              <p className="text-xs text-purple-300 mt-2">
                Learn how our QB evaluation system works - from team success to clutch performance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-lg text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 border border-blue-400/30"
          title="Scroll to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareModalScreenshotUrl(null);
          setShareModalLink('');
          setShareModalType('quick');
        }}
        screenshotUrl={shareModalScreenshotUrl}
        shareLink={shareModalLink}
        shareType={shareModalType}
      />
    </div>
  );
};

export default DynamicQBRankings; 