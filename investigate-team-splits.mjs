/**
 * Investigate team-specific splits data
 * This will help identify missing data for performance vs specific teams
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

async function investigateTeamSplits() {
  console.log('🔍 Investigating team-specific splits data...\n');

  try {
    // 1. Check for Opponent split type in qb_splits
    console.log('📋 1. Checking Opponent split type in qb_splits...');
    
    const { data: opponentData, error: opponentError } = await supabase
      .from('qb_splits')
      .select('*')
      .eq('split', 'Opponent')
      .eq('season', 2024)
      .gte('att', 10)
      .order('att', { ascending: false })
      .limit(20);
    
    if (opponentError) {
      console.log(`❌ Error querying Opponent data:`, opponentError.message);
    } else {
      console.log(`✅ Found ${opponentData?.length || 0} Opponent records with 10+ attempts`);
      if (opponentData && opponentData.length > 0) {
        console.log('📄 Sample Opponent records:');
        opponentData.slice(0, 5).forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.player_name} vs ${record.value}: ${record.att} att, ${record.cmp} cmp, ${record.yds} yds, ${record.td} td, ${record.int} int`);
        });
      }
    }
    console.log('');

    // 2. Check what teams are available as opponents
    console.log('📋 2. Checking available opponent teams...');
    
    const { data: opponentTeams, error: opponentTeamsError } = await supabase
      .from('qb_splits')
      .select('value')
      .eq('split', 'Opponent')
      .eq('season', 2024)
      .not('value', 'is', null);
    
    if (!opponentTeamsError && opponentTeams) {
      const uniqueTeams = [...new Set(opponentTeams.map(r => r.value))];
      console.log(`✅ Available opponent teams (${uniqueTeams.length}):`);
      uniqueTeams.forEach(team => {
        console.log(`  - ${team}`);
      });
    }
    console.log('');

    // 3. Check for team data in qb_splits_advanced (Continuation)
    console.log('📋 3. Checking for team data in qb_splits_advanced...');
    
    const { data: advancedTeamData, error: advancedTeamError } = await supabase
      .from('qb_splits_advanced')
      .select('*')
      .eq('split', 'Continuation')
      .eq('season', 2024)
      .gte('att', 10)
      .order('att', { ascending: false })
      .limit(20);
    
    if (advancedTeamError) {
      console.log(`❌ Error querying advanced team data:`, advancedTeamError.message);
    } else {
      console.log(`✅ Found ${advancedTeamData?.length || 0} Continuation records with 10+ attempts`);
      
      // Check if any of these are team-related
      const teamRelatedValues = advancedTeamData?.filter(record => 
        record.value && (
          record.value.includes('Ravens') || 
          record.value.includes('Chiefs') || 
          record.value.includes('Bills') ||
          record.value.includes('Patriots') ||
          record.value.includes('Dolphins') ||
          record.value.includes('Jets') ||
          record.value.includes('Bengals') ||
          record.value.includes('Browns') ||
          record.value.includes('Steelers') ||
          record.value.includes('Texans') ||
          record.value.includes('Colts') ||
          record.value.includes('Jaguars') ||
          record.value.includes('Titans') ||
          record.value.includes('Broncos') ||
          record.value.includes('Raiders') ||
          record.value.includes('Chargers') ||
          record.value.includes('Cowboys') ||
          record.value.includes('Eagles') ||
          record.value.includes('Giants') ||
          record.value.includes('Commanders') ||
          record.value.includes('Bears') ||
          record.value.includes('Lions') ||
          record.value.includes('Packers') ||
          record.value.includes('Vikings') ||
          record.value.includes('Falcons') ||
          record.value.includes('Panthers') ||
          record.value.includes('Saints') ||
          record.value.includes('Buccaneers') ||
          record.value.includes('Cardinals') ||
          record.value.includes('Rams') ||
          record.value.includes('49ers') ||
          record.value.includes('Seahawks')
        )
      ) || [];
      
      console.log(`✅ Found ${teamRelatedValues.length} team-related Continuation records`);
      if (teamRelatedValues.length > 0) {
        console.log('📄 Team-related Continuation records:');
        teamRelatedValues.slice(0, 10).forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.player_name} - ${record.value}: ${record.att} att, ${record.cmp} cmp, ${record.yds} yds`);
        });
      }
    }
    console.log('');

    // 4. Check for any team-related split types
    console.log('📋 4. Checking for team-related split types...');
    
    const { data: allSplitTypes, error: splitTypesError } = await supabase
      .from('qb_splits')
      .select('split, value')
      .eq('season', 2024)
      .not('split', 'is', null)
      .not('value', 'is', null);
    
    if (!splitTypesError && allSplitTypes) {
      const splitMap = {};
      allSplitTypes.forEach(record => {
        if (!splitMap[record.split]) {
          splitMap[record.split] = new Set();
        }
        splitMap[record.split].add(record.value);
      });
      
      console.log('✅ All split types and values in qb_splits:');
      Object.entries(splitMap).forEach(([split, values]) => {
        console.log(`  - ${split}: ${Array.from(values).join(', ')}`);
      });
    }
    console.log('');

    // 5. Check for team data in advanced table
    console.log('📋 5. Checking for team data in qb_splits_advanced...');
    
    const { data: advancedSplitTypes, error: advancedSplitTypesError } = await supabase
      .from('qb_splits_advanced')
      .select('split, value')
      .eq('season', 2024)
      .not('split', 'is', null)
      .not('value', 'is', null);
    
    if (!advancedSplitTypesError && advancedSplitTypes) {
      const splitMap = {};
      advancedSplitTypes.forEach(record => {
        if (!splitMap[record.split]) {
          splitMap[record.split] = new Set();
        }
        splitMap[record.split].add(record.value);
      });
      
      console.log('✅ All split types and values in qb_splits_advanced:');
      Object.entries(splitMap).forEach(([split, values]) => {
        console.log(`  - ${split}: ${Array.from(values).join(', ')}`);
      });
    }
    console.log('');

    console.log('✅ Investigation complete!');

  } catch (error) {
    console.error('❌ Error during investigation:', error);
  }
}

investigateTeamSplits(); 