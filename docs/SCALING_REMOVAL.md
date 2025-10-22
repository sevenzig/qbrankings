# Removal of Arbitrary Scaling Factors

## Overview

Removed all arbitrary scaling multipliers from the scoring system. With z-score based calculations, these multipliers are unnecessary and counterproductive.

## Changes Made

### 1. Stats Score (`src/components/scoringCategories/statsScore.js`)

**REMOVED:**
```javascript
// Apply scaling to push elite performers higher (maintain existing scaling)
const scaledStatsScore = adjustedStatsScore * 1.5;
const finalStatsScore = Math.max(0, Math.min(150, scaledStatsScore));
```

**REPLACED WITH:**
```javascript
// Z-scores already provide proper standardization - no additional scaling needed
const finalStatsScore = Math.max(0, Math.min(100, adjustedStatsScore));
```

**Impact:** Removed 1.5x multiplier and 150 cap. Stats now return percentiles in proper 0-100 range.

---

### 2. Clutch Score (`src/components/scoringCategories/clutchScore.js`)

**REMOVED:**
```javascript
// ELITE PERFORMANCE SCALING: Apply 1.2x multiplier to push elite performers to 100+ range
// This addresses the psychological impact of reaching the 100 threshold
const scaledScore = clutchCompositeScore * 1.2;
const finalScore = Math.max(0, Math.min(150, scaledScore));
```

**REPLACED WITH:**
```javascript
// Z-scores already provide proper standardization - no additional scaling needed
const finalScore = Math.max(0, Math.min(100, clutchCompositeScore));
```

**Impact:** Removed 1.2x multiplier and 150 cap. Clutch scores now return percentiles in proper 0-100 range.

---

### 3. Durability Score (`src/components/scoringCategories/durabilityScore.js`)

**REMOVED:**
```javascript
// ELITE PERFORMANCE SCALING: Apply 1.15x multiplier to push elite performers to 100+ range
// This addresses the psychological impact of reaching the 100 threshold
const scaledScore = compositeScore * 1.15;
const finalScore = Math.max(0, Math.min(150, scaledScore));
```

**REPLACED WITH:**
```javascript
// Z-scores already provide proper standardization - no additional scaling needed
const finalScore = Math.max(0, Math.min(100, compositeScore));
```

**Impact:** Removed 1.15x multiplier and 150 cap. Durability scores now return percentiles in proper 0-100 range.

---

### 4. Team Score (`src/components/scoringCategories/teamScore.js`)

**REMOVED:**
```javascript
// TEAM SCORE ADJUSTMENT: Reduce by 40% to normalize scoring range
const scaledTeamScore = adjustedTeamCompositeScore * 0.6;
const finalScore = Math.max(0, Math.min(100, scaledTeamScore));
```

**REPLACED WITH:**
```javascript
// Z-scores already provide proper standardization - no additional scaling needed
const finalScore = Math.max(0, Math.min(100, adjustedTeamCompositeScore));
```

**Impact:** Removed 0.6x (40% reduction) multiplier. Team scores now return percentiles in proper 0-100 range.

---

## Why These Were Removed

### 1. **Z-scores Already Standardize**
Z-scores mathematically standardize all stats to the same scale relative to the population. They already tell you how many standard deviations above/below average a QB is.

### 2. **Arbitrary Multipliers Defeat the Purpose**
The whole point of migrating to z-scores was to get accurate statistical comparison. Adding arbitrary multipliers (1.5x, 1.2x, 1.15x, 0.6x) defeats this purpose.

### 3. **Band-aids for Old System**
These multipliers were compensating for issues in the old percentile-based approach where scores didn't spread properly. With z-scores, this problem is solved mathematically.

### 4. **Wrong Score Ranges**
- Old caps: 150 (stats), 150 (clutch), 150 (durability), 100 (team)
- New caps: 100 for all components
- Percentiles naturally fall in 0-100 range from z-score conversion

### 5. **User Weights Are the Control**
The hierarchical weighting system is where users control the importance of different factors. The foundational scores should be statistically pure.

## What Remains

### Kept (Legitimate):
- ✅ **Playoff adjustment factors** - These compare playoff performance to regular season, which is a valid relative comparison
- ✅ **Year weights** (75% 2024, 20% 2023, 5% 2022) - User can configure this, it's not arbitrary
- ✅ **Sub-component weights** - User-configurable (e.g., efficiency: anyA 45%, tdPct 30%, cmpPct 25%)
- ✅ **Category weights** - User's philosophy (team, stats, clutch, durability, support percentages)
- ✅ **Penalty systems** - Game start penalties, experience modifiers (applied at QEI level, not component level)

### Removed (Arbitrary):
- ❌ **1.5x stats multiplier** - Artificial inflation
- ❌ **1.2x clutch multiplier** - Artificial inflation
- ❌ **1.15x durability multiplier** - Artificial inflation
- ❌ **0.6x team multiplier** - Artificial deflation
- ❌ **150 score caps** - Wrong range for percentiles

## Expected Impact

### Score Distribution Changes:
- **Before:** Scores could exceed 100, reached up to 150 in some components
- **After:** All component scores properly in 0-100 range as percentiles

### Relative Rankings:
- Should remain similar since all QBs were affected by same multipliers
- Rankings may shift slightly as components are now on truly equal footing
- Elite performers will still be elite (high percentiles), but scores will be mathematically pure

### User Experience:
- More intuitive: 50 = average, 84 = +1 std dev (good), 16 = -1 std dev (poor)
- Consistent: All components use same 0-100 scale
- Honest: Scores reflect actual statistical position, not artificially inflated/deflated

## Validation

All modified files passed linter with no errors:
- ✅ `src/components/scoringCategories/statsScore.js`
- ✅ `src/components/scoringCategories/clutchScore.js`
- ✅ `src/components/scoringCategories/durabilityScore.js`
- ✅ `src/components/scoringCategories/teamScore.js`

## Testing Recommendations

1. **Verify score ranges**: All component scores should be 0-100
2. **Check elite QBs**: Should have scores in 80-100 range for their strengths
3. **Check average QBs**: Should have scores near 50
4. **Check poor performers**: Should have scores in 0-20 range for their weaknesses
5. **Validate rankings**: Top QBs should still be on top, but with mathematically pure scores

