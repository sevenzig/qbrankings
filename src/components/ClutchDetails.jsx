/**
 * ClutchDetails - Display clutch performance breakdown
 * 
 * Shows category-by-category clutch performance with metrics and comparisons
 * Integrates with the new split-based clutch scoring system
 */

import React, { memo, useState, useCallback } from 'react';
import { 
  getClutchCategoryKeys, 
  getClutchCategoryWeights,
  getClutchCategoryDescriptions 
} from '../utils/clutchCategories.js';
import { 
  getMetricDisplayInfo,
  getPerformanceTier 
} from '../utils/clutchMetricsCalculator.js';

const ClutchDetails = memo(({ 
  qbData, 
  categoryPerformances = {}, 
  allQBCategoryStats = {},
  isVisible = false 
}) => {
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  
  const categoryKeys = getClutchCategoryKeys();
  const categoryWeights = getClutchCategoryWeights();
  const categoryDescriptions = getClutchCategoryDescriptions();

  const toggleCategory = useCallback((categoryKey) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  }, []);

  if (!isVisible || !qbData) {
    return null;
  }

  const getCategoryComparison = (categoryKey) => {
    const allQBStats = allQBCategoryStats[categoryKey] || [];
    if (allQBStats.length === 0) return null;

    // Calculate league averages
    const avgAttempts = allQBStats.reduce((sum, qb) => sum + (qb.totalAttempts || 0), 0) / allQBStats.length;
    const avgAnyA = allQBStats.reduce((sum, qb) => sum + (qb.anyPerAttempt || 0), 0) / allQBStats.length;
    const avgTDRate = allQBStats.reduce((sum, qb) => sum + (qb.touchdownRate || 0), 0) / allQBStats.length;
    const avgSackRate = allQBStats.reduce((sum, qb) => sum + (qb.sackRate || 0), 0) / allQBStats.length;
    const avgTurnoverRate = allQBStats.reduce((sum, qb) => sum + (qb.turnoverRate || 0), 0) / allQBStats.length;

    return {
      avgAttempts: Math.round(avgAttempts),
      avgAnyA: avgAnyA.toFixed(2),
      avgTDRate: (avgTDRate * 100).toFixed(1),
      avgSackRate: (avgSackRate * 100).toFixed(1),
      avgTurnoverRate: (avgTurnoverRate * 100).toFixed(1)
    };
  };

  const formatMetricValue = (metricName, value) => {
    const displayInfo = getMetricDisplayInfo(metricName);
    return displayInfo.format(value);
  };

  const getMetricComparison = (metricName, value, leagueAvg) => {
    if (!leagueAvg) return null;
    
    const displayInfo = getMetricDisplayInfo(metricName);
    const isInverted = !displayInfo.higherIsBetter;
    
    if (isInverted) {
      return value < leagueAvg ? 'better' : value > leagueAvg ? 'worse' : 'same';
    } else {
      return value > leagueAvg ? 'better' : value < leagueAvg ? 'worse' : 'same';
    }
  };

  return (
    <div className="bg-gray-500/10 rounded-lg p-4 border border-gray-500/30">
      <h4 className="text-gray-400 font-medium mb-4 flex items-center">
        💎 Clutch Performance Breakdown
        <span className="ml-2 text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded">
          New System
        </span>
      </h4>

      <div className="space-y-3">
        {categoryKeys.map(categoryKey => {
          const performance = categoryPerformances[categoryKey];
          const isExpanded = expandedCategories.has(categoryKey);
          const comparison = getCategoryComparison(categoryKey);
          const weight = categoryWeights[categoryKey] || 0;
          const description = categoryDescriptions[categoryKey] || '';

          if (!performance || !performance.hasData) {
            return (
              <div key={categoryKey} className="bg-gray-600/20 rounded-lg p-3 border border-gray-600/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium text-sm">
                      {categoryKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                    <div className="text-gray-400 text-xs mt-1">{description}</div>
                  </div>
                  <div className="text-gray-500 text-xs">
                    No Data
                  </div>
                </div>
              </div>
            );
          }

          const tier = getPerformanceTier(performance.normalizedScore);
          const zScore = performance.zScore || 0;

          return (
            <div key={categoryKey} className="bg-white/5 rounded-lg border border-gray-500/30">
              <button
                onClick={() => toggleCategory(categoryKey)}
                className="w-full p-3 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-white font-medium text-sm">
                        {categoryKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                      <div className="text-xs text-gray-400">
                        ({Math.round(weight * 100)}% weight)
                      </div>
                    </div>
                    <div className="text-gray-400 text-xs mt-1">{description}</div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        tier.color === 'green' ? 'bg-green-500/20 text-green-300' :
                        tier.color === 'blue' ? 'bg-blue-500/20 text-blue-300' :
                        tier.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-300' :
                        tier.color === 'orange' ? 'bg-orange-500/20 text-orange-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {tier.tier}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {performance.totalAttempts} attempts
                      </div>
                      <div className="text-gray-400 text-xs">
                        Z-Score: {zScore.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-500/30">
                  <div className="mt-3 space-y-3">
                    <div className="text-white font-medium text-sm">Key Metrics:</div>
                    
                    {Object.entries(performance.metrics).map(([metricName, value]) => {
                      const displayInfo = getMetricDisplayInfo(metricName);
                      const formattedValue = displayInfo.format(value);
                      const comparison = comparison ? getMetricComparison(metricName, value, comparison[`avg${metricName.charAt(0).toUpperCase() + metricName.slice(1)}`]) : null;
                      
                      return (
                        <div key={metricName} className="flex items-center justify-between text-sm">
                          <div className="text-gray-300">
                            {displayInfo.name}: {formattedValue}
                          </div>
                          {comparison && (
                            <div className={`text-xs px-2 py-1 rounded ${
                              comparison === 'better' ? 'bg-green-500/20 text-green-300' :
                              comparison === 'worse' ? 'bg-red-500/20 text-red-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {comparison === 'better' ? '↑' : comparison === 'worse' ? '↓' : '='} vs league
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {comparison && (
                      <div className="mt-3 pt-3 border-t border-gray-500/30">
                        <div className="text-gray-400 text-xs">
                          <div className="font-medium mb-1">League Averages:</div>
                          <div>Attempts: {comparison.avgAttempts}</div>
                          <div>ANY/A: {comparison.avgAnyA}</div>
                          <div>TD Rate: {comparison.avgTDRate}%</div>
                          <div>Sack Rate: {comparison.avgSackRate}%</div>
                          <div>Turnover Rate: {comparison.avgTurnoverRate}%</div>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-500/30">
                      <div className="text-gray-400 text-xs">
                        <div className="font-medium mb-1">Performance Summary:</div>
                        <div>{tier.description}</div>
                        <div className="mt-1">
                          Normalized Score: {(performance.normalizedScore * 100).toFixed(1)}/100
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-500/30">
        <div className="text-gray-400 text-xs">
          <div className="font-medium mb-2">System Information:</div>
          <div>• Uses situational split data from Supabase</div>
          <div>• Metrics: ANY/A, TD rate, sack rate, turnover rate</div>
          <div>• Z-score normalization for fair comparison</div>
          <div>• Minimum 10 attempts required per category</div>
        </div>
      </div>
    </div>
  );
});

ClutchDetails.displayName = 'ClutchDetails';

export default ClutchDetails;
