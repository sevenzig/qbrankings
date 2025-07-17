/**
 * Example Usage: 3rd & 1-3 Data Extraction
 * 
 * This file demonstrates how to extract and analyze 3rd & 1-3 splits data
 * for NFL quarterbacks from your Supabase database.
 */

import { 
  extractThirdAndShortData2024,
  extractThirdAndShortDataForQB,
  getThirdAndShortSummary,
  analyzeThirdAndShortData,
  getTopPerformers,
  compareQBs,
  exportToCSV
} from './thirdAndShortExtractor.js';

/**
 * Example 1: Extract all 3rd & 1-3 data for 2024
 */
export const example1_ExtractAllData = async () => {
  try {
    console.log('📊 Example 1: Extracting all 3rd & 1-3 data for 2024...');
    
    const data = await extractThirdAndShortData2024();
    
    console.log(`✅ Extracted ${data.length} records`);
    console.log('Sample record:', data[0]);
    
    return data;
    
  } catch (error) {
    console.error('❌ Error in Example 1:', error);
  }
};

/**
 * Example 2: Get summary statistics
 */
export const example2_GetSummary = async () => {
  try {
    console.log('📊 Example 2: Getting summary statistics...');
    
    const summary = await getThirdAndShortSummary();
    
    console.log('📈 Summary Statistics:');
    console.log(`- Total QBs: ${summary.totalQBs}`);
    console.log(`- Total Attempts: ${summary.totalAttempts}`);
    console.log(`- Average Completion Rate: ${summary.averageCompletionRate}%`);
    console.log(`- Average Yards per Attempt: ${summary.averageYardsPerAttempt}`);
    console.log(`- Average TD Rate: ${summary.averageTDsPerAttempt}%`);
    console.log(`- Average INT Rate: ${summary.averageIntsPerAttempt}%`);
    
    return summary;
    
  } catch (error) {
    console.error('❌ Error in Example 2:', error);
  }
};

/**
 * Example 3: Get top performers by completion rate
 */
export const example3_TopPerformers = async () => {
  try {
    console.log('📊 Example 3: Getting top performers...');
    
    const data = await extractThirdAndShortData2024();
    
    // Top 10 by completion rate (minimum 10 attempts)
    const topCompletion = getTopPerformers(data, 'completion_rate', 10, 10);
    
    console.log('🏆 Top 10 by Completion Rate:');
    topCompletion.forEach((qb, index) => {
      console.log(`${index + 1}. ${qb.player_name} (${qb.team}): ${qb.completion_rate}% (${qb.totalAttempts} att)`);
    });
    
    // Top 10 by yards per attempt
    const topYardsPerAttempt = getTopPerformers(data, 'yards_per_attempt', 10, 10);
    
    console.log('\n🏆 Top 10 by Yards per Attempt:');
    topYardsPerAttempt.forEach((qb, index) => {
      console.log(`${index + 1}. ${qb.player_name} (${qb.team}): ${qb.yards_per_attempt} Y/A (${qb.totalAttempts} att)`);
    });
    
    return { topCompletion, topYardsPerAttempt };
    
  } catch (error) {
    console.error('❌ Error in Example 3:', error);
  }
};

/**
 * Example 4: Compare two specific QBs
 */
export const example4_CompareQBs = async () => {
  try {
    console.log('📊 Example 4: Comparing two QBs...');
    
    // First, find the correct player IDs
    console.log('🔍 Finding player IDs...');
    const { supabase } = await import('../utils/supabase.js');
    
    // Find Mahomes
    const { data: mahomesSearch, error: mahomesError } = await supabase
      .from('qb_splits_advanced')
      .select('pfr_id, player_name')
      .eq('season', 2024)
      .ilike('player_name', '%Patrick Mahomes%')
      .limit(1);
    
    if (mahomesError || !mahomesSearch || mahomesSearch.length === 0) {
      throw new Error('Could not find Mahomes in database');
    }
    
    // Find Allen
    const { data: allenSearch, error: allenError } = await supabase
      .from('qb_splits_advanced')
      .select('pfr_id, player_name')
      .eq('season', 2024)
      .ilike('player_name', '%Josh Allen%')
      .limit(1);
    
    if (allenError || !allenSearch || allenSearch.length === 0) {
      throw new Error('Could not find Allen in database');
    }
    
    const mahomesId = mahomesSearch[0].pfr_id;
    const allenId = allenSearch[0].pfr_id;
    
    console.log(`✅ Found Mahomes: ${mahomesId} (${mahomesSearch[0].player_name})`);
    console.log(`✅ Found Allen: ${allenId} (${allenSearch[0].player_name})`);
    
    // Compare Mahomes vs Allen (using their correct PFR IDs)
    const comparison = await compareQBs(mahomesId, allenId);
    
    console.log('🆚 QB Comparison (Mahomes vs Allen):');
    console.log('Mahomes:');
    console.log(`- Completion Rate: ${comparison.qb1.completionRate.toFixed(1)}%`);
    console.log(`- Yards per Attempt: ${comparison.qb1.yardsPerAttempt.toFixed(1)}`);
    console.log(`- TD Rate: ${comparison.qb1.tdRate.toFixed(1)}%`);
    console.log(`- INT Rate: ${comparison.qb1.intRate.toFixed(1)}%`);
    
    console.log('\nAllen:');
    console.log(`- Completion Rate: ${comparison.qb2.completionRate.toFixed(1)}%`);
    console.log(`- Yards per Attempt: ${comparison.qb2.yardsPerAttempt.toFixed(1)}`);
    console.log(`- TD Rate: ${comparison.qb2.tdRate.toFixed(1)}%`);
    console.log(`- INT Rate: ${comparison.qb2.intRate.toFixed(1)}%`);
    
    console.log('\nDifferences (Mahomes - Allen):');
    console.log(`- Completion Rate: ${comparison.comparison.completionRateDiff.toFixed(1)}%`);
    console.log(`- Yards per Attempt: ${comparison.comparison.yardsPerAttemptDiff.toFixed(1)}`);
    console.log(`- TD Rate: ${comparison.comparison.tdRateDiff.toFixed(1)}%`);
    console.log(`- INT Rate: ${comparison.comparison.intRateDiff.toFixed(1)}%`);
    
    return comparison;
    
  } catch (error) {
    console.error('❌ Error in Example 4:', error);
  }
};

/**
 * Example 5: Comprehensive analysis
 */
export const example5_ComprehensiveAnalysis = async () => {
  try {
    console.log('📊 Example 5: Running comprehensive analysis...');
    
    const analysis = await analyzeThirdAndShortData();
    
    console.log('📋 Analysis Complete!');
    console.log(`- Total QBs analyzed: ${analysis.summary.totalQBs}`);
    console.log(`- Teams represented: ${Object.keys(analysis.teamAnalysis).length}`);
    console.log(`- QBs with 10+ attempts: ${analysis.qualifiedQBs.length}`);
    
    // Export to CSV
    const csvData = analysis.exportCSV();
    console.log(`- CSV export length: ${csvData.length} characters`);
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Error in Example 5:', error);
  }
};

/**
 * Example 6: Extract data for a specific QB
 */
export const example6_SpecificQB = async () => {
  try {
    console.log('📊 Example 6: Extracting data for specific QB...');
    
    // First, find Mahomes' correct player ID
    console.log('🔍 Finding Mahomes\' player ID...');
    const { supabase } = await import('../utils/supabase.js');
    
    const { data: mahomesSearch, error: searchError } = await supabase
      .from('qb_splits_advanced')
      .select('pfr_id, player_name')
      .eq('season', 2024)
      .ilike('player_name', '%Patrick Mahomes%')
      .limit(5);
    
    if (searchError) {
      throw new Error(`Error searching for Mahomes: ${searchError.message}`);
    }
    
    if (!mahomesSearch || mahomesSearch.length === 0) {
      throw new Error('No Mahomes found in database');
    }
    
    const mahomesId = mahomesSearch[0].pfr_id;
    console.log(`✅ Found Mahomes with ID: ${mahomesId} (${mahomesSearch[0].player_name})`);
    
    // Extract data for Patrick Mahomes using correct ID
    const mahomesData = await extractThirdAndShortDataForQB(mahomesId);
    
    console.log(`✅ Extracted ${mahomesData.length} records for Patrick Mahomes`);
    
    if (mahomesData.length > 0) {
      console.log('Sample record:', mahomesData[0]);
      
      // Calculate totals
      const totals = mahomesData.reduce((acc, record) => {
        acc.attempts += parseInt(record.att) || 0;
        acc.completions += parseInt(record.cmp) || 0;
        acc.yards += parseInt(record.yds) || 0;
        acc.tds += parseInt(record.td) || 0;
        acc.ints += parseInt(record.int) || 0;
        return acc;
      }, { attempts: 0, completions: 0, yards: 0, tds: 0, ints: 0 });
      
      console.log('Mahomes 3rd & 1-3 Totals:');
      console.log(`- Attempts: ${totals.attempts}`);
      console.log(`- Completions: ${totals.completions}`);
      console.log(`- Yards: ${totals.yards}`);
      console.log(`- TDs: ${totals.tds}`);
      console.log(`- INTs: ${totals.ints}`);
      console.log(`- Completion Rate: ${totals.attempts > 0 ? (totals.completions / totals.attempts * 100).toFixed(1) : 0}%`);
    }
    
    return mahomesData;
    
  } catch (error) {
    console.error('❌ Error in Example 6:', error);
  }
};

/**
 * Run all examples
 */
export const runAllExamples = async () => {
  console.log('🚀 Running all 3rd & 1-3 data extraction examples...\n');
  
  try {
    // Run examples sequentially
    await example1_ExtractAllData();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await example2_GetSummary();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await example3_TopPerformers();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await example4_CompareQBs();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await example5_ComprehensiveAnalysis();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await example6_SpecificQB();
    
    console.log('\n✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
};

// All functions are already exported individually above 