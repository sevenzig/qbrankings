# Supporting Cast Scoring System Documentation

## Overview
The Supporting Cast Score is a **difficulty adjustment system** that provides extra credit to quarterbacks playing in challenging situations. Unlike other scoring components, this system operates with **inverted logic**: poor supporting cast quality results in higher scores (more extra credit), while excellent supporting cast quality results in lower scores (less extra credit). The maximum possible score is **100 points**.

---

## System Philosophy

### Core Concept
**"Context Matters"** - Quarterback performance should be evaluated relative to the quality of their supporting cast. A QB throwing for 3,000 yards with poor weapons and protection deserves more credit than one throwing for 3,500 yards with elite talent around them.

### Inverted Scoring Logic
```javascript
excellentSupport = LOW score (0-20 points)    // Less extra credit needed
poorSupport = HIGH score (80-100 points)      // More extra credit deserved
```

### Multi-Team QB Handling
For quarterbacks who played for multiple teams, scores are **weighted by games started** with each team to provide accurate contextual evaluation.

---

## Scoring Components Breakdown

### 1. Offensive Line Quality (0-35 points)
**Evaluates pass protection and run blocking effectiveness**

#### Grading Criteria:
- **Pass Block Win Rate (PBWR)**
- **Run Block Win Rate (RBWR)**
- **Sack rate allowed**
- **Pressure rate allowed**
- **Individual talent level**
- **Coaching and scheme effectiveness**

#### Team Grades - Offensive Line:

##### Elite Tier (30-35 points):
| Team | Grade | Key Players/Notes |
|------|-------|------------------|
| **DEN** | 35 | #1 PBWR + RBWR in 2024, elite across board |
| **PHI** | 32 | Elite talent, Mailata/Johnson/Dickerson core |
| **DET** | 31 | Sewell/Ragnow anchors, consistent excellence |
| **TB** | 30 | Wirfs elite, excellent pass protection unit |

##### Very Good Tier (25-29 points):
| Team | Grade | Key Players/Notes |
|------|-------|------------------|
| **BAL** | 29 | Stanley healthy, top RBWR performance |
| **BUF** | 28 | Elite sack rate, clean pocket leader |
| **ATL** | 26 | Lindstrom elite RG, solid overall unit |
| **LAR** | 25 | Strong when healthy, good YBC numbers |

##### Good Tier (20-24 points):
| Team | Grade | Key Players/Notes |
|------|-------|------------------|
| **LAC** | 24 | Slater/Alt excellent bookends, interior improved |
| **CAR** | 23 | Hunt addition major upgrade, solid metrics |
| **MIN** | 22 | Darrisaw return + Kelly/Fries upgrades |
| **CHI** | 21 | Thuney/Jackson/Dalman major FA additions |
| **KC** | 20 | Lost Thuney/interior depth, LT issues |

##### Average Tier (15-19 points):
| Team | Grade | Key Players/Notes |
|------|-------|------------------|
| **ARI** | 19 | Johnson Jr. solid, consistent low pressure rate |
| **GB** | 18 | Tom excellent RT, Banks addition |
| **PIT** | 18 | Young core developing, Frazier/McCormick |
| **IND** | 17 | Lost Kelly/Fries, Nelson/Raimann still solid |
| **SF** | 17 | Williams aging, struggled without him |
| **NYJ** | 16 | Fashanu developing, decent interior trio |
| **LV** | 15 | Miller + Powers-Johnson core, needs depth |

##### Below Average Tier (10-14 points):
| Team | Grade | Key Players/Notes |
|------|-------|------------------|
| **JAX** | 14 | Lost key veterans, average metrics |
| **WAS** | 14 | Tunsil helps but unit needs more talent |
| **TEN** | 13 | Moore/Zeitler upgrades from terrible base |
| **NO** | 12 | Banks first-rounder, still rebuilding |
| **CLE** | 12 | Health/age concerns, inconsistent |
| **CIN** | 11 | Persistent bottom-tier protection |
| **DAL** | 11 | Booker drafted but Guyton/line struggles |
| **MIA** | 10 | Bottom tier run blocking, needs overhaul |
| **NYG** | 10 | Thomas when healthy, rest very poor |

##### Poor Tier (6-9 points):
| Team | Grade | Key Players/Notes |
|------|-------|------------------|
| **SEA** | 9 | Zabel drafted, but major work needed |
| **HOU** | 8 | Traded Tunsil, among worst units |
| **NE** | 6 | Bottom of NFL, Wallace/rookie protection |

### 2. Weapons Quality (0-40 points)
**Evaluates wide receivers, tight ends, and running backs**

#### Grading Criteria:
- **Elite WR1 presence**
- **Receiving depth and quality**
- **Tight end contributions**
- **Running back talent**
- **Overall offensive versatility**
- **Health and availability**

#### Team Grades - Offensive Weapons:

##### Elite Tier (35-40 points):
| Team | Grade | Key Players/Notes |
|------|-------|------------------|
| **CIN** | 38 | Chase elite, Higgins when healthy, solid depth |
| **MIA** | 36 | Hill (1799 yds), Waddle, explosive speed combo |
| **MIN** | 35 | Jefferson elite (1533 yds), Addison solid, Hockenson |

##### Very Good Tier (30-34 points):
| Team | Grade | Key Players/Notes |
|------|-------|------------------|
| **PHI** | 34 | AJ Brown, Smith, Goedert, Barkley elite RB |
| **BUF** | 33 | Cooper trade, Diggs gone but still solid |
| **LAC** | 32 | Allen/Williams/McConkey emerged, depth improved |
| **HOU** | 31 | Diggs trade, Collins/Dell, weapons upgraded |
| **KC** | 30 | Kelce elite TE, Rice (1400+ yds), Worthy speed, Hunt |
| **DET** | 30 | Williams/St. Brown elite, LaPorta, Montgomery/Gibbs |

##### Good Tier (25-29 points):
| Team | Grade | Key Players/Notes |
|------|-------|------------------|
| **DAL** | 29 | CeeDee elite (1749 yds), lacks consistent depth |
| **TB** | 28 | Evans (1004 yds), Godwin injured, Bucky Irving |
| **SF** | 27 | Deebo/Aiyuk solid, Kittle, CMC when healthy |
| **WSH** | 26 | McLaurin solid, Daniels weapons developing |
| **JAX** | 25 | Kirk/Ridley/Thomas decent trio |

##### Average Tier (20-24 points):
| Team | Grade | Key Players/Notes |
|------|-------|------------------|
| **ATL** | 24 | London emerging, Pitts potential, Bijan |
| **BAL** | 23 | Andrews/Flowers, Lamar running ability |
| **LAR** | 23 | Kupp/Puka when healthy, depth concerns |
| **SEA** | 22 | Metcalf (1297 yds), Lockett aging, JSN |
| **ARI** | 21 | Harrison Jr. ROY candidate, Marvin, McBride |
| **NO** | 20 | Olave solid, Kamara, Thomas limited |

##### Below Average Tier (15-19 points):
| Team | Grade | Key Players/Notes |
|------|-------|------------------|
| **LV** | 19 | Adams elite (1243 yds) but limited support |
| **DEN** | 17 | Sutton solid, Jeudy traded, limited depth |
| **GB** | 16 | Watson injured, Dobbs limited, Jacobs added |
| **IND** | 15 | Richardson weapons still developing, limited |

##### Poor Tier (10-14 points):
| Team | Grade | Key Players/Notes |
|------|-------|------------------|
| **TEN** | 14 | Hopkins gone, Ridley/Boyd limited |
| **PIT** | 13 | Pickens solid, TE/depth issues |
| **CHI** | 12 | Moore/Odunze promising but developing |
| **CLE** | 11 | Cooper solid, very limited depth |
| **NYJ** | 10 | Adams trade, Wilson limited, rebuilding |

##### Very Poor Tier (7-9 points):
| Team | Grade | Key Players/Notes |
|------|-------|------------------|
| **NYG** | 9 | Nabers promising rookie, very limited depth |
| **NE** | 8 | Rebuilding receiving corps, limited talent |
| **CAR** | 7 | Rebuilding everything, very limited weapons |

### 3. Defense Quality (0-25 points)
**Evaluates how much the defense helps the quarterback**

#### Impact on QB Performance:
- **Field position advantages**
- **Short fields from turnovers**
- **Time of possession control**
- **Lead protection and game flow**
- **Complementary football effectiveness**

#### Team Grades - Defense:

##### Elite Tier (23-25 points):
| Team | Grade | Key Players/Notes |
|------|-------|------------------|
| **BAL** | 25 | #1 defense, elite pass rush + secondary |
| **BUF** | 24 | Von Miller, elite secondary, great overall |
| **KC** | 23 | Elite takeaways/turnovers, Spagnuolo system |

##### Very Good Tier (20-22 points):
| Team | Grade | Key Players/Notes |
|------|-------|------------------|
| **PIT** | 22 | Watt, Fitzpatrick, consistently strong |
| **SF** | 21 | Elite when healthy, pass rush + secondary |
| **MIA** | 20 | Improved significantly, solid overall |
| **DET** | 20 | Hutchinson emerging, improving overall |

##### Good Tier (17-19 points):
| Team | Grade | Key Players/Notes |
|------|-------|------------------|
| **PHI** | 19 | Talented but inconsistent performance |
| **HOU** | 19 | Young defense improving rapidly |
| **MIN** | 18 | Solid overall, Flores system working |
| **DEN** | 18 | Surtain elite, solid pass rush |
| **TB** | 17 | Bowles system creates opportunities |
| **LAC** | 17 | Bosa elite, Mack/others solid |

##### Average Tier (12-16 points):
| Team | Grade | Key Players/Notes |
|------|-------|------------------|
| **DAL** | 16 | Parsons elite, secondary inconsistent |
| **SEA** | 16 | Williams trade helped, solid overall |
| **CLE** | 15 | Garrett elite, rest struggling |
| **IND** | 15 | Decent overall, helps Richardson |
| **WSH** | 14 | Young defense developing quickly |
| **LAR** | 13 | Donald gone, rebuilding but talent |
| **NO** | 12 | Cap casualties hurt depth |
| **ATL** | 12 | Inconsistent unit, some talent |

##### Below Average Tier (8-11 points):
| Team | Grade | Key Players/Notes |
|------|-------|------------------|
| **JAX** | 11 | Josh Allen solid, limited overall |
| **GB** | 11 | Jaire elite, rest inconsistent |
| **ARI** | 10 | Young players learning, improving |
| **TEN** | 9 | Poor overall unit, few playmakers |
| **NYJ** | 9 | Sauce good, overall unit poor |
| **CHI** | 8 | Young unit learning, limited talent |
| **LV** | 8 | Crosby good, rest struggling |

##### Poor Tier (5-7 points):
| Team | Grade | Key Players/Notes |
|------|-------|------------------|
| **NYG** | 7 | Rebuilding defense, limited talent |
| **CIN** | 6 | Pass rush improved, secondary issues |
| **NE** | 6 | Rebuilding everything, bottom tier |
| **CAR** | 5 | Among worst in league, very limited |

---

## Mathematical Calculation Process

### Step 1: Team Support Quality Calculation
```javascript
teamSupportQuality = offensiveLineGrade + weaponsGrade + defenseGrade
```

**Maximum Possible**: 100 points (35 + 40 + 25)

### Step 2: Multi-Team Weighting (for QBs who changed teams)
```javascript
// Weight by games started with each team
totalSupportQuality = 0;
gamesWeightedSum = 0;

seasonData.forEach(season => {
  const team = season.team;
  const gamesStarted = season.gamesStarted || 1;
  
  const oLineScore = offensiveLineGrades[team] || 15;
  const weaponsScore = weaponsGrades[team] || 20;
  const defenseScore = defenseGrades[team] || 12;
  
  const teamSupportQuality = oLineScore + weaponsScore + defenseScore;
  totalSupportQuality += teamSupportQuality * gamesStarted;
  gamesWeightedSum += gamesStarted;
});

rawSupportQuality = totalSupportQuality / gamesWeightedSum;
```

### Step 3: Difficulty Adjustment (Inverted Scoring)
```javascript
const maxSupportQuality = 100; // 35 + 40 + 25

// Invert the scale: poor support = high score, good support = low score
difficultyAdjustment = max(0, min(100, 
  (maxSupportQuality - rawSupportQuality) * (100 / maxSupportQuality)
));
```

### Step 4: Final Support Score
```javascript
finalSupportScore = difficultyAdjustment; // 0-100 scale
```

---

## Real-World Scoring Examples

### Elite Supporting Cast (Low Support Scores):

#### Example: Kansas City Chiefs QB
- **Offensive Line**: KC = 20 points
- **Weapons**: KC = 30 points  
- **Defense**: KC = 23 points
- **Raw Support Quality**: 73 points
- **Difficulty Adjustment**: (100 - 73) × 1.0 = **27 points**
- **Interpretation**: Excellent support, minimal extra credit needed

#### Example: Philadelphia Eagles QB
- **Offensive Line**: PHI = 32 points
- **Weapons**: PHI = 34 points
- **Defense**: PHI = 19 points  
- **Raw Support Quality**: 85 points
- **Difficulty Adjustment**: (100 - 85) × 1.0 = **15 points**
- **Interpretation**: Elite support, very little extra credit

### Average Supporting Cast (Moderate Support Scores):

#### Example: Green Bay Packers QB
- **Offensive Line**: GB = 18 points
- **Weapons**: GB = 16 points
- **Defense**: GB = 11 points
- **Raw Support Quality**: 45 points
- **Difficulty Adjustment**: (100 - 45) × 1.0 = **55 points**
- **Interpretation**: Average support, moderate extra credit

#### Example: Las Vegas Raiders QB
- **Offensive Line**: LV = 15 points
- **Weapons**: LV = 19 points
- **Defense**: LV = 8 points
- **Raw Support Quality**: 42 points
- **Difficulty Adjustment**: (100 - 42) × 1.0 = **58 points**
- **Interpretation**: Below-average support, moderate extra credit

### Poor Supporting Cast (High Support Scores):

#### Example: New England Patriots QB
- **Offensive Line**: NE = 6 points
- **Weapons**: NE = 8 points
- **Defense**: NE = 6 points
- **Raw Support Quality**: 20 points
- **Difficulty Adjustment**: (100 - 20) × 1.0 = **80 points**
- **Interpretation**: Poor support, significant extra credit

#### Example: Carolina Panthers QB
- **Offensive Line**: CAR = 23 points
- **Weapons**: CAR = 7 points
- **Defense**: CAR = 5 points
- **Raw Support Quality**: 35 points
- **Difficulty Adjustment**: (100 - 35) × 1.0 = **65 points**
- **Interpretation**: Poor overall support, considerable extra credit

### Multi-Team QB Example:

#### QB who played 10 games with Team A, 7 games with Team B:
```javascript
// Team A: 50 total support quality
// Team B: 70 total support quality

weightedSupportQuality = (50 × 10 + 70 × 7) / (10 + 7)
                       = (500 + 490) / 17
                       = 58.2 points

difficultyAdjustment = (100 - 58.2) × 1.0 = 41.8 points
```

---

## Support Quality Tiers and Thresholds

### Quality Classification:
| Raw Support Quality | Support Level | Difficulty Score Range | Extra Credit Level |
|-------------------|---------------|----------------------|-------------------|
| **85-100 points** | EXCELLENT | 0-15 points | Minimal extra credit |
| **70-84 points** | GOOD | 16-30 points | Low extra credit |
| **55-69 points** | AVERAGE | 31-45 points | Moderate extra credit |
| **40-54 points** | BELOW AVERAGE | 46-60 points | Considerable extra credit |
| **25-39 points** | POOR | 61-75 points | High extra credit |
| **0-24 points** | VERY POOR | 76-100 points | Maximum extra credit |

### Critical Thresholds:
- **80+ Raw Support**: Elite supporting cast (minimal extra credit)
- **60-79 Raw Support**: Good supporting cast (low extra credit)  
- **40-59 Raw Support**: Average supporting cast (moderate extra credit)
- **25-39 Raw Support**: Poor supporting cast (high extra credit)
- **<25 Raw Support**: Dire supporting cast (maximum extra credit)

---

## Default Values and Error Handling

### Missing Team Grades:
```javascript
const defaultGrades = {
  offensiveLine: 15,    // League average baseline
  weapons: 20,          // League average baseline  
  defense: 12           // League average baseline
};
```

### Data Validation:
- **Team Abbreviation Matching**: Handles multiple formats (KC/KAN, SF/SFO, etc.)
- **Missing Season Data**: Uses current team if historical data unavailable
- **Games Started**: Defaults to 1 if missing to avoid division by zero

---

## Integration with Overall QEI

### Default Weight in QEI System:
- **Supporting Cast Category Weight**: 5% (in balanced preset)
- **Range**: 0-100 points  
- **Contribution to Final QEI**: Up to 5 points (in default balanced preset)

### Philosophy Preset Weights:
| Preset | Support Weight | Rationale |
|--------|----------------|-----------|
| **Winner** | 0% | Pure results matter, context ignored |
| **Analyst** | 5% | Minimal context consideration |
| **Clutch** | 5% | Focus on performance over situation |
| **Balanced** | 5% | Moderate context weighting |
| **Context** | 15% | Heavy emphasis on situational difficulty |

### Interaction with Other Components:
- **Statistical Performance**: Poor support may excuse lower statistical output
- **Team Success**: Good support should correlate with team wins
- **Clutch Performance**: Difficult situations may create more clutch opportunities
- **Durability**: Poor protection may increase injury risk

---

## System Design Philosophy

### Core Principles:
1. **Contextual Fairness**: Account for varying levels of organizational support
2. **Inverted Logic**: Reward QBs facing greater challenges
3. **Multi-Dimensional Analysis**: Consider all aspects of supporting cast
4. **Weighted Accuracy**: Account for multi-team seasons properly
5. **Conservative Application**: Moderate weight to avoid over-adjustment

### Balance Considerations:
- **Not Excuse-Making**: Poor support explains but doesn't fully excuse poor performance
- **Credit Where Due**: QBs with elite support should be evaluated accordingly
- **Sample Size**: Multi-team QBs get accurate weighted evaluation
- **Temporal Stability**: Team grades reflect current roster construction

### Maximum Score Distribution:
- **Offensive Line**: 35% of raw support quality (35/100)
- **Weapons**: 40% of raw support quality (40/100)  
- **Defense**: 25% of raw support quality (25/100)

The supporting cast scoring system provides crucial context for quarterback evaluation, ensuring that performance is assessed relative to the quality of surrounding talent and organizational support structure. 