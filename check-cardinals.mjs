/**
 * Check Arizona Cardinals data specifically
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

async function checkCardinals() {
  console.log('🔍 Checking Arizona Cardinals data specifically...\n');

  try {
    // Check different variations of Cardinals name
    const cardinalsVariations = [
      'Arizona Cardinals',
      'Cardinals',
      'Arizona',
      'AZ Cardinals',
      'AZ'
    ];

    for (const variation of cardinalsVariations) {
      const { data, error } = await supabase
        .from('qb_splits')
        .select('value, player_name, att, cmp, yds, td, int, rate')
        .eq('split', 'Continuation')
        .eq('season', 2024)
        .ilike('value', `%${variation}%`)
        .gte('att', 10);
      
      if (!error && data && data.length > 0) {
        console.log(`✅ Found ${data.length} records for "${variation}":`);
        data.slice(0, 3).forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.player_name}: ${record.att} att, ${record.cmp} cmp, ${record.yds} yds, ${record.td} td, ${record.int} int, ${record.rate} rate`);
        });
        console.log(`  Actual value in database: "${data[0].value}"`);
        break;
      } else {
        console.log(`❌ No data found for "${variation}"`);
      }
    }

    // Check if Cardinals data exists in the Opponent split type
    console.log('\n📋 Checking Opponent split type for Cardinals...');
    
    const { data: opponentData, error: opponentError } = await supabase
      .from('qb_splits')
      .select('value, player_name, att, cmp, yds, td, int, rate')
      .eq('split', 'Opponent')
      .eq('season', 2024)
      .ilike('value', '%Cardinals%')
      .gte('att', 10);
    
    if (!opponentError && opponentData && opponentData.length > 0) {
      console.log(`✅ Found ${opponentData.length} Cardinals records in Opponent split:`);
      opponentData.slice(0, 3).forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.player_name}: ${record.att} att, ${record.cmp} cmp, ${record.yds} yds, ${record.td} td, ${record.int} int, ${record.rate} rate`);
      });
      console.log(`  Actual value in database: "${opponentData[0].value}"`);
    } else {
      console.log('❌ No Cardinals data found in Opponent split type');
    }

    // Check all values containing "Cardinal" in Continuation
    console.log('\n📋 Checking all values containing "Cardinal" in Continuation...');
    
    const { data: allCardinals, error: allCardinalsError } = await supabase
      .from('qb_splits')
      .select('value')
      .eq('split', 'Continuation')
      .eq('season', 2024)
      .ilike('value', '%Cardinal%');
    
    if (!allCardinalsError && allCardinals) {
      const uniqueValues = [...new Set(allCardinals.map(r => r.value))];
      console.log(`✅ Found ${uniqueValues.length} unique values containing "Cardinal":`);
      uniqueValues.forEach(value => {
        console.log(`  - "${value}"`);
      });
    }

  } catch (error) {
    console.error('❌ Error during investigation:', error);
  }
}

checkCardinals(); 