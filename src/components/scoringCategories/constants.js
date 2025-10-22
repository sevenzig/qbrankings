// Shared constants used across multiple scoring categories

// NOTE: Performance percentiles are now calculated dynamically using z-scores
// This provides more accurate statistical standardization compared to hardcoded thresholds

// Legacy scoring tiers - kept for reference but no longer actively used
// Z-score based calculations replace these hardcoded values
export const SCORING_TIERS = {
  // Tier 1: Core Efficiency (45 points)
  ANY_A_POINTS: 25,
  TD_RATE_POINTS: 12,
  COMPLETION_POINTS: 8,
  
  // Tier 2: Decision Making & Protection (25 points)
  SACK_RATE_POINTS: 10,
  INT_RATE_POINTS: 8,
  FUMBLE_RATE_POINTS: 7,
  
  // Tier 3: Volume & Production (30 points)
  PASS_YARDS_POINTS: 8,
  PASS_TDS_POINTS: 7,
  VOLUME_RESP_POINTS: 5,
  RUSH_TDS_POINTS: 4,
  RUSH_YARDS_POINTS: 4,
  
  // Adjustments
  TURNOVER_BURDEN_MIN: -3,
  TURNOVER_BURDEN_MAX: 2
};

// Scaling ranges for various calculations
export const SCALING_RANGES = {
  WIN_PCT_CURVE: 0.8  // Curve factor for win percentage scaling in team score calculation
};

// Year weights for multi-season analysis

// Performance-based metrics (stats, clutch, support) - emphasize recent performance
export const PERFORMANCE_YEAR_WEIGHTS = {
  2024: 0.75,
  2023: 0.20,
  2022: 0.05
};

// Playoff-specific metrics - emphasize recent success (60:30:10 rule with granularity)
export const PLAYOFF_YEAR_WEIGHTS = {
  2024: 0.75,
  2023: 0.20,
  2022: 0.05
};

// Regular season metrics - balanced weighting with enhanced granularity
export const REGULAR_SEASON_YEAR_WEIGHTS = {
  2024: 0.75,
  2023: 0.20,
  2022: 0.05
};

// Stability-based metrics (durability) - equal weighting with micro-adjustments for uniqueness
export const STABILITY_YEAR_WEIGHTS = {
  2024: 0.75,
  2023: 0.20,
  2022: 0.05
}; 