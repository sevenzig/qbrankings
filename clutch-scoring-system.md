# Clutch Performance Scoring System Documentation

## Overview
The Clutch Performance Score evaluates a quarterback's ability to perform in high-pressure, game-deciding situations. The system combines regular season clutch statistics with playoff performance bonuses, using sophisticated weighting to account for the increased difficulty of clutch moments in playoff scenarios. The maximum possible score is **100 points**.

---

## System Architecture

### Temporal Weighting
All clutch calculations use the same year-based weighting system:
- **2024**: 55% weight (current season emphasis)
- **2023**: 35% weight (recent performance)
- **2022**: 10% weight (historical context)

### Core Clutch Metrics
The system tracks two primary clutch statistics:
1. **Game Winning Drives (GWD)**: Drives that directly lead to game-winning scores
2. **4th Quarter Comebacks (4QC)**: Successful comebacks initiated in the 4th quarter

---

## Scoring Components Breakdown

### 1. Game Winning Drives Score (0-40 points)
**Primary clutch metric representing the quarterback's ability to lead game-winning drives**

#### Formula:
```javascript
gwdScore = min(40, gwdPerGame × 120)
```

#### Calculation Details:
- **Input**: Total Game Winning Drives per game across all seasons
- **Scale Factor**: 120 points per GWD/game
- **Maximum Threshold**: 0.33 GWD/game = 40 points
- **Benchmark**: Elite clutch QBs average ~0.25-0.30 GWD/game

#### Performance Benchmarks:
| GWD/Game | Score | Performance Level |
|----------|-------|------------------|
| 0.33+ | 40 pts | Elite Clutch |
| 0.25 | 30 pts | Very Good |
| 0.20 | 24 pts | Above Average |
| 0.15 | 18 pts | Average |
| 0.10 | 12 pts | Below Average |
| 0.05 | 6 pts | Poor |

### 2. 4th Quarter Comebacks Score (0-25 points)
**Measures the quarterback's ability to orchestrate comeback victories**

#### Formula:
```javascript
comebackScore = min(25, comebacksPerGame × 100)
```

#### Calculation Details:
- **Input**: Total 4th Quarter Comebacks per game across all seasons
- **Scale Factor**: 100 points per comeback/game
- **Maximum Threshold**: 0.25 comebacks/game = 25 points
- **Benchmark**: Elite comeback QBs average ~0.15-0.20 comebacks/game

#### Performance Benchmarks:
| 4QC/Game | Score | Performance Level |
|----------|-------|------------------|
| 0.25+ | 25 pts | Elite Comeback Artist |
| 0.20 | 20 pts | Very Good |
| 0.15 | 15 pts | Above Average |
| 0.12 | 12 pts | Average |
| 0.08 | 8 pts | Below Average |
| 0.04 | 4 pts | Poor |

### 3. Combined Clutch Rate Score (0-15 points)
**Rewards quarterbacks with high overall clutch opportunities**

#### Formula:
```javascript
clutchRateScore = min(15, totalClutchPerGame × 50)
where totalClutchPerGame = gwdPerGame + comebacksPerGame
```

#### Calculation Details:
- **Input**: Combined GWD and 4QC per game
- **Scale Factor**: 50 points per combined clutch opportunity/game
- **Maximum Threshold**: 0.30 combined clutch/game = 15 points
- **Purpose**: Rewards QBs who consistently face and succeed in clutch situations

### 4. Playoff Success Bonus (0-20 points)
**Additional points for clutch performance in playoff scenarios**

#### Formula:
```javascript
playoffSuccessScore = min(20, playoffWinRate × 20 + playoffGames × 2)
```

#### Calculation Details:
- **Base Component**: Playoff win rate × 20 (0-20 points based on success rate)
- **Participation Bonus**: 2 points per playoff game played
- **Maximum**: 20 points total
- **Logic**: Rewards both playoff success and experience in high-pressure games

#### Playoff Success Benchmarks:
| Playoff Win Rate | Base Score | + Games Bonus | Total Possible |
|------------------|------------|---------------|----------------|
| 100% (4-0) | 20 pts | 8 pts | 20 pts (capped) |
| 75% (3-1) | 15 pts | 8 pts | 20 pts (capped) |
| 67% (2-1) | 13.4 pts | 6 pts | 19.4 pts |
| 50% (2-2) | 10 pts | 8 pts | 18 pts |
| 33% (1-2) | 6.6 pts | 6 pts | 12.6 pts |

---

## Playoff Clutch Multipliers

### Round-Specific Weighting System
Clutch moments in playoff games receive multipliers based on the round's importance. The system has undergone a **70% reduction** from original values to balance playoff vs. regular season importance.

#### Current Multiplier Values:
| Playoff Round | Multiplier | Original Value | Reduction |
|---------------|------------|----------------|-----------|
| **Wild Card** | 1.06× | 1.2× | 70% reduced |
| **Divisional** | 1.08× | 1.4× | 70% reduced |
| **Conference Championship** | 1.12× | 1.8× | 70% reduced |
| **Super Bowl** | 1.22× | 2.4× | 70% reduced |

### Playoff Path Detection Algorithm
The system automatically determines which playoff rounds were played based on total games and win/loss patterns:

#### 4-Game Playoff Run (No First-Round Bye):
```javascript
if (totalGames === 4) {
  averageMultiplier = (1.06 + 1.08 + 1.12 + 1.22) / 4 = 1.12×
}
```
**Rounds**: Wild Card → Divisional → Conference Championship → Super Bowl

#### 3-Game Playoff Run (With First-Round Bye):
```javascript
if (totalGames === 3) {
  averageMultiplier = (1.08 + 1.12 + 1.22) / 3 = 1.14×
}
```
**Rounds**: Divisional → Conference Championship → Super Bowl

#### 2-Game Playoff Run:
```javascript
if (totalGames === 2) {
  averageMultiplier = (1.08 + 1.12) / 2 = 1.10×
}
```
**Typical Rounds**: Divisional → Conference Championship

#### 1-Game Playoff Run:
```javascript
if (totalGames === 1) {
  averageMultiplier = 1.06×
}
```
**Round**: Wild Card only

#### Default (No Playoff Data):
```javascript
defaultMultiplier = 1.06×
```

---

## Detailed Calculation Process

### Step-by-Step Clutch Score Calculation:

#### 1. Data Collection Phase:
```javascript
// For each season (2022-2024):
const regularGWD = seasonData.GWD || 0;
const regularFourthQC = seasonData['4QC'] || 0;
const regularGames = seasonData.G || 0;

// Collect playoff data if available:
const playoffGWD = playoffData.gameWinningDrives || 0;
const playoffFourthQC = playoffData.fourthQuarterComebacks || 0;
const playoffGames = playoffData.gamesPlayed || 0;
```

#### 2. Playoff Multiplier Application:
```javascript
// Calculate round-specific multiplier:
const clutchMultiplier = calculatePlayoffClutchMultiplier(playoffData, team, year);

// Apply multiplier to playoff clutch stats:
const weightedPlayoffGWD = playoffGWD * clutchMultiplier;
const weightedPlayoffFourthQC = playoffFourthQC * clutchMultiplier;
```

#### 3. Year-Based Weighting:
```javascript
const yearWeight = yearWeights[year]; // 2024: 0.55, 2023: 0.35, 2022: 0.10

// Weight each season's contribution:
totalGWD += (regularGWD + weightedPlayoffGWD) * yearWeight;
totalFourthQC += (regularFourthQC + weightedPlayoffFourthQC) * yearWeight;
totalGames += (regularGames + playoffGames) * yearWeight;
```

#### 4. Per-Game Rate Calculation:
```javascript
// Normalize by total weight sum:
const normalizedGWD = totalGWD / weightSum;
const normalizedFourthQC = totalFourthQC / weightSum;
const normalizedGames = totalGames / weightSum;

// Calculate per-game rates:
const gwdPerGame = normalizedGames > 0 ? normalizedGWD / normalizedGames : 0;
const comebacksPerGame = normalizedGames > 0 ? normalizedFourthQC / normalizedGames : 0;
```

#### 5. Final Score Components:
```javascript
// Primary clutch metrics:
const gwdScore = Math.min(40, gwdPerGame * 120);
const comebackScore = Math.min(25, comebacksPerGame * 100);

// Combined rate bonus:
const totalClutchPerGame = gwdPerGame + comebacksPerGame;
const clutchRateScore = Math.min(15, totalClutchPerGame * 50);

// Playoff success bonus:
const playoffWinRate = totalPlayoffWins / totalPlayoffGames;
const playoffSuccessScore = Math.min(20, playoffWinRate * 20 + totalPlayoffGames * 2);

// Final clutch score:
const finalClutchScore = gwdScore + comebackScore + clutchRateScore + playoffSuccessScore;
```

---

## Scaling Constants Reference

### Original SCALING_RANGES Values:
```javascript
const SCALING_RANGES = {
  GWD_TOTAL: { scale: 10, max: 50 },      // 10 points per GWD, max 50
  FOURTH_QC: { scale: 7.5, max: 30 },     // 7.5 points per 4QC, max 30
  CLUTCH_RATE: { scale: 50, max: 20 }     // GWD per game rate, max 20
};
```

**Note**: These constants are from an earlier version. The current implementation uses the more sophisticated per-game rate calculations described above.

---

## Real-World Examples

### Elite Clutch Performance (90+ points):
- **GWD/Game**: 0.30+ (36+ points)
- **4QC/Game**: 0.20+ (20+ points)
- **Combined Rate**: 0.50+ (15 points - capped)
- **Playoff Success**: High win rate + multiple games (18+ points)

### Above Average Clutch Performance (70-89 points):
- **GWD/Game**: 0.20-0.29 (24-35 points)
- **4QC/Game**: 0.12-0.19 (12-19 points)
- **Combined Rate**: 0.30-0.49 (10-14 points)
- **Playoff Success**: Moderate success (10-17 points)

### Average Clutch Performance (50-69 points):
- **GWD/Game**: 0.12-0.19 (14-23 points)
- **4QC/Game**: 0.08-0.11 (8-11 points)
- **Combined Rate**: 0.20-0.29 (6-9 points)
- **Playoff Success**: Limited playoff experience (5-12 points)

---

## Historical Context and Adjustments

### Reduction History:
1. **Original System**: Higher playoff multipliers (1.2× to 2.4×)
2. **First Reduction**: 60% reduction applied
3. **Current System**: Additional 70% reduction for balance

### Design Philosophy:
- **Regular Season Focus**: Clutch moments in 17+ games more representative than limited playoff sample
- **Playoff Recognition**: Still rewards playoff clutch performance but doesn't overweight small samples
- **Consistency Emphasis**: Per-game rates prevent volume bias
- **Balanced Scaling**: Multiple scoring components prevent single-metric dominance

### Quality Thresholds:
The system includes debug logging for quarterbacks who exceed:
- **GWD/Game ≥ 0.15** (above average clutch performance)
- **4QC/Game ≥ 0.10** (above average comeback ability)

---

## Integration with Overall QEI

### Default Weight in QEI Calculation:
- **Clutch Category Weight**: 15% (configurable)
- **Range**: 0-100 points
- **Contribution to Final QEI**: Up to 15 points (in default balanced preset)

### Interaction with Other Categories:
- **Team Success**: Clutch performance often correlates with team wins
- **Statistical Performance**: Clutch situations may showcase efficiency under pressure
- **Durability**: More games played = more clutch opportunities
- **Supporting Cast**: Poor support may create more clutch situations but make success harder

---

## Technical Implementation Notes

### Data Sources:
- **Regular Season**: Game Winning Drives and 4th Quarter Comebacks from CSV data
- **Playoff Data**: Enhanced playoff statistics with round-specific tracking
- **Historical Records**: Known playoff results for accurate round detection

### Error Handling:
- **Missing Data**: Defaults to 0 for missing clutch statistics
- **Incomplete Seasons**: Pro-rated based on games played
- **Multi-Team QBs**: Aggregates clutch statistics across all teams in a season

### Performance Considerations:
- **Caching**: Playoff multipliers calculated once per season
- **Optimization**: Per-game calculations prevent expensive per-play analysis
- **Scalability**: System handles varying numbers of seasons and games efficiently

---

## Maximum Possible Scores Summary

| Component | Formula | Max Points | Elite Threshold |
|-----------|---------|------------|-----------------|
| **Game Winning Drives** | `min(40, gwdPerGame × 120)` | 40 | 0.33 GWD/game |
| **4th Quarter Comebacks** | `min(25, comebacksPerGame × 100)` | 25 | 0.25 4QC/game |
| **Combined Clutch Rate** | `min(15, totalClutchPerGame × 50)` | 15 | 0.30 combined/game |
| **Playoff Success Bonus** | `min(20, winRate × 20 + games × 2)` | 20 | Perfect playoff record |
| **Total Clutch Score** | | **100** | Elite across all components |

The clutch scoring system provides a comprehensive evaluation of quarterback performance in high-pressure situations, balancing regular season consistency with playoff achievement while maintaining proper perspective on sample sizes and situational difficulty. 