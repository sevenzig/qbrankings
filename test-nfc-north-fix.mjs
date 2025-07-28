/**
 * Test NFC North fix with updated service logic
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

async function testNFCNorthFix() {
  console.log('🧪 Testing NFC North fix with updated service logic...\n');

  try {
    // Simulate the updated service logic
    console.log('📋 Simulating updated service logic for NFC North...\n');
    
    let splitsData = [];
    const splitValue = 'NFC North';
    const season = 2024;
    const minAttempts = 10;
    
    // First try the original Division split type
    console.log('1️⃣ Checking Division split type...');
    try {
      const { data, error } = await supabase
        .from('qb_splits')
        .select('*')
        .eq('split', 'Division')
        .eq('value', splitValue)
        .eq('season', season)
        .gte('att', minAttempts)
        .order('att', { ascending: false });
      
      if (!error && data && data.length > 0) {
        // Check if we have sufficient data in Division split type (more than 1 QB)
        if (data.length > 1) {
          splitsData = data.map(record => ({ ...record, table_source: 'qb_splits' }));
          console.log(`✅ Found ${data.length} division records in qb_splits (Division)`);
        } else {
          console.log(`⚠️ Only ${data.length} QB found in Division split type, checking Continuation for more comprehensive data...`);
          // Continue to check Continuation split type for more comprehensive data
        }
      }
    } catch (error) {
      console.log(`⚠️ Error querying qb_splits (Division for division):`, error.message);
    }
    
    // If no sufficient data found in Division, try Continuation split type
    if (splitsData.length === 0) {
      console.log('2️⃣ Checking Continuation split type...');
      try {
        const { data, error } = await supabase
          .from('qb_splits')
          .select('*')
          .eq('split', 'Continuation')
          .eq('value', splitValue)
          .eq('season', season)
          .gte('att', minAttempts)
          .order('att', { ascending: false });
        
        if (!error && data && data.length > 0) {
          splitsData = data.map(record => ({ ...record, table_source: 'qb_splits' }));
          console.log(`✅ Found ${data.length} division records in qb_splits (Continuation)`);
        }
      } catch (error) {
        console.log(`⚠️ Error querying qb_splits (Continuation for division):`, error.message);
      }
    }
    
    // Display results
    console.log('\n📊 Results:');
    console.log(`Total QBs found: ${splitsData.length}`);
    
    if (splitsData.length > 0) {
      console.log('\n📄 Top 10 QBs:');
      splitsData.slice(0, 10).forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.player_name}: ${record.att} att, ${record.cmp} cmp, ${record.yds} yds, ${record.td} td, ${record.int} int, ${record.rate} rate`);
      });
      
      if (splitsData.length > 10) {
        console.log(`  ... and ${splitsData.length - 10} more QBs`);
      }
    }
    
    console.log('\n✅ Test complete!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testNFCNorthFix(); 