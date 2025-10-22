# Tier System Update - Z-Score Aligned (6-Tier System)

**Date**: October 22, 2025  
**Status**: ✅ Implemented

## Overview

Updated the QB ranking tier system from a dynamic percentile-based 7-tier system to a mathematically fair 6-tier z-score aligned system with "Average" centered at the 50th percentile (median).

## Changes Summary

### Old System (7 Tiers - Dynamic Percentiles)
- **Elite**: 92nd percentile (top 8%)
- **Excellent**: 85th percentile (top 15%)
- **Very Good**: 77th percentile (top 23%)
- **Good**: 70th percentile (top 30%)
- **Average**: 55th percentile (top 45%)
- **Below Average**: <55th percentile

### New System (6 Tiers - Fixed Z-Score Thresholds)

| **Tier** | **Z-Score Range** | **Percentile Range** | **Expected %** | **Statistical Meaning** |
|----------|-------------------|----------------------|----------------|------------------------|
| **Elite** | z ≥ +1.35 | ≥91.1 | ~8.9% | Top tier, 1.35+ SD above mean |
| **Excellent** | +0.75 ≤ z < +1.35 | 77.3 - 91.1 | ~13.8% | High performers, 0.75-1.35 SD above |
| **Good** | +0.25 ≤ z < +0.75 | 59.9 - 77.3 | ~17.4% | Above average, 0.25-0.75 SD above |
| **Average** | -0.25 ≤ z < +0.25 | 40.1 - 59.9 | ~19.8% | **Around median**, ±0.25 SD of mean |
| **Below Average** | -0.75 ≤ z < -0.25 | 22.7 - 40.1 | ~17.4% | Below median, 0.25-0.75 SD below |
| **Poor** | z < -0.75 | <22.7 | ~22.7% | Struggling, 0.75+ SD below mean |

## Key Improvements

### 1. **Mathematically Fair**
- All thresholds derived from z-score cumulative distribution function (CDF)
- No arbitrary cutoffs - based on statistical principles
- Consistent regardless of weight configuration or sample size

### 2. **Intuitive "Average" Definition**
- **Average now centered at 50th percentile** (40.1 - 59.9)
- "Average" literally means statistically average (within ±0.25 SD of mean)
- More intuitive for users

### 3. **Symmetric Distribution**
- Good (+0.25 to +0.75) mirrors Below Average (-0.75 to -0.25)
- Balanced around the median
- Equal z-score spacing (0.5 SD increments at boundaries)

### 4. **Removed "Very Good" Tier**
- Simplified from 7 to 6 tiers
- Cleaner classification
- "Excellent" tier expanded to capture high performers (77.3-91.1)

### 5. **Added "Poor" Tier**
- Captures QBs more than 0.75 SD below mean (<22.7th percentile)
- Better distinguishes struggling performers
- More complete distribution coverage

## Z-Score to Percentile Mapping

The percentile thresholds are calculated using the error function:
```
CDF(z) = 0.5 * (1 + erf(z / √2))
```

**Exact Mappings**:
- z = +1.35 → 91.15th percentile (Elite threshold)
- z = +0.75 → 77.34th percentile (Excellent threshold)
- z = +0.25 → 59.87th percentile (Good threshold)
- z = 0.00 → 50.00th percentile (median)
- z = -0.25 → 40.13th percentile (Average threshold)
- z = -0.75 → 22.66th percentile (Below Average threshold)

## Files Modified

### 1. `src/utils/uiHelpers.js`
- Added `Z_SCORE_TIER_THRESHOLDS` constant with fixed percentile values
- Updated `calculateDynamicTiers()` to use fixed z-score thresholds
- Simplified `getQEIColor()` to use fixed thresholds (no dynamic calculation)
- Simplified `getQEITier()` to use fixed thresholds
- Updated console logging to show new tier system

### 2. `src/utils/screenshotUtils.js`
- Updated `getQEIColorStyle()` to use new 6-tier z-score thresholds
- Removed "Very Good" tier (bronze gradient)
- Adjusted color mappings for 6 tiers

## Expected Distribution (with ~100 QB-seasons)

```
Elite         █████████░ (~9 QBs)     91.1+ percentile  (z ≥ +1.35)
Excellent     █████████████░ (~14 QBs) 77.3-91.1         (z: +0.75 to +1.35)
Good          █████████████████░ (~17 QBs) 59.9-77.3     (z: +0.25 to +0.75)
Average       ███████████████████░ (~20 QBs) 40.1-59.9   (z: -0.25 to +0.25)
Below Avg     █████████████████░ (~17 QBs) 22.7-40.1     (z: -0.75 to -0.25)
Poor          ██████████████████████░ (~23 QBs) <22.7    (z < -0.75)
```

## Benefits

1. **Statistical Rigor**: Based on normal distribution properties
2. **Consistency**: Same thresholds regardless of weights or sample size
3. **Interpretability**: Users understand "X standard deviations above/below average"
4. **Fairness**: Elite status is rare and meaningful (~9% vs previous ~8%)
5. **Balance**: Symmetric distribution around median
6. **Simplicity**: 6 tiers instead of 7 (removed "Very Good")

## Technical Details

### Color Mapping (Updated)
- **Elite** (≥91.1): Gold gradient (`from-yellow-400/30 to-orange-400/30`)
- **Excellent** (≥77.3): Silver gradient (`from-gray-300/30 to-gray-400/30`)
- **Good** (≥59.9): Green gradient (`from-green-500/30 to-green-600/30`)
- **Average** (≥40.1): Blue gradient (`from-blue-500/30 to-blue-600/30`)
- **Below Avg** (≥22.7): Light gray (`bg-white/15`)
- **Poor** (<22.7): Gray (`bg-white/10`)

### Tier Labels
All tier labels are consistent across:
- Table row highlighting
- Tier badge display
- Screenshot generation
- Console debug logging

## Validation

The system maintains mathematical fairness by:
1. Using fixed percentile thresholds derived from z-scores
2. Not recalculating thresholds based on sample distribution
3. Ensuring "Average" is centered at the statistical median (50th percentile)
4. Maintaining symmetric z-score spacing around the mean

## Migration Notes

- No database changes required (QEI scores are already percentiles)
- No API changes required
- UI automatically updates based on new thresholds
- Backward compatible (existing QEI scores work with new tiers)
- Users will see tier assignments shift slightly due to new thresholds

## References

- Z-Score calculation: `src/utils/zScoreCalculations.js`
- Error function (erf): Abramowitz and Stegun approximation
- Normal distribution CDF: Standard statistical formula

