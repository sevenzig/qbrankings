/**
 * Z-Score Statistical Utilities
 * 
 * Provides statistical functions for calculating z-scores and converting them to percentiles.
 * Z-scores standardize values across different metrics, enabling accurate comparisons.
 * 
 * Formula: z = (X - μ) / σ
 * Where:
 *   X = individual value
 *   μ = population mean
 *   σ = population standard deviation
 */

/**
 * Calculate the mean (average) of an array of numbers
 * @param {number[]} values - Array of numeric values
 * @returns {number} Mean value
 */
export const calculateMean = (values) => {
  if (!values || values.length === 0) return 0;
  
  const validValues = values.filter(v => typeof v === 'number' && !isNaN(v) && isFinite(v));
  if (validValues.length === 0) return 0;
  
  const sum = validValues.reduce((acc, val) => acc + val, 0);
  return sum / validValues.length;
};

/**
 * Calculate the standard deviation of an array of numbers
 * @param {number[]} values - Array of numeric values
 * @param {number} [mean] - Pre-calculated mean (optional, will calculate if not provided)
 * @returns {number} Standard deviation
 */
export const calculateStandardDeviation = (values, mean = null) => {
  if (!values || values.length === 0) return 0;
  
  const validValues = values.filter(v => typeof v === 'number' && !isNaN(v) && isFinite(v));
  if (validValues.length === 0) return 0;
  
  const avg = mean !== null ? mean : calculateMean(validValues);
  
  const squaredDifferences = validValues.map(value => Math.pow(value - avg, 2));
  const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / validValues.length;
  
  return Math.sqrt(variance);
};

/**
 * Calculate z-score for a single value
 * @param {number} value - The value to convert to z-score
 * @param {number} mean - Population mean
 * @param {number} stdDev - Population standard deviation
 * @param {boolean} [invertScore=false] - If true, flip sign (for "lower is better" stats)
 * @returns {number} Z-score
 */
export const calculateZScore = (value, mean, stdDev, invertScore = false) => {
  // Handle edge cases
  if (!isFinite(value) || isNaN(value)) return 0;
  if (stdDev === 0) return 0; // No variance means everyone is average
  
  let z = (value - mean) / stdDev;
  
  // For "lower is better" stats (e.g., INT%, Sack%), invert the z-score
  if (invertScore) {
    z = -z;
  }
  
  // Cap extreme z-scores at ±3 standard deviations to handle outliers
  z = Math.max(-3, Math.min(3, z));
  
  return z;
};

/**
 * Error function approximation for normal distribution CDF
 * Using Abramowitz and Stegun approximation
 * @param {number} x - Input value
 * @returns {number} Error function result
 */
const erf = (x) => {
  // Constants for approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  // Save the sign of x
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  
  // A&S formula 7.1.26
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return sign * y;
};

/**
 * Convert z-score to percentile using cumulative normal distribution
 * @param {number} zScore - Z-score value
 * @returns {number} Percentile (0-100)
 */
export const zScoreToPercentile = (zScore) => {
  if (!isFinite(zScore) || isNaN(zScore)) return 0; // Return 0 for invalid z-scores instead of 50
  
  // Use the error function to calculate cumulative probability
  // CDF(z) = 0.5 * (1 + erf(z / sqrt(2)))
  const percentile = 50 * (1 + erf(zScore / Math.sqrt(2)));
  
  // Ensure result is within valid range
  return Math.max(0, Math.min(100, percentile));
};

/**
 * Calculate z-scores for all QBs for a specific stat
 * @param {Object[]} allQBData - Array of all QB season data objects
 * @param {Function} statExtractor - Function that extracts the stat value from a QB data object
 * @param {boolean} [invertScore=false] - If true, lower values get higher z-scores
 * @returns {Object} Object containing mean, stdDev, and a map of QB data to z-scores
 */
export const calculateZScoresForStat = (allQBData, statExtractor, invertScore = false) => {
  // Extract all stat values
  const statValues = allQBData
    .map(qb => statExtractor(qb))
    .filter(val => typeof val === 'number' && !isNaN(val) && isFinite(val));
  
  if (statValues.length === 0) {
    return { mean: 0, stdDev: 0, zScores: new Map() };
  }
  
  // Calculate population statistics
  const mean = calculateMean(statValues);
  const stdDev = calculateStandardDeviation(statValues, mean);
  
  // Calculate z-score for each QB
  const zScores = new Map();
  allQBData.forEach(qb => {
    const value = statExtractor(qb);
    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
      const z = calculateZScore(value, mean, stdDev, invertScore);
      zScores.set(qb, z);
    }
  });
  
  return { mean, stdDev, zScores };
};

/**
 * Calculate weighted average of z-scores (for multi-year data)
 * @param {Object[]} yearlyZScores - Array of {year, zScore, weight} objects
 * @returns {number} Weighted average z-score
 */
export const calculateWeightedAverageZScore = (yearlyZScores) => {
  if (!yearlyZScores || yearlyZScores.length === 0) return 0;
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  yearlyZScores.forEach(({ zScore, weight }) => {
    if (typeof zScore === 'number' && !isNaN(zScore) && isFinite(zScore) &&
        typeof weight === 'number' && !isNaN(weight) && isFinite(weight)) {
      weightedSum += zScore * weight;
      totalWeight += weight;
    }
  });
  
  if (totalWeight === 0) return 0;
  
  return weightedSum / totalWeight;
};

/**
 * Calculate composite z-score from multiple stats with individual weights
 * @param {Object} statZScores - Object mapping stat names to z-scores
 * @param {Object} weights - Object mapping stat names to weights
 * @returns {number} Composite z-score
 */
export const calculateCompositeZScore = (statZScores, weights) => {
  if (!statZScores || !weights) return 0;
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  Object.keys(statZScores).forEach(stat => {
    const zScore = statZScores[stat];
    const weight = weights[stat] || 0;
    
    if (typeof zScore === 'number' && !isNaN(zScore) && isFinite(zScore) &&
        typeof weight === 'number' && !isNaN(weight) && isFinite(weight) && weight > 0) {
      weightedSum += zScore * weight;
      totalWeight += weight;
    }
  });
  
  if (totalWeight === 0) return 0;
  
  return weightedSum / totalWeight;
};

/**
 * Convert composite z-score directly to a 0-100 score
 * This is useful for final score presentation
 * @param {number} zScore - Composite z-score
 * @returns {number} Score on 0-100 scale
 */
export const zScoreToScore = (zScore) => {
  return zScoreToPercentile(zScore);
};

/**
 * Calculate variance of an array of z-scores
 * Variance = average of squared deviations from mean
 * 
 * Used for variance normalization to ensure all scoring categories
 * contribute equally to final rankings regardless of natural variance.
 * 
 * @param {number[]} zScores - Array of z-score values
 * @returns {number} Variance (σ²)
 */
export const calculateVariance = (zScores) => {
  // Edge case: insufficient data
  if (!zScores || zScores.length < 2) return 1.0;
  
  // Filter out invalid values
  const validZScores = zScores.filter(z => isFinite(z) && !isNaN(z));
  if (validZScores.length < 2) return 1.0;
  
  // Calculate mean
  const mean = calculateMean(validZScores);
  
  // Calculate squared deviations
  const squaredDiffs = validZScores.map(z => Math.pow(z - mean, 2));
  const variance = calculateMean(squaredDiffs);
  
  // Edge case: zero or negative variance (all identical scores)
  if (variance <= 0 || !isFinite(variance)) return 1.0;
  
  return variance;
};

/**
 * Normalize z-score to target variance
 * Scales z-score so the category has variance = targetVariance
 * 
 * Formula: z_normalized = z * sqrt(target_variance / actual_variance)
 * 
 * This ensures categories with naturally high variance (e.g., Win%)
 * don't dominate categories with lower variance (e.g., passing yards)
 * when combining scores with user-defined weights.
 * 
 * @param {number} zScore - Individual z-score to normalize
 * @param {number} categoryVariance - Actual variance of this category across population
 * @param {number} [targetVariance=1.0] - Desired variance (default: 1.0)
 * @returns {number} Variance-normalized z-score
 */
export const normalizeZScoreVariance = (zScore, categoryVariance, targetVariance = 1.0) => {
  // Handle invalid inputs
  if (!isFinite(zScore) || isNaN(zScore)) return 0;
  if (categoryVariance <= 0 || !isFinite(categoryVariance)) return zScore;
  
  // Calculate scaling factor: sqrt(target / actual)
  const scalingFactor = Math.sqrt(targetVariance / categoryVariance);
  
  return zScore * scalingFactor;
};

/**
 * Normalize all category z-scores to equal variance
 * Returns normalized scores object with same structure as input
 * 
 * This is the key function for ensuring user weights work as intended.
 * After normalization, a 35% weight on Team truly means 35% influence,
 * not 70% influence due to high variance.
 * 
 * @param {Object} rawScores - Object with category names as keys, raw z-scores as values
 * @param {Object} categoryVariances - Object with category names as keys, variances as values
 * @param {number} [targetVariance=1.0] - Desired variance for all categories
 * @returns {Object} Normalized scores with same structure as rawScores
 */
export const normalizeAllCategoryScores = (rawScores, categoryVariances, targetVariance = 1.0) => {
  const normalized = {};
  
  Object.keys(rawScores).forEach(category => {
    const rawZScore = rawScores[category] || 0;
    const variance = categoryVariances[category] || 1.0;
    normalized[category] = normalizeZScoreVariance(rawZScore, variance, targetVariance);
  });
  
  return normalized;
};

