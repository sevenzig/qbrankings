import React, { memo } from 'react';

const GlobalSettings = memo(({ 
  includePlayoffs, 
  onIncludePlayoffsChange, 
  yearMode, 
  onYearModeChange 
}) => {
  return (
    <div className="mb-6">
      {/* Global Settings - Side by Side */}
      <div className="bg-white/5 rounded-lg p-4 border-2 border-yellow-500/30">
        <div className="flex items-center justify-between gap-6">
          {/* Playoff Toggle */}
          <div className="flex items-center justify-between flex-1">
            <div>
              <h4 className="text-white font-medium text-lg flex items-center">
                🏆 Include Playoff Performance
                <span className="ml-2 text-xs text-yellow-200 bg-yellow-500/20 px-2 py-1 rounded">
                  Global Setting
                </span>
              </h4>
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

          {/* Divider */}
          <div className="w-px h-12 bg-white/20"></div>

          {/* Year Mode Selector */}
          <div className="flex items-center justify-between flex-1">
            <div>
              <h4 className="text-white font-medium text-lg flex items-center">
                📅 Season Mode
                <span className="ml-2 text-xs text-orange-200 bg-orange-500/20 px-2 py-1 rounded">
                  Global Setting
                </span>
              </h4>
            </div>
            <select
              value={yearMode}
              onChange={(e) => onYearModeChange(e.target.value)}
              className="ml-4 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-medium cursor-pointer hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="2022" className="bg-gray-800">2022</option>
              <option value="2023" className="bg-gray-800">2023</option>
              <option value="2024" className="bg-gray-800">2024</option>
              <option value="2025" className="bg-gray-800">2025</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
});

GlobalSettings.displayName = 'GlobalSettings';

export default GlobalSettings; 