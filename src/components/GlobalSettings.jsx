import React, { memo, useState, useRef, useEffect } from 'react';

const GlobalSettings = memo(({ 
  includePlayoffs, 
  onIncludePlayoffsChange, 
  yearMode, 
  onYearModeChange,
  onForceRefresh
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const years = ['2020', '2021', '2022', '2023', '2024', '2025'];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
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

          {/* Refresh Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={onForceRefresh}
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 rounded-lg text-blue-200 font-medium transition-colors flex items-center gap-2"
              title="Force refresh QB data to reindex with new thresholds"
            >
              🔄 Refresh Data
            </button>
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
            <div className="ml-4 relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="px-3 py-2 bg-blue-900/30 border border-blue-400/10 rounded-md text-blue-100 font-medium cursor-pointer hover:bg-blue-800/40 hover:border-blue-400/20 transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 flex items-center gap-2"
              >
                <span>{yearMode}</span>
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-blue-900 border border-blue-400/20 rounded-md shadow-lg z-50">
                  {years.map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => {
                        onYearModeChange(year);
                        setIsOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-blue-100 hover:bg-blue-800/40 transition-colors first:rounded-t-md last:rounded-b-md ${
                        year === yearMode ? 'bg-blue-800/60' : ''
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

GlobalSettings.displayName = 'GlobalSettings';

export default GlobalSettings; 