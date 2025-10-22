# Supabase Data Fetching Fix

## Problem
The application was showing "0 Active QBs" when using Supabase as the data source, despite having data in the database.

## Root Cause

### Primary Issue: NULL Games Started Values
**CRITICAL**: The Supabase `qb_passing_stats` table contains records where `gs` (games started) is `NULL`. This causes all QBs to be filtered out because they appear to have 0 games started.

Example from console logs:
```javascript
{ player_name: "Malik Cunningham", season: 2023, team: "NWE", gs: null, rate: null, qb_rec: "" }
```

### Secondary Issues (Also Fixed)
The data transformation pipeline in `useSupabaseQBData.js` was not properly mapping database fields to the expected data structure required by `processQBData()`. Specifically:

1. **Missing field mapping**: Database field `season` was not mapped to `year` property
2. **Missing field mapping**: Database field `gs` was not mapped to `gamesStarted` property  
3. **Incomplete career aggregation**: Career totals were not being properly calculated
4. **Filtering thresholds**: QBs were being filtered out due to missing/incorrect data structure

### Filtering Thresholds
- **2024-only mode**: Requires `total2024Games >= 9` (half season)
- **3-year mode**: Requires `totalGames >= 15` career starts AND recent activity (2023+)

## Changes Made

### 1. Fixed `src/utils/supabase.js` - Added Query Filter for Valid Data

#### Lines 60-72: Filter Out NULL Games Started Records

**Added query filters to only fetch records with valid games started data:**

```javascript
.not('gs', 'is', null)  // Only fetch records with games started data
.gte('gs', 1)            // Only QBs who actually started games
```

This prevents the application from trying to process records that don't have games started data, which was causing all QBs to be filtered out.

#### Lines 86-103: Added Data Validation Logging

Added comprehensive logging to detect database data quality issues:
- Counts records with valid `gs` values
- Shows sample record with games started
- Lists which fields have data if `gs` is missing
- Provides clear error message if no valid data exists

### 2. Fixed `src/hooks/useSupabaseQBData.js`

#### Lines 37-163: Complete Data Transformation Rewrite

**Before**: Used intermediate transformation functions that didn't properly map fields

**After**: Direct transformation that properly maps all fields:

```javascript
// CRITICAL MAPPINGS:
const seasonData = {
  year: seasonYear,              // season → year
  gamesStarted: gamesStarted,    // gs → gamesStarted
  team: record.team,
  wins: wins,                    // Parsed from qb_rec field
  losses: losses,                // Parsed from qb_rec field
  passingYards: parseInt(record.yds) || 0,
  passingTDs: parseInt(record.td) || 0,
  // ... etc
};
```

**Key fixes:**
- Map `record.season` → `seasonData.year`
- Map `record.gs` → `seasonData.gamesStarted`
- Parse win/loss from `qb_rec` field (e.g., "15-2-0")
- Flexible field name handling for optional stats
- Proper career totals aggregation
- Unique season counting

#### Added Comprehensive Logging

```javascript
console.log('🔍 DEBUG - First raw record:', rawData[0]);
console.log('🔍 DEBUG - Available fields:', Object.keys(rawData[0] || {}));
console.log(`🔍 DEBUG - Processing ${playerName} for season ${seasonYear}: ${gamesStarted} games started`);
console.log('🔍 DEBUG - Sample player:', samplePlayerName);
console.log(`📊 After filtering: ${processedQBs.length} QBs passed threshold requirements`);
```

### 2. Enhanced `src/utils/supabase.js`

#### Lines 74-85: Added Data Inspection Logging

```javascript
console.log(`📊 Raw Supabase data count: ${data?.length || 0}`);
if (data && data.length > 0) {
  console.log('🔍 First record fields:', Object.keys(data[0]));
  console.log('🔍 First record sample:', {
    player_name: data[0].players?.player_name,
    season: data[0].season,
    team: data[0].team,
    gs: data[0].gs,
    rate: data[0].rate,
    qb_rec: data[0].qb_rec
  });
}
```

### 3. Enhanced `src/utils/dataProcessor.js`

#### Lines 338-372: Added Filtering Debug Logs

```javascript
console.log(`🔍 DEBUG processQBData - Processing ${Object.keys(combinedQBData).length} players`);

// For each QB being filtered:
if (!passes) {
  console.log(`🚫 FILTERED OUT ${playerName}: 2024 games=${total2024Games}`);
} else {
  console.log(`✅ PASSED ${playerName}: 2024 games=${total2024Games}`);
}
```

## Expected Data Structure

After transformation, player data should look like:

```javascript
{
  "Patrick Mahomes": {
    seasons: [
      { 
        year: 2024,              // NOT 'season'
        team: "KAN",
        gamesStarted: 17,        // NOT 'gs'
        wins: 15,
        losses: 2,
        winPercentage: 0.882,
        passingYards: 4839,
        passingTDs: 32,
        interceptions: 11,
        // ... etc
      },
      { year: 2023, ... },
      { year: 2022, ... }
    ],
    career: {
      seasons: 3,
      gamesStarted: 48,
      wins: 41,
      losses: 7,
      winPercentage: 0.854,
      passingYards: 14321,
      passingTDs: 98,
      interceptions: 29,
      avgPasserRating: 102.3,
      // ... etc
    }
  }
}
```

## Database Schema Requirements

The Supabase `qb_passing_stats` table should have these fields:

**Required:**
- `season` (integer) - Year
- `pfr_id` (text) - Player identifier
- `team` (text) - Team abbreviation
- `gs` (integer) - Games started
- `rate` (numeric) - Passer rating
- `qb_rec` (text) - Win-loss record (e.g., "15-2-0")

**Important:**
- `yds` (integer) - Passing yards
- `td` (integer) - Touchdowns
- `int` (integer) - Interceptions
- `cmp` (integer) - Completions
- `att` (integer) - Attempts
- `age` (integer) - Player age

**Optional (will use 0 if missing):**
- `succ_pct` or `Succ%` - Success rate
- `sk_pct` or `Sk%` - Sack percentage
- `any_a` or `ANY/A` - Adjusted net yards per attempt
- `gwd` or `GWD` - Game winning drives
- `four_qc` or `4QC` - Fourth quarter comebacks
- `rush_yds` or `RushingYds` - Rushing yards
- `rush_td` or `RushingTDs` - Rushing touchdowns
- `fmb` or `Fumbles` - Fumbles

**Join:**
- `players` table with `pfr_id` and `player_name`

## Testing

After these changes, check the browser console for:

1. **Data fetch confirmation**: 
   ```
   📊 Raw Supabase data count: 150
   ```

2. **Player data structure**:
   ```
   ✅ Built player data structure for 50 unique players
   ```

3. **Filtering results**:
   ```
   ✅ PASSED Patrick Mahomes: 2024 games=17
   ✅ PASSED Josh Allen: 2024 games=17
   📊 After filtering: 32 QBs passed threshold requirements
   ```

4. **Final QB count**:
   ```
   ✅ Successfully processed 32 quarterbacks from Supabase
   ```

## Troubleshooting

### Still seeing "0 Active QBs"?

#### Step 1: Check if Database Has Valid Data

Look in the browser console for these messages:

```
🔍 Records with games started > 0: 0/235
❌ CRITICAL: No records have gs (games started) values! Database may be incomplete.
```

**If you see this**, your database needs to be populated with actual games started data.

#### Step 2: Verify Database Import

Your `qb_passing_stats` table must have:
- Non-NULL `gs` (games started) values
- Non-NULL `rate` (passer rating) values  
- Valid `qb_rec` (win-loss record) values

**To fix**: Re-import your data into Supabase, ensuring all columns are properly mapped.

#### Step 3: Check Query Results

After the fix, you should see:
```
🔍 Records with games started > 0: 150/235
🔍 Sample record with games: { player_name: "Patrick Mahomes", season: 2024, gs: 17, rate: 95.8 }
```

### Common Issues

**Issue**: `🔍 Records with games started > 0: 0/235`
- **Root Cause**: Database `gs` column is NULL or empty
- **Fix**: Import CSV data properly into Supabase with all columns
- **Temporary Workaround**: Use CSV data source instead of Supabase

**Issue**: All QBs filtered out in 2024-only mode
- **Check**: Do QBs have `gs >= 9` for season 2024?
- **Fix**: Lower threshold or check data completeness

**Issue**: All QBs filtered out in 3-year mode  
- **Check**: Do QBs have total career games >= 15 AND data from 2023+?
- **Fix**: Ensure multi-year data is present

**Issue**: Missing player names
- **Check**: Is the join with `players` table working?
- **Fix**: Verify `players.player_name` field exists

**Issue**: Missing rushing stats
- **Not critical**: Will default to 0, calculations will still work

### Database Import Checklist

If your database is showing NULL values for `gs`, you need to:

1. **Check CSV to Database mapping** - Ensure CSV column `GS` maps to database column `gs`
2. **Verify data import** - Check that all 235 records have non-NULL values for critical fields
3. **Test a simple query** in Supabase SQL Editor:
   ```sql
   SELECT player_name, season, gs, rate, qb_rec 
   FROM qb_passing_stats 
   WHERE gs IS NOT NULL 
   LIMIT 10;
   ```
4. **If no results**, re-import your data with proper column mapping

## Files Modified

1. `src/hooks/useSupabaseQBData.js` - Complete rewrite of data transformation
2. `src/utils/supabase.js` - Added data inspection logging
3. `src/utils/dataProcessor.js` - Added filtering debug logs
4. `docs/SUPABASE_DATA_FIX.md` - This documentation file

