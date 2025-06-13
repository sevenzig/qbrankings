// UI helper utility functions

// Stable dynamic tier system based on QEI score percentiles
export const calculateDynamicTiers = (allQBsWithQEI) => {
  // Extract all QEI scores for statistical analysis
  const allQEIScores = allQBsWithQEI
    .map(qb => qb.qei || 0)
    .filter(score => !isNaN(score) && isFinite(score))
    .sort((a, b) => b - a); // Sort descending for easier percentile calculation

  if (allQEIScores.length === 0) {
    return {
      elite: 85,
      excellent: 75,
      veryGood: 65,
      good: 55,
      average: 45
    };
  }

  // Calculate stable percentile-based tiers that maintain consistent distribution
  // This ensures that roughly the same percentage of QBs are in each tier regardless of weights
  const getPercentile = (percentage) => {
    const index = Math.floor((percentage / 100) * (allQEIScores.length - 1));
    return allQEIScores[Math.max(0, Math.min(index, allQEIScores.length - 1))];
  };

  // Define tier thresholds based on percentiles for stable distribution
  const tiers = {
    // Elite: Top 8% of QBs (92nd percentile) - truly elite performers
    elite: getPercentile(8), // 92nd percentile
    
    // Excellent: Top 15% of QBs (85th percentile) - high-level performers
    excellent: getPercentile(15), // 85th percentile
    
    // Very Good: Top 23% of QBs (77th percentile) - above average performers
    veryGood: getPercentile(23), // 77th percentile
    
    // Good: Top 30% of QBs (70th percentile) - solid performers
    good: getPercentile(30), // 70th percentile
    
    // Average: Top 45% of QBs (55th percentile)
    average: getPercentile(45) // 55th percentile
  };

  // Calculate actual statistics for debugging
  const mean = allQEIScores.reduce((sum, score) => sum + score, 0) / allQEIScores.length;
  const variance = allQEIScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / allQEIScores.length;
  const standardDeviation = Math.sqrt(variance);
  const minScore = Math.min(...allQEIScores);
  const maxScore = Math.max(...allQEIScores);
  
  // Debug logging to verify tier system stability
  console.log('=== STABLE DYNAMIC TIER SYSTEM ===');
  console.log(`📊 QEI Score Statistics (${allQEIScores.length} QBs):`);
  console.log(`   Mean: ${mean.toFixed(2)}`);
  console.log(`   Std Dev: ${standardDeviation.toFixed(2)}`);
  console.log(`   Range: ${minScore.toFixed(2)} - ${maxScore.toFixed(2)}`);
  console.log('🏆 Selective Percentile-Based Tier Thresholds:');
  console.log(`   Elite (92nd %ile): ≥${tiers.elite.toFixed(2)}`);
  console.log(`   Excellent (85th %ile): ≥${tiers.excellent.toFixed(2)}`);
  console.log(`   Very Good (77th %ile): ≥${tiers.veryGood.toFixed(2)}`);
  console.log(`   Good (70th %ile): ≥${tiers.good.toFixed(2)}`);
  console.log(`   Average (55th %ile): ≥${tiers.average.toFixed(2)}`);
  
  // Count how many QBs actually qualify for each tier
  const eliteCount = allQEIScores.filter(score => score >= tiers.elite).length;
  const excellentCount = allQEIScores.filter(score => score >= tiers.excellent && score < tiers.elite).length;
  const veryGoodCount = allQEIScores.filter(score => score >= tiers.veryGood && score < tiers.excellent).length;
  const goodCount = allQEIScores.filter(score => score >= tiers.good && score < tiers.veryGood).length;
  const averageCount = allQEIScores.filter(score => score >= tiers.average && score < tiers.good).length;
  const belowAvgCount = allQEIScores.filter(score => score < tiers.average).length;
  
  console.log(`🎯 Stable Distribution: Elite(${eliteCount}) Excellent(${excellentCount}) VeryGood(${veryGoodCount}) Good(${goodCount}) Average(${averageCount}) BelowAvg(${belowAvgCount})`);
  
  // Show percentages for verification
  const total = allQEIScores.length;
  console.log(`📈 Percentage Distribution: Elite(${(eliteCount/total*100).toFixed(1)}%) Excellent(${(excellentCount/total*100).toFixed(1)}%) VeryGood(${(veryGoodCount/total*100).toFixed(1)}%) Good(${(goodCount/total*100).toFixed(1)}%) Average(${(averageCount/total*100).toFixed(1)}%) BelowAvg(${(belowAvgCount/total*100).toFixed(1)}%)`);
  
  // Debug: Show top 10 QEI scores with tiers for verification
  const sortedQBs = [...allQBsWithQEI].sort((a, b) => (b.qei || 0) - (a.qei || 0));
  
  console.log('🔍 Top 10 QEI Scores with Stable Tiers:');
  sortedQBs.slice(0, 10).forEach((qb, index) => {
    const qeiScore = qb.qei || 0;
    const tier = qeiScore >= tiers.elite ? 'Elite' : 
                 qeiScore >= tiers.excellent ? 'Excellent' : 
                 qeiScore >= tiers.veryGood ? 'Very Good' :
                 qeiScore >= tiers.good ? 'Good' :
                 qeiScore >= tiers.average ? 'Average' : 'Below Avg';
    const percentile = ((allQEIScores.length - index) / allQEIScores.length * 100);
    console.log(`   ${index + 1}. ${qb.name}: QEI(${qeiScore.toFixed(2)}) → ${tier} (${percentile.toFixed(1)}th %ile)`);
  });
  
  return tiers;
};

export const getQEIColor = (qb, allQBsWithQEI = null) => {
  // Calculate dynamic tiers if QB data with QEI scores is provided
  const tiers = allQBsWithQEI ? calculateDynamicTiers(allQBsWithQEI) : null;
  
  if (tiers && qb.qei !== undefined) {
    const qeiScore = qb.qei || 0;
    
    // Use QEI score for tier comparison
    if (qeiScore >= tiers.elite) return 'bg-gradient-to-r from-yellow-400/30 to-orange-400/30 text-yellow-200'; // Gold - Elite
    if (qeiScore >= tiers.excellent) return 'bg-gradient-to-r from-gray-300/30 to-gray-400/30 text-gray-200'; // Silver - Excellent
    if (qeiScore >= tiers.veryGood) return 'bg-gradient-to-r from-amber-600/30 to-amber-700/30 text-amber-200'; // Bronze - Very Good
    if (qeiScore >= tiers.good) return 'bg-gradient-to-r from-green-500/30 to-green-600/30 text-green-200'; // Green - Good
    if (qeiScore >= tiers.average) return 'bg-gradient-to-r from-blue-500/30 to-blue-600/30 text-blue-200'; // Blue - Average
    return 'bg-white/10 text-white'; // Below Average
  } else {
    // Fallback to static thresholds using QEI score
    const qei = qb.qei || 0;
    if (qei >= 85) return 'bg-gradient-to-r from-yellow-400/30 to-orange-400/30 text-yellow-200'; // Gold - Elite
    if (qei >= 75) return 'bg-gradient-to-r from-gray-300/30 to-gray-400/30 text-gray-200'; // Silver - Excellent
    if (qei >= 65) return 'bg-gradient-to-r from-amber-600/30 to-amber-700/30 text-amber-200'; // Bronze - Very Good
    if (qei >= 55) return 'bg-gradient-to-r from-green-500/30 to-green-600/30 text-green-200'; // Green - Good
    if (qei >= 45) return 'bg-gradient-to-r from-blue-500/30 to-blue-600/30 text-blue-200'; // Blue - Average
    return 'bg-white/10 text-white'; // Below Average
  }
};

export const getQEITier = (qb, allQBsWithQEI = null) => {
  // Calculate dynamic tiers if QB data with QEI scores is provided
  const tiers = allQBsWithQEI ? calculateDynamicTiers(allQBsWithQEI) : null;
  
  if (tiers && qb.qei !== undefined) {
    const qeiScore = qb.qei || 0;
    
    // Debug logging for key QBs to understand tier assignment
    if (qb.name && (qb.name.includes('Burrow') || qb.name.includes('Mahomes') || qb.name.includes('Jackson') || qb.name.includes('Allen'))) {
      console.log(`🔍 TIER DEBUG - ${qb.name}:`);
      console.log(`   QEI Score: ${qeiScore.toFixed(2)}`);
      console.log(`   Elite Threshold: ${tiers.elite.toFixed(2)}`);
      console.log(`   Tier: ${qeiScore >= tiers.elite ? 'Elite' : qeiScore >= tiers.excellent ? 'Excellent' : 'Other'}`);
    }
    
    // Use QEI score for tier comparison
    if (qeiScore >= tiers.elite) return 'Elite';
    if (qeiScore >= tiers.excellent) return 'Excellent';
    if (qeiScore >= tiers.veryGood) return 'Very Good';
    if (qeiScore >= tiers.good) return 'Good';
    if (qeiScore >= tiers.average) return 'Average';
    return 'Below Avg';
  } else {
    // Fallback to static thresholds using QEI score
    const qei = qb.qei || 0;
    if (qei >= 85) return 'Elite';
    if (qei >= 75) return 'Excellent';
    if (qei >= 65) return 'Very Good';
    if (qei >= 55) return 'Good';
    if (qei >= 45) return 'Average';
    return 'Below Avg';
  }
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