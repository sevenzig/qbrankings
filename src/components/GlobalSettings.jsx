import React, { memo } from 'react';

const GlobalSettings = memo(({ 
  includePlayoffs, 
  onIncludePlayoffsChange, 
  include2024Only, 
  onInclude2024OnlyChange 
}) => {
  return (
    <div className="mb-6">
      {/* Global Toggles - Side by Side */}
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

          {/* 2024-Only Toggle */}
          <div className="flex items-center justify-between flex-1">
            <div>
              <h4 className="text-white font-medium text-lg flex items-center">
                📅 Include 2024 Only
                <span className="ml-2 text-xs text-orange-200 bg-orange-500/20 px-2 py-1 rounded">
                  Global Setting
                </span>
              </h4>
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
    </div>
  );
});

GlobalSettings.displayName = 'GlobalSettings';

export default GlobalSettings; 