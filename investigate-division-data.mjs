/**
 * Investigate division data availability
 * This will help identify why comprehensive data is missing for performance by division split values
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

async function investigateDivisionData() {
  console.log('🔍 Investigating division data availability...\n');

  try {
    // 1. Check what division data exists in qb_splits
    console.log('📋 1. Checking division data in qb_splits...');
    
    const { data: divisionData, error: divisionError } = await supabase
      .from('qb_splits')
      .select('*')
      .eq('split', 'Division')
      .eq('season', 2024)
      .gte('att', 10)
      .order('att', { ascending: false })
      .limit(20);
    
    if (divisionError) {
      console.log(`❌ Error querying Division data:`, divisionError.message);
    } else {
      console.log(`✅ Found ${divisionData?.length || 0} Division records with 10+ attempts`);
      if (divisionData && divisionData.length > 0) {
        console.log('📄 Sample Division records:');
        divisionData.slice(0, 5).forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.player_name} vs ${record.value}: ${record.att} att, ${record.cmp} cmp, ${record.yds} yds, ${record.td} td, ${record.int} int`);
        });
      }
    }
    console.log('');

    // 2. Check what division values are available
    console.log('📋 2. Checking available division values...');
    
    const { data: divisionValues, error: divisionValuesError } = await supabase
      .from('qb_splits')
      .select('value')
      .eq('split', 'Division')
      .eq('season', 2024)
      .not('value', 'is', null);
    
    if (!divisionValuesError && divisionValues) {
      const uniqueDivisions = [...new Set(divisionValues.map(r => r.value))];
      console.log(`✅ Available division values (${uniqueDivisions.length}):`);
      uniqueDivisions.forEach(division => {
        console.log(`  - ${division}`);
      });
    }
    console.log('');

    // 3. Check for division data in qb_splits_advanced (Continuation)
    console.log('📋 3. Checking for division data in qb_splits_advanced...');
    
    const { data: advancedDivisionData, error: advancedDivisionError } = await supabase
      .from('qb_splits_advanced')
      .select('*')
      .eq('split', 'Continuation')
      .eq('season', 2024)
      .gte('att', 10)
      .order('att', { ascending: false })
      .limit(20);
    
    if (advancedDivisionError) {
      console.log(`❌ Error querying advanced division data:`, advancedDivisionError.message);
    } else {
      console.log(`✅ Found ${advancedDivisionData?.length || 0} Continuation records with 10+ attempts`);
      
      // Check if any of these are division-related
      const divisionKeywords = [
        'AFC East', 'AFC North', 'AFC South', 'AFC West',
        'NFC East', 'NFC North', 'NFC South', 'NFC West',
        'East', 'North', 'South', 'West'
      ];
      
      const divisionRelatedValues = advancedDivisionData?.filter(record => 
        record.value && divisionKeywords.some(keyword => record.value.includes(keyword))
      ) || [];
      
      console.log(`✅ Found ${divisionRelatedValues.length} division-related Continuation records`);
      if (divisionRelatedValues.length > 0) {
        console.log('📄 Division-related Continuation records:');
        divisionRelatedValues.slice(0, 10).forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.player_name} - ${record.value}: ${record.att} att, ${record.cmp} cmp, ${record.yds} yds`);
        });
      }
    }
    console.log('');

    // 4. Check all split types for division-related data
    console.log('📋 4. Checking all split types for division-related data...');
    
    const { data: allSplits, error: allSplitsError } = await supabase
      .from('qb_splits')
      .select('split, value')
      .eq('season', 2024)
      .not('split', 'is', null)
      .not('value', 'is', null);
    
    if (!allSplitsError && allSplits) {
      const divisionKeywords = [
        'AFC East', 'AFC North', 'AFC South', 'AFC West',
        'NFC East', 'NFC North', 'NFC South', 'NFC West',
        'East', 'North', 'South', 'West'
      ];
      
      const divisionRecords = allSplits.filter(record => 
        divisionKeywords.some(keyword => record.value.includes(keyword))
      );
      
      console.log(`✅ Found ${divisionRecords.length} division-related records across all split types:`);
      const splitMap = {};
      divisionRecords.forEach(record => {
        if (!splitMap[record.split]) {
          splitMap[record.split] = new Set();
        }
        splitMap[record.split].add(record.value);
      });
      
      Object.entries(splitMap).forEach(([split, values]) => {
        console.log(`  - ${split}: ${Array.from(values).join(', ')}`);
      });
    }
    console.log('');

    // 5. Check for division data in qb_splits_advanced
    console.log('📋 5. Checking for division data in qb_splits_advanced...');
    
    const { data: advancedSplits, error: advancedSplitsError } = await supabase
      .from('qb_splits_advanced')
      .select('split, value')
      .eq('season', 2024)
      .not('split', 'is', null)
      .not('value', 'is', null);
    
    if (!advancedSplitsError && advancedSplits) {
      const divisionKeywords = [
        'AFC East', 'AFC North', 'AFC South', 'AFC West',
        'NFC East', 'NFC North', 'NFC South', 'NFC West',
        'East', 'North', 'South', 'West'
      ];
      
      const divisionRecords = advancedSplits.filter(record => 
        divisionKeywords.some(keyword => record.value.includes(keyword))
      );
      
      console.log(`✅ Found ${divisionRecords.length} division-related records in qb_splits_advanced:`);
      const splitMap = {};
      divisionRecords.forEach(record => {
        if (!splitMap[record.split]) {
          splitMap[record.split] = new Set();
        }
        splitMap[record.split].add(record.value);
      });
      
      Object.entries(splitMap).forEach(([split, values]) => {
        console.log(`  - ${split}: ${Array.from(values).join(', ')}`);
      });
    }
    console.log('');

    console.log('✅ Investigation complete!');

  } catch (error) {
    console.error('❌ Error during investigation:', error);
  }
}

investigateDivisionData(); 