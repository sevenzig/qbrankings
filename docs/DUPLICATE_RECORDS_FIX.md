# Duplicate Records Fix - Win/Loss Record Correction

## Problem Description

Russell Wilson and Kirk Cousins (and potentially other QBs) were showing incorrect win-loss records across all years. For example:
- **Russell Wilson 2017**: Showing 18-14 instead of actual 9-7
- **Kirk Cousins 2017**: Showing 14-18 instead of actual 7-9

This issue persisted across their entire careers, suggesting a systematic problem with how records were being counted.

## Root Cause Analysis

The issue was caused by **duplicate records in the Supabase database** combined with insufficient deduplication logic:

1. **Database Duplicates**: The `qb_passing_stats` table contained duplicate entries for the same player-season-team combination
2. **Double-Counting**: When processing these duplicates, the system was:
   - Adding wins/losses multiple times for the same season
   - This happened in the multi-team season handling logic
3. **Career Total Accumulation**: Even though we fixed the career total accumulation bug earlier, the duplicates were still causing season-level records to be inflated

## Solution Implemented

### 1. Deduplication Logic (Primary Fix)

Added a deduplication step **before** processing records:

```javascript
// Create unique key: pfr_id + season + team
const uniqueKey = `${pfrId}_${seasonYear}_${team}`;

if (seenKeys.has(uniqueKey)) {
  // Skip duplicate record
  console.warn(`⚠️ DUPLICATE DETECTED: ${playerName} ${seasonYear} ${team}`);
  return;
}

seenKeys.add(uniqueKey);
deduplicatedData.push(record);
```

**Key Features:**
- Uses `pfr_id + season + team` as unique identifier
- Prevents exact duplicates from being processed
- Still allows legitimate multi-team seasons (different teams, same season)
- Logs all duplicates for debugging

### 2. Enhanced Logging

Added comprehensive logging to identify duplicate issues:

```javascript
// Log summary of duplicates found
if (Object.keys(duplicateLog).length > 0) {
  console.warn(`🚨 Found duplicates for ${Object.keys(duplicateLog).length} players:`);
  Object.entries(duplicateLog).forEach(([player, dups]) => {
    console.warn(`   ${player}: ${dups.length} duplicate(s) across years ${[...new Set(dups.map(d => d.year))].join(', ')}`);
  });
}

console.log(`✅ Deduplicated: ${rawData.length} → ${deduplicatedData.length} records`);
```

### 3. Multi-Team Season Handling

Enhanced the multi-team season logic with better tracking:

```javascript
if (existingSeasonIndex >= 0) {
  console.log(`🔄 Multi-team season: ${playerName} ${seasonYear} - adding ${record.team} (${gamesStarted} GS, ${wins}-${losses})`);
  
  // Track teams played
  if (!existingSeason.teamsPlayed.includes(record.team)) {
    existingSeason.teamsPlayed.push(record.team);
    existingSeason.gamesStartedPerTeam.push(gamesStarted);
  }
  
  // Store team-specific stats
  existingSeason.teamStats[record.team] = { ... };
}
```

### 4. Career Total Fix (Secondary Fix)

Removed the double-counting in career totals that was happening in the multi-team season block:

```javascript
if (existingSeasonIndex >= 0) {
  // Update existing season data (multi-team season)
  // Note: Career totals should NOT be updated here - they were already added when the season was first created
  const existingSeason = playerData[playerName].seasons[existingSeasonIndex];
  existingSeason.gamesStarted += gamesStarted;
  existingSeason.wins += wins;
  existingSeason.losses += losses;
  
  // ❌ REMOVED: Career total updates (these were causing double-counting)
  // Career totals are only updated when creating a NEW season entry
}
```

## Impact

### Before Fix
- Russell Wilson 2017: **18-14** (incorrect)
- Kirk Cousins 2017: **14-18** (incorrect)
- Records were inflated across all years for affected players

### After Fix
- Russell Wilson 2017: **9-7** (correct)
- Kirk Cousins 2017: **7-9** (correct)
- All records now match the actual live data

## Technical Details

### Files Modified
- `src/utils/dataProcessor.js` - Added deduplication logic in `processSupabaseQBData()` function

### Processing Flow
1. **Fetch data** from Supabase (by year)
2. **Deduplicate** records using `pfr_id + season + team` key
3. **Process** deduplicated records
4. **Aggregate** multi-team seasons correctly
5. **Calculate** career totals (only once per season)

### Deduplication Strategy
- **Key**: `pfr_id + season + team`
- **Allows**: Legitimate multi-team seasons (e.g., QB plays for 2 teams in one year)
- **Prevents**: Exact duplicates (same player, same season, same team appearing twice)
- **Logs**: All duplicates for database cleanup investigation

## Database Cleanup Recommendation

While the application now handles duplicates correctly, the **root cause** is duplicate records in the Supabase database. Consider:

1. **Investigate** why duplicates exist in `qb_passing_stats` table
2. **Add unique constraint** on `(pfr_id, season, team)` columns
3. **Clean up** existing duplicates in the database
4. **Review** data import scripts to prevent future duplicates

### SQL to Find Duplicates

```sql
SELECT pfr_id, player_name, season, team, COUNT(*) as count
FROM qb_passing_stats
GROUP BY pfr_id, player_name, season, team
HAVING COUNT(*) > 1
ORDER BY count DESC, player_name, season;
```

### SQL to Add Unique Constraint

```sql
-- First, remove duplicates (keep the first occurrence)
DELETE FROM qb_passing_stats a
USING qb_passing_stats b
WHERE a.id > b.id
  AND a.pfr_id = b.pfr_id
  AND a.season = b.season
  AND a.team = b.team;

-- Then add unique constraint
ALTER TABLE qb_passing_stats
ADD CONSTRAINT qb_passing_stats_unique_player_season_team
UNIQUE (pfr_id, season, team);
```

## Testing

To verify the fix:

1. **Check Russell Wilson 2017**: Should show 9-7 record
2. **Check Kirk Cousins 2017**: Should show 7-9 record
3. **Check console logs**: Should show deduplication summary
4. **Check multi-team seasons**: Should still work correctly (e.g., Ryan Fitzpatrick playing for multiple teams)

## Related Issues

- Initial career total double-counting fix (removed lines 393-410)
- This comprehensive fix addresses the root cause (database duplicates)

## Date
October 28, 2025

