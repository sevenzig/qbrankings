import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { 
  getAvailableSplitTypes, 
  getAvailableStatistics, 
  getComprehensiveComparison,
  getAllDataForSplit
} from '../utils/splitsComparisonService.js';
import { getTeamInfo } from '../constants/teamData.js';
import { getSplitTypeForValue, getSplitTypeDescriptions } from '../utils/splitsMapping.js';


/**
 * SplitsComparison - QB splits comparison tool with performance optimizations
 * 
 * Performance Optimizations:
 * 1. Memoized with React.memo to prevent unnecessary re-renders
 * 2. useCallback for all event handlers and data processing functions
 * 3. useMemo for expensive calculations and data transformations
 * 4. Single responsibility principle - splits comparison functionality only
 */

// Scrollbar styles are now handled globally in index.css

// Column abbreviation mapping
const COLUMN_ABBREVIATIONS = {
  attempts: 'Att',
  att: 'Att',
  completions: 'Comp',
  cmp: 'Comp',
  touchdowns: 'TD',
  td: 'TD',
  interceptions: 'INT',
  int: 'INT',
  yards: 'Yds',
  yds: 'Yds',
  completion_rate: 'Comp%',
  completion_pct: 'Comp%',
  cmp_pct: 'Comp%',
  yards_per_attempt: 'Y/A',
  y_a: 'Y/A',
  average_yards_per_attempt: 'Y/A',
  passer_rating: 'Rate',
  rate: 'Rate',
  games: 'G',
  games_played: 'G',
  g: 'G',
  team: 'Team',
  player: 'Player',
  player_name: 'Player',
  pfr_id: 'PFR ID',
  season: 'Season',
  source: 'Source',
  table_source: 'Source',
  id: 'ID',
  split: 'Split',
  value: 'Value',
  sacks: 'Sacks',
  sk: 'Sacks',
  adj_yards_per_attempt: 'Adj Y/A',
  ay_a: 'Adj Y/A',
  // Add more as needed
};

const SplitsComparison = memo(() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableSplits, setAvailableSplits] = useState({});
  const [selectedValue, setSelectedValue] = useState('3rd & 1-3');
  const [comprehensiveData, setComprehensiveData] = useState(null);
  const [minAttempts, setMinAttempts] = useState(10);
  const [season, setSeason] = useState(2024);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Load available split types on component mount
  useEffect(() => {
    loadAvailableSplits();
  }, [season]);

  // Load available statistics when value changes
  useEffect(() => {
    if (selectedValue) {
      loadAvailableStatistics();
    }
  }, [selectedValue, season]);



  const loadAvailableSplits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const splits = await getAvailableSplitTypes(season);
      setAvailableSplits(splits);
      
      // If no splits found, show a helpful message
      if (Object.keys(splits).length === 0) {
        setError('No split data found for this season. The tool will show sample data for testing.');
      }
    } catch (err) {
      setError(`Failed to load split types: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [season]);

  const loadAvailableStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Query by value directly (database uses 'other' as split field)
      console.log(`🔍 Component: Querying by value '${selectedValue}'`);
      
      const stats = await getAvailableStatistics('other', selectedValue, season);
      
      // Clear any previous errors if we successfully loaded statistics
      setError(null);
    } catch (err) {
      setError(`Failed to load statistics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedValue, season]);

  const runComprehensiveView = useCallback(async () => {
    if (!selectedValue) {
      setError('Please select a split value');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Query by value directly (database uses 'other' as split field)
      console.log(`🔍 Component: Querying by value '${selectedValue}'`);
      
      const data = await getAllDataForSplit(
        'other', 
        selectedValue, 
        season, 
        minAttempts
      );
      setComprehensiveData(data);
    } catch (err) {
      setError(`Failed to load comprehensive data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedValue, season, minAttempts]);



  // Sorting functions
  const handleSort = useCallback((key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const getSortedData = useCallback((data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      // Convert to numbers if possible
      const aNum = parseFloat(aValue);
      const bNum = parseFloat(bValue);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        // Numeric comparison
        if (sortConfig.direction === 'asc') {
          return aNum - bNum;
        } else {
          return bNum - aNum;
        }
      } else {
        // String comparison
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      }
    });
  }, [sortConfig]);

  const getSortIcon = useCallback((columnKey) => {
    if (sortConfig.key !== columnKey) {
      return '↕'; // Neutral sort icon
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  }, [sortConfig]);

  // Helper to reorder columns with custom positioning
  const getReorderedColumns = useCallback((columns) => {
    // Remove pfr_id column
    const filteredColumns = columns.filter(col => col.field.toLowerCase() !== 'pfr_id');
    
    // Define the order: Player, Value, then stats, then metadata at end
    const firstFields = ['player_name', 'player', 'value'];
    const lastFields = ['source', 'id', 'split', 'table_source'];
    
    const first = filteredColumns.filter(col => firstFields.includes(col.field.toLowerCase()));
    const main = filteredColumns.filter(col => 
      !firstFields.includes(col.field.toLowerCase()) && 
      !lastFields.includes(col.field.toLowerCase())
    );
    const last = filteredColumns.filter(col => lastFields.includes(col.field.toLowerCase()));
    
    return [...first, ...main, ...last];
  }, []);

  // Synchronized scrolling refs for horizontal scroll
  const topScrollRef = useRef(null);
  const mainScrollRef = useRef(null);

  // Handle horizontal scroll synchronization
  const handleMainScroll = useCallback((e) => {
    if (topScrollRef.current) {
      topScrollRef.current.scrollLeft = e.target.scrollLeft;
    }
  }, []);

  const handleTopScroll = useCallback((e) => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollLeft = e.target.scrollLeft;
    }
  }, []);

  // Simple scrollbar visibility check
  useEffect(() => {
    if (comprehensiveData) {
      console.log('🔍 Debug: Checking scrollbar visibility...');
      
      // Simple approach: ensure scrollbars are visible after data loads
      setTimeout(() => {
        if (mainScrollRef.current) {
          // Trigger a small scroll to ensure scrollbar visibility
          mainScrollRef.current.scrollLeft = 1;
          setTimeout(() => {
            mainScrollRef.current.scrollLeft = 0;
          }, 100);
        }
        if (topScrollRef.current) {
          topScrollRef.current.scrollLeft = 1;
          setTimeout(() => {
            topScrollRef.current.scrollLeft = 0;
          }, 100);
        }
      }, 500);
    }
  }, [comprehensiveData]);

  if (loading && !comprehensiveData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-blue-200">Loading splits data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        


        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-4">📊 QB Splits Comparison</h1>
          <p className="text-xl text-blue-200">Compare any statistic from qb_splits or qb_splits_advanced tables</p>
        </div>

        {error && (
          <div className="bg-red-500/20 backdrop-blur-lg border border-red-400/30 text-red-200 p-4 rounded-lg mb-6">
            <p className="font-semibold">⚠️ Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Configuration Panel */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">⚙️ Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Season Selector */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                📅 Season
              </label>
              <select
                value={season}
                onChange={(e) => setSeason(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-blue-900 text-blue-100 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-blue-200"
              >
                <option className="bg-blue-900 text-blue-100" value={2024}>2024</option>
                <option className="bg-blue-900 text-blue-100" value={2023}>2023</option>
                <option className="bg-blue-900 text-blue-100" value={2022}>2022</option>
              </select>
            </div>

            {/* Split Value Selector */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                🎯 Split Value
              </label>
              <select
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                className="w-full px-3 py-2 bg-blue-900 text-blue-100 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-blue-200"
              >
                <option className="bg-blue-900 text-blue-100" value="">Select Value</option>
                {Object.entries(availableSplits).map(([splitType, splitData]) => {
                  const descriptions = getSplitTypeDescriptions();
                  const description = descriptions[splitType] || splitType;
                  return splitData.values.map(value => (
                    <option className="bg-blue-900 text-blue-100" key={`${splitType}-${value}`} value={value}>
                      {value} ({description})
                    </option>
                  ));
                })}
              </select>
            </div>

            {/* Minimum Attempts */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                📊 Min Attempts
              </label>
              <input
                type="number"
                value={minAttempts}
                onChange={(e) => setMinAttempts(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-blue-200"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <button
              onClick={runComprehensiveView}
              disabled={loading || !selectedValue}
              className="px-8 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-white rounded-lg font-semibold disabled:bg-gray-500/20 disabled:cursor-not-allowed transition-colors border border-blue-400/30"
            >
              {loading ? '⏳ Loading Data...' : '🚀 Load Comprehensive Data'}
            </button>
          </div>
        </div>

        {/* Comprehensive Data Table */}
        {comprehensiveData && (
          <div className="space-y-8">
            {/* Summary */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                📊 Comprehensive Data: {comprehensiveData.split_value}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-300">{comprehensiveData.summary.total_qbs}</div>
                  <div className="text-sm text-blue-200">QBs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-300">{comprehensiveData.summary.total_attempts}</div>
                  <div className="text-sm text-green-200">Total Attempts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-300">{comprehensiveData.summary.average_completion_rate}%</div>
                  <div className="text-sm text-purple-200">Avg Completion %</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-300">{comprehensiveData.summary.average_yards_per_attempt}</div>
                  <div className="text-sm text-orange-200">Avg Y/A</div>
                </div>
              </div>
            </div>

            {/* Comprehensive Table */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                📋 All Statistics for {comprehensiveData.split_value} ({comprehensiveData.data.length} QBs)
              </h3>
              
              {/* Single Table with Horizontal Scrollbars at Top and Bottom */}
              <div className="relative">
                {/* Top Scroll Bar - Just the scrollbar, no table */}
                <div 
                  ref={topScrollRef}
                  onScroll={handleTopScroll}
                  className="overflow-x-scroll custom-scrollbar mb-2"
                  style={{
                    height: '20px',
                    scrollbarWidth: 'auto',
                    scrollbarColor: 'rgba(59, 130, 246, 1) rgba(30, 58, 138, 0.5)',
                    overflowX: 'scroll',
                    overflowY: 'hidden'
                  }}
                >
                  <div style={{ width: 'max-content', height: '1px' }}></div>
                </div>

                {/* Main Table with Horizontal Scrollbar */}
                <div 
                  ref={mainScrollRef}
                  onScroll={handleMainScroll}
                  className="overflow-x-auto custom-scrollbar"
                  style={{
                    scrollbarWidth: 'auto',
                    scrollbarColor: 'rgba(59, 130, 246, 1) rgba(30, 58, 138, 0.5)',
                    overflowX: 'scroll',
                    overflowY: 'hidden'
                  }}
                >
                <table className="w-full text-xs" style={{ minWidth: 'max-content' }}>
                  <thead>
                    <tr className="border-b border-white/20">
                      {getReorderedColumns(comprehensiveData.columns).map((column) => (
                        <th 
                          key={column.field} 
                          className="text-center py-1 px-1 text-xs font-semibold text-blue-200 whitespace-nowrap cursor-pointer hover:bg-white/5 select-none transition-colors"
                          onClick={() => handleSort(column.field)}
                        >
                          <div className="flex items-center justify-center space-x-1">
                            <span>{COLUMN_ABBREVIATIONS[column.field.toLowerCase()] || column.displayName}</span>
                            <span className="text-blue-300 font-bold">{getSortIcon(column.field)}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedData(comprehensiveData.data).map((qb, index) => {
                      const teamInfo = getTeamInfo(qb.team);
                      return (
                        <tr
                          key={`${qb.pfr_id}-${index}`}
                          className="even:bg-blue-900/40 odd:bg-blue-900/60 border-b border-white/10 hover:bg-white/5 transition-colors"
                        >
                          {getReorderedColumns(comprehensiveData.columns).map((column) => {
                            const value = qb[column.field];
                            
                            // Special handling for team column with logo
                            if (column.field === 'team') {
                              return (
                                <td key={column.field} className="py-1 px-1 text-xs text-center">
                                  <div className="flex items-center justify-center space-x-1">
                                    {teamInfo.logo && (
                                      <img 
                                        src={teamInfo.logo} 
                                        alt={teamInfo.name}
                                        className="w-4 h-4 object-contain"
                                        onError={(e) => e.target.style.display = 'none'}
                                      />
                                    )}
                                    <span className="text-blue-200 whitespace-nowrap">{value}</span>
                                  </div>
                                </td>
                              );
                            }
                            
                            // Format different data types
                            let displayValue = value;
                            if (value === null || value === undefined) {
                              displayValue = '-';
                            } else if (column.type === 'percentage' && typeof value === 'number') {
                              displayValue = `${value.toFixed(1)}%`;
                            } else if (column.type === 'numeric' && typeof value === 'number') {
                              // Integer columns (no decimal places)
                              const integerColumns = ['att', 'cmp', 'yds', 'td', 'int', 'sk', 'inc', 'sk_yds'];
                              if (integerColumns.includes(column.field.toLowerCase())) {
                                displayValue = Math.round(value).toString();
                              } else {
                                displayValue = value.toFixed(2);
                              }
                            } else if (column.type === 'numeric' && typeof value === 'string' && !isNaN(parseFloat(value))) {
                              // Integer columns (no decimal places) for string values
                              const integerColumns = ['att', 'cmp', 'yds', 'td', 'int', 'sk', 'inc', 'sk_yds'];
                              if (integerColumns.includes(column.field.toLowerCase())) {
                                displayValue = Math.round(parseFloat(value)).toString();
                              } else {
                                displayValue = parseFloat(value).toFixed(2);
                              }
                            }
                            
                            return (
                              <td key={column.field} className="py-1 px-1 text-xs whitespace-nowrap text-blue-200 text-center">
                                {displayValue}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                                </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default SplitsComparison; 