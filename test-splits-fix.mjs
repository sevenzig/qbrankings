/**
 * Test script to verify the splits comparison service fixes
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

async function testSplitsFix() {
  console.log('🧪 Testing splits comparison service fixes...\n');

  try {
    // Test 1: Check what data exists for "3rd" down
    console.log('📋 Test 1: Checking "3rd" down data...');
    
    const { data: thirdDownData, error: thirdDownError } = await supabase
      .from('qb_splits_advanced')
      .select('*')
      .eq('split', 'Down')
      .eq('value', '3rd')
      .eq('season', 2024)
      .limit(5);
    
    if (thirdDownError) {
      console.log(`❌ Error querying 3rd down data:`, thirdDownError.message);
    } else {
      console.log(`✅ Found ${thirdDownData?.length || 0} records for 3rd down`);
      if (thirdDownData && thirdDownData.length > 0) {
        console.log('📄 Sample record:', {
          player_name: thirdDownData[0].player_name,
          att: thirdDownData[0].att,
          cmp: thirdDownData[0].cmp,
          yds: thirdDownData[0].yds,
          td: thirdDownData[0].td,
          int: thirdDownData[0].int,
          rate: thirdDownData[0].rate
        });
      }
    }
    console.log('');

    // Test 2: Check what data exists for "1-3" yards to go
    console.log('📋 Test 2: Checking "1-3" yards to go data...');
    
    const { data: shortYardageData, error: shortYardageError } = await supabase
      .from('qb_splits_advanced')
      .select('*')
      .eq('split', 'Yards To Go')
      .eq('value', '1-3')
      .eq('season', 2024)
      .limit(5);
    
    if (shortYardageError) {
      console.log(`❌ Error querying short yardage data:`, shortYardageError.message);
    } else {
      console.log(`✅ Found ${shortYardageData?.length || 0} records for 1-3 yards to go`);
      if (shortYardageData && shortYardageData.length > 0) {
        console.log('📄 Sample record:', {
          player_name: shortYardageData[0].player_name,
          att: shortYardageData[0].att,
          cmp: shortYardageData[0].cmp,
          yds: shortYardageData[0].yds,
          td: shortYardageData[0].td,
          int: shortYardageData[0].int,
          rate: shortYardageData[0].rate
        });
      }
    }
    console.log('');

    // Test 3: Check what data exists for "3rd & 1-3" combined
    console.log('📋 Test 3: Checking "3rd & 1-3" combined data...');
    
    const { data: thirdAndShortData, error: thirdAndShortError } = await supabase
      .from('qb_splits_advanced')
      .select('*')
      .eq('split', 'Down & Yards to Go')
      .eq('value', '3rd & 1-3')
      .eq('season', 2024)
      .limit(5);
    
    if (thirdAndShortError) {
      console.log(`❌ Error querying 3rd & 1-3 data:`, thirdAndShortError.message);
    } else {
      console.log(`✅ Found ${thirdAndShortData?.length || 0} records for 3rd & 1-3`);
      if (thirdAndShortData && thirdAndShortData.length > 0) {
        console.log('📄 Sample record:', {
          player_name: thirdAndShortData[0].player_name,
          att: thirdAndShortData[0].att,
          cmp: thirdAndShortData[0].cmp,
          yds: thirdAndShortData[0].yds,
          td: thirdAndShortData[0].td,
          int: thirdAndShortData[0].int,
          rate: thirdAndShortData[0].rate
        });
      }
    }
    console.log('');

    // Test 4: Check what data exists for "Home" games
    console.log('📋 Test 4: Checking "Home" games data...');
    
    const { data: homeData, error: homeError } = await supabase
      .from('qb_splits')
      .select('*')
      .eq('split', 'Place')
      .eq('value', 'Home')
      .eq('season', 2024)
      .limit(5);
    
    if (homeError) {
      console.log(`❌ Error querying home games data:`, homeError.message);
    } else {
      console.log(`✅ Found ${homeData?.length || 0} records for home games`);
      if (homeData && homeData.length > 0) {
        console.log('📄 Sample record:', {
          player_name: homeData[0].player_name,
          att: homeData[0].att,
          cmp: homeData[0].cmp,
          yds: homeData[0].yds,
          td: homeData[0].td,
          int: homeData[0].int,
          rate: homeData[0].rate
        });
      }
    }
    console.log('');

    console.log('✅ Test complete!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testSplitsFix(); 