/**
 * Team Mapping Test Utility
 * Verifies that all team abbreviations (2-letter and 3-letter) map correctly
 */

import { TEAM_MAP, getTeamInfo } from '../constants/teamData.js';

// Test cases for both 2-letter and 3-letter abbreviations
const testCases = [
  // 2-letter abbreviations
  { abbr: 'ARI', expectedName: 'Arizona Cardinals', expectedLogo: '/logos/ari.png' },
  { abbr: 'ATL', expectedName: 'Atlanta Falcons', expectedLogo: '/logos/atl.png' },
  { abbr: 'BAL', expectedName: 'Baltimore Ravens', expectedLogo: '/logos/bal.png' },
  { abbr: 'BUF', expectedName: 'Buffalo Bills', expectedLogo: '/logos/buf.png' },
  { abbr: 'CAR', expectedName: 'Carolina Panthers', expectedLogo: '/logos/car.png' },
  { abbr: 'CHI', expectedName: 'Chicago Bears', expectedLogo: '/logos/chi.png' },
  { abbr: 'CIN', expectedName: 'Cincinnati Bengals', expectedLogo: '/logos/cin.png' },
  { abbr: 'CLE', expectedName: 'Cleveland Browns', expectedLogo: '/logos/cle.png' },
  { abbr: 'DAL', expectedName: 'Dallas Cowboys', expectedLogo: '/logos/dal.png' },
  { abbr: 'DEN', expectedName: 'Denver Broncos', expectedLogo: '/logos/den.png' },
  { abbr: 'DET', expectedName: 'Detroit Lions', expectedLogo: '/logos/det.png' },
  { abbr: 'GB', expectedName: 'Green Bay Packers', expectedLogo: '/logos/gb.png' },
  { abbr: 'HOU', expectedName: 'Houston Texans', expectedLogo: '/logos/hou.png' },
  { abbr: 'IND', expectedName: 'Indianapolis Colts', expectedLogo: '/logos/ind.png' },
  { abbr: 'JAX', expectedName: 'Jacksonville Jaguars', expectedLogo: '/logos/jax.png' },
  { abbr: 'KC', expectedName: 'Kansas City Chiefs', expectedLogo: '/logos/kc.png' },
  { abbr: 'LV', expectedName: 'Las Vegas Raiders', expectedLogo: '/logos/lv.png' },
  { abbr: 'LAC', expectedName: 'Los Angeles Chargers', expectedLogo: '/logos/lac.png' },
  { abbr: 'LAR', expectedName: 'Los Angeles Rams', expectedLogo: '/logos/lar.png' },
  { abbr: 'MIA', expectedName: 'Miami Dolphins', expectedLogo: '/logos/mia.png' },
  { abbr: 'MIN', expectedName: 'Minnesota Vikings', expectedLogo: '/logos/min.png' },
  { abbr: 'NE', expectedName: 'New England Patriots', expectedLogo: '/logos/ne.png' },
  { abbr: 'NO', expectedName: 'New Orleans Saints', expectedLogo: '/logos/no.png' },
  { abbr: 'NYG', expectedName: 'New York Giants', expectedLogo: '/logos/nyg.png' },
  { abbr: 'NYJ', expectedName: 'New York Jets', expectedLogo: '/logos/nyj.png' },
  { abbr: 'PHI', expectedName: 'Philadelphia Eagles', expectedLogo: '/logos/phi.png' },
  { abbr: 'PIT', expectedName: 'Pittsburgh Steelers', expectedLogo: '/logos/pit.png' },
  { abbr: 'SF', expectedName: 'San Francisco 49ers', expectedLogo: '/logos/sf.png' },
  { abbr: 'SEA', expectedName: 'Seattle Seahawks', expectedLogo: '/logos/sea.png' },
  { abbr: 'TB', expectedName: 'Tampa Bay Buccaneers', expectedLogo: '/logos/tb.png' },
  { abbr: 'TEN', expectedName: 'Tennessee Titans', expectedLogo: '/logos/ten.png' },
  { abbr: 'WSH', expectedName: 'Washington Commanders', expectedLogo: '/logos/wsh.png' },
  
  // 3-letter PFR abbreviations
  { abbr: 'GNB', expectedName: 'Green Bay Packers', expectedLogo: '/logos/gb.png' },
  { abbr: 'KAN', expectedName: 'Kansas City Chiefs', expectedLogo: '/logos/kc.png' },
  { abbr: 'LVR', expectedName: 'Las Vegas Raiders', expectedLogo: '/logos/lv.png' },
  { abbr: 'NWE', expectedName: 'New England Patriots', expectedLogo: '/logos/ne.png' },
  { abbr: 'NOR', expectedName: 'New Orleans Saints', expectedLogo: '/logos/no.png' },
  { abbr: 'SFO', expectedName: 'San Francisco 49ers', expectedLogo: '/logos/sf.png' },
  { abbr: 'TAM', expectedName: 'Tampa Bay Buccaneers', expectedLogo: '/logos/tb.png' },
  { abbr: 'WAS', expectedName: 'Washington Commanders', expectedLogo: '/logos/wsh.png' },
  
  // Special cases
  { abbr: '2TM', expectedName: 'Multiple Teams', expectedLogo: '' }
];

/**
 * Test the team mapping functionality
 */
export const testTeamMapping = () => {
  console.log('🧪 Testing Team Mapping...\n');
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(({ abbr, expectedName, expectedLogo }) => {
    const result = getTeamInfo(abbr);
    
    const nameMatch = result.name === expectedName;
    const logoMatch = result.logo === expectedLogo;
    
    if (nameMatch && logoMatch) {
      console.log(`✅ ${abbr} → ${result.name} (${result.logo})`);
      passed++;
    } else {
      console.log(`❌ ${abbr} → Expected: ${expectedName} (${expectedLogo}), Got: ${result.name} (${result.logo})`);
      failed++;
    }
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All team mapping tests passed!');
  } else {
    console.log('⚠️  Some team mapping tests failed. Check the mapping in teamData.js');
  }
  
  return { passed, failed, total: testCases.length };
};

/**
 * Verify that all expected team abbreviations are covered
 */
export const verifyCoverage = () => {
  console.log('\n🔍 Verifying Team Coverage...\n');
  
  const coveredAbbrs = Object.keys(TEAM_MAP);
  const testAbbrs = testCases.map(tc => tc.abbr);
  
  const missing = testAbbrs.filter(abbr => !coveredAbbrs.includes(abbr));
  const extra = coveredAbbrs.filter(abbr => !testAbbrs.includes(abbr));
  
  if (missing.length > 0) {
    console.log(`❌ Missing abbreviations: ${missing.join(', ')}`);
  }
  
  if (extra.length > 0) {
    console.log(`⚠️  Extra abbreviations: ${extra.join(', ')}`);
  }
  
  if (missing.length === 0 && extra.length === 0) {
    console.log('✅ All test abbreviations are covered in TEAM_MAP');
  }
  
  return { missing, extra, totalCovered: coveredAbbrs.length };
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testTeamMapping();
  verifyCoverage();
} 