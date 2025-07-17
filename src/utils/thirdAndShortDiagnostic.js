/**
 * 3rd & 1-3 Data Diagnostic Utility
 * 
 * This utility helps debug why 3rd & 1-3 data extraction is returning no results
 * by examining what data actually exists in the qb_splits table.
 */

import { supabase } from './supabase.js';

/**
 * Diagnostic function to examine qb_splits table structure and content
 */
export const diagnoseThirdAndShortData = async () => {
  console.log('🔍 Starting 3rd & 1-3 data diagnostic...\n');
  
  try {
    // 1. Check if qb_splits_advanced table exists and has data
    console.log('📊 Step 1: Checking qb_splits_advanced table structure...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('qb_splits_advanced')
      .select('*')
      .limit(5);
    
    if (tableError) {
      console.error('❌ Error accessing qb_splits table:', tableError);
      return;
    }
    
    if (!tableInfo || tableInfo.length === 0) {
      console.log('⚠️ qb_splits_advanced table is empty or doesn\'t exist');
      return;
    }
    
    console.log('✅ qb_splits_advanced table exists and has data');
    console.log('📋 Sample record structure:', Object.keys(tableInfo[0]));
    console.log('📋 Sample record:', tableInfo[0]);
    
    // 2. Check what split types exist
    console.log('\n📊 Step 2: Examining split types...');
    
    const { data: splitTypes, error: splitError } = await supabase
      .from('qb_splits_advanced')
      .select('split')
      .eq('season', 2024);
    
    if (splitError) {
      console.error('❌ Error fetching split types:', splitError);
      return;
    }
    
    const uniqueSplitTypes = [...new Set(splitTypes.map(s => s.split))];
    console.log(`📋 Found ${uniqueSplitTypes.length} unique split types in 2024:`);
    uniqueSplitTypes.forEach((split, index) => {
      console.log(`  ${index + 1}. "${split}"`);
    });
    
    // 3. Look for any splits containing "3rd" or "down"
    console.log('\n📊 Step 3: Searching for down-related splits...');
    
    const { data: downSplits, error: downError } = await supabase
      .from('qb_splits_advanced')
      .select('*')
      .eq('season', 2024)
      .or('split.ilike.%3rd%,split.ilike.%down%');
    
    if (downError) {
      console.error('❌ Error fetching down splits:', downError);
      return;
    }
    
    console.log(`📋 Found ${downSplits.length} down-related splits in 2024:`);
    if (downSplits.length > 0) {
      const uniqueDownTypes = [...new Set(downSplits.map(s => s.split))];
      uniqueDownTypes.forEach((split, index) => {
        console.log(`  ${index + 1}. "${split}"`);
      });
      
      // Show sample values for down splits
      console.log('\n📋 Sample down split values:');
      const sampleDownSplit = downSplits[0];
      if (sampleDownSplit) {
        console.log('  Sample record:', sampleDownSplit);
      }
    }
    
    // 4. Check for any splits containing "1-3" or "short"
    console.log('\n📊 Step 4: Searching for distance-related splits...');
    
    const { data: distanceSplits, error: distanceError } = await supabase
      .from('qb_splits_advanced')
      .select('*')
      .eq('season', 2024)
      .or('split.ilike.%1-3%,split.ilike.%short%,split.ilike.%distance%');
    
    if (distanceError) {
      console.error('❌ Error fetching distance splits:', distanceError);
      return;
    }
    
    console.log(`📋 Found ${distanceSplits.length} distance-related splits in 2024:`);
    if (distanceSplits.length > 0) {
      const uniqueDistanceTypes = [...new Set(distanceSplits.map(s => s.split))];
      uniqueDistanceTypes.forEach((split, index) => {
        console.log(`  ${index + 1}. "${split}"`);
      });
    }
    
    // 5. Check what QBs have any splits data in 2024
    console.log('\n📊 Step 5: Checking QBs with splits data in 2024...');
    
    const { data: qbsWithSplits, error: qbsError } = await supabase
      .from('qb_splits_advanced')
      .select('pfr_id, player_name')
      .eq('season', 2024);
    
    if (qbsError) {
      console.error('❌ Error fetching QBs with splits:', qbsError);
      return;
    }
    
    const uniqueQBs = [...new Set(qbsWithSplits.map(q => q.pfr_id))];
    console.log(`📋 Found ${uniqueQBs.length} QBs with splits data in 2024`);
    
    if (uniqueQBs.length > 0) {
      console.log('📋 Sample QBs with splits:');
      uniqueQBs.slice(0, 10).forEach((pfrId, index) => {
        const qbName = qbsWithSplits.find(q => q.pfr_id === pfrId)?.player_name || 'Unknown';
        console.log(`  ${index + 1}. ${qbName} (${pfrId})`);
      });
    }
    
    // 6. Try the exact query that's failing
    console.log('\n📊 Step 6: Testing the exact failing query...');
    
    const { data: exactQuery, error: exactError } = await supabase
      .from('qb_splits_advanced')
      .select('*')
      .eq('season', 2024)
      .eq('split', '3rd & 1-3')
      .eq('value', '1-3');
    
    if (exactError) {
      console.error('❌ Error with exact query:', exactError);
    } else {
      console.log(`📋 Exact query returned ${exactQuery.length} results`);
      if (exactQuery.length > 0) {
        console.log('📋 Sample result:', exactQuery[0]);
      }
    }
    
    // 7. Try a broader search
    console.log('\n📊 Step 7: Trying broader search patterns...');
    
    const searchPatterns = [
      'split.ilike.%3rd%',
      'split.ilike.%third%',
      'split.ilike.%1-3%',
      'split.ilike.%short%',
      'value.ilike.%1-3%',
      'value.ilike.%short%',
      'value.eq.3rd',
      'value.eq.4th',
      'split.eq.3rd & 1-3',
      'value.eq.1-3'
    ];
    
    for (const pattern of searchPatterns) {
      const { data: patternResults, error: patternError } = await supabase
        .from('qb_splits_advanced')
        .select('*')
        .eq('season', 2024)
        .or(pattern);
      
      if (!patternError && patternResults.length > 0) {
        console.log(`✅ Pattern "${pattern}" found ${patternResults.length} results`);
        console.log(`  Sample: "${patternResults[0].split}" = "${patternResults[0].value}"`);
      }
    }
    
    console.log('\n🔍 Diagnostic complete!');
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  }
};

/**
 * Get all available split types for a specific season
 */
export const getAllSplitTypes = async (season = 2024) => {
  try {
    const { data, error } = await supabase
      .from('qb_splits_advanced')
      .select('split, value')
      .eq('season', season);
    
    if (error) {
      throw error;
    }
    
    const splitMap = {};
    data.forEach(record => {
      if (!splitMap[record.split]) {
        splitMap[record.split] = new Set();
      }
      splitMap[record.split].add(record.value);
    });
    
    return splitMap;
    
  } catch (error) {
    console.error('❌ Error getting split types:', error);
    return {};
  }
};

/**
 * Find QBs with specific split patterns
 */
export const findQBsWithSplitPattern = async (pattern, season = 2024) => {
  try {
    const { data, error } = await supabase
      .from('qb_splits_advanced')
      .select('*')
      .eq('season', season)
      .or(`split.ilike.%${pattern}%,value.ilike.%${pattern}%`);
    
    if (error) {
      throw error;
    }
    
    return data;
    
  } catch (error) {
    console.error(`❌ Error finding QBs with pattern "${pattern}":`, error);
    return [];
  }
};

/**
 * Find QB by name (case-insensitive search)
 */
export const findQBByName = async (playerName, season = 2024) => {
  try {
    const { data, error } = await supabase
      .from('qb_splits_advanced')
      .select('pfr_id, player_name')
      .eq('season', season)
      .ilike('player_name', `%${playerName}%`);
    
    if (error) {
      throw error;
    }
    
    // Remove duplicates and return unique QBs
    const uniqueQBs = data.reduce((acc, qb) => {
      if (!acc.find(q => q.pfr_id === qb.pfr_id)) {
        acc.push(qb);
      }
      return acc;
    }, []);
    
    return uniqueQBs;
    
  } catch (error) {
    console.error(`❌ Error finding QB "${playerName}":`, error);
    return [];
  }
}; 