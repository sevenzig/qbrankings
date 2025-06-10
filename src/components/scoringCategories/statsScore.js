import { YEAR_WEIGHTS, PERFORMANCE_PERCENTILES, SCORING_TIERS } from './constants.js';

// Linear percentile scoring function
const calculatePercentileScore = (value, metric, maxPoints, inverted = false) => {
  const percentiles = PERFORMANCE_PERCENTILES[metric];
  if (!percentiles) return 0;
  
  let scoreMultiplier;
  
  if (inverted) {
    // Lower values are better (Sack%, Int%, Fumble%)
    if (value <= percentiles.p95) scoreMultiplier = 1.0;       // Elite: 100%
    else if (value <= percentiles.p90) scoreMultiplier = 0.90; // Very Good: 90%
    else if (value <= percentiles.p75) scoreMultiplier = 0.80; // Good: 80%
    else if (value <= percentiles.p50) scoreMultiplier = 0.65; // Average: 65%
    else if (value <= percentiles.p25) scoreMultiplier = 0.50; // Below Average: 50%
    else if (value <= percentiles.p10) scoreMultiplier = 0.35; // Poor: 35%
    else scoreMultiplier = 0.20; // Very Poor: 20%
  } else {
    // Higher values are better (ANY/A, TD%, Comp%)
    if (value >= percentiles.p95) scoreMultiplier = 1.0;       // Elite: 100%
    else if (value >= percentiles.p90) scoreMultiplier = 0.90; // Very Good: 90%
    else if (value >= percentiles.p75) scoreMultiplier = 0.80; // Good: 80%
    else if (value >= percentiles.p50) scoreMultiplier = 0.65; // Average: 65%
    else if (value >= percentiles.p25) scoreMultiplier = 0.50; // Below Average: 50%
    else if (value >= percentiles.p10) scoreMultiplier = 0.35; // Poor: 35%
    else scoreMultiplier = 0.20; // Very Poor: 20%
  }
  
  return scoreMultiplier * maxPoints;
};

// Volume scoring functions
const calculateVolumeScore = (qbStats) => {
  const passYardsScore = Math.max(0, Math.min(SCORING_TIERS.PASS_YARDS_POINTS, 
    (qbStats.passYards - 3500) / 312.5 * 2 + 4));
    
  const passTDsScore = Math.max(0, Math.min(SCORING_TIERS.PASS_TDS_POINTS,
    (qbStats.passTDs - 25) / 3.57 * 2 + 3.5));
    
  const volumeRespScore = Math.max(0, Math.min(SCORING_TIERS.VOLUME_RESP_POINTS,
    (qbStats.attPerGame - 30) * 0.25 + 2.5));
    
  const rushTDsScore = Math.max(0, Math.min(SCORING_TIERS.RUSH_TDS_POINTS,
    qbStats.rushTDsPerGame * 8));
    
  const rushYardsScore = Math.max(0, Math.min(SCORING_TIERS.RUSH_YARDS_POINTS,
    (qbStats.rushYPG - 15) * 0.2));
    
  return passYardsScore + passTDsScore + volumeRespScore + rushTDsScore + rushYardsScore;
};

const calculateTurnoverBurden = (totalTurnovers) => {
  if (totalTurnovers <= 8) return 2;        // Excellent
  if (totalTurnovers <= 10) return 1;       // Good
  if (totalTurnovers <= 12) return 0;       // Average
  if (totalTurnovers <= 14) return -1;      // Poor
  if (totalTurnovers <= 17) return -2;      // Very Poor
  return -3;                                // Terrible
};

// Main scoring function with 45/25/30 distribution
export const calculateStatsScore = (qbSeasonData) => {
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = YEAR_WEIGHTS[year] || 0;
    if (weight === 0) return;
    
    // Extract and calculate all required metrics
    const attempts = parseFloat(data.Att) || 0;
    const completions = parseFloat(data.Cmp) || 0;
    const passingYards = parseFloat(data.Yds) || 0;
    const passingTDs = parseFloat(data.TD) || 0;
    const interceptions = parseFloat(data.Int) || 0;
    const sacks = parseFloat(data.Sk) || 0;
    const games = Math.max(1, parseFloat(data.G) || 1);
    const rushingYards = parseFloat(data.RushingYds) || 0;
    const rushingTDs = parseFloat(data.RushingTDs) || 0;
    const fumbles = parseFloat(data.Fumbles) || 0;
    
    // Calculate percentages and rates
    const rushAttempts = parseFloat(data.RushAtt) || parseFloat(data.Att_1) || 0; // Handle different CSV column names
    const totalAttempts = attempts + rushAttempts; // Total passing + rushing attempts
    
    const anyA = parseFloat(data['ANY/A']) || 0;
    const completionPct = attempts > 0 ? (completions / attempts) * 100 : 0;
    const tdPct = attempts > 0 ? (passingTDs / attempts) * 100 : 0;
    const intPct = attempts > 0 ? (interceptions / attempts) * 100 : 0;
    const sackRate = (attempts + sacks) > 0 ? (sacks / (attempts + sacks)) * 100 : 0;
    const fumblePct = totalAttempts > 0 ? (fumbles / totalAttempts) * 100 : 0; // Fumbles per total attempts
    
    // Per-game metrics
    const attPerGame = attempts / games;
    const rushTDsPerGame = rushingTDs / games;
    const rushYPG = rushingYards / games;
    const totalTurnovers = interceptions + fumbles;
    
    // TIER 1: Core Efficiency (45 points)
    const anyAScore = calculatePercentileScore(anyA, 'ANY/A', SCORING_TIERS.ANY_A_POINTS);
    const tdRateScore = calculatePercentileScore(tdPct, 'TD%', SCORING_TIERS.TD_RATE_POINTS);
    const compScore = calculatePercentileScore(completionPct, 'Cmp%', SCORING_TIERS.COMPLETION_POINTS);
    
    // TIER 2: Decision Making & Protection (25 points)
    const sackScore = calculatePercentileScore(sackRate, 'Sk%', SCORING_TIERS.SACK_RATE_POINTS, true);
    const intScore = calculatePercentileScore(intPct, 'Int%', SCORING_TIERS.INT_RATE_POINTS, true);
    const fumbleScore = calculatePercentileScore(fumblePct, 'Fumble%', SCORING_TIERS.FUMBLE_RATE_POINTS, true);
    
    // TIER 3: Volume & Production (30 points)
    const volumeScore = calculateVolumeScore({
      passYards: passingYards,
      passTDs: passingTDs,
      attPerGame: attPerGame,
      rushTDsPerGame: rushTDsPerGame,
      rushYPG: rushYPG
    });
    
    // Turnover burden adjustment
    const turnoverBurden = calculateTurnoverBurden(totalTurnovers);
    
    // Calculate total score
    const seasonScore = anyAScore + tdRateScore + compScore + 
                       sackScore + intScore + fumbleScore + 
                       volumeScore + turnoverBurden;
    
    // Debug output for key players
    if (data.Player && (seasonScore > 85 || seasonScore < 35 || 
        data.Player.includes('Mahomes') || data.Player.includes('Jackson') || 
        data.Player.includes('Darnold') || data.Player.includes('Levis'))) {
      console.log(`📊 ${data.Player} ${year} PERCENTILE SCORING:`);
      console.log(`  Efficiency (45): ANY/A ${anyA.toFixed(2)} (${anyAScore.toFixed(1)}) + TD% ${tdPct.toFixed(1)} (${tdRateScore.toFixed(1)}) + Comp% ${completionPct.toFixed(1)} (${compScore.toFixed(1)}) = ${(anyAScore + tdRateScore + compScore).toFixed(1)}`);
      console.log(`  Protection (25): Sack% ${sackRate.toFixed(1)} (${sackScore.toFixed(1)}) + Int% ${intPct.toFixed(1)} (${intScore.toFixed(1)}) + Fum% ${fumblePct.toFixed(1)} (${fumbleScore.toFixed(1)}) = ${(sackScore + intScore + fumbleScore).toFixed(1)}`);
      console.log(`  Volume (30): ${volumeScore.toFixed(1)} | Turnover Burden: ${turnoverBurden}`);
      console.log(`  TOTAL: ${seasonScore.toFixed(1)}/100 points`);
    }
    
    totalWeightedScore += seasonScore * weight;
    totalWeight += weight;
  });
  
  if (totalWeight === 0) return 0;
  
  const finalScore = totalWeightedScore / totalWeight;
  return Math.max(0, Math.min(100, finalScore));
}; 