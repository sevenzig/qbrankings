# Durability Scoring System Documentation

## Overview
The Durability Score evaluates a quarterback's availability and consistency over multiple seasons. This is a **pure availability metric** focused on games started, injury resilience, and multi-season reliability. The system rewards QBs who consistently take the field and penalizes those with frequent injuries or limited playing time. The maximum possible score is **100 points**.

---

## System Architecture

### Core Philosophy
**"The best ability is availability"** - The durability score measures a quarterback's capacity to be on the field when the team needs them most.

### Temporal Weighting
All durability calculations use the same year-based weighting system:
- **2024**: 55% weight (current season emphasis)
- **2023**: 35% weight (recent performance)
- **2022**: 10% weight (historical context)

### Measurement Period
- **Regular Season Focus**: Based on 17-game NFL regular season
- **Multi-Year Analysis**: Evaluates consistency across 2022-2024 seasons
- **Total Possible Games**: 51 games over 3 seasons (17 × 3)

---

## Scoring Components Breakdown

### 1. Season Availability Score (0-80 points)
**Primary component measuring weighted average availability across all seasons**

#### Formula:
```javascript
availabilityScore = weightedAvailability × 80
```

#### Step-by-Step Calculation:

##### A. Individual Season Availability:
```javascript
seasonAvailability = min(1.0, gamesStarted / 17)
```
- **Input**: Games Started (GS) in each season
- **Denominator**: 17 (standard NFL regular season length)
- **Cap**: Maximum 1.0 (100% availability) even if more than 17 games

##### B. Year-Weighted Aggregation:
```javascript
weightedAvailability = (
  (seasonAvailability2024 × 0.55) +
  (seasonAvailability2023 × 0.35) +
  (seasonAvailability2022 × 0.10)
) / totalWeight
```

##### C. Final Availability Score:
```javascript
availabilityScore = weightedAvailability × 80
```

#### Performance Benchmarks:
| Games/Season | Availability | Score | Performance Level |
|--------------|--------------|-------|------------------|
| 17 games | 100% | 80 pts | Perfect Availability |
| 16 games | 94.1% | 75.3 pts | Elite Durability |
| 15 games | 88.2% | 70.6 pts | Very Good |
| 14 games | 82.4% | 65.9 pts | Good |
| 12 games | 70.6% | 56.5 pts | Average |
| 10 games | 58.8% | 47.1 pts | Below Average |
| 8 games | 47.1% | 37.7 pts | Poor |
| 5 games | 29.4% | 23.5 pts | Very Poor |

### 2. Multi-Year Consistency Bonus (0-20 points)
**Rewards quarterbacks for sustained availability and longevity**

#### Components:

##### A. Full Season Bonuses:
```javascript
fullSeasonBonus = yearWeight × 10  // For seasons with 16+ games started
```
- **Threshold**: 16+ games started in a season
- **Reward**: 10 bonus points (weighted by year)
- **Purpose**: Rewards near-perfect or perfect availability

##### B. Near-Full Season Bonuses:
```javascript
nearFullSeasonBonus = yearWeight × 5  // For seasons with 14-15 games started
```
- **Threshold**: 14-15 games started in a season
- **Reward**: 5 bonus points (weighted by year)
- **Purpose**: Recognizes good availability despite minor injuries

##### C. Multi-Year Participation Bonus:
```javascript
participationBonus = yearsActive >= 3 ? 5 : 0
```
- **Threshold**: Active in all 3 evaluation seasons (2022-2024)
- **Reward**: 5 additional bonus points
- **Purpose**: Rewards longevity and career consistency

#### Total Consistency Calculation:
```javascript
consistencyScore = min(20, consistencyBonus + participationBonus)
```

#### Consistency Benchmarks:
| Scenario | Bonus Calculation | Total Bonus |
|----------|------------------|-------------|
| **Perfect 3 Years** (17-17-17) | (0.55×10 + 0.35×10 + 0.10×10) + 5 | 15.0 pts |
| **Elite 3 Years** (16-16-16) | (0.55×10 + 0.35×10 + 0.10×10) + 5 | 15.0 pts |
| **Very Good 3 Years** (15-15-15) | (0.55×5 + 0.35×5 + 0.10×5) + 5 | 10.0 pts |
| **Good 3 Years** (14-14-14) | (0.55×5 + 0.35×5 + 0.10×5) + 5 | 10.0 pts |
| **Mixed Performance** (17-14-10) | (0.55×10 + 0.35×5 + 0.10×0) + 5 | 12.25 pts |
| **Injury-Prone** (8-12-6) | (0.55×0 + 0.35×0 + 0.10×0) + 5 | 5.0 pts |
| **Rookie (2024 only)** (16 games) | (0.55×10 + 0×0 + 0×0) + 0 | 5.5 pts |

---

## Final Durability Score Calculation

### Complete Formula:
```javascript
finalDurabilityScore = min(100, availabilityScore + consistencyScore)
```

### Step-by-Step Process:

#### 1. Data Collection:
```javascript
// For each season (2022, 2023, 2024):
const gamesStarted = seasonData.GS || 0;
const possibleGames = 17;
const yearWeight = yearWeights[year];
```

#### 2. Individual Season Processing:
```javascript
// Calculate season availability
const seasonAvailability = Math.min(1, gamesStarted / possibleGames);

// Accumulate weighted totals
totalGamesPlayed += gamesStarted;
totalPossibleGames += possibleGames;
weightedAvailability += seasonAvailability * yearWeight;
totalWeight += yearWeight;

// Apply consistency bonuses
if (gamesStarted >= 16) {
  consistencyBonus += yearWeight * 10;
} else if (gamesStarted >= 14) {
  consistencyBonus += yearWeight * 5;
}
```

#### 3. Weighted Average Calculation:
```javascript
const avgAvailability = weightedAvailability / totalWeight;
const overallAvailability = Math.min(1, totalGamesPlayed / 51);
```

#### 4. Final Score Components:
```javascript
const availabilityScore = avgAvailability * 80;
const yearsActive = Object.keys(seasonData.years).length;
const consistencyScore = Math.min(20, consistencyBonus + (yearsActive >= 3 ? 5 : 0));
```

#### 5. Final Result:
```javascript
return Math.min(100, availabilityScore + consistencyScore);
```

---

## Real-World Scoring Examples

### Elite Durability (95+ points):
**Perfect 3-Year Availability**: 17-17-17 games
- **Availability Score**: (1.0 × 0.55 + 1.0 × 0.35 + 1.0 × 0.10) × 80 = 80.0 pts
- **Consistency Score**: (10×0.55 + 10×0.35 + 10×0.10) + 5 = 15.0 pts
- **Total**: 95.0 points

### Very Good Durability (85-94 points):
**Consistent High Availability**: 16-16-15 games
- **Availability Score**: (0.94×0.55 + 0.94×0.35 + 0.88×0.10) × 80 = 75.8 pts
- **Consistency Score**: (10×0.55 + 10×0.35 + 5×0.10) + 5 = 14.5 pts
- **Total**: 90.3 points

### Good Durability (70-84 points):
**Mostly Available**: 14-15-13 games
- **Availability Score**: (0.82×0.55 + 0.88×0.35 + 0.76×0.10) × 80 = 66.9 pts
- **Consistency Score**: (5×0.55 + 5×0.35 + 0×0.10) + 5 = 9.5 pts
- **Total**: 76.4 points

### Average Durability (50-69 points):
**Moderate Availability**: 12-11-14 games
- **Availability Score**: (0.71×0.55 + 0.65×0.35 + 0.82×0.10) × 80 = 56.9 pts
- **Consistency Score**: (0×0.55 + 0×0.35 + 5×0.10) + 5 = 5.5 pts
- **Total**: 62.4 points

### Poor Durability (30-49 points):
**Injury-Prone**: 8-6-10 games
- **Availability Score**: (0.47×0.55 + 0.35×0.35 + 0.59×0.10) × 80 = 35.7 pts
- **Consistency Score**: (0×0.55 + 0×0.35 + 0×0.10) + 5 = 5.0 pts
- **Total**: 40.7 points

### Very Poor Durability (<30 points):
**Frequent Injuries**: 4-3-7 games
- **Availability Score**: (0.24×0.55 + 0.18×0.35 + 0.41×0.10) × 80 = 20.4 pts
- **Consistency Score**: (0×0.55 + 0×0.35 + 0×0.10) + 5 = 5.0 pts
- **Total**: 25.4 points

---

## Integration with Experience Modifier

### Connection to Overall QEI:
The durability score has a unique relationship with the experience modifier in the overall QEI calculation.

#### Experience Modifier Application:
```javascript
// Only applied when durability is weighted in QEI calculation
if (weights.durability > 0) {
  if (experience === 1) {
    experienceModifier = 0.93; // 7% penalty for rookies
  } else if (experience === 2) {
    experienceModifier = 0.97; // 3% penalty for second-year QBs
  }
  // 3+ years: no penalty (1.0x modifier)
}
```

#### Rationale:
- **Rookies**: May have perfect availability but lack proven durability over time
- **Second-Year**: Still building track record of NFL-level durability
- **Veterans**: Established durability patterns, no additional modifier needed

### Experience Impact Examples:
| QB Experience | Base Durability | Experience Modifier | Final Impact |
|---------------|-----------------|-------------------|--------------|
| **Rookie (17 games)** | 85.0 pts | 0.93× | Reduced overall QEI |
| **2nd Year (16-17 games)** | 90.0 pts | 0.97× | Slightly reduced QEI |
| **Veteran (15-16-17 games)** | 95.0 pts | 1.0× | No penalty |

---

## Scaling and Thresholds

### Performance Tiers:
| Tier | Score Range | Description | Typical Profile |
|------|-------------|-------------|-----------------|
| **Elite** | 90-100 | Exceptional availability | 16+ games consistently |
| **Very Good** | 80-89 | High reliability | 14-16 games most seasons |
| **Good** | 70-79 | Generally available | 12-15 games typically |
| **Average** | 55-69 | Moderate durability | 10-13 games average |
| **Below Average** | 40-54 | Injury concerns | 8-11 games frequently |
| **Poor** | 25-39 | Significant durability issues | <10 games often |
| **Very Poor** | 0-24 | Major availability problems | Rarely plays full seasons |

### Critical Thresholds:
- **80 points**: Elite durability threshold
- **70 points**: Above-average durability
- **55 points**: League-average durability
- **40 points**: Durability concern threshold
- **25 points**: Major durability red flag

---

## Technical Implementation Details

### Constants Reference:
```javascript
const yearWeights = { 2024: 0.55, 2023: 0.35, 2022: 0.10 };
const REGULAR_SEASON_GAMES = 17;
const TOTAL_POSSIBLE_GAMES = 51; // 17 × 3 seasons
const AVAILABILITY_WEIGHT = 80; // Max points for availability component
const CONSISTENCY_WEIGHT = 20; // Max points for consistency component
```

### Data Sources:
- **Games Started (GS)**: Primary metric from CSV data
- **Season Data**: Individual season performance records
- **Multi-Year Tracking**: Aggregated data across evaluation period

### Error Handling:
- **Missing Data**: Defaults to 0 games started for missing seasons
- **Incomplete Seasons**: Pro-rated based on actual data available
- **Multi-Team QBs**: Aggregates games started across all teams in a season

### Performance Optimizations:
- **Single Pass Calculation**: All metrics calculated in one iteration
- **Minimal Memory Usage**: No storage of intermediate arrays
- **Efficient Aggregation**: Year weights applied during accumulation

---

## Relationship to Other QEI Components

### Durability vs. Team Success:
- **Positive Correlation**: More games = more opportunities for wins
- **Availability Impact**: Injured QBs can't contribute to team success
- **Backup Effect**: Team performance often suffers with backup QBs

### Durability vs. Statistical Performance:
- **Volume Relationship**: More games = more statistical opportunities
- **Per-Game Normalization**: Stats calculated per game to avoid durability bias
- **Sample Size**: Better statistics with larger game samples

### Durability vs. Clutch Performance:
- **Opportunity Factor**: More games = more clutch situations faced
- **Pressure Situations**: Available QBs handle more game-deciding moments
- **Experience Building**: Durability enables clutch skill development

### Durability vs. Supporting Cast:
- **Independence**: Durability largely independent of team quality
- **Injury Risk**: Poor protection may increase injury risk
- **Load Management**: Good teams may rest QBs in meaningless games

---

## Default Weight in QEI System

### Standard Configuration:
- **Durability Category Weight**: 10% (in balanced preset)
- **Range**: 0-100 points
- **Contribution to Final QEI**: Up to 10 points (in default balanced preset)

### Philosophy Preset Weights:
| Preset | Durability Weight | Rationale |
|--------|------------------|-----------|
| **Winner** | 5% | Team success more important than individual availability |
| **Analyst** | 5% | Statistical performance prioritized over durability |
| **Clutch** | 5% | Clutch performance more valued than availability |
| **Balanced** | 10% | Moderate importance in overall evaluation |
| **Context** | 10% | Balanced approach including durability factors |

---

## Historical Context and Design Philosophy

### NFL Durability Trends:
- **Average Starter**: ~13-14 games per season
- **Elite Availability**: 16+ games consistently
- **Injury Impact**: Significant difference between starters and backups
- **Career Longevity**: Durability often predicts career length

### System Design Principles:
1. **Availability Focus**: Pure measurement of being on the field
2. **Multi-Year Perspective**: Single-season injuries don't define durability
3. **Weighted Recency**: Recent availability more predictive
4. **Consistency Rewards**: Bonus for sustained performance
5. **Threshold-Based**: Clear performance tiers for evaluation

### Maximum Score Distribution:
- **Season Availability**: 80 points (80% of total)
- **Consistency Bonuses**: 20 points (20% of total)
- **Perfect Score Scenario**: 17 games × 3 seasons with full bonuses

The durability scoring system provides a comprehensive evaluation of quarterback availability and reliability, serving as a crucial foundation for understanding a QB's value to their team over multiple seasons. 