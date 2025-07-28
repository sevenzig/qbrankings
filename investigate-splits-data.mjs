/**
 * Detailed investigation of splits data structure
 * This will help us understand why many split values aren't loading
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

async function investigateSplitsData() {
  console.log('🔍 Detailed investigation of splits data structure...\n');

  try {
    // 1. Check actual record counts
    console.log('📋 1. Checking actual record counts...');
    
    const { count: splitsCount, error: splitsCountError } = await supabase
      .from('qb_splits')
      .select('*', { count: 'exact', head: true });
    
    const { count: advancedCount, error: advancedCountError } = await supabase
      .from('qb_splits_advanced')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ qb_splits total records: ${splitsCount || 0}`);
    console.log(`✅ qb_splits_advanced total records: ${advancedCount || 0}`);
    
    if (splitsCountError) console.log(`❌ qb_splits count error:`, splitsCountError.message);
    if (advancedCountError) console.log(`❌ qb_splits_advanced count error:`, advancedCountError.message);
    console.log('');

    // 2. Check what split types actually exist in qb_splits_advanced
    console.log('📋 2. Checking actual split types in qb_splits_advanced...');
    
    const { data: advancedSplitTypes, error: advancedSplitTypesError } = await supabase
      .from('qb_splits_advanced')
      .select('split, value')
      .not('split', 'is', null)
      .not('value', 'is', null);
    
    if (!advancedSplitTypesError && advancedSplitTypes) {
      const splitMap = {};
      advancedSplitTypes.forEach(record => {
        if (!splitMap[record.split]) {
          splitMap[record.split] = new Set();
        }
        splitMap[record.split].add(record.value);
      });
      
      console.log('✅ qb_splits_advanced split types and values:');
      Object.entries(splitMap).forEach(([split, values]) => {
        console.log(`  - ${split}: ${Array.from(values).join(', ')}`);
      });
    }
    console.log('');

    // 3. Check what split types actually exist in qb_splits
    console.log('📋 3. Checking actual split types in qb_splits...');
    
    const { data: splitsSplitTypes, error: splitsSplitTypesError } = await supabase
      .from('qb_splits')
      .select('split, value')
      .not('split', 'is', null)
      .not('value', 'is', null);
    
    if (!splitsSplitTypesError && splitsSplitTypes) {
      const splitMap = {};
      splitsSplitTypes.forEach(record => {
        if (!splitMap[record.split]) {
          splitMap[record.split] = new Set();
        }
        splitMap[record.split].add(record.value);
      });
      
      console.log('✅ qb_splits split types and values:');
      Object.entries(splitMap).forEach(([split, values]) => {
        console.log(`  - ${split}: ${Array.from(values).join(', ')}`);
      });
    }
    console.log('');

    // 4. Check for "Continuation" split type specifically
    console.log('📋 4. Investigating "Continuation" split type...');
    
    const { data: continuationData, error: continuationError } = await supabase
      .from('qb_splits_advanced')
      .select('*')
      .eq('split', 'Continuation')
      .limit(10);
    
    if (!continuationError && continuationData && continuationData.length > 0) {
      console.log(`✅ Found ${continuationData.length} Continuation records`);
      console.log('📄 Sample Continuation record:');
      console.log(JSON.stringify(continuationData[0], null, 2));
    }
    console.log('');

    // 5. Check for actual "Down" split type
    console.log('📋 5. Checking for "Down" split type...');
    
    const { data: downData, error: downError } = await supabase
      .from('qb_splits_advanced')
      .select('*')
      .eq('split', 'Down')
      .limit(5);
    
    if (!downError && downData) {
      console.log(`✅ Found ${downData.length} Down records`);
      if (downData.length > 0) {
        console.log('📄 Sample Down record:');
        console.log(JSON.stringify(downData[0], null, 2));
      }
    }
    console.log('');

    // 6. Check for actual "Yards To Go" split type
    console.log('📋 6. Checking for "Yards To Go" split type...');
    
    const { data: yardsData, error: yardsError } = await supabase
      .from('qb_splits_advanced')
      .select('*')
      .eq('split', 'Yards To Go')
      .limit(5);
    
    if (!yardsError && yardsData) {
      console.log(`✅ Found ${yardsData.length} Yards To Go records`);
      if (yardsData.length > 0) {
        console.log('📄 Sample Yards To Go record:');
        console.log(JSON.stringify(yardsData[0], null, 2));
      }
    }
    console.log('');

    // 7. Check for actual "Place" split type in qb_splits
    console.log('📋 7. Checking for "Place" split type in qb_splits...');
    
    const { data: placeData, error: placeError } = await supabase
      .from('qb_splits')
      .select('*')
      .eq('split', 'Place')
      .limit(5);
    
    if (!placeError && placeData) {
      console.log(`✅ Found ${placeData.length} Place records`);
      if (placeData.length > 0) {
        console.log('📄 Sample Place record:');
        console.log(JSON.stringify(placeData[0], null, 2));
      }
    }
    console.log('');

    // 8. Check what seasons have data
    console.log('📋 8. Checking seasons with data...');
    
    const { data: seasonsData, error: seasonsError } = await supabase
      .from('qb_splits_advanced')
      .select('season')
      .not('season', 'is', null);
    
    if (!seasonsError && seasonsData) {
      const uniqueSeasons = [...new Set(seasonsData.map(r => r.season))];
      console.log(`✅ Seasons in qb_splits_advanced: ${uniqueSeasons.join(', ')}`);
    }
    
    const { data: splitsSeasonsData, error: splitsSeasonsError } = await supabase
      .from('qb_splits')
      .select('season')
      .not('season', 'is', null);
    
    if (!splitsSeasonsError && splitsSeasonsData) {
      const uniqueSeasons = [...new Set(splitsSeasonsData.map(r => r.season))];
      console.log(`✅ Seasons in qb_splits: ${uniqueSeasons.join(', ')}`);
    }
    console.log('');

    console.log('✅ Investigation complete!');

  } catch (error) {
    console.error('❌ Error during investigation:', error);
  }
}

investigateSplitsData(); 