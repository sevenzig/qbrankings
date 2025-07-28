/**
 * Investigate NFC North data specifically
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

async function investigateNFCNorth() {
  console.log('🔍 Investigating NFC North data specifically...\n');

  try {
    // Check NFC North data with different minimum attempt thresholds
    console.log('📋 1. Checking NFC North data with different attempt thresholds...\n');
    
    const attemptThresholds = [1, 5, 10, 15, 20];
    
    for (const threshold of attemptThresholds) {
      const { data, error } = await supabase
        .from('qb_splits')
        .select('player_name, att, cmp, yds, td, int, rate')
        .eq('split', 'Division')
        .eq('value', 'NFC North')
        .eq('season', 2024)
        .gte('att', threshold)
        .order('att', { ascending: false });
      
      if (error) {
        console.log(`❌ Error querying NFC North with ${threshold}+ attempts:`, error.message);
      } else {
        console.log(`✅ NFC North with ${threshold}+ attempts: ${data?.length || 0} QBs`);
        if (data && data.length > 0) {
          data.forEach((record, index) => {
            console.log(`  ${index + 1}. ${record.player_name}: ${record.att} att, ${record.cmp} cmp, ${record.yds} yds, ${record.td} td, ${record.int} int, ${record.rate} rate`);
          });
        }
      }
      console.log('');
    }

    // Check NFC North in Continuation split type
    console.log('📋 2. Checking NFC North in Continuation split type...\n');
    
    for (const threshold of [1, 5, 10, 15, 20]) {
      const { data, error } = await supabase
        .from('qb_splits')
        .select('player_name, att, cmp, yds, td, int, rate')
        .eq('split', 'Continuation')
        .eq('value', 'NFC North')
        .eq('season', 2024)
        .gte('att', threshold)
        .order('att', { ascending: false });
      
      if (error) {
        console.log(`❌ Error querying NFC North (Continuation) with ${threshold}+ attempts:`, error.message);
      } else {
        console.log(`✅ NFC North (Continuation) with ${threshold}+ attempts: ${data?.length || 0} QBs`);
        if (data && data.length > 0) {
          data.forEach((record, index) => {
            console.log(`  ${index + 1}. ${record.player_name}: ${record.att} att, ${record.cmp} cmp, ${record.yds} yds, ${record.td} td, ${record.int} int, ${record.rate} rate`);
          });
        }
      }
      console.log('');
    }

    // Check what other divisions have for comparison
    console.log('📋 3. Comparing with other divisions...\n');
    
    const otherDivisions = ['AFC East', 'AFC North', 'AFC South', 'AFC West', 'NFC East', 'NFC South', 'NFC West'];
    
    for (const division of otherDivisions.slice(0, 3)) { // Check first 3 to avoid too much output
      const { data, error } = await supabase
        .from('qb_splits')
        .select('player_name, att, cmp, yds, td, int, rate')
        .eq('split', 'Division')
        .eq('value', division)
        .eq('season', 2024)
        .gte('att', 10)
        .order('att', { ascending: false })
        .limit(3);
      
      if (!error && data) {
        console.log(`✅ ${division}: ${data.length} QBs with 10+ attempts`);
        data.forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.player_name}: ${record.att} att, ${record.cmp} cmp, ${record.yds} yds, ${record.td} td, ${record.int} int, ${record.rate} rate`);
        });
      }
      console.log('');
    }

    // Check if there are any records with lower attempt thresholds for NFC North
    console.log('📋 4. Checking all NFC North records regardless of attempts...\n');
    
    const { data: allNFCNorth, error: allNFCNorthError } = await supabase
      .from('qb_splits')
      .select('player_name, att, cmp, yds, td, int, rate')
      .eq('split', 'Division')
      .eq('value', 'NFC North')
      .eq('season', 2024)
      .order('att', { ascending: false });
    
    if (!allNFCNorthError && allNFCNorth) {
      console.log(`✅ Found ${allNFCNorth.length} total NFC North records:`);
      allNFCNorth.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.player_name}: ${record.att} att, ${record.cmp} cmp, ${record.yds} yds, ${record.td} td, ${record.int} int, ${record.rate} rate`);
      });
    }

    // Check if NFC North data exists in qb_splits_advanced
    console.log('\n📋 5. Checking NFC North in qb_splits_advanced...\n');
    
    const { data: advancedNFCNorth, error: advancedNFCNorthError } = await supabase
      .from('qb_splits_advanced')
      .select('player_name, att, cmp, yds, td, int, rate')
      .eq('split', 'Continuation')
      .eq('value', 'NFC North')
      .eq('season', 2024)
      .gte('att', 1)
      .order('att', { ascending: false });
    
    if (!advancedNFCNorthError && advancedNFCNorth) {
      console.log(`✅ Found ${advancedNFCNorth.length} NFC North records in qb_splits_advanced:`);
      advancedNFCNorth.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.player_name}: ${record.att} att, ${record.cmp} cmp, ${record.yds} yds, ${record.td} td, ${record.int} int, ${record.rate} rate`);
      });
    }

  } catch (error) {
    console.error('❌ Error during investigation:', error);
  }
}

investigateNFCNorth(); 