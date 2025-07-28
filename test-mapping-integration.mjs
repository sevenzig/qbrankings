/**
 * Test mapping integration with splitsComparisonService
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { getSplitTypeForValue } from './src/utils/splitsMapping.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMappingIntegration() {
  console.log('🧪 Testing mapping integration...\n');

  try {
    // Test mapping utility with various values
    console.log('📋 1. Testing mapping utility with various values...\n');
    
    const testValues = [
      'NFC North',
      'AFC East', 
      'Chicago Bears',
      'Dallas Cowboys',
      '3rd & 1-3',
      'Red Zone',
      'Home',
      'Win'
    ];
    
    testValues.forEach(value => {
      const mappedType = getSplitTypeForValue(value);
      console.log(`"${value}" → ${mappedType}`);
    });
    
    console.log('\n📋 2. Testing service logic with mapping...\n');
    
    // Test the service logic for NFC North
    const splitValue = 'NFC North';
    const season = 2024;
    const minAttempts = 10;
    
    console.log(`Testing service logic for "${splitValue}"...`);
    
    // Simulate the updated service logic
    let splitsData = [];
    const mappedSplitType = getSplitTypeForValue(splitValue);
    
    console.log(`Mapped split type: ${mappedSplitType}`);
    
    if (mappedSplitType === 'Division') {
      console.log('✅ Correctly identified as Division split type');
      
      // First try Division split type
      let { data, error } = await supabase
        .from('qb_splits')
        .select('*')
        .eq('split', 'Division')
        .eq('value', splitValue)
        .eq('season', season)
        .gte('att', minAttempts)
        .order('att', { ascending: false });
      
      if (!error && data && data.length > 0) {
        if (data.length > 1) {
          splitsData = data.map(record => ({ ...record, table_source: 'qb_splits' }));
          console.log(`✅ Found ${data.length} records in Division split type`);
        } else {
          console.log(`⚠️ Only ${data.length} QB found in Division, checking Continuation...`);
        }
      }
      
      // If no sufficient data, try Continuation
      if (splitsData.length === 0) {
        const { data: continuationData, error: continuationError } = await supabase
          .from('qb_splits')
          .select('*')
          .eq('split', 'Continuation')
          .eq('value', splitValue)
          .eq('season', season)
          .gte('att', minAttempts)
          .order('att', { ascending: false });
        
        if (!continuationError && continuationData && continuationData.length > 0) {
          splitsData = continuationData.map(record => ({ ...record, table_source: 'qb_splits' }));
          console.log(`✅ Found ${continuationData.length} records in Continuation split type`);
        }
      }
    }
    
    console.log(`\n📊 Final result: ${splitsData.length} QBs found`);
    
    if (splitsData.length > 0) {
      console.log('\n📄 Top 5 QBs:');
      splitsData.slice(0, 5).forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.player_name}: ${record.att} att, ${record.cmp} cmp, ${record.yds} yds, ${record.td} td, ${record.int} int, ${record.rate} rate`);
      });
    }
    
    console.log('\n✅ Mapping integration test complete!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testMappingIntegration(); 