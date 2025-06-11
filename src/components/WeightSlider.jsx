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
    <div className="space-y-4">
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-white font-medium capitalize">{category}</label>
          <span className="bg-green-500/30 text-green-100 px-2 py-1 rounded text-sm">
            {value}%
          </span>
        </div>
        <div className="space-y-2">
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
            value={value}
            onChange={(e) => onUpdateWeight(category, e.target.value)}
            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm text-center"
            placeholder="0+"
          />
        </div>
        <div className="text-xs text-blue-200 mt-1">
          <div>{description}</div>
          {onShowDetails && (
            <button
              onClick={() => onShowDetails(!showDetails)}
              className="mt-1 text-blue-300 hover:text-blue-100 underline text-xs"
            >
              {showDetails ? '▼ Hide Details' : '▶ Adjust Components'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

WeightSlider.displayName = 'WeightSlider';

export default WeightSlider; 