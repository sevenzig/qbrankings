import React, { memo } from 'react';

const GlobalSettings = memo(({ 
  includePlayoffs, 
  onIncludePlayoffsChange, 
  include2024Only, 
  onInclude2024OnlyChange 
}) => {
  return (
    <div className="mb-6 space-y-4">
      {/* Global Playoff Toggle */}
      <div className="bg-white/5 rounded-lg p-4 border-2 border-yellow-500/30">
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
              onChange={(e) => onIncludePlayoffsChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-500"></div>
          </label>
        </div>
      </div>

      {/* Global 2024-Only Toggle */}
      <div className="bg-white/5 rounded-lg p-4 border-2 border-orange-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium text-lg flex items-center">
              📅 Include 2024 Only
              <span className="ml-2 text-xs text-orange-200 bg-orange-500/20 px-2 py-1 rounded">
                Global Setting
              </span>
            </h4>
            <div className="text-sm text-orange-200 mt-1">
              When enabled: Only uses 2024 data with focused analysis
              <br />
              When disabled: Uses 3-year data (2022-2024) with year-based weightings
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={include2024Only}
              onChange={(e) => onInclude2024OnlyChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
          </label>
        </div>
      </div>
    </div>
  );
});

GlobalSettings.displayName = 'GlobalSettings';

export default GlobalSettings; 