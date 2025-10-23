/**
 * Clutch Categories Framework
 * 
 * Defines the 7 clutch performance categories with their situational splits
 * and metric calculations for comprehensive QB clutch evaluation.
 */

/**
 * ClutchCategory class to encapsulate category logic and configuration
 */
export class ClutchCategory {
  constructor(name, splitQueries, metrics, weights) {
    this.name = name;
    this.splitQueries = splitQueries; // Array of {split, values} objects
    this.metrics = metrics; // Array of {name, calculation, weight, inverted?} objects
    this.weights = weights; // Object with metric weights
  }

  /**
   * Get all split values for this category
   * @returns {Array} Array of all split values to query
   */
  getAllSplitValues() {
    const values = [];
    this.splitQueries.forEach(query => {
      values.push(...query.values);
    });
    return values;
  }

  /**
   * Get the split type for this category
   * @returns {string} The primary split type
   */
  getSplitType() {
    return this.splitQueries[0]?.split || 'Unknown';
  }

  /**
   * Check if a metric should be inverted (lower is better)
   * @param {string} metricName - The metric name
   * @returns {boolean} True if metric should be inverted
   */
  isMetricInverted(metricName) {
    const metric = this.metrics.find(m => m.name === metricName);
    return metric?.inverted || false;
  }

  /**
   * Get the weight for a specific metric
   * @param {string} metricName - The metric name
   * @returns {number} The weight for the metric
   */
  getMetricWeight(metricName) {
    return this.weights[metricName] || 0;
  }
}

/**
 * Define clutch categories with their situations and metrics
 * Updated with more accurate QB performance measurements
 */
export const CLUTCH_CATEGORIES = {
  // Critical Situations
  thirdDownSuccess: new ClutchCategory(
    'Third Down Success',
    [
      { split: 'Down & Yards to Go', values: ['3rd & 1-3', '3rd & 4-6', '3rd & 7-9', '3rd & 10+'] }
    ],
    [
      { name: 'conversionRate', calculation: 'firstDowns / attempts', weight: 0.4 },
      { name: 'anyPerAttempt', calculation: 'anyPerAttempt', weight: 0.25 },
      { name: 'sackRate', calculation: 'sacks / (attempts + sacks)', weight: 0.2, inverted: true },
      { name: 'turnoverRate', calculation: '(interceptions + fumbles) / attempts', weight: 0.15, inverted: true }
    ],
    { conversionRate: 0.4, anyPerAttempt: 0.25, sackRate: 0.2, turnoverRate: 0.15 }
  ),

  fourthDownSuccess: new ClutchCategory(
    'Fourth Down Success',
    [
      { split: 'Down & Yards to Go', values: ['4th & 1-3', '4th & 4-6', '4th & 7-9', '4th & 10+'] }
    ],
    [
      { name: 'conversionRate', calculation: 'firstDowns / attempts', weight: 0.5 },
      { name: 'anyPerAttempt', calculation: 'anyPerAttempt', weight: 0.3 },
      { name: 'turnoverRate', calculation: '(interceptions + fumbles) / attempts', weight: 0.2, inverted: true }
    ],
    { conversionRate: 0.5, anyPerAttempt: 0.3, turnoverRate: 0.2 }
  ),

  redZoneSuccess: new ClutchCategory(
    'Red Zone Success',
    [
      { split: 'Field Position', values: ['Red Zone'] }
    ],
    [
      { name: 'touchdownRate', calculation: 'touchdowns / attempts', weight: 0.4 },
      { name: 'anyPerAttempt', calculation: 'anyPerAttempt', weight: 0.3 },
      { name: 'turnoverRate', calculation: '(interceptions + fumbles) / attempts', weight: 0.2, inverted: true },
      { name: 'sackRate', calculation: 'sacks / (attempts + sacks)', weight: 0.1, inverted: true }
    ],
    { touchdownRate: 0.4, anyPerAttempt: 0.3, turnoverRate: 0.2, sackRate: 0.1 }
  ),

  // Late-Game Excellence
  ultraHighPressure: new ClutchCategory(
    'Ultra-High Pressure',
    [
      { split: 'Game Situation', values: ['Trailing, < 2 min to go', 'Tied, < 2 min to go', 'Trailing, < 4 min to go'] }
    ],
    [
      { name: 'anyPerAttempt', calculation: 'anyPerAttempt', weight: 0.35 },
      { name: 'touchdownRate', calculation: 'touchdowns / attempts', weight: 0.25 },
      { name: 'sackRate', calculation: 'sacks / (attempts + sacks)', weight: 0.2, inverted: true },
      { name: 'turnoverRate', calculation: '(interceptions + fumbles) / attempts', weight: 0.2, inverted: true }
    ],
    { anyPerAttempt: 0.35, touchdownRate: 0.25, sackRate: 0.2, turnoverRate: 0.2 }
  ),

  scoreDifferential: new ClutchCategory(
    'Score Differential',
    [
      { split: 'Score Differential', values: ['Trailing', 'Leading'] }
    ],
    [
      { name: 'trailingAnyA', calculation: 'anyPerAttempt', weight: 0.4 },
      { name: 'trailingTouchdownRate', calculation: 'touchdowns / attempts', weight: 0.3 },
      { name: 'trailingTurnoverRate', calculation: '(interceptions + fumbles) / attempts', weight: 0.3, inverted: true }
    ],
    { trailingAnyA: 0.4, trailingTouchdownRate: 0.3, trailingTurnoverRate: 0.3 }
  ),

  // Late-Season Performance
  novemberPerformance: new ClutchCategory(
    'November Performance',
    [
      { split: 'Month', values: ['November'] }
    ],
    [
      { name: 'anyPerAttempt', calculation: 'anyPerAttempt', weight: 0.4 },
      { name: 'touchdownRate', calculation: 'touchdowns / attempts', weight: 0.3 },
      { name: 'sackRate', calculation: 'sacks / (attempts + sacks)', weight: 0.15, inverted: true },
      { name: 'turnoverRate', calculation: '(interceptions + fumbles) / attempts', weight: 0.15, inverted: true }
    ],
    { anyPerAttempt: 0.4, touchdownRate: 0.3, sackRate: 0.15, turnoverRate: 0.15 }
  ),

  decemberJanuaryPerformance: new ClutchCategory(
    'December/January Performance',
    [
      { split: 'Month', values: ['December', 'January'] }
    ],
    [
      { name: 'anyPerAttempt', calculation: 'anyPerAttempt', weight: 0.4 },
      { name: 'touchdownRate', calculation: 'touchdowns / attempts', weight: 0.3 },
      { name: 'sackRate', calculation: 'sacks / (attempts + sacks)', weight: 0.15, inverted: true },
      { name: 'turnoverRate', calculation: '(interceptions + fumbles) / attempts', weight: 0.15, inverted: true }
    ],
    { anyPerAttempt: 0.4, touchdownRate: 0.3, sackRate: 0.15, turnoverRate: 0.15 }
  )
};

/**
 * Get all available clutch categories
 * @returns {Object} Object with category keys and ClutchCategory instances
 */
export const getAllClutchCategories = () => CLUTCH_CATEGORIES;

/**
 * Get a specific clutch category by key
 * @param {string} categoryKey - The category key
 * @returns {ClutchCategory|null} The category instance or null if not found
 */
export const getClutchCategory = (categoryKey) => {
  return CLUTCH_CATEGORIES[categoryKey] || null;
};

/**
 * Get all category keys
 * @returns {Array<string>} Array of category keys
 */
export const getClutchCategoryKeys = () => {
  return Object.keys(CLUTCH_CATEGORIES);
};

/**
 * Get the hierarchical weighting structure for clutch categories
 * @returns {Object} Weighting structure for combining category scores
 */
export const getClutchCategoryWeights = () => {
  return {
    // Critical Situations (50%)
    thirdDownSuccess: 0.20,
    fourthDownSuccess: 0.15,
    redZoneSuccess: 0.15,
    
    // Late-Game Excellence (30%)
    ultraHighPressure: 0.20,
    scoreDifferential: 0.10,
    
    // Late-Season Performance (20%)
    novemberPerformance: 0.10,
    decemberJanuaryPerformance: 0.10
  };
};

/**
 * Get category descriptions for UI display
 * @returns {Object} Category descriptions
 */
export const getClutchCategoryDescriptions = () => {
  return {
    thirdDownSuccess: 'Performance on 3rd down conversions across all distances',
    fourthDownSuccess: 'Performance on 4th down attempts across all distances',
    redZoneSuccess: 'Performance in the red zone (opponent\'s 20-yard line and in)',
    ultraHighPressure: 'Performance in ultra-high pressure late-game situations',
    scoreDifferential: 'Performance when trailing vs leading in games',
    novemberPerformance: 'Performance in November (late-season pressure)',
    decemberJanuaryPerformance: 'Performance in December/January (playoff push)'
  };
};
