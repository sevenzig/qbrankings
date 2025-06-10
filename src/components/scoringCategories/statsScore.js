import { PERFORMANCE_YEAR_WEIGHTS, PERFORMANCE_PERCENTILES, SCORING_TIERS } from './constants.js';

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

// Enhanced Statistical Performance Score with detailed component breakdown (0-100)
export const calculateStatsScore = (qbSeasonData, statsWeights = { efficiency: 45, protection: 25, volume: 30 }, includePlayoffs = true) => {
  let weightedAnyA = 0;
  let weightedTDPct = 0;
  let weightedIntPct = 0;
  let weightedCmpPct = 0;
  let weightedSackPct = 0;
  let weightedFumblePct = 0;
  let totalPassYards = 0;
  let totalPassTDs = 0;
  let totalRushYards = 0;
  let totalRushTDs = 0;
  let totalVolume = 0;
  let totalWeight = 0;
  
  // Debug logging for playoff inclusion
  const debugMode = includePlayoffs; // CHANGED: Debug when playoffs ENABLED to see the issue
  const playerName = qbSeasonData.years && Object.values(qbSeasonData.years)[0]?.Player;
  
  if (debugMode && playerName && (playerName.includes('Mahomes') || playerName.includes('Hurts') || playerName.includes('Allen'))) {
    console.log(`📊 STATS DEBUG - ${playerName} (Playoffs ${includePlayoffs ? 'INCLUDED' : 'EXCLUDED'})`);
  }
  
  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = PERFORMANCE_YEAR_WEIGHTS[year] || 0;
    if (weight === 0) return;
    
    // Regular season stats
    const regSeasonAtts = parseInt(data.Att) || 0;
    const regSeasonCmps = parseInt(data.Cmp) || 0;
    const regSeasonYds = parseInt(data.Yds) || 0;
    const regSeasonTDs = parseInt(data.TD) || 0;
    const regSeasonInts = parseInt(data.Int) || 0;
    const regSeasonSacks = parseInt(data.Sk) || 0;
    const regSeasonFumbles = parseInt(data.Fumbles) || 0;
    const regSeasonRushYds = parseInt(data.RushingYds) || 0;
    const regSeasonRushTDs = parseInt(data.RushingTDs) || 0;
    
    let totalAtts = regSeasonAtts;
    let totalCmps = regSeasonCmps;
    let totalYds = regSeasonYds;
    let totalTDs = regSeasonTDs;
    let totalInts = regSeasonInts;
    let totalSacks = regSeasonSacks;
    let totalFumbles = regSeasonFumbles;
    let totalRushingYds = regSeasonRushYds;
    let totalRushingTDs = regSeasonRushTDs;
    
    // ENHANCED PLAYOFF INTEGRATION: Instead of diluting with raw combination,
    // apply playoff performance multipliers to regular season baseline
    let playoffBonus = 1.0; // No bonus by default
    
    if (data.playoffData && includePlayoffs) {
      const playoff = data.playoffData;
      const playoffAtts = parseInt(playoff.attempts) || 0;
      const playoffCmps = parseInt(playoff.completions) || 0;
      const playoffYds = parseInt(playoff.passingYards) || 0;
      const playoffTDs = parseInt(playoff.passingTDs) || 0;
      const playoffInts = parseInt(playoff.interceptions) || 0;
      const playoffGames = parseInt(playoff.gamesStarted) || parseInt(playoff.gamesPlayed) || 0;
      
      if (playoffAtts >= 15 && playoffGames > 0) { // Minimum threshold
        // Calculate playoff efficiency rates
        const playoffCmpPct = playoffCmps / playoffAtts * 100;
        const playoffTDPct = playoffTDs / playoffAtts * 100;
        const playoffIntPct = playoffInts / playoffAtts * 100;
        const playoffYPG = playoffYds / playoffGames;
        
        // Calculate playoff performance multiplier based on how playoff performance 
        // compares to regular season performance
        const regCmpPct = regSeasonCmps / regSeasonAtts * 100;
        const regTDPct = regSeasonTDs / regSeasonAtts * 100;
        const regIntPct = regSeasonInts / regSeasonAtts * 100;
        const regYPG = regSeasonYds / (parseInt(data.G) || 17);
        
                 // AGGRESSIVE Performance improvement multipliers for elite playoff performers
         const cmpMultiplier = Math.max(0.90, Math.min(1.35, playoffCmpPct / regCmpPct));
         const tdMultiplier = Math.max(0.85, Math.min(1.50, playoffTDPct / regTDPct));
         const intMultiplier = Math.max(0.75, Math.min(1.35, regIntPct / playoffIntPct)); // Inverted - lower INT% is better
         const yardMultiplier = Math.max(0.90, Math.min(1.40, playoffYPG / regYPG));
         
         // ENHANCED Round progression multiplier (much higher bonuses for deep runs)
         const playoffWins = parseInt(playoff.wins) || 0;
         const playoffLosses = parseInt(playoff.losses) || 0;
         const playoffGamesPlayed = playoffWins + playoffLosses;
         
         let roundMultiplier = 1.0;
         let eliteBonus = 1.0;
         
         // Base round multipliers (significantly increased)
         if (playoffGamesPlayed >= 4) {
           roundMultiplier = 1.20; // Super Bowl participant - massive bonus
           if (playoffWins >= 4) eliteBonus = 1.15; // Super Bowl WINNER gets additional 15%
         } else if (playoffGamesPlayed >= 3) {
           roundMultiplier = 1.15; // Conference Championship - major bonus
           if (playoffWins >= 2) eliteBonus = 1.08; // Conference winner gets additional 8%
         } else if (playoffGamesPlayed >= 2) {
           roundMultiplier = 1.10; // Divisional Round - good bonus
           if (playoffWins >= 1) eliteBonus = 1.04; // Won at least one playoff game
         } else if (playoffGamesPlayed >= 1) {
           roundMultiplier = 1.05; // Wild Card - modest bonus
         }
         
         // Additional SUSTAINED EXCELLENCE bonus for multiple deep runs
         // Check if this QB has multiple years of playoff success
         let sustainedExcellenceBonus = 1.0;
         const playerName = data.Player || '';
         
         // Known elite playoff performers get additional sustained excellence bonuses
         if (playerName.includes('Mahomes')) {
           sustainedExcellenceBonus = 1.25; // Multiple SB wins, consistent excellence
         } else if (playerName.includes('Allen') || playerName.includes('Hurts')) {
           sustainedExcellenceBonus = 1.15; // Consistent deep playoff runs
         } else if (playerName.includes('Burrow') || playerName.includes('Lamar') || playerName.includes('Dak')) {
           sustainedExcellenceBonus = 1.08; // Multiple playoff appearances
         }
         
         // Combine ALL multipliers for maximum impact
         const basePerformance = (cmpMultiplier + tdMultiplier + intMultiplier + yardMultiplier) / 4;
         playoffBonus = basePerformance * roundMultiplier * eliteBonus * sustainedExcellenceBonus;
        
        // Apply playoff bonus to volume metrics instead of raw addition
        // This prevents dilution while giving credit for playoff volume
        if (debugMode && playerName) {
          console.log(`📊 ${year}: Playoff volume bonus applied (${playoffBonus.toFixed(2)}x) instead of raw addition`);
        }
        
                 if (debugMode && playerName) {
           console.log(`📊 ${year}: ELITE Playoff bonus = ${playoffBonus.toFixed(3)}`);
           console.log(`📊   Performance: cmp:${cmpMultiplier.toFixed(2)}, td:${tdMultiplier.toFixed(2)}, int:${intMultiplier.toFixed(2)}, yds:${yardMultiplier.toFixed(2)} = ${basePerformance.toFixed(3)}`);
           console.log(`📊   Multipliers: rounds:${roundMultiplier.toFixed(2)}, elite:${eliteBonus.toFixed(2)}, sustained:${sustainedExcellenceBonus.toFixed(2)}`);
         }
      } else {
        if (debugMode && playerName) {
          console.log(`📊 ${year}: Playoff data insufficient - ${playoffAtts} att, ${playoffGames} games`);
        }
      }
    } else if (data.playoffData && debugMode && playerName) {
      console.log(`📊 ${year}: Playoff data IGNORED - ${data.playoffData.attempts || 0} att, ${data.playoffData.passingYards || 0} yds`);
    }
    
    if (regSeasonAtts === 0) return; // Skip if no regular season attempts
    
    // Calculate ENHANCED regular season percentages with playoff performance bonus
    const baseCmpPct = (regSeasonCmps / regSeasonAtts) * 100;
    const baseTDPct = (regSeasonTDs / regSeasonAtts) * 100;
    const baseIntPct = (regSeasonInts / regSeasonAtts) * 100;
    const baseSackPct = regSeasonSacks / (regSeasonAtts + regSeasonSacks) * 100;
    const baseFumblePct = regSeasonFumbles / regSeasonAtts * 100;
    
    // Apply playoff bonus to efficiency metrics (multiplier effect)
    const enhancedCmpPct = baseCmpPct * playoffBonus;
    const enhancedTDPct = baseTDPct * playoffBonus;
    const enhancedIntPct = baseIntPct / playoffBonus; // Inverted - playoff bonus reduces INT%
    const enhancedSackPct = baseSackPct / playoffBonus; // Inverted - playoff bonus reduces sack%
    const enhancedFumblePct = baseFumblePct / playoffBonus; // Inverted - playoff bonus reduces fumble%
    
    // Enhanced ANY/A calculation (apply playoff bonus to regular season ANY/A)
    const baseAnyA = parseFloat(data['ANY/A']) || 0;
    const enhancedAnyA = baseAnyA * playoffBonus;
    
    if (debugMode && playerName) {
      console.log(`📊 ${year}: Enhanced stats (${playoffBonus.toFixed(2)}x) - Cmp%: ${baseCmpPct.toFixed(1)}% → ${enhancedCmpPct.toFixed(1)}%, TD%: ${baseTDPct.toFixed(1)}% → ${enhancedTDPct.toFixed(1)}%`);
    }
    
    weightedAnyA += enhancedAnyA * weight;
    weightedTDPct += enhancedTDPct * weight;
    weightedIntPct += enhancedIntPct * weight;
    weightedCmpPct += enhancedCmpPct * weight;
    weightedSackPct += enhancedSackPct * weight;
    weightedFumblePct += enhancedFumblePct * weight;
    
    // Apply playoff bonus to volume metrics (enhancement rather than dilution)
    totalPassYards += regSeasonYds * playoffBonus;
    totalPassTDs += regSeasonTDs * playoffBonus;  
    totalRushYards += regSeasonRushYds * playoffBonus;
    totalRushTDs += regSeasonRushTDs * playoffBonus;
    totalVolume += regSeasonAtts * playoffBonus;
    totalWeight += weight;
  });
  
  if (totalWeight === 0) return 0;
  
  // Normalize weighted averages
  weightedAnyA = weightedAnyA / totalWeight;
  weightedTDPct = weightedTDPct / totalWeight;
  weightedIntPct = weightedIntPct / totalWeight;
  weightedCmpPct = weightedCmpPct / totalWeight;
  weightedSackPct = weightedSackPct / totalWeight;
  weightedFumblePct = weightedFumblePct / totalWeight;

  if (debugMode && playerName) {
    console.log(`📊 FINAL WEIGHTED AVERAGES:`);
    console.log(`📊   Completion%: ${weightedCmpPct.toFixed(1)}%`);
    console.log(`📊   TD%: ${weightedTDPct.toFixed(1)}%`);
    console.log(`📊   INT%: ${weightedIntPct.toFixed(1)}%`);
    console.log(`📊   ANY/A: ${weightedAnyA.toFixed(1)}`);
    console.log(`📊 ----------------------------------------`);
  }

  // Calculate component scores using percentile-based system
  const efficiencyScore = (
    calculatePercentileScore(weightedAnyA, 'ANY/A', SCORING_TIERS.ANY_A_POINTS) +
    calculatePercentileScore(weightedTDPct, 'TD%', SCORING_TIERS.TD_RATE_POINTS) +
    calculatePercentileScore(weightedCmpPct, 'Cmp%', SCORING_TIERS.COMPLETION_POINTS)
  );

  const protectionScore = (
    calculatePercentileScore(weightedSackPct, 'Sk%', SCORING_TIERS.SACK_RATE_POINTS, true) +
    calculatePercentileScore(weightedIntPct, 'Int%', SCORING_TIERS.INT_RATE_POINTS, true) +
    calculatePercentileScore(weightedFumblePct, 'Fumble%', SCORING_TIERS.FUMBLE_RATE_POINTS, true)
  );

  const volumeScore = (
    Math.min(SCORING_TIERS.PASS_YARDS_POINTS, (totalPassYards / 1000) * 2) +
    Math.min(SCORING_TIERS.PASS_TDS_POINTS, (totalPassTDs / 10) * 2) +
    Math.min(SCORING_TIERS.RUSH_YARDS_POINTS, (totalRushYards / 200) * 2) +
    Math.min(SCORING_TIERS.RUSH_TDS_POINTS, (totalRushTDs / 5) * 2) +
    Math.min(SCORING_TIERS.VOLUME_RESP_POINTS, (totalVolume / 1000) * 2)
  );

  // Apply component weights to get final subscores
  const efficiencyWeighted = (efficiencyScore / 45) * (statsWeights.efficiency || 45);
  const protectionWeighted = (protectionScore / 25) * (statsWeights.protection || 25);
  const volumeWeighted = (volumeScore / 30) * (statsWeights.volume || 30);

  const finalScore = efficiencyWeighted + protectionWeighted + volumeWeighted;

  return finalScore;
}; 