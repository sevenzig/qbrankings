import React, { memo, useState, useRef, useEffect } from 'react';

const GlobalSettings = memo(({ 
  yearMode, 
  onYearModeChange,
  // New props for filtering
  showFilterControls = false,
  filterSettings = { minAttempts: 15, minGames: 2 },
  onFilterSettingsChange = () => {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Generate years from 1932 to 2025 (94 years total)
  const years = Array.from({ length: 94 }, (_, i) => (1932 + i).toString()).reverse();

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside the entire GlobalSettings component
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleYearIncrement = () => {
    const currentYear = parseInt(yearMode);
    const newYear = Math.min(currentYear + 1, 2025);
    onYearModeChange(newYear.toString());
  };

  const handleYearDecrement = () => {
    const currentYear = parseInt(yearMode);
    const newYear = Math.max(currentYear - 1, 1932);
    onYearModeChange(newYear.toString());
  };

  const handleFilterChange = (field, value) => {
    const numValue = parseInt(value) || 0;
    let validatedValue = Math.max(0, numValue);
    
    // Apply constraints
    if (field === 'minAttempts') {
      validatedValue = Math.min(100, Math.max(15, validatedValue));
    } else if (field === 'minGames') {
      validatedValue = Math.min(8, Math.max(2, validatedValue));
    }
    
    onFilterSettingsChange({
      ...filterSettings,
      [field]: validatedValue
    });
  };

  const toggleFilter = () => {
    setIsFilterOpen(prev => !prev);
    if (!isFilterOpen) {
      setIsOpen(false); // Close year dropdown when opening filter
    }
  };

  const toggleYearDropdown = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setIsFilterOpen(false); // Close filter dropdown when opening year
    }
  };

  return (
    <div className="flex items-center gap-4" ref={dropdownRef}>
      {/* Filter Controls */}
      {showFilterControls && (
        <div className="relative">
          <button
            type="button"
            onClick={toggleFilter}
            className="px-4 py-2 bg-glass-medium border border-glass-border rounded-lg text-slate-200 font-medium cursor-pointer hover:bg-glass-strong hover:border-accent-400/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent-400/50 focus:border-accent-400/50 flex items-center gap-2 backdrop-blur-lg hover:shadow-glow-blue-sm"
            title="Filter QBs by attempts and games started"
          >
            <span>🔍 Filter</span>
            <svg className={`w-4 h-4 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isFilterOpen && (
            <div className="absolute top-full left-0 mt-2 bg-slate-900/95 border border-glass-border rounded-xl shadow-glass-sm z-50 p-6 min-w-80 backdrop-blur-xl">
              <h4 className="text-white font-semibold mb-4 text-lg">📊 QB Filter Settings</h4>
              <p className="text-slate-300 text-sm mb-6 font-light">
                Filter QBs by attempts and games started for {yearMode} season
              </p>
              
              <div className="space-y-4">
                {/* Minimum Attempts */}
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Minimum Passing Attempts</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={filterSettings.minAttempts}
                      onChange={(e) => handleFilterChange('minAttempts', e.target.value)}
                      className="w-24 px-3 py-2 bg-slate-800/80 border border-glass-border rounded-lg text-white text-sm font-mono tabular-nums focus:shadow-glow-blue-sm focus:border-accent-400/50 transition-all duration-300"
                      min="15"
                      max="100"
                    />
                    <span className="text-slate-400 text-sm font-light">(15-100)</span>
                  </div>
                </div>

                {/* Minimum Games Started */}
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Minimum Games Started</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={filterSettings.minGames}
                      onChange={(e) => handleFilterChange('minGames', e.target.value)}
                      className="w-24 px-3 py-2 bg-slate-800/80 border border-glass-border rounded-lg text-white text-sm font-mono tabular-nums focus:shadow-glow-blue-sm focus:border-accent-400/50 transition-all duration-300"
                      min="2"
                      max="8"
                    />
                    <span className="text-slate-400 text-sm font-light">(2-8)</span>
                  </div>
                </div>

                {/* Reset Button */}
                <button
                  type="button"
                  onClick={() => onFilterSettingsChange({ minAttempts: 15, minGames: 2 })}
                  className="w-full px-4 py-3 bg-slate-800/80 hover:bg-slate-800/90 border border-glass-border rounded-lg text-white text-sm font-medium transition-all duration-300 hover:shadow-glow-blue-sm"
                >
                  🔄 Reset to Default
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Year Selector */}
      <div className="relative">
        <div className="flex">
          {/* Decrement button */}
          <button
            type="button"
            onClick={handleYearDecrement}
            disabled={parseInt(yearMode) <= 1932}
            className="px-3 py-2 bg-glass-medium border border-glass-border rounded-l-lg text-slate-200 font-bold cursor-pointer hover:bg-glass-strong hover:border-accent-400/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent-400/50 focus:border-accent-400/50 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-lg hover:shadow-glow-blue-sm"
            title="Previous year"
          >
            -
          </button>
          
          {/* Main dropdown button */}
          <button
            type="button"
            onClick={toggleYearDropdown}
            className="px-4 py-2 bg-glass-medium border-t border-b border-glass-border text-slate-200 font-medium cursor-pointer hover:bg-glass-strong hover:border-accent-400/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent-400/50 focus:border-accent-400/50 flex items-center gap-2 backdrop-blur-lg hover:shadow-glow-blue-sm"
          >
            <span className="font-semibold tabular-nums">{yearMode}</span>
            <svg className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Increment button */}
          <button
            type="button"
            onClick={handleYearIncrement}
            disabled={parseInt(yearMode) >= 2025}
            className="px-3 py-2 bg-glass-medium border border-glass-border rounded-r-lg text-slate-200 font-bold cursor-pointer hover:bg-glass-strong hover:border-accent-400/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent-400/50 focus:border-accent-400/50 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-lg hover:shadow-glow-blue-sm"
            title="Next year"
          >
            +
          </button>
        </div>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border border-glass-border rounded-xl shadow-glass-sm z-50 max-h-64 overflow-y-auto backdrop-blur-xl">
            {years.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => {
                  onYearModeChange(year);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left text-slate-200 hover:bg-glass-strong transition-all duration-300 first:rounded-t-xl last:rounded-b-xl font-medium tabular-nums ${
                  year === yearMode ? 'bg-accent-500/20 text-accent-100' : ''
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>

      
    </div>
  );
});

GlobalSettings.displayName = 'GlobalSettings';

export default GlobalSettings; 