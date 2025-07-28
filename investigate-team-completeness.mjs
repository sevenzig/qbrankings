/**
 * Comprehensive investigation of team data completeness
 * This will help identify why team data is incomplete and find solutions
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

async function investigateTeamCompleteness() {
  console.log('🔍 Comprehensive investigation of team data completeness...\n');

  try {
    // 1. Check if there are other split types that might contain team data
    console.log('📋 1. Checking all split types for team-related data...');
    
    const { data: allSplits, error: allSplitsError } = await supabase
      .from('qb_splits')
      .select('split, value')
      .eq('season', 2024)
      .not('split', 'is', null)
      .not('value', 'is', null);
    
    if (!allSplitsError && allSplits) {
      const splitMap = {};
      allSplits.forEach(record => {
        if (!splitMap[record.split]) {
          splitMap[record.split] = new Set();
        }
        splitMap[record.split].add(record.value);
      });
      
      console.log('✅ All split types in qb_splits:');
      Object.entries(splitMap).forEach(([split, values]) => {
        console.log(`  - ${split}: ${Array.from(values).join(', ')}`);
      });
    }
    console.log('');

    // 2. Check if team data exists under different split types
    console.log('📋 2. Checking for team data in different split types...');
    
    const teamKeywords = [
      'Ravens', 'Chiefs', 'Bills', 'Patriots', 'Dolphins', 'Jets', 'Bengals', 'Browns', 'Steelers',
      'Texans', 'Colts', 'Jaguars', 'Titans', 'Broncos', 'Raiders', 'Chargers', 'Cowboys', 'Eagles',
      'Giants', 'Commanders', 'Bears', 'Lions', 'Packers', 'Vikings', 'Falcons', 'Panthers', 'Saints',
      'Buccaneers', 'Cardinals', 'Rams', '49ers', 'Seahawks'
    ];
    
    for (const keyword of teamKeywords.slice(0, 10)) { // Test first 10 to avoid too much output
      const { data, error } = await supabase
        .from('qb_splits')
        .select('split, value, player_name, att')
        .eq('season', 2024)
        .ilike('value', `%${keyword}%`)
        .gte('att', 10);
      
      if (!error && data && data.length > 0) {
        console.log(`✅ Found ${data.length} records containing "${keyword}":`);
        data.slice(0, 3).forEach(record => {
          console.log(`  - ${record.player_name}: ${record.split} = ${record.value} (${record.att} att)`);
        });
      }
    }
    console.log('');

    // 3. Check if there are any records with team data but different structure
    console.log('📋 3. Checking for alternative team data structures...');
    
    const { data: allTeamRecords, error: teamRecordsError } = await supabase
      .from('qb_splits')
      .select('*')
      .eq('season', 2024)
      .or('value.ilike.%Ravens%,value.ilike.%Chiefs%,value.ilike.%Bills%,value.ilike.%Patriots%')
      .gte('att', 10);
    
    if (!teamRecordsError && allTeamRecords) {
      console.log(`✅ Found ${allTeamRecords.length} team-related records with alternative structure:`);
      const teamMap = {};
      allTeamRecords.forEach(record => {
        if (!teamMap[record.split]) {
          teamMap[record.split] = new Set();
        }
        teamMap[record.split].add(record.value);
      });
      
      Object.entries(teamMap).forEach(([split, values]) => {
        console.log(`  - ${split}: ${Array.from(values).join(', ')}`);
      });
    }
    console.log('');

    // 4. Check if team data exists in qb_splits_advanced under Continuation
    console.log('📋 4. Checking for team data in qb_splits_advanced Continuation...');
    
    const { data: advancedTeamRecords, error: advancedTeamError } = await supabase
      .from('qb_splits_advanced')
      .select('*')
      .eq('split', 'Continuation')
      .eq('season', 2024)
      .or('value.ilike.%Ravens%,value.ilike.%Chiefs%,value.ilike.%Bills%,value.ilike.%Patriots%')
      .gte('att', 10);
    
    if (!advancedTeamError && advancedTeamRecords) {
      console.log(`✅ Found ${advancedTeamRecords.length} team-related records in Continuation:`);
      const teamMap = {};
      advancedTeamRecords.forEach(record => {
        if (!teamMap[record.value]) {
          teamMap[record.value] = [];
        }
        teamMap[record.value].push(record);
      });
      
      Object.entries(teamMap).forEach(([value, records]) => {
        console.log(`  - ${value}: ${records.length} QBs`);
        if (records.length > 0) {
          console.log(`    Sample: ${records.slice(0, 3).map(r => `${r.player_name} (${r.att} att)`).join(', ')}`);
        }
      });
    }
    console.log('');

    // 5. Check if there are any records with team abbreviations or different naming
    console.log('📋 5. Checking for team abbreviations or alternative naming...');
    
    const teamAbbreviations = ['LV', 'LAC', 'TEN', 'HOU', 'IND', 'JAX', 'PIT', 'NYJ', 'MIA', 'NYG', 'WAS', 'DET', 'GB', 'MIN', 'NO', 'TB', 'LAR', 'SF', 'SEA'];
    
    for (const abbrev of teamAbbreviations.slice(0, 5)) {
      const { data, error } = await supabase
        .from('qb_splits')
        .select('split, value, player_name, att')
        .eq('season', 2024)
        .ilike('value', `%${abbrev}%`)
        .gte('att', 10);
      
      if (!error && data && data.length > 0) {
        console.log(`✅ Found ${data.length} records with abbreviation "${abbrev}":`);
        data.slice(0, 3).forEach(record => {
          console.log(`  - ${record.player_name}: ${record.split} = ${record.value} (${record.att} att)`);
        });
      }
    }
    console.log('');

    // 6. Check if there are any records with different team name formats
    console.log('📋 6. Checking for different team name formats...');
    
    const alternativeTeamNames = [
      'Raiders', 'Chargers', 'Titans', 'Texans', 'Colts', 'Jaguars', 'Steelers', 'Jets', 'Dolphins', 'Giants',
      'Commanders', 'Lions', 'Packers', 'Vikings', 'Saints', 'Buccaneers', 'Rams', '49ers', 'Seahawks'
    ];
    
    for (const teamName of alternativeTeamNames.slice(0, 5)) {
      const { data, error } = await supabase
        .from('qb_splits')
        .select('split, value, player_name, att')
        .eq('season', 2024)
        .ilike('value', `%${teamName}%`)
        .gte('att', 10);
      
      if (!error && data && data.length > 0) {
        console.log(`✅ Found ${data.length} records with team name "${teamName}":`);
        data.slice(0, 3).forEach(record => {
          console.log(`  - ${record.player_name}: ${record.split} = ${record.value} (${record.att} att)`);
        });
      }
    }
    console.log('');

    console.log('✅ Investigation complete!');

  } catch (error) {
    console.error('❌ Error during investigation:', error);
  }
}

investigateTeamCompleteness(); 