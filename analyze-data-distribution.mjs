/**
 * Analyze data distribution to understand why many split values have limited data
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

async function analyzeDataDistribution() {
  console.log('📊 Analyzing data distribution...\n');

  try {
    // 1. Check how many unique players have data
    console.log('📋 1. Checking unique players with data...');
    
    const { data: advancedPlayers, error: advancedPlayersError } = await supabase
      .from('qb_splits_advanced')
      .select('player_name')
      .not('player_name', 'is', null);
    
    const { data: splitsPlayers, error: splitsPlayersError } = await supabase
      .from('qb_splits')
      .select('player_name')
      .not('player_name', 'is', null);
    
    if (!advancedPlayersError && advancedPlayers) {
      const uniqueAdvancedPlayers = [...new Set(advancedPlayers.map(r => r.player_name))];
      console.log(`✅ qb_splits_advanced: ${uniqueAdvancedPlayers.length} unique players`);
      console.log(`  Sample players: ${uniqueAdvancedPlayers.slice(0, 10).join(', ')}`);
    }
    
    if (!splitsPlayersError && splitsPlayers) {
      const uniqueSplitsPlayers = [...new Set(splitsPlayers.map(r => r.player_name))];
      console.log(`✅ qb_splits: ${uniqueSplitsPlayers.length} unique players`);
      console.log(`  Sample players: ${uniqueSplitsPlayers.slice(0, 10).join(', ')}`);
    }
    console.log('');

    // 2. Check data distribution by split type
    console.log('📋 2. Checking data distribution by split type...');
    
    const { data: advancedSplitDistribution, error: advancedSplitError } = await supabase
      .from('qb_splits_advanced')
      .select('split, player_name')
      .not('split', 'is', null);
    
    if (!advancedSplitError && advancedSplitDistribution) {
      const splitMap = {};
      advancedSplitDistribution.forEach(record => {
        if (!splitMap[record.split]) {
          splitMap[record.split] = new Set();
        }
        splitMap[record.split].add(record.player_name);
      });
      
      console.log('✅ qb_splits_advanced distribution:');
      Object.entries(splitMap).forEach(([split, players]) => {
        console.log(`  - ${split}: ${players.size} players`);
      });
    }
    console.log('');

    // 3. Check specific split values that should work
    console.log('📋 3. Checking specific split values...');
    
    const testQueries = [
      { table: 'qb_splits_advanced', split: 'Down', value: '3rd', description: '3rd Down' },
      { table: 'qb_splits_advanced', split: 'Yards To Go', value: '1-3', description: '1-3 Yards' },
      { table: 'qb_splits_advanced', split: 'Down & Yards to Go', value: '3rd & 1-3', description: '3rd & 1-3' },
      { table: 'qb_splits', split: 'Place', value: 'Home', description: 'Home Games' },
      { table: 'qb_splits', split: 'Result', value: 'Win', description: 'Wins' },
      { table: 'qb_splits', split: 'Result', value: 'Loss', description: 'Losses' }
    ];
    
    for (const query of testQueries) {
      const { data, error } = await supabase
        .from(query.table)
        .select('player_name, att, cmp, yds, td, int, rate')
        .eq('split', query.split)
        .eq('value', query.value)
        .eq('season', 2024)
        .gte('att', 10) // Only QBs with meaningful attempts
        .order('att', { ascending: false })
        .limit(10);
      
      if (error) {
        console.log(`❌ ${query.description}: ${error.message}`);
      } else {
        console.log(`✅ ${query.description}: ${data?.length || 0} QBs with 10+ attempts`);
        if (data && data.length > 0) {
          console.log(`  Top 3: ${data.slice(0, 3).map(qb => `${qb.player_name} (${qb.att} att)`).join(', ')}`);
        }
      }
    }
    console.log('');

    // 4. Check Continuation split type breakdown
    console.log('📋 4. Analyzing Continuation split type...');
    
    const { data: continuationData, error: continuationError } = await supabase
      .from('qb_splits_advanced')
      .select('value, player_name, att')
      .eq('split', 'Continuation')
      .eq('season', 2024)
      .gte('att', 10);
    
    if (!continuationError && continuationData) {
      const valueMap = {};
      continuationData.forEach(record => {
        if (!valueMap[record.value]) {
          valueMap[record.value] = [];
        }
        valueMap[record.value].push(record);
      });
      
      console.log('✅ Continuation values with 10+ attempts:');
      Object.entries(valueMap).forEach(([value, records]) => {
        console.log(`  - ${value}: ${records.length} QBs`);
        if (records.length > 0) {
          console.log(`    Sample: ${records.slice(0, 3).map(r => `${r.player_name} (${r.att} att)`).join(', ')}`);
        }
      });
    }
    console.log('');

    // 5. Check if there are any QBs with comprehensive data
    console.log('📋 5. Finding QBs with comprehensive splits data...');
    
    const { data: comprehensiveQBs, error: comprehensiveError } = await supabase
      .from('qb_splits_advanced')
      .select('player_name, split, value, att')
      .eq('season', 2024)
      .gte('att', 10);
    
    if (!comprehensiveError && comprehensiveQBs) {
      const qbMap = {};
      comprehensiveQBs.forEach(record => {
        if (!qbMap[record.player_name]) {
          qbMap[record.player_name] = new Set();
        }
        qbMap[record.player_name].add(`${record.split}: ${record.value}`);
      });
      
      // Find QBs with the most split types
      const qbArray = Object.entries(qbMap).map(([player, splits]) => ({
        player,
        splitCount: splits.size,
        splits: Array.from(splits)
      })).sort((a, b) => b.splitCount - a.splitCount);
      
      console.log('✅ QBs with most comprehensive splits data:');
      qbArray.slice(0, 10).forEach(qb => {
        console.log(`  - ${qb.player}: ${qb.splitCount} split types`);
        console.log(`    Splits: ${qb.splits.slice(0, 5).join(', ')}${qb.splits.length > 5 ? '...' : ''}`);
      });
    }
    console.log('');

    console.log('✅ Analysis complete!');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  }
}

analyzeDataDistribution(); 