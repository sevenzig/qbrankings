/**
 * Check what split values actually exist in the database
 * This will help us understand the mismatch between our mapping and actual data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActualSplits() {
  console.log('🔍 Checking actual split values in database...\n');

  try {
    // Check qb_splits_advanced for 2024
    console.log('📋 qb_splits_advanced (2024):');
    const { data: advanced2024, error: advancedError } = await supabase
      .from('qb_splits_advanced')
      .select('split, value')
      .eq('season', 2024)
      .not('split', 'is', null)
      .limit(100);
    
    if (!advancedError && advanced2024 && advanced2024.length > 0) {
      const splitMap = {};
      advanced2024.forEach(record => {
        if (!splitMap[record.split]) {
          splitMap[record.split] = new Set();
        }
        splitMap[record.split].add(record.value);
      });
      
      Object.entries(splitMap).forEach(([split, values]) => {
        console.log(`  ${split}: ${Array.from(values).join(', ')}`);
      });
    } else {
      console.log('  No data found');
    }
    console.log('');

    // Check qb_splits for 2024
    console.log('📋 qb_splits (2024):');
    const { data: splits2024, error: splitsError } = await supabase
      .from('qb_splits')
      .select('split, value')
      .eq('season', 2024)
      .not('split', 'is', null)
      .limit(100);
    
    if (!splitsError && splits2024 && splits2024.length > 0) {
      const splitMap = {};
      splits2024.forEach(record => {
        if (!splitMap[record.split]) {
          splitMap[record.split] = new Set();
        }
        splitMap[record.split].add(record.value);
      });
      
      Object.entries(splitMap).forEach(([split, values]) => {
        console.log(`  ${split}: ${Array.from(values).join(', ')}`);
      });
    } else {
      console.log('  No data found');
    }
    console.log('');

    // Test a specific query to see what's happening
    console.log('📋 Testing specific queries (using correct database structure):');
    
    const testQueries = [
      { value: '3rd & 1-3' },
      { value: '3rd' },
      { value: 'Home' },
      { value: '4th Qtr' },
      { value: 'Red Zone' }
    ];

    for (const query of testQueries) {
      // Try qb_splits_advanced
      const { data: advancedData, error: advancedError } = await supabase
        .from('qb_splits_advanced')
        .select('*')
        .eq('split', 'other')
        .eq('value', query.value)
        .eq('season', 2024)
        .limit(1);
      
      if (!advancedError && advancedData && advancedData.length > 0) {
        console.log(`  ✅ qb_splits_advanced: ${query.value} (${advancedData.length} records)`);
      } else {
        console.log(`  ❌ qb_splits_advanced: ${query.value} (not found)`);
      }

      // Try qb_splits
      const { data: splitsData, error: splitsError } = await supabase
        .from('qb_splits')
        .select('*')
        .eq('split', 'other')
        .eq('value', query.value)
        .eq('season', 2024)
        .limit(1);
      
      if (!splitsError && splitsData && splitsData.length > 0) {
        console.log(`  ✅ qb_splits: ${query.value} (${splitsData.length} records)`);
      } else {
        console.log(`  ❌ qb_splits: ${query.value} (not found)`);
      }
    }

    console.log('\n🎉 Check complete!');

  } catch (error) {
    console.error('❌ Error checking splits:', error.message);
  }
}

// Run the check
checkActualSplits(); 