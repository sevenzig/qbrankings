import React, { memo } from 'react';

const WeightSlider = memo(({ 
  category, 
  value, 
  onUpdateWeight, 
  onShowDetails, 
  showDetails, 
  description 
}) => {
  return (
    <div className="h-full">
      <div className="bg-white/5 rounded-lg p-4 h-full flex flex-col justify-between min-h-[200px]">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <label className="text-white font-medium capitalize">{category}</label>
          <span className="bg-green-500/30 text-green-100 px-2 py-1 rounded text-sm font-semibold">
            {value}%
          </span>
        </div>
        
        {/* Sliders */}
        <div className="space-y-3 mb-3">
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onUpdateWeight(category, e.target.value)}
            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
          />
          <input
            type="number"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onUpdateWeight(category, e.target.value)}
            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm text-center"
            placeholder="0-100"
          />
        </div>
        
        {/* Description */}
        <div className="text-xs text-blue-200 mb-3 flex-1">
          {description}
        </div>
        
        {/* Adjust Components Button - Anchored to Bottom */}
        <div className="mt-auto">
          {onShowDetails ? (
            <button
              onClick={() => onShowDetails(!showDetails)}
              className={`w-full px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                showDetails 
                  ? 'bg-blue-500/30 hover:bg-blue-500/40 text-blue-100 border border-blue-400/50' 
                  : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 hover:text-white border border-blue-400/30 hover:border-blue-400/50'
              }`}
            >
              <span className="text-base">
                {showDetails ? '▼' : '▶'}
              </span>
              <span>
                {showDetails ? 'Hide Details' : 'Adjust Components'}
              </span>
            </button>
          ) : (
            <div className="w-full px-3 py-2 rounded-lg bg-gray-500/10 text-gray-400 text-sm text-center border border-gray-500/20">
              No sub-components
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

WeightSlider.displayName = 'WeightSlider';

export default WeightSlider; 