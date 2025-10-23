// Data transformation utilities for converting Supabase data to application format
// This ensures compatibility with existing QB calculations

/**
 * Transform Supabase season summary data to match application format
 * @param {Array} supabaseData - Data from qb_season_summary view
 * @returns {Array} Transformed data matching application format
 */
export const transformSeasonSummaryToCSV = (supabaseData) => {
  if (!Array.isArray(supabaseData)) {
    console.warn('Invalid data format for transformation');
    return [];
  }

  return supabaseData.map(record => ({
    // Basic player info
    Player: record.player_name,
    Team: record.team,
    Age: record.age,
    Pos: 'QB',
    
    // Games
    G: record.games,
    GS: record.games_started,
    
    // Record
    QBrec: record.qb_rec || `${record.wins || 0}-${record.losses || 0}-0`,
    
    // Passing stats
    Cmp: record.completions,
    Att: record.attempts,
    'Cmp%': record.completion_pct,
    Yds: record.pass_yards,
    TD: record.pass_tds,
    'TD%': record.td_pct || 0,
    Int: record.interceptions,
    'Int%': record.int_pct || 0,
    '1D': record.first_downs || 0,
    'Succ%': record.success_pct || 0,
    Lng: record.long || 0,
    'Y/A': record.yards_per_attempt || 0,
    'AY/A': record.adjusted_yards_per_attempt || 0,
    'Y/C': record.yards_per_completion || 0,
    'Y/G': record.yards_per_game || 0,
    Rate: record.passer_rating,
    QBR: record.qbr || 0,
    
    // Sacks
    Sk: record.sacks || 0,
    'Sk%': record.sack_pct || 0,
    'NY/A': record.net_yards_per_attempt || 0,
    'ANY/A': record.adjusted_net_yards_per_attempt || 0,
    
    // Clutch stats
    '4QC': record.fourth_quarter_comebacks || 0,
    GWD: record.game_winning_drives || 0,
    
    // Awards
    Awards: record.awards || '',
    
    // Metadata
    season: record.season,
    pfr_id: record.pfr_id,
    
    // Rushing stats (now comes directly from merged Supabase data)
    RushingAtt: record.rush_att || 0,
    RushingYds: record.rush_yds || 0,
    RushingTDs: record.rush_td || 0,
    RushingYPA: record.rush_att > 0 ? (record.rush_yds / record.rush_att).toFixed(2) : 0,
    
    // Fumbles (now comes directly from merged Supabase data)
    Fumbles: record.fumbles || 0,
    FumblesLost: record.fumbles_lost || 0,
    
    // Additional fields for compatibility
    'Player-additional': record.player_additional || '',
    Rk: record.rk || 0
  }));
};

/**
 * Transform detailed player data to application format
 * @param {Object} detailedData - Data from fetchPlayerDetailedData
 * @returns {Object} Transformed data matching application format
 */
export const transformDetailedDataToCSV = (detailedData) => {
  if (!detailedData || !detailedData.passing_stats) {
    console.warn('Invalid detailed data format for transformation');
    return null;
  }

  const passing = detailedData.passing_stats;
  const player = detailedData.player || {};
  
  // Transform passing stats
  const transformed = {
    // Basic info
    Player: passing.player_name,
    Team: passing.team,
    Age: passing.age,
    Pos: passing.pos || 'QB',
    
    // Games
    G: passing.g,
    GS: passing.gs,
    
    // Record
    QBrec: passing.qb_rec,
    
    // Passing stats
    Cmp: passing.cmp,
    Att: passing.att,
    'Cmp%': passing.cmp_pct,
    Yds: passing.yds,
    TD: passing.td,
    'TD%': passing.td_pct,
    Int: passing.int,
    'Int%': passing.int_pct,
    '1D': passing.first_downs,
    'Succ%': passing.succ_pct,
    Lng: passing.lng,
    'Y/A': passing.y_a,
    'AY/A': passing.ay_a,
    'Y/C': passing.y_c,
    'Y/G': passing.y_g,
    Rate: passing.rate,
    QBR: passing.qbr,
    
    // Sacks
    Sk: passing.sk,
    'Sk%': passing.sk_pct,
    'NY/A': passing.ny_a,
    'ANY/A': passing.any_a,
    
    // Clutch stats
    '4QC': passing.four_qc,
    GWD: passing.gwd,
    
    // Awards
    Awards: passing.awards,
    
    // Metadata
    season: passing.season,
    pfr_id: passing.pfr_id,
    
    // Player info
    player_url: passing.player_url,
    'Player-additional': passing.player_additional,
    Rk: passing.rk
  };

  // Add rushing data (now comes directly from merged Supabase data)
  transformed.RushingAtt = passing.rush_att || 0;
  transformed.RushingYds = passing.rush_yds || 0;
  transformed.RushingTDs = passing.rush_td || 0;
  transformed.RushingYPA = passing.rush_att > 0 ? (passing.rush_yds / passing.rush_att).toFixed(2) : 0;
  transformed.Fumbles = passing.fumbles || 0;
  transformed.FumblesLost = passing.fumbles_lost || 0;

  return transformed;
};

/**
 * Transform splits data to a usable format
 * @param {Array} splitsData - Data from splits tables
 * @returns {Object} Organized splits data
 */
export const transformSplitsData = (splitsData) => {
  if (!Array.isArray(splitsData)) {
    return {};
  }

  const organized = {};
  
  splitsData.forEach(split => {
    if (!organized[split.split]) {
      organized[split.split] = {};
    }
    organized[split.split][split.value] = split;
  });

  return organized;
};

/**
 * Get season data in the format expected by QB calculations
 * @param {Array} supabaseData - Data from season summary
 * @returns {Array} Season data in expected format
 */
export const getSeasonDataForCalculations = (supabaseData) => {
  return supabaseData.map(record => ({
    year: record.season,
    team: record.team,
    gamesStarted: record.games_started,
    wins: record.wins || 0,
    losses: record.losses || 0,
    attempts: record.attempts,
    completions: record.completions,
    passingYards: record.pass_yards,
    passingTDs: record.pass_tds,
    interceptions: record.interceptions,
    sacks: record.sacks || 0,
    passerRating: record.passer_rating,
    anyPerAttempt: record.adjusted_net_yards_per_attempt,
    successRate: record.success_pct,
    sackPercentage: record.sack_pct,
    gameWinningDrives: record.game_winning_drives || 0,
    fourthQuarterComebacks: record.fourth_quarter_comebacks || 0,
    rushingYards: record.rush_yds || 0,
    rushingTDs: record.rush_td || 0,
    fumbles: record.fmb || 0,
    age: record.age,
    // Initialize empty arrays for multi-team tracking (populated in dataProcessor)
    teamsPlayed: [],
    gamesStartedPerTeam: []
  }));
};

/**
 * Validate data structure matches expected format
 * @param {Array} data - Data to validate
 * @returns {boolean} Whether data is valid
 */
export const validateDataStructure = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }

  const requiredFields = ['player_name', 'season', 'team', 'passer_rating'];
  const firstRecord = data[0];

  return requiredFields.every(field => firstRecord.hasOwnProperty(field));
};

/**
 * Log data transformation statistics
 * @param {Array} originalData - Original Supabase data
 * @param {Array} transformedData - Transformed data
 */
export const logTransformationStats = (originalData, transformedData) => {
  console.log('📊 Data Transformation Stats:');
  console.log(`  Original records: ${originalData.length}`);
  console.log(`  Transformed records: ${transformedData.length}`);
  console.log(`  Success rate: ${((transformedData.length / originalData.length) * 100).toFixed(1)}%`);
  
  if (transformedData.length > 0) {
    const sample = transformedData[0];
    console.log('  Sample transformed record:', {
      Player: sample.Player,
      Team: sample.Team,
      Season: sample.season,
      Rating: sample.Rate
    });
  }
}; 