/**
 * Test script to verify complete division data availability
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

async function testCompleteDivisionData() {
  console.log('🧪 Testing complete division data availability...\n');

  try {
    // All 8 NFL divisions
    const allDivisions = [
      'AFC East', 'AFC North', 'AFC South', 'AFC West',
      'NFC East', 'NFC North', 'NFC South', 'NFC West'
    ];

    console.log('📋 Testing all 8 NFL divisions for data availability...\n');

    let availableDivisions = 0;
    let missingDivisions = 0;

    for (const division of allDivisions) {
      // First try Division split type
      let { data, error } = await supabase
        .from('qb_splits')
        .select('player_name, att, cmp, yds, td, int, rate')
        .eq('split', 'Division')
        .eq('value', division)
        .eq('season', 2024)
        .gte('att', 10)
        .order('att', { ascending: false })
        .limit(5);
      
      // If no data in Division, try Continuation split type
      if (!data || data.length === 0) {
        const { data: continuationData, error: continuationError } = await supabase
          .from('qb_splits')
          .select('player_name, att, cmp, yds, td, int, rate')
          .eq('split', 'Continuation')
          .eq('value', division)
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
        console.log(`❌ Error querying ${division}:`, error.message);
        missingDivisions++;
      } else {
        if (data && data.length > 0) {
          console.log(`✅ ${division}: ${data.length} QBs with 10+ attempts`);
          console.log(`  Top QB: ${data[0].player_name} - ${data[0].att} att, ${data[0].cmp} cmp, ${data[0].yds} yds, ${data[0].td} td, ${data[0].int} int, ${data[0].rate} rate`);
          availableDivisions++;
        } else {
          console.log(`❌ ${division}: No data found`);
          missingDivisions++;
        }
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`  - Available divisions: ${availableDivisions}/8 (${Math.round(availableDivisions/8*100)}%)`);
    console.log(`  - Missing divisions: ${missingDivisions}/8`);
    console.log(`  - Coverage: ${availableDivisions === 8 ? '✅ Complete' : '❌ Incomplete'}`);

    if (availableDivisions === 8) {
      console.log('\n🎉 SUCCESS: All 8 NFL divisions now have data available!');
    } else {
      console.log('\n⚠️ Some divisions are missing data');
    }

  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testCompleteDivisionData(); 