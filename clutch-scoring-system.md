# Clutch Performance Scoring System Documentation

## Overview
The Clutch Performance Score evaluates a quarterback's ability to perform in high-pressure, game-deciding situations using situational split data from Supabase. The system analyzes performance across 7 clutch categories using advanced metrics (ANY/A, TD rate, sack rate, turnover rate) instead of traditional passer rating. The maximum possible score is **100 points**.

---

## System Architecture

### Data Source
The system uses situational split data from Supabase tables:
- **`qb_splits_advanced`**: Primary source for situational statistics
- **`qb_splits`**: Secondary source for fumble data and additional metrics

### Temporal Weighting
All clutch calculations use the same year-based weighting system:
- **2024**: 55% weight (current season emphasis)
- **2023**: 35% weight (recent performance)
- **2022**: 10% weight (historical context)

### Core Clutch Categories
The system evaluates 7 clutch performance categories:
1. **Third Down Success**: Performance on 3rd down conversions
2. **Fourth Down Success**: Performance on 4th down attempts
3. **Red Zone Success**: Performance in the red zone
4. **Ultra-High Pressure**: Performance in late-game situations
5. **Score Differential**: Performance when trailing vs leading
6. **November Performance**: Late-season pressure situations
7. **December/January Performance**: Playoff push situations

---

## Scoring Components Breakdown

### 1. Third Down Success (20% weight)
**Performance on 3rd down conversions across all distances**

#### Split Queries:
- **Split Type**: "Down & Yards to Go"
- **Values**: "3rd & 1-3", "3rd & 4-6", "3rd & 7-9", "3rd & 10+"

#### Metrics:
- **Conversion Rate** (40%): First downs per attempt
- **ANY/A** (25%): Adjusted Net Yards per Attempt
- **Sack Rate** (20%): Sacks per dropback (inverted)
- **Turnover Rate** (15%): Turnovers per attempt (inverted)

### 2. Fourth Down Success (15% weight)
**Performance on 4th down attempts across all distances**

#### Split Queries:
- **Split Type**: "Down & Yards to Go"
- **Values**: "4th & 1-3", "4th & 4-6", "4th & 7-9", "4th & 10+"

#### Metrics:
- **Conversion Rate** (50%): First downs per attempt
- **ANY/A** (30%): Adjusted Net Yards per Attempt
- **Turnover Rate** (20%): Turnovers per attempt (inverted)

### 3. Red Zone Success (15% weight)
**Performance in the red zone (opponent's 20-yard line and in)**

#### Split Queries:
- **Split Type**: "Field Position"
- **Values**: "Red Zone"

#### Metrics:
- **Touchdown Rate** (40%): Touchdowns per attempt
- **ANY/A** (30%): Adjusted Net Yards per Attempt
- **Turnover Rate** (20%): Turnovers per attempt (inverted)
- **Sack Rate** (10%): Sacks per dropback (inverted)

### 4. Ultra-High Pressure (20% weight)
**Performance in ultra-high pressure late-game situations**

#### Split Queries:
- **Split Type**: "Game Situation"
- **Values**: "Trailing, < 2 min to go", "Tied, < 2 min to go", "Trailing, < 4 min to go"

#### Metrics:
- **ANY/A** (35%): Adjusted Net Yards per Attempt
- **Touchdown Rate** (25%): Touchdowns per attempt
- **Sack Rate** (20%): Sacks per dropback (inverted)
- **Turnover Rate** (20%): Turnovers per attempt (inverted)

### 5. Score Differential (10% weight)
**Performance when trailing vs leading in games**

#### Split Queries:
- **Split Type**: "Score Differential"
- **Values**: "Trailing", "Leading"

#### Metrics:
- **Trailing ANY/A** (40%): ANY/A when trailing
- **Trailing Touchdown Rate** (30%): TD rate when trailing
- **Trailing Turnover Rate** (30%): Turnover rate when trailing (inverted)

### 6. November Performance (10% weight)
**Performance in November (late-season pressure)**

#### Split Queries:
- **Split Type**: "Month"
- **Values**: "November"

#### Metrics:
- **ANY/A** (40%): Adjusted Net Yards per Attempt
- **Touchdown Rate** (30%): Touchdowns per attempt
- **Sack Rate** (15%): Sacks per dropback (inverted)
- **Turnover Rate** (15%): Turnovers per attempt (inverted)

### 7. December/January Performance (10% weight)
**Performance in December/January (playoff push)**

#### Split Queries:
- **Split Type**: "Month"
- **Values**: "December", "January"

#### Metrics:
- **ANY/A** (40%): Adjusted Net Yards per Attempt
- **Touchdown Rate** (30%): Touchdowns per attempt
- **Sack Rate** (15%): Sacks per dropback (inverted)
- **Turnover Rate** (15%): Turnovers per attempt (inverted)

---

## Key Metrics Explained

### ANY/A (Adjusted Net Yards per Attempt)
**Formula**: `(pass yards + 20*(pass TD) - 45*(interceptions) - sack yards)/(passing attempts + sacks)`

The gold standard for QB efficiency, incorporating:
- **Positive factors**: Passing yards, touchdowns
- **Negative factors**: Interceptions, sacks, sack yards
- **Context**: Accounts for all dropbacks (attempts + sacks)

### Touchdown Rate
**Formula**: `touchdowns / attempts`

More accurate than TD% which uses completions as denominator. Better reflects true scoring efficiency.

### Sack Rate
**Formula**: `sacks / (attempts + sacks)`

Critical in clutch situations where avoiding negative plays is essential. Lower is better.

### Turnover Rate
**Formula**: `(interceptions + fumbles) / attempts`

Combines both passing and rushing turnovers. More comprehensive than just interception rate. Lower is better.

### Conversion Rate
**Formula**: `first_downs / attempts`

Measures situational success in converting downs. Higher is better.

---

## Calculation Methodology

### 1. Data Aggregation
For each category, the system:
- Queries relevant split data from Supabase
- Aggregates multiple split values (e.g., all "3rd & X" situations)
- Applies year weights (2024: 55%, 2023: 35%, 2022: 10%)
- Requires minimum 10 attempts per category

### 2. Metric Calculation
For each category:
- Calculates all relevant metrics from raw stats
- Applies metric weights within the category
- Normalizes inverted metrics (sack rate, turnover rate)
- Combines metrics into category score

### 3. Z-Score Normalization
- Compares QB's category performance to all QBs
- Calculates z-scores for relative performance
- Uses statistical standardization for accurate scoring

### 4. Final Score Calculation
- Applies category weights (Critical: 50%, Late-Game: 30%, Late-Season: 20%)
- Combines weighted z-scores
- Scales to 0-100 range
- Applies playoff adjustment if enabled

---

## Performance Benchmarks

### Elite Clutch Performance (90+ points)
- **ANY/A**: 7.5+ in clutch situations
- **Conversion Rate**: 60%+ on 3rd/4th down
- **Touchdown Rate**: 8%+ in red zone
- **Turnover Rate**: <3% in pressure situations

### Very Good Clutch Performance (75-89 points)
- **ANY/A**: 6.5-7.5 in clutch situations
- **Conversion Rate**: 50-60% on 3rd/4th down
- **Touchdown Rate**: 6-8% in red zone
- **Turnover Rate**: 3-5% in pressure situations

### Above Average Clutch Performance (60-74 points)
- **ANY/A**: 5.5-6.5 in clutch situations
- **Conversion Rate**: 40-50% on 3rd/4th down
- **Touchdown Rate**: 4-6% in red zone
- **Turnover Rate**: 5-7% in pressure situations

### Average Clutch Performance (45-59 points)
- **ANY/A**: 4.5-5.5 in clutch situations
- **Conversion Rate**: 30-40% on 3rd/4th down
- **Touchdown Rate**: 2-4% in red zone
- **Turnover Rate**: 7-10% in pressure situations

### Below Average Clutch Performance (<45 points)
- **ANY/A**: <4.5 in clutch situations
- **Conversion Rate**: <30% on 3rd/4th down
- **Touchdown Rate**: <2% in red zone
- **Turnover Rate**: >10% in pressure situations

---

## Technical Implementation

### Data Requirements
- **Minimum Attempts**: 10 per category for statistical significance
- **Split Data**: Available in `qb_splits_advanced` and `qb_splits` tables
- **Year Coverage**: 2022-2024 for multi-year analysis
- **Playoff Integration**: Optional playoff adjustment factor

### Error Handling
- **Missing Data**: Defaults to 0 with logging
- **Insufficient Sample**: Requires minimum attempt thresholds
- **Database Errors**: Graceful fallback to 0 score
- **Invalid Metrics**: Validation and sanitization

### Performance Considerations
- **Caching**: Split data cached at season level
- **Batch Queries**: Minimize database calls
- **Z-Score Calculation**: Efficient statistical processing
- **Memory Management**: Optimized data structures

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

## Advantages of New System

### 1. **Situational Accuracy**
- Uses actual split data instead of outcome-based metrics
- Evaluates performance in specific clutch situations
- More predictive of future clutch performance

### 2. **Advanced Metrics**
- ANY/A is more accurate than passer rating
- Sack rate and turnover rate better reflect risk management
- Conversion rate measures situational success

### 3. **Comprehensive Coverage**
- 7 different clutch categories
- Multiple pressure situations
- Late-season performance emphasis

### 4. **Statistical Rigor**
- Z-score normalization for fair comparison
- Minimum sample size requirements
- Proper weighting and aggregation

### 5. **Data-Driven**
- Uses Supabase split data
- Real-time performance evaluation
- Scalable to additional categories

---

## Future Enhancements

### Potential Additions:
- **Weather Conditions**: Performance in adverse weather
- **Opponent Strength**: Clutch performance vs quality defenses
- **Game Script**: Performance when trailing by different amounts
- **Time of Day**: Prime time vs regular game performance

### Technical Improvements:
- **Real-time Updates**: Live split data integration
- **Advanced Analytics**: Machine learning for pattern recognition
- **Visualization**: Interactive clutch performance charts
- **Comparisons**: Head-to-head clutch performance analysis

---

## Conclusion

The new clutch scoring system represents a significant advancement in QB evaluation, moving from outcome-based metrics to performance-based analysis. By using situational split data and advanced metrics, the system provides a more accurate and comprehensive assessment of a quarterback's ability to perform in clutch moments.

The system is designed to be:
- **Accurate**: Uses the best available metrics and data
- **Comprehensive**: Covers all major clutch situations
- **Fair**: Statistical normalization ensures fair comparison
- **Scalable**: Framework supports additional categories and metrics
- **Transparent**: Clear methodology and benchmarks

This approach better identifies quarterbacks who consistently perform well in high-pressure situations, providing valuable insights for team building and player evaluation.