# Z-Score Based Scoring System Migration

## Overview

The QB rankings application has been successfully migrated from a custom percentile-based scoring system to a standardized z-score approach. This provides more accurate statistical differentiation while maintaining the user-configurable weighting system.

## What Changed

### Core Z-Score Utilities (NEW)

**File: `src/utils/zScoreCalculations.js`**

New utility functions for statistical calculations:
- `calculateMean(values)` - Calculate population mean
- `calculateStandardDeviation(values, mean)` - Calculate standard deviation
- `calculateZScore(value, mean, stdDev, invertScore)` - Calculate z-score using formula: `z = (X - μ) / σ`
- `zScoreToPercentile(zScore)` - Convert z-score to percentile using cumulative normal distribution
- `calculateZScoresForStat(allQBData, statExtractor, invertScore)` - Calculate z-scores for all QBs for a given stat
- `calculateWeightedAverageZScore(yearlyZScores)` - For multi-year data
- `calculateCompositeZScore(statZScores, weights)` - Combine multiple z-scores with weights

### Stats Component (REFACTORED)

**File: `src/components/scoringCategories/statsScore.js`**

Replaced percentile lookups with z-score calculations for:

**Efficiency Stats:**
- ANY/A (higher is better)
- TD% (higher is better)
- Completion% (higher is better)

**Protection Stats:**
- Sack% (lower is better - inverted z-score)
- Turnover Rate (higher attempts/turnover is better)

**Volume Stats:**
- Pass Yards (higher is better)
- Pass TDs (higher is better)
- Rush Yards (higher is better)
- Rush TDs (higher is better)
- Total Attempts (higher is better)

**Process:**
1. Collect stat values across all QBs for each year
2. Calculate z-scores per year (respecting year weights: 75% 2024, 20% 2023, 5% 2022)
3. Combine year-weighted z-scores
4. Convert to percentiles (0-100)
5. Apply hierarchical weights (efficiency/protection/volume)

### Support Component (REFACTORED)

**File: `src/components/scoringCategories/supportScore.js`**

Calculates z-scores for:
- **Offensive Line** quality (higher is better)
- **Weapons** quality (higher is better)
- **Defense** quality (higher is better)

Each component is scored relative to all 32 NFL teams using population statistics, then combined with user-configurable weights.

### Team Component (REFACTORED)

**File: `src/components/scoringCategories/teamScore.js`**

Calculates z-scores for:
- **Regular Season Win %** (higher is better)
- **Offensive DVOA** (higher is better)
- **Playoff Success** (converted to percentile scale)

Win percentage and DVOA are standardized across the QB population for accurate comparison.

### Clutch Component (REFACTORED)

**File: `src/components/scoringCategories/clutchScore.js`**

Replaced percentile ranking with z-score calculations for:
- Game-winning drives per game
- Fourth quarter comebacks per game
- Overall clutch rate
- Playoff adjustment factor

### Durability Component (REFACTORED)

**File: `src/components/scoringCategories/durabilityScore.js`**

Replaced linear scoring with z-score calculations for:
- **Availability** (average games played)
- **Consistency** (number of valid seasons with meaningful participation)

### Constants (UPDATED)

**File: `src/components/scoringCategories/constants.js`**

Removed hardcoded `PERFORMANCE_PERCENTILES` object as percentiles are now calculated dynamically using z-scores. Added documentation noting the migration to z-score based calculations.

### Main Calculations (UPDATED)

**File: `src/utils/qbCalculations.js`**

Updated to pass `allQBData` to all scoring functions that need population statistics for z-score calculations:
- `calculateStatsScore(..., allQBData)`
- `calculateDurabilityScore(..., allQBData)`

## Benefits of Z-Score Approach

1. **More Accurate**: Statistical standardization provides true measure of how far a QB is from average
2. **Consistent Scaling**: All stats normalized to the same distribution (mean = 0, stdDev = 1)
3. **Better Differentiation**: Captures subtle performance differences that percentile buckets miss
4. **Mathematically Sound**: Based on standard statistical theory (normal distribution)
5. **Maintains Flexibility**: User weights still control final rankings
6. **Dynamic**: Automatically adjusts to the actual distribution of QB performance

## Z-Score Formula

```javascript
z = (X - μ) / σ

Where:
- X = individual QB's value for a stat
- μ (mu) = population mean across all QBs
- σ (sigma) = population standard deviation
```

### For Inverted Stats (Lower is Better)

```javascript
z = -((X - μ) / σ)

Examples: Sack%, INT%, Fumble%
```

### Percentile Conversion

Z-scores are converted to percentiles (0-100) using the cumulative normal distribution function (CDF):

```javascript
percentile = 50 * (1 + erf(z / sqrt(2)))
```

This provides an intuitive 0-100 score where 50 = average, 84 = +1 std dev (good), 16 = -1 std dev (poor).

## Data Flow Architecture

```
Raw QB Data → Extract Stats by Year
    ↓
Calculate Z-Scores Per Stat Per Year (all QBs)
    ↓
Apply Year Weights (75/20/5) to combine multi-year z-scores
    ↓
Convert Combined Z-Scores to Percentile Scores (0-100 scale)
    ↓
Apply Sub-Category Weights (e.g., efficiency: anyA 45%, tdPct 30%, cmpPct 25%)
    ↓
Apply Category Weights (user's philosophy: team, stats, clutch, durability, support)
    ↓
Final QEI Score
```

## Edge Cases Handled

- **Insufficient data**: QBs with < minimum attempts are filtered before z-score calculation
- **Small sample sizes**: Maintain existing attempt thresholds (50+ for 2024, 100+ for historical)
- **Outliers**: Extreme z-scores capped at ±3 standard deviations before percentile conversion
- **Zero variance**: If all QBs have identical stat values, assign median z-score of 0
- **Missing data**: Graceful fallbacks to league average (percentile = 50)

## Testing Recommendations

1. Verify z-score calculations match expected values for known QBs
2. Ensure rankings remain sensible with default weights
3. Test that user weight adjustments properly affect final scores
4. Validate multi-year weighting works correctly
5. Check that inverted stats (Sack%, INT%) properly flip z-scores
6. Compare rankings before/after migration to ensure consistency

## Backward Compatibility

The system maintains full backward compatibility:
- All existing user-configurable weights still work
- Hierarchical weighting system unchanged
- Penalty systems (game starts, experience) still applied
- UI remains unchanged
- Only the foundational scoring calculations were replaced

## Performance Considerations

Z-score calculations add minimal overhead:
- Population statistics calculated once per stat per year
- Results are immediately converted to percentiles
- No additional API calls or data fetching required
- All calculations remain client-side

## Future Enhancements

Potential improvements to consider:
- Cache z-score calculations for better performance
- Expose z-scores in the UI for advanced users
- Allow toggling between z-score and legacy percentile mode
- Add visualization of QB performance relative to population mean/stdDev

