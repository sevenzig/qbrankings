import React, { useState, useEffect } from 'react';
import { supabase, qbDataService } from '../utils/supabase.js';
import { runAllExamples } from '../utils/thirdAndShortExample.js';
import { getTeamInfo } from '../constants/teamData.js';

const SupabaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [testData, setTestData] = useState(null);
  const [error, setError] = useState(null);

  const [thirdAndShortData, setThirdAndShortData] = useState(null);
  const [thirdAndShortLoading, setThirdAndShortLoading] = useState(false);
  const [thirdAndShortError, setThirdAndShortError] = useState(null);
  const [thirdAndShortSummary, setThirdAndShortSummary] = useState(null);

  const [examplesOutput, setExamplesOutput] = useState('');
  const [diagnosticOutput, setDiagnosticOutput] = useState('');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus('testing');
      
      // Test basic connection using the season summary view
      const { data, error } = await supabase
        .from('qb_season_summary')
        .select('count')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      setConnectionStatus('connected');
      
      // Test actual data fetch
      const qbData = await qbDataService.fetchAllQBData(true); // 2024 only
      setTestData(qbData);
      
      // Test database stats
      const stats = await qbDataService.getDatabaseStats();
      console.log('📊 Database stats:', stats);
      
    } catch (err) {
      console.error('Supabase connection test failed:', err);
      setConnectionStatus('failed');
      setError(err.message);
    }
  };

  const testThirdAndShortData = async () => {
    setThirdAndShortLoading(true);
    setThirdAndShortError(null);
    
    try {
      console.log('🧪 Testing 3rd & 1-3 data extraction...');
      
      // First, find Mahomes' correct player ID
      console.log('🔍 Finding Mahomes\' player ID...');
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
      
      // Test individual QB data with correct ID
      const testQBData = await qbDataService.fetchThirdAndShortDataForQB(mahomesId);
      console.log('✅ Test QB 3rd & 1-3 data:', testQBData);
      
      // Test summary statistics
      const summary = await qbDataService.getThirdAndShortSummary2024();
      console.log('✅ 3rd & 1-3 summary:', summary);
      
      setThirdAndShortSummary(summary);
      
      // Test raw data for all QBs
      const allData = await qbDataService.fetchThirdAndShortData2024();
      console.log('✅ All 3rd & 1-3 data:', allData);
      
      setThirdAndShortData(allData);
      
    } catch (error) {
      console.error('❌ Error testing 3rd & 1-3 data:', error);
      setThirdAndShortError(error.message);
    } finally {
      setThirdAndShortLoading(false);
    }
  };

  const runExamples = async () => {
    setExamplesOutput('Running examples...\n');
    
    // Capture console output
    const originalLog = console.log;
    const logs = [];
    
    console.log = (...args) => {
      // Properly format objects and arrays for display
      const formattedArgs = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return '[Complex Object]';
          }
        }
        return String(arg);
      });
      logs.push(formattedArgs.join(' '));
      originalLog(...args);
    };
    
    try {
      await runAllExamples();
      setExamplesOutput(logs.join('\n'));
    } catch (error) {
      setExamplesOutput(logs.join('\n') + '\n\nError: ' + error.message);
    } finally {
      console.log = originalLog;
    }
  };

  const runDiagnostic = async () => {
    setDiagnosticOutput('Running diagnostic...\n');
    
    // Capture console output
    const originalLog = console.log;
    const logs = [];
    
    console.log = (...args) => {
      // Properly format objects and arrays for display
      const formattedArgs = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return '[Complex Object]';
          }
        }
        return String(arg);
      });
      logs.push(formattedArgs.join(' '));
      originalLog(...args);
    };
    
    try {
      const diagnostic = await qbDataService.diagnoseThirdDownData();
      setDiagnosticOutput(logs.join('\n') + '\n\nDiagnostic Result: ' + JSON.stringify(diagnostic, null, 2));
    } catch (error) {
      setDiagnosticOutput(logs.join('\n') + '\n\nError: ' + error.message);
    } finally {
      console.log = originalLog;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'testing': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '✅';
      case 'failed': return '❌';
      case 'testing': return '⏳';
      default: return '❓';
    }
  };

  const isConnected = connectionStatus === 'connected';

  // Helper function to get team logo
  const getTeamLogo = (teamAbbr) => {
    const teamInfo = getTeamInfo(teamAbbr);
    return teamInfo.logo || '';
  };

  // Helper function to get team name
  const getTeamName = (teamAbbr) => {
    const teamInfo = getTeamInfo(teamAbbr);
    return teamInfo.name || teamAbbr;
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        🔧 Supabase Connection Test
      </h3>
      
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div>
            <p className={`font-medium ${getStatusColor()}`}>
              Status: {connectionStatus.toUpperCase()}
            </p>
            <p className="text-blue-200 text-sm">
              {connectionStatus === 'connected' && 'Supabase is working correctly'}
              {connectionStatus === 'failed' && 'Failed to connect to Supabase'}
              {connectionStatus === 'testing' && 'Testing connection...'}
              {connectionStatus === 'checking' && 'Checking connection...'}
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-200 text-sm font-medium">Error:</p>
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        {/* Test Data Display */}
        {testData && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
            <p className="text-green-200 text-sm font-medium">✅ Data Test Successful</p>
            <p className="text-green-300 text-xs">
              Fetched {testData.length} QB records from Supabase
            </p>
            {testData.length > 0 && (
              <div className="mt-2">
                <p className="text-green-300 text-xs font-medium">Sample data:</p>
                <p className="text-green-300 text-xs">
                  {testData[0].player_name} - {testData[0].team} ({testData[0].season})
                </p>
                <p className="text-green-300 text-xs">
                  Rating: {testData[0].passer_rating} | Games: {testData[0].games_started}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3rd & 1-3 Data Test Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            3rd & 1-3 Splits Data Test
          </h3>
          
          <div className="space-y-4">
            <button
              onClick={testThirdAndShortData}
              disabled={thirdAndShortLoading || !isConnected}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {thirdAndShortLoading ? 'Loading...' : 'Test 3rd & 1-3 Data'}
            </button>
            
            {thirdAndShortError && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                <strong>Error:</strong> {thirdAndShortError}
              </div>
            )}
            
            {thirdAndShortSummary && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700">Summary Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-sm text-blue-600">Total QBs</div>
                    <div className="text-xl font-bold text-blue-800">{thirdAndShortSummary.totalQBs}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-sm text-green-600">Total Attempts</div>
                    <div className="text-xl font-bold text-green-800">{thirdAndShortSummary.totalAttempts}</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <div className="text-sm text-yellow-600">Avg Comp %</div>
                    <div className="text-xl font-bold text-yellow-800">{thirdAndShortSummary.averageCompletionRate}%</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <div className="text-sm text-purple-600">Avg Y/A</div>
                    <div className="text-xl font-bold text-purple-800">{thirdAndShortSummary.averageYardsPerAttempt}</div>
                  </div>
                </div>
                
                <h4 className="text-lg font-semibold text-gray-700">QB Breakdown (Top 10 by Attempts)</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left border-b">QB</th>
                        <th className="px-4 py-2 text-center border-b">Team</th>
                        <th className="px-4 py-2 text-center border-b">Att</th>
                        <th className="px-4 py-2 text-center border-b">Comp</th>
                        <th className="px-4 py-2 text-center border-b">Yds</th>
                        <th className="px-4 py-2 text-center border-b">TD</th>
                        <th className="px-4 py-2 text-center border-b">Int</th>
                        <th className="px-4 py-2 text-center border-b">Comp%</th>
                        <th className="px-4 py-2 text-center border-b">Y/A</th>
                        <th className="px-4 py-2 text-center border-b">TD%</th>
                        <th className="px-4 py-2 text-center border-b">Int%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {thirdAndShortSummary.qbBreakdown.slice(0, 10).map((qb, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 border-b font-medium">{qb.player_name}</td>
                          <td className="px-4 py-2 border-b text-center">
                            {(() => {
                              const teamAbbr = qb.team;
                              const teamInfo = getTeamInfo(teamAbbr);
                              const logoUrl = teamInfo.logo;
                              
                              if (logoUrl) {
                                return (
                                  <div className="flex items-center justify-center">
                                    <img 
                                      src={logoUrl} 
                                      alt={teamInfo.name || teamAbbr}
                                      className="w-6 h-6 object-contain"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'inline';
                                      }}
                                    />
                                    <span className="text-xs text-gray-600 hidden ml-1">{teamAbbr}</span>
                                  </div>
                                );
                              } else {
                                return (
                                  <span className="text-xs text-gray-600">
                                    {teamAbbr}
                                  </span>
                                );
                              }
                            })()}
                          </td>
                          <td className="px-4 py-2 border-b text-center">{qb.attempts}</td>
                          <td className="px-4 py-2 border-b text-center">{qb.completions}</td>
                          <td className="px-4 py-2 border-b text-center">{qb.yards}</td>
                          <td className="px-4 py-2 border-b text-center">{qb.tds}</td>
                          <td className="px-4 py-2 border-b text-center">{qb.ints}</td>
                          <td className="px-4 py-2 border-b text-center">{qb.completion_rate}%</td>
                          <td className="px-4 py-2 border-b text-center">{qb.yards_per_attempt}</td>
                          <td className="px-4 py-2 border-b text-center">{qb.td_rate}%</td>
                          <td className="px-4 py-2 border-b text-center">{qb.int_rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {thirdAndShortData && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700">Raw Data (First 5 Records)</h4>
                <div className="bg-gray-50 p-4 rounded overflow-x-auto">
                  <pre className="text-sm text-gray-800">
                    {JSON.stringify(thirdAndShortData.slice(0, 5), null, 2)}
                  </pre>
                </div>
                <p className="text-sm text-gray-600">
                  Total records: {thirdAndShortData.length}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3rd & 1-3 Examples Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            3rd & 1-3 Data Examples
          </h3>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                onClick={runExamples}
                disabled={!isConnected}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Run All Examples
              </button>
              
              <button
                onClick={runDiagnostic}
                disabled={!isConnected}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Run Diagnostic
              </button>
              
              <button
                onClick={() => {
                  console.log('🧪 Testing team logos:');
                  ['CIN', 'KAN', 'DEN', 'MIN', 'NYJ', 'DET', 'HOU', 'TAM', 'SEA', 'LAR', 'BUF', 'MIA', 'WAS', 'CHI', 'SFO'].forEach(team => {
                    const info = getTeamInfo(team);
                    console.log(`${team}:`, info);
                  });
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Test Team Logos
              </button>
            </div>
            
            {examplesOutput && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700">Example Output</h4>
                <div className="bg-gray-50 p-4 rounded overflow-x-auto max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {examplesOutput}
                  </pre>
                </div>
              </div>
            )}
            
            {diagnosticOutput && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700">Diagnostic Output</h4>
                <div className="bg-gray-50 p-4 rounded overflow-x-auto max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {diagnosticOutput}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Retry Button */}
        {connectionStatus === 'failed' && (
          <button
            onClick={testConnection}
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-white font-medium transition-colors"
          >
            🔄 Retry Connection
          </button>
        )}
      </div>
    </div>
  );
};

export default SupabaseTest; 