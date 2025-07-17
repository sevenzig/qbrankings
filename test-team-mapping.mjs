/**
 * Simple Team Mapping Test
 * Verifies that all team abbreviations map correctly
 */

// Import the team data (using ES modules)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the team data file
const teamDataPath = path.join(__dirname, 'src', 'constants', 'teamData.js');
const teamDataContent = fs.readFileSync(teamDataPath, 'utf8');

// Extract TEAM_MAP using regex (simple approach)
const teamMapMatch = teamDataContent.match(/export const TEAM_MAP = ({[\s\S]*?});/);
if (!teamMapMatch) {
  console.error('❌ Could not find TEAM_MAP in teamData.js');
  process.exit(1);
}

// Parse the TEAM_MAP (simplified approach)
const teamMapStr = teamMapMatch[1];
// Updated regex to capture both 2-3 letter abbreviations and special cases like '2TM'
const teamEntries = teamMapStr.match(/'([A-Z0-9]{2,3})':\s*{[^}]*}/g);

if (!teamEntries) {
  console.error('❌ Could not parse team entries');
  process.exit(1);
}

// Extract team abbreviations
const coveredAbbrs = teamEntries.map(entry => {
  const match = entry.match(/'([A-Z0-9]{2,3})'/);
  return match ? match[1] : null;
}).filter(Boolean);

console.log('🧪 Team Mapping Coverage Test\n');

// Expected abbreviations (both 2-letter and 3-letter)
const expectedAbbrs = [
  // 2-letter abbreviations
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LV', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WSH',
  // 3-letter PFR abbreviations
  'GNB', 'KAN', 'LVR', 'NWE', 'NOR', 'SFO', 'TAM', 'WAS',
  // Special cases
  '2TM'
];

console.log(`📊 Expected abbreviations: ${expectedAbbrs.length}`);
console.log(`📊 Covered abbreviations: ${coveredAbbrs.length}`);

// Check for missing abbreviations
const missing = expectedAbbrs.filter(abbr => !coveredAbbrs.includes(abbr));
const extra = coveredAbbrs.filter(abbr => !expectedAbbrs.includes(abbr));

if (missing.length > 0) {
  console.log(`\n❌ Missing abbreviations: ${missing.join(', ')}`);
}

if (extra.length > 0) {
  console.log(`\n⚠️  Extra abbreviations: ${extra.join(', ')}`);
}

if (missing.length === 0 && extra.length === 0) {
  console.log('\n✅ All expected team abbreviations are covered!');
  console.log('🎉 Team mapping is complete and ready to use.');
} else {
  console.log('\n⚠️  Team mapping needs attention.');
}

// Check if logo files exist
console.log('\n🔍 Checking logo files...');
const logosDir = path.join(__dirname, 'public', 'logos');
const logoFiles = fs.readdirSync(logosDir).filter(file => file.endsWith('.png'));

console.log(`📁 Logo files found: ${logoFiles.length}/32`);

if (logoFiles.length === 32) {
  console.log('✅ All team logos are present!');
} else {
  console.log('⚠️  Some logo files are missing. Run: npm run download-logos');
}

console.log('\n📋 Summary:');
console.log(`- Team abbreviations: ${missing.length === 0 ? '✅ Complete' : '❌ Incomplete'}`);
console.log(`- Logo files: ${logoFiles.length === 32 ? '✅ Complete' : '❌ Incomplete'}`);
console.log(`- ESPN API dependency: ❌ Removed (using local logos)`); 