// QB calculation utility functions
import {
  calculateTeamScore,
  calculateStatsScore,
  calculateClutchScore,
  calculateDurabilityScore,
  calculateSupportScore
} from '../components/scoringCategories/index.js';





export const calculateQBMetrics = (qb, supportWeights = { offensiveLine: 55, weapons: 30, defense: 15 }, statsWeights = { efficiency: 45, protection: 25, volume: 30 }, teamWeights = { regularSeason: 65, playoff: 35 }, clutchWeights = { gameWinningDrives: 40, fourthQuarterComebacks: 25, clutchRate: 15, playoffBonus: 20 }, includePlayoffs = true) => {
  // Create season data structure for enhanced calculations
  const qbSeasonData = {
    years: {}
  };
  
  // Convert season data to expected format (including playoff data)
  if (qb.seasonData && qb.seasonData.length > 0) {
    qb.seasonData.forEach(season => {
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
  const teamSettings = { includePlayoffs };

  // Calculate Team Score
  const teamScore = calculateTeamScore(qbSeasonData, teamWeights, teamSettings);
  
  // Calculate Stats Score using season data
  const statsScore = calculateStatsScore(qbSeasonData, statsWeights, includePlayoffs);
  
  // Calculate Clutch Score
  const clutchScore = calculateClutchScore(qbSeasonData, includePlayoffs, clutchWeights);
  
  // Calculate Durability Score
  const durabilityScore = calculateDurabilityScore(qbSeasonData, includePlayoffs);
  
  // Calculate Support Score (quality assessment) - pass season data structure for year-specific calculations
  // Add current team and player name to season data for fallback scenarios
  qbSeasonData.currentTeam = qb.team;
  qbSeasonData.name = qb.name;
  const supportScore = calculateSupportScore(qbSeasonData, supportWeights);
  
  return {
    team: teamScore,
    stats: statsScore,
    clutch: clutchScore,
    durability: durabilityScore,
    support: supportScore
  };
};

export const calculateQEI = (baseScores, qb, weights, includePlayoffs = true, allQBBaseScores = []) => {
  // Calculate total weight for normalization
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  
  if (totalWeight === 0) return 0;
  
  // Calculate base weighted score without support
  const baseWeightedScore = (
    (baseScores.team * weights.team) +
    (baseScores.stats * weights.stats) +
    (baseScores.clutch * weights.clutch) +
    (baseScores.durability * weights.durability)
  ) / Math.max(1, totalWeight - weights.support);
  
    // Apply normalized support adjustment with proper scaling
  let rawWeightedScore = baseWeightedScore;
  if (weights.support > 0) {
    const supportWeight = weights.support / totalWeight;
    
    if (allQBBaseScores.length > 0) {
      // Calculate average support score across all QBs
      const avgSupportScore = allQBBaseScores.reduce((sum, qbScores) => sum + qbScores.support, 0) / allQBBaseScores.length;
      
      // Support adjustment: QBs with worse support get bonus, better support get penalty
      const supportDifference = avgSupportScore - baseScores.support;
      const maxAdjustment = 15;
      const supportAdjustment = Math.max(-maxAdjustment, Math.min(maxAdjustment, supportDifference * 0.3));
      
      rawWeightedScore = baseWeightedScore + (supportAdjustment * supportWeight);
    }
    
    // SUPPORT NORMALIZATION: When support is primary component, add boost to maintain proper score range
    if (supportWeight > 0.5) {
      // Calculate base performance score for normalization
      const performanceScore = (
        (baseScores.stats * weights.stats) +
        (baseScores.clutch * weights.clutch) +
        (baseScores.durability * weights.durability)
      ) / Math.max(1, totalWeight - weights.team - weights.support);
      
      // Support-dominant boost: Scale based on how much weight support has
      const supportDominanceBoost = Math.min(35, performanceScore * 0.4 * supportWeight); // Up to 35 point boost
      rawWeightedScore += supportDominanceBoost;
      
      // Additional scaling when support is majority/only component
      if (supportWeight >= 0.8) { // 80%+ support weight
        const supportOnlyScalingFactor = 1.2; // 20% boost for support-only evaluations
        rawWeightedScore *= supportOnlyScalingFactor;
      }
    }
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
  
  let adjustedScore = rawWeightedScore * experienceModifier;
  
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
  
  // Simple debug logging for QEI calculation
  if (qb?.name && (qb.name.includes('Mahomes') || qb.name.includes('Allen') || qb.name.includes('Burrow') || qb.name.includes('Herbert') || qb.name.includes('Hurts'))) {
    // Only log occasionally to avoid console spam
    if (Math.random() < 0.1) { // 10% chance to log
      console.log(`🎯 QEI ${qb.name} (${includePlayoffs ? 'WITH' : 'WITHOUT'} playoffs):`);
      console.log(`🎯 Team(${baseScores.team.toFixed(1)}) Stats(${baseScores.stats.toFixed(1)}) Clutch(${baseScores.clutch.toFixed(1)}) Durability(${baseScores.durability.toFixed(1)})`);
      if (weights.support > 0) {
        const supportWeight = weights.support / totalWeight;
        if (allQBBaseScores.length > 0) {
          const avgSupportScore = allQBBaseScores.reduce((sum, qbScores) => sum + qbScores.support, 0) / allQBBaseScores.length;
          const supportDifference = avgSupportScore - baseScores.support;
          const supportAdjustment = Math.max(-15, Math.min(15, supportDifference * 0.3));
          console.log(`🎯 Support: Quality(${baseScores.support.toFixed(1)}) vs Avg(${avgSupportScore.toFixed(1)}) -> Adj(${supportAdjustment.toFixed(1)})`);
        }
        if (supportWeight > 0.5) {
          console.log(`🎯 Support-dominant (${(supportWeight*100).toFixed(0)}%) -> Normalization boost applied`);
        }
      }
      console.log(`🎯 Base(${baseWeightedScore.toFixed(1)}) -> Raw(${rawWeightedScore.toFixed(1)}) -> Experience(${experienceModifier.toFixed(2)}) -> Final(${adjustedScore.toFixed(1)})`);
    }
  }
   
  // Return the natural score without artificial capping - let the best QBs rise to the top
  return Math.max(0, adjustedScore);
};