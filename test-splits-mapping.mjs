/**
 * Test script for Splits Mapping System
 * Verifies that split values are being properly categorized
 */

import { 
  getSplitTypeForValue, 
  organizeSplitsByCategory, 
  getPopularSplits,
  getSplitTypeDescriptions,
  SPLITS_MAPPING 
} from './src/utils/splitsMapping.js';

function testSplitsMapping() {
  console.log('🧪 Testing Splits Mapping System...\n');

  // Test 1: Direct mapping lookup
  console.log('📋 Test 1: Direct mapping lookup');
  const testValues = [
    '3rd & 1-3',
    'Red Zone',
    '4th Qtr',
    'Home',
    'Win',
    'Shotgun',
    'play action',
    'Leading',
    'AFC',
    'dome'
  ];

  testValues.forEach(value => {
    const mappedType = getSplitTypeForValue(value);
    console.log(`  ${value} → ${mappedType}`);
  });
  console.log('');

  // Test 2: Pattern matching fallback
  console.log('📋 Test 2: Pattern matching fallback');
  const patternTestValues = [
    '3rd down',
    '4th quarter',
    'home games',
    'winning situations',
    'early games',
    'afc teams',
    'red zone plays',
    'leading by 10',
    'huddle formation',
    'quick release'
  ];

  patternTestValues.forEach(value => {
    const mappedType = getSplitTypeForValue(value);
    console.log(`  ${value} → ${mappedType}`);
  });
  console.log('');

  // Test 3: Popular splits
  console.log('📋 Test 3: Popular splits');
  const popularSplits = getPopularSplits();
  popularSplits.forEach(split => {
    console.log(`  ${split.description} (${split.split} = ${split.value})`);
  });
  console.log('');

  // Test 4: Split type descriptions
  console.log('📋 Test 4: Split type descriptions');
  const descriptions = getSplitTypeDescriptions();
  Object.entries(descriptions).forEach(([type, description]) => {
    console.log(`  ${type}: ${description}`);
  });
  console.log('');

  // Test 5: Sample data organization
  console.log('📋 Test 5: Sample data organization');
  const sampleData = [
    { split: 'Down', value: '3rd', table_source: 'qb_splits' },
    { split: 'Place', value: 'Home', table_source: 'qb_splits' },
    { split: 'Result', value: 'Win', table_source: 'qb_splits' },
    { split: 'Quarter', value: '4th Qtr', table_source: 'qb_splits_advanced' },
    { split: 'Field Position', value: 'Red Zone', table_source: 'qb_splits_advanced' },
    { split: 'Snap Type & Huddle', value: 'Shotgun', table_source: 'qb_splits_advanced' }
  ];

  const organized = organizeSplitsByCategory(sampleData);
  Object.entries(organized).forEach(([category, data]) => {
    console.log(`  ${category}: ${data.values.join(', ')} (${data.table})`);
  });
  console.log('');

  // Test 6: Mapping coverage
  console.log('📋 Test 6: Mapping coverage');
  const mappingKeys = Object.keys(SPLITS_MAPPING);
  const uniqueTypes = [...new Set(Object.values(SPLITS_MAPPING))];
  console.log(`  Total mapped values: ${mappingKeys.length}`);
  console.log(`  Unique split types: ${uniqueTypes.length}`);
  console.log(`  Split types: ${uniqueTypes.join(', ')}`);
  console.log('');

  console.log('✅ Splits mapping tests completed!');
}

// Run the tests
testSplitsMapping(); 