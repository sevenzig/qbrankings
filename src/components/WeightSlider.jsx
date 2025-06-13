import React, { memo } from 'react';

const WeightSlider = memo(({ 
  category, 
  value, 
  onUpdateWeight, 
  onShowDetails, 
  showDetails, 
  description,
  disabled = false
}) => {
  return (
    <div className="h-full">
      <div className={`rounded-lg p-4 h-full flex flex-col ${disabled ? 'bg-gray-500/10 opacity-60' : 'bg-white/5'}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <label className={`font-medium capitalize text-sm ${disabled ? 'text-gray-400' : 'text-white'}`}>{category}</label>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${disabled ? 'bg-gray-500/30 text-gray-300' : 'bg-green-500/30 text-green-100'}`}>
            {value}%
          </span>
        </div>
        
        {/* Sliders and Manual Input - now in a flex container */}
        <div className="flex gap-2 items-center mb-2">
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onUpdateWeight(category, e.target.value)}
            disabled={disabled}
            className={`w-full h-2 rounded-lg ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} slider-active slider-blue`}
            style={{
              background: disabled ? 'linear-gradient(to right, #6B7280 0%, #6B7280 100%)' : 'linear-gradient(to right, #BFDBFE 0%, #BFDBFE 100%)'
            }}
          />
          <input
            type="number"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onUpdateWeight(category, e.target.value)}
            disabled={disabled}
            className={`w-16 px-2 py-1 border rounded text-xs text-center ${
              disabled 
                ? 'bg-gray-500/10 border-gray-500/30 text-gray-400 cursor-not-allowed' 
                : 'bg-white/10 border-white/20 text-white'
            }`}
            placeholder="0-100"
          />
        </div>
        
        {/* Description */}
        <div className={`text-xs mb-3 flex-grow line-clamp-2 ${disabled ? 'text-gray-400' : 'text-blue-200'}`}>
          {description}
        </div>
        
        {/* Adjust Components Button - Anchored to Bottom */}
        <div className="mt-auto pt-2">
          {onShowDetails ? (
            <button
              onClick={() => onShowDetails(!showDetails)}
              disabled={disabled}
              className={`w-full px-2 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1 ${
                disabled 
                  ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20 cursor-not-allowed'
                  : showDetails 
                    ? 'bg-blue-500/30 hover:bg-blue-500/40 text-blue-100 border border-blue-400/50' 
                    : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 hover:text-white border border-blue-400/30 hover:border-blue-400/50'
              }`}
            >
              <span className="text-sm">
                {showDetails ? '▼' : '▶'}
              </span>
              <span>
                {showDetails ? 'Hide' : 'Details'}
              </span>
            </button>
          ) : (
            <div className="w-full px-2 py-1.5 rounded-lg bg-gray-500/10 text-gray-400 text-xs text-center border border-gray-500/20">
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