/**
 * Splits Mapping Utility
 * 
 * Provides comprehensive mapping of split values to their proper categories
 * based on the actual split types available in the database
 */

/**
 * Comprehensive mapping of split values to their categories
 * This maps the actual values found in the database to their proper split types
 */
export const SPLITS_MAPPING = {
  // League splits
  'NFL': 'League',
  
  // Place splits
  'Home': 'Place',
  'Road': 'Place',
  
  // Result splits
  'Win': 'Result',
  'Loss': 'Result',
  
  // Final Margin splits
  '0-7 points': 'Final Margin',
  '8-14 points': 'Final Margin',
  '15+ points': 'Final Margin',
  
  // Month splits
  'September': 'Month',
  'October': 'Month',
  'November': 'Month',
  'December': 'Month',
  'January': 'Month',
  
  // Game Number splits
  '1-4': 'Game Number',
  '5-8': 'Game Number',
  '9-12': 'Game Number',
  '13+': 'Game Number',
  
  // Day splits
  'Sunday': 'Day',
  'Monday': 'Day',
  'Thursday': 'Day',
  'Saturday': 'Day',
  
  // Time splits
  'Early': 'Time',
  'Afternoon': 'Time',
  'Late': 'Time',
  
  // Conference splits
  'AFC': 'Conference',
  'NFC': 'Conference',
  
  // Division splits
  'AFC East': 'Division',
  'AFC North': 'Division',
  'AFC South': 'Division',
  'AFC West': 'Division',
  'NFC East': 'Division',
  'NFC South': 'Division',
  'NFC North': 'Division',
  'NFC West': 'Division',
  
  // Opponent splits (all team names)
  'Baltimore Ravens': 'Opponent',
  'Carolina Panthers': 'Opponent',
  'Cleveland Browns': 'Opponent',
  'Dallas Cowboys': 'Opponent',
  'Denver Broncos': 'Opponent',
  'Kansas City Chiefs': 'Opponent',
  'Las Vegas Raiders': 'Opponent',
  'New England Patriots': 'Opponent',
  'New York Giants': 'Opponent',
  'Philadelphia Eagles': 'Opponent',
  'Pittsburgh Steelers': 'Opponent',
  'Los Angeles Chargers': 'Opponent',
  'Tennessee Titans': 'Opponent',
  'Washington Commanders': 'Opponent',
  'Arizona Cardinals': 'Opponent',
  'Atlanta Falcons': 'Opponent',
  'Buffalo Bills': 'Opponent',
  'Chicago Bears': 'Opponent',
  'Cincinnati Bengals': 'Opponent',
  'Detroit Lions': 'Opponent',
  'Green Bay Packers': 'Opponent',
  'Houston Texans': 'Opponent',
  'Indianapolis Colts': 'Opponent',
  'Jacksonville Jaguars': 'Opponent',
  'Los Angeles Rams': 'Opponent',
  'Miami Dolphins': 'Opponent',
  'Minnesota Vikings': 'Opponent',
  'New Orleans Saints': 'Opponent',
  'New York Jets': 'Opponent',
  'San Francisco 49ers': 'Opponent',
  'Seattle Seahawks': 'Opponent',
  'Tampa Bay Buccaneers': 'Opponent',
  
  // Stadium splits
  'dome': 'Stadium',
  'outdoors': 'Stadium',
  'retroof': 'Stadium',
  
  // QB Start splits
  'Starter': 'QB Start',
  
  // Down splits
  '1st': 'Down',
  '2nd': 'Down',
  '3rd': 'Down',
  '4th': 'Down',
  
  // Yards To Go splits
  '1-3': 'Yards To Go',
  '4-6': 'Yards To Go',
  '7-9': 'Yards To Go',
  '10+': 'Yards To Go',
  
  // Down & Yards to Go splits
  '1st & 10': 'Down & Yards to Go',
  '1st & <10': 'Down & Yards to Go',
  '1st & >10': 'Down & Yards to Go',
  '2nd & 1-3': 'Down & Yards to Go',
  '2nd & 4-6': 'Down & Yards to Go',
  '2nd & 7-9': 'Down & Yards to Go',
  '2nd & 10+': 'Down & Yards to Go',
  '3rd & 1-3': 'Down & Yards to Go',
  '3rd & 4-6': 'Down & Yards to Go',
  '3rd & 7-9': 'Down & Yards to Go',
  '3rd & 10+': 'Down & Yards to Go',
  '4th & 1-3': 'Down & Yards to Go',
  '4th & 4-6': 'Down & Yards to Go',
  '4th & 10+': 'Down & Yards to Go',
  
  // Field Position splits
  'Own 1-10': 'Field Position',
  'Own 1-20': 'Field Position',
  'Own 21-50': 'Field Position',
  'Opp 49-20': 'Field Position',
  'Red Zone': 'Field Position',
  'Opp 1-10': 'Field Position',
  
  // Score Differential splits
  'Leading': 'Score Differential',
  'Tied': 'Score Differential',
  'Trailing': 'Score Differential',
  
  // Quarter splits
  '1st Qtr': 'Quarter',
  '2nd Qtr': 'Quarter',
  '3rd Qtr': 'Quarter',
  '4th Qtr': 'Quarter',
  'OT': 'Quarter',
  '1st Half': 'Quarter',
  '2nd Half': 'Quarter',
  
  // Game Situation splits
  'Leading, < 2 min to go': 'Game Situation',
  'Leading, < 4 min to go': 'Game Situation',
  'Tied, < 2 min to go': 'Game Situation',
  'Tied, < 4 min to go': 'Game Situation',
  'Trailing, < 2 min to go': 'Game Situation',
  'Trailing, < 4 min to go': 'Game Situation',
  
  // Snap Type & Huddle splits
  'Huddle': 'Snap Type & Huddle',
  'No Huddle': 'Snap Type & Huddle',
  'Shotgun': 'Snap Type & Huddle',
  'Under Center': 'Snap Type & Huddle',
  
  // Play Action splits
  'play action': 'Play Action',
  'non-play action': 'Play Action',
  
  // Run/Pass Option splits
  'rpo': 'Run/Pass Option',
  'non-rpo': 'Run/Pass Option',
  
  // Time in Pocket splits
  '< 2.5 seconds': 'Time in Pocket',
  '2.5+ seconds': 'Time in Pocket'
};

/**
 * Get the proper split type for a given split value
 * @param {string} splitValue - The split value to categorize
 * @returns {string} The proper split type category
 */
export const getSplitTypeForValue = (splitValue) => {
  if (!splitValue) return 'other';
  
  // Direct mapping lookup
  const mappedType = SPLITS_MAPPING[splitValue];
  if (mappedType) {
    return mappedType;
  }
  
  // Fallback pattern matching for common variations
  const lowerValue = splitValue.toLowerCase();
  
  // Down patterns
  if (lowerValue.includes('1st') || lowerValue.includes('2nd') || 
      lowerValue.includes('3rd') || lowerValue.includes('4th')) {
    if (lowerValue.includes('&') || lowerValue.includes('yards')) {
      return 'Down & Yards to Go';
    }
    return 'Down';
  }
  
  // Quarter patterns
  if (lowerValue.includes('qtr') || lowerValue.includes('quarter') || 
      lowerValue.includes('half') || lowerValue === 'ot') {
    return 'Quarter';
  }
  
  // Place patterns
  if (lowerValue.includes('home') || lowerValue.includes('road') || 
      lowerValue.includes('away')) {
    return 'Place';
  }
  
  // Result patterns
  if (lowerValue.includes('win') || lowerValue.includes('loss')) {
    return 'Result';
  }
  
  // Time patterns
  if (lowerValue.includes('early') || lowerValue.includes('afternoon') || 
      lowerValue.includes('late') || lowerValue.includes('night')) {
    return 'Time';
  }
  
  // Conference patterns
  if (lowerValue.includes('afc') || lowerValue.includes('nfc')) {
    return 'Conference';
  }
  
  // Division patterns
  if (lowerValue.includes('division') || lowerValue.includes('east') || 
      lowerValue.includes('west') || lowerValue.includes('north') || 
      lowerValue.includes('south')) {
    return 'Division';
  }
  
  // Stadium patterns
  if (lowerValue.includes('dome') || lowerValue.includes('outdoor') || 
      lowerValue.includes('retroof')) {
    return 'Stadium';
  }
  
  // Field position patterns
  if (lowerValue.includes('red zone') || lowerValue.includes('own') || 
      lowerValue.includes('opp') || lowerValue.includes('field')) {
    return 'Field Position';
  }
  
  // Score differential patterns
  if (lowerValue.includes('leading') || lowerValue.includes('trailing') || 
      lowerValue.includes('tied')) {
    return 'Score Differential';
  }
  
  // Game situation patterns
  if (lowerValue.includes('min to go') || lowerValue.includes('situation')) {
    return 'Game Situation';
  }
  
  // Snap type patterns
  if (lowerValue.includes('huddle') || lowerValue.includes('shotgun') || 
      lowerValue.includes('under center')) {
    return 'Snap Type & Huddle';
  }
  
  // Play action patterns
  if (lowerValue.includes('play action')) {
    return 'Play Action';
  }
  
  // RPO patterns
  if (lowerValue.includes('rpo')) {
    return 'Run/Pass Option';
  }
  
  // Time in pocket patterns
  if (lowerValue.includes('seconds') || lowerValue.includes('pocket')) {
    return 'Time in Pocket';
  }
  
  // Default fallback
  return 'other';
};

/**
 * Get all available split types with their values organized by category
 * @param {Array} rawSplitsData - Raw splits data from the database
 * @returns {Object} Organized splits data by category
 */
export const organizeSplitsByCategory = (rawSplitsData) => {
  if (!Array.isArray(rawSplitsData)) {
    return {};
  }
  
  const organized = {};
  
  rawSplitsData.forEach(record => {
    if (!record.split || !record.value) return;
    
    const splitType = getSplitTypeForValue(record.value);
    
    if (!organized[splitType]) {
      organized[splitType] = { values: new Set(), table: record.table_source || 'unknown' };
    }
    
    organized[splitType].values.add(record.value);
  });
  
  // Convert Sets to arrays and add metadata
  const result = {};
  Object.entries(organized).forEach(([splitType, data]) => {
    result[splitType] = {
      values: Array.from(data.values).sort(),
      table: data.table,
      count: data.values.size
    };
  });
  
  return result;
};

/**
 * Get popular splits for quick access
 * @returns {Array} Array of popular split configurations
 */
export const getPopularSplits = () => {
  return [
    {
      description: '3rd Down & Short (1-3 yards)',
      split: 'Down & Yards to Go',
      value: '3rd & 1-3',
      category: 'Situational'
    },
    {
      description: 'Red Zone Performance',
      split: 'Field Position',
      value: 'Red Zone',
      category: 'Situational'
    },
    {
      description: '4th Quarter Performance',
      split: 'Quarter',
      value: '4th Qtr',
      category: 'Time-based'
    },
    {
      description: 'Home vs Road',
      split: 'Place',
      value: 'Home',
      category: 'Location'
    },
    {
      description: 'Win vs Loss Situations',
      split: 'Result',
      value: 'Win',
      category: 'Outcome'
    },
    {
      description: '3rd Down Performance',
      split: 'Down',
      value: '3rd',
      category: 'Situational'
    },
    {
      description: 'Shotgun Formation',
      split: 'Snap Type & Huddle',
      value: 'Shotgun',
      category: 'Formation'
    },
    {
      description: 'Play Action Passes',
      split: 'Play Action',
      value: 'play action',
      category: 'Play Type'
    },
    {
      description: 'Leading in Close Games',
      split: 'Game Situation',
      value: 'Leading, < 2 min to go',
      category: 'Clutch'
    },
    {
      description: 'Quick Release (< 2.5s)',
      split: 'Time in Pocket',
      value: '< 2.5 seconds',
      category: 'Timing'
    }
  ];
};

/**
 * Get split type descriptions for better UI display
 * @returns {Object} Mapping of split types to descriptions
 */
export const getSplitTypeDescriptions = () => {
  return {
    'League': 'League-wide statistics',
    'Place': 'Home vs Road performance',
    'Result': 'Win vs Loss situations',
    'Final Margin': 'Game margin categories',
    'Month': 'Performance by month',
    'Game Number': 'Performance by game number',
    'Day': 'Performance by day of week',
    'Time': 'Performance by game time',
    'Conference': 'AFC vs NFC performance',
    'Division': 'Performance by division',
    'Opponent': 'Performance vs specific teams',
    'Stadium': 'Performance by stadium type',
    'QB Start': 'Starting QB statistics',
    'Down': 'Performance by down',
    'Yards To Go': 'Performance by distance needed',
    'Down & Yards to Go': 'Combined down and distance',
    'Field Position': 'Performance by field position',
    'Score Differential': 'Performance when leading/trailing',
    'Quarter': 'Performance by quarter',
    'Game Situation': 'Performance in specific game situations',
    'Snap Type & Huddle': 'Performance by formation type',
    'Play Action': 'Play action vs non-play action',
    'Run/Pass Option': 'RPO vs non-RPO plays',
    'Time in Pocket': 'Performance by time in pocket',
    'other': 'Other split categories'
  };
}; 