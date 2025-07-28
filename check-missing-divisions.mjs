/**
 * Check for missing divisions in Continuation split type
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

async function checkMissingDivisions() {
  console.log('🔍 Checking for missing divisions in Continuation split type...\n');

  try {
    // Check for NFC South and NFC West in Continuation
    const missingDivisions = ['NFC South', 'NFC West'];
    
    for (const division of missingDivisions) {
      console.log(`📋 Checking for "${division}" in Continuation split type...`);
      
      const { data, error } = await supabase
        .from('qb_splits')
        .select('player_name, att, cmp, yds, td, int, rate')
        .eq('split', 'Continuation')
        .eq('value', division)
        .eq('season', 2024)
        .gte('att', 10)
        .order('att', { ascending: false })
        .limit(5);
      
      if (error) {
        console.log(`❌ Error querying ${division}:`, error.message);
      } else {
        if (data && data.length > 0) {
          console.log(`✅ Found ${data.length} records for ${division} in Continuation:`);
          data.slice(0, 3).forEach((record, index) => {
            console.log(`  ${index + 1}. ${record.player_name}: ${record.att} att, ${record.cmp} cmp, ${record.yds} yds, ${record.td} td, ${record.int} int, ${record.rate} rate`);
          });
        } else {
          console.log(`❌ No data found for ${division} in Continuation`);
        }
      }
      console.log('');
    }

    // Check for any division-related values in Continuation
    console.log('📋 Checking for any division-related values in Continuation...');
    
    const { data: allContinuation, error: allContinuationError } = await supabase
      .from('qb_splits')
      .select('value, player_name, att, cmp, yds, td, int, rate')
      .eq('split', 'Continuation')
      .eq('season', 2024)
      .gte('att', 10)
      .order('att', { ascending: false })
      .limit(50);
    
    if (!allContinuationError && allContinuation) {
      const divisionKeywords = [
        'AFC East', 'AFC North', 'AFC South', 'AFC West',
        'NFC East', 'NFC North', 'NFC South', 'NFC West',
        'East', 'North', 'South', 'West'
      ];
      
      const divisionRecords = allContinuation.filter(record => 
        divisionKeywords.some(keyword => record.value.includes(keyword))
      );
      
      console.log(`✅ Found ${divisionRecords.length} division-related records in Continuation:`);
      if (divisionRecords.length > 0) {
        const uniqueValues = [...new Set(divisionRecords.map(r => r.value))];
        console.log('📄 Unique division values found:');
        uniqueValues.forEach(value => {
          console.log(`  - "${value}"`);
        });
        
        console.log('\n📄 Sample division records:');
        divisionRecords.slice(0, 5).forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.player_name} - ${record.value}: ${record.att} att, ${record.cmp} cmp, ${record.yds} yds`);
        });
      }
    }

    // Check if there are any division-related values in qb_splits_advanced
    console.log('\n📋 Checking for division data in qb_splits_advanced...');
    
    const { data: advancedDivisionData, error: advancedDivisionError } = await supabase
      .from('qb_splits_advanced')
      .select('value, player_name, att, cmp, yds, td, int, rate')
      .eq('split', 'Continuation')
      .eq('season', 2024)
      .gte('att', 10)
      .order('att', { ascending: false })
      .limit(50);
    
    if (!advancedDivisionError && advancedDivisionData) {
      const divisionKeywords = [
        'AFC East', 'AFC North', 'AFC South', 'AFC West',
        'NFC East', 'NFC North', 'NFC South', 'NFC West',
        'East', 'North', 'South', 'West'
      ];
      
      const divisionRecords = advancedDivisionData.filter(record => 
        divisionKeywords.some(keyword => record.value.includes(keyword))
      );
      
      console.log(`✅ Found ${divisionRecords.length} division-related records in qb_splits_advanced:`);
      if (divisionRecords.length > 0) {
        const uniqueValues = [...new Set(divisionRecords.map(r => r.value))];
        console.log('📄 Unique division values found:');
        uniqueValues.forEach(value => {
          console.log(`  - "${value}"`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error during investigation:', error);
  }
}

checkMissingDivisions(); 