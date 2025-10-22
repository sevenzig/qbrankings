# Minimum Threshold Fix Documentation

## Issue: Josh Dobbs Appearing as "Elite" with Poor Record

Josh Dobbs was incorrectly appearing as statistically elite despite having:
- 6-21 career record
- Negative TD:INT ratio over career
- Low average yards per game
- Only 47 attempts in 2024 (0-1 record)
- 417 attempts in 2023 (3-9 record) with below-average stats

## Root Causes

### 1. **Extremely Low Minimum Thresholds**
The system was using thresholds that were far too lenient:
- **2024-only mode**: Required only 1 attempt (!)
- **Multi-year mode**: Required only 50 attempts for 2024, 100 for historical years
- **Games started**: Required only 1 game for 2024-only, 4 for multi-year

### 2. **Polluted Z-Score Comparison Pool**
When calculating z-scores for statistical rankings, the system included:
- Backup QBs with minimal playing time (100-150 attempts)
- Injured starters with partial seasons
- Journeymen with limited snaps

This artificially inflated z-scores for mediocre QBs because they were being compared against a pool that included too many low-quality players.

### 3. **No Sample Size Penalty**
The z-score calculations didn't account for small sample sizes, so a QB with 47 attempts got the same statistical weight as one with 500+ attempts.

## Changes Applied

### 1. Data Source Change
**File**: `src/components/DynamicQBRankings.jsx`
- Changed default data source from `'csv'` to `'supabase'`
- Ensures local development uses the Supabase SQL database instead of CSV files

### 2. Minimum Attempt Thresholds (Stats Score)
**File**: `src/components/scoringCategories/statsScore.js`

Updated all three stat categories (efficiency, protection, volume):

**Before:**
- 2024-only mode: 1 attempt minimum
- Multi-year 2024: 50 attempts minimum
- Historical years (2022-2023): 100 attempts minimum

**After:**
- 2024-only mode: **150 attempts minimum** (~9 games)
- Multi-year 2024: **150 attempts minimum** (~9 games)
- Historical years (2022-2023): **200 attempts minimum** (~12 games)

This ensures only QBs with meaningful playing time are included in the statistical analysis and z-score calculations.

### 3. Minimum Games Started Thresholds

**File**: `src/components/scoringCategories/teamScore.js`
- 2024-only mode: **9 games started** (was 1)
- Multi-year mode: **10 games started** (was 4)

**File**: `src/components/scoringCategories/clutchScore.js`
- 2024-only mode: **9 games played** (was 1)

**File**: `src/components/scoringCategories/durabilityScore.js`
- Valid season threshold: **9 games started** (was 4)

**File**: `src/components/scoringCategories/supportScore.js`
- 2024-only mode: **9 games started** (was 1)
- Multi-year mode: **10 games started** (was 4)

### 4. Display Filter Threshold
**File**: `src/utils/dataProcessor.js`
- 2024-only mode: **9 games started** to appear in rankings (was 1)
- Multi-year mode: No change (still 15 career games)

## Impact

### QBs Now Excluded from 2024-Only Rankings:
- Josh Dobbs (2 games, 1 start, 47 attempts)
- Jimmy Garoppolo (1 game, 1 start, 41 attempts)
- All other QBs with <9 games started in 2024

### QBs Now Excluded from Z-Score Comparison Pools:
**2024:**
- Any QB with <150 attempts (~9 games)

**Historical Years (2022-2023):**
- Any QB with <200 attempts (~12 games)

### Example Impact on Josh Dobbs:
**In 3-Year Mode:**
- 2022: 68 attempts → EXCLUDED (below 200)
- 2023: 417 attempts → INCLUDED (above 200)
- 2024: 47 attempts → EXCLUDED (below 150)

Even though his 2023 season still counts, the z-score comparison pool for 2023 now only includes QBs with 200+ attempts (true starters), making his below-average stats correctly rank him lower.

**In 2024-Only Mode:**
- Would be completely excluded from rankings (only 1 game started, 47 attempts)

## Rationale for New Thresholds

### 150 Attempts (~9 games)
- Represents approximately half a season
- Enough data for rate stats to stabilize
- Filters out backup QBs who played in a few games
- Includes QBs who took over mid-season

### 200 Attempts (~12 games)
- Represents 70% of a season
- Historical context where we want full-season starters
- More stringent because we're comparing across years
- Ensures apples-to-apples comparisons

### 9-10 Games Started
- Consistent with attempt thresholds
- Half season minimum for meaningful evaluation
- Aligns with standard NFL starter definitions

## Testing Recommendations

1. **Verify Josh Dobbs is excluded** from 2024-only rankings
2. **Verify Josh Dobbs ranks appropriately** in 3-year mode (should be lower-middle tier)
3. **Check other backup QBs** are filtered out (Malik Willis, Gardner Minshew with limited snaps, etc.)
4. **Verify legitimate mid-season starters** are included (e.g., a QB who started 9+ games)
5. **Check z-score distributions** look more normal without backup QB pollution

## Related Files Modified

- `src/components/DynamicQBRankings.jsx` - Data source change
- `src/components/scoringCategories/statsScore.js` - Attempt thresholds
- `src/components/scoringCategories/teamScore.js` - Games started thresholds
- `src/components/scoringCategories/clutchScore.js` - Games played thresholds
- `src/components/scoringCategories/durabilityScore.js` - Valid season thresholds
- `src/components/scoringCategories/supportScore.js` - Games started thresholds
- `src/utils/dataProcessor.js` - Display filter thresholds

## Date
October 21, 2025

