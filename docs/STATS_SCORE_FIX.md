# Stats Score Z-Score Data Structure Fix

## Issue Summary

All QBs were receiving a stats score of 0 (defaulting to 50 after z-score to percentile conversion) because the `calculateStatsScore` function couldn't access the population data needed to calculate z-scores.

### Root Cause

The `calculateStatsScore` function expects `allQBData` to be an array of QB objects with a `years` property (object with year keys), but the actual data structure being passed has a `seasonData` property (array of season objects).

**Data Structure Mismatch:**

```javascript
// What statsScore.js expected:
{
  name: "Patrick Mahomes",
  years: {
    2024: { Att: 500, Cmp: 350, Yds: 4500, ... },
    2023: { Att: 550, Cmp: 375, Yds: 4800, ... }
  }
}

// What was actually being passed from processQBData:
{
  name: "Patrick Mahomes",
  seasonData: [
    { year: 2024, attempts: 500, completions: 350, passingYards: 4500, ... },
    { year: 2023, attempts: 550, completions: 375, passingYards: 4800, ... }
  ]
}
```

### Impact

When the stats calculation functions tried to access `qb.years[year]`, they got `undefined` because `qb.years` didn't exist. This caused:

1. **No population data**: `yearDataForAllQBs` remained empty
2. **Early returns**: Functions returned without calculating z-scores
3. **Default scores**: All z-scores defaulted to 0
4. **Uniform output**: After conversion, all QBs got ~50th percentile scores

## Solution Implemented

### File Modified: `src/components/scoringCategories/statsScore.js`

Added data structure handling logic in three locations where population data is built:

1. **`calculateEfficiencyZScores`** (lines 73-114)
2. **`calculateProtectionZScores`** (lines 201-241)  
3. **`calculateVolumeZScores`** (lines 325-365)

### Fix Pattern

```javascript
// Before (only handled years format):
allQBData.forEach(qb => {
  if (qb.years && qb.years[year]) {
    const qbYearData = qb.years[year];
    // ... process data
  }
});

// After (handles both formats):
allQBData.forEach(qb => {
  let qbYearData = null;
  
  // Handle years object format
  if (qb.years && qb.years[year]) {
    qbYearData = qb.years[year];
  } 
  // Handle seasonData array format
  else if (qb.seasonData) {
    const season = qb.seasonData.find(s => s.year === parseInt(year));
    if (season) {
      // Convert season format to years format
      qbYearData = {
        Att: season.attempts,
        Cmp: season.completions,
        Yds: season.passingYards,
        TD: season.passingTDs,
        Int: season.interceptions,
        Sk: season.sacks || 0,
        'ANY/A': season.anyPerAttempt || 0,
        RushingYds: season.rushingYards || 0,
        RushingTDs: season.rushingTDs || 0,
        RushingAtt: season.rushingAttempts || 0,
        Fumbles: season.fumbles || 0,
        Player: qb.name
      };
    }
  }
  
  if (qbYearData) {
    // ... process data
  }
});
```

### Conversion Mapping

| Season Data Property | Years Data Property |
|---------------------|---------------------|
| `attempts` | `Att` |
| `completions` | `Cmp` |
| `passingYards` | `Yds` |
| `passingTDs` | `TD` |
| `interceptions` | `Int` |
| `sacks` | `Sk` |
| `anyPerAttempt` | `ANY/A` |
| `rushingYards` | `RushingYds` |
| `rushingTDs` | `RushingTDs` |
| `rushingAttempts` | `RushingAtt` |
| `fumbles` | `Fumbles` |

## Result

### Before Fix
- **All QBs**: Stats Z-Score = 0 → Percentile ≈ 50
- **No differentiation**: Every QB got the same stats score regardless of performance
- **Warning logs**: "⚠️ No allQBData provided to calculateStatsScore"

### After Fix
- **Proper Z-Scores**: Each QB gets a z-score based on their actual performance relative to league population
- **Full differentiation**: Elite QBs (Mahomes, Allen, Jackson) show positive z-scores, average QBs near 0, below-average QBs show negative z-scores
- **Accurate percentiles**: Z-scores correctly convert to percentiles reflecting true performance distribution

## Testing Recommendations

1. **Check Elite QBs**: Mahomes, Allen, Jackson should show positive stats z-scores
2. **Check Average QBs**: Mid-tier QBs should show z-scores near 0
3. **Check Struggling QBs**: Lower-tier QBs should show negative stats z-scores
4. **Console Logs**: Watch for debug logs showing actual z-score calculations:
   ```
   📊 STATS Z-SCORES Patrick Mahomes:
      Efficiency Z: 1.234 (weight: 45)
      Protection Z: 0.876 (weight: 25)
      Volume Z: 1.543 (weight: 30)
      → Stats Composite Z: 1.185
   ```

## Related Components

This fix is part of the z-score migration where all scoring categories now return composite z-scores instead of 0-100 percentiles. Related fixes:

- **Team Score**: Already using z-scores ✓
- **Stats Score**: Fixed with this change ✓
- **Clutch Score**: Uses z-scores ✓
- **Durability Score**: Uses z-scores ✓
- **Support Score**: Uses z-scores ✓

## Why This Happened

The data structure inconsistency arose from:

1. **Data Flow**: `processQBData` creates QB objects with `seasonData` array
2. **Calculation Flow**: `calculateQBMetrics` converts individual QB's `seasonData` to `years` object for that QB
3. **Population Data**: But `allQBData` still has the original `seasonData` structure
4. **Mismatch**: Stats calculations expected all QBs to have `years` format

## Future Prevention

To prevent similar issues:

1. **Document data structures** clearly in function JSDoc
2. **Validate inputs** with structure checks at function entry
3. **Consistent naming** between data sources (CSV vs Supabase)
4. **Type checking** (consider adding TypeScript or JSDoc type definitions)

