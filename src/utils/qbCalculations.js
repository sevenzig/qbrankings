// QB calculation utility functions
import {
  calculateTeamScore,
  calculateStatsScore,
  calculateClutchScore,
  calculateDurabilityScore,
  calculateSupportScore
} from '../components/scoringCategories/index.js';





export const calculateQBMetrics = (qb, supportWeights = { offensiveLine: 55, weapons: 30, defense: 15 }, statsWeights = { efficiency: 45, protection: 25, volume: 30 }, teamWeights = { regularSeason: 65, playoff: 35 }, clutchWeights = { gameWinningDrives: 40, fourthQuarterComebacks: 25, clutchRate: 15, playoffBonus: 20 }, includePlayoffs = true, include2024Only = false) => {
  // Create season data structure for enhanced calculations
  const qbSeasonData = {
    years: {}
  };
  
  // Convert season data to expected format (including playoff data)
  // Filter season data for 2024-only mode if enabled
  let seasonsToProcess = qb.seasonData || [];
  if (include2024Only) {
    seasonsToProcess = seasonsToProcess.filter(season => season.year === 2024);
  }
  
  if (seasonsToProcess.length > 0) {
    seasonsToProcess.forEach(season => {
      qbSeasonData.years[season.year] = {
        // Regular season data
        G: season.gamesStarted,
        GS: season.gamesStarted,
        QBrec: `${season.wins}-${season.losses}-0`,
        Rate: season.passerRating,
        'ANY/A': season.anyPerAttempt || 0,
        'TD%': season.passingTDs / Math.max(1, season.attempts) * 100,
        'Int%': season.interceptions / Math.max(1, season.attempts) * 100,
        'Succ%': season.successRate || 0,
        'Sk%': season.sackPercentage || 0,
        Att: season.attempts,
        Cmp: season.completions,
        Yds: season.passingYards,
        TD: season.passingTDs,
        Int: season.interceptions,
        Sk: season.sacks,
        GWD: season.gameWinningDrives || 0,
        '4QC': season.fourthQuarterComebacks || 0,
        team: season.team,
        teamsPlayed: season.teamsPlayed, // For multi-team seasons
        Team: season.team,
        Player: qb.name,
        Age: season.age,
        
        // Add rushing data
        RushingYds: season.rushingYards || 0,
        RushingTDs: season.rushingTDs || 0,
        Fumbles: season.fumbles || 0,
        
        // Add playoff data if available AND if playoffs are included globally
        playoffData: (season.playoffData && includePlayoffs) ? season.playoffData : null
      };
    });
  }

  // Create team settings object for backward compatibility
  const teamSettings = { includePlayoffs, include2024Only };

  // Calculate Team Score
  const teamScore = calculateTeamScore(qbSeasonData, teamWeights, teamSettings);
  
  // Calculate Stats Score using season data
  const statsScore = calculateStatsScore(qbSeasonData, statsWeights, includePlayoffs, include2024Only);
  
  // Calculate Clutch Score
  const clutchScore = calculateClutchScore(qbSeasonData, includePlayoffs, clutchWeights, include2024Only);
  
  // Calculate Durability Score
  const durabilityScore = calculateDurabilityScore(qbSeasonData, includePlayoffs, include2024Only);
  
  // Calculate Support Score (quality assessment) - pass season data structure for year-specific calculations
  // Add current team and player name to season data for fallback scenarios
  qbSeasonData.currentTeam = qb.team;
  qbSeasonData.name = qb.name;
  const supportScore = calculateSupportScore(qbSeasonData, supportWeights, include2024Only);
  
  return {
    team: teamScore,
    stats: statsScore,
    clutch: clutchScore,
    durability: durabilityScore,
    support: supportScore
  };
};

export const calculateQEI = (baseScores, qb, weights, includePlayoffs = true, allQBBaseScores = [], include2024Only = false) => {
  // Calculate total weight for normalization
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  
  if (totalWeight === 0) return 0;
  
  // CORRECTED SUPPORT INTEGRATION: Balanced normalization without deflation
  let finalScore = 0;
  
  if (weights.support > 0 && allQBBaseScores.length > 0) {
    // Calculate league average support quality for proper normalization
    const avgSupportScore = allQBBaseScores.reduce((sum, qbScores) => sum + qbScores.support, 0) / allQBBaseScores.length;
    
    // Calculate base performance score (excluding support)
    const basePerformanceScore = (
      (baseScores.team * weights.team) +
      (baseScores.stats * weights.stats) +
      (baseScores.clutch * weights.clutch) +
      (baseScores.durability * weights.durability)
    ) / Math.max(1, totalWeight - weights.support);
    
    // BALANCED SUPPORT ADJUSTMENT: Properly centered around neutral (1.0)
    // Poor support (below average) = bonus, Good support (above average) = penalty
    const supportDifference = baseScores.support - avgSupportScore; // Positive = better than average support
    
    // Create adjustment factor that properly balances around 1.0
    // Range: 0.85 to 1.15 (±15% max adjustment)
    // Poor support gets bonus (factor > 1.0), good support gets penalty (factor < 1.0)
    const maxAdjustment = 0.15; // ±15% max
    const adjustmentStrength = 0.003; // Sensitivity factor (adjust as needed)
    const supportAdjustmentFactor = Math.max(0.85, Math.min(1.15, 1.0 - (supportDifference * adjustmentStrength)));
    
    // Apply support adjustment to base performance
    const adjustedPerformanceScore = basePerformanceScore * supportAdjustmentFactor;
    
    // Calculate final score using simple weighted average
    // No more confusing double-inversion - just use the adjusted performance with support weight
    const supportWeight = weights.support / totalWeight;
    finalScore = (adjustedPerformanceScore * (1 - supportWeight)) + (baseScores.support * supportWeight);
    
    // Debug for significant cases
    if (qb?.name && (qb.name.includes('Mahomes') || qb.name.includes('Allen') || qb.name.includes('Burrow') || qb.name.includes('Herbert') || qb.name.includes('Hurts') || Math.random() < 0.05)) {
      const adjustmentType = supportAdjustmentFactor > 1.0 ? 'BONUS' : supportAdjustmentFactor < 1.0 ? 'PENALTY' : 'NEUTRAL';
      console.log(`🎯 SUPPORT ${qb.name}: Quality(${baseScores.support.toFixed(1)}) vs Avg(${avgSupportScore.toFixed(1)}) -> ${adjustmentType} Factor(${supportAdjustmentFactor.toFixed(3)})`);
      console.log(`🎯 Base Perf(${basePerformanceScore.toFixed(1)}) * Factor(${supportAdjustmentFactor.toFixed(3)}) = Adjusted(${adjustedPerformanceScore.toFixed(1)})`);
      console.log(`🎯 Final: Adjusted(${adjustedPerformanceScore.toFixed(1)}) * ${((1-supportWeight)*100).toFixed(0)}% + Support(${baseScores.support.toFixed(1)}) * ${(supportWeight*100).toFixed(0)}% = ${finalScore.toFixed(1)}`);
    }
  } else {
    // No support weighting or no comparison data - standard weighted average
    finalScore = (
      (baseScores.team * weights.team) +
      (baseScores.stats * weights.stats) +
      (baseScores.clutch * weights.clutch) +
      (baseScores.durability * weights.durability) +
      (baseScores.support * weights.support)
    ) / totalWeight;
  }
  
  // Apply experience modifier only when durability is weighted (since it's an availability factor)
  const experience = qb?.experience || qb?.seasonData?.length || 1;
  let experienceModifier = 1.0;
  
  // Only apply experience modifier if durability is weighted (experience affects availability)
  if (weights.durability > 0) {
    if (experience === 1) {
      experienceModifier = 0.93; // 7% penalty for rookies (more realistic)
    } else if (experience === 2) {
      experienceModifier = 0.97; // 3% penalty for second-year QBs
    }
    // 3+ years: no penalty (1.0x modifier)
  }
  
  let adjustedScore = finalScore * experienceModifier;
  
  // DYNAMIC NORMALIZATION: Different scaling based on playoff inclusion
  if (includePlayoffs) {
    // PLAYOFF MODE: Standard regular season boost since playoff bonuses are already in individual scores
    const nonTeamScore = (
      (baseScores.stats * weights.stats) +
      (baseScores.clutch * weights.clutch) +
      (baseScores.durability * weights.durability)
    ) / Math.max(1, totalWeight - weights.team);
    
    const regularSeasonBoost = Math.min(12, nonTeamScore * 0.15); // Up to 12 point boost
    adjustedScore += regularSeasonBoost;
  } else {
    // REGULAR SEASON ONLY MODE: Enhanced boost to compensate for missing playoff bonuses
    const nonTeamScore = (
      (baseScores.stats * weights.stats) +
      (baseScores.clutch * weights.clutch) +
      (baseScores.durability * weights.durability)
    ) / Math.max(1, totalWeight - weights.team);
    
    // Enhanced regular season boost to normalize the scale when playoffs are excluded
    const enhancedRegularSeasonBoost = Math.min(18, nonTeamScore * 0.22); // Up to 18 point boost (50% higher)
    adjustedScore += enhancedRegularSeasonBoost;
    
    // Additional scaling factor to ensure elite QBs can reach 95+ without playoff bonuses
    const regularSeasonScalingFactor = 1.08; // 8% boost to overall scale
    adjustedScore *= regularSeasonScalingFactor;
  }
  
  // Only apply elite bonus if multiple categories are weighted (comprehensive evaluation)
  // For pure Stats+Support evaluations, keep it simple
  const weightedCategories = Object.values(weights).filter(w => w > 0).length;
  if (weightedCategories > 2 && adjustedScore >= 85) {
    // Elite tier: enhance differences at the top (only for comprehensive evaluations)
    const eliteBonus = Math.pow((adjustedScore - 85) / 15, 1.2) * 5; // Max 5 point boost
    adjustedScore = adjustedScore + eliteBonus;
  }
   
  // Return the natural score without artificial capping - let the best QBs rise to the top
  return Math.max(0, adjustedScore);
};