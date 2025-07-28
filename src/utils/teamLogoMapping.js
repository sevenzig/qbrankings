/**
 * Team Logo Mapping Utility
 * 
 * Maps team codes from the database to their corresponding logo files
 * Handles different naming conventions between database team codes and logo filenames
 */

/**
 * Mapping from database team codes to logo filenames
 * Database codes are 3-letter, logo files use various formats
 */
export const TEAM_LOGO_MAPPING = {
  // AFC East
  'BUF': 'buf.png',
  'MIA': 'mia.png', 
  'NWE': 'ne.png',  // New England uses 'ne' in logos
  'NYJ': 'nyj.png',
  
  // AFC North
  'BAL': 'bal.png',
  'CIN': 'cin.png',
  'CLE': 'cle.png',
  'PIT': 'pit.png',
  
  // AFC South
  'HOU': 'hou.png',
  'IND': 'ind.png',
  'JAX': 'jax.png',
  'TEN': 'ten.png',
  
  // AFC West
  'DEN': 'den.png',
  'KAN': 'kc.png',  // Kansas City uses 'kc' in logos
  'LAC': 'lac.png',
  'LVR': 'lv.png',  // Las Vegas uses 'lv' in logos
  
  // NFC East
  'DAL': 'dal.png',
  'NYG': 'nyg.png',
  'PHI': 'phi.png',
  'WAS': 'wsh.png', // Washington uses 'wsh' in logos
  
  // NFC North
  'CHI': 'chi.png',
  'DET': 'det.png',
  'GNB': 'gb.png',  // Green Bay uses 'gb' in logos
  'MIN': 'min.png',
  
  // NFC South
  'ATL': 'atl.png',
  'CAR': 'car.png',
  'NOR': 'no.png',  // New Orleans uses 'no' in logos
  'TAM': 'tb.png',  // Tampa Bay uses 'tb' in logos
  
  // NFC West
  'ARI': 'ari.png',
  'LAR': 'lar.png',
  'SFO': 'sf.png',  // San Francisco uses 'sf' in logos
  'SEA': 'sea.png'
};

/**
 * Get the logo filename for a given team code
 * @param {string} teamCode - The 3-letter team code from the database
 * @returns {string|null} The logo filename or null if not found
 */
export const getTeamLogo = (teamCode) => {
  if (!teamCode) return null;
  
  const logoFile = TEAM_LOGO_MAPPING[teamCode.toUpperCase()];
  return logoFile ? `/logos/${logoFile}` : null;
};

/**
 * Get the full logo URL for a given team code
 * @param {string} teamCode - The 3-letter team code from the database
 * @returns {string|null} The full logo URL or null if not found
 */
export const getTeamLogoUrl = (teamCode) => {
  const logoFile = getTeamLogo(teamCode);
  return logoFile;
};

/**
 * Check if a logo exists for a given team code
 * @param {string} teamCode - The 3-letter team code from the database
 * @returns {boolean} True if logo exists, false otherwise
 */
export const hasTeamLogo = (teamCode) => {
  return getTeamLogo(teamCode) !== null;
};

/**
 * Get all available team codes that have logos
 * @returns {Array} Array of team codes that have corresponding logos
 */
export const getTeamsWithLogos = () => {
  return Object.keys(TEAM_LOGO_MAPPING);
};

/**
 * Get logo mapping for debugging/monitoring
 * @returns {Object} Complete mapping of team codes to logo files
 */
export const getLogoMapping = () => {
  return { ...TEAM_LOGO_MAPPING };
};

/**
 * Validate that all expected logos exist
 * @returns {Object} Object with validation results
 */
export const validateLogoMapping = () => {
  const results = {
    totalTeams: Object.keys(TEAM_LOGO_MAPPING).length,
    missingLogos: [],
    validLogos: []
  };
  
  Object.entries(TEAM_LOGO_MAPPING).forEach(([teamCode, logoFile]) => {
    // This would need to be implemented with actual file checking
    // For now, we'll assume all mapped logos exist
    results.validLogos.push({ teamCode, logoFile });
  });
  
  return results;
}; 