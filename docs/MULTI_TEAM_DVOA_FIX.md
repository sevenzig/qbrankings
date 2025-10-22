# Multi-Team Season DVOA Fix

## Issue Summary

Joshua Dobbs was being ranked too highly in the 3-year category due to an issue with how the offensive DVOA component of team success was calculated for players who played for multiple teams in a single season.

### Root Cause

When a player played for multiple teams in a season (e.g., Joshua Dobbs in 2023 played for both Arizona and Minnesota), the CSV data includes:
1. Individual team rows with actual team codes (ARI, MIN)
2. A combined row with a multi-team code (2TM, 3TM, etc.)

The `calculateOffensiveDVOAScore` function was receiving the "2TM" team code and returning a **fallback score of 50 (league average)** because "2TM" doesn't exist in the OFFENSIVE_DVOA_DATA lookup table.

### Specific Example: Joshua Dobbs 2023

**Actual Performance:**
- Arizona Cardinals (ARI): 8 games started, 1-7 record
  - Offensive DVOA: -4.5 (rank 21/32)
- Minnesota Vikings (MIN): 4 games started, 2-2 record
  - Offensive DVOA: -7.9 (rank 23/32)

**What Was Happening:**
- System assigned "2TM" → Fallback to 0 z-score (50th percentile equivalent)
- This incorrectly treated him as playing for **average offenses** instead of **below-average offenses**

**What Should Happen:**
- Weighted DVOA: ((-4.5 × 8) + (-7.9 × 4)) / 12 = **-5.6 DVOA**
- This converts to a **negative z-score** that properly reflects below-average offensive output

## Solution Implemented

### 1. Enhanced Data Tracking (`dataProcessor.js`)

Added tracking of teams played and games started per team for multi-team seasons:

```javascript
// Track teams and games started per team
teamsPlayed: [],           // ['ARI', 'MIN']
gamesStartedPerTeam: []    // [8, 4]
```

### 2. Updated DVOA Calculation (`teamScore.js`)

Modified `calculateOffensiveDVOAScore` to handle multi-team seasons:

```javascript
const calculateOffensiveDVOAScore = (team, year, allTeams = null, teamsPlayed = null, gamesStartedPerTeam = null) => {
  // Handle multi-team seasons (2TM, 3TM, etc.)
  if (team && team.match(/^\d+TM$/) && teamsPlayed && teamsPlayed.length > 0) {
    // Calculate weighted DVOA based on games started with each team
    let totalWeight = 0;
    let weightedDVOA = 0;
    
    teamsPlayed.forEach((actualTeam, index) => {
      const teamData = yearData[actualTeam];
      if (teamData) {
        const weight = (gamesStartedPerTeam && gamesStartedPerTeam[index]) || 1;
        weightedDVOA += teamData.dvoa * weight;
        totalWeight += weight;
      }
    });
    
    // Convert weighted average DVOA to z-score
    const avgDVOA = weightedDVOA / totalWeight;
    const zScore = calculateZScore(avgDVOA, mean, stdDev, false);
    return zScore;
  }
  
  // Original single-team logic continues...
}
```

### 3. Updated Data Flow (`qbCalculations.js`)

Ensured `teamsPlayed` and `gamesStartedPerTeam` are passed through to scoring calculations:

```javascript
teamsPlayed: season.teamsPlayed,
gamesStartedPerTeam: season.gamesStartedPerTeam
```

### 4. Supabase Compatibility (`supabaseDataTransformer.js`)

Added placeholder arrays to maintain compatibility:

```javascript
teamsPlayed: [],
gamesStartedPerTeam: []
```

## Impact

### Before Fix
- Joshua Dobbs 2023: Received 0 z-score for offensive DVOA (league average)
- This artificially inflated his team success score
- Resulted in him being overranked in 3-year category

### After Fix
- Joshua Dobbs 2023: Receives weighted average of -5.6 DVOA → negative z-score
- Properly reflects below-average offensive support
- Team success score now accurately represents his actual situation

## Files Modified

1. `src/components/scoringCategories/teamScore.js`
   - Enhanced `calculateOffensiveDVOAScore` to handle multi-team seasons
   - Added weighted DVOA calculation based on games started

2. `src/utils/dataProcessor.js`
   - Added `gamesStartedPerTeam` tracking alongside `teamsPlayed`
   - Captures games started for each team in multi-team seasons

3. `src/utils/qbCalculations.js`
   - Passes `gamesStartedPerTeam` through to season data structure

4. `src/utils/supabaseDataTransformer.js`
   - Added placeholder arrays for Supabase compatibility

## Testing Recommendations

1. **Joshua Dobbs Verification:**
   - Check his 2023 offensive DVOA score in console logs
   - Should show: "Multi-team DVOA (2023): ARI/MIN → Weighted avg=-5.6 (z=-0.XX)"

2. **Other Multi-Team Players:**
   - Baker Mayfield 2022 (CAR/LAR)
   - Sam Darnold 2022 (CAR/SFO)
   - Any player with "2TM" or "3TM" designation

3. **Regression Testing:**
   - Verify single-team players still calculate correctly
   - Check that playoff adjustments still work properly
   - Ensure 2024-only mode handles multi-team seasons

## Future Considerations

- Monitor for other multi-team seasons in future years
- Consider adding visual indicator in UI for multi-team seasons
- Could extend to weight by performance quality at each team (not just games)

## Related Issues

- Original Issue: Joshua Dobbs overranked in 3-year category
- Component: Team Success → Offensive Output (DVOA)
- Weight in Team Success: 35% (as configured in default weights)

