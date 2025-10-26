// UI helper utility functions

/**
 * 6-Tier Z-Score system with Average centered at median (50th percentile)
 * 
 * Mathematically intuitive tier structure where "Average" actually means
 * statistically average (within ±0.25 SD of the mean/median).
 */
const Z_SCORE_TIER_THRESHOLDS = {
  // Elite: z ≥ +1.35 standard deviations above mean
  // CDF(1.35) = 0.9115 → 90th percentile (~top 10%)
  elite: 90,
  
  // Excellent: z ≥ +0.75 standard deviations above mean  
  // CDF(0.75) = 0.7734 → 77.3rd percentile
  excellent: 77.3,
  
  // Good: z ≥ +0.25 standard deviations above mean
  // CDF(0.25) = 0.5987 → 59.9th percentile
  good: 59.9,
  
  // Average: z ≥ -0.25 (within 0.25 SD of mean, centered at median)
  // CDF(-0.25) = 0.4013 → 40.1st percentile
  average: 40.1,
  
  // Below Average: z ≥ -0.75 standard deviations below mean
  // CDF(-0.75) = 0.2266 → 22.7th percentile
  belowAverage: 22.7
  
  // Poor: z < -0.75 (implicitly < 22.7)
};

// Stable dynamic tier system based on QEI score percentiles
export const calculateDynamicTiers = (allQBsWithQEI) => {
  const tiers = { ...Z_SCORE_TIER_THRESHOLDS };
  
  // Extract all QEI scores for statistical analysis
  const allQEIScores = allQBsWithQEI
    .map(qb => qb.qei || 0)
    .filter(score => !isNaN(score) && isFinite(score))
    .sort((a, b) => b - a); // Sort descending for easier percentile calculation

  if (allQEIScores.length === 0) {
    return tiers;
  }

  // Calculate actual statistics for debugging
  const mean = allQEIScores.reduce((sum, score) => sum + score, 0) / allQEIScores.length;
  const variance = allQEIScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / allQEIScores.length;
  const standardDeviation = Math.sqrt(variance);
  const median = allQEIScores[Math.floor(allQEIScores.length / 2)];
  const minScore = Math.min(...allQEIScores);
  const maxScore = Math.max(...allQEIScores);
  
  // Debug logging to verify tier system stability
  console.log('=== 6-TIER Z-SCORE SYSTEM (Average @ Median) ===');
  console.log(`📊 Sample Statistics (${allQEIScores.length} QBs):`);
  console.log(`   Mean: ${mean.toFixed(2)} | Median: ${median.toFixed(2)} | Std Dev: ${standardDeviation.toFixed(2)}`);
  console.log(`   Range: ${minScore.toFixed(2)} - ${maxScore.toFixed(2)}`);
  console.log('');
  console.log('🧮 Z-Score Tier Thresholds (Average centered at 50th %ile):');
  console.log(`   Elite      (z≥+1.35): ≥${tiers.elite} percentile`);
  console.log(`   Excellent  (z≥+0.75): ≥${tiers.excellent} percentile`);
  console.log(`   Good       (z≥+0.25): ≥${tiers.good} percentile`);
  console.log(`   Average    (z≥-0.25): ≥${tiers.average} percentile ← MEDIAN CENTERED`);
  console.log(`   Below Avg  (z≥-0.75): ≥${tiers.belowAverage} percentile`);
  console.log(`   Poor       (z<-0.75): <${tiers.belowAverage} percentile`);
  
  // Count how many QBs actually qualify for each tier
  const counts = {
    elite: allQEIScores.filter(s => s >= tiers.elite).length,
    excellent: allQEIScores.filter(s => s >= tiers.excellent && s < tiers.elite).length,
    good: allQEIScores.filter(s => s >= tiers.good && s < tiers.excellent).length,
    average: allQEIScores.filter(s => s >= tiers.average && s < tiers.good).length,
    belowAverage: allQEIScores.filter(s => s >= tiers.belowAverage && s < tiers.average).length,
    poor: allQEIScores.filter(s => s < tiers.belowAverage).length
  };
  
  const total = allQEIScores.length;
  console.log('');
  console.log(`📈 Actual Distribution:`);
  console.log(`   Elite: ${counts.elite} (${(counts.elite/total*100).toFixed(1)}%)`);
  console.log(`   Excellent: ${counts.excellent} (${(counts.excellent/total*100).toFixed(1)}%)`);
  console.log(`   Good: ${counts.good} (${(counts.good/total*100).toFixed(1)}%)`);
  console.log(`   Average: ${counts.average} (${(counts.average/total*100).toFixed(1)}%) ← MEDIAN BAND`);
  console.log(`   Below Average: ${counts.belowAverage} (${(counts.belowAverage/total*100).toFixed(1)}%)`);
  console.log(`   Poor: ${counts.poor} (${(counts.poor/total*100).toFixed(1)}%)`);
  
  // Debug: Show top 10 QEI scores with tiers for verification
  const sortedQBs = [...allQBsWithQEI].sort((a, b) => (b.qei || 0) - (a.qei || 0));
  
  console.log('');
  console.log('🔍 Top 10 QEI Scores with Z-Score Tiers:');
  sortedQBs.slice(0, 10).forEach((qb, index) => {
    const qeiScore = qb.qei || 0;
    const tier = qeiScore >= tiers.elite ? 'Elite' : 
                 qeiScore >= tiers.excellent ? 'Excellent' : 
                 qeiScore >= tiers.good ? 'Good' :
                 qeiScore >= tiers.average ? 'Average' :
                 qeiScore >= tiers.belowAverage ? 'Below Avg' : 'Poor';
    const percentile = ((allQEIScores.length - index) / allQEIScores.length * 100);
    console.log(`   ${index + 1}. ${qb.name}: QEI(${qeiScore.toFixed(2)}) → ${tier} (${percentile.toFixed(1)}th %ile)`);
  });
  
  return tiers;
};

export const getQEIColor = (qb, allQBsWithQEI = null) => {
  const qei = qb.qei || 0;
  
  // Use fixed z-score thresholds for color coding
  if (qei >= 90) {
    return 'bg-gradient-to-r from-yellow-400/30 to-orange-400/30 text-yellow-200'; // Elite (Gold)
  }
  if (qei >= 77.3) {
    return 'bg-gradient-to-r from-gray-300/30 to-gray-400/30 text-gray-200'; // Excellent (Silver)
  }
  if (qei >= 59.9) {
    return 'bg-gradient-to-r from-green-500/30 to-green-600/30 text-green-200'; // Good (Green)
  }
  if (qei >= 40.1) {
    return 'bg-gradient-to-r from-blue-500/30 to-blue-600/30 text-blue-200'; // Average (Blue)
  }
  if (qei >= 22.7) {
    return 'bg-white/15 text-gray-300'; // Below Average
  }
  return 'bg-white/10 text-gray-400'; // Poor
};

export const getQEITier = (qb, allQBsWithQEI = null) => {
  const qei = qb.qei || 0;
  
  // Use fixed z-score percentile thresholds (6-tier system, Average centered at median)
  if (qei >= 90) return 'Elite';
  if (qei >= 77.3) return 'Excellent';
  if (qei >= 59.9) return 'Good';
  if (qei >= 40.1) return 'Average';
  if (qei >= 22.7) return 'Below Avg';
  return 'Poor';
};

export const getCurrentPresetDescription = (currentPreset, philosophyPresets) => {
  console.log('Current preset:', currentPreset);
  
  if (currentPreset === 'custom') {
    return "Custom settings - adjust sliders to match your QB evaluation philosophy";
  }
  
  const preset = philosophyPresets[currentPreset];
  if (preset && preset.description) {
    return preset.description;
  }
  
  return "Custom settings";
}; 