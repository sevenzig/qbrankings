import React, { memo, useState, useRef, useEffect } from 'react';

const GlobalSettings = memo(({ 
  yearMode, 
  onYearModeChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const years = Array.from({ length: 26 }, (_, i) => (2000 + i).toString()).reverse();

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
    <div className="relative" ref={dropdownRef}>
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