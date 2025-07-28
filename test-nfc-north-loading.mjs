/**
 * Test NFC North data loading in splits comparison service
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

async function testNFCNorthLoading() {
  console.log('🧪 Testing NFC North data loading...\n');

  try {
    // Simulate the splits comparison service logic
    console.log('📋 1. Testing Division split type first...');
    
    let { data: divisionData, error: divisionError } = await supabase
      .from('qb_splits')
      .select('*')
      .eq('split', 'Division')
      .eq('value', 'NFC North')
      .eq('season', 2024)
      .gte('att', 10)
      .order('att', { ascending: false });
    
    if (divisionError) {
      console.log(`❌ Error querying Division:`, divisionError.message);
    } else {
      console.log(`✅ Found ${divisionData?.length || 0} records in Division split type`);
      if (divisionData && divisionData.length > 0) {
        divisionData.forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.player_name}: ${record.att} att, ${record.cmp} cmp, ${record.yds} yds`);
        });
      }
    }
    console.log('');

    // If no data in Division, try Continuation split type
    console.log('📋 2. Testing Continuation split type...');
    
    if (!divisionData || divisionData.length === 0) {
      const { data: continuationData, error: continuationError } = await supabase
        .from('qb_splits')
        .select('*')
        .eq('split', 'Continuation')
        .eq('value', 'NFC North')
        .eq('season', 2024)
        .gte('att', 10)
        .order('att', { ascending: false });
      
      if (continuationError) {
        console.log(`❌ Error querying Continuation:`, continuationError.message);
      } else {
        console.log(`✅ Found ${continuationData?.length || 0} records in Continuation split type`);
        if (continuationData && continuationData.length > 0) {
          console.log('📄 Top 10 records:');
          continuationData.slice(0, 10).forEach((record, index) => {
            console.log(`  ${index + 1}. ${record.player_name}: ${record.att} att, ${record.cmp} cmp, ${record.yds} yds, ${record.td} td, ${record.int} int, ${record.rate} rate`);
          });
        }
      }
    }
    console.log('');

    // Test with different minimum attempt thresholds
    console.log('📋 3. Testing with different minimum attempt thresholds...\n');
    
    const thresholds = [1, 5, 10, 15, 20];
    
    for (const threshold of thresholds) {
      // Try Division first
      let { data, error } = await supabase
        .from('qb_splits')
        .select('player_name, att, cmp, yds, td, int, rate')
        .eq('split', 'Division')
        .eq('value', 'NFC North')
        .eq('season', 2024)
        .gte('att', threshold)
        .order('att', { ascending: false });
      
      // If no data, try Continuation
      if (!data || data.length === 0) {
        const { data: continuationData, error: continuationError } = await supabase
          .from('qb_splits')
          .select('player_name, att, cmp, yds, td, int, rate')
          .eq('split', 'Continuation')
          .eq('value', 'NFC North')
          .eq('season', 2024)
          .gte('att', threshold)
          .order('att', { ascending: false });
        
        if (!continuationError && continuationData) {
          data = continuationData;
          error = continuationError;
        }
      }
      
      if (error) {
        console.log(`❌ Error with ${threshold}+ attempts:`, error.message);
      } else {
        console.log(`✅ ${threshold}+ attempts: ${data?.length || 0} QBs`);
        if (data && data.length > 0) {
          console.log(`  Top QB: ${data[0].player_name} - ${data[0].att} att, ${data[0].cmp} cmp, ${data[0].yds} yds, ${data[0].td} td, ${data[0].int} int, ${data[0].rate} rate`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testNFCNorthLoading(); 