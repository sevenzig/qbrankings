// QB calculation utility functions
import {
  calculateTeamScore,
  calculateStatsScore,
  calculateClutchScore,
  calculateDurabilityScore,
  calculateSupportScore
} from '../components/scoringCategories/index.js';





export const calculateQBMetrics = (qb, supportWeights = { offensiveLine: 55, weapons: 30, defense: 15 }, statsWeights = { efficiency: 45, protection: 25, volume: 30 }, teamWeights = { regularSeason: 65, playoff: 35 }, clutchWeights = { gameWinningDrives: 40, fourthQuarterComebacks: 25, clutchRate: 15, playoffBonus: 20 }, includePlayoffs = true, include2024Only = false, efficiencyWeights = { anyA: 45, tdPct: 30, completionPct: 25 }, protectionWeights = { sackPct: 60, turnoverRate: 40 }, volumeWeights = { passYards: 25, passTDs: 25, rushYards: 20, rushTDs: 15, totalAttempts: 15 }, durabilityWeights = { availability: 75, consistency: 25 }) => {
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
  const statsScore = calculateStatsScore(qbSeasonData, statsWeights, includePlayoffs, include2024Only, efficiencyWeights, protectionWeights, volumeWeights);
  
  // Calculate Clutch Score
  const clutchScore = calculateClutchScore(qbSeasonData, includePlayoffs, clutchWeights, include2024Only);
  
  // Calculate Durability Score
  const durabilityScore = calculateDurabilityScore(qbSeasonData, includePlayoffs, include2024Only, durabilityWeights);
  
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

  // Apply penalty for limited playing time (3 or fewer starts in any year)
  let limitedPlayTimePenalty = 1.0; // No penalty by default
  
  if (qb.seasonData && Array.isArray(qb.seasonData)) {
    const yearWeights = { 2024: 0.60, 2023: 0.30, 2022: 0.10 };
    let penaltyMultiplier = 1.0;
    
    qb.seasonData.forEach(season => {
      const year = season.year;
      const gamesStarted = season.gamesStarted || 0;
      const yearWeight = yearWeights[year] || 0;
      
      // Apply penalty for years with 3 or fewer starts
      if (yearWeight > 0 && gamesStarted <= 3) {
        // Calculate penalty based on year importance and severity of limited play
        let yearPenalty = 1.0;
        
        if (gamesStarted === 0) {
          // No games started: significant penalty based on year weight
          yearPenalty = 1.0 - (yearWeight * 0.40); // Up to 24% penalty for missing 2024 entirely
        } else if (gamesStarted <= 3) {
          // 1-3 games: moderate penalty scaled by year weight and games played
          const gamesFactor = (4 - gamesStarted) / 4; // 0.75 for 1 game, 0.50 for 2 games, 0.25 for 3 games
          yearPenalty = 1.0 - (yearWeight * 0.25 * gamesFactor); // Up to 15% penalty for 1 game in 2024
        }
        
        penaltyMultiplier *= yearPenalty;
        
        // Debug logging for significant penalties
        if ((yearWeight >= 0.30 && gamesStarted <= 3) || gamesStarted === 0) {
          console.log(`⚠️ LIMITED PLAY PENALTY - ${qb.name}: ${year} (${gamesStarted} starts) -> ${((1 - yearPenalty) * 100).toFixed(1)}% penalty`);
        }
      }
    });
    
    limitedPlayTimePenalty = penaltyMultiplier;
  }
  
  // CORRECTED SUPPORT & DURABILITY INTEGRATION: Balanced normalization without deflation
  let finalScore = 0;
  
  // Calculate base performance score (excluding contextual adjustments: support, durability)
  const basePerformanceComponents = [
    { score: baseScores.team, weight: weights.team },
    { score: baseScores.stats, weight: weights.stats },
    { score: baseScores.clutch, weight: weights.clutch }
  ].filter(component => component.weight > 0);
  
  const basePerformanceWeight = basePerformanceComponents.reduce((sum, comp) => sum + comp.weight, 0);
  const basePerformanceScore = basePerformanceComponents.reduce((sum, comp) => sum + (comp.score * comp.weight), 0) / Math.max(1, basePerformanceWeight);
  
  if ((weights.support > 0 || weights.durability > 0) && allQBBaseScores.length > 0 && basePerformanceWeight > 0) {
    // Calculate league averages for proper normalization
    const avgSupportScore = allQBBaseScores.reduce((sum, qbScores) => sum + qbScores.support, 0) / allQBBaseScores.length;
    const avgDurabilityScore = allQBBaseScores.reduce((sum, qbScores) => sum + qbScores.durability, 0) / allQBBaseScores.length;
    
    let adjustmentFactor = 1.0;
    
    // CONTEXTUAL SUPPORT ADJUSTMENT
    if (weights.support > 0) {
      const supportDifference = baseScores.support - avgSupportScore; // Positive = better than average support
      
      // AGGRESSIVE REBALANCING: Strong boost for poor support, moderate penalty for good support
      // Range: 0.60 to 1.50 (±40% max adjustment for meaningful rebalancing)
      // Poor support gets major bonus (factor up to 1.50), good support gets moderate penalty (factor down to 0.60)
      const supportAdjustmentStrength = 0.012; // Doubled sensitivity for stronger effect
      let supportAdjustmentFactor = 1.0 - (supportDifference * supportAdjustmentStrength);
      
      // Apply asymmetric scaling: More generous boosts for poor support, more conservative penalties for good support
      if (supportAdjustmentFactor > 1.0) {
        // Poor support bonus: Scale up more aggressively (up to +50%)
        supportAdjustmentFactor = Math.min(1.50, 1.0 + ((supportAdjustmentFactor - 1.0) * 1.5));
      } else {
        // Good support penalty: Scale down more conservatively (down to -40%)
        supportAdjustmentFactor = Math.max(0.60, supportAdjustmentFactor);
      }
      
      // Apply support adjustment based on support weight
      const supportWeight = weights.support / totalWeight;
      adjustmentFactor = (adjustmentFactor * (1 - supportWeight)) + (supportAdjustmentFactor * supportWeight);
    }
    
    // CONTEXTUAL DURABILITY ADJUSTMENT
    if (weights.durability > 0) {
      const durabilityDifference = baseScores.durability - avgDurabilityScore; // Positive = better than average durability
      
      // Create adjustment factor for durability
      // Range: 0.85 to 1.15 (±15% max adjustment)
      // Poor durability gets penalty (factor < 1.0), good durability gets bonus (factor > 1.0)
      const durabilityAdjustmentStrength = 0.004; // Slightly less sensitive than support
      const durabilityAdjustmentFactor = Math.max(0.85, Math.min(1.15, 1.0 + (durabilityDifference * durabilityAdjustmentStrength)));
      
      // Apply durability adjustment based on durability weight
      const durabilityWeight = weights.durability / totalWeight;
      adjustmentFactor = (adjustmentFactor * (1 - durabilityWeight)) + (durabilityAdjustmentFactor * durabilityWeight);
    }
    
    // Calculate adjusted performance score
    const adjustedPerformanceScore = basePerformanceScore * adjustmentFactor;
    
    // TRUE REBALANCING: Use the full adjusted performance as the final score
    // This ensures that contextual adjustments actually redistribute scores rather than just reduce them
    finalScore = adjustedPerformanceScore;
    
    // Debug for significant cases
    if (qb?.name && (qb.name.includes('Mahomes') || qb.name.includes('Allen') || qb.name.includes('Burrow') || qb.name.includes('Herbert') || qb.name.includes('Hurts') || Math.random() < 0.05)) {
      const supportAdjustmentType = weights.support > 0 ? (baseScores.support > avgSupportScore ? 'PENALTY' : 'BONUS') : 'N/A';
      const durabilityAdjustmentType = weights.durability > 0 ? (baseScores.durability > avgDurabilityScore ? 'BONUS' : 'PENALTY') : 'N/A';
      const supportAdjustmentMagnitude = weights.support > 0 ? Math.abs(1.0 - adjustmentFactor) * 100 : 0;
      console.log(`🎯 AGGRESSIVE REBALANCING ${qb.name}:`);
      console.log(`🎯   Support: Quality(${baseScores.support.toFixed(1)}) vs Avg(${avgSupportScore.toFixed(1)}) -> ${supportAdjustmentType} (${supportAdjustmentMagnitude.toFixed(1)}%)`);
      console.log(`🎯   Durability: Quality(${baseScores.durability.toFixed(1)}) vs Avg(${avgDurabilityScore.toFixed(1)}) -> ${durabilityAdjustmentType}`);
      console.log(`🎯   Combined Adjustment Factor: ${adjustmentFactor.toFixed(3)} (${adjustmentFactor > 1.0 ? '+' : ''}${((adjustmentFactor - 1.0) * 100).toFixed(1)}%)`);
      console.log(`🎯   Base Perf(${basePerformanceScore.toFixed(1)}) * Factor(${adjustmentFactor.toFixed(3)}) = Adjusted(${adjustedPerformanceScore.toFixed(1)})`);
    }
  } else {
    // No contextual weighting, no comparison data, or no base performance components - use standard weighted average
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
      (baseScores.clutch * weights.clutch)
    ) / Math.max(1, totalWeight - weights.team - weights.support - weights.durability);
    
    const regularSeasonBoost = Math.min(12, nonTeamScore * 0.15); // Up to 12 point boost
    adjustedScore += regularSeasonBoost;
  } else {
    // REGULAR SEASON ONLY MODE: Enhanced boost to compensate for missing playoff bonuses
    const nonTeamScore = (
      (baseScores.stats * weights.stats) +
      (baseScores.clutch * weights.clutch)
    ) / Math.max(1, totalWeight - weights.team - weights.support - weights.durability);
    
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
   
  // Apply limited play time penalty
  adjustedScore *= limitedPlayTimePenalty;
  
  // Debug logging for significant penalties
  if (limitedPlayTimePenalty < 0.95 && qb?.name) {
    const penaltyPercent = ((1 - limitedPlayTimePenalty) * 100).toFixed(1);
    console.log(`⚠️ TOTAL LIMITED PLAY PENALTY - ${qb.name}: ${penaltyPercent}% reduction (Final QEI: ${adjustedScore.toFixed(1)})`);
  }
  
  // Return the natural score without artificial capping - let the best QBs rise to the top
  return Math.max(0, adjustedScore);
};