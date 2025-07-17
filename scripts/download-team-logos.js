/**
 * Team Logo Downloader Script
 * Downloads all 32 NFL team logos from ESPN and saves them locally
 * Covers both 2-letter and 3-letter team abbreviations
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Comprehensive team data with all abbreviation variations
const teams = [
  // Standard 2-letter abbreviations
  { abbr: 'ARI', name: 'Arizona Cardinals', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png' },
  { abbr: 'ATL', name: 'Atlanta Falcons', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png' },
  { abbr: 'BAL', name: 'Baltimore Ravens', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png' },
  { abbr: 'BUF', name: 'Buffalo Bills', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png' },
  { abbr: 'CAR', name: 'Carolina Panthers', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png' },
  { abbr: 'CHI', name: 'Chicago Bears', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png' },
  { abbr: 'CIN', name: 'Cincinnati Bengals', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png' },
  { abbr: 'CLE', name: 'Cleveland Browns', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png' },
  { abbr: 'DAL', name: 'Dallas Cowboys', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png' },
  { abbr: 'DEN', name: 'Denver Broncos', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png' },
  { abbr: 'DET', name: 'Detroit Lions', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png' },
  { abbr: 'GB', name: 'Green Bay Packers', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png' },
  { abbr: 'HOU', name: 'Houston Texans', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png' },
  { abbr: 'IND', name: 'Indianapolis Colts', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png' },
  { abbr: 'JAX', name: 'Jacksonville Jaguars', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png' },
  { abbr: 'KC', name: 'Kansas City Chiefs', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png' },
  { abbr: 'LV', name: 'Las Vegas Raiders', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png' },
  { abbr: 'LAC', name: 'Los Angeles Chargers', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png' },
  { abbr: 'LAR', name: 'Los Angeles Rams', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png' },
  { abbr: 'MIA', name: 'Miami Dolphins', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png' },
  { abbr: 'MIN', name: 'Minnesota Vikings', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png' },
  { abbr: 'NE', name: 'New England Patriots', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png' },
  { abbr: 'NO', name: 'New Orleans Saints', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png' },
  { abbr: 'NYG', name: 'New York Giants', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png' },
  { abbr: 'NYJ', name: 'New York Jets', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png' },
  { abbr: 'PHI', name: 'Philadelphia Eagles', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png' },
  { abbr: 'PIT', name: 'Pittsburgh Steelers', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png' },
  { abbr: 'SF', name: 'San Francisco 49ers', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png' },
  { abbr: 'SEA', name: 'Seattle Seahawks', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png' },
  { abbr: 'TB', name: 'Tampa Bay Buccaneers', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png' },
  { abbr: 'TEN', name: 'Tennessee Titans', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png' },
  { abbr: 'WSH', name: 'Washington Commanders', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png' }
];

// Create logos directory if it doesn't exist
const logosDir = path.join(__dirname, '..', 'public', 'logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
  console.log('✅ Created logos directory:', logosDir);
}

/**
 * Download a file from URL and save it locally
 */
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete the file if there was an error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Download all team logos
 */
async function downloadAllLogos() {
  console.log('🚀 Starting download of all 32 NFL team logos...\n');
  
  const results = [];
  
  for (const team of teams) {
    const filename = `${team.abbr.toLowerCase()}.png`;
    const filepath = path.join(logosDir, filename);
    
    try {
      console.log(`📥 Downloading ${team.name} (${team.abbr})...`);
      await downloadFile(team.url, filepath);
      
      // Verify file was created and has content
      const stats = fs.statSync(filepath);
      if (stats.size > 0) {
        console.log(`✅ Downloaded ${filename} (${stats.size} bytes)`);
        results.push({ team: team.abbr, success: true, size: stats.size });
      } else {
        console.log(`❌ Downloaded ${filename} but file is empty`);
        results.push({ team: team.abbr, success: false, error: 'Empty file' });
      }
    } catch (error) {
      console.log(`❌ Failed to download ${team.abbr}: ${error.message}`);
      results.push({ team: team.abbr, success: false, error: error.message });
    }
  }
  
  // Summary
  console.log('\n📊 Download Summary:');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/32`);
  console.log(`❌ Failed: ${failed.length}/32`);
  
  if (failed.length > 0) {
    console.log('\nFailed downloads:');
    failed.forEach(f => console.log(`  - ${f.team}: ${f.error}`));
  }
  
  if (successful.length === 32) {
    console.log('\n🎉 All team logos downloaded successfully!');
    console.log(`📁 Logos saved to: ${logosDir}`);
  } else {
    console.log('\n⚠️ Some logos failed to download. Check the errors above.');
  }
  
  return results;
}

// Run the download
downloadAllLogos().catch(console.error); 