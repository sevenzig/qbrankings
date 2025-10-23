/**
 * Clutch Metrics Calculator
 * 
 * Calculates performance metrics from split data for clutch performance analysis.
 * Handles ANY/A, TD rate, sack rate, turnover rate, and other key metrics.
 */

import { getClutchCategory } from './clutchCategories.js';

/**
 * Calculate ANY/A (Adjusted Net Yards per Attempt) from raw stats
 * Formula: (pass yards + 20*(pass TD) - 45*(interceptions) - sack yards)/(passing attempts + sacks)
 * @param {Object} stats - Raw statistics object
 * @returns {number} ANY/A value
 */
export const calculateAnyPerAttempt = (stats) => {
  const {
    totalYards = 0,
    totalTouchdowns = 0,
    totalInterceptions = 0,
    totalSackYards = 0,
    totalAttempts = 0,
    totalSacks = 0
  } = stats;

  const totalDropbacks = totalAttempts + totalSacks;
  if (totalDropbacks === 0) return 0;
  
  const numerator = totalYards + 
                   (20 * totalTouchdowns) - 
                   (45 * totalInterceptions) - 
                   totalSackYards;
  
  return numerator / totalDropbacks;
};

/**
 * Calculate touchdown rate from raw stats
 * @param {Object} stats - Raw statistics object
 * @returns {number} Touchdown rate (TDs per attempt)
 */
export const calculateTouchdownRate = (stats) => {
  const { totalTouchdowns = 0, totalAttempts = 0 } = stats;
  return totalAttempts > 0 ? totalTouchdowns / totalAttempts : 0;
};

/**
 * Calculate sack rate from raw stats
 * @param {Object} stats - Raw statistics object
 * @returns {number} Sack rate (sacks per dropback)
 */
export const calculateSackRate = (stats) => {
  const { totalSacks = 0, totalAttempts = 0 } = stats;
  const totalDropbacks = totalAttempts + totalSacks;
  return totalDropbacks > 0 ? totalSacks / totalDropbacks : 0;
};

/**
 * Calculate turnover rate from raw stats
 * @param {Object} stats - Raw statistics object
 * @returns {number} Turnover rate ((INTs + fumbles lost) per attempt)
 */
export const calculateTurnoverRate = (stats) => {
  const { 
    totalInterceptions = 0, 
    totalFumblesLost = 0, 
    totalAttempts = 0 
  } = stats;
  return totalAttempts > 0 ? (totalInterceptions + totalFumblesLost) / totalAttempts : 0;
};

/**
 * Calculate conversion rate from raw stats
 * @param {Object} stats - Raw statistics object
 * @returns {number} Conversion rate (first downs per attempt)
 */
export const calculateConversionRate = (stats) => {
  const { totalFirstDowns = 0, totalAttempts = 0 } = stats;
  return totalAttempts > 0 ? totalFirstDowns / totalAttempts : 0;
};

/**
 * Calculate completion rate from raw stats
 * @param {Object} stats - Raw statistics object
 * @returns {number} Completion rate (completions per attempt)
 */
export const calculateCompletionRate = (stats) => {
  const { totalCompletions = 0, totalAttempts = 0 } = stats;
  return totalAttempts > 0 ? totalCompletions / totalAttempts : 0;
};

/**
 * Calculate yards per attempt from raw stats
 * @param {Object} stats - Raw statistics object
 * @returns {number} Yards per attempt
 */
export const calculateYardsPerAttempt = (stats) => {
  const { totalYards = 0, totalAttempts = 0 } = stats;
  return totalAttempts > 0 ? totalYards / totalAttempts : 0;
};

/**
 * Calculate all metrics for a category from raw stats
 * @param {Object} stats - Raw statistics object
 * @param {string} categoryKey - The clutch category key
 * @returns {Object} Calculated metrics for the category
 */
export const calculateCategoryMetrics = (stats, categoryKey) => {
  const category = getClutchCategory(categoryKey);
  if (!category) {
    console.error(`❌ Unknown clutch category: ${categoryKey}`);
    return {};
  }

  // Calculate all available metrics
  const metrics = {
    anyPerAttempt: calculateAnyPerAttempt(stats),
    touchdownRate: calculateTouchdownRate(stats),
    sackRate: calculateSackRate(stats),
    turnoverRate: calculateTurnoverRate(stats),
    conversionRate: calculateConversionRate(stats),
    completionRate: calculateCompletionRate(stats),
    yardsPerAttempt: calculateYardsPerAttempt(stats),
    totalAttempts: stats.totalAttempts || 0,
    totalDropbacks: (stats.totalAttempts || 0) + (stats.totalSacks || 0)
  };

  // Filter to only include metrics defined for this category
  const categoryMetrics = {};
  category.metrics.forEach(metric => {
    if (metrics.hasOwnProperty(metric.name)) {
      categoryMetrics[metric.name] = metrics[metric.name];
    }
  });

  return categoryMetrics;
};

/**
 * Normalize a category score by applying metric weights
 * @param {Object} metrics - Calculated metrics for the category
 * @param {string} categoryKey - The clutch category key
 * @returns {number} Normalized category score
 */
export const normalizeCategoryScore = (metrics, categoryKey) => {
  const category = getClutchCategory(categoryKey);
  if (!category) {
    console.error(`❌ Unknown clutch category: ${categoryKey}`);
    return 0;
  }

  let weightedSum = 0;
  let totalWeight = 0;

  // Apply weights to each metric
  Object.entries(metrics).forEach(([metricName, value]) => {
    const weight = category.getMetricWeight(metricName);
    const isInverted = category.isMetricInverted(metricName);
    
    if (weight > 0) {
      // For inverted metrics (sack rate, turnover rate), lower is better
      const normalizedValue = isInverted ? (1 - Math.min(value, 1)) : value;
      weightedSum += normalizedValue * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
};

/**
 * Calculate clutch performance score for a specific category
 * @param {Object} stats - Raw statistics object
 * @param {string} categoryKey - The clutch category key
 * @returns {Object} Category performance data
 */
export const calculateCategoryPerformance = (stats, categoryKey) => {
  const metrics = calculateCategoryMetrics(stats, categoryKey);
  const normalizedScore = normalizeCategoryScore(metrics, categoryKey);
  
  return {
    categoryKey,
    metrics,
    normalizedScore,
    totalAttempts: stats.totalAttempts || 0,
    hasData: (stats.totalAttempts || 0) > 0
  };
};

/**
 * Calculate clutch performance for all categories
 * @param {Object} allCategoryStats - Stats for all categories keyed by category key
 * @returns {Object} Performance data for all categories
 */
export const calculateAllCategoryPerformance = (allCategoryStats) => {
  const performance = {};
  
  Object.entries(allCategoryStats).forEach(([categoryKey, stats]) => {
    performance[categoryKey] = calculateCategoryPerformance(stats, categoryKey);
  });
  
  return performance;
};

/**
 * Calculate overall clutch score from category performances
 * @param {Object} categoryPerformances - Performance data for all categories
 * @param {Object} categoryWeights - Weights for each category
 * @returns {number} Overall clutch score (0-100)
 */
export const calculateOverallClutchScore = (categoryPerformances, categoryWeights) => {
  let weightedSum = 0;
  let totalWeight = 0;
  
  Object.entries(categoryPerformances).forEach(([categoryKey, performance]) => {
    const weight = categoryWeights[categoryKey] || 0;
    if (weight > 0 && performance.hasData) {
      weightedSum += performance.normalizedScore * weight;
      totalWeight += weight;
    }
  });
  
  // Scale to 0-100 range
  const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  return Math.max(0, Math.min(100, rawScore * 100));
};

/**
 * Get metric display information for UI
 * @param {string} metricName - The metric name
 * @returns {Object} Display information for the metric
 */
export const getMetricDisplayInfo = (metricName) => {
  const displayInfo = {
    anyPerAttempt: {
      name: 'ANY/A',
      description: 'Adjusted Net Yards per Attempt',
      format: (value) => value.toFixed(2),
      unit: 'yards',
      higherIsBetter: true
    },
    touchdownRate: {
      name: 'TD Rate',
      description: 'Touchdowns per Attempt',
      format: (value) => `${(value * 100).toFixed(1)}%`,
      unit: '%',
      higherIsBetter: true
    },
    sackRate: {
      name: 'Sack Rate',
      description: 'Sacks per Dropback',
      format: (value) => `${(value * 100).toFixed(1)}%`,
      unit: '%',
      higherIsBetter: false
    },
    turnoverRate: {
      name: 'Turnover Rate',
      description: 'Turnovers per Attempt',
      format: (value) => `${(value * 100).toFixed(1)}%`,
      unit: '%',
      higherIsBetter: false
    },
    conversionRate: {
      name: 'Conversion Rate',
      description: 'First Downs per Attempt',
      format: (value) => `${(value * 100).toFixed(1)}%`,
      unit: '%',
      higherIsBetter: true
    },
    completionRate: {
      name: 'Completion Rate',
      description: 'Completions per Attempt',
      format: (value) => `${(value * 100).toFixed(1)}%`,
      unit: '%',
      higherIsBetter: true
    },
    yardsPerAttempt: {
      name: 'Y/A',
      description: 'Yards per Attempt',
      format: (value) => value.toFixed(2),
      unit: 'yards',
      higherIsBetter: true
    }
  };
  
  return displayInfo[metricName] || {
    name: metricName,
    description: 'Performance metric',
    format: (value) => value.toFixed(3),
    unit: '',
    higherIsBetter: true
  };
};

/**
 * Validate that stats object has required fields
 * @param {Object} stats - Statistics object to validate
 * @returns {boolean} True if stats are valid
 */
export const validateStats = (stats) => {
  if (!stats || typeof stats !== 'object') {
    return false;
  }
  
  const requiredFields = ['totalAttempts', 'totalYards', 'totalTouchdowns', 'totalInterceptions'];
  return requiredFields.every(field => typeof stats[field] === 'number' && !isNaN(stats[field]));
};

/**
 * Get performance tier based on normalized score
 * @param {number} score - Normalized score (0-1)
 * @returns {Object} Performance tier information
 */
export const getPerformanceTier = (score) => {
  if (score >= 0.8) {
    return { tier: 'Elite', color: 'green', description: 'Elite clutch performance' };
  } else if (score >= 0.6) {
    return { tier: 'Very Good', color: 'blue', description: 'Very good clutch performance' };
  } else if (score >= 0.4) {
    return { tier: 'Above Average', color: 'yellow', description: 'Above average clutch performance' };
  } else if (score >= 0.2) {
    return { tier: 'Average', color: 'orange', description: 'Average clutch performance' };
  } else {
    return { tier: 'Below Average', color: 'red', description: 'Below average clutch performance' };
  }
};
