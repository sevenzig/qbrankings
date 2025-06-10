# Team Scoring System Documentation

## Overview
The Team Scoring System evaluates quarterback performance based on wins, losses, playoff success, and availability. The maximum possible score is **100 points**, distributed across three main components.

---

## Year Weighting System

All calculations use a weighted average across seasons:
- **2024**: 55% weight (current season emphasis)
- **2023**: 35% weight (recent performance)
- **2022**: 10% weight (historical context)

---

## Score Components Breakdown

### 1. Regular Season Win Percentage (0-50 points)
**Formula**: `(Win% ^ 0.6) × 50`

- **Input**: Combined regular season + playoff win percentage
- **Scaling**: Exponential curve (0.6 power) favoring winners
- **Maximum**: 50 points
- **Note**: Recently increased by 25% from 40 points to better balance regular season vs playoff performance

#### Win Percentage Calculation:
- Takes QB record format: "14-3-0" (wins-losses-ties)
- Adds weighted playoff performance to regular season record
- Includes bye week bonuses for earned first-round byes

### 2. Availability Score (0-15 points)
**Formula**: `Availability × 15`

- **Input**: (Games Started) / (Possible Games)
- **Regular Season**: Out of 17 games
- **Playoffs**: Up to 4 additional games if team makes playoffs
- **Maximum**: 15 points

### 3. Career Playoff Achievement Score (0-45 points)
**Components**:

#### Super Bowl Performance:
- **Super Bowl Win**: 15 points per appearance (reduced from 50)
- **Super Bowl Loss**: 9 points per appearance (reduced from 30)

#### Conference Championship Performance:
- **Conference Championship Win**: 2.4 points per appearance (reduced from 8)
- **Conference Championship Appearance**: 1.2 points per appearance (reduced from 4)

#### Base Playoff Participation:
- **0.36 points per playoff game** (reduced from 1.2)

#### Additional Playoff Win Bonus:
- **Formula**: `Playoff Win Rate × Playoff Games × 0.18`

---

## Playoff Weighted Wins System

### Round-Specific Weight Values (Heavily Reduced)
Due to multiple reduction cycles (60% + 70%), current values are:

- **Super Bowl Win**: 0.6 weight
- **Super Bowl Loss**: 0.3 weight
- **Conference Championship Win**: 0.42 weight
- **Conference Championship Loss**: 0.21 weight
- **Divisional Round Win**: 0.3 weight
- **Divisional Round Loss**: 0.15 weight
- **Wild Card Win**: 0.21 weight
- **Wild Card Loss**: 0.12 weight

### Playoff Path Detection Logic:

#### 4-Game Playoff Run (No Bye):
- **4-0**: Wild Card + Divisional + Conf Champ + Super Bowl wins
- **3-1**: Wild Card + Divisional + Conf Champ wins + Super Bowl loss

#### 3-Game Playoff Run (With Bye):
- **3-0**: Divisional + Conf Champ + Super Bowl wins
- **2-1**: Divisional + Conf Champ wins + Super Bowl loss

#### 2-Game Playoff Run:
- **2-0**: Divisional + Conference Championship wins
- **1-1**: Typically Wild Card win + Divisional loss

#### 1-Game Playoff Run:
- **1-0**: Wild Card win only
- **0-1**: Wild Card loss only

### Bye Week Bonus System
**Value**: 0.21 points (reduced from 0.7)

**Detection**: Teams that played ≤3 playoff games with ≥1 win, cross-referenced with known bye week teams:

#### Known Bye Week Teams by Year:
- **2024**: KC, BUF, DET, PHI, BAL, HOU, MIN, LAR
- **2023**: BAL, BUF, KC, SF, DAL, DET, PHI, MIA  
- **2022**: BUF, KC, TEN, PHI, MIN, SF, BAL, CIN

---

## Super Bowl Detection System

### Known Historical Results:
- **Super Bowl Wins**:
  - KC: 2023, 2024 (Mahomes)
  - TAM: 2022 (Brady)
  - LAR: 2022 (Stafford)

- **Super Bowl Appearances**:
  - KC: 2022, 2023, 2024 (Mahomes)
  - PHI: 2023 (Hurts)
  - CIN: 2022 (Burrow)
  - SFO: 2023 (Purdy)

### Fallback Detection:
For unknown cases, uses game-based logic:
- **3+ playoff games with 2+ wins**: Potential Super Bowl run
- **Specific win patterns**: Cross-references wins/losses with likely playoff paths

---

## Special Modifiers

### Experience Modifier:
- **Only applied when Durability weight > 0**
- **Rookie (1 year)**: 0.93× modifier (7% penalty)
- **Second-year (2 years)**: 0.97× modifier (3% penalty)
- **Veteran (3+ years)**: 1.0× modifier (no penalty)

### Elite Bonus:
- **Only applied for comprehensive evaluations (3+ weighted categories)**
- **Threshold**: Scores ≥85 points
- **Bonus**: Up to 5 additional points using exponential curve
- **Formula**: `((Score - 85) / 15) ^ 1.2 × 5`

---

## Reduction History

### Original → 60% Reduction → Additional 70% Reduction:

#### Playoff Multipliers Example:
- **Super Bowl Win**: 5.0 → 2.0 → 0.6
- **Conference Championship Win**: 3.5 → 1.4 → 0.42
- **Wild Card Win**: 1.8 → 0.7 → 0.21

#### Playoff Bonuses Example:
- **Super Bowl Win Bonus**: 50 → 20 → 15 points
- **Conference Championship Win Bonus**: 20 → 8 → 2.4 points
- **Base Playoff Game Value**: 3 → 1.2 → 0.36 points

#### Win Bonus Multiplier:
- **Playoff Win Rate Multiplier**: 1.5 → 0.6 → 0.18

---

## Final Calculation Summary

```javascript
// Per season (weighted by year):
combinedWinPct = (regularSeasonWins + playoffWeightedWins + byeBonus) / totalGames
availability = (gamesStarted) / (possibleGames)

// Across all seasons:
regSeasonScore = (weightedWinPct ^ 0.6) × 50        // 0-50 points
availabilityScore = weightedAvailability × 15       // 0-15 points  
careerPlayoffScore = Sum of all playoff bonuses     // 0-45 points (capped)

// Final team score:
teamScore = regSeasonScore + availabilityScore + min(45, careerPlayoffScore)
```

**Maximum Possible Score**: 110 points (capped at 100)

---

## Notes

1. **Playoff Impact Minimized**: After multiple reduction cycles, playoff performance has much less impact than originally designed
2. **Regular Season Emphasized**: Win percentage component increased to balance the reduced playoff weights
3. **Factual Constants**: Super Bowl appearances and known results are factual constants, not player-specific advantages
4. **Experience Factor**: Only affects scores when durability is being evaluated (related to availability/health)
5. **Comprehensive vs Simple**: Elite bonuses and experience modifiers only apply to multi-factor evaluations, not simple 2-component calculations 