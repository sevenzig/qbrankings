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
// Updated: Combined turnover rate calculation using (pass attempts + rush attempts) / total turnovers
export const calculateStatsScore = (qbSeasonData, statsWeights = { efficiency: 45, protection: 25, volume: 30 }, includePlayoffs = true, include2024Only = false, efficiencyWeights = { anyA: 45, tdPct: 30, completionPct: 25 }, protectionWeights = { sackPct: 60, turnoverRate: 40 }, volumeWeights = { passYards: 25, passTDs: 25, rushYards: 20, rushTDs: 15, totalAttempts: 15 }) => {
  let weightedAnyA = 0;
  let weightedTDPct = 0;
  let weightedCmpPct = 0;
  let weightedSackPct = 0;
  let weightedTurnoverRate = 0;
  let totalPassYards = 0;
  let totalPassTDs = 0;
  let totalRushYards = 0;
  let totalRushTDs = 0;
  let totalVolume = 0;
  let totalAttempts = 0;
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
  
  // Check if player has meaningful current season data before including any historical data
  let hasCurrentSeasonData = false;
  if (qbSeasonData.years && qbSeasonData.years['2024']) {
    const currentSeasonAtts = parseInt(qbSeasonData.years['2024'].Att) || 0;
    hasCurrentSeasonData = currentSeasonAtts >= 50; // Must have meaningful current season participation
  }
  
  // If no meaningful current season data, only use data if include2024Only is false and player has historical significance
  if (!hasCurrentSeasonData && !include2024Only) {
    // For players without current season data, require higher historical thresholds
    let hasSignificantHistoricalData = false;
    Object.entries(qbSeasonData.years || {}).forEach(([year, data]) => {
      if (year !== '2024') {
        const historicalAtts = parseInt(data.Att) || 0;
        if (historicalAtts >= 200) { // Require substantial historical data (200+ attempts = ~12+ games)
          hasSignificantHistoricalData = true;
        }
      }
    });
    
    if (!hasSignificantHistoricalData) {
      return 0; // Filter out players without either current relevance or historical significance
    }
  }
  
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
    const regSeasonRushAtts = parseInt(data.RushingAtt) || 0;
    const regSeasonFumbles = parseInt(data.Fumbles) || 0;
    
    // Skip seasons with insufficient data - use different thresholds for 2024 vs previous years
    if (year === '2024') {
      // For 2024: Use minimum attempts requirement (very lenient for rookies/backup roles)
      if (regSeasonAtts < 50) return; // Minimum 50 attempts for 2024 (roughly 3-4 games as starter)
    } else {
      // For 2022/2023: Use more lenient threshold to account for historical data
      if (regSeasonAtts < 100) return; // Minimum 100 attempts for previous years
    }
    
    // Calculate regular season statistical rates
    const anyA = data['ANY/A'] || 0;
    const tdPct = regSeasonAtts > 0 ? (regSeasonTDs / regSeasonAtts) * 100 : 0;
    const cmpPct = regSeasonAtts > 0 ? (regSeasonCmps / regSeasonAtts) * 100 : 0;
    const sackPct = (regSeasonAtts + regSeasonSacks) > 0 ? (regSeasonSacks / (regSeasonAtts + regSeasonSacks)) * 100 : 0;
    
    // Calculate turnover rate: (pass attempts + rush attempts) / total turnovers
    const seasonAttempts = regSeasonAtts + regSeasonRushAtts;
    const totalTurnovers = regSeasonInts + regSeasonFumbles;
    const turnoverRate = (totalTurnovers > 0 && seasonAttempts > 0) ? seasonAttempts / totalTurnovers : 999; // High number = good (fewer turnovers per attempt)
    
    // Weight and accumulate regular season stats
    weightedAnyA += anyA * weight;
    weightedTDPct += tdPct * weight;
    weightedCmpPct += cmpPct * weight;
    weightedSackPct += sackPct * weight;
    weightedTurnoverRate += turnoverRate * weight;
    
    totalPassYards += regSeasonYds * weight;
    totalPassTDs += regSeasonTDs * weight;
    totalRushYards += regSeasonRushYds * weight;
    totalRushTDs += regSeasonRushTDs * weight;
    totalVolume += (regSeasonYds + regSeasonRushYds) * weight;
    totalAttempts += (regSeasonAtts + regSeasonRushAtts) * weight;
    totalWeight += weight;
  });
  
  if (totalWeight === 0) return 0;
  
  // Normalize regular season weighted stats
  weightedAnyA = weightedAnyA / totalWeight;
  weightedTDPct = weightedTDPct / totalWeight;
  weightedCmpPct = weightedCmpPct / totalWeight;
  weightedSackPct = weightedSackPct / totalWeight;
  weightedTurnoverRate = weightedTurnoverRate / totalWeight;
  
  totalPassYards = totalPassYards / totalWeight;
  totalPassTDs = totalPassTDs / totalWeight;
  totalRushYards = totalRushYards / totalWeight;
  totalRushTDs = totalRushTDs / totalWeight;
  totalVolume = totalVolume / totalWeight;
  totalAttempts = totalAttempts / totalWeight;
  
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
      
      // Apply same threshold logic to playoff calculations
      const regSeasonThreshold = year === '2024' ? 50 : 100;
      if (playoffAtts >= 15 && playoffGames > 0 && regSeasonAtts >= regSeasonThreshold) {
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
  
  // Calculate component scores using regular season base - BALANCED SCALING FOR ALL COMPONENTS
  // All components now use similar scaling approaches to be equally competitive when weighted at 100%
  
  // Efficiency Component - CONTEXT-AWARE SUB-COMPONENT SCALING
  // Calculate individual normalized scores (0-100 scale) for each efficiency metric
  const anyANormalized = Math.max(0, Math.min(100, (weightedAnyA - 4.5) * 28.6)); // 0-100 scale for ANY/A (elite 8.0 gives 100 points)
  const tdPctNormalized = Math.max(0, Math.min(100, (weightedTDPct - 2.5) * 28.6)); // 0-100 scale for TD% (elite 6.0 gives 100 points)
  const efficiencyCmpPctNormalized = Math.max(0, Math.min(100, (weightedCmpPct - 58) * 8.33)); // 0-100 scale for completion% (elite 70 gives 100 points)
  
  // Calculate weighted average of normalized scores using sub-component weights
  // This ensures that regardless of weight distribution, elite performance can reach ~100 points
  const totalEfficiencySubWeights = efficiencyWeights.anyA + efficiencyWeights.tdPct + efficiencyWeights.completionPct;
  
  const efficiencyCompositeScore = totalEfficiencySubWeights > 0 ? 
    ((anyANormalized * efficiencyWeights.anyA) +
     (tdPctNormalized * efficiencyWeights.tdPct) +
     (efficiencyCmpPctNormalized * efficiencyWeights.completionPct)) / totalEfficiencySubWeights : 0;
  
  // Apply the main efficiency weight to the composite score
  const baseEfficiencyScore = efficiencyCompositeScore * (statsWeights.efficiency / 100);
  
  // Protection Component - CONTEXT-AWARE SUB-COMPONENT SCALING
  // Calculate individual normalized scores (0-100 scale) for each protection metric
  const sackPctNormalized = Math.max(0, Math.min(100, (8.5 - weightedSackPct) * 22.2)); // 0-100 scale for sack% (elite 4.0% gives 100 points)
  const turnoverRateNormalized = Math.max(0, Math.min(100, (weightedTurnoverRate - 22) * 2.78)); // 0-100 scale for turnover rate (elite 58 gives 100 points)
  
  // Calculate weighted average of normalized scores using sub-component weights
  // This ensures that regardless of weight distribution, elite performance can reach ~100 points
  const totalProtectionSubWeights = protectionWeights.sackPct + protectionWeights.turnoverRate;
  
  const protectionCompositeScore = totalProtectionSubWeights > 0 ? 
    ((sackPctNormalized * protectionWeights.sackPct) +
     (turnoverRateNormalized * protectionWeights.turnoverRate)) / totalProtectionSubWeights : 0;
  
  // Apply the main protection weight to the composite score
  const baseProtectionScore = protectionCompositeScore * (statsWeights.protection / 100);
  
  // Volume Component (0 to full volume weight) - PROPERLY using detailed sub-component weights with MUCH TIGHTER SCALING
  
  // Debug logging for volume weights
  if (debugMode && playerName) {
    console.log(`📊 Volume weights: passYards(${volumeWeights.passYards}%) passTDs(${volumeWeights.passTDs}%) rushYards(${volumeWeights.rushYards}%) rushTDs(${volumeWeights.rushTDs}%) attempts(${volumeWeights.totalAttempts}%)`);
  }
  
  // Volume Component - CONTEXT-AWARE SUB-COMPONENT SCALING (NO DOUBLE-COUNTING)
  // Calculate individual normalized scores (0-100 scale) for each volume metric
  const passYardsNormalized = Math.max(0, Math.min(100, (totalPassYards - 2000) * 0.025)); // 0-100 scale for pass yards
  const passTDsNormalized = Math.max(0, Math.min(100, (totalPassTDs - 10) * 3.33)); // 0-100 scale for pass TDs  
  const rushYardsNormalized = Math.max(0, Math.min(100, (totalRushYards - 100) * 0.1)); // 0-100 scale for rush yards
  const rushTDsNormalized = Math.max(0, Math.min(100, (totalRushTDs - 1) * 20.0)); // 0-100 scale for rush TDs
  const totalAttemptsNormalized = Math.max(0, Math.min(100, (totalAttempts - 300) * 0.1)); // 0-100 scale for total attempts
  
  // REMOVED totalVolume to prevent double-counting with passYards + rushYards
  // Total volume was redundant and causing overfitting for players like Joshua Dobbs
  
  // Calculate weighted average of normalized scores using sub-component weights (excluding totalVolume)
  const totalSubWeights = volumeWeights.passYards + volumeWeights.passTDs + volumeWeights.rushYards + 
                          volumeWeights.rushTDs + volumeWeights.totalAttempts;
  
  const volumeCompositeScore = totalSubWeights > 0 ? 
    ((passYardsNormalized * volumeWeights.passYards) +
     (passTDsNormalized * volumeWeights.passTDs) +
     (rushYardsNormalized * volumeWeights.rushYards) +
     (rushTDsNormalized * volumeWeights.rushTDs) +
     (totalAttemptsNormalized * volumeWeights.totalAttempts)) / totalSubWeights : 0;
  
  // Apply the main volume weight to the composite score
  const baseVolumeScore = volumeCompositeScore * (statsWeights.volume / 100);
  
  // Apply playoff adjustment to the base scores
  const finalEfficiencyScore = baseEfficiencyScore * playoffAdjustmentFactor;
  const finalProtectionScore = baseProtectionScore * playoffAdjustmentFactor;
  const finalVolumeScore = baseVolumeScore * playoffAdjustmentFactor;
  
  const finalScore = finalEfficiencyScore + finalProtectionScore + finalVolumeScore;
  
  if (debugMode && playerName) {
    console.log(`📊 FINAL ADJUSTED STATS: Base(${(baseEfficiencyScore + baseProtectionScore + baseVolumeScore).toFixed(1)}) × Playoff(${playoffAdjustmentFactor.toFixed(3)}) = ${finalScore.toFixed(1)}`);
    console.log(`📊 Components: Efficiency(${finalEfficiencyScore.toFixed(1)}) + Protection(${finalProtectionScore.toFixed(1)}) + Volume(${finalVolumeScore.toFixed(1)})`);
    console.log(`📊 DETAILED BREAKDOWN:`);
    console.log(`📊   Efficiency: ANY/A(${anyANormalized.toFixed(1)}) + TD%(${tdPctNormalized.toFixed(1)}) + Comp%(${efficiencyCmpPctNormalized.toFixed(1)}) = ${baseEfficiencyScore.toFixed(1)}`);
    console.log(`📊   Protection: Sack%(${sackPctNormalized.toFixed(1)}) + TurnoverRate(${turnoverRateNormalized.toFixed(1)}) = ${baseProtectionScore.toFixed(1)}`);
    console.log(`📊   Volume: PassYds(${passYardsNormalized.toFixed(1)}) + PassTDs(${passTDsNormalized.toFixed(1)}) + RushYds(${rushYardsNormalized.toFixed(1)}) + RushTDs(${rushTDsNormalized.toFixed(1)}) + Attempts(${totalAttemptsNormalized.toFixed(1)}) = ${baseVolumeScore.toFixed(1)}`);
    console.log(`📊 Raw Stats: ANY/A(${weightedAnyA.toFixed(1)}) TD%(${weightedTDPct.toFixed(1)}) TurnoverRate(${weightedTurnoverRate.toFixed(1)}) Comp%(${weightedCmpPct.toFixed(1)})`);
    console.log(`📊 Volume Stats: PassYds(${totalPassYards.toFixed(0)}) PassTDs(${totalPassTDs.toFixed(1)}) RushYds(${totalRushYards.toFixed(0)}) RushTDs(${totalRushTDs.toFixed(1)}) TotalAtts(${totalAttempts.toFixed(0)})`);
  }
  
  return finalScore;
}; 