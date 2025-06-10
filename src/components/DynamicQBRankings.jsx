import React, { useState, useEffect, useMemo } from 'react';
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

const DynamicQBRankings = () => {
  const { qbData, loading, error, lastFetch, shouldRefreshData, fetchAllQBData } = useQBData();
  
  const [weights, setWeights] = useState({
    team: 30,
    stats: 40,
    clutch: 15,
    durability: 10,
    support: 5
  });
  const [currentPreset, setCurrentPreset] = useState('balanced');
  const [supportWeights, setSupportWeights] = useState({
    offensiveLine: 55,
    weapons: 30,
    defense: 15
  });
  const [showSupportDetails, setShowSupportDetails] = useState(false);
  const [statsWeights, setStatsWeights] = useState({
    efficiency: 45,      // ANY/A, TD%, Completion%
    protection: 25,      // Sack%, Int%, Fumble%
    volume: 30          // Volume and production metrics
  });
  const [showStatsDetails, setShowStatsDetails] = useState(false);
  const [teamWeights, setTeamWeights] = useState({
    regularSeason: 65,   // Regular season win percentage
    playoff: 35         // Career playoff achievement score
  });
  const [showTeamDetails, setShowTeamDetails] = useState(false);

  // Global playoff inclusion toggle - affects ALL calculations
  const [includePlayoffs, setIncludePlayoffs] = useState(true);

  const updateWeight = (category, value) => {
    setWeights(prev => ({
      ...prev,
      [category]: parseInt(value)
    }));
    setCurrentPreset('custom'); // Reset to custom when manually adjusting
  };

  const updateSupportWeight = (component, value) => {
    const newValue = parseInt(value);
    setSupportWeights(prev => {
      // Calculate total with the new value
      const newWeights = { ...prev, [component]: newValue };
      const total = Object.values(newWeights).reduce((sum, val) => sum + val, 0);
      
      // Allow independent operation but prevent total from exceeding 100
      if (total <= 100) {
        return newWeights;
      } else {
        // If total would exceed 100, set to max possible value
        const otherTotal = Object.keys(prev)
          .filter(key => key !== component)
          .reduce((sum, key) => sum + prev[key], 0);
        const maxValue = 100 - otherTotal;
        return { ...prev, [component]: Math.max(0, maxValue) };
      }
    });
  };

  const updateStatsWeight = (component, value) => {
    const newValue = parseInt(value);
    setStatsWeights(prev => {
      // Calculate total with the new value
      const newWeights = { ...prev, [component]: newValue };
      const total = Object.values(newWeights).reduce((sum, val) => sum + val, 0);
      
      // Allow independent operation but prevent total from exceeding 100
      if (total <= 100) {
        return newWeights;
      } else {
        // If total would exceed 100, set to max possible value
        const otherTotal = Object.keys(prev)
          .filter(key => key !== component)
          .reduce((sum, key) => sum + prev[key], 0);
        const maxValue = 100 - otherTotal;
        return { ...prev, [component]: Math.max(0, maxValue) };
      }
    });
  };

  const updateTeamWeight = (component, value) => {
    // If playoffs are disabled, freeze the playoff slider and don't allow changes
    if (!includePlayoffs && component === 'playoff') {
      return;
    }
    
    const newValue = parseInt(value);
    setTeamWeights(prev => {
      // When playoffs are disabled, automatically set playoff to 0% and regular season to 100%
      if (!includePlayoffs) {
        return {
          regularSeason: 100,
          playoff: 0
        };
      }
      
      // Calculate total with the new value
      const newWeights = { ...prev, [component]: newValue };
      const total = Object.values(newWeights).reduce((sum, val) => sum + val, 0);
      
      // Allow independent operation but prevent total from exceeding 100
      if (total <= 100) {
        return newWeights;
      } else {
        // If total would exceed 100, set to max possible value
        const otherTotal = Object.keys(prev)
          .filter(key => key !== component)
          .reduce((sum, key) => sum + prev[key], 0);
        const maxValue = 100 - otherTotal;
        return { ...prev, [component]: Math.max(0, maxValue) };
      }
    });
  };

  const applyPreset = (presetName) => {
    const preset = PHILOSOPHY_PRESETS[presetName];
    // Extract only the weight categories, exclude the description
    const { description, ...weightCategories } = preset;
    setWeights(weightCategories);
    setCurrentPreset(presetName);
  };

  const getCurrentPresetDescription = () => {
    console.log('Current preset:', currentPreset);
    
    if (currentPreset === 'custom') {
      return "Custom settings - adjust sliders to match your QB evaluation philosophy";
    }
    
    const preset = PHILOSOPHY_PRESETS[currentPreset];
    if (preset && preset.description) {
      return preset.description;
    }
    
    return "Custom settings";
  };

  // Helper function to get all unique teams a QB played for
  const getQBTeams = (qb) => {
    if (!qb.seasonData || qb.seasonData.length === 0) {
      return [{ team: qb.team, logo: qb.teamLogo }];
    }
    
    // Get unique teams from season data
    const uniqueTeams = [];
    const seenTeams = new Set();
    
    qb.seasonData.forEach(season => {
      // First check if this season has a teamsPlayed array (for multi-team seasons)
      if (season.teamsPlayed && season.teamsPlayed.length > 0) {
        season.teamsPlayed.forEach(team => {
          if (!seenTeams.has(team)) {
            seenTeams.add(team);
            const teamInfo = getTeamInfo(team);
            uniqueTeams.push({
              team: team,
              logo: teamInfo.logo
            });
          }
        });
      } else if (season.team && !seenTeams.has(season.team) && !season.team.match(/^\d+TM$/)) {
        // Fallback to season.team if no teamsPlayed array, but skip "2TM" type entries
        seenTeams.add(season.team);
        const teamInfo = getTeamInfo(season.team);
        uniqueTeams.push({
          team: season.team,
          logo: teamInfo.logo
        });
      }
    });
    
    return uniqueTeams.length > 0 ? uniqueTeams : [{ team: qb.team, logo: qb.teamLogo }];
  };

  // URL sharing functions
  const encodeSettings = (weights, supportWeights, statsWeights, teamWeights, includePlayoffs) => {
    // Main weights (5 values)
    const mainWeights = `${weights.team},${weights.stats},${weights.clutch},${weights.durability},${weights.support}`;
    
    // Support weights (3 values)
    const supportEnc = `${supportWeights.offensiveLine},${supportWeights.weapons},${supportWeights.defense}`;
    
    // Stats weights (3 values)
    const statsEnc = `${statsWeights.efficiency},${statsWeights.protection},${statsWeights.volume}`;
    
    // Team weights (2 values)
    const teamEnc = `${teamWeights.regularSeason},${teamWeights.playoff}`;
    
    // Team settings (1 value: 1 for true, 0 for false)
    const settingsEnc = includePlayoffs ? '1' : '0';
    
    return `${mainWeights}|${supportEnc}|${statsEnc}|${teamEnc}|${settingsEnc}`;
  };

  const decodeSettings = (encodedSettings) => {
    try {
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

      // New format with all components
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
        if (teamValues.length === 2 && teamValues.every(v => !isNaN(v) && v >= 0 && v <= 100)) {
          result.teamWeights = {
            regularSeason: teamValues[0],
            playoff: teamValues[1]
          };
        }
      }

      // Team settings (optional)
      if (sections[4]) {
        const settingValue = parseInt(sections[4]);
        if (!isNaN(settingValue)) {
          result.includePlayoffs = settingValue === 1;
        }
      }

      return result;
    } catch (e) {
      console.warn('Failed to decode settings from URL');
    }
    return null;
  };

  const generateShareLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const encodedSettings = encodeSettings(weights, supportWeights, statsWeights, teamWeights, includePlayoffs);
    const presetParam = currentPreset !== 'custom' ? `&preset=${currentPreset}` : '';
    return `${baseUrl}?s=${encodedSettings}${presetParam}`;
  };

  const copyShareLink = async () => {
    const shareLink = generateShareLink();
    try {
      await navigator.clipboard.writeText(shareLink);
      // Show temporary success message
      const button = document.getElementById('share-button');
      const originalText = button.textContent;
      button.textContent = '✅ Copied!';
      button.className = button.className.replace('bg-blue-500/20 hover:bg-blue-500/30', 'bg-green-500/20 hover:bg-green-500/30');
      setTimeout(() => {
        button.textContent = originalText;
        button.className = button.className.replace('bg-green-500/20 hover:bg-green-500/30', 'bg-blue-500/20 hover:bg-blue-500/30');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback: show the link in a prompt
      prompt('Copy this link to share your QB philosophy:', shareLink);
    }
  };

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
        
        // Apply team settings if present
        if (decodedSettings.includePlayoffs !== undefined) {
          setIncludePlayoffs(decodedSettings.includePlayoffs);
        }
        
        setCurrentPreset(preset && PHILOSOPHY_PRESETS[preset] ? preset : 'custom');
      }
    } else if (preset && PHILOSOPHY_PRESETS[preset]) {
      applyPreset(preset);
    }
  }, []);

  // Auto-adjust team weights when playoff toggle changes
  useEffect(() => {
    if (!includePlayoffs) {
      setTeamWeights({
        regularSeason: 100,
        playoff: 0
      });
    } else {
      // When playoffs are re-enabled, restore to balanced 65/35 split
      setTeamWeights({
        regularSeason: 65,
        playoff: 35
      });
    }
  }, [includePlayoffs]);

  // Calculate QEI with current weights and dynamic component calculations
  const rankedQBs = useMemo(() => {
    return qbData
      .map(qb => {
        // Recalculate base scores with all current weight settings
        const baseScores = calculateQBMetrics(qb, supportWeights, statsWeights, teamWeights, includePlayoffs);
        return {
          ...qb,
          baseScores,
          qei: calculateQEI(baseScores, qb, weights)
        };
      })
      .sort((a, b) => b.qei - a.qei);
  }, [qbData, weights, supportWeights, statsWeights, teamWeights, includePlayoffs]);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

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
          <p className="text-blue-200">3-Year NFL analysis (2022-2024) • Career quarterback rankings • Dynamic QEI</p>
          <div className="mt-4 text-sm text-blue-300">
            📊 {rankedQBs.length} Active Quarterbacks • 🎛️ Customizable Weights • 📈 Multi-Year Career Data
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">🎯 Customize Your QB Philosophy</h3>
          
          {/* Global Playoff Toggle */}
          <div className="mb-6 bg-white/5 rounded-lg p-4 border-2 border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium text-lg flex items-center">
                  🏆 Include Playoff Performance
                  <span className="ml-2 text-xs text-yellow-200 bg-yellow-500/20 px-2 py-1 rounded">
                    Global Setting
                  </span>
                </h4>
                <div className="text-sm text-yellow-200 mt-1">
                  When enabled: All stats include regular season + playoffs (games, records, averages, etc.)
                  <br />
                  When disabled: All stats are purely regular season
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={includePlayoffs}
                  onChange={(e) => setIncludePlayoffs(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-500"></div>
              </label>
            </div>
          </div>
          
          {/* Philosophy Presets */}
          <div className="mb-6">
            <h4 className="text-white font-medium mb-3">Quick Philosophy Presets:</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => applyPreset('winner')}
                className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-200 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🏆 Winner
              </button>
              <button
                onClick={() => applyPreset('analyst')}
                className="bg-green-600/20 hover:bg-green-600/30 text-green-200 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                📊 Analyst
              </button>
              <button
                onClick={() => applyPreset('clutch')}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-200 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                💎 Clutch
              </button>
              <button
                onClick={() => applyPreset('balanced')}
                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ⚖️ Balanced
              </button>
              <button
                onClick={() => applyPreset('context')}
                className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🏢 Context
              </button>
            </div>
            <div className="text-sm text-blue-200 italic">
              💡 Current Philosophy: {getCurrentPresetDescription()}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(weights).map(([category, value]) => (
              <div key={category} className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-white font-medium capitalize">{category}</label>
                  <span className="bg-green-500/30 text-green-100 px-2 py-1 rounded text-sm">
                    {value}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) => updateWeight(category, e.target.value)}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-xs text-blue-200 mt-1">
                  {category === 'team' && (
                    <div>
                      <div>Win-loss record, playoff success (NEW: Round-specific weighting)</div>
                      <button
                        onClick={() => setShowTeamDetails(!showTeamDetails)}
                        className="mt-1 text-blue-300 hover:text-blue-100 underline text-xs"
                      >
                        {showTeamDetails ? '▼ Hide Details' : '▶ Adjust Components'}
                      </button>
                    </div>
                  )}
                  {category === 'stats' && (
                    <div>
                      <div>ANY/A, success rate, production (NEW: Playoff stat bonuses)</div>
                      <button
                        onClick={() => setShowStatsDetails(!showStatsDetails)}
                        className="mt-1 text-blue-300 hover:text-blue-100 underline text-xs"
                      >
                        {showStatsDetails ? '▼ Hide Details' : '▶ Adjust Components'}
                      </button>
                    </div>
                  )}
                  {category === 'clutch' && 'Game-winning drives, 4QC (NEW: Round-specific multipliers)'}
                  {category === 'durability' && 'Games started, consistency'}
                  {category === 'support' && (
                    <div>
                      <div>Extra credit for poor supporting cast</div>
                      <button
                        onClick={() => setShowSupportDetails(!showSupportDetails)}
                        className="mt-1 text-blue-300 hover:text-blue-100 underline text-xs"
                      >
                        {showSupportDetails ? '▼ Hide Details' : '▶ Adjust Components'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <span className={`text-lg font-bold ${totalWeight === 100 ? 'text-green-400' : 'text-red-400'}`}>
              Total Weight: {totalWeight}%
            </span>
          </div>

          {/* Support Component Details Dropdown */}
          {showSupportDetails && (
            <div className="mt-6 bg-white/5 rounded-lg p-4 border-2 border-purple-500/30">
              <h4 className="text-white font-medium mb-3 flex items-center">
                🏟️ Supporting Cast Components
                <span className="ml-2 text-xs text-purple-200 bg-purple-500/20 px-2 py-1 rounded">
                  Advanced Settings
                </span>
              </h4>
              <div className="text-xs text-blue-200 mb-4">
                Adjust how much each component affects the supporting cast difficulty score. All components must sum to 100%.
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(supportWeights).map(([component, value]) => (
                  <div key={component} className="bg-white/5 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-white font-medium text-sm capitalize">
                        {component === 'offensiveLine' ? 'Offensive Line' : component}
                      </label>
                      <span className="bg-purple-500/30 text-purple-100 px-2 py-1 rounded text-xs">
                        {value}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="80"
                      value={value}
                      onChange={(e) => updateSupportWeight(component, e.target.value)}
                      className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-xs text-purple-200 mt-1">
                      {component === 'offensiveLine' && 'Pass protection & run blocking quality'}
                      {component === 'weapons' && 'Skill position talent & depth'}
                      {component === 'defense' && 'Field position & game script impact'}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 text-center">
                <span className={`text-sm font-bold ${Object.values(supportWeights).reduce((sum, val) => sum + val, 0) === 100 ? 'text-green-400' : 'text-red-400'}`}>
                  Component Total: {Object.values(supportWeights).reduce((sum, val) => sum + val, 0)}%
                </span>
              </div>
            </div>
          )}

          {/* Stats Component Details Dropdown */}
          {showStatsDetails && (
            <div className="mt-6 bg-white/5 rounded-lg p-4 border-2 border-green-500/30">
              <h4 className="text-white font-medium mb-3 flex items-center">
                📊 Statistical Components
                <span className="ml-2 text-xs text-green-200 bg-green-500/20 px-2 py-1 rounded">
                  Advanced Settings
                </span>
              </h4>
              <div className="text-xs text-blue-200 mb-4">
                Adjust how much each statistical category affects the stats score. All components must sum to 100%.
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(statsWeights).map(([component, value]) => (
                  <div key={component} className="bg-white/5 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-white font-medium text-sm capitalize">
                        {component}
                      </label>
                      <span className="bg-green-500/30 text-green-100 px-2 py-1 rounded text-xs">
                        {value}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="70"
                      value={value}
                      onChange={(e) => updateStatsWeight(component, e.target.value)}
                      className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-xs text-green-200 mt-1">
                      {component === 'efficiency' && 'ANY/A, TD%, Completion% - core passing metrics'}
                      {component === 'protection' && 'Sack%, Int%, Fumble% - decision making & pocket presence'}
                      {component === 'volume' && 'Passing yards, TDs, attempts - production & workload'}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 text-center">
                <span className={`text-sm font-bold ${Object.values(statsWeights).reduce((sum, val) => sum + val, 0) === 100 ? 'text-green-400' : 'text-red-400'}`}>
                  Component Total: {Object.values(statsWeights).reduce((sum, val) => sum + val, 0)}%
                </span>
              </div>
            </div>
          )}

          {/* Team Component Details Dropdown */}
          {showTeamDetails && (
            <div className="mt-6 bg-white/5 rounded-lg p-4 border-2 border-yellow-500/30">
              <h4 className="text-white font-medium mb-3 flex items-center">
                🏆 Team Success Components
                <span className="ml-2 text-xs text-yellow-200 bg-yellow-500/20 px-2 py-1 rounded">
                  Advanced Settings
                </span>
              </h4>
              <div className="text-xs text-blue-200 mb-4">
                Adjust how much each component affects the team success score. All components must sum to 100%. 
                <br /><em>Note: Games started/injury resilience is covered by the Durability slider.</em>
              </div>


              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(teamWeights).map(([component, value]) => (
                  <div key={component} className="bg-white/5 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-white font-medium text-sm capitalize">
                        {component === 'regularSeason' ? 'Regular Season' : component}
                      </label>
                      <span className="bg-yellow-500/30 text-yellow-100 px-2 py-1 rounded text-xs">
                        {value}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={value}
                      onChange={(e) => updateTeamWeight(component, e.target.value)}
                      disabled={!includePlayoffs && component === 'playoff'}
                      className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                        !includePlayoffs && component === 'playoff' 
                          ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                          : 'bg-yellow-200'
                      }`}
                    />
                    <div className="text-xs text-yellow-200 mt-1">
                      {component === 'regularSeason' && 'Win-loss record, regular season success'}
                      {component === 'playoff' && 'Playoff wins, deep runs, Super Bowl appearances'}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 text-center">
                <span className={`text-sm font-bold ${Object.values(teamWeights).reduce((sum, val) => sum + val, 0) === 100 ? 'text-green-400' : 'text-red-400'}`}>
                  Component Total: {Object.values(teamWeights).reduce((sum, val) => sum + val, 0)}%
                </span>
                {!includePlayoffs && (
                  <div className="text-xs text-orange-300 mt-1">
                    ⚠️ Playoff component disabled - only Regular Season will be scored
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Live Rankings Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/20">
            <h3 className="text-xl font-bold text-white">🏆 QB Rankings ({rankedQBs.length} Active QBs)</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-white font-bold">Rank</th>
                  <th className="px-4 py-3 text-left text-white font-bold">QB</th>
                  <th className="px-4 py-3 text-center text-white font-bold">Team</th>
                  <th className="px-4 py-3 text-center text-white font-bold">QEI</th>
                  <th className="px-4 py-3 text-center text-white font-bold">Team Record</th>
                  <th className="px-4 py-3 text-center text-white font-bold">Per-Game Averages</th>
                  <th className="px-4 py-3 text-center text-white font-bold">Seasons</th>
                  <th className="px-4 py-3 text-center text-white font-bold">Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {rankedQBs.map((qb, index) => (
                  <tr 
                    key={qb.id} 
                    className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20' :
                      index === 2 ? 'bg-gradient-to-r from-amber-600/20 to-amber-700/20' :
                      index < 8 ? 'bg-green-500/10' : 'bg-blue-500/5'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-xl font-bold text-white">#{index + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-bold text-white">{qb.name}</div>
                        <div className="text-xs text-blue-200">{qb.experience} seasons • Age {qb.age}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center flex-wrap">
                        {getQBTeams(qb).map((teamData, teamIndex) => (
                          <div key={teamData.team} className="flex items-center">
                            {teamData.logo && (
                              <img 
                                src={teamData.logo} 
                                alt={teamData.team} 
                                className="w-6 h-6" 
                                title={teamData.team}
                              />
                            )}
                            {teamIndex < getQBTeams(qb).length - 1 && (
                              <span className="text-white/50 mx-1">/</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className={`inline-block px-3 py-1 rounded-lg ${getQEIColor(qb.qei)}`}>
                        <span className="text-xl font-bold">{qb.qei.toFixed(1)}</span>
                        <div className="text-xs opacity-75">
                          {qb.qei >= 95 ? 'Elite' : qb.qei >= 88 ? 'Excellent' : qb.qei >= 78 ? 'Very Good' : qb.qei >= 65 ? 'Good' : qb.qei >= 50 ? 'Average' : 'Below Avg'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-blue-200">
                      <div>{qb.combinedRecord}</div>
                      {includePlayoffs && (() => {
                        // Calculate playoff record across all seasons
                        let totalPlayoffWins = 0;
                        let totalPlayoffLosses = 0;
                        
                        if (qb.seasonData) {
                          qb.seasonData.forEach(season => {
                            if (season.playoffData) {
                              totalPlayoffWins += season.playoffData.wins || 0;
                              totalPlayoffLosses += season.playoffData.losses || 0;
                            }
                          });
                        }
                        
                        const hasPlayoffRecord = totalPlayoffWins > 0 || totalPlayoffLosses > 0;
                        
                        return hasPlayoffRecord ? (
                          <div className="text-xs text-yellow-300 mt-1">
                            Playoffs: {totalPlayoffWins}-{totalPlayoffLosses}
                          </div>
                        ) : null;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center text-blue-200">
                      <div>{qb.stats.yardsPerGame.toFixed(1)} yds/g</div>
                      <div className="text-xs">{qb.stats.tdsPerGame.toFixed(2)} TD/g, {qb.stats.turnoversPerGame.toFixed(2)} TO/g</div>
                    </td>
                    <td className="px-4 py-3 text-center text-white">
                      <div>{qb.experience}</div>
                      <div className="text-xs text-blue-200">{qb.stats.gamesStarted} starts</div>
                      {includePlayoffs && (() => {
                        // Calculate playoff starts across all seasons
                        let totalPlayoffStarts = 0;
                        
                        if (qb.seasonData) {
                          qb.seasonData.forEach(season => {
                            if (season.playoffData) {
                              totalPlayoffStarts += season.playoffData.gamesStarted || 0;
                            }
                          });
                        }
                        
                        return totalPlayoffStarts > 0 ? (
                          <div className="text-xs text-yellow-300 mt-1">
                            {totalPlayoffStarts} playoff starts
                          </div>
                        ) : null;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center text-blue-200">{qb.stats.passerRating.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
            <button 
              id="share-button"
              onClick={copyShareLink}
              className="bg-blue-500/20 hover:bg-blue-500/30 px-6 py-2 rounded-lg font-bold transition-colors"
            >
              🔗 Share Your Complete QB Philosophy
            </button>
            <p className="text-xs text-blue-400">
              Share all your custom settings including main weights and advanced component breakdowns!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicQBRankings; 