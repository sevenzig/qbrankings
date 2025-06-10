// Supporting Cast Difficulty Adjustment (0-100)
// Higher score = More "extra credit" for QB in difficult situation
import { YEAR_WEIGHTS } from './constants.js';

// 2024 NFL Supporting Cast Data
const SUPPORT_DATA_2024 = {
  // Offensive Line Quality (0-35 points) - Based on final 2024 comprehensive rankings
  offensiveLine: {
    'BAL': 35,  // #1 (16.35) - Elite across all metrics, Henry thrived
    'WSH': 34,  // #2 (10.22) - Massive improvement, protected Daniels well
    'PHI': 33,  // #3 (10.16) - Still elite unit despite some regression
    'TB': 32,   // #4 (9.11) - Strong unit, helped Mayfield succeed
    'DEN': 31,  // #5 (9.07) - Major improvement, protected Nix well
    'GB': 30,   // #6 (8.66) - Solid unit, Love had time
    'ARI': 29,  // #7 (7.48) - Better than expected, helped Murray
    'BUF': 28,  // #8 (5.60) - Good unit, kept Allen upright
    'DET': 27,  // #9 (4.89) - Solid overall, great for run game
    'KC': 26,   // #10 (3.45) - Decent, Mahomes made it work
    'SF': 25,   // #11 (2.40) - Still good but not elite level
    'CAR': 24,  // #12 (0.23) - Around average, improving
    'LAC': 23,  // #13 (0.12) - Average unit, decent protection
    'PIT': 22,  // #14 (-0.65) - Slightly below average
    'MIN': 21,  // #15 (-0.65) - Below average, hurt QB play
    'CHI': 20,  // #16 (-0.95) - Struggled with rookie QB
    'LAR': 19,  // #17 (-1.15) - Below average, inconsistent
    'ATL': 18,  // #18 (-1.60) - Poor unit, limited Cousins
    'IND': 17,  // #19 (-1.81) - Poor, hurt Richardson development
    'JAX': 16,  // #20 (-2.31) - Poor protection for Lawrence
    'NO': 15,   // #21 (-3.23) - Poor unit, limited offense
    'DAL': 14,  // #22 (-3.66) - Major issues, hurt Dak
    'NYJ': 13,  // #23 (-3.70) - Poor despite investments
    'CLE': 12,  // #24 (-3.83) - Poor, limited Watson
    'NYG': 11,  // #25 (-5.56) - Very poor, hurt Jones/Lock
    'HOU': 10,  // #26 (-6.40) - Very poor, Stroud took beating
    'LV': 9,    // #27 (-7.24) - Very poor, limited all QBs
    'CIN': 8,   // #28 (-7.61) - Surprisingly poor, held back Burrow
    'NE': 7,    // #29 (-7.64) - Very poor, hurt rookie development
    'TEN': 6,   // #30 (-9.13) - Among worst, limited Levis
    'SEA': 5,   // #31 (-9.29) - Poor unit, scheme didn't help
    'MIA': 4    // #32 (-11.12) - Worst in league, destroyed offense
  },
  
  // Weapons Quality (0-40 points) - Based on 2024 ACTUAL performance, injuries, and DEPTH
  weapons: {
    'CIN': 40,  // Chase triple crown (1,708 yds, 17 TDs), Higgins 911 yds/10 TDs in 12 games - ELITE
    'DET': 38,  // St. Brown elite (1,263 yds), LaPorta breakout, Montgomery/Gibbs dual threat
    'MIN': 37,  // Jefferson elite (1,533 yds, 10 TDs), Addison solid, Jones productive
    'PHI': 36,  // AJ Brown/Smith duo, Barkley explosive (2,005 total yds) - elite depth
    'BAL': 35,  // Henry addition (1,921 total yds), Flowers emergence, Andrews steady
    'KC': 34,   // Kelce elite, Hopkins mid-season addition, Worthy development
    'SF': 33,   // Even without CMC - Aiyuk, Deebo, Kittle elite trio remained healthy most of season
    'CHI': 32,  // Moore (1,364 yds), Allen veteran presence, Odunze development - good depth
    'HOU': 31,  // Diggs/Collins/Dell when healthy, but protection hurt all
    'TB': 30,   // Evans/Godwin still productive, better than expected depth
    'JAX': 29,  // Brian Thomas Jr. breakout (1,282 yds, 10 TDs), Kirk solid, Engram
    'BUF': 28,  // Cooper addition helped, Kincaid emergence, lost Diggs but adapted
    'LV': 27,   // Adams elite, Bowers rookie TE records (1,194 yds, 112 rec) - good 1-2 punch
    'LAR': 26,  // Kupp/Nacua elite when healthy, but injuries were major issue
    'DAL': 25,  // CeeDee elite (1,681 yds), but very limited depth beyond him
    'GB': 24,   // Watson when healthy, Jacobs solid, young corps developing
    'NYG': 23,  // Nabers rookie explosion (1,204 yds), but virtually no other threats
    'IND': 22,  // Richardson developing weapons, Pittman steady, Mitchell growing
    'LAC': 21,  // McConkey rookie records (1,149 yds), but very thin beyond him
    'ATL': 20,  // London/Pitts underperformed expectations, Bijan solid
    'SEA': 19,  // Metcalf/Lockett solid but scheme hurt effectiveness
    'NO': 18,   // Olave solid, Kamara aging, limited depth
    'TEN': 17,  // Hopkins/Ridley helped but QB play limited effectiveness
    'WSH': 16,  // McLaurin career year (1,096 yds, 13 TDs), but virtually no depth beyond him
    'MIA': 15,  // Hill/Waddle hurt much of season, Tua missed 4 games
    'ARI': 14,  // Harrison Jr. underwhelmed (885 yds), chemistry issues with Murray
    'PIT': 13,  // Pickens only reliable option, limited depth beyond him
    'DEN': 12,  // Sutton solid, limited depth after Jeudy trade
    'CLE': 11,  // Cooper solid, Jeudy addition helped, but limited overall
    'NYJ': 10,  // Wilson limited, Hall good but overall weapons thin
    'CAR': 9,   // Johnson/Thielen okay, but limited supporting cast
    'NE': 8     // Worst weapons in league, rebuilding everything
  },
  
  // Defense Quality (0-25 points) - Based on 2024 DVOA defensive rankings
  defense: {
    'PHI': 25,  // #1 DEF DVOA (-16.2%), elite across board
    'MIN': 24,  // #2 DEF DVOA (-15.3%), Flores system working
    'HOU': 23,  // #3 DEF DVOA (-15.3%), young defense emerged
    'DEN': 22,  // #4 DEF DVOA (-12.4%), Surtain elite
    'DET': 21,  // #5 DEF DVOA (-9.5%), Hutchinson/Campbell system
    'BAL': 20,  // #6 DEF DVOA (-8.1%), still elite unit
    'GB': 19,   // #7 DEF DVOA (-7.1%), significant improvement
    'PIT': 18,  // #8 DEF DVOA (-6.0%), Watt anchors unit
    'SEA': 17,  // #10 DEF DVOA (-4.9%), solid overall
    'LAC': 16,  // #9 DEF DVOA (-5.0%), Bosa/Mack leadership
    'BUF': 15,  // #11 DEF DVOA (-4.7%), still solid unit
    'KC': 14,   // #12 DEF DVOA (-2.7%), opportunistic defense
    'SF': 13,   // #13 DEF DVOA (-1.6%), down from elite level
    'ARI': 12,  // #14 DEF DVOA (-0.6%), young unit improving
    'IND': 11,  // #15 DEF DVOA (0.9%), decent overall
    'TB': 10,   // #16 DEF DVOA (1.2%), Bowles system okay
    'TEN': 9,   // #17 DEF DVOA (1.7%), limited talent
    'LV': 8,    // #18 DEF DVOA (1.7%), Crosby carries unit
    'MIA': 7,   // #19 DEF DVOA (1.9%), inconsistent unit
    'NYJ': 6,   // #20 DEF DVOA (3.5%), underperformed talent
    'NO': 5,    // #21 DEF DVOA (3.5%), cap casualties hurt
    'CHI': 4,   // #22 DEF DVOA (3.7%), young unit learning
    'WSH': 3,   // #23 DEF DVOA (3.8%), rebuilding defense
    'DAL': 2,   // #24 DEF DVOA (3.9%), major disappointment
    'CLE': 1,   // #25 DEF DVOA (4.0%), Garrett can't carry all
    'LAR': 15,  // #26 DEF DVOA (4.4%), Donald retirement hurt
    'CIN': 14,  // #27 DEF DVOA (6.4%), pass rush improved
    'NYG': 13,  // #28 DEF DVOA (6.6%), some young talent
    'ATL': 12,  // #29 DEF DVOA (7.5%), inconsistent unit
    'NE': 11,   // #30 DEF DVOA (12.1%), rebuilding everything
    'JAX': 10,  // #31 DEF DVOA (18.6%), major struggles
    'CAR': 9    // #32 DEF DVOA (19.2%), bottom of league
  }
};

// 2023 NFL Supporting Cast Data
const SUPPORT_DATA_2023 = {
  // Offensive Line Quality (0-35 points) - Based on 2023 final PFF rankings
  offensiveLine: {
    'PHI': 35,  // #1 - Mailata/Kelce/Johnson elite trio, best unit when healthy
    'DET': 34,  // #2 - Sewell/Ragnow anchored elite unit, lived up to expectations
    'IND': 33,  // #3 - Raimann breakout season, best tackle duo with Smith
    'ATL': 32,  // #4 - Lindstrom elite, 87.4 pass-blocking efficiency (2nd in NFL)
    'BAL': 31,  // #5 - Stanley/Linderbaum solid, though Stanley struggled some
    'KC': 30,   // #6 - Thuney/Humphrey/Smith elite interior trio
    'SF': 29,   // #7 - Still elite but not quite 2022 form, Williams anchors
    'CLE': 28,  // #8 - Bitonio All-Pro, Pocic career year when healthy
    'LV': 27,   // #9 - Solid performance, avoided major issues
    'TB': 26,   // #10 - Wirfs elite, solid overall unit
    'LAR': 25,  // #11 - Havenstein/Noteboom decent when healthy
    'GB': 24,   // #12 - Bakhtiari when healthy, interior questions
    'MIN': 23,  // #13 - Darrisaw solid, O'Neill reliable, interior average
    'DAL': 22,  // #14 - Smith elite, Martin solid, but injuries hurt
    'MIA': 21,  // #15 - Armstead injury issues, inconsistent performance
    'BUF': 20,  // #16 - Dawkins solid, but depth concerns showed
    'CIN': 19,  // #17 - Brown Jr. upgrade, Williams/Carman questions
    'NO': 18,   // #18 - McCoy solid, but Penning struggles at tackle
    'JAX': 17,  // #19 - Robinson when healthy, depth issues
    'LAC': 16,  // #20 - Slater elite, but interior line struggled
    'DEN': 15,  // #21 - Bolles/McGlinchey decent, Meinerz emerging
    'TEN': 14,  // #22 - Skoronski rookie growing pains, inconsistent
    'SEA': 13,  // #23 - Cross/Lucas development, but consistency issues
    'NYJ': 12,  // #24 - Becton injuries, overall poor protection
    'CHI': 11,  // #25 - Jones/Wright young tackles, Jenkins solid at guard
    'PIT': 10,  // #26 - Jones injury issues, Moore struggles
    'HOU': 9,   // #27 - Tunsil solid, but interior line major issues
    'CAR': 8,   // #28 - Moton reliable, but LT/interior struggles
    'WSH': 7,   // #29 - Thomas good when healthy, but overall poor
    'NYG': 6,   // #30 - Thomas elite, but rest of line struggled badly
    'NE': 5,    // #31 - Brown departure hurt, overall poor unit
    'ARI': 4    // #32 - Humphries decent, but major struggles elsewhere
  },

  // Weapons Quality (0-40 points) - Based on 2023 actual performance
  weapons: {
    'CIN': 40,  // Chase/Higgins elite duo, Boyd reliable third option
    'SF': 38,   // Aiyuk/Samuel/Kittle/CMC - embarrassment of riches
    'MIA': 37,  // Hill/Waddle speed demons, explosive when healthy
    'PHI': 36,  // AJ Brown elite, Smith excellent, added Swift
    'SEA': 35,  // Metcalf/Lockett veteran duo, JSN rookie addition
    'DAL': 34,  // CeeDee elite, added Cooks, Ferguson emerged
    'MIN': 33,  // Jefferson elite, Hockenson addition, Addison rookie
    'LV': 32,   // Adams elite despite QB issues, solid supporting cast
    'BUF': 31,  // Diggs elite, Davis solid, Kincaid rookie TE
    'TB': 30,   // Evans/Godwin aging but productive, solid depth
    'DET': 29,  // St. Brown elite, LaPorta rookie TE, Swift/Montgomery
    'KC': 28,   // Kelce elite, but lost Hill, Rice emerged late
    'HOU': 27,  // Collins/Dell promising, Tank addition mid-season
    'NYJ': 26,  // Wilson solid, Breece Hall return, limited depth
    'JAX': 25,  // Kirk/Engram solid, ETN developing
    'LAC': 24,  // Allen/Williams when healthy, depth concerns
    'TEN': 23,  // Hopkins aging, limited depth after trades
    'ATL': 22,  // London developing, Pitts underperformed, Bijan solid
    'CHI': 21,  // Moore solid, limited proven depth
    'GB': 20,   // Mostly young receivers, some upside but inconsistent
    'LAR': 19,  // Kupp/Nacua when healthy, but injury issues
    'IND': 18,  // Pittman solid, Richardson developing weapons
    'PIT': 17,  // Pickens promising, Najee solid, limited depth
    'CLE': 16,  // Cooper solid, Chubb elite when healthy, limited WR depth
    'WSH': 15,  // McLaurin elite, but very little depth beyond him
    'NO': 14,   // Olave promising, Kamara aging, Thomas injuries
    'DEN': 13,  // Sutton solid, limited depth after trades
    'ARI': 12,  // Limited weapons, waiting on development
    'NYG': 11,  // Saquon elite, but WR corps very thin
    'CAR': 10,  // Burns/CMC solid, but overall limited
    'NE': 9,    // Very limited weapons across the board
    'NYJ': 8    // Pre-Rodgers injury, limited overall talent
  },

  // Defense Quality (0-25 points) - Based on 2023 final DVOA rankings
  defense: {
    'BAL': 25,  // #1 DEF DVOA - Historic defensive performance
    'CLE': 24,  // #2 DEF DVOA - Garrett-led elite unit (18th best ever)
    'NYJ': 23,  // #3 DEF DVOA - Gardner/Williams elite secondary
    'SF': 22,   // #4 DEF DVOA - Bosa/Warner elite front seven
    'DAL': 21,  // #5 DEF DVOA - Parsons/Lawrence pass rush
    'BUF': 20,  // #6 DEF DVOA - Von Miller/Oliver solid front
    'DET': 19,  // #7 DEF DVOA - Hutchinson emerging, Campbell system
    'PIT': 18,  // #8 DEF DVOA - Watt anchors strong unit
    'KC': 17,   // #9 DEF DVOA - Jones/Sneed (before trade)
    'MIA': 16,  // #10 DEF DVOA - Phillips/Ramsey when healthy
    'LAC': 15,  // #11 DEF DVOA - Bosa/Mack edge duo
    'MIN': 14,  // #12 DEF DVOA - Flores system implementation
    'HOU': 13,  // #13 DEF DVOA - Young defense emerging under Ryans
    'PHI': 12,  // #14 DEF DVOA - Disappointed after elite 2022
    'NO': 11,   // #15 DEF DVOA - Lattimore/Mathieu solid
    'SEA': 10,  // #16 DEF DVOA - Wagner departure hurt
    'IND': 9,   // #17 DEF DVOA - Richardson/Leonard injuries
    'LV': 8,    // #18 DEF DVOA - Crosby elite, limited support
    'GB': 7,    // #19 DEF DVOA - Coordinator change struggles
    'DEN': 6,   // #20 DEF DVOA - Surtain elite, but overall poor
    'LAR': 5,   // #21 DEF DVOA - Donald elite, but aging unit
    'ATL': 4,   // #22 DEF DVOA - Limited talent across board
    'TB': 3,    // #23 DEF DVOA - White/David aging
    'TEN': 2,   // #24 DEF DVOA - Simmons solid, limited depth
    'CIN': 1,   // #25 DEF DVOA - Hendrickson good, but poor overall
    'JAX': 15,  // #26 DEF DVOA - Lloyd/Allen solid, inconsistent
    'WSH': 14,  // #27 DEF DVOA - Young/Sweat pass rush
    'CHI': 13,  // #28 DEF DVOA - Johnson emerged, young unit
    'NYG': 12,  // #29 DEF DVOA - Thibodeaux developing
    'NE': 11,   // #30 DEF DVOA - Judon solid, limited depth
    'CAR': 10,  // #31 DEF DVOA - Burns elite, but overall poor
    'ARI': 9    // #32 DEF DVOA - Bottom of league
  }
};

// 2022 NFL Supporting Cast Data
const SUPPORT_DATA_2022 = {
  // Offensive Line Quality (0-35 points) - Based on 2022 final PFF rankings
  offensiveLine: {
    'PHI': 35,  // #1 - Johnson elite, Kelce anchored, most penalized but effective
    'BAL': 34,  // #2 - Stanley/Linderbaum rookie emergence, solid unit
    'KC': 33,   // #3 - Humphrey elite center, Thuney/Smith interior
    'SF': 32,   // #4 - Williams historic season (98.3 PFF grade), elite unit
    'TB': 31,   // #5 - Brady protection, all starters 70+ grades
    'WSH': 30,  // #6 - No weak links, especially in pass protection
    'LAR': 29,  // #7 - Whitworth at 40 elite, Havenstein solid bookend
    'IND': 28,  // #8 - Nelson/Kelly/Smith core excellent
    'DET': 27,  // #9 - Sewell/Ragnow foundation, improving unit
    'CIN': 26,  // #10 - Major upgrades with Karras/Cappa/Collins
    'MIN': 25,  // #11 - Darrisaw development, solid overall
    'BUF': 24,  // #12 - Brown development needed, decent core
    'NO': 23,   // #13 - Penning rookie struggles at LT
    'CLE': 22,  // #14 - Bitonio elite, but injury issues
    'MIA': 21,  // #15 - Armstead solid when healthy
    'DAL': 20,  // #16 - Smith career year (91.9), Martin excellent
    'LAC': 19,  // #17 - Slater elite, interior questions
    'ATL': 18,  // #18 - Lindstrom elite run blocker
    'GB': 17,   // #19 - Bakhtiari when healthy, Rodgers helped
    'TEN': 16,  // #20 - Limited talent, development needed
    'CAR': 15,  // #21 - Moton solid, but overall struggles
    'DEN': 14,  // #22 - Bolles solid, interior concerns
    'ARI': 13,  // #23 - Humphries decent, most penalized unit
    'CHI': 12,  // #24 - Young tackles developing
    'PIT': 11,  // #25 - Moore struggles, inconsistent unit
    'JAX': 10,  // #26 - Robinson when healthy, overall poor
    'NYJ': 9,   // #27 - Becton injuries, overall struggles
    'HOU': 8,   // #28 - Tunsil solid, interior major issues
    'LV': 7,    // #29 - Miller decent, overall poor protection
    'NYG': 6,   // #30 - Thomas elite, but rest struggled
    'NE': 5,    // #31 - Andrews aging, overall poor
    'SEA': 4    // #32 - Cross/Lucas rookies struggled late
  },

  // Weapons Quality (0-40 points) - Based on 2022 actual performance
  weapons: {
    'CIN': 40,  // Chase/Higgins elite duo led Super Bowl run
    'LAR': 38,  // Kupp historic season, Stafford weapons
    'TB': 37,   // Brady weapons: Evans/Godwin/Gronk when healthy
    'KC': 36,   // Kelce/Hill elite duo before Hill trade
    'MIA': 35,  // Hill/Waddle speed combo after trade
    'BUF': 34,  // Diggs elite, Davis solid, Allen weapons
    'SF': 33,   // Deebo/Kittle/Samuel versatility, CMC added late
    'LV': 32,   // Adams elite after trade, Waller/Renfrow
    'PHI': 31,  // AJ Brown trade elevated unit, Smith development
    'DAL': 30,  // CeeDee breakout, Schultz solid, depth concerns
    'MIN': 29,  // Jefferson elite, Thielen reliable veteran
    'LAC': 28,  // Allen elite, Williams solid, depth questions
    'SEA': 27,  // Metcalf/Lockett proven duo
    'DEN': 26,  // Sutton solid, limited depth after trades
    'GB': 25,   // Adams departure hurt, young receivers developing
    'PIT': 24,  // Johnson/Claypool potential, Najee solid
    'TEN': 23,  // Henry elite runner, WR depth concerns
    'CLE': 22,  // Cooper solid, limited WR depth, Chubb elite
    'IND': 21,  // Pittman emerging, Taylor elite when healthy
    'NO': 20,   // Thomas injury issues, Kamara solid
    'JAX': 19,  // Robinson when healthy, young receivers
    'ARI': 18,  // Hopkins suspended, Ertz addition
    'NYJ': 17,  // Wilson developing, Hall rookie year
    'DET': 16,  // St. Brown emerging, Swift when healthy
    'BAL': 15,  // Andrews elite, Lamar rushing, WR questions
    'WSH': 14,  // McLaurin solid, limited proven depth
    'ATL': 13,  // Pitts/London young duo, development needed
    'CAR': 12,  // CMC elite, but overall limited weapons
    'CHI': 11,  // Mooney only proven option, limited depth
    'HOU': 10,  // Cooks solid, young receivers developing
    'NYG': 9,   // Saquon when healthy, very limited WR depth
    'NE': 8     // Very limited weapons after departures
  },

  // Defense Quality (0-25 points) - Based on 2022 final DVOA rankings  
  defense: {
    'BUF': 25,  // #1 Total DVOA - Elite across all phases
    'SF': 24,   // #2 - Bosa/Warner elite front seven
    'DAL': 23,  // #3 - Parsons/Lawrence pass rush elite
    'PHI': 22,  // #4 - Gardner emerging, solid overall
    'NYJ': 21,  // #5 - Gardner elite, front seven solid
    'BAL': 20,  // #6 - Jackson/Hamilton emerging, front seven
    'DEN': 19,  // #7 - Surtain elite, Wilson/Chubb solid
    'NE': 18,   // #8 - Judon breakout, solid overall system
    'TEN': 17,  // #9 - Simmons elite, limited depth
    'KC': 16,   // #10 - Jones elite, opportunistic unit
    'MIA': 15,  // #11 - Phillips solid, secondary questions
    'TB': 14,   // #12 - White/David veteran leadership
    'MIN': 13,  // #13 - Hunter/Smith solid, overall average
    'CLE': 12,  // #14 - Garrett elite, Ward solid secondary
    'LAC': 11,  // #15 - Bosa/Mack edge duo
    'PIT': 10,  // #16 - Watt elite, limited supporting cast
    'NO': 9,    // #17 - Lattimore solid, overall declining
    'GB': 8,    // #18 - Alexander solid, limited pass rush
    'LV': 7,    // #19 - Crosby elite, limited depth
    'IND': 6,   // #20 - Leonard when healthy, overall poor
    'LAR': 5,   // #21 - Donald elite, but overall struggling
    'CIN': 4,   // #22 - Hendrickson solid, poor overall
    'WSH': 3,   // #23 - Young solid, limited talent
    'CAR': 2,   // #24 - Burns elite, very limited depth
    'CHI': 1,   // #25 - Mack solid, overall poor unit
    'JAX': 15,  // #26 - Allen solid, young unit developing
    'NYG': 14,  // #27 - Thibodeaux rookie, limited talent
    'DET': 13,  // #28 - Hutchinson rookie, rebuilding
    'ATL': 12,  // #29 - Limited talent across board
    'SEA': 11,  // #30 - Wagner departure hurt significantly
    'HOU': 10,  // #31 - Very limited talent, rebuilding
    'ARI': 9    // #32 - Bottom of league talent
  }
};

const calculateWeightedSupportScore = (team, year) => {
  const yearData = year === 2024 ? SUPPORT_DATA_2024 : 
                   year === 2023 ? SUPPORT_DATA_2023 : 
                   SUPPORT_DATA_2022;
  
  const oLine = yearData.offensiveLine[team] || 15;
  const weapons = yearData.weapons[team] || 20;
  const defense = yearData.defense[team] || 12;
  
  // NEW WEIGHTING: Offensive Line 45%, Weapons 45%, Defense 10%
  // Normalize each component to 0-1 scale, then apply weights
  const oLineNormalized = oLine / 35;  // Max offensive line score is 35
  const weaponsNormalized = weapons / 40;  // Max weapons score is 40
  const defenseNormalized = defense / 25;  // Max defense score is 25
  
  // Apply new weights and scale to 100
  const weightedScore = (oLineNormalized * 0.45 + weaponsNormalized * 0.45 + defenseNormalized * 0.10) * 100;
  
  return weightedScore;
};

export const calculateSupportScore = (qbData) => {
  // Handle multi-team QBs - get all teams from their season data
  const currentTeam = qbData.currentTeam || qbData.team;
  let teamsPlayed = [currentTeam];
  
  // Check if QB has seasonData with multiple teams
  if (qbData.seasonData && qbData.seasonData.length > 0) {
    const allTeams = qbData.seasonData.map(season => season.team).filter(team => team);
    teamsPlayed = [...new Set(allTeams)]; // Remove duplicates
  }
  
  // Calculate weighted support score across all years using constants
  let totalWeightedSupport = 0;
  let totalWeight = 0;
  
  // Apply year weights from constants.js
  Object.entries(YEAR_WEIGHTS).forEach(([year, weight]) => {
    const yearNum = parseInt(year);
    const yearSupport = calculateWeightedSupportScore(currentTeam, yearNum);
    totalWeightedSupport += yearSupport * weight;
    totalWeight += weight;
  });
  
  const weightedSupportQuality = totalWeight > 0 ? totalWeightedSupport / totalWeight : 50;
   
  // CORRECT LOGIC: Poor supporting cast = Higher difficulty adjustment score
  // Scale from 0-100 where higher score = more "extra credit" for difficult situation
  // Teams with GOOD support (high weightedSupportQuality) should get LOW scores
  // Teams with POOR support (low weightedSupportQuality) should get HIGH scores
   
  // Calculate max possible support quality (35 + 40 + 25 = 100)
  const maxSupportQuality = 100;
   
  // Invert and scale: excellent support = low score, poor support = high score
  const difficultyAdjustment = Math.max(0, Math.min(100, (maxSupportQuality - weightedSupportQuality) * (100 / maxSupportQuality)));
   
  // Debug for major teams or multi-team QBs
  if (['KC', 'BUF', 'CIN', 'BAL', 'CAR', 'NYG', 'MIN', 'TB'].includes(currentTeam) || teamsPlayed.length > 1) {
    const teamsText = teamsPlayed.length > 1 ? `Teams: ${teamsPlayed.join(', ')}` : `Team: ${currentTeam}`;
    const supportLevel = weightedSupportQuality >= 80 ? 'EXCELLENT' : 
                        weightedSupportQuality >= 60 ? 'GOOD' : 
                        weightedSupportQuality >= 40 ? 'AVERAGE' : 'POOR';
    
    // Show year breakdown
    const breakdown = Object.entries(YEAR_WEIGHTS).map(([year, weight]) => {
      const yearSupport = calculateWeightedSupportScore(currentTeam, parseInt(year));
      return `${year}: ${yearSupport.toFixed(1)} (${(weight * 100).toFixed(0)}%)`;
    }).join(', ');
    
    console.log(`🔍 SUPPORT ${teamsText}: [${breakdown}] -> Weighted(${weightedSupportQuality.toFixed(1)}) - ${supportLevel} -> Difficulty Score(${difficultyAdjustment.toFixed(1)}) [Higher = More Extra Credit for Poor Support]`);
  }
   
  return difficultyAdjustment;
}; 