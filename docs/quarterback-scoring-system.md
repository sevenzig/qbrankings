# Quarterback Statistics Scoring System Documentation

## Overview
The QB Rankings system evaluates quarterback performance using a comprehensive **Quarterback Excellence Index (QEI)** that combines five major scoring categories. Each category is scored on a 0-100 scale and weighted based on user preferences to create a final composite score.

---

## System Architecture

### Core Weighting System
The system uses configurable weights for five main categories:
- **Team Success**: 30% (default)
- **Statistical Performance**: 40% (default)  
- **Clutch Performance**: 15% (default)
- **Durability**: 10% (default)
- **Supporting Cast**: 5% (default)

### Year Weighting System
All calculations use temporal weighting across the last three seasons:
- **2024**: 55% weight (current season emphasis)
- **2023**: 35% weight (recent performance)
- **2022**: 10% weight (historical context)

---

## 1. Team Success Score (0-100 points)

### Components:
1. **Regular Season Win Percentage** (0-50 points)
2. **Availability Score** (0-15 points)
3. **Career Playoff Achievement** (0-45 points, capped)

### 1.1 Win Percentage Calculation
**Formula**: `(Combined Win% ^ 0.6) × 50`

**Combined Win% Components**:
- Regular season wins and losses
- Weighted playoff performance 
- Bye week bonuses for earned first-round byes

### 1.2 Playoff Round Weighting System

#### Current Weight Values (After 70% Reduction):
- **Super Bowl Win**: 0.6 weight
- **Super Bowl Loss**: 0.3 weight  
- **Conference Championship Win**: 0.42 weight
- **Conference Championship Loss**: 0.21 weight
- **Divisional Round Win**: 0.3 weight
- **Divisional Round Loss**: 0.15 weight
- **Wild Card Win**: 0.21 weight
- **Wild Card Loss**: 0.12 weight
- **Bye Week Bonus**: 0.21 weight

### 1.3 Career Playoff Achievement Scoring

#### Super Bowl Performance:
- **Super Bowl Win**: 15 points per appearance
- **Super Bowl Loss**: 9 points per appearance

#### Conference Championship Performance:
- **Conference Championship Win**: 2.4 points per appearance
- **Conference Championship Appearance**: 1.2 points per appearance

#### Base Playoff Participation:
- **0.36 points per playoff game**

#### Additional Playoff Win Bonus:
- **Formula**: `Playoff Win Rate × Playoff Games × Weight × 0.18`

### 1.4 Availability Score
**Formula**: `Weighted Availability × 15`
- **Input**: (Games Started) / (Possible Games)
- **Regular Season**: Out of 17 games
- **Playoffs**: Up to 4 additional games possible

---

## 2. Statistical Performance Score (0-100 points)

### Statistical Scaling Constants:

#### Efficiency Metrics:
- **Passer Rating**: Threshold 75, Scale 1.8, Max 25 points
- **ANY/A (Adjusted Net Yards/Attempt)**: Threshold 4.5, Scale 7, Max 35 points
- **Y/A (Yards per Attempt)**: Threshold 6.0, Scale 5, Max 15 points

#### Percentage Metrics:
- **TD%**: Threshold 3.0%, Scale 4, Max 20 points
- **INT%**: Threshold 3.5%, Scale -6, Max 15 points (inverted - lower is better)
- **Success Rate**: Threshold 40%, Scale 0.5, Max 10 points
- **Sack%**: Threshold 12%, Scale -3, Max 30 points (inverted - lower is better)

#### Volume Metrics:
- **Passing Yards**: Threshold 3000, Scale 0.000005, Max 8 points
- **Passing TDs**: Threshold 20, Scale 0.3, Max 7 points

### 2.1 Detailed Statistical Categories (134 total possible points, scaled to 100):

#### 1. Accuracy & Completion (0-18 points)
- **Formula**: `max(0, min(18, (Completion% - 58) × 1.5))`
- **Benchmarks**: Elite 70%+ (18 pts), Good 67%+ (12 pts), Average 65%+ (9 pts)

#### 2. Volume & Opportunity (0-12 points)  
- **Formula**: `max(0, min(12, (Attempts/Game - 22) × 0.8))`
- **Benchmarks**: Elite 35+ att/game (12 pts), Good 32+ (9 pts), Average 28+ (6 pts)

#### 3. Touchdown Efficiency (0-20 points)
- **Formula**: `max(0, min(20, (TD% - 3.0) × 8.0))`
- **Benchmarks**: Elite 5.5%+ (20 pts), Good 4.8%+ (15 pts), Average 4.2%+ (10 pts)

#### 4. Total Touchdown Production (0-12 points)
- **Formula**: `max(0, min(12, (Total TDs - 15) × 0.4))`  
- **Includes**: Passing TDs + Rushing TDs

#### 5. Ball Security - Interception Rate (0-15 points)
- **Formula**: `max(0, min(15, (3.2 - INT%) × 7.5))`
- **Benchmarks**: Elite 1.5% (15 pts), Good 2.0% (12 pts), Average 2.4% (9 pts)

#### 6. Total Turnover Protection (0-8 points)
- **Formula**: `max(0, min(8, (22 - Total Turnovers) × 0.4))`
- **Includes**: Interceptions + Fumbles

#### 7. Sack Avoidance (0-7 points)
- **Formula**: `max(0, min(7, (9 - Sack%) × 1.0))`
- **Benchmarks**: Elite 4% (7 pts), Good 5.5% (5 pts), Average 6.5% (4 pts)

#### 8. Yards Per Attempt (0-12 points)
- **Formula**: `max(0, min(12, (Y/A - 6.0) × 6.0))`
- **Benchmarks**: Elite 8.0+ (12 pts), Good 7.5+ (9 pts), Average 7.0+ (6 pts)

#### 9. Yards Per Completion (0-8 points)
- **Formula**: `max(0, min(8, (Y/C - 9.5) × 2.67))`
- **Benchmarks**: Elite 12.5+ (8 pts), Good 11.5+ (6 pts), Average 11.0+ (4 pts)

#### 10. First Down Generation (0-12 points)
- **Formula**: `max(0, min(12, (1st Downs/Game - 8) × 1.5))`
- **Benchmarks**: Elite 16+ (12 pts), Good 14+ (9 pts), Average 12+ (6 pts)

#### 11. Success Rate (0-10 points)
- **Formula**: `max(0, min(10, (Success Rate - 40) × 1.0))`
- **Benchmarks**: Elite 50%+ (10 pts), Good 47%+ (7 pts), Average 45%+ (5 pts)

### 2.2 Final Stats Score Calculation:
**Formula**: `min(100, (Total Score / 90) × 100)`
- Elite QBs scoring 90+ points receive 100% rating
- Scaled from 134-point system to 0-100 range

---

## 3. Clutch Performance Score (0-100 points)

### 3.1 Core Clutch Metrics:

#### Game Winning Drives (0-40 points)
- **Formula**: `min(40, GWD per Game × 120)`
- **Scale**: 0.33 GWD/game = maximum points

#### 4th Quarter Comebacks (0-25 points)  
- **Formula**: `min(25, 4QC per Game × 100)`
- **Scale**: 0.25 comebacks/game = maximum points

#### Combined Clutch Rate (0-15 points)
- **Formula**: `min(15, (GWD + 4QC) per Game × 50)`

#### Playoff Success Bonus (0-20 points)
- **Formula**: `min(20, Playoff Win Rate × 20 + Playoff Games × 2)`

### 3.2 Playoff Clutch Multipliers (70% Reduced):
- **Wild Card**: 1.06x multiplier
- **Divisional**: 1.08x multiplier  
- **Conference Championship**: 1.12x multiplier
- **Super Bowl**: 1.22x multiplier

---

## 4. Durability Score (0-100 points)

### 4.1 Availability Components:

#### Season Availability (0-80 points)
- **Formula**: `Weighted Availability × 80`
- **Calculation**: Games Started / 17 possible games per season

#### Multi-Year Consistency Bonus (0-20 points)
- **Full Season Bonus**: 10 points per season with 16+ games started
- **Near-Full Season Bonus**: 5 points per season with 14+ games started  
- **Multi-Year Bonus**: 5 additional points for QBs active in all 3 seasons

### 4.2 Overall Durability Calculation:
**Formula**: `min(100, Availability Score + Consistency Score)`

---

## 5. Supporting Cast Score (0-100 points)

### 5.1 Team Quality Components:

#### Offensive Line Quality (0-35 points)
**Grading Scale**: Elite (30-35), Good (25-29), Average (20-24), Poor (15-19), Very Poor (6-14)

**Top Grades**:
- DEN: 35 (Elite protection and run blocking)
- PHI: 32 (Elite talent across the line)
- DET: 31 (Sewell/Ragnow anchored excellence)

**Bottom Grades**:
- NE: 6 (Bottom of NFL protection)
- CAR: 23 (Improved with additions)
- HOU: 8 (Among worst units)

#### Weapons Quality (0-40 points)  
**Grading Scale**: Elite (35-40), Good (30-34), Average (25-29), Poor (15-24), Very Poor (7-14)

**Top Grades**:
- CIN: 38 (Chase elite, Higgins when healthy)
- MIA: 36 (Hill/Waddle explosive combo)
- MIN: 35 (Jefferson elite, solid depth)

**Bottom Grades**:
- CAR: 7 (Rebuilding everything)
- NE: 8 (Limited talent across the board)
- NYG: 9 (Nabers promising but limited depth)

#### Defense Quality (0-25 points)
**Grading Scale**: Elite (23-25), Good (18-22), Average (12-17), Poor (8-11), Very Poor (5-7)

**Top Grades**:
- BAL: 25 (Elite across all phases)
- BUF: 24 (Elite secondary and pass rush)
- KC: 23 (Elite takeaways and system)

**Bottom Grades**:
- CAR: 5 (Among worst in league)
- NE: 6 (Bottom tier across the board)
- NYG: 7 (Limited talent, rebuilding)

### 5.2 Support Score Calculation:
**Formula**: `max(0, min(100, Raw Support Quality))`

**Logic**: Better supporting cast = Higher quality score
- Teams with excellent support get HIGH scores (better supporting cast)
- Teams with poor support get LOW scores (poor supporting cast)
- Maximum possible support quality: 100 points (35+40+25)

---

## 6. Final QEI Calculation

### 6.1 Base Weighted Score:
```javascript
rawWeightedScore = (
  (teamScore × teamWeight) +
  (statsScore × statsWeight) +
  (clutchScore × clutchWeight) +
  (durabilityScore × durabilityWeight) +
  (supportScore × supportWeight)
) / totalWeight
```

### 6.2 Experience Modifier:
**Applied only when Durability weight > 0**
- **Rookie (1 year)**: 0.93× modifier (7% penalty)
- **Second-year (2 years)**: 0.97× modifier (3% penalty)  
- **Veteran (3+ years)**: 1.0× modifier (no penalty)

### 6.3 Elite Bonus:
**Applied only for comprehensive evaluations (3+ weighted categories)**
- **Threshold**: Scores ≥85 points
- **Formula**: `min(100, Score + ((Score - 85) / 15)^1.2 × 5)`
- **Maximum Bonus**: 5 additional points

### 6.4 Final QEI Formula:
```javascript
adjustedScore = rawWeightedScore × experienceModifier

if (weightedCategories > 2 && adjustedScore >= 85) {
  eliteBonus = ((adjustedScore - 85) / 15)^1.2 × 5
  finalQEI = min(100, adjustedScore + eliteBonus)
} else {
  finalQEI = adjustedScore
}
```

---

## Special Calculations

### Playoff Path Detection:
The system automatically detects playoff progression based on wins/losses patterns:

#### 4-Game Playoff Run (No Bye):
- **4-0**: Wild Card + Divisional + Conf Championship + Super Bowl wins
- **3-1**: Wild Card + Divisional + Conf Championship wins + Super Bowl loss

#### 3-Game Playoff Run (With Bye):  
- **3-0**: Divisional + Conf Championship + Super Bowl wins
- **2-1**: Divisional + Conf Championship wins + Super Bowl loss

#### Bye Week Detection:
Teams that played ≤3 playoff games with ≥1 win are cross-referenced with known bye week teams by year.

### Multi-Team QB Handling:
For quarterbacks who played for multiple teams:
- Support scores are weighted by games started with each team
- All team-specific calculations account for the weighted distribution
- Season statistics are properly attributed to the correct teams

---

## System Notes

1. **Balanced Approach**: The system balances immediate performance (stats/clutch) with team success and durability factors
2. **Temporal Emphasis**: Recent performance is weighted more heavily than historical data
3. **Contextual Adjustments**: Supporting cast difficulty provides appropriate context for individual performance
4. **Comprehensive vs. Simple**: Complex modifiers only apply to multi-factor evaluations
5. **Factual Constants**: Playoff achievements are based on documented historical results
6. **Scalable Design**: All components are normalized to 0-100 scales for consistent weighting

---

## Maximum Possible Scores

| Category | Max Points | Weight (Default) | Contribution |
|----------|------------|------------------|--------------|
| Team Success | 100 | 30% | 30.0 |
| Statistical Performance | 100 | 40% | 40.0 |
| Clutch Performance | 100 | 15% | 15.0 |
| Durability | 100 | 10% | 10.0 |
| Supporting Cast | 100 | 5% | 5.0 |
| **Total Base Score** | | | **100.0** |
| Elite Bonus | +5 max | | +5.0 |
| **Maximum Possible QEI** | | | **105.0** | 