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
        <div className={`rounded-xl p-6 h-full flex flex-col backdrop-blur-lg border transition-all duration-300 ${
          disabled 
            ? 'bg-slate-900/50 opacity-40 border-slate-800/50' 
            : 'bg-slate-800/90 border-slate-700/50 hover:bg-slate-800/80 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)]'
        }`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <label className={`font-semibold capitalize text-base tracking-wide ${
            disabled ? 'text-slate-400' : 'text-white'
          }`}>
            {category}
          </label>
          <span className={`px-3 py-1.5 rounded-lg text-sm font-bold tabular-nums transition-all duration-300 ${
            disabled 
              ? 'bg-slate-500/30 text-white' 
              : 'bg-accent-500/30 text-white'
          }`}>
            {value}%
          </span>
        </div>
        
        {/* Sliders and Manual Input */}
        <div className="flex gap-3 items-center mb-4">
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onUpdateWeight(category, e.target.value)}
            disabled={disabled}
            className={`w-full h-3 rounded-lg transition-all duration-300 ${
              disabled 
                ? 'cursor-not-allowed opacity-50' 
                : 'cursor-pointer hover:shadow-glow-blue-sm focus:shadow-glow-blue'
            }`}
            style={{
              background: disabled 
                ? 'linear-gradient(to right, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%)' 
                : `linear-gradient(to right, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.4) ${value}%, rgba(15, 23, 42, 0.4) ${value}%, rgba(15, 23, 42, 0.4) 100%)`
            }}
          />
          <input
            type="number"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onUpdateWeight(category, e.target.value)}
            disabled={disabled}
            className={`w-20 px-3 py-2 border rounded-lg text-sm text-center font-mono tabular-nums transition-all duration-300 ${
              disabled 
                ? 'bg-slate-900/40 border-slate-800/50 text-slate-500 cursor-not-allowed' 
                : 'bg-slate-900/80 border-slate-700/50 text-slate-50 hover:bg-slate-800/90 focus:shadow-[0_0_10px_rgba(59,130,246,0.3)]'
            }`}
            placeholder="0-100"
          />
        </div>
        
        {/* Description */}
        <div className={`text-sm mb-4 flex-grow font-light leading-relaxed ${
          disabled ? 'text-slate-400' : 'text-slate-300'
        }`}>
          {description}
        </div>
        
        {/* Adjust Components Button */}
        <div className="mt-auto pt-3">
          {onShowDetails ? (
            <button
              onClick={() => onShowDetails(!showDetails)}
              disabled={disabled}
              className={`w-full px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                disabled 
                  ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20 cursor-not-allowed'
                  : showDetails 
                    ? 'bg-accent-500/30 hover:bg-accent-500/40 text-accent-100 border border-accent-400/50 hover:shadow-glow-blue-sm' 
                    : 'bg-glass-light hover:bg-glass-medium text-slate-200 hover:text-white border border-glass-border hover:border-accent-400/30 hover:shadow-glow-blue-sm'
              }`}
            >
              <span className="text-lg">
                {showDetails ? '▼' : '▶'}
              </span>
              <span>
                {showDetails ? 'Hide' : 'Details'}
              </span>
            </button>
          ) : (
            <div className="w-full px-4 py-3 rounded-lg bg-slate-500/10 text-slate-400 text-sm text-center border border-slate-500/20 font-light">
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