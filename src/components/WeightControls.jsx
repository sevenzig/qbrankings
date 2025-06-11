import React, { memo } from 'react';
import WeightSlider from './WeightSlider.jsx';

const WeightControls = memo(({ 
  weights, 
  onUpdateWeight, 
  onNormalizeWeights,
  showDetails,
  onShowDetails
}) => {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const weightDescriptions = {
    team: 'Win-loss record, playoff success (NEW: Round-specific weighting)',
    stats: 'ANY/A, success rate, production (NEW: Playoff stat bonuses)',
    clutch: 'Game-winning drives, 4QC (NEW: Round-specific multipliers)',
    durability: 'Games started, consistency',
    support: 'Extra credit for poor supporting cast'
  };

  return (
    <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-5 md:gap-4">
      {Object.entries(weights).map(([category, value]) => (
        <WeightSlider
          key={category}
          category={category}
          value={value}
          onUpdateWeight={onUpdateWeight}
          onShowDetails={category === 'team' ? () => onShowDetails.team(!showDetails.team) :
                        category === 'stats' ? () => onShowDetails.stats(!showDetails.stats) :
                        category === 'clutch' ? () => onShowDetails.clutch(!showDetails.clutch) :
                        category === 'durability' ? () => onShowDetails.durability(!showDetails.durability) :
                        category === 'support' ? () => onShowDetails.support(!showDetails.support) :
                        null}
          showDetails={showDetails[category]}
          description={weightDescriptions[category]}
        />
      ))}
      
      <div className="md:col-span-5 mt-4 text-center space-y-2">
        <span className={`text-lg font-bold ${totalWeight === 100 ? 'text-green-400' : 'text-red-400'}`}>
          Total Weight: {totalWeight}%
        </span>
        {totalWeight !== 100 && (
          <div>
            <button
              onClick={onNormalizeWeights}
              className="bg-blue-500/20 hover:bg-blue-500/30 px-4 py-2 rounded-lg text-blue-200 hover:text-white transition-colors text-sm font-medium"
              title="Adjust all weights proportionally to total exactly 100%"
            >
              ⚖️ Normalize to 100%
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

WeightControls.displayName = 'WeightControls';

export default WeightControls; 