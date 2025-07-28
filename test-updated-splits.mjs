/**
 * Test script to verify the updated splits comparison service
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

async function testUpdatedSplits() {
  console.log('🧪 Testing updated splits comparison service...\n');

  try {
    // Test 1: Check if we can get data for "3rd" down (should be in Continuation)
    console.log('📋 Test 1: Checking "3rd" down data from Continuation...');
    
    const { data: thirdDownData, error: thirdDownError } = await supabase
      .from('qb_splits_advanced')
      .select('player_name, att, cmp, yds, td, int, rate')
      .eq('split', 'Continuation')
      .eq('value', '3rd')
      .eq('season', 2024)
      .gte('att', 10)
      .order('att', { ascending: false })
      .limit(10);
    
    if (thirdDownError) {
      console.log(`❌ Error querying 3rd down data:`, thirdDownError.message);
    } else {
      console.log(`✅ Found ${thirdDownData?.length || 0} QBs for 3rd down with 10+ attempts`);
      if (thirdDownData && thirdDownData.length > 0) {
        console.log('📄 Top 3 QBs:');
        thirdDownData.slice(0, 3).forEach((qb, index) => {
          console.log(`  ${index + 1}. ${qb.player_name}: ${qb.att} att, ${qb.cmp} cmp, ${qb.yds} yds, ${qb.td} td, ${qb.int} int, ${qb.rate} rate`);
        });
      }
    }
    console.log('');

    // Test 2: Check if we can get data for "3rd & 1-3" (should be in Continuation)
    console.log('📋 Test 2: Checking "3rd & 1-3" data from Continuation...');
    
    const { data: thirdAndShortData, error: thirdAndShortError } = await supabase
      .from('qb_splits_advanced')
      .select('player_name, att, cmp, yds, td, int, rate')
      .eq('split', 'Continuation')
      .eq('value', '3rd & 1-3')
      .eq('season', 2024)
      .gte('att', 10)
      .order('att', { ascending: false })
      .limit(10);
    
    if (thirdAndShortError) {
      console.log(`❌ Error querying 3rd & 1-3 data:`, thirdAndShortError.message);
    } else {
      console.log(`✅ Found ${thirdAndShortData?.length || 0} QBs for 3rd & 1-3 with 10+ attempts`);
      if (thirdAndShortData && thirdAndShortData.length > 0) {
        console.log('📄 Top 3 QBs:');
        thirdAndShortData.slice(0, 3).forEach((qb, index) => {
          console.log(`  ${index + 1}. ${qb.player_name}: ${qb.att} att, ${qb.cmp} cmp, ${qb.yds} yds, ${qb.td} td, ${qb.int} int, ${qb.rate} rate`);
        });
      }
    }
    console.log('');

    // Test 3: Check if we can get data for "Red Zone" (should be in Continuation)
    console.log('📋 Test 3: Checking "Red Zone" data from Continuation...');
    
    const { data: redZoneData, error: redZoneError } = await supabase
      .from('qb_splits_advanced')
      .select('player_name, att, cmp, yds, td, int, rate')
      .eq('split', 'Continuation')
      .eq('value', 'Red Zone')
      .eq('season', 2024)
      .gte('att', 10)
      .order('att', { ascending: false })
      .limit(10);
    
    if (redZoneError) {
      console.log(`❌ Error querying Red Zone data:`, redZoneError.message);
    } else {
      console.log(`✅ Found ${redZoneData?.length || 0} QBs for Red Zone with 10+ attempts`);
      if (redZoneData && redZoneData.length > 0) {
        console.log('📄 Top 3 QBs:');
        redZoneData.slice(0, 3).forEach((qb, index) => {
          console.log(`  ${index + 1}. ${qb.player_name}: ${qb.att} att, ${qb.cmp} cmp, ${qb.yds} yds, ${qb.td} td, ${qb.int} int, ${qb.rate} rate`);
        });
      }
    }
    console.log('');

    // Test 4: Check if we can get data for "Shotgun" (should be in Continuation)
    console.log('📋 Test 4: Checking "Shotgun" data from Continuation...');
    
    const { data: shotgunData, error: shotgunError } = await supabase
      .from('qb_splits_advanced')
      .select('player_name, att, cmp, yds, td, int, rate')
      .eq('split', 'Continuation')
      .eq('value', 'Shotgun')
      .eq('season', 2024)
      .gte('att', 10)
      .order('att', { ascending: false })
      .limit(10);
    
    if (shotgunError) {
      console.log(`❌ Error querying Shotgun data:`, shotgunError.message);
    } else {
      console.log(`✅ Found ${shotgunData?.length || 0} QBs for Shotgun with 10+ attempts`);
      if (shotgunData && shotgunData.length > 0) {
        console.log('📄 Top 3 QBs:');
        shotgunData.slice(0, 3).forEach((qb, index) => {
          console.log(`  ${index + 1}. ${qb.player_name}: ${qb.att} att, ${qb.cmp} cmp, ${qb.yds} yds, ${qb.td} td, ${qb.int} int, ${qb.rate} rate`);
        });
      }
    }
    console.log('');

    // Test 5: Check if we can get data for "Home" games (should be in qb_splits)
    console.log('📋 Test 5: Checking "Home" games data from qb_splits...');
    
    const { data: homeData, error: homeError } = await supabase
      .from('qb_splits')
      .select('player_name, att, cmp, yds, td, int, rate')
      .eq('split', 'Place')
      .eq('value', 'Home')
      .eq('season', 2024)
      .gte('att', 10)
      .order('att', { ascending: false })
      .limit(10);
    
    if (homeError) {
      console.log(`❌ Error querying Home games data:`, homeError.message);
    } else {
      console.log(`✅ Found ${homeData?.length || 0} QBs for Home games with 10+ attempts`);
      if (homeData && homeData.length > 0) {
        console.log('📄 Top 3 QBs:');
        homeData.slice(0, 3).forEach((qb, index) => {
          console.log(`  ${index + 1}. ${qb.player_name}: ${qb.att} att, ${qb.cmp} cmp, ${qb.yds} yds, ${qb.td} td, ${qb.int} int, ${qb.rate} rate`);
        });
      }
    }
    console.log('');

    console.log('✅ Test complete!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testUpdatedSplits(); 