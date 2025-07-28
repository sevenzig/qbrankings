/**
 * Test script to verify complete team data availability
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

async function testCompleteTeamData() {
  console.log('🧪 Testing complete team data availability...\n');

  try {
    // All 32 NFL teams
    const allTeams = [
      'Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills',
      'Carolina Panthers', 'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns',
      'Dallas Cowboys', 'Denver Broncos', 'Detroit Lions', 'Green Bay Packers',
      'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Kansas City Chiefs',
      'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams', 'Miami Dolphins',
      'Minnesota Vikings', 'New England Patriots', 'New Orleans Saints', 'New York Giants',
      'New York Jets', 'Philadelphia Eagles', 'Pittsburgh Steelers', 'San Francisco 49ers',
      'Seattle Seahawks', 'Tampa Bay Buccaneers', 'Tennessee Titans', 'Washington Commanders'
    ];

    console.log('📋 Testing all 32 NFL teams for data availability...\n');

    let availableTeams = 0;
    let missingTeams = 0;

    for (const team of allTeams) {
      // First try Opponent split type
      let { data, error } = await supabase
        .from('qb_splits')
        .select('player_name, att, cmp, yds, td, int, rate')
        .eq('split', 'Opponent')
        .eq('value', team)
        .eq('season', 2024)
        .gte('att', 10)
        .order('att', { ascending: false })
        .limit(5);
      
      // If no data in Opponent, try Continuation split type
      if (!data || data.length === 0) {
        const { data: continuationData, error: continuationError } = await supabase
          .from('qb_splits')
          .select('player_name, att, cmp, yds, td, int, rate')
          .eq('split', 'Continuation')
          .eq('value', team)
          .eq('season', 2024)
          .gte('att', 10)
          .order('att', { ascending: false })
          .limit(5);
        
        if (!continuationError && continuationData) {
          data = continuationData;
          error = continuationError;
        }
      }
      
      if (error) {
        console.log(`❌ Error querying ${team}:`, error.message);
        missingTeams++;
      } else {
        if (data && data.length > 0) {
          console.log(`✅ ${team}: ${data.length} QBs with 10+ attempts`);
          console.log(`  Top QB: ${data[0].player_name} - ${data[0].att} att, ${data[0].cmp} cmp, ${data[0].yds} yds, ${data[0].td} td, ${data[0].int} int, ${data[0].rate} rate`);
          availableTeams++;
        } else {
          console.log(`❌ ${team}: No data found`);
          missingTeams++;
        }
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`  - Available teams: ${availableTeams}/32 (${Math.round(availableTeams/32*100)}%)`);
    console.log(`  - Missing teams: ${missingTeams}/32`);
    console.log(`  - Coverage: ${availableTeams === 32 ? '✅ Complete' : '❌ Incomplete'}`);

    if (availableTeams === 32) {
      console.log('\n🎉 SUCCESS: All 32 NFL teams now have data available!');
    } else {
      console.log('\n⚠️ Some teams are still missing data');
    }

  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testCompleteTeamData(); 