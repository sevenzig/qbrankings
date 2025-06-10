import React, { useState, useEffect, useMemo } from 'react';
import { useQBData } from '../hooks/useQBData.js';
import { calculateQEI } from '../utils/qbCalculations.js';
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

  const updateWeight = (category, value) => {
    setWeights(prev => ({
      ...prev,
      [category]: parseInt(value)
    }));
    setCurrentPreset('custom'); // Reset to custom when manually adjusting
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
  const encodeWeights = (weights) => {
    return `${weights.team},${weights.stats},${weights.clutch},${weights.durability},${weights.support}`;
  };

  const decodeWeights = (encodedWeights) => {
    try {
      const values = encodedWeights.split(',').map(v => parseInt(v));
      if (values.length === 5 && values.every(v => !isNaN(v) && v >= 0 && v <= 100)) {
        return {
          team: values[0],
          stats: values[1],
          clutch: values[2],
          durability: values[3],
          support: values[4]
        };
      }
    } catch (e) {
      console.warn('Failed to decode weights from URL');
    }
    return null;
  };

  const generateShareLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const encodedWeights = encodeWeights(weights);
    const presetParam = currentPreset !== 'custom' ? `&preset=${currentPreset}` : '';
    return `${baseUrl}?w=${encodedWeights}${presetParam}`;
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

  // Load weights from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedWeights = urlParams.get('w');
    const preset = urlParams.get('preset');
    
    if (encodedWeights) {
      const decodedWeights = decodeWeights(encodedWeights);
      if (decodedWeights) {
        setWeights(decodedWeights);
        setCurrentPreset(preset && PHILOSOPHY_PRESETS[preset] ? preset : 'custom');
      }
    } else if (preset && PHILOSOPHY_PRESETS[preset]) {
      applyPreset(preset);
    }
  }, []);



  // Calculate QEI with current weights
  const rankedQBs = qbData
    .map(qb => ({
      ...qb,
      qei: calculateQEI(qb.baseScores, qb, weights)
    }))
    .sort((a, b) => b.qei - a.qei);

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
                  {category === 'team' && 'Win-loss record, playoff success (NEW: Round-specific weighting)'}
                  {category === 'stats' && 'ANY/A, success rate, production (NEW: Playoff stat bonuses)'}
                  {category === 'clutch' && 'Game-winning drives, 4QC (NEW: Round-specific multipliers)'}
                  {category === 'durability' && 'Games started, consistency'}
                  {category === 'support' && 'Extra credit for poor supporting cast'}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <span className={`text-lg font-bold ${totalWeight === 100 ? 'text-green-400' : 'text-red-400'}`}>
              Total Weight: {totalWeight}%
            </span>
          </div>
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
                    <td className="px-4 py-3 text-center text-blue-200">{qb.combinedRecord}</td>
                    <td className="px-4 py-3 text-center text-blue-200">
                      <div>{qb.stats.yardsPerGame.toFixed(1)} yds/g</div>
                      <div className="text-xs">{qb.stats.tdsPerGame.toFixed(2)} TD/g, {qb.stats.turnoversPerGame.toFixed(2)} TO/g</div>
                    </td>
                    <td className="px-4 py-3 text-center text-white">
                      <div>{qb.experience}</div>
                      <div className="text-xs text-blue-200">{qb.stats.gamesStarted} starts</div>
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
              🔗 Share Your QB Philosophy
            </button>
            <p className="text-xs text-blue-400">
              Share your custom slider settings with friends and compare QB evaluation styles!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicQBRankings; 