import React, { memo, useState, useRef, useEffect } from 'react';

const GlobalSettings = memo(({ 
  yearMode, 
  onYearModeChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Generate years from 1932 to 2025 (94 years total)
  const years = Array.from({ length: 94 }, (_, i) => (1932 + i).toString()).reverse();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
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

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center">
        {/* Decrement button */}
        <button
          type="button"
          onClick={handleYearDecrement}
          disabled={parseInt(yearMode) <= 1932}
          className="px-2 py-2 bg-blue-900/30 border border-blue-400/10 rounded-l-md text-blue-100 font-bold cursor-pointer hover:bg-blue-800/40 hover:border-blue-400/20 transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous year"
        >
          -
        </button>
        
        {/* Main dropdown button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-2 bg-blue-900/30 border-t border-b border-blue-400/10 text-blue-100 font-medium cursor-pointer hover:bg-blue-800/40 hover:border-blue-400/20 transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 flex items-center gap-2"
        >
          <span>{yearMode}</span>
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Increment button */}
        <button
          type="button"
          onClick={handleYearIncrement}
          disabled={parseInt(yearMode) >= 2025}
          className="px-2 py-2 bg-blue-900/30 border border-blue-400/10 rounded-r-md text-blue-100 font-bold cursor-pointer hover:bg-blue-800/40 hover:border-blue-400/20 transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next year"
        >
          +
        </button>
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-blue-900 border border-blue-400/20 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
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
  );
});

GlobalSettings.displayName = 'GlobalSettings';

export default GlobalSettings; 