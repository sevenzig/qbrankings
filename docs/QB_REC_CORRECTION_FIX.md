# QB Record Correction Fix - Using qb_splits for Accurate Win/Loss Data

## Problem Description

The `qb_rec` field in the `qb_passing_stats` table contains **incorrect win-loss records** for many quarterbacks across multiple seasons. This affected both the local development environment and the live production site.

### Examples of Incorrect Data
- **Russell Wilson 2017**: Database showed "18-14", actual should be "9-7"
- **Kirk Cousins 2017**: Database showed "14-18", actual should be "7-9"  
- **Jared Goff 2017**: Database showed "22-8", actual should be "11-4"

### Root Cause
The `qb_passing_stats.qb_rec` field was imported from Pro Football Reference CSV files with corrupted or cumulative data instead of single-season records. This is a **data quality issue at the source**.

## Solution Implemented

### Strategy: Use qb_splits Table as Source of Truth

The `qb_splits` table contains **accurate win/loss data** in the `w` (wins) and `l` (losses) columns. We modified the data fetching logic to:

1. **Fetch both** `qb_passing_stats` and `qb_splits` data
2. **Use `qb_splits.w` and `qb_splits.l`** to reconstruct the correct `qb_rec` value
3. **Override** the incorrect `qb_rec` from `qb_passing_stats`
4. **Log corrections** so we can see which records were fixed

### Files Modified

#### 1. `src/utils/supabase.js` - fetchQBDataByYear()

**Changes (Lines 319-410):**

```javascript
// Fetch rushing stats AND win/loss data from qb_splits (League/NFL split contains all data)
// IMPORTANT: qb_splits has CORRECT win/loss data, qb_passing_stats.qb_rec is often WRONG
const { data: splitsData, error: splitsError } = await supabase
  .from('qb_splits')
  .select('pfr_id, player_name, season, w, l, t, rush_att, rush_yds, rush_td, fmb, fl')
  .eq('season', year)
  .eq('split', 'League')
  .eq('value', 'NFL');

// Create a map of splits data by pfr_id for quick lookup
const splitsMap = {};
if (splitsData) {
  splitsData.forEach(record => {
    splitsMap[record.pfr_id] = record;
  });
}

// Transform and merge the data
const transformedData = passingData.map(record => {
  const splitsStats = splitsMap[record.pfr_id];
  
  // Use wins/losses from qb_splits if available (more accurate)
  if (splitsStats && (splitsStats.w !== null || splitsStats.l !== null)) {
    const correctWins = splitsStats.w || 0;
    const correctLosses = splitsStats.l || 0;
    const correctQbRec = `${correctWins}-${correctLosses}-${splitsStats.t || 0}`;
    
    // Log correction if different from database value
    if (record.qb_rec && record.qb_rec !== correctQbRec) {
      console.warn(`🔧 CORRECTED ${record.player_name} ${year}: DB had "${record.qb_rec}", using splits "${correctQbRec}"`);
    }
    
    return {
      ...record,
      qb_rec: correctQbRec,  // Use CORRECTED qb_rec from splits
      // ... other fields
    };
  } else {
    // No splits data available, use original qb_rec
    return { ...record };
  }
});
```

#### 2. `src/utils/dataProcessor.js` - processSupabaseQBData()

**Added diagnostic logging (Lines 427-437):**

```javascript
// Diagnostic logging for specific problematic players
if ((playerName === 'Russell Wilson' || playerName === 'Kirk Cousins' || playerName === 'Jared Goff') && seasonYear === 2017) {
  console.warn(`🔍 DATABASE qb_rec for ${playerName} ${seasonYear}:`, {
    qb_rec: record.qb_rec,
    parsed_wins: wins,
    parsed_losses: losses,
    gs: gamesStarted,
    team: record.team,
    pfr_id: record.pfr_id
  });
}
```

This helps verify that the corrected `qb_rec` values are being used.

## How It Works

### Data Flow

1. **Fetch Phase** (`supabase.js`):
   - Query `qb_passing_stats` for main stats
   - Query `qb_splits` (League/NFL) for correct W-L records
   - Match records by `pfr_id`

2. **Correction Phase** (`supabase.js`):
   - For each QB, check if `qb_splits` has W-L data
   - If yes: Reconstruct `qb_rec` as `"W-L-T"` from splits
   - If no: Fall back to original `qb_rec` (rare case)
   - Log any corrections made

3. **Processing Phase** (`dataProcessor.js`):
   - Parse the (now corrected) `qb_rec` field
   - Extract wins and losses
   - Build season and career statistics

### Why qb_splits is More Accurate

The `qb_splits` table contains:
- **Granular data** broken down by various splits (Home/Away, Win/Loss, etc.)
- **League/NFL split** which represents the complete season totals
- **Separate W, L, T columns** that are calculated from game-by-game data
- **More reliable** because it's derived from individual game results

The `qb_passing_stats.qb_rec` field is:
- **Imported as-is** from Pro Football Reference CSV exports
- **Prone to errors** in the source data
- **Not validated** during import
- **Sometimes cumulative** instead of single-season

## Impact

### Before Fix
```
Russell Wilson 2017: 18-14 (0.563) ❌ WRONG
Kirk Cousins 2017:  14-18 (0.438) ❌ WRONG
Jared Goff 2017:    22-8  (0.733) ❌ WRONG
```

### After Fix
```
Russell Wilson 2017: 9-7  (0.563) ✅ CORRECT
Kirk Cousins 2017:  7-9  (0.438) ✅ CORRECT
Jared Goff 2017:    11-4 (0.733) ✅ CORRECT
```

### Console Output
When the fix is working, you'll see console warnings like:
```
🔧 CORRECTED Russell Wilson 2017: DB had "18-14-0", using splits "9-7-0"
🔧 CORRECTED Kirk Cousins 2017: DB had "14-18-0", using splits "7-9-0"
🔧 CORRECTED Jared Goff 2017: DB had "22-8-0", using splits "11-4-0"
```

## Database Cleanup Recommendation

While the application now **works around** the bad data, the `qb_passing_stats` table should be cleaned up:

### SQL to Update qb_rec from qb_splits

```sql
-- Update qb_rec in qb_passing_stats using correct data from qb_splits
UPDATE qb_passing_stats ps
SET qb_rec = s.w || '-' || s.l || '-' || COALESCE(s.t, 0)
FROM qb_splits s
WHERE ps.pfr_id = s.pfr_id
  AND ps.season = s.season
  AND s.split = 'League'
  AND s.value = 'NFL'
  AND s.w IS NOT NULL
  AND s.l IS NOT NULL
  AND ps.qb_rec != (s.w || '-' || s.l || '-' || COALESCE(s.t, 0));
```

### Verify Corrections

```sql
-- Show records that will be corrected
SELECT 
  ps.player_name,
  ps.season,
  ps.team,
  ps.qb_rec as old_qb_rec,
  s.w || '-' || s.l || '-' || COALESCE(s.t, 0) as new_qb_rec,
  ps.gs as games_started
FROM qb_passing_stats ps
JOIN qb_splits s ON ps.pfr_id = s.pfr_id AND ps.season = s.season
WHERE s.split = 'League'
  AND s.value = 'NFL'
  AND s.w IS NOT NULL
  AND s.l IS NOT NULL
  AND ps.qb_rec != (s.w || '-' || s.l || '-' || COALESCE(s.t, 0))
ORDER BY ps.season DESC, ps.player_name;
```

## Testing

To verify the fix is working:

1. **Load the app** and select year 2017
2. **Check the console** for correction warnings
3. **Verify records**:
   - Russell Wilson: Should show 9-7
   - Kirk Cousins: Should show 7-9
   - Jared Goff: Should show 11-4
4. **Check other years** to ensure widespread corrections

## Related Issues

- **Duplicate Records Fix**: Prevents double-counting when database has duplicates
- **Career Total Fix**: Ensures career totals aren't inflated by multi-team season handling
- **This Fix**: Corrects the source data itself by using qb_splits as source of truth

## Date
October 28, 2025

## Status
✅ **IMPLEMENTED** - Application now uses qb_splits data for accurate win-loss records
⚠️ **DATABASE CLEANUP PENDING** - qb_passing_stats.qb_rec still contains wrong data

