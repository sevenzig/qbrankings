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
export const calculateStatsScore = (qbSeasonData, statsWeights = { efficiency: 45, protection: 25, volume: 30 }, includePlayoffs = true, include2024Only = false) => {
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
  let playoffAdjustmentFactor = 1.0; // Default: no playoff adjustment
  
  // Debug logging for playoff inclusion
  const debugMode = includePlayoffs;
  const playerName = qbSeasonData.years && Object.values(qbSeasonData.years)[0]?.Player;
  
  if (debugMode && playerName && (playerName.includes('Mahomes') || playerName.includes('Hurts') || playerName.includes('Allen'))) {
    console.log(`📊 STATS DEBUG - ${playerName} (Playoffs ${includePlayoffs ? 'ADJUSTMENT MODE' : 'EXCLUDED'})`);
  }
  
  // First Pass: Calculate strong regular season base scores
  // In 2024-only mode, only process 2024 data with 100% weight
  const yearWeights = include2024Only ? { '2024': 1.0 } : PERFORMANCE_YEAR_WEIGHTS;
  
  Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
    const weight = yearWeights[year] || 0;
    if (weight === 0) return;
    
    // Regular season stats only for base calculation
    const regSeasonAtts = parseInt(data.Att) || 0;
    const regSeasonCmps = parseInt(data.Cmp) || 0;
    const regSeasonYds = parseInt(data.Yds) || 0;
    const regSeasonTDs = parseInt(data.TD) || 0;
    const regSeasonInts = parseInt(data.Int) || 0;
    const regSeasonSacks = parseInt(data.Sk) || 0;
    const regSeasonRushYds = parseInt(data.RushingYds) || 0;
    const regSeasonRushTDs = parseInt(data.RushingTDs) || 0;
    const regSeasonFumbles = parseInt(data.Fumbles) || 0;
    
    // Skip seasons with insufficient data
    if (regSeasonAtts < 100) return; // Minimum attempts threshold
    
    // Calculate regular season statistical rates
    const anyA = data['ANY/A'] || 0;
    const tdPct = regSeasonAtts > 0 ? (regSeasonTDs / regSeasonAtts) * 100 : 0;
    const intPct = regSeasonAtts > 0 ? (regSeasonInts / regSeasonAtts) * 100 : 0;
    const cmpPct = regSeasonAtts > 0 ? (regSeasonCmps / regSeasonAtts) * 100 : 0;
    const sackPct = (regSeasonAtts + regSeasonSacks) > 0 ? (regSeasonSacks / (regSeasonAtts + regSeasonSacks)) * 100 : 0;
    const fumblePct = regSeasonAtts > 0 ? (regSeasonFumbles / regSeasonAtts) * 100 : 0;
    
    // Weight and accumulate regular season stats
    weightedAnyA += anyA * weight;
    weightedTDPct += tdPct * weight;
    weightedIntPct += intPct * weight;
    weightedCmpPct += cmpPct * weight;
    weightedSackPct += sackPct * weight;
    weightedFumblePct += fumblePct * weight;
    
    totalPassYards += regSeasonYds * weight;
    totalPassTDs += regSeasonTDs * weight;
    totalRushYards += regSeasonRushYds * weight;
    totalRushTDs += regSeasonRushTDs * weight;
    totalVolume += (regSeasonYds + regSeasonRushYds) * weight;
    totalWeight += weight;
  });
  
  if (totalWeight === 0) return 0;
  
  // Normalize regular season weighted stats
  weightedAnyA = weightedAnyA / totalWeight;
  weightedTDPct = weightedTDPct / totalWeight;
  weightedIntPct = weightedIntPct / totalWeight;
  weightedCmpPct = weightedCmpPct / totalWeight;
  weightedSackPct = weightedSackPct / totalWeight;
  weightedFumblePct = weightedFumblePct / totalWeight;
  
  totalPassYards = totalPassYards / totalWeight;
  totalPassTDs = totalPassTDs / totalWeight;
  totalRushYards = totalRushYards / totalWeight;
  totalRushTDs = totalRushTDs / totalWeight;
  totalVolume = totalVolume / totalWeight;
  
  // Second Pass: Calculate playoff performance adjustment if enabled
  if (includePlayoffs) {
    let totalPlayoffWeight = 0;
    let playoffPerformanceMultiplier = 1.0;
    
    Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
      const weight = yearWeights[year] || 0;
      if (weight === 0 || !data.playoffData) return;
      
      const playoff = data.playoffData;
      const playoffAtts = parseInt(playoff.attempts) || 0;
      const playoffCmps = parseInt(playoff.completions) || 0;
      const playoffYds = parseInt(playoff.passingYards) || 0;
      const playoffTDs = parseInt(playoff.passingTDs) || 0;
      const playoffInts = parseInt(playoff.interceptions) || 0;
      const playoffGames = parseInt(playoff.gamesStarted) || parseInt(playoff.gamesPlayed) || 0;
      
      // Regular season stats for comparison
      const regSeasonAtts = parseInt(data.Att) || 0;
      const regSeasonCmps = parseInt(data.Cmp) || 0;
      const regSeasonYds = parseInt(data.Yds) || 0;
      const regSeasonTDs = parseInt(data.TD) || 0;
      const regSeasonInts = parseInt(data.Int) || 0;
      const regSeasonGames = parseInt(data.G) || 17;
      
      if (playoffAtts >= 15 && playoffGames > 0 && regSeasonAtts >= 100) {
        // Calculate playoff vs regular season performance ratios
        const playoffCmpPct = (playoffCmps / playoffAtts) * 100;
        const playoffTDPct = (playoffTDs / playoffAtts) * 100;
        const playoffIntPct = (playoffInts / playoffAtts) * 100;
        const playoffYPG = playoffYds / playoffGames;
        
        const regCmpPct = (regSeasonCmps / regSeasonAtts) * 100;
        const regTDPct = (regSeasonTDs / regSeasonAtts) * 100;
        const regIntPct = (regSeasonInts / regSeasonAtts) * 100;
        const regYPG = regSeasonYds / regSeasonGames;
        
        // Calculate performance improvement/decline ratios (capped for sanity)
        const cmpRatio = Math.max(0.85, Math.min(1.20, playoffCmpPct / Math.max(regCmpPct, 50)));
        const tdRatio = Math.max(0.80, Math.min(1.25, playoffTDPct / Math.max(regTDPct, 2)));
        const intRatio = Math.max(0.75, Math.min(1.30, regIntPct / Math.max(playoffIntPct, 1))); // Inverted - lower playoff INT% is better
        const yardRatio = Math.max(0.85, Math.min(1.20, playoffYPG / Math.max(regYPG, 150)));
        
        // Average the performance ratios
        const basePerformanceRatio = (cmpRatio + tdRatio + intRatio + yardRatio) / 4;
        
        // Apply round progression modifier (modest impact)
        const playoffWins = parseInt(playoff.wins) || 0;
        const playoffLosses = parseInt(playoff.losses) || 0;
        const totalPlayoffGames = playoffWins + playoffLosses;
        
        let roundImportanceBonus = 1.0;
        if (totalPlayoffGames >= 3 && playoffWins >= 2) {
          // Known Super Bowl results
          const knownSuperBowlWins = {
            'PHI': [2023], // Eagles won 2023 Super Bowl (Hurts)
            'KAN': [2024], // Chiefs won 2024 Super Bowl (Mahomes)
            'TAM': [2022], // Bucs won 2022 Super Bowl
            'LAR': [2022] // Rams won 2022 Super Bowl
          };
          
          if (knownSuperBowlWins[data.Team] && knownSuperBowlWins[data.Team].includes(parseInt(year))) {
            roundImportanceBonus = include2024Only ? 1.35 : 1.08; // ENHANCED 35% bonus for SB wins in 2024-only mode
          } else if (playoffWins >= 2) {
            roundImportanceBonus = include2024Only ? 1.20 : 1.04; // Enhanced 20% bonus for deep playoff runs in 2024-only mode
          }
        }
        
        // Combine performance ratio with round importance
        const seasonPlayoffMultiplier = basePerformanceRatio * roundImportanceBonus;
        playoffPerformanceMultiplier += (seasonPlayoffMultiplier - 1.0) * weight;
        totalPlayoffWeight += weight;
        
        if (debugMode && playerName) {
          console.log(`📊 ${year}: Playoff adjustment - Performance ratio: ${basePerformanceRatio.toFixed(3)}, Round bonus: ${roundImportanceBonus.toFixed(3)}, Combined: ${seasonPlayoffMultiplier.toFixed(3)}`);
        }
      }
    });
    
    // Normalize the playoff adjustment
    if (totalPlayoffWeight > 0) {
      playoffAdjustmentFactor = 1.0 + (playoffPerformanceMultiplier / totalPlayoffWeight);
      // Cap the adjustment to prevent extreme swings - RELAXED CAPS to avoid systematic deflation
      playoffAdjustmentFactor = Math.max(0.98, Math.min(1.20, playoffAdjustmentFactor));
    }
    
    if (debugMode && playerName) {
      console.log(`📊 Final playoff adjustment factor: ${playoffAdjustmentFactor.toFixed(3)}`);
    }
  }
  
  // Calculate component scores using regular season base (allows reaching elite tiers)
  // REDESIGNED: More responsive to slider weights and allows elite scores
  
  // Efficiency Component (0 to full efficiency weight)
  const anyAScore = Math.max(0, Math.min(statsWeights.efficiency * 0.5, (weightedAnyA - 4.0) * (statsWeights.efficiency * 0.08)));
  const tdPctScore = Math.max(0, Math.min(statsWeights.efficiency * 0.35, (weightedTDPct - 2.5) * (statsWeights.efficiency * 0.07)));
  const intPctScore = Math.max(0, Math.min(statsWeights.efficiency * 0.25, Math.max(0, (4.0 - weightedIntPct)) * (statsWeights.efficiency * 0.06)));
  const baseEfficiencyScore = anyAScore + tdPctScore + intPctScore;
  
  // Protection Component (0 to full protection weight)
  const sackPctScore = Math.max(0, Math.min(statsWeights.protection * 0.5, Math.max(0, (10 - weightedSackPct)) * (statsWeights.protection * 0.08)));
  const fumblePctScore = Math.max(0, Math.min(statsWeights.protection * 0.25, Math.max(0, (1.5 - weightedFumblePct)) * (statsWeights.protection * 0.15)));
  const cmpPctScore = Math.max(0, Math.min(statsWeights.protection * 0.35, (weightedCmpPct - 55) * (statsWeights.protection * 0.05)));
  const baseProtectionScore = sackPctScore + fumblePctScore + cmpPctScore;
  
  // Volume Component (0 to full volume weight) - More selective rushing rewards
  const passYardsScore = Math.max(0, Math.min(statsWeights.volume * 0.35, (totalPassYards - 2500) * (statsWeights.volume * 0.00012)));
  const passTDsScore = Math.max(0, Math.min(statsWeights.volume * 0.3, (totalPassTDs - 15) * (statsWeights.volume * 0.035)));
  
  // More selective rushing scoring - requires meaningful production to get benefits
  const rushYardsScore = Math.max(0, Math.min(statsWeights.volume * 0.2, Math.max(0, totalRushYards - 200) * (statsWeights.volume * 0.0005))); // 200 yard threshold
  const rushTDsScore = Math.max(0, Math.min(statsWeights.volume * 0.1, Math.max(0, totalRushTDs - 2) * (statsWeights.volume * 0.2))); // 2 TD threshold, reduced multiplier
  
  const totalVolumeScore = Math.max(0, Math.min(statsWeights.volume * 0.05, (totalVolume - 3200) * (statsWeights.volume * 0.00008)));
  const baseVolumeScore = passYardsScore + passTDsScore + rushYardsScore + rushTDsScore + totalVolumeScore;
  
  // Apply playoff adjustment to the base scores
  const finalEfficiencyScore = baseEfficiencyScore * playoffAdjustmentFactor;
  const finalProtectionScore = baseProtectionScore * playoffAdjustmentFactor;
  const finalVolumeScore = baseVolumeScore * playoffAdjustmentFactor;
  
  const finalScore = finalEfficiencyScore + finalProtectionScore + finalVolumeScore;
  
  if (debugMode && playerName) {
    console.log(`📊 FINAL ADJUSTED STATS: Base(${(baseEfficiencyScore + baseProtectionScore + baseVolumeScore).toFixed(1)}) × Playoff(${playoffAdjustmentFactor.toFixed(3)}) = ${finalScore.toFixed(1)}`);
    console.log(`📊 Components: Efficiency(${finalEfficiencyScore.toFixed(1)}) + Protection(${finalProtectionScore.toFixed(1)}) + Volume(${finalVolumeScore.toFixed(1)})`);
    console.log(`📊 DETAILED BREAKDOWN:`);
    console.log(`📊   Efficiency: ANY/A(${anyAScore.toFixed(1)}) + TD%(${tdPctScore.toFixed(1)}) + INT%(${intPctScore.toFixed(1)}) = ${baseEfficiencyScore.toFixed(1)}`);
    console.log(`📊   Protection: Sack%(${sackPctScore.toFixed(1)}) + Fumble%(${fumblePctScore.toFixed(1)}) + Comp%(${cmpPctScore.toFixed(1)}) = ${baseProtectionScore.toFixed(1)}`);
    console.log(`📊   Volume: PassYds(${passYardsScore.toFixed(1)}) + PassTDs(${passTDsScore.toFixed(1)}) + RushYds(${rushYardsScore.toFixed(1)}) + RushTDs(${rushTDsScore.toFixed(1)}) + Total(${totalVolumeScore.toFixed(1)}) = ${baseVolumeScore.toFixed(1)}`);
    console.log(`📊 Raw Stats: ANY/A(${weightedAnyA.toFixed(1)}) TD%(${weightedTDPct.toFixed(1)}) INT%(${weightedIntPct.toFixed(1)}) Comp%(${weightedCmpPct.toFixed(1)})`);
    console.log(`📊 Volume Stats: PassYds(${totalPassYards.toFixed(0)}) PassTDs(${totalPassTDs.toFixed(1)}) RushYds(${totalRushYards.toFixed(0)}) RushTDs(${totalRushTDs.toFixed(1)})`);
  }
  
  return finalScore;
}; 