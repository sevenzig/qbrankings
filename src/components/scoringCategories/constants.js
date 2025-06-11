// Shared constants used across multiple scoring categories

// Performance Percentiles (2022-2024 Starting QBs: 10+ games, 200+ attempts)
export const PERFORMANCE_PERCENTILES = {
  'ANY/A': {
    p95: 8.8, p90: 7.8, p75: 7.2, p50: 6.4, p25: 5.8, p10: 5.1, p5: 4.7
  },
  'TD%': {
    p95: 7.5, p90: 6.5, p75: 5.4, p50: 4.6, p25: 4.0, p10: 3.2, p5: 2.8
  },
  'Sk%': {
    p95: 3.2, p90: 4.1, p75: 5.2, p50: 6.4, p25: 7.8, p10: 9.2, p5: 10.5
  },
  'Int%': {
    p95: 1.0, p90: 1.4, p75: 1.8, p50: 2.1, p25: 2.6, p10: 3.2, p5: 3.8
  },
  'Cmp%': {
    p95: 71.5, p90: 69.8, p75: 67.2, p50: 65.1, p25: 62.8, p10: 59.5, p5: 56.2
  },
  'Fumble%': {
    p95: 0.3, p90: 0.5, p75: 0.7, p50: 0.9, p25: 1.2, p10: 1.6, p5: 2.0
  }
};

// Scoring tier point allocations (45/25/30 distribution)
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
  2024: 0.6127, 
  2023: 0.2941, 
  2022: 0.0932 
};

// Playoff-specific metrics - emphasize recent success (60:30:10 rule with granularity)
export const PLAYOFF_YEAR_WEIGHTS = { 
  2024: 0.6019, 
  2023: 0.3076, 
  2022: 0.0905 
};

// Regular season metrics - balanced weighting with enhanced granularity
export const REGULAR_SEASON_YEAR_WEIGHTS = { 
  2024: 0.3381, 
  2023: 0.3347, 
  2022: 0.3272 
};

// Stability-based metrics (durability) - equal weighting with micro-adjustments for uniqueness
export const STABILITY_YEAR_WEIGHTS = { 
  2024: 0.3347, 
  2023: 0.3329, 
  2022: 0.3324 
}; 