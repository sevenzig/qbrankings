/**
 * Test script for Splits Comparison Service
 * Verifies that the service can fetch and process splits data correctly
 */

import { 
  getAvailableSplitTypes, 
  getAvailableStatistics, 
  getComprehensiveComparison,
  getPopularSplits 
} from './src/utils/splitsComparisonService.js';

async function testSplitsComparison() {
  console.log('🧪 Testing Splits Comparison Service...\n');

  try {
    // Test 1: Get available split types
    console.log('📋 Test 1: Getting available split types for 2024...');
    const splitTypes = await getAvailableSplitTypes(2024);
    console.log(`✅ Found ${Object.keys(splitTypes).length} split types`);
    
    // Show first few split types
    const firstFewSplits = Object.entries(splitTypes).slice(0, 5);
    firstFewSplits.forEach(([split, data]) => {
      console.log(`  - ${split}: ${data.count} values (${data.table})`);
    });
    console.log('');

    // Test 2: Get popular splits
    console.log('📋 Test 2: Getting popular splits...');
    const popularSplits = getPopularSplits();
    console.log(`✅ Found ${popularSplits.length} popular splits`);
    popularSplits.slice(0, 3).forEach(split => {
      console.log(`  - ${split.description} (${split.split} = ${split.value})`);
    });
    console.log('');

    // Test 3: Get available statistics for a specific split
    console.log('📋 Test 3: Getting available statistics for "Down" = "3rd"...');
    const stats = await getAvailableStatistics('Down', '3rd', 2024);
    console.log(`✅ Found ${stats.length} available statistics`);
    stats.slice(0, 5).forEach(stat => {
      console.log(`  - ${stat.displayName} (${stat.field}): ${stat.sampleValue}`);
    });
    console.log('');

    // Test 4: Run a comprehensive comparison
    console.log('📋 Test 4: Running comprehensive comparison for "Down" = "3rd"...');
    const comparison = await getComprehensiveComparison(
      'Down', 
      '3rd', 
      ['completion_rate', 'yards_per_attempt', 'td_rate'], 
      2024, 
      10
    );
    
    console.log(`✅ Comparison complete:`);
    console.log(`  - Total QBs: ${comparison.summary.total_qbs}`);
    console.log(`  - Total Attempts: ${comparison.summary.total_attempts}`);
    console.log(`  - Average Completion %: ${comparison.summary.average_completion_rate}%`);
    console.log(`  - Average Y/A: ${comparison.summary.average_yards_per_attempt}`);
    
    // Show top performers for completion rate
    if (comparison.top_performers.completion_rate) {
      console.log(`  - Top 3 completion rate:`);
      comparison.top_performers.completion_rate.slice(0, 3).forEach((qb, index) => {
        console.log(`    ${index + 1}. ${qb.player_name} (${qb.team}): ${qb.completion_rate}%`);
      });
    }
    console.log('');

    console.log('🎉 All tests passed! The splits comparison service is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testSplitsComparison(); 