/**
 * Test script to verify team-specific data loading
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

async function testTeamData() {
  console.log('🧪 Testing team-specific data loading...\n');

  try {
    // Test available teams
    const availableTeams = [
      'Arizona Cardinals',
      'Dallas Cowboys', 
      'Carolina Panthers',
      'Baltimore Ravens',
      'Cincinnati Bengals',
      'Atlanta Falcons',
      'Buffalo Bills',
      'Kansas City Chiefs',
      'Cleveland Browns',
      'Philadelphia Eagles',
      'Denver Broncos',
      'New England Patriots',
      'Chicago Bears'
    ];

    console.log('📋 Testing data for available teams...\n');

    for (const team of availableTeams) {
      const { data, error } = await supabase
        .from('qb_splits')
        .select('player_name, att, cmp, yds, td, int, rate')
        .eq('split', 'Opponent')
        .eq('value', team)
        .eq('season', 2024)
        .gte('att', 10)
        .order('att', { ascending: false })
        .limit(5);
      
      if (error) {
        console.log(`❌ Error querying ${team}:`, error.message);
      } else {
        console.log(`✅ ${team}: ${data?.length || 0} QBs with 10+ attempts`);
        if (data && data.length > 0) {
          console.log(`  Top QB: ${data[0].player_name} - ${data[0].att} att, ${data[0].cmp} cmp, ${data[0].yds} yds, ${data[0].td} td, ${data[0].int} int, ${data[0].rate} rate`);
        }
      }
    }
    console.log('');

    // Test some missing teams to confirm they're not available
    const missingTeams = [
      'Las Vegas Raiders',
      'Los Angeles Chargers', 
      'Tennessee Titans',
      'Houston Texans',
      'Indianapolis Colts',
      'Jacksonville Jaguars',
      'Pittsburgh Steelers',
      'New York Jets',
      'Miami Dolphins',
      'New York Giants',
      'Washington Commanders',
      'Detroit Lions',
      'Green Bay Packers',
      'Minnesota Vikings',
      'New Orleans Saints',
      'Tampa Bay Buccaneers',
      'Los Angeles Rams',
      'San Francisco 49ers',
      'Seattle Seahawks'
    ];

    console.log('📋 Testing missing teams (should return 0 results)...\n');

    for (const team of missingTeams.slice(0, 5)) { // Test first 5 to avoid too much output
      const { data, error } = await supabase
        .from('qb_splits')
        .select('player_name, att, cmp, yds, td, int, rate')
        .eq('split', 'Opponent')
        .eq('value', team)
        .eq('season', 2024)
        .gte('att', 10);
      
      if (error) {
        console.log(`❌ Error querying ${team}:`, error.message);
      } else {
        console.log(`❌ ${team}: ${data?.length || 0} QBs (expected 0)`);
      }
    }
    console.log('');

    console.log('✅ Team data testing complete!');
    console.log('📊 Summary:');
    console.log(`  - Available teams: ${availableTeams.length}`);
    console.log(`  - Missing teams: ${missingTeams.length}`);
    console.log(`  - Total NFL teams: ${availableTeams.length + missingTeams.length}`);
    console.log('  - Coverage: ~40% of NFL teams have data');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testTeamData(); 