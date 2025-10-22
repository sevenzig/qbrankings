// Supporting Cast Quality Score (0-100)
// Higher score = Better supporting cast quality
// Updated: Uses z-score based calculations for standardized scoring
import { PERFORMANCE_YEAR_WEIGHTS } from './constants.js';
import {
  calculateZScore,
  calculateMean,
  calculateStandardDeviation,
  zScoreToPercentile,
  calculateCompositeZScore
} from '../../utils/zScoreCalculations.js';

// 2024 NFL Supporting Cast Data - REALISTIC SCORING based on performance benchmarks
const SUPPORT_DATA_2024 = {
  // Offensive Line Quality (0-35 points) - Based on pass protection metrics and run blocking
  offensiveLine: {
    'BAL': 32,  // Elite - 16.35 score, historically great protection for Henry/Jackson
    'WSH': 30,  // Elite - 10.22 score, massive rookie QB protection improvement  
    'PHI': 29,  // Above Average - 10.16 score, still strong despite regression
    'TB': 28,   // Above Average - 9.11 score, solid Mayfield protection
    'DEN': 27,  // Above Average - 9.07 score, major Bo Nix protection upgrade
    'GB': 26,   // Above Average - 8.66 score, gave Love time to develop
    'ARI': 25,  // Above Average - 7.48 score, better than expected for Murray
    'BUF': 23,  // Average - 5.60 score, solid but not elite Allen protection
    'DET': 22,  // Average - 4.89 score, good run blocking, decent pass pro
    'KC': 21,   // Average - 3.45 score, Mahomes makes them look better
    'SF': 20,   // Average - 2.40 score, still functional but declining
    'CAR': 19,  // Average - 0.23 score, around league average
    'LAC': 18,  // Below Average - 0.12 score, inconsistent protection
    'PIT': 17,  // Below Average - (-0.65) score, struggled with protection
    'MIN': 16,  // Below Average - (-0.65) score, hurt Darnold/McCarthy
    'CHI': 15,  // Below Average - (-0.95) score, rookie QB struggles
    'LAR': 14,  // Below Average - (-1.15) score, inconsistent unit
    'ATL': 13,  // Below Average - (-1.60) score, limited Cousins
    'IND': 13,  // Below Average - (-1.81) score, hurt Richardson development
    'JAX': 12,  // Below Average - (-2.31) score, poor Lawrence protection
    'NO': 12,   // Below Average - (-3.23) score, limited offensive potential
    'DAL': 11,  // Poor - (-3.66) score, major protection breakdowns
    'NYJ': 10,  // Poor - (-3.70) score, failed despite investments
    'CLE': 10,  // Poor - (-3.83) score, limited Watson significantly
    'NYG': 9,   // Poor - (-5.56) score, hurt Jones/Lock badly
    'HOU': 9,   // Poor - (-6.40) score, Stroud took major beating
    'LV': 8,    // Poor - (-7.24) score, very poor protection
    'CIN': 8,   // Poor - (-7.61) score, surprisingly terrible, hurt Burrow
    'NE': 8,    // Poor - (-7.64) score, hurt rookie development
    'TEN': 8,   // Poor - (-9.13) score, among league's worst
    'SEA': 8,   // Poor - (-9.29) score, scheme made it worse
    'MIA': 7    // Poor - (-11.12) score, worst in league, destroyed offense
  },
  
  // Weapons Quality (0-40 points) - Based on actual production, depth, and elite talent
  weapons: {
    'CIN': 37,  // Elite - Chase triple crown historic, Higgins elite when healthy
    'DET': 35,  // Elite - St. Brown elite, LaPorta breakout, dual-threat backfield
    'MIN': 34,  // Elite - Jefferson historic season, solid supporting cast
    'PHI': 33,  // Elite - AJ Brown/Smith elite duo, Barkley explosive
    'BAL': 32,  // Elite - Henry addition transformed offense, Flowers emergence
    'KC': 31,   // Above Average - Kelce elite, Hopkins/Worthy additions
    'SF': 30,   // Above Average - Elite trio even without CMC most of season
    'CHI': 29,  // Above Average - Moore elite, Allen veteran, Odunze development
    'HOU': 28,  // Above Average - Elite talent hurt by protection issues
    'TB': 27,   // Above Average - Evans/Godwin productive veterans
    'JAX': 26,  // Above Average - Thomas Jr. breakout, solid supporting cast
    'BUF': 25,  // Average - Adapted well post-Diggs, Cooper/Kincaid solid
    'LV': 24,   // Average - Adams elite, Bowers rookie records
    'LAR': 23,  // Average - Elite when healthy, major injury issues
    'DAL': 22,  // Average - CeeDee elite, virtually no depth
    'GB': 21,   // Average - Young corps developing, limited proven depth
    'NYG': 20,  // Average - Nabers explosion, no other reliable threats
    'IND': 19,  // Below Average - Developing weapons, Pittman steady
    'LAC': 18,  // Below Average - McConkey breakthrough, very thin depth
    'ATL': 17,  // Below Average - London/Pitts underperformed, Bijan solid
    'SEA': 16,  // Below Average - Veteran duo, scheme hurt effectiveness
    'NO': 15,   // Below Average - Olave solid, aging Kamara, limited depth
    'TEN': 14,  // Below Average - Hopkins/Ridley helped, QB play limited
    'WSH': 13,  // Below Average - McLaurin career year, no depth beyond him
    'MIA': 12,  // Below Average - Hill/Waddle hurt, Tua missed significant time
    'ARI': 11,  // Below Average - Harrison Jr. underwhelmed, chemistry issues
    'PIT': 10,  // Poor - Pickens only option, very limited depth
    'DEN': 10,  // Poor - Sutton solid, minimal depth after trades
    'CLE': 9,   // Poor - Cooper solid, very limited overall weapons
    'NYJ': 9,   // Poor - Wilson limited, overall thin weapons group
    'CAR': 8,   // Poor - Johnson/Thielen decent, poor supporting cast
    'NE': 7     // Poor - Worst weapons in league, complete rebuild needed
  },
  
  // Defense Quality (0-25 points) - Based on DVOA performance and playoff correlation
  defense: {
    'PHI': 24,  // Elite - (-16.2%) DVOA, elite across all phases
    'MIN': 23,  // Elite - (-15.3%) DVOA, Flores system working perfectly
    'HOU': 22,  // Elite - (-15.3%) DVOA, young defense emerged
    'DEN': 21,  // Above Average - (-12.4%) DVOA, Surtain anchors elite secondary
    'DET': 20,  // Above Average - (-9.5%) DVOA, Hutchinson/Campbell system
    'BAL': 19,  // Above Average - (-8.1%) DVOA, still strong unit
    'GB': 18,   // Above Average - (-7.1%) DVOA, significant improvement
    'PIT': 17,  // Above Average - (-6.0%) DVOA, Watt anchors strong unit
    'LAC': 16,  // Average - (-5.0%) DVOA, Bosa/Mack edge leadership
    'SEA': 15,  // Average - (-4.9%) DVOA, solid overall performance
    'BUF': 15,  // Average - (-4.7%) DVOA, still capable unit
    'KC': 14,   // Average - (-2.7%) DVOA, opportunistic championship defense
    'SF': 13,   // Average - (-1.6%) DVOA, down from elite level
    'ARI': 12,  // Average - (-0.6%) DVOA, young unit showing improvement
    'IND': 12,  // Average - (0.9%) DVOA, decent overall performance
    'TB': 11,   // Below Average - (1.2%) DVOA, Bowles system okay
    'TEN': 11,  // Below Average - (1.7%) DVOA, limited overall talent
    'LV': 10,   // Below Average - (1.7%) DVOA, Crosby carries unit
    'MIA': 10,  // Below Average - (1.9%) DVOA, inconsistent performance
    'NYJ': 9,   // Below Average - (3.5%) DVOA, underperformed talent level
    'NO': 9,    // Below Average - (3.5%) DVOA, cap casualties hurt
    'CHI': 8,   // Below Average - (3.7%) DVOA, young unit learning
    'WSH': 8,   // Below Average - (3.8%) DVOA, rebuilding defense
    'DAL': 7,   // Poor - (3.9%) DVOA, major disappointment
    'CLE': 7,   // Poor - (4.0%) DVOA, Garrett can't carry everyone
    'LAR': 6,   // Poor - (4.4%) DVOA, Donald retirement impact
    'CIN': 6,   // Poor - (6.4%) DVOA, pass rush improved but overall poor
    'NYG': 6,   // Poor - (6.6%) DVOA, some young talent developing
    'ATL': 5,   // Poor - (7.5%) DVOA, inconsistent unit
    'NE': 5,    // Poor - (12.1%) DVOA, rebuilding everything
    'JAX': 4,   // Poor - (18.6%) DVOA, major struggles across board
    'CAR': 4    // Poor - (19.2%) DVOA, bottom of league
  }
};

// 2023 NFL Supporting Cast Data - REALISTIC SCORING
const SUPPORT_DATA_2023 = {
  // Offensive Line Quality (0-35 points)
  offensiveLine: {
    'PHI': 33,  // Elite - Best unit when healthy, Mailata/Kelce/Johnson
    'DET': 31,  // Elite - Sewell/Ragnow anchored dominant unit
    'IND': 30,  // Elite - Raimann breakout, elite tackle duo
    'ATL': 29,  // Above Average - Lindstrom elite, 87.4% pass-blocking efficiency
    'BAL': 28,  // Above Average - Stanley/Linderbaum solid core
    'KC': 27,   // Above Average - Elite interior trio
    'SF': 26,   // Above Average - Still strong but not 2022 level
    'CLE': 25,  // Above Average - Bitonio All-Pro when healthy
    'LV': 24,   // Average - Solid overall performance
    'TB': 23,   // Average - Wirfs elite, decent supporting cast
    'LAR': 22,  // Average - Injury issues but talent present
    'GB': 21,   // Average - Bakhtiari when healthy, questions elsewhere
    'MIN': 20,  // Average - Darrisaw solid, O'Neill reliable
    'DAL': 19,  // Below Average - Elite pieces, injury issues
    'MIA': 18,  // Below Average - Armstead injury problems
    'BUF': 17,  // Below Average - Solid but depth concerns
    'CIN': 16,  // Below Average - Upgrades helped but still issues
    'NO': 15,   // Below Average - McCoy solid, Penning struggles
    'JAX': 14,  // Below Average - Robinson when healthy only
    'LAC': 13,  // Below Average - Slater elite, interior struggled
    'DEN': 12,  // Below Average - Developing unit
    'TEN': 11,  // Below Average - Rookie growing pains
    'SEA': 10,  // Poor - Consistency issues throughout
    'NYJ': 9,   // Poor - Becton injuries, poor overall
    'CHI': 9,   // Poor - Young tackles learning
    'PIT': 8,   // Poor - Injury issues, struggles
    'HOU': 8,   // Poor - Tunsil good, interior terrible
    'CAR': 8,   // Poor - Moton only reliable piece
    'WSH': 8,   // Poor - Thomas good when healthy, rest poor
    'NYG': 7,   // Poor - Thomas elite, everyone else struggled
    'NE': 7,    // Poor - Departures hurt, overall poor
    'ARI': 6    // Poor - Major struggles across the line
  },

  // Weapons Quality (0-40 points)
  weapons: {
    'CIN': 38,  // Elite - Chase/Higgins elite duo, Boyd reliable
    'SF': 37,   // Elite - Embarrassment of riches when healthy
    'MIA': 36,  // Elite - Hill/Waddle speed when healthy
    'PHI': 35,  // Elite - AJ Brown elite, Smith excellent
    'SEA': 34,  // Elite - Metcalf/Lockett plus JSN addition
    'DAL': 33,  // Above Average - CeeDee elite, added Cooks
    'MIN': 32,  // Above Average - Jefferson elite, solid support
    'LV': 31,   // Above Average - Adams elite despite QB issues
    'BUF': 30,  // Above Average - Diggs elite, solid support
    'TB': 29,   // Above Average - Evans/Godwin productive
    'DET': 28,  // Above Average - St. Brown elite, LaPorta rookie emergence
    'KC': 27,   // Average - Kelce elite, lost Hill, Rice emerged
    'HOU': 26,  // Average - Young weapons showing promise
    'NYJ': 25,  // Average - Wilson solid, Hall return
    'JAX': 24,  // Average - Kirk/Engram solid core
    'LAC': 23,  // Average - Allen/Williams when healthy
    'TEN': 22,  // Average - Hopkins aging but productive
    'ATL': 21,  // Average - Young weapons developing
    'CHI': 20,  // Below Average - Moore solid, limited depth
    'GB': 19,   // Below Average - Young corps, inconsistent
    'LAR': 18,  // Below Average - Elite when healthy, injury issues
    'IND': 17,  // Below Average - Pittman solid, developing others
    'PIT': 16,  // Below Average - Pickens promising, limited depth
    'CLE': 15,  // Below Average - Cooper solid, Chubb when healthy
    'WSH': 14,  // Below Average - McLaurin elite, no depth
    'NO': 13,   // Below Average - Olave promising, aging Kamara
    'DEN': 12,  // Below Average - Sutton solid, limited depth
    'ARI': 11,  // Below Average - Limited weapons overall
    'NYG': 10,  // Poor - Saquon elite, WR corps very thin
    'CAR': 9,   // Poor - Limited weapons beyond few pieces
    'NE': 8,    // Poor - Very limited across the board
    'NYJ': 8    // Poor - Pre-Rodgers, limited talent
  },

  // Defense Quality (0-25 points)
  defense: {
    'BAL': 24,  // Elite - Historic defensive performance
    'CLE': 23,  // Elite - Garrett-led elite unit
    'NYJ': 22,  // Elite - Gardner/Williams elite secondary
    'SF': 21,   // Above Average - Bosa/Warner elite front
    'DAL': 20,  // Above Average - Parsons/Lawrence pass rush
    'BUF': 19,  // Above Average - Von Miller/Oliver solid
    'DET': 18,  // Above Average - Hutchinson emerging
    'PIT': 17,  // Above Average - Watt anchors strong unit
    'KC': 16,   // Average - Jones/Sneed opportunistic
    'MIA': 15,  // Average - Phillips/Ramsey when healthy
    'LAC': 14,  // Average - Bosa/Mack edge duo
    'MIN': 13,  // Average - Flores system implementation
    'HOU': 12,  // Average - Young defense emerging
    'PHI': 12,  // Average - Disappointed after elite 2022
    'NO': 11,   // Below Average - Lattimore/Mathieu solid
    'SEA': 10,  // Below Average - Wagner departure hurt
    'IND': 9,   // Below Average - Richardson/Leonard injuries
    'LV': 8,    // Below Average - Crosby elite, limited support
    'GB': 8,    // Below Average - Coordinator change struggles
    'DEN': 7,   // Below Average - Surtain elite, overall poor
    'LAR': 7,   // Below Average - Donald elite, aging unit
    'ATL': 6,   // Poor - Limited talent across board
    'TB': 6,    // Poor - White/David aging
    'TEN': 6,   // Poor - Simmons solid, limited depth
    'CIN': 5,   // Poor - Hendrickson good, overall poor
    'JAX': 5,   // Poor - Lloyd/Allen solid, inconsistent
    'WSH': 5,   // Poor - Young/Sweat pass rush only
    'CHI': 5,   // Poor - Johnson emerged, young unit
    'NYG': 4,   // Poor - Thibodeaux developing
    'NE': 4,    // Poor - Judon solid, limited depth
    'CAR': 4,   // Poor - Burns elite, overall poor
    'ARI': 4    // Poor - Bottom of league
  }
};

// 2022 NFL Supporting Cast Data - REALISTIC SCORING
const SUPPORT_DATA_2022 = {
  // Offensive Line Quality (0-35 points)
  offensiveLine: {
    'PHI': 33,  // Elite - Johnson elite, Kelce anchored
    'BAL': 31,  // Elite - Stanley/Linderbaum emergence
    'KC': 30,   // Elite - Humphrey elite, strong interior
    'SF': 32,   // Elite - Williams historic 98.3 grade season
    'TB': 29,   // Above Average - Brady protection, all starters 70+
    'WSH': 28,  // Above Average - No weak links in pass pro
    'LAR': 27,  // Above Average - Whitworth at 40 elite
    'IND': 26,  // Above Average - Nelson/Kelly/Smith core
    'DET': 25,  // Above Average - Sewell/Ragnow foundation
    'CIN': 24,  // Average - Major upgrades helped
    'MIN': 23,  // Average - Darrisaw development
    'BUF': 22,  // Average - Decent core, development needed
    'NO': 21,   // Average - Penning rookie struggles
    'CLE': 20,  // Average - Bitonio elite, injury issues
    'MIA': 19,  // Below Average - Armstead when healthy
    'DAL': 18,  // Below Average - Smith career year, Martin excellent
    'LAC': 17,  // Below Average - Slater elite, interior questions
    'ATL': 16,  // Below Average - Lindstrom elite run blocker
    'GB': 15,   // Below Average - Bakhtiari when healthy
    'TEN': 14,  // Below Average - Limited talent
    'CAR': 13,  // Below Average - Moton solid, overall struggles
    'DEN': 12,  // Below Average - Bolles solid, interior concerns
    'ARI': 11,  // Below Average - Most penalized unit
    'CHI': 10,  // Poor - Young tackles developing
    'PIT': 9,   // Poor - Moore struggles
    'JAX': 9,   // Poor - Robinson when healthy only
    'NYJ': 8,   // Poor - Becton injuries
    'HOU': 8,   // Poor - Tunsil solid, interior terrible
    'LV': 8,    // Poor - Overall poor protection
    'NYG': 7,   // Poor - Thomas elite, rest struggled
    'NE': 7,    // Poor - Andrews aging
    'SEA': 6    // Poor - Rookie tackles struggled
  },

  // Weapons Quality (0-40 points)
  weapons: {
    'CIN': 38,  // Elite - Chase/Higgins led Super Bowl run
    'LAR': 37,  // Elite - Kupp historic season
    'TB': 36,   // Elite - Brady weapons loaded
    'KC': 35,   // Elite - Kelce/Hill before trade
    'MIA': 34,  // Elite - Hill/Waddle speed after trade
    'BUF': 33,  // Elite - Diggs elite, solid support
    'SF': 32,   // Above Average - Deebo/Kittle/Samuel versatility
    'LV': 31,   // Above Average - Adams after trade, Waller
    'PHI': 30,  // Above Average - AJ Brown trade elevated
    'DAL': 29,  // Above Average - CeeDee breakout
    'MIN': 28,  // Above Average - Jefferson elite, Thielen reliable
    'LAC': 27,  // Above Average - Allen elite, Williams solid
    'SEA': 26,  // Average - Metcalf/Lockett proven duo
    'DEN': 25,  // Average - Sutton solid, limited depth
    'GB': 24,   // Average - Adams departure hurt
    'PIT': 23,  // Average - Johnson/Claypool potential
    'TEN': 22,  // Average - Henry elite runner
    'CLE': 21,  // Average - Cooper solid, Chubb elite
    'IND': 20,  // Average - Pittman emerging, Taylor when healthy
    'NO': 19,   // Below Average - Thomas injury issues
    'JAX': 18,  // Below Average - Robinson when healthy
    'ARI': 17,  // Below Average - Hopkins suspended
    'NYJ': 16,  // Below Average - Wilson developing
    'DET': 15,  // Below Average - St. Brown emerging
    'BAL': 14,  // Below Average - Andrews elite, WR questions
    'WSH': 13,  // Below Average - McLaurin solid, limited depth
    'ATL': 12,  // Below Average - Pitts/London young
    'CAR': 11,  // Below Average - CMC elite, limited weapons
    'CHI': 10,  // Poor - Mooney only proven option
    'HOU': 9,   // Poor - Cooks solid, young developing
    'NYG': 8,   // Poor - Saquon when healthy, limited WR
    'NE': 7     // Poor - Very limited after departures
  },

  // Defense Quality (0-25 points)
  defense: {
    'BUF': 24,  // Elite - Elite across all phases
    'SF': 23,   // Elite - Bosa/Warner elite front
    'DAL': 22,  // Elite - Parsons/Lawrence elite
    'PHI': 21,  // Above Average - Gardner emerging
    'NYJ': 20,  // Above Average - Gardner elite
    'BAL': 19,  // Above Average - Jackson/Hamilton emerging
    'DEN': 18,  // Above Average - Surtain elite
    'NE': 17,   // Above Average - Judon breakout
    'TEN': 16,  // Average - Simmons elite, limited depth
    'KC': 15,   // Average - Jones elite, opportunistic
    'MIA': 14,  // Average - Phillips solid
    'TB': 13,   // Average - White/David leadership
    'MIN': 12,  // Average - Hunter/Smith solid
    'CLE': 11,  // Below Average - Garrett elite, Ward solid
    'LAC': 10,  // Below Average - Bosa/Mack duo
    'PIT': 9,   // Below Average - Watt elite, limited support
    'NO': 8,    // Below Average - Lattimore solid, declining
    'GB': 8,    // Below Average - Alexander solid
    'LV': 7,    // Below Average - Crosby elite, limited depth
    'IND': 6,   // Poor - Leonard when healthy
    'LAR': 6,   // Poor - Donald elite, struggling overall
    'CIN': 5,   // Poor - Hendrickson solid, poor overall
    'WSH': 5,   // Poor - Young solid, limited talent
    'CAR': 5,   // Poor - Burns elite, limited depth
    'CHI': 4,   // Poor - Mack solid, overall poor
    'JAX': 4,   // Poor - Allen solid, young developing
    'NYG': 4,   // Poor - Thibodeaux rookie
    'DET': 4,   // Poor - Hutchinson rookie, rebuilding
    'ATL': 4,   // Poor - Limited talent
    'SEA': 4,   // Poor - Wagner departure hurt
    'HOU': 4,   // Poor - Very limited talent
    'ARI': 3    // Poor - Bottom of league
  }
};

// 2024 Supporting Cast Total Sums (OL + Weapons + Defense)
const SUPPORTING_CAST_SUM_2024 = {
  'BAL': 83,  // 32 + 32 + 19
  'WSH': 51,  // 30 + 13 + 8
  'PHI': 86,  // 29 + 33 + 24
  'TB': 66,   // 28 + 27 + 11
  'DEN': 58,  // 27 + 10 + 21
  'GB': 65,   // 26 + 21 + 18
  'ARI': 48,  // 25 + 11 + 12
  'BUF': 63,  // 23 + 25 + 15
  'DET': 77,  // 22 + 35 + 20
  'KC': 66,   // 21 + 31 + 14
  'SF': 63,   // 20 + 30 + 13
  'CAR': 31,  // 19 + 8 + 4
  'LAC': 52,  // 18 + 18 + 16
  'PIT': 44,  // 17 + 10 + 17
  'MIN': 73,  // 16 + 34 + 23
  'CHI': 52,  // 15 + 29 + 8
  'LAR': 43,  // 14 + 23 + 6
  'ATL': 35,  // 13 + 17 + 5
  'IND': 44,  // 13 + 19 + 12
  'JAX': 42,  // 12 + 26 + 4
  'NO': 36,   // 12 + 15 + 9
  'DAL': 40,  // 11 + 22 + 7
  'NYJ': 28,  // 10 + 9 + 9
  'CLE': 26,  // 10 + 9 + 7
  'NYG': 35,  // 9 + 20 + 6
  'HOU': 59,  // 9 + 28 + 22
  'LV': 42,   // 8 + 24 + 10
  'CIN': 51,  // 8 + 37 + 6
  'NE': 20,   // 8 + 7 + 5
  'TEN': 33,  // 8 + 14 + 11
  'SEA': 39,  // 8 + 16 + 15
  'MIA': 29   // 7 + 12 + 10
};

// 2023 Supporting Cast Total Sums (OL + Weapons + Defense)  
const SUPPORTING_CAST_SUM_2023 = {
  'PHI': 80,  // 33 + 35 + 12
  'DET': 77,  // 31 + 28 + 18
  'IND': 56,  // 30 + 17 + 9
  'ATL': 56,  // 29 + 21 + 6
  'BAL': 71,  // 28 + 14 + 24
  'KC': 58,   // 27 + 27 + 16
  'SF': 84,   // 26 + 37 + 21
  'CLE': 63,  // 25 + 15 + 23
  'LV': 63,   // 24 + 31 + 8
  'TB': 58,   // 23 + 29 + 6
  'LAR': 47,  // 22 + 18 + 7
  'GB': 48,   // 21 + 19 + 8
  'MIN': 65,  // 20 + 32 + 13
  'DAL': 72,  // 19 + 33 + 20
  'MIA': 69,  // 18 + 36 + 15
  'BUF': 66,  // 17 + 30 + 19
  'CIN': 59,  // 16 + 38 + 5
  'NO': 39,   // 15 + 13 + 11
  'JAX': 43,  // 14 + 24 + 5
  'LAC': 50,  // 13 + 23 + 14
  'DEN': 31,  // 12 + 12 + 7
  'TEN': 39,  // 11 + 22 + 6
  'SEA': 54,  // 10 + 34 + 10
  'NYJ': 39,  // 9 + 25 + 22 (weapons 25, defense 22)
  'CHI': 34,  // 9 + 20 + 5
  'PIT': 41,  // 8 + 16 + 17
  'HOU': 46,  // 8 + 26 + 12
  'CAR': 22,  // 8 + 9 + 5
  'WSH': 27,  // 8 + 14 + 5
  'NYG': 21,  // 7 + 10 + 4
  'NE': 19,   // 7 + 8 + 4
  'ARI': 21   // 6 + 11 + 4
};

// 2022 Supporting Cast Total Sums (OL + Weapons + Defense)
const SUPPORTING_CAST_SUM_2022 = {
  'PHI': 84,  // 33 + 30 + 21
  'BAL': 64,  // 31 + 14 + 19
  'KC': 80,   // 30 + 35 + 15
  'SF': 87,   // 32 + 32 + 23
  'TB': 78,   // 29 + 36 + 13
  'WSH': 46,  // 28 + 13 + 5
  'LAR': 70,  // 27 + 37 + 6
  'IND': 46,  // 26 + 20 + 6
  'DET': 44,  // 25 + 15 + 4
  'CIN': 67,  // 24 + 38 + 5
  'MIN': 63,  // 23 + 28 + 12
  'BUF': 79,  // 22 + 33 + 24
  'NO': 40,   // 21 + 19 + 8
  'CLE': 42,  // 20 + 21 + 11
  'MIA': 63,  // 19 + 34 + 14
  'DAL': 71,  // 18 + 29 + 22
  'LAC': 44,  // 17 + 27 + 10
  'ATL': 28,  // 16 + 12 + 4
  'GB': 39,   // 15 + 24 + 8
  'TEN': 54,  // 14 + 22 + 16
  'CAR': 24,  // 13 + 11 + 5
  'DEN': 50,  // 12 + 25 + 18
  'ARI': 31,  // 11 + 17 + 3
  'CHI': 24,  // 10 + 10 + 4
  'PIT': 41,  // 9 + 23 + 9
  'JAX': 31,  // 9 + 18 + 4
  'NYJ': 44,  // 8 + 16 + 20
  'HOU': 22,  // 8 + 9 + 4
  'LV': 46,   // 8 + 31 + 7
  'NYG': 20,  // 7 + 8 + 4
  'NE': 28,   // 7 + 7 + 17
  'SEA': 36   // 6 + 26 + 4
};

/**
 * Calculate z-score based support score for a team in a specific year
 * Uses population statistics from all teams to standardize scoring
 */
const calculateWeightedSupportScore = (team, year, supportWeights = { offensiveLine: 55, weapons: 30, defense: 15 }, allTeams = null) => {
  const yearData = year === 2024 ? SUPPORT_DATA_2024 : 
                   year === 2023 ? SUPPORT_DATA_2023 : 
                   SUPPORT_DATA_2022;
  
  const oLine = yearData.offensiveLine[team] || 15;
  const weapons = yearData.weapons[team] || 20;
  const defense = yearData.defense[team] || 12;
  
  // Calculate population statistics for each component
  const allTeamsData = allTeams || Object.keys(yearData.offensiveLine);
  
  // Offensive Line z-score
  const oLineValues = allTeamsData.map(t => yearData.offensiveLine[t] || 15);
  const oLineMean = calculateMean(oLineValues);
  const oLineStdDev = calculateStandardDeviation(oLineValues, oLineMean);
  const oLineZ = calculateZScore(oLine, oLineMean, oLineStdDev, false); // Higher is better
  
  // Weapons z-score
  const weaponsValues = allTeamsData.map(t => yearData.weapons[t] || 20);
  const weaponsMean = calculateMean(weaponsValues);
  const weaponsStdDev = calculateStandardDeviation(weaponsValues, weaponsMean);
  const weaponsZ = calculateZScore(weapons, weaponsMean, weaponsStdDev, false); // Higher is better
  
  // Defense z-score
  const defenseValues = allTeamsData.map(t => yearData.defense[t] || 12);
  const defenseMean = calculateMean(defenseValues);
  const defenseStdDev = calculateStandardDeviation(defenseValues, defenseMean);
  const defenseZ = calculateZScore(defense, defenseMean, defenseStdDev, false); // Higher is better
  
  // Keep z-scores for hierarchical weighting
  const supportComponentZScores = {
    offensiveLine: oLineZ,
    weapons: weaponsZ,
    defense: defenseZ
  };
  
  // Helper function to normalize weights
  const normalizeWeights = (weights) => {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    if (total === 0) return weights;
    const normalized = {};
    Object.keys(weights).forEach(key => {
      normalized[key] = weights[key] / total;
    });
    return normalized;
  };
  
  // Apply hierarchical weighting to z-scores
  const normalizedWeights = normalizeWeights(supportWeights);
  let compositeZScore = 0;
  Object.keys(supportComponentZScores).forEach(key => {
    if (normalizedWeights[key] !== undefined) {
      compositeZScore += supportComponentZScores[key] * normalizedWeights[key];
    }
  });
  
  return compositeZScore;
};

export const calculateSupportScore = (qbSeasonData, supportWeights = { offensiveLine: 55, weapons: 30, defense: 15 }, include2024Only = false, mainSupportWeight = 0) => {
  // Initialize scoring
  let totalWeightedSupport = 0;
  let totalWeight = 0;
  
  // Process each year with actual teams played for
  // In 2024-only mode, only process 2024 data with 100% weight
  const yearWeights = include2024Only ? { '2024': 1.0 } : PERFORMANCE_YEAR_WEIGHTS;
  
  Object.entries(yearWeights).forEach(([year, weight]) => {
    const yearNum = parseInt(year);
    const seasonData = qbSeasonData.years && qbSeasonData.years[year];
    
    if (seasonData) {
      // Check if this QB has team data for this season
      let teamsThisYear = [];
      
      // If QB has teamsPlayed array (multi-team season), use that
      if (seasonData.teamsPlayed && seasonData.teamsPlayed.length > 0) {
        teamsThisYear = seasonData.teamsPlayed;
      } else if (seasonData.team) {
        teamsThisYear = [seasonData.team];
      } else if (seasonData.Team) {
        teamsThisYear = [seasonData.Team];
      }
      
      // Check if QB played meaningful games this season
      const gamesStarted = seasonData.GS || seasonData.gamesStarted || 0;
      
      // Calculate support for each team played for in this year
      if (teamsThisYear.length > 0 && ((include2024Only && yearNum === 2024 && gamesStarted >= 9) || (!include2024Only && gamesStarted >= 10))) {
        // For multi-team seasons, average the support scores
        const yearSupportScores = teamsThisYear.map(team => calculateWeightedSupportScore(team, yearNum, supportWeights));
        const avgYearSupport = yearSupportScores.reduce((sum, score) => sum + score, 0) / yearSupportScores.length;
        
        totalWeightedSupport += avgYearSupport * weight;
        totalWeight += weight;
      }
    }
  });
  
  // Fallback to current team if no season data available
  if (totalWeight === 0 && qbSeasonData.currentTeam) {
    Object.entries(yearWeights).forEach(([year, weight]) => {
      const yearNum = parseInt(year);
      const yearSupport = calculateWeightedSupportScore(qbSeasonData.currentTeam, yearNum, supportWeights);
      totalWeightedSupport += yearSupport * weight;
      totalWeight += weight;
    });
  }
  
  // Additional fallback if still no data
  if (totalWeight === 0) {
    return 0; // League average z-score
  }
  
  const finalSupportZScore = totalWeightedSupport / totalWeight;
  
  // Return z-score for higher-level composite calculation
  return finalSupportZScore;
}; 