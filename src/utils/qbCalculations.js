// QB calculation utility functions
import {
  calculateTeamScore,
  calculateStatsScore,
  calculateClutchScore,
  calculateDurabilityScore,
  calculateSupportScore
} from '../components/scoringCategories/index.js';

export const calculateQBMetrics = (qb) => {
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
        Team: season.team,
        Player: qb.name,
        Age: season.age,
        
        // Add rushing data
        RushingYds: season.rushingYards || 0,
        RushingTDs: season.rushingTDs || 0,
        Fumbles: season.fumbles || 0,
        
        // Add playoff data if available
        playoffData: season.playoffData || null
      };
    });
  }

  // Calculate Team Score
  const teamScore = calculateTeamScore(qbSeasonData);
  
  // Calculate Stats Score using season data
  const statsScore = calculateStatsScore(qbSeasonData);
  
  // Calculate Clutch Score
  const clutchScore = calculateClutchScore(qbSeasonData);
  
  // Calculate Durability Score
  const durabilityScore = calculateDurabilityScore(qbSeasonData);
  
  // Calculate Support Score (difficulty adjustment) - pass full QB object for multi-team support
  const supportScore = calculateSupportScore(qb);
  
  return {
    team: teamScore,
    stats: statsScore,
    clutch: clutchScore,
    durability: durabilityScore,
    support: supportScore
  };
};

export const calculateQEI = (baseScores, qb, weights) => {
  // Calculate total weight for normalization
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  
  if (totalWeight === 0) return 0;
  
  // Calculate pure weighted average (0-100 scale already from baseScores)
  const rawWeightedScore = (
    (baseScores.team * weights.team) +
    (baseScores.stats * weights.stats) +
    (baseScores.clutch * weights.clutch) +
    (baseScores.durability * weights.durability) +
    (baseScores.support * weights.support)
  ) / totalWeight;
  
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
  
  // Only apply elite bonus if multiple categories are weighted (comprehensive evaluation)
  // For pure Stats+Support evaluations, keep it simple
  const weightedCategories = Object.values(weights).filter(w => w > 0).length;
  if (weightedCategories > 2 && adjustedScore >= 85) {
    // Elite tier: enhance differences at the top (only for comprehensive evaluations)
    const eliteBonus = Math.pow((adjustedScore - 85) / 15, 1.2) * 5; // Max 5 point boost
    adjustedScore = Math.min(100, adjustedScore + eliteBonus);
  }
  
  // Reduced debug logging for key QBs - only log when weights change significantly
  if (qb?.name && (qb.name.includes('Mahomes') || qb.name.includes('Allen') || qb.name.includes('Burrow') || qb.name.includes('Herbert') || qb.name.includes('Hurts'))) {
    // Only log occasionally to avoid console spam
    if (Math.random() < 0.1) { // 10% chance to log
      console.log(`🎯 QEI ${qb.name}: Team(${baseScores.team.toFixed(1)}) Stats(${baseScores.stats.toFixed(1)}) Clutch(${baseScores.clutch.toFixed(1)}) Durability(${baseScores.durability.toFixed(1)}) Support(${baseScores.support.toFixed(1)})`);
      console.log(`🎯 Weights: Team(${weights.team}%) Stats(${weights.stats}%) Clutch(${weights.clutch}%) Durability(${weights.durability}%) Support(${weights.support}%)`);
      console.log(`🎯 Raw(${rawWeightedScore.toFixed(1)}) -> Experience(${experienceModifier.toFixed(2)}) -> Final(${adjustedScore.toFixed(1)})`);
    }
  }
  
  // Return the natural score without artificial capping - let the best QBs rise to the top
  return Math.max(0, Math.min(100, adjustedScore));
}; 