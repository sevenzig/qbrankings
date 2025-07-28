/**
 * Check for team data in Continuation split type
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkContinuationTeams() {
  console.log('🔍 Checking for team data in Continuation split type...\n');

  try {
    // Get all Continuation values that contain team names
    const { data: continuationData, error } = await supabase
      .from('qb_splits')
      .select('value, player_name, att, cmp, yds, td, int, rate')
      .eq('split', 'Continuation')
      .eq('season', 2024)
      .gte('att', 10)
      .order('att', { ascending: false });
    
    if (error) {
      console.log(`❌ Error querying Continuation data:`, error.message);
      return;
    }
    
    if (!continuationData || continuationData.length === 0) {
      console.log('❌ No Continuation data found');
      return;
    }
    
    console.log(`✅ Found ${continuationData.length} Continuation records with 10+ attempts`);
    
    // Filter for team-related values
    const teamKeywords = [
      'Ravens', 'Chiefs', 'Bills', 'Patriots', 'Dolphins', 'Jets', 'Bengals', 'Browns', 'Steelers',
      'Texans', 'Colts', 'Jaguars', 'Titans', 'Broncos', 'Raiders', 'Chargers', 'Cowboys', 'Eagles',
      'Giants', 'Commanders', 'Bears', 'Lions', 'Packers', 'Vikings', 'Falcons', 'Panthers', 'Saints',
      'Buccaneers', 'Cardinals', 'Rams', '49ers', 'Seahawks'
    ];
    
    const teamRecords = continuationData.filter(record => 
      teamKeywords.some(keyword => record.value.includes(keyword))
    );
    
    console.log(`✅ Found ${teamRecords.length} team-related Continuation records`);
    
    if (teamRecords.length > 0) {
      // Group by team
      const teamMap = {};
      teamRecords.forEach(record => {
        // Extract team name from the value
        const teamName = teamKeywords.find(keyword => record.value.includes(keyword));
        if (teamName) {
          if (!teamMap[teamName]) {
            teamMap[teamName] = [];
          }
          teamMap[teamName].push(record);
        }
      });
      
      console.log('\n📊 Team data found in Continuation split:');
      Object.entries(teamMap).forEach(([team, records]) => {
        console.log(`\n🏈 ${team}: ${records.length} QBs`);
        records.slice(0, 3).forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.player_name}: ${record.att} att, ${record.cmp} cmp, ${record.yds} yds, ${record.td} td, ${record.int} int, ${record.rate} rate`);
        });
      });
      
      // Check what the actual values look like
      console.log('\n📋 Sample Continuation values containing teams:');
      const uniqueValues = [...new Set(teamRecords.map(r => r.value))];
      uniqueValues.slice(0, 10).forEach(value => {
        console.log(`  - "${value}"`);
      });
    }
    
    // Check if these team records are actually opponent data or something else
    console.log('\n🔍 Analyzing team record structure...');
    if (teamRecords.length > 0) {
      const sampleRecord = teamRecords[0];
      console.log(`Sample record structure:`);
      console.log(`  - Value: "${sampleRecord.value}"`);
      console.log(`  - Player: ${sampleRecord.player_name}`);
      console.log(`  - Stats: ${sampleRecord.att} att, ${sampleRecord.cmp} cmp, ${sampleRecord.yds} yds`);
      
      // Check if this looks like opponent data or QB's own team data
      const isOpponentData = sampleRecord.value.includes('vs') || sampleRecord.value.includes('against');
      console.log(`  - Looks like opponent data: ${isOpponentData}`);
    }
    
  } catch (error) {
    console.error('❌ Error during investigation:', error);
  }
}

checkContinuationTeams(); 