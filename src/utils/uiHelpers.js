// UI helper utility functions

/**
 * Updated Tier System with Final Percentile Thresholds
 * 
 * Elite: 88th percentile and above (with orange tinge for 89th+)
 * Excellent: 83.25th through 87.99th percentile  
 * Good: 77.25th through 83.24th percentile
 * Average: 42nd through 77.24th percentile
 * Below Average: 25th through 41.99th percentile
 * Poor: Below 25th percentile
 */
const TIER_THRESHOLDS = {
  // Elite: 88th percentile and above
  elite: 88,
  
  // Excellent: 83.25th through 87.99th percentile
  excellent: 83.25,
  
  // Good: 77.25th through 83.24th percentile  
  good: 77.25,
  
  // Average: 42nd through 77.24th percentile
  average: 42,
  
  // Below Average: 25th through 41.99th percentile
  belowAverage: 25
  
  // Poor: Below 25th percentile (implicitly < 25)
};

// Stable dynamic tier system based on QEI score percentiles
export const calculateDynamicTiers = (allQBsWithQEI) => {
  const tiers = { ...TIER_THRESHOLDS };
  
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
  console.log('=== UPDATED 6-TIER PERCENTILE SYSTEM ===');
  console.log(`📊 Sample Statistics (${allQEIScores.length} QBs):`);
  console.log(`   Mean: ${mean.toFixed(2)} | Median: ${median.toFixed(2)} | Std Dev: ${standardDeviation.toFixed(2)}`);
  console.log(`   Range: ${minScore.toFixed(2)} - ${maxScore.toFixed(2)}`);
  console.log('');
  console.log('🎯 Final Tier Thresholds:');
  console.log(`   Elite      (≥88th %ile): ≥${tiers.elite} percentile`);
  console.log(`   Excellent  (83.25-87.99th %ile): ${tiers.excellent}-87.99 percentile`);
  console.log(`   Good       (77.25-83.24th %ile): ${tiers.good}-83.24 percentile`);
  console.log(`   Average    (42-77.24th %ile): ${tiers.average}-77.24 percentile`);
  console.log(`   Below Avg  (25-41.99th %ile): ${tiers.belowAverage}-41.99 percentile`);
  console.log(`   Poor       (<25th %ile): <${tiers.belowAverage} percentile`);
  
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
  console.log(`   Average: ${counts.average} (${(counts.average/total*100).toFixed(1)}%)`);
  console.log(`   Below Average: ${counts.belowAverage} (${(counts.belowAverage/total*100).toFixed(1)}%)`);
  console.log(`   Poor: ${counts.poor} (${(counts.poor/total*100).toFixed(1)}%)`);
  
  // Debug: Show top 10 QEI scores with tiers for verification
  const sortedQBs = [...allQBsWithQEI].sort((a, b) => (b.qei || 0) - (a.qei || 0));
  
  console.log('');
  console.log('🔍 Top 10 QEI Scores with Updated Tiers:');
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
  
  // Traditional tier colors with orange enhancement for top performers
  if (qei >= 89) {
    return 'bg-gradient-to-r from-yellow-400/40 to-orange-400/40 text-yellow-200 border border-orange-300/30'; // Elite with orange enhancement (89th+)
  }
  if (qei >= 88) {
    return 'bg-gradient-to-r from-yellow-400/30 to-yellow-500/30 text-yellow-200'; // Elite - Gold (88th)
  }
  if (qei >= 83.25) {
    return 'bg-gradient-to-r from-gray-300/30 to-gray-400/30 text-gray-200'; // Excellent - Silver (83.25-87.99th)
  }
  if (qei >= 77.25) {
    return 'bg-gradient-to-r from-green-500/30 to-green-600/30 text-green-200'; // Good - Green (77.25-83.24th)
  }
  if (qei >= 42) {
    return 'bg-gradient-to-r from-blue-500/30 to-blue-600/30 text-blue-200'; // Average - Blue (42-77.24th)
  }
  if (qei >= 25) {
    return 'bg-white/15 text-gray-300'; // Below Average (25-41.99th)
  }
  return 'bg-white/10 text-gray-400'; // Poor (<25th)
};

export const getQEITier = (qb, allQBsWithQEI = null) => {
  const qei = qb.qei || 0;
  
  // Use final percentile thresholds
  if (qei >= 88) return 'Elite';
  if (qei >= 83.25) return 'Excellent';
  if (qei >= 77.25) return 'Good';
  if (qei >= 42) return 'Average';
  if (qei >= 25) return 'Below Avg';
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