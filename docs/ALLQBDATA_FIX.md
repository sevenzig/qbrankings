# Fix: Missing allQBData Parameter

## Issue

The error "⚠️ No allQBData provided to calculateStatsScore - cannot calculate z-scores" was occurring because the data hooks were calling `calculateQBMetrics(qb)` without passing the complete QB array needed for z-score population statistics.

## Root Cause

Z-score calculations require population statistics (mean and standard deviation) calculated across ALL quarterbacks. The scoring functions need access to `allQBData` to:

1. Calculate population mean for each stat
2. Calculate population standard deviation 
3. Compute z-scores relative to the full QB population
4. Convert z-scores to percentiles

## Files Fixed

### 1. `src/hooks/useQBData.js`

**Before:**
```javascript
const baseScores = calculateQBMetrics(qb);
```

**After:**
```javascript
const baseScores = calculateQBMetrics(
  qb,
  { offensiveLine: 55, weapons: 30, defense: 15 }, // supportWeights
  { efficiency: 45, protection: 25, volume: 30 }, // statsWeights
  { regularSeason: 65, playoff: 35 }, // teamWeights
  { gameWinningDrives: 40, fourthQuarterComebacks: 25, clutchRate: 15, playoffBonus: 20 }, // clutchWeights
  true, // includePlayoffs
  include2024Only,
  { anyA: 45, tdPct: 30, completionPct: 25 }, // efficiencyWeights
  { sackPct: 60, turnoverRate: 40 }, // protectionWeights
  { passYards: 25, passTDs: 25, rushYards: 20, rushTDs: 15, totalAttempts: 15 }, // volumeWeights
  { availability: 75, consistency: 25 }, // durabilityWeights
  processedQBs, // allQBData for z-score calculations ← KEY FIX
  0 // mainSupportWeight
);
```

### 2. `src/hooks/useSupabaseQBData.js`

Fixed **4 instances** of the same issue in different methods:
- `fetchAllQBData()` - Main data fetch
- `fetchQBDataByYear()` - Year-specific fetch
- `fetchQBDataByName()` - Name-specific fetch  
- `fetchQBDataWithFilters()` - Filtered fetch

Each now passes `processedQBs` as the `allQBData` parameter.

## Why This Matters

### Z-Score Formula Requires Population Data

```javascript
z = (X - μ) / σ

Where:
- X = individual QB's stat value
- μ = MEAN across ALL QBs (requires allQBData)
- σ = STANDARD DEVIATION across ALL QBs (requires allQBData)
```

Without `allQBData`, the scoring functions cannot calculate the mean and standard deviation needed for z-scores, causing them to fall back to default values and log warnings.

## Impact

### Before Fix:
- Warning messages in console
- Z-score calculations falling back to defaults
- Less accurate statistical comparisons
- Potential scoring inconsistencies

### After Fix:
- ✅ Clean console (no warnings)
- ✅ Proper z-score calculations with actual population statistics
- ✅ Accurate statistical standardization
- ✅ Consistent scoring across all data sources (CSV and Supabase)

## Default Weights Used

The hooks now use default weights for initial calculations. These match the application defaults and will be overridden when the user adjusts weights in `DynamicQBRankings.jsx`:

- **Support**: OL 55%, Weapons 30%, Defense 15%
- **Stats**: Efficiency 45%, Protection 25%, Volume 30%
- **Team**: Regular Season 65%, Playoff 35%
- **Clutch**: GWD 40%, 4QC 25%, Rate 15%, Playoff 20%
- **Efficiency**: ANY/A 45%, TD% 30%, Completion% 25%
- **Protection**: Sack% 60%, Turnover Rate 40%
- **Volume**: Pass Yards 25%, Pass TDs 25%, Rush Yards 20%, Rush TDs 15%, Total Attempts 15%
- **Durability**: Availability 75%, Consistency 25%

## Validation

- ✅ No linter errors
- ✅ Both hooks (`useQBData` and `useSupabaseQBData`) fixed
- ✅ All 4 data fetch methods in Supabase hook updated
- ✅ `processedQBs` correctly passed as `allQBData` parameter
- ✅ Consistent implementation across all data sources

## Testing Recommendations

1. **Verify no console warnings** - Check that the warning message no longer appears
2. **Check score distributions** - Stats should now properly spread in 0-100 range
3. **Compare rankings** - Ensure rankings are sensible and consistent
4. **Test both data sources** - Verify CSV and Supabase paths both work
5. **Validate z-scores** - Elite QBs should have scores in 80-100 range for their strengths

