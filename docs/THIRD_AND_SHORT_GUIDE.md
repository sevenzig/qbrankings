# 3rd & 1-3 Data Extraction Guide

## Overview

This guide explains how to extract and analyze 3rd & 1-3 splits data for NFL quarterbacks from your Supabase database. The system provides comprehensive tools for querying, analyzing, and comparing quarterback performance in these critical short-yardage situations.

## Quick Start

### 1. Basic Data Extraction

```javascript
import { extractThirdAndShortData2024 } from './src/utils/thirdAndShortExtractor.js';

// Extract all 3rd & 1-3 data for 2024
const data = await extractThirdAndShortData2024();
console.log(`Extracted ${data.length} records`);
```

### 2. Get Summary Statistics

```javascript
import { getThirdAndShortSummary } from './src/utils/thirdAndShortExtractor.js';

// Get overall summary statistics
const summary = await getThirdAndShortSummary();
console.log(`Average completion rate: ${summary.averageCompletionRate}%`);
```

### 3. Find Top Performers

```javascript
import { getTopPerformers } from './src/utils/thirdAndShortExtractor.js';

// Get top 10 by completion rate (minimum 10 attempts)
const topQBs = getTopPerformers(data, 'completion_rate', 10, 10);
topQBs.forEach((qb, index) => {
  console.log(`${index + 1}. ${qb.player_name}: ${qb.completion_rate}%`);
});
```

## Available Functions

### Core Extraction Functions

#### `extractThirdAndShortData2024()`
Extracts all 3rd & 1-3 splits data for all QBs who played in 2024.

**Returns:** `Promise<Array>` - Array of 3rd & 1-3 splits records

**Example:**
```javascript
const data = await extractThirdAndShortData2024();
console.log(data[0]); // Sample record structure
```

#### `extractThirdAndShortDataForQB(pfrId, season = 2024)`
Extracts 3rd & 1-3 data for a specific quarterback.

**Parameters:**
- `pfrId` (string): The PFR ID of the player (e.g., 'MahomPa00')
- `season` (number): The season (default: 2024)

**Returns:** `Promise<Array>` - Array of 3rd & 1-3 splits records for the QB

**Example:**
```javascript
// First, find the correct player ID
const { supabase } = await import('./src/utils/supabase.js');
const { data: mahomesSearch } = await supabase
  .from('qb_splits_advanced')
  .select('pfr_id, player_name')
  .eq('season', 2024)
  .ilike('player_name', '%Mahomes%')
  .limit(1);

const mahomesId = mahomesSearch[0].pfr_id;
const mahomesData = await extractThirdAndShortDataForQB(mahomesId);
console.log(`Mahomes had ${mahomesData.length} 3rd & 1-3 records`);
```

### Analysis Functions

#### `getThirdAndShortSummary(season = 2024)`
Generates comprehensive summary statistics for 3rd & 1-3 performance.

**Returns:** `Promise<Object>` - Summary statistics object

**Example:**
```javascript
const summary = await getThirdAndShortSummary();
console.log({
  totalQBs: summary.totalQBs,
  totalAttempts: summary.totalAttempts,
  averageCompletionRate: summary.averageCompletionRate,
  averageYardsPerAttempt: summary.averageYardsPerAttempt,
  averageTDsPerAttempt: summary.averageTDsPerAttempt,
  averageIntsPerAttempt: summary.averageIntsPerAttempt
});
```

#### `getTopPerformers(data, metric, minAttempts = 10, limit = 10)`
Finds top performers by various metrics.

**Parameters:**
- `data` (Array): 3rd & 1-3 data array
- `metric` (string): Metric to rank by ('completion_rate', 'yards_per_attempt', 'td_rate', 'int_rate')
- `minAttempts` (number): Minimum attempts required (default: 10)
- `limit` (number): Number of top performers to return (default: 10)

**Returns:** `Array` - Top performers array

**Example:**
```javascript
// Top 10 by completion rate
const topCompletion = getTopPerformers(data, 'completion_rate', 10, 10);

// Top 5 by yards per attempt
const topYards = getTopPerformers(data, 'yards_per_attempt', 15, 5);

// QBs with lowest INT rate
const safestQBs = getTopPerformers(data, 'int_rate', 10, 10);
```

#### `compareQBs(qb1PfrId, qb2PfrId, season = 2024)`
Compares two quarterbacks in 3rd & 1-3 situations.

**Parameters:**
- `qb1PfrId` (string): First QB's PFR ID
- `qb2PfrId` (string): Second QB's PFR ID
- `season` (number): The season (default: 2024)

**Returns:** `Promise<Object>` - Comparison object

**Example:**
```javascript
// First, find the correct player IDs
const { supabase } = await import('./src/utils/supabase.js');
const { data: mahomesSearch } = await supabase
  .from('qb_splits_advanced')
  .select('pfr_id, player_name')
  .eq('season', 2024)
  .ilike('player_name', '%Mahomes%')
  .limit(1);

const { data: allenSearch } = await supabase
  .from('qb_splits_advanced')
  .select('pfr_id, player_name')
  .eq('season', 2024)
  .ilike('player_name', '%Allen%')
  .limit(1);

const mahomesId = mahomesSearch[0].pfr_id;
const allenId = allenSearch[0].pfr_id;
const comparison = await compareQBs(mahomesId, allenId);
console.log('Completion Rate Difference:', comparison.comparison.completionRateDiff);
console.log('Yards per Attempt Difference:', comparison.comparison.yardsPerAttemptDiff);
```

### Utility Functions

#### `analyzeByTeam(data)`
Analyzes 3rd & 1-3 performance by team.

**Returns:** `Object` - Team analysis object

**Example:**
```javascript
const teamAnalysis = analyzeByTeam(data);
Object.entries(teamAnalysis).forEach(([team, stats]) => {
  console.log(`${team}: ${stats.completionRate}% completion rate`);
});
```

#### `filterByMinimumAttempts(data, minAttempts = 10)`
Filters QBs by minimum attempts to ensure meaningful sample sizes.

**Returns:** `Array` - Filtered QB data

**Example:**
```javascript
const qualifiedQBs = filterByMinimumAttempts(data, 15);
console.log(`${qualifiedQBs.length} QBs had 15+ attempts`);
```

#### `exportToCSV(data)`
Exports 3rd & 1-3 data to CSV format.

**Returns:** `string` - CSV formatted string

**Example:**
```javascript
const csvData = exportToCSV(data);
// Save to file or download
const blob = new Blob([csvData], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'third_and_short_2024.csv';
a.click();
```

## Data Structure

### Record Structure
Each 3rd & 1-3 record contains:

```javascript
{
  pfr_id: "MahomPa00",           // Player's PFR ID
  player_name: "Patrick Mahomes", // Player name
  team: "KAN",                   // Team abbreviation
  season: 2024,                  // Season
  split: "3rd & 1-3",           // Split type
  value: "1-3 yards",           // Split value
  att: "25",                    // Attempts
  cmp: "18",                    // Completions
  yds: "245",                   // Yards
  td: "3",                      // Touchdowns
  int: "1",                     // Interceptions
  // ... other fields from splits table
}
```

### Summary Structure
The summary object contains:

```javascript
{
  totalQBs: 45,                    // Total QBs analyzed
  totalAttempts: 1250,             // Total attempts
  totalCompletions: 850,           // Total completions
  totalYards: 10250,               // Total yards
  totalTDs: 85,                    // Total touchdowns
  totalInts: 25,                   // Total interceptions
  averageCompletionRate: "68.0",   // Average completion rate
  averageYardsPerAttempt: "8.2",   // Average yards per attempt
  averageTDsPerAttempt: "6.8",     // Average TD rate
  averageIntsPerAttempt: "2.0",    // Average INT rate
  qbBreakdown: [...]               // Individual QB breakdowns
}
```

## Common Use Cases

### 1. Find the Most Efficient QBs in 3rd & 1-3

```javascript
import { extractThirdAndShortData2024, getTopPerformers } from './src/utils/thirdAndShortExtractor.js';

const data = await extractThirdAndShortData2024();
const mostEfficient = getTopPerformers(data, 'completion_rate', 10, 10);

console.log('Most Efficient QBs in 3rd & 1-3:');
mostEfficient.forEach((qb, index) => {
  console.log(`${index + 1}. ${qb.player_name} (${qb.team}): ${qb.completion_rate}%`);
});
```

### 2. Compare Elite QBs

```javascript
import { compareQBs } from './src/utils/thirdAndShortExtractor.js';

// First, find the correct player IDs
const { supabase } = await import('./src/utils/supabase.js');
const { data: mahomesSearch } = await supabase
  .from('qb_splits_advanced')
  .select('pfr_id, player_name')
  .eq('season', 2024)
  .ilike('player_name', '%Mahomes%')
  .limit(1);

const { data: allenSearch } = await supabase
  .from('qb_splits_advanced')
  .select('pfr_id, player_name')
  .eq('season', 2024)
  .ilike('player_name', '%Allen%')
  .limit(1);

const mahomesId = mahomesSearch[0].pfr_id;
const allenId = allenSearch[0].pfr_id;
const comparison = await compareQBs(mahomesId, allenId);

console.log('Mahomes vs Allen in 3rd & 1-3:');
console.log(`Completion Rate: ${comparison.qb1.completionRate.toFixed(1)}% vs ${comparison.qb2.completionRate.toFixed(1)}%`);
console.log(`Yards per Attempt: ${comparison.qb1.yardsPerAttempt.toFixed(1)} vs ${comparison.qb2.yardsPerAttempt.toFixed(1)}`);
```

### 3. Team Analysis

```javascript
import { extractThirdAndShortData2024, analyzeByTeam } from './src/utils/thirdAndShortExtractor.js';

const data = await extractThirdAndShortData2024();
const teamAnalysis = analyzeByTeam(data);

// Find teams with best 3rd & 1-3 performance
const teamRankings = Object.entries(teamAnalysis)
  .map(([team, stats]) => ({ team, ...stats }))
  .sort((a, b) => parseFloat(b.completionRate) - parseFloat(a.completionRate));

console.log('Teams by 3rd & 1-3 Completion Rate:');
teamRankings.forEach((team, index) => {
  console.log(`${index + 1}. ${team.team}: ${team.completionRate}% (${team.totalAttempts} att)`);
});
```

### 4. Export Data for Analysis

```javascript
import { extractThirdAndShortData2024, exportToCSV } from './src/utils/thirdAndShortExtractor.js';

const data = await extractThirdAndShortData2024();
const csvData = exportToCSV(data);

// Download the CSV file
const blob = new Blob([csvData], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'third_and_short_2024.csv';
a.click();
URL.revokeObjectURL(url);
```

## Testing the Functions

### Using the Test Component

1. Navigate to your app and open the Supabase Test component
2. Click "Test 3rd & 1-3 Data" to test basic functionality
3. Click "Run All Examples" to see comprehensive examples

### Using the Browser Console

```javascript
// Import the functions in browser console
import('./src/utils/thirdAndShortExtractor.js').then(({ extractThirdAndShortData2024 }) => {
  extractThirdAndShortData2024().then(data => {
    console.log('3rd & 1-3 data:', data);
  });
});
```

## Error Handling

All functions include comprehensive error handling:

```javascript
try {
  const data = await extractThirdAndShortData2024();
  console.log('Success:', data.length, 'records');
} catch (error) {
  console.error('Error extracting data:', error.message);
  
  // Common error scenarios:
  if (error.message.includes('Supabase')) {
    console.log('Check your Supabase connection and environment variables');
  } else if (error.message.includes('No data')) {
    console.log('No 3rd & 1-3 data found for the specified criteria');
  }
}
```

## Performance Considerations

- **Caching**: Data is cached for 15 minutes to reduce API calls
- **Batch Processing**: Functions process data in batches for large datasets
- **Error Recovery**: Functions continue processing even if individual QBs fail
- **Memory Management**: Large datasets are processed efficiently

## Integration with Existing System

The 3rd & 1-3 data extraction integrates seamlessly with your existing QB rankings system:

1. **Data Source**: Uses the same Supabase connection as your main QB data
2. **Format Compatibility**: Data can be transformed to match your CSV format
3. **UI Integration**: Can be displayed in your existing components
4. **Scoring Integration**: Can be incorporated into your QB scoring algorithms

## Next Steps

1. **Test the Functions**: Use the test component to verify everything works
2. **Customize Analysis**: Modify the functions to fit your specific needs
3. **Integrate with UI**: Add 3rd & 1-3 analysis to your main QB rankings interface
4. **Extend Functionality**: Add more analysis functions as needed

## Support

If you encounter issues:

1. Check the browser console for detailed error messages
2. Verify your Supabase connection and environment variables
3. Ensure your database contains the expected 3rd & 1-3 splits data
4. Review the data structure to ensure it matches the expected format

The system is designed to be robust and provide helpful error messages to guide troubleshooting. 