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
import { Link } from 'react-router-dom';
import { useSupabaseQBData } from '../hooks/useSupabaseQBData.js';
import { useNavigation } from '../contexts/NavigationContext.jsx';
import { calculateQEI, calculateQBMetrics } from '../utils/qbCalculations.js';

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
import QBRankingsTable from './QBRankingsTable';
import ShareModal from './ShareModal.jsx';

import { captureTop10QBsScreenshot } from '../utils/screenshotUtils.js';
import { URLShortener } from '../utils/urlShortener.js';

const DynamicQBRankings = () => {
  const { 
    qbData, 
    loading, 
    error, 
    lastFetch, 
    shouldRefreshData, 
    fetchAllQBData,
    forceRefresh
  } = useSupabaseQBData(); // Use Supabase as primary data source
  
  // Get navigation state from context
  const {
    weights,
    currentPreset,
    includePlayoffs,
    yearMode,
    onWeightsChange,
    onPresetChange,
    onIncludePlayoffsChange,
    onYearModeChange
  } = useNavigation();
  const [supportWeights, setSupportWeights] = useState({
    offensiveLine: 34,
    weapons: 33,
    defense: 33
  });
  const [showSupportDetails, setShowSupportDetails] = useState(false);
  const [statsWeights, setStatsWeights] = useState({
    efficiency: 45,     // ANY/A, TD%, Completion% - Core of QB evaluation
    protection: 30,     // Sack%, Turnover Rate - Decision-making focus
    volume: 25          // Volume and production metrics
  });
  const [showStatsDetails, setShowStatsDetails] = useState(false);
  const [showEfficiencyDetails, setShowEfficiencyDetails] = useState(false);
  const [showProtectionDetails, setShowProtectionDetails] = useState(false);
  const [showVolumeDetails, setShowVolumeDetails] = useState(false);
  
  // Sub-component weights for stats categories - NFL Scout Optimized
  const [efficiencyWeights, setEfficiencyWeights] = useState({
    anyA: 45,           // Adjusted Net Yards per Attempt - Gold standard QB metric
    tdPct: 35,          // Touchdown percentage - production efficiency
    completionPct: 20    // Completion percentage - accuracy & decision making
  });
  const [protectionWeights, setProtectionWeights] = useState({
    sackPct: 25,        // Sack percentage - Reduced (heavily O-line dependent)
    turnoverRate: 75    // Turnover rate - Increased (pure QB decision-making)
  });
  const [volumeWeights, setVolumeWeights] = useState({
    passYards: 40,      // Passing yard production
    passTDs: 30,        // Passing touchdown production
    rushYards: 10,      // Rushing yards
    rushTDs: 15,        // Rushing touchdowns
    totalAttempts: 5    // Total workload
  });
  const [teamWeights, setTeamWeights] = useState({
    regularSeason: 100,  // Regular season win percentage - set to 100%
    offenseDVOA: 0,       // Offensive output performance - disabled (work in progress)
    playoff: 0           // Career playoff achievement score - disabled (work in progress)
  });
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [clutchWeights, setClutchWeights] = useState({
    gameWinningDrives: 25,    // GWD score component
    fourthQuarterComebacks: 25, // 4QC score component
    clutchRate: 25,           // Combined clutch rate scoregit a
    playoffBonus: 25          // Playoff success bonus (disabled when playoffs off)
  });
  const [showClutchDetails, setShowClutchDetails] = useState(false);
  const [durabilityWeights, setDurabilityWeights] = useState({
    availability: 50,         // Season availability score
    consistency: 50           // Multi-year consistency bonus
  });
  const [showDurabilityDetails, setShowDurabilityDetails] = useState(false);

  // Filter settings state
  const [filterSettings, setFilterSettings] = useState({
    minAttempts: 15,
    minGames: 2
  });

  // Accordion state
  const [isCustomizeAccordionOpen, setIsCustomizeAccordionOpen] = useState(false);

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

  // Handle playoff toggle changes - disable playoff components and rebalance weights
  useEffect(() => {
    if (!includePlayoffs) {
      // Set all playoff-related weights to 0 and rebalance
      setTeamWeights(prev => {
        const newWeights = { ...prev, playoff: 0 };
        const nonPlayoffTotal = newWeights.regularSeason + newWeights.offenseDVOA;
        
        if (nonPlayoffTotal === 0) {
          // If both are 0, reset to defaults
          return { regularSeason: 65, offenseDVOA: 35, playoff: 0 };
        } else {
          // Redistribute to maintain 100% total
          const factor = 100 / nonPlayoffTotal;
          return {
            regularSeason: Math.round(newWeights.regularSeason * factor),
            offenseDVOA: Math.round(newWeights.offenseDVOA * factor),
            playoff: 0
          };
        }
      });
      
      setClutchWeights(prev => ({ ...prev, playoffBonus: 0 }));
    }
  }, [includePlayoffs]);

  const updateWeight = useCallback((category, value) => {
    // In 2025 mode, prevent changes to support and durability (they don't have data)
    if (yearMode === '2025' && (category === 'support' || category === 'durability')) {
      console.warn(`⚠️ Cannot modify ${category} in 2025 mode - no data available for this category`);
      return;
    }
    
    const validatedValue = validateNumberInput(value, 0, 100);
    onWeightsChange(prev => ({
      ...prev,
      [category]: validatedValue
    }));
    onPresetChange('custom'); // Reset to custom when manually adjusting
  }, [validateNumberInput, yearMode, onWeightsChange, onPresetChange]);

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
      // When playoffs are disabled, only set playoff to 0 if user isn't adjusting other components
      // This preserves user settings for non-playoff components
      if (!includePlayoffs && component !== 'playoff') {
        return { 
          ...prev, 
          [component]: validatedValue
          // Don't force playoff to 0 here - let user maintain their other settings
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
    const { description, supportWeights, statsWeights, teamWeights, clutchWeights, durabilityWeights, efficiencyWeights, protectionWeights, volumeWeights, ...weightCategories } = preset;
    
    // Use startTransition to batch all state updates for better performance
    startTransition(() => {
      onWeightsChange(weightCategories);
      onPresetChange(presetName);
      
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
      
      if (efficiencyWeights) {
        setEfficiencyWeights(efficiencyWeights);
      }
      
      if (protectionWeights) {
        setProtectionWeights(protectionWeights);
      }
      
      if (volumeWeights) {
        setVolumeWeights(volumeWeights);
      }
    });
  }, [onWeightsChange, onPresetChange]);

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
    
    onWeightsChange(normalizedWeights);
    onPresetChange('custom');
  }, [weights, applyPreset, onWeightsChange, onPresetChange]);

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

  // Update social media meta tags with screenshot
  const updateSocialMetaTags = useCallback((shareUrl, screenshotDataUrl, shareType) => {
    if (!screenshotDataUrl) return;
    
    console.log('📸 Updating social meta tags with screenshot');
    
    // Create a temporary image element to get dimensions
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      
      console.log('📸 Screenshot dimensions:', width, 'x', height);
      
      // Update Open Graph meta tags
      updateMetaTag('og:url', shareUrl);
      updateMetaTag('og:title', `NFL QB Rankings - ${shareType === 'quick' ? 'Quick View' : 'Full Analysis'} | Top 10 Quarterbacks`);
      updateMetaTag('og:description', `Check out my QB rankings! ${shareType === 'quick' ? '🚀 Quick view' : '📊 Full analysis'} of the top 10 quarterbacks.`);
      updateMetaTag('og:image', screenshotDataUrl);
      updateMetaTag('og:image:width', width.toString());
      updateMetaTag('og:image:height', height.toString());
      
      // Update Twitter Card meta tags
      updateMetaTag('twitter:url', shareUrl);
      updateMetaTag('twitter:title', `NFL QB Rankings - ${shareType === 'quick' ? 'Quick View' : 'Full Analysis'} | Top 10 Quarterbacks`);
      updateMetaTag('twitter:description', `Check out my QB rankings! ${shareType === 'quick' ? '🚀 Quick view' : '📊 Full analysis'} of the top 10 quarterbacks.`);
      updateMetaTag('twitter:image', screenshotDataUrl);
      
      console.log('📸 Social meta tags updated successfully');
    };
    img.src = screenshotDataUrl;
  }, []);

  // Helper function to update meta tags
  const updateMetaTag = (property, content) => {
    // Try to find existing meta tag
    let metaTag = document.querySelector(`meta[property="${property}"]`) || 
                  document.querySelector(`meta[name="${property}"]`);
    
    if (metaTag) {
      metaTag.setAttribute('content', content);
    } else {
      // Create new meta tag
      metaTag = document.createElement('meta');
      if (property.startsWith('og:')) {
        metaTag.setAttribute('property', property);
      } else {
        metaTag.setAttribute('name', property);
      }
      metaTag.setAttribute('content', content);
      document.head.appendChild(metaTag);
    }
  };

  // URL sharing functions - COMPACT: Much shorter URLs focusing on essentials
  const encodeSettings = (weights, supportWeights, statsWeights, teamWeights, clutchWeights, durabilityWeights, includePlayoffs, yearMode, fullDetail = false) => {
    // Convert yearMode to numeric: 0='1932', 1='1933', ..., 93='2025'
    const yearModeValue = parseInt(yearMode) - 1932;
    
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
        ym: yearModeValue
      };
      
      const jsonString = JSON.stringify(settingsObj);
      return btoa(jsonString).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=+$/, '');
    } else {
      // Compact mode - main weights + global settings as base64 JSON
      const compactObj = {
        w: [weights.team, weights.stats, weights.clutch, weights.durability, weights.support],
        pf: includePlayoffs ? 1 : 0,
        ym: yearModeValue
      };
      
      const jsonString = JSON.stringify(compactObj);
      return btoa(jsonString).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=+$/, '');
    }
  };

  const decodeSettings = (encodedSettings) => {
    try {
      // Handle multiple formats: dots (legacy compact), pipes (old), or Base64 (new compact + full detail)
      if (encodedSettings.includes('.') && !encodedSettings.includes('|')) {
        // Legacy dot-separated format: "35.35.5.10.15.0.0"
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
            // Convert numeric yearMode to string: 0='1932', 1='1933', ..., 93='2025'
            const yearModeValue = values[6];
            result.yearMode = (1932 + yearModeValue).toString();
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
            // Convert old format to yearMode for backward compatibility
            // Old: 0='all', 1='2024' -> New: default to 2025 for old links
            result.yearMode = settingValues[1] === 1 ? '2024' : '2025';
          }
        }

        return result;
      } else {
        // Base64 format (both compact and full detail)
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
        
        // Apply sub-component weights if present (full detail format)
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
        
        // Global settings (both compact and full detail formats)
        if (settingsObj.pf !== undefined) {
          result.includePlayoffs = settingsObj.pf === 1;
        }
        
        // Handle both old (y24) and new (ym) year mode formats
        if (settingsObj.ym !== undefined) {
          // New format: 0='1932', 1='1933', ..., 93='2025'
          result.yearMode = (1932 + settingsObj.ym).toString();
        } else if (settingsObj.y24 !== undefined) {
          // Old format: convert boolean to yearMode for backward compatibility
          result.yearMode = settingsObj.y24 === 1 ? '2024' : '2025';
        }
        
        return result;
      }
    } catch (e) {
      console.warn('Failed to decode settings from URL', e);
    }
    return null;
  };

  const generateShareLink = useCallback(async (fullDetail = false, useShortening = true) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const encodedSettings = encodeSettings(weights, supportWeights, statsWeights, teamWeights, clutchWeights, durabilityWeights, includePlayoffs, yearMode, fullDetail);
    
    // Use URL shortener utility
    const result = await URLShortener.generateShareLink(
      baseUrl, 
      encodedSettings, 
      currentPreset,
      useShortening
    );

    return result;
  }, [weights, supportWeights, statsWeights, teamWeights, clutchWeights, durabilityWeights, includePlayoffs, yearMode, currentPreset]);

  // Apply QB filter based on attempts and games started
  const applyQBFilter = useCallback((qbs, settings, year) => {
    if (!settings) return qbs;
    
    return qbs.filter(qb => {
      const yearSeason = qb.seasonData?.find(season => season.year === parseInt(year));
      if (!yearSeason) return false;
      
      const totalAttempts = yearSeason.attempts || 0;
      const gamesStarted = yearSeason.gamesStarted || 0;
      
      const passesAttempts = totalAttempts >= settings.minAttempts;
      const passesGames = gamesStarted >= settings.minGames;
      
      return passesAttempts && passesGames;
    });
  }, []);

  // Calculate QEI with current weights and dynamic component calculations
  const rankedQBs = useMemo(() => {
    if (!qbData || qbData.length === 0) return [];
    
    const isSingleYear = true; // All modes are now single-year
    const yearLabel = `${yearMode}`;
    console.log(`🔄 Recalculating rankings with ${qbData.length} QBs for ${yearLabel} season`);
    
    // First pass: Calculate all base scores
    const qbsWithBaseScores = qbData.map(qb => {
      const baseScores = calculateQBMetrics(qb, supportWeights, statsWeights, teamWeights, clutchWeights, includePlayoffs, parseInt(yearMode), efficiencyWeights, protectionWeights, volumeWeights, durabilityWeights, qbData, weights.support);
      
      // DEBUG: Log if we're getting actually invalid base scores for 2025 (null, undefined, or NaN)
      const isInvalidScore = (score) => score == null || isNaN(score);
      if (yearMode === '2025' && (isInvalidScore(baseScores.team) || isInvalidScore(baseScores.stats))) {
        console.warn(`⚠️ ${qb.name} has invalid base scores:`, {
          team: baseScores.team,
          stats: baseScores.stats,
          clutch: baseScores.clutch,
          durability: baseScores.durability,
          support: baseScores.support
        });
      }
      
      return {
        ...qb,
        baseScores,
        // Store the ORIGINAL support z-score for display purposes
        // Positive = good cast, Negative = bad cast
        // This is NOT inverted, so users see the actual cast quality
        supportCastQuality: baseScores.support
      };
    });
    
    // Extract all base scores for support rebalancing
    const allQBBaseScores = qbsWithBaseScores.map(qb => qb.baseScores);
    
    // Second pass: Calculate QEI scores (already percentiles 0-100) and sort
    const finalRankings = qbsWithBaseScores
      .map(qb => {
        // Use actualFilterYear from QB object if available (handles 2024 fallback for 2025 mode)
        const filterYear = qb.actualFilterYear || parseInt(yearMode);
        
        const qei = calculateQEI(
          qb.baseScores, 
          qb, 
          weights, 
          includePlayoffs, 
          allQBBaseScores, 
          filterYear,
          null, // allQBsRawQei
          true  // isNormalized - scores are variance-normalized
        );
        
        // DEBUG: Log QEI calculations for 2025
        if (yearMode === '2025') {
          console.log(`📊 ${qb.name} QEI: ${qei.toFixed(2)} (Team: ${qb.baseScores.team?.toFixed(3)}, Stats: ${qb.baseScores.stats?.toFixed(3)})`);
        }
        
        return {
          ...qb,
          qei
        };
      })
      .sort((a, b) => b.qei - a.qei);
      
    // Apply user-defined filtering
    const filteredRankings = applyQBFilter(finalRankings, filterSettings, yearMode);
    
    console.log(`✅ Rankings calculated: ${finalRankings.length} total QBs, ${filteredRankings.length} after filtering`);
    console.log(`🔍 Filter applied: min ${filterSettings.minAttempts} attempts, min ${filterSettings.minGames} games`);
    
    return filteredRankings;
  }, [qbData, weights, supportWeights, statsWeights, teamWeights, clutchWeights, includePlayoffs, yearMode, efficiencyWeights, protectionWeights, volumeWeights, durabilityWeights, filterSettings, applyQBFilter]);

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
  const [isQuickShareLoading, setIsQuickShareLoading] = useState(false);
  const [isFullShareLoading, setIsFullShareLoading] = useState(false);

  // Share functionality
  const handleShare = useCallback(async (shareType = 'quick') => {
    console.log('🔗 Share button clicked:', shareType);
    let linkResult = null;
    
    try {
      if (shareType === 'quick') {
        setIsQuickShareLoading(true);
      } else {
        setIsFullShareLoading(true);
      }
      
      // Generate share link with URL shortening
      console.log('🔗 Generating share link...');
      linkResult = await generateShareLink(
        shareType === 'full', // fullDetail
        true // useShortening
      );
      
      console.log('🔗 Share link result:', linkResult);
      
      if (!linkResult.success) {
        throw new Error(linkResult.error || 'Failed to generate share link');
      }

      // Take screenshot
      console.log('📸 Starting screenshot generation...');
      console.log('📸 Ranked QBs count:', rankedQBs.length);
      
      const isSingleYear = true; // All modes are now single-year
      const screenshotResult = await captureTop10QBsScreenshot(rankedQBs, { 
        includePlayoffs, 
        include2024Only: isSingleYear,
        yearMode,
        currentPreset
      });
      
      console.log('📸 Screenshot result:', screenshotResult);
      
      if (!screenshotResult) {
        throw new Error('Screenshot generation returned null/undefined');
      }
      
      const { blobUrl, blob, dataUrl } = screenshotResult;
      
      if (!blobUrl || !blob) {
        throw new Error('Failed to generate screenshot - missing blob or blobUrl');
      }
      
      console.log('📸 Screenshot captured successfully:', blobUrl);
      console.log('📸 Screenshot size:', (blob.size / 1024).toFixed(2), 'KB');
      
      // Store data URL globally for fallback
      if (dataUrl) {
        window.screenshotDataUrl = dataUrl;
        console.log('📸 Data URL stored for fallback');
      }
      
      // Update meta tags for social sharing with the screenshot
      updateSocialMetaTags(linkResult.url, dataUrl, shareType);
      
      setShareModalScreenshotUrl(blobUrl);
      setShareModalLink(linkResult.url);
      setShareModalType(shareType === 'quick' ? 'quick' : 'full');
      
      // Store additional info for the modal
      const modalData = {
        url: linkResult.url,
        isShortened: linkResult.isShortened,
        originalLength: linkResult.originalLength,
        shortenedLength: linkResult.shortenedLength,
        expiresIn: linkResult.expiresIn,
        shareType: shareType,
      };
      
      console.log('✅ Share link generated successfully:', modalData);
      console.log('🔗 Opening share modal...');
      setIsShareModalOpen(true);
      
    } catch (err) {
      console.error('❌ Failed to share:', err);
      console.error('❌ Error stack:', err.stack);
      
      // More detailed error message
      let errorMessage = 'Failed to generate share content. ';
      if (err.message.includes('screenshot')) {
        errorMessage += 'Screenshot generation failed. Please try again.';
      } else if (err.message.includes('link')) {
        errorMessage += 'URL generation failed. Please try again.';
      } else {
        errorMessage += err.message;
      }
      
      if (linkResult?.fallbackUsed) {
        errorMessage += ' (Using full URL instead of shortened URL)';
      }
      
      alert(errorMessage);
    } finally {
      if (shareType === 'quick') {
        setIsQuickShareLoading(false);
      } else {
        setIsFullShareLoading(false);
      }
    }
  }, [generateShareLink, rankedQBs, includePlayoffs, yearMode]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Track if this is the initial component mount to prevent automatic adjustments
  const [isInitialMount, setIsInitialMount] = useState(true);
  
  // Track previous playoff state to detect manual changes
  const [prevIncludePlayoffs, setPrevIncludePlayoffs] = useState(includePlayoffs);

  // Load settings from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedSettings = urlParams.get('s'); // New format
    const encodedWeights = urlParams.get('w'); // Legacy format
    const preset = urlParams.get('preset');
    
    // Try new format first, then legacy format
    const settingsToLoad = encodedSettings || encodedWeights;
    
    if (settingsToLoad) {
      console.log('Loading settings from URL:', settingsToLoad);
      const decodedSettings = decodeSettings(settingsToLoad);
      if (decodedSettings) {
        console.log('Decoded settings:', decodedSettings);
        
        // Apply main weights
        if (decodedSettings.weights) {
          onWeightsChange(decodedSettings.weights);
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
          onIncludePlayoffsChange(decodedSettings.includePlayoffs);
        }
        
        // Apply year mode setting if present (with default to 2025)
        if (decodedSettings.yearMode !== undefined) {
          onYearModeChange(decodedSettings.yearMode);
        }
        
        onPresetChange(preset && PHILOSOPHY_PRESETS[preset] ? preset : 'custom');
      }
    } else if (preset && PHILOSOPHY_PRESETS[preset]) {
      // Call applyPreset directly here instead of using it as a dependency
      const presetData = PHILOSOPHY_PRESETS[preset];
      if (presetData) {
        const { description, ...weightCategories } = presetData;
        
        startTransition(() => {
          onWeightsChange(weightCategories);
          onPresetChange(preset);
          
          if (preset === 'default') {
            setSupportWeights({
              offensiveLine: 34,
              weapons: 33,
              defense: 33
            });
            
            setStatsWeights({
              efficiency: 45,
              protection: 30,
              volume: 25
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
    
    // Mark that initial mount is complete
    setIsInitialMount(false);
  }, [onWeightsChange, onPresetChange, onIncludePlayoffsChange, onYearModeChange]); // Dependencies for context handlers

  // Effect to handle playoff toggle changes for slider disabling only
  // REMOVED automatic weight adjustments to preserve user settings
  useEffect(() => {
    // Only update the previous state tracker, don't auto-adjust weights
    setPrevIncludePlayoffs(includePlayoffs);
  }, [includePlayoffs]);

  // Handle preset changes - apply sub-component weights when preset changes
  useEffect(() => {
    if (currentPreset && currentPreset !== 'custom' && PHILOSOPHY_PRESETS[currentPreset]) {
      console.log(`🎯 Applying preset: ${currentPreset}`);
      const preset = PHILOSOPHY_PRESETS[currentPreset];
      
      // Apply sub-component weights if they exist in the preset
      if (preset.supportWeights) {
        setSupportWeights(preset.supportWeights);
      }
      
      if (preset.statsWeights) {
        setStatsWeights(preset.statsWeights);
      }
      
      if (preset.teamWeights) {
        setTeamWeights(preset.teamWeights);
      }
      
      if (preset.clutchWeights) {
        setClutchWeights(preset.clutchWeights);
      }
      
      if (preset.durabilityWeights) {
        setDurabilityWeights(preset.durabilityWeights);
      }
      
      if (preset.efficiencyWeights) {
        setEfficiencyWeights(preset.efficiencyWeights);
      }
      
      if (preset.protectionWeights) {
        setProtectionWeights(preset.protectionWeights);
      }
      
      if (preset.volumeWeights) {
        setVolumeWeights(preset.volumeWeights);
      }
    }
  }, [currentPreset]);

  // Handle year mode changes - both weight adjustments and data fetching
  useEffect(() => {
    console.log(`🔄 Year mode changed to: ${yearMode}`);
    
    // Handle 2025 mode weight changes
    if (yearMode === '2025') {
      console.log('🔄 2025 Mode: Maintaining pure QB quality focus (Stats 100%, Team 0%)');
      onWeightsChange({
        team: 0,      // Pure QB evaluation - no team bias
        stats: 100,   // 100% statistical evaluation
        clutch: 0,
        durability: 0,
        support: 0
      });
      
      // Always fetch 2025 data when switching to 2025 mode
      if (fetchAllQBData) {
        console.log('🔄 2025 Mode: Fetching 2025 data');
        fetchAllQBData(yearMode);
      }
    } else {
      // Handle other year modes - always fetch data
      if (fetchAllQBData) {
        console.log(`🔄 Mode switched, refetching data for: ${yearMode}`);
        fetchAllQBData(yearMode);
      }
    }
  }, [yearMode, fetchAllQBData, onWeightsChange]); // Consolidated dependencies

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-8 animate-pulse">🏈</div>
          <h2 className="text-4xl font-semibold mb-6 tracking-tight">Loading NFL Quarterbacks...</h2>
          <div className="space-y-3 text-slate-300 font-light">
            <p className="text-lg">📊 Loading quarterback data</p>
            <p className="text-lg">📈 Parsing {yearMode} season statistics</p>
            <p className="text-lg">🔢 Calculating QEI performance metrics</p>
            <p className="text-lg">🏆 Ranking elite quarterbacks</p>
          </div>
          <div className="mt-8 text-amber-400 font-medium">
            ⏳ Processing data...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-6">❌</div>
          <h2 className="text-3xl font-semibold mb-4 tracking-tight">Failed to Load QB Data</h2>
          <p className="text-slate-300 mb-6 font-light">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-glass-medium hover:bg-glass-strong backdrop-blur-lg border border-glass-border px-8 py-4 rounded-xl font-medium transition-all duration-300 hover:shadow-glow-blue-sm"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">🏆 QB Rankings</h1>
          <p className="text-slate-300 text-lg font-light">
            {yearMode} NFL season analysis • Single-season quarterback rankings • Dynamic QEI
          </p>
        </div>








        {/* Customize Your QB Philosophy - Accordion */}
        <div className="bg-glass-medium backdrop-blur-xl rounded-2xl mb-12 border border-glass-border shadow-glass-sm">
          {/* Accordion Header */}
          <div 
            className="p-8 cursor-pointer hover:bg-glass-light transition-all duration-300 select-none"
            onClick={() => setIsCustomizeAccordionOpen(!isCustomizeAccordionOpen)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-semibold text-white tracking-tight">🎯 Customize Your QB Philosophy</h3>
                <p className="text-slate-300 text-base mt-2 font-light">
                  Advanced settings to fine-tune weightings and components
                </p>
              </div>
              <div className="ml-8 flex items-center justify-center">
                <div className={`
                  w-10 h-10 rounded-full bg-glass-light border border-glass-border 
                  flex items-center justify-center
                  transition-all duration-300 ease-in-out
                  hover:bg-glass-medium hover:border-accent-300/50 hover:shadow-glow-blue-sm
                  ${isCustomizeAccordionOpen ? 'rotate-180 bg-accent-500/20 border-accent-400/50 shadow-glow-blue-sm' : 'rotate-0'}
                `}>
                  <svg 
                    className="w-5 h-5 text-white transition-colors duration-300" 
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
            <div className="border-t border-glass-border">
              <div className="p-8">
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
                  yearMode={yearMode}
                />
              </div>
            </div>
          )}
        </div>

        {/* Share Button Section */}
        <div className="text-center mb-12 text-slate-300">
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <button 
              onClick={() => {
                console.log('📋 Share Your Custom QB Rankings button clicked!');
                handleShare('full');
              }}
              className="bg-accent-500/30 hover:bg-accent-500/40 backdrop-blur-lg border border-accent-400/50 px-8 py-4 rounded-xl font-medium transition-all duration-300 text-white hover:shadow-glow-blue-sm"
              disabled={isQuickShareLoading || isFullShareLoading}
            >
              {isFullShareLoading ? '⏳ Generating...' : '📋 Share Your Custom QB Rankings'}
            </button>
          </div>
        </div>

        {/* Live Rankings Table */}
        <QBRankingsTable 
          rankedQBs={rankedQBs} 
          includePlayoffs={includePlayoffs}
          include2024Only={true}
          yearMode={yearMode}
          onYearModeChange={onYearModeChange}
          showFilterControls={true}
          filterSettings={filterSettings}
          onFilterSettingsChange={setFilterSettings}
        />

        {/* Footer */}
        <div className="text-center mt-12 text-slate-300">
          <p className="text-lg font-light">🚀 Dynamic Rankings • 📈 Per-Season Analysis • 🎛️ Customizable Weights</p>
          {lastFetch && (
            <p className="text-sm mt-4 text-slate-400">
              Last updated: {new Date(lastFetch).toLocaleTimeString()} 
              {shouldRefreshData() ? ' (Data may be stale)' : ' (Fresh data)'}
            </p>
          )}
          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              <button 
                onClick={() => {
                  console.log('📋 Bottom Share Your Custom QB Rankings button clicked!');
                  handleShare('full');
                }}
                className="bg-accent-500/30 hover:bg-accent-500/40 backdrop-blur-lg border border-accent-400/50 px-6 py-3 rounded-lg font-medium transition-all duration-300 text-white hover:shadow-glow-blue-sm"
                disabled={isQuickShareLoading || isFullShareLoading}
              >
                {isFullShareLoading ? '⏳ Generating...' : '📋 Share Your Custom QB Rankings'}
              </button>
            </div>
            <div className="mt-8 pt-6 border-t border-glass-border">
              <div className="flex flex-wrap justify-center gap-4 mb-4">
                <Link 
                  to="/documentation"
                  className="bg-accent-500/20 hover:bg-accent-500/30 backdrop-blur-lg border border-accent-400/30 px-8 py-3 rounded-lg font-medium transition-all duration-300 text-accent-200 hover:text-white hover:shadow-glow-blue-sm"
                >
                  📚 View Scoring Methodology & Documentation
                </Link>
                <Link 
                  to="/splits-comparison"
                  className="bg-amber-500/20 hover:bg-amber-500/30 backdrop-blur-lg border border-amber-400/30 px-8 py-3 rounded-lg font-medium transition-all duration-300 text-amber-200 hover:text-white hover:shadow-glow-blue-sm"
                >
                  📊 Splits Comparison Tool
                </Link>
              </div>
              <p className="text-sm text-accent-300 mt-3 font-light">
                Learn how our QB evaluation system works - from team success to clutch performance
              </p>
              <p className="text-sm text-amber-300 mt-2 font-light">
                Compare any statistic from qb_splits or qb_splits_advanced tables
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-glass-medium hover:bg-glass-strong backdrop-blur-xl text-white p-4 rounded-full shadow-glass-sm transition-all duration-300 z-50 border border-glass-border hover:shadow-glow-blue-sm"
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