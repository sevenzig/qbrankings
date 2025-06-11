import React, { memo } from 'react';
import WeightSlider from './WeightSlider.jsx';

const WeightControls = memo(({ 
  weights, 
  onUpdateWeight, 
  onNormalizeWeights,
  showDetails,
  onShowDetails,
  // Sub-component weights and handlers
  supportWeights,
  onUpdateSupportWeight,
  onNormalizeSupportWeights,
  statsWeights,
  onUpdateStatsWeight,
  onNormalizeStatsWeights,
  efficiencyWeights,
  onUpdateEfficiencyWeight,
  onNormalizeEfficiencyWeights,
  protectionWeights,
  onUpdateProtectionWeight,
  onNormalizeProtectionWeights,
  volumeWeights,
  onUpdateVolumeWeight,
  onNormalizeVolumeWeights,
  teamWeights,
  onUpdateTeamWeight,
  onNormalizeTeamWeights,
  clutchWeights,
  onUpdateClutchWeight,
  onNormalizeClutchWeights,
  durabilityWeights,
  onUpdateDurabilityWeight,
  onNormalizeDurabilityWeights,
  includePlayoffs
}) => {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const weightDescriptions = {
    team: 'Win-loss record, playoff success (NEW: Round-specific weighting)',
    stats: 'ANY/A, success rate, production (NEW: Playoff stat bonuses)',
    clutch: 'Game-winning drives, 4QC (NEW: Round-specific multipliers)',
    durability: 'Games started, consistency',
    support: 'Extra credit for poor supporting cast'
  };

  return (
    <div className="space-y-6">
      {/* Main Weight Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
        {Object.entries(weights).map(([category, value]) => (
          <WeightSlider
            key={category}
            category={category}
            value={value}
            onUpdateWeight={onUpdateWeight}
            onShowDetails={category === 'team' ? () => onShowDetails.team() :
                          category === 'stats' ? () => onShowDetails.stats() :
                          category === 'clutch' ? () => onShowDetails.clutch() :
                          category === 'durability' ? () => onShowDetails.durability() :
                          category === 'support' ? () => onShowDetails.support() :
                          null}
            showDetails={showDetails[category]}
            description={weightDescriptions[category]}
          />
        ))}
        
        <div className="md:col-span-5 mt-4 text-center space-y-2">
          <span className={`text-lg font-bold ${totalWeight === 100 ? 'text-green-400' : 'text-red-400'}`}>
            Total Weight: {totalWeight}%
          </span>
          {totalWeight !== 100 && (
            <div>
              <button
                onClick={onNormalizeWeights}
                className="bg-blue-500/20 hover:bg-blue-500/30 px-4 py-2 rounded-lg text-blue-200 hover:text-white transition-colors text-sm font-medium"
                title="Adjust all weights proportionally to total exactly 100%"
              >
                ⚖️ Normalize to 100%
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Support Component Details Dropdown */}
      {showDetails.support && (
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
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onUpdateSupportWeight(component, e.target.value)}
                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onUpdateSupportWeight(component, e.target.value)}
                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm text-center"
                    placeholder="0-100"
                  />
                </div>
                <div className="text-xs text-purple-200 mt-1">
                  {component === 'offensiveLine' && 'Pass protection & run blocking quality'}
                  {component === 'weapons' && 'Skill position talent & depth'}
                  {component === 'defense' && 'Field position & game script impact'}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-center space-y-2">
            <span className={`text-sm font-bold ${Object.values(supportWeights).reduce((sum, val) => sum + val, 0) === 100 ? 'text-green-400' : 'text-blue-400'}`}>
              Component Total: {Object.values(supportWeights).reduce((sum, val) => sum + val, 0)}%
            </span>
            {Object.values(supportWeights).reduce((sum, val) => sum + val, 0) !== 100 && (
              <div>
                <button
                  onClick={onNormalizeSupportWeights}
                  className="bg-purple-500/20 hover:bg-purple-500/30 px-3 py-1 rounded text-purple-200 hover:text-white transition-colors text-xs font-medium"
                  title="Adjust all components proportionally to total exactly 100%"
                >
                  ⚖️ Normalize to 100%
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Component Details Dropdown */}
      {showDetails.stats && (
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
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onUpdateStatsWeight(component, e.target.value)}
                    className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onUpdateStatsWeight(component, e.target.value)}
                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm text-center"
                    placeholder="0-100"
                  />
                </div>
                <div className="text-xs text-green-200 mt-1">
                  {component === 'efficiency' && 'ANY/A, TD%, Completion% - core passing efficiency metrics'}
                  {component === 'protection' && 'Sack%, Combined Turnover Rate - pocket presence & ball security'}
                  {component === 'volume' && 'Pass/Rush yards, TDs, attempts - production & workload'}
                </div>
                
                {/* Individual component adjustment button */}
                <div className="mt-3">
                  <button
                    onClick={() => onShowDetails[component]()}
                    className={`w-full px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                      showDetails[component] 
                        ? 'bg-green-500/30 hover:bg-green-500/40 text-green-100 border border-green-400/50' 
                        : 'bg-green-500/20 hover:bg-green-500/30 text-green-200 hover:text-white border border-green-400/30 hover:border-green-400/50'
                    }`}
                  >
                    <span className="text-base">
                      {showDetails[component] ? '▼' : '▶'}
                    </span>
                    <span>
                      {showDetails[component] ? 'Hide Details' : 'Adjust Components'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-center space-y-2">
            <span className={`text-sm font-bold ${Object.values(statsWeights).reduce((sum, val) => sum + val, 0) === 100 ? 'text-green-400' : 'text-blue-400'}`}>
              Component Total: {Object.values(statsWeights).reduce((sum, val) => sum + val, 0)}%
            </span>
            {Object.values(statsWeights).reduce((sum, val) => sum + val, 0) !== 100 && (
              <div>
                <button
                  onClick={onNormalizeStatsWeights}
                  className="bg-green-500/20 hover:bg-green-500/30 px-3 py-1 rounded text-green-200 hover:text-white transition-colors text-xs font-medium"
                  title="Adjust all components proportionally to total exactly 100%"
                >
                  ⚖️ Normalize to 100%
                </button>
              </div>
            )}
          </div>
          
          {/* Efficiency Sub-Components - Only show when efficiency is expanded */}
          {showDetails.efficiency && (
            <div className="mt-6 bg-white/3 rounded-lg p-4 border border-green-400/20">
              <h5 className="text-green-200 font-medium mb-3 flex items-center">
                📈 Efficiency Sub-Components
                <span className="ml-2 text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded">
                  Advanced Tuning
                </span>
              </h5>
              <div className="text-xs text-green-200 mb-3">
                Control how much each efficiency metric contributes to the efficiency score.
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(efficiencyWeights).map(([component, value]) => (
                  <div key={component} className="bg-white/5 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-white font-medium text-sm">
                        {component === 'anyA' ? 'ANY/A' : 
                         component === 'tdPct' ? 'TD%' : 'Completion%'}
                      </label>
                      <span className="bg-green-500/30 text-green-100 px-2 py-1 rounded text-xs">
                        {value}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => onUpdateEfficiencyWeight(component, e.target.value)}
                        className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => onUpdateEfficiencyWeight(component, e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm text-center"
                        placeholder="0-100"
                      />
                    </div>
                    <div className="text-xs text-green-200 mt-1">
                      {component === 'anyA' && 'Adjusted Net Yards per Attempt - most comprehensive efficiency metric'}
                      {component === 'tdPct' && 'Touchdown percentage - red zone effectiveness'}
                      {component === 'completionPct' && 'Completion percentage - accuracy & decision making'}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 text-center space-y-2">
                <span className={`text-sm font-bold ${Object.values(efficiencyWeights).reduce((sum, val) => sum + val, 0) === 100 ? 'text-green-400' : 'text-blue-400'}`}>
                  Component Total: {Object.values(efficiencyWeights).reduce((sum, val) => sum + val, 0)}%
                </span>
                {Object.values(efficiencyWeights).reduce((sum, val) => sum + val, 0) !== 100 && (
                  <div>
                    <button
                      onClick={onNormalizeEfficiencyWeights}
                      className="bg-green-500/20 hover:bg-green-500/30 px-3 py-1 rounded text-green-200 hover:text-white transition-colors text-xs font-medium"
                      title="Adjust all components proportionally to total exactly 100%"
                    >
                      ⚖️ Normalize to 100%
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Protection Sub-Components - Only show when protection is expanded */}
          {showDetails.protection && (
            <div className="mt-6 bg-white/3 rounded-lg p-4 border border-green-400/20">
              <h5 className="text-green-200 font-medium mb-3 flex items-center">
                🛡️ Protection Sub-Components
                <span className="ml-2 text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded">
                  Advanced Tuning
                </span>
              </h5>
              <div className="text-xs text-green-200 mb-3">
                Control how much each protection metric contributes to the protection score.
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(protectionWeights).map(([component, value]) => (
                  <div key={component} className="bg-white/5 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-white font-medium text-sm">
                        {component === 'sackPct' ? 'Sack%' : 'Turnover Rate'}
                      </label>
                      <span className="bg-green-500/30 text-green-100 px-2 py-1 rounded text-xs">
                        {value}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => onUpdateProtectionWeight(component, e.target.value)}
                        className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => onUpdateProtectionWeight(component, e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm text-center"
                        placeholder="0-100"
                      />
                    </div>
                    <div className="text-xs text-green-200 mt-1">
                      {component === 'sackPct' && 'Pressure resistance & pocket presence'}
                      {component === 'turnoverRate' && 'Ball security (attempts per fumble+INT)'}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 text-center space-y-2">
                <span className={`text-sm font-bold ${Object.values(protectionWeights).reduce((sum, val) => sum + val, 0) === 100 ? 'text-green-400' : 'text-blue-400'}`}>
                  Component Total: {Object.values(protectionWeights).reduce((sum, val) => sum + val, 0)}%
                </span>
                {Object.values(protectionWeights).reduce((sum, val) => sum + val, 0) !== 100 && (
                  <div>
                    <button
                      onClick={onNormalizeProtectionWeights}
                      className="bg-green-500/20 hover:bg-green-500/30 px-3 py-1 rounded text-green-200 hover:text-white transition-colors text-xs font-medium"
                      title="Adjust all components proportionally to total exactly 100%"
                    >
                      ⚖️ Normalize to 100%
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Volume Sub-Components - Only show when volume is expanded */}
          {showDetails.volume && (
            <div className="mt-6 bg-white/3 rounded-lg p-4 border border-green-400/20">
              <h5 className="text-green-200 font-medium mb-3 flex items-center">
                📊 Volume Sub-Components
                <span className="ml-2 text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded">
                  Advanced Tuning
                </span>
              </h5>
              <div className="text-xs text-green-200 mb-3">
                Control how much each volume metric contributes to the volume score.
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(volumeWeights).map(([component, value]) => (
                  <div key={component} className="bg-white/5 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-white font-medium text-sm">
                        {component === 'passYards' ? 'Pass Yards' :
                         component === 'passTDs' ? 'Pass TDs' :
                         component === 'rushYards' ? 'Rush Yards' :
                         component === 'rushTDs' ? 'Rush TDs' :
                         component === 'totalAttempts' ? 'Total Attempts' :
                         component}
                      </label>
                      <span className="bg-green-500/30 text-green-100 px-2 py-1 rounded text-xs">
                        {value}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => onUpdateVolumeWeight(component, e.target.value)}
                        className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => onUpdateVolumeWeight(component, e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm text-center"
                        placeholder="0-100"
                      />
                    </div>
                    <div className="text-xs text-green-200 mt-1">
                      {component === 'passYards' && 'Passing yard production'}
                      {component === 'passTDs' && 'Passing touchdown production'}
                      {component === 'rushYards' && 'Rushing yard production (100+ threshold)'}
                      {component === 'rushTDs' && 'Rushing touchdown production (1+ threshold)'}
                      {component === 'totalAttempts' && 'Total workload (pass + rush attempts)'}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 text-center space-y-2">
                <span className={`text-sm font-bold ${Object.values(volumeWeights).reduce((sum, val) => sum + val, 0) === 100 ? 'text-green-400' : 'text-blue-400'}`}>
                  Component Total: {Object.values(volumeWeights).reduce((sum, val) => sum + val, 0)}%
                </span>
                {Object.values(volumeWeights).reduce((sum, val) => sum + val, 0) !== 100 && (
                  <div>
                    <button
                      onClick={onNormalizeVolumeWeights}
                      className="bg-green-500/20 hover:bg-green-500/30 px-3 py-1 rounded text-green-200 hover:text-white transition-colors text-xs font-medium"
                      title="Adjust all components proportionally to total exactly 100%"
                    >
                      ⚖️ Normalize to 100%
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Team Component Details Dropdown */}
      {showDetails.team && (
        <div className="mt-6 bg-white/5 rounded-lg p-4 border-2 border-yellow-500/30">
          <h4 className="text-white font-medium mb-3 flex items-center">
            🏆 Team Success Components
            <span className="ml-2 text-xs text-yellow-200 bg-yellow-500/20 px-2 py-1 rounded">
              Advanced Settings
            </span>
          </h4>
          <div className="text-xs text-blue-200 mb-4">
            Adjust how much each component affects the team success score. All components must sum to 100%.
            <br /><em>Note: QB availability/injury resilience is covered by the Durability slider.</em>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(teamWeights).map(([component, value]) => (
              <div key={component} className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-white font-medium text-sm capitalize">
                    {component === 'regularSeason' ? 'Regular Season' : 
                                           component === 'offenseDVOA' ? 'Offensive Output' : component}
                  </label>
                  <span className="bg-yellow-500/30 text-yellow-100 px-2 py-1 rounded text-xs">
                    {value}%
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onUpdateTeamWeight(component, e.target.value)}
                    disabled={!includePlayoffs && component === 'playoff'}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                      (!includePlayoffs && component === 'playoff')
                        ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                        : 'bg-yellow-200'
                    }`}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onUpdateTeamWeight(component, e.target.value)}
                    disabled={!includePlayoffs && component === 'playoff'}
                    className={`w-full px-2 py-1 border border-white/20 rounded text-sm text-center ${
                      (!includePlayoffs && component === 'playoff')
                        ? 'bg-gray-400/20 text-gray-400 cursor-not-allowed' 
                        : 'bg-white/10 text-white'
                    }`}
                    placeholder="0-100"
                  />
                </div>
                <div className="text-xs text-yellow-200 mt-1">
                  {component === 'regularSeason' && 'Win-loss record, regular season success'}
                  {component === 'offenseDVOA' && 'Team offensive performance - measuring overall offensive success and efficiency'}
                  {component === 'playoff' && 'Playoff wins, deep runs, Super Bowl appearances'}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-center space-y-2">
            <span className={`text-sm font-bold ${Object.values(teamWeights).reduce((sum, val) => sum + val, 0) === 100 ? 'text-green-400' : 'text-blue-400'}`}>
              Component Total: {Object.values(teamWeights).reduce((sum, val) => sum + val, 0)}%
            </span>
            {!includePlayoffs && (
              <div className="text-xs text-orange-300 mt-1">
                ⚠️ Playoff component disabled - only Regular Season will be scored
              </div>
            )}
            {Object.values(teamWeights).reduce((sum, val) => sum + val, 0) !== 100 && (
              <div>
                <button
                  onClick={onNormalizeTeamWeights}
                  className="bg-yellow-500/20 hover:bg-yellow-500/30 px-3 py-1 rounded text-yellow-200 hover:text-white transition-colors text-xs font-medium"
                  title="Adjust all components proportionally to total exactly 100%"
                >
                  ⚖️ Normalize to 100%
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clutch Component Details Dropdown */}
      {showDetails.clutch && (
        <div className="mt-6 bg-white/5 rounded-lg p-4 border-2 border-red-500/30">
          <h4 className="text-white font-medium mb-3 flex items-center">
            💎 Clutch Performance Components
            <span className="ml-2 text-xs text-red-200 bg-red-500/20 px-2 py-1 rounded">
              Advanced Settings
            </span>
          </h4>
          <div className="text-xs text-blue-200 mb-4">
            Adjust how much each component affects the clutch performance score. All components must sum to 100%.
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(clutchWeights).map(([component, value]) => (
              <div key={component} className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-white font-medium text-sm">
                    {component === 'gameWinningDrives' ? 'Game Winning Drives' :
                     component === 'fourthQuarterComebacks' ? '4th Quarter Comebacks' :
                     component === 'clutchRate' ? 'Clutch Rate' :
                     component === 'playoffBonus' ? 'Playoff Bonus' : component}
                  </label>
                  <span className="bg-red-500/30 text-red-100 px-2 py-1 rounded text-xs">
                    {value}%
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onUpdateClutchWeight(component, e.target.value)}
                    disabled={!includePlayoffs && component === 'playoffBonus'}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                      (!includePlayoffs && component === 'playoffBonus')
                        ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                        : 'bg-red-200'
                    }`}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onUpdateClutchWeight(component, e.target.value)}
                    disabled={!includePlayoffs && component === 'playoffBonus'}
                    className={`w-full px-2 py-1 border border-white/20 rounded text-sm text-center ${
                      (!includePlayoffs && component === 'playoffBonus')
                        ? 'bg-gray-400/20 text-gray-400 cursor-not-allowed' 
                        : 'bg-white/10 text-white'
                    }`}
                    placeholder="0-100"
                  />
                </div>
                <div className="text-xs text-red-200 mt-1">
                  {component === 'gameWinningDrives' && 'Drives that directly lead to game-winning scores'}
                  {component === 'fourthQuarterComebacks' && 'Successful comebacks initiated in 4th quarter'}
                  {component === 'clutchRate' && 'Combined GWD and 4QC opportunities per game'}
                  {component === 'playoffBonus' && 'Additional points for playoff clutch performance'}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-center space-y-2">
            <span className={`text-sm font-bold ${Object.values(clutchWeights).reduce((sum, val) => sum + val, 0) === 100 ? 'text-green-400' : 'text-blue-400'}`}>
              Component Total: {Object.values(clutchWeights).reduce((sum, val) => sum + val, 0)}%
            </span>
            {!includePlayoffs && (
              <div className="text-xs text-orange-300 mt-1">
                ⚠️ Playoff Bonus component disabled - only regular season clutch will be scored
              </div>
            )}
            {Object.values(clutchWeights).reduce((sum, val) => sum + val, 0) !== 100 && (
              <div>
                <button
                  onClick={onNormalizeClutchWeights}
                  className="bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded text-red-200 hover:text-white transition-colors text-xs font-medium"
                  title="Adjust all components proportionally to total exactly 100%"
                >
                  ⚖️ Normalize to 100%
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Durability Component Details Dropdown */}
      {showDetails.durability && (
        <div className="mt-6 bg-white/5 rounded-lg p-4 border-2 border-orange-500/30">
          <h4 className="text-white font-medium mb-3 flex items-center">
            ⚡ Durability Components
            <span className="ml-2 text-xs text-orange-200 bg-orange-500/20 px-2 py-1 rounded">
              Advanced Settings
            </span>
          </h4>
          <div className="text-xs text-blue-200 mb-4">
            Adjust how much each component affects the durability score. All components must sum to 100%.
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(durabilityWeights).map(([component, value]) => (
              <div key={component} className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-white font-medium text-sm capitalize">
                    {component === 'availability' ? 'Season Availability' : 'Multi-Year Consistency'}
                  </label>
                  <span className="bg-orange-500/30 text-orange-100 px-2 py-1 rounded text-xs">
                    {value}%
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onUpdateDurabilityWeight(component, e.target.value)}
                    className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onUpdateDurabilityWeight(component, e.target.value)}
                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm text-center"
                    placeholder="0-100"
                  />
                </div>
                <div className="text-xs text-orange-200 mt-1">
                  {component === 'availability' && 'Weighted average games started across all seasons'}
                  {component === 'consistency' && 'Bonus points for sustained availability and longevity'}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-center space-y-2">
            <span className={`text-sm font-bold ${Object.values(durabilityWeights).reduce((sum, val) => sum + val, 0) === 100 ? 'text-green-400' : 'text-blue-400'}`}>
              Component Total: {Object.values(durabilityWeights).reduce((sum, val) => sum + val, 0)}%
            </span>
            {Object.values(durabilityWeights).reduce((sum, val) => sum + val, 0) !== 100 && (
              <div>
                <button
                  onClick={onNormalizeDurabilityWeights}
                  className="bg-orange-500/20 hover:bg-orange-500/30 px-3 py-1 rounded text-orange-200 hover:text-white transition-colors text-xs font-medium"
                  title="Adjust all components proportionally to total exactly 100%"
                >
                  ⚖️ Normalize to 100%
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

WeightControls.displayName = 'WeightControls';

export default WeightControls; 