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
      <div className="bg-white/5 rounded-lg p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <label className="text-white font-medium capitalize text-sm">{category}</label>
          <span className="bg-green-500/30 text-green-100 px-2 py-1 rounded text-xs font-semibold">
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
            className="w-full h-2 rounded-lg cursor-pointer slider-active slider-blue"
            style={{
              background: 'linear-gradient(to right, #BFDBFE 0%, #BFDBFE 100%)'
            }}
          />
          <input
            type="number"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onUpdateWeight(category, e.target.value)}
            className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs text-center"
            placeholder="0-100"
          />
        </div>
        
        {/* Description */}
        <div className="text-xs text-blue-200 mb-3 flex-grow line-clamp-2">
          {description}
        </div>
        
        {/* Adjust Components Button - Anchored to Bottom */}
        <div className="mt-auto pt-2">
          {onShowDetails ? (
            <button
              onClick={() => onShowDetails(!showDetails)}
              className={`w-full px-2 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1 ${
                showDetails 
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