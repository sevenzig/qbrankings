/**
 * Diagnostic script to check what data exists in qb_splits and qb_splits_advanced tables
 * This will help us understand why the splits comparison tool isn't loading data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseSplitsData() {
  console.log('🔍 Diagnosing splits data in database...\n');

  try {
    // 1. Check if tables exist and have data
    console.log('📋 1. Checking table existence and data counts...');
    
    const { data: splitsCount, error: splitsCountError } = await supabase
      .from('qb_splits')
      .select('*', { count: 'exact', head: true });
    
    const { data: advancedCount, error: advancedCountError } = await supabase
      .from('qb_splits_advanced')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ qb_splits: ${splitsCount?.length || 0} records`);
    console.log(`✅ qb_splits_advanced: ${advancedCount?.length || 0} records`);
    
    if (splitsCountError) console.log(`❌ qb_splits error:`, splitsCountError);
    if (advancedCountError) console.log(`❌ qb_splits_advanced error:`, advancedCountError);
    console.log('');

    // 2. Check what split types exist
    console.log('📋 2. Checking available split types...');
    
    const { data: splitTypes, error: splitTypesError } = await supabase
      .from('qb_splits')
      .select('split')
      .not('split', 'is', null);
    
    const { data: advancedSplitTypes, error: advancedSplitTypesError } = await supabase
      .from('qb_splits_advanced')
      .select('split')
      .not('split', 'is', null);
    
    if (!splitTypesError && splitTypes) {
      const uniqueSplits = [...new Set(splitTypes.map(r => r.split))];
      console.log(`✅ qb_splits split types: ${uniqueSplits.join(', ')}`);
    }
    
    if (!advancedSplitTypesError && advancedSplitTypes) {
      const uniqueAdvancedSplits = [...new Set(advancedSplitTypes.map(r => r.split))];
      console.log(`✅ qb_splits_advanced split types: ${uniqueAdvancedSplits.join(', ')}`);
    }
    console.log('');

    // 3. Check what values exist for 'other' split
    console.log('📋 3. Checking values for "other" split type...');
    
    const { data: otherValues, error: otherValuesError } = await supabase
      .from('qb_splits')
      .select('value')
      .eq('split', 'other')
      .not('value', 'is', null);
    
    const { data: advancedOtherValues, error: advancedOtherValuesError } = await supabase
      .from('qb_splits_advanced')
      .select('value')
      .eq('split', 'other')
      .not('value', 'is', null);
    
    if (!otherValuesError && otherValues) {
      const uniqueOtherValues = [...new Set(otherValues.map(r => r.value))];
      console.log(`✅ qb_splits "other" values: ${uniqueOtherValues.join(', ')}`);
    }
    
    if (!advancedOtherValuesError && advancedOtherValues) {
      const uniqueAdvancedOtherValues = [...new Set(advancedOtherValues.map(r => r.value))];
      console.log(`✅ qb_splits_advanced "other" values: ${uniqueAdvancedOtherValues.join(', ')}`);
    }
    console.log('');

    // 4. Check for "3rd & 1-3" specifically
    console.log('📋 4. Checking for "3rd & 1-3" data...');
    
    const { data: thirdAndShort, error: thirdAndShortError } = await supabase
      .from('qb_splits')
      .select('*')
      .eq('split', 'other')
      .eq('value', '3rd & 1-3')
      .limit(5);
    
    const { data: advancedThirdAndShort, error: advancedThirdAndShortError } = await supabase
      .from('qb_splits_advanced')
      .select('*')
      .eq('split', 'other')
      .eq('value', '3rd & 1-3')
      .limit(5);
    
    console.log(`✅ qb_splits "3rd & 1-3" records: ${thirdAndShort?.length || 0}`);
    console.log(`✅ qb_splits_advanced "3rd & 1-3" records: ${advancedThirdAndShort?.length || 0}`);
    
    if (thirdAndShort && thirdAndShort.length > 0) {
      console.log('📄 Sample qb_splits record:', thirdAndShort[0]);
    }
    
    if (advancedThirdAndShort && advancedThirdAndShort.length > 0) {
      console.log('📄 Sample qb_splits_advanced record:', advancedThirdAndShort[0]);
    }
    console.log('');

    // 5. Check for any data with "3rd" in the value
    console.log('📋 5. Checking for any data containing "3rd"...');
    
    const { data: anyThirdData, error: anyThirdError } = await supabase
      .from('qb_splits')
      .select('split, value')
      .ilike('value', '%3rd%')
      .limit(10);
    
    const { data: advancedAnyThirdData, error: advancedAnyThirdError } = await supabase
      .from('qb_splits_advanced')
      .select('split, value')
      .ilike('value', '%3rd%')
      .limit(10);
    
    if (!anyThirdError && anyThirdData) {
      console.log('✅ qb_splits values containing "3rd":');
      anyThirdData.forEach(record => {
        console.log(`  - split: "${record.split}", value: "${record.value}"`);
      });
    }
    
    if (!advancedAnyThirdError && advancedAnyThirdData) {
      console.log('✅ qb_splits_advanced values containing "3rd":');
      advancedAnyThirdData.forEach(record => {
        console.log(`  - split: "${record.split}", value: "${record.value}"`);
      });
    }
    console.log('');

    // 6. Check for any data with "1-3" in the value
    console.log('📋 6. Checking for any data containing "1-3"...');
    
    const { data: anyShortData, error: anyShortError } = await supabase
      .from('qb_splits')
      .select('split, value')
      .ilike('value', '%1-3%')
      .limit(10);
    
    const { data: advancedAnyShortData, error: advancedAnyShortError } = await supabase
      .from('qb_splits_advanced')
      .select('split, value')
      .ilike('value', '%1-3%')
      .limit(10);
    
    if (!anyShortError && anyShortData) {
      console.log('✅ qb_splits values containing "1-3":');
      anyShortData.forEach(record => {
        console.log(`  - split: "${record.split}", value: "${record.value}"`);
      });
    }
    
    if (!advancedAnyShortError && advancedAnyShortData) {
      console.log('✅ qb_splits_advanced values containing "1-3":');
      advancedAnyShortData.forEach(record => {
        console.log(`  - split: "${record.split}", value: "${record.value}"`);
      });
    }
    console.log('');

    // 7. Check what seasons have data
    console.log('📋 7. Checking available seasons...');
    
    const { data: seasons, error: seasonsError } = await supabase
      .from('qb_splits')
      .select('season')
      .order('season', { ascending: false });
    
    const { data: advancedSeasons, error: advancedSeasonsError } = await supabase
      .from('qb_splits_advanced')
      .select('season')
      .order('season', { ascending: false });
    
    if (!seasonsError && seasons) {
      const uniqueSeasons = [...new Set(seasons.map(r => r.season))];
      console.log(`✅ qb_splits seasons: ${uniqueSeasons.join(', ')}`);
    }
    
    if (!advancedSeasonsError && advancedSeasons) {
      const uniqueAdvancedSeasons = [...new Set(advancedSeasons.map(r => r.season))];
      console.log(`✅ qb_splits_advanced seasons: ${uniqueAdvancedSeasons.join(', ')}`);
    }
    console.log('');

    // 8. Check for any data in 2024
    console.log('📋 8. Checking 2024 data specifically...');
    
    const { data: splits2024, error: splits2024Error } = await supabase
      .from('qb_splits')
      .select('split, value')
      .eq('season', 2024)
      .limit(10);
    
    const { data: advanced2024, error: advanced2024Error } = await supabase
      .from('qb_splits_advanced')
      .select('split, value')
      .eq('season', 2024)
      .limit(10);
    
    if (!splits2024Error && splits2024) {
      console.log('✅ qb_splits 2024 data:');
      splits2024.forEach(record => {
        console.log(`  - split: "${record.split}", value: "${record.value}"`);
      });
    }
    
    if (!advanced2024Error && advanced2024) {
      console.log('✅ qb_splits_advanced 2024 data:');
      advanced2024.forEach(record => {
        console.log(`  - split: "${record.split}", value: "${record.value}"`);
      });
    }
    console.log('');

    console.log('✅ Diagnostic complete!');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  }
}

diagnoseSplitsData(); 