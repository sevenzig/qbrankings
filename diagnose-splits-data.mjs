/**
 * Diagnostic script to check what split data exists in the database
 * This will help us understand what splits are actually available
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseSplitsData() {
  console.log('🔍 Diagnosing splits data in database...\n');

  try {
    // Check if we can connect to the database
    console.log('📋 Step 1: Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('qb_splits_advanced')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      return;
    }
    console.log('✅ Database connection successful\n');

    // Check what tables exist and have data
    console.log('📋 Step 2: Checking table availability...');
    
    // Check qb_splits_advanced
    const { data: advancedData, error: advancedError } = await supabase
      .from('qb_splits_advanced')
      .select('*')
      .limit(5);
    
    if (advancedError) {
      console.log('❌ qb_splits_advanced table error:', advancedError.message);
    } else if (advancedData && advancedData.length > 0) {
      console.log(`✅ qb_splits_advanced has data (${advancedData.length} sample records)`);
      console.log('Sample record structure:', Object.keys(advancedData[0]));
    } else {
      console.log('⚠️ qb_splits_advanced table is empty or doesn\'t exist');
    }

    // Check qb_splits
    const { data: splitsData, error: splitsError } = await supabase
      .from('qb_splits')
      .select('*')
      .limit(5);
    
    if (splitsError) {
      console.log('❌ qb_splits table error:', splitsError.message);
    } else if (splitsData && splitsData.length > 0) {
      console.log(`✅ qb_splits has data (${splitsData.length} sample records)`);
      console.log('Sample record structure:', Object.keys(splitsData[0]));
    } else {
      console.log('⚠️ qb_splits table is empty or doesn\'t exist');
    }
    console.log('');

    // Check what split types exist in 2024
    console.log('📋 Step 3: Checking split types for 2024...');
    
    // Check qb_splits_advanced for 2024
    const { data: advanced2024, error: advanced2024Error } = await supabase
      .from('qb_splits_advanced')
      .select('split, value')
      .eq('season', 2024)
      .not('split', 'is', null);
    
    if (!advanced2024Error && advanced2024 && advanced2024.length > 0) {
      console.log(`✅ qb_splits_advanced has ${advanced2024.length} records for 2024`);
      
      const splitMap = {};
      advanced2024.forEach(record => {
        if (!splitMap[record.split]) {
          splitMap[record.split] = new Set();
        }
        splitMap[record.split].add(record.value);
      });
      
      console.log('Available split types in qb_splits_advanced:');
      Object.entries(splitMap).forEach(([split, values]) => {
        console.log(`  - ${split}: ${Array.from(values).join(', ')}`);
      });
    } else {
      console.log('⚠️ No 2024 data in qb_splits_advanced');
    }

    // Check qb_splits for 2024
    const { data: splits2024, error: splits2024Error } = await supabase
      .from('qb_splits')
      .select('split, value')
      .eq('season', 2024)
      .not('split', 'is', null);
    
    if (!splits2024Error && splits2024 && splits2024.length > 0) {
      console.log(`✅ qb_splits has ${splits2024.length} records for 2024`);
      
      const splitMap = {};
      splits2024.forEach(record => {
        if (!splitMap[record.split]) {
          splitMap[record.split] = new Set();
        }
        splitMap[record.split].add(record.value);
      });
      
      console.log('Available split types in qb_splits:');
      Object.entries(splitMap).forEach(([split, values]) => {
        console.log(`  - ${split}: ${Array.from(values).join(', ')}`);
      });
    } else {
      console.log('⚠️ No 2024 data in qb_splits');
    }
    console.log('');

    // Check what seasons have data
    console.log('📋 Step 4: Checking available seasons...');
    
    const { data: seasons, error: seasonsError } = await supabase
      .from('qb_splits_advanced')
      .select('season')
      .not('season', 'is', null);
    
    if (!seasonsError && seasons && seasons.length > 0) {
      const uniqueSeasons = [...new Set(seasons.map(s => s.season))].sort();
      console.log(`Available seasons in qb_splits_advanced: ${uniqueSeasons.join(', ')}`);
    } else {
      console.log('⚠️ No season data found in qb_splits_advanced');
    }

    const { data: seasons2, error: seasons2Error } = await supabase
      .from('qb_splits')
      .select('season')
      .not('season', 'is', null);
    
    if (!seasons2Error && seasons2 && seasons2.length > 0) {
      const uniqueSeasons = [...new Set(seasons2.map(s => s.season))].sort();
      console.log(`Available seasons in qb_splits: ${uniqueSeasons.join(', ')}`);
    } else {
      console.log('⚠️ No season data found in qb_splits');
    }
    console.log('');

    // Test specific queries that the tool might use
    console.log('📋 Step 5: Testing specific queries...');
    
    const testQueries = [
      { table: 'qb_splits_advanced', split: 'other', value: '3rd & 1-3', season: 2024 },
      { table: 'qb_splits_advanced', split: 'Down', value: '3rd', season: 2024 },
      { table: 'qb_splits', split: 'Down', value: '3rd', season: 2024 },
      { table: 'qb_splits_advanced', split: 'Place', value: 'Red Zone', season: 2024 },
      { table: 'qb_splits_advanced', split: 'Quarter', value: '4th', season: 2024 }
    ];

    for (const query of testQueries) {
      const { data, error } = await supabase
        .from(query.table)
        .select('*')
        .eq('split', query.split)
        .eq('value', query.value)
        .eq('season', query.season);
      
      if (error) {
        console.log(`❌ ${query.table} - ${query.split} = ${query.value}: ${error.message}`);
      } else {
        console.log(`✅ ${query.table} - ${query.split} = ${query.value}: ${data.length} records`);
      }
    }

    console.log('\n🎉 Diagnostic complete!');

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

// Run the diagnostic
diagnoseSplitsData(); 