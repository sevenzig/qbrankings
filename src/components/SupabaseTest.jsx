import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseAvailable } from '../utils/supabase.js';
import { getTeamInfo } from '../constants/teamData.js';

const SupabaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [error, setError] = useState(null);
  const [tableStats, setTableStats] = useState({});
  const [sampleData, setSampleData] = useState({});
  const [diagnosticOutput, setDiagnosticOutput] = useState('');
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus('testing');
      
      if (!isSupabaseAvailable()) {
        setConnectionStatus('unavailable');
        setError('Supabase is not configured or unavailable');
        return;
      }
      
      // Test basic connection by querying each table
      const tables = ['players', 'qb_passing_stats', 'qb_splits', 'qb_splits_advanced', 'teams'];
      const stats = {};
      const samples = {};
      
      for (const table of tables) {
        try {
          console.log(`🔄 Testing connection to ${table} table...`);
          
          // Get count
          const { count, error: countError } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (countError) {
            console.error(`❌ Error counting ${table}:`, countError);
            stats[table] = { count: 0, error: countError.message };
            continue;
          }
          
          stats[table] = { count: count || 0, error: null };
          
          // Get sample data
          const { data: sampleData, error: sampleError } = await supabase
            .from(table)
            .select('*')
            .limit(3);
          
          if (sampleError) {
            console.error(`❌ Error getting sample from ${table}:`, sampleError);
            samples[table] = { error: sampleError.message };
          } else {
            samples[table] = { data: sampleData || [] };
          }
          
          console.log(`✅ ${table}: ${count} records`);
          
        } catch (err) {
          console.error(`❌ Error testing ${table}:`, err);
          stats[table] = { count: 0, error: err.message };
          samples[table] = { error: err.message };
        }
      }
      
      setTableStats(stats);
      setSampleData(samples);
      setConnectionStatus('connected');
      
    } catch (err) {
      console.error('Supabase connection test failed:', err);
      setConnectionStatus('failed');
      setError(err.message);
    }
  };

  const runComprehensiveDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    setDiagnosticOutput('Running comprehensive diagnostic...\n');
    
    if (!isSupabaseAvailable()) {
      setDiagnosticOutput('Supabase is not available - cannot run diagnostic');
      setIsRunningDiagnostic(false);
      return;
    }
    
    // Capture console output
    const originalLog = console.log;
    const logs = [];
    
    console.log = (...args) => {
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
      const diagnostic = await performComprehensiveDiagnostic();
      setDiagnosticOutput(logs.join('\n') + '\n\nDiagnostic Result: ' + JSON.stringify(diagnostic, null, 2));
    } catch (error) {
      setDiagnosticOutput(logs.join('\n') + '\n\nError: ' + error.message);
    } finally {
      console.log = originalLog;
      setIsRunningDiagnostic(false);
    }
  };

  const performComprehensiveDiagnostic = async () => {
    const diagnostic = {
      timestamp: new Date().toISOString(),
      tables: {},
      relationships: {},
      dataQuality: {},
      recommendations: []
    };

    // Test each table individually
    const tables = [
      { name: 'players', description: 'Player information' },
      { name: 'qb_passing_stats', description: 'QB passing statistics' },
      { name: 'qb_splits', description: 'QB situational splits' },
      { name: 'qb_splits_advanced', description: 'QB advanced situational splits' },
      { name: 'teams', description: 'Team information' }
    ];

    for (const table of tables) {
      console.log(`\n🔍 Diagnosing ${table.name} table...`);
      
      try {
        // Get table structure
        const { data: columns, error: columnsError } = await supabase
          .from(table.name)
          .select('*')
          .limit(0);
        
        if (columnsError) {
          diagnostic.tables[table.name] = {
            status: 'error',
            error: columnsError.message,
            description: table.description
          };
          continue;
        }

        // Get record count
        const { count, error: countError } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });

        if (countError) {
          diagnostic.tables[table.name] = {
            status: 'error',
            error: countError.message,
            description: table.description
          };
          continue;
        }

        // Get sample data
        const { data: sample, error: sampleError } = await supabase
          .from(table.name)
          .select('*')
          .limit(5);

        if (sampleError) {
          diagnostic.tables[table.name] = {
            status: 'error',
            error: sampleError.message,
            description: table.description
          };
          continue;
        }

        // Analyze data quality
        const quality = analyzeDataQuality(table.name, sample);
        
        diagnostic.tables[table.name] = {
          status: 'ok',
          count: count || 0,
          description: table.description,
          sampleColumns: sample && sample.length > 0 ? Object.keys(sample[0]) : [],
          dataQuality: quality
        };

        console.log(`✅ ${table.name}: ${count} records, ${sample.length} sample records`);

      } catch (error) {
        console.error(`❌ Error diagnosing ${table.name}:`, error);
        diagnostic.tables[table.name] = {
          status: 'error',
          error: error.message,
          description: table.description
        };
      }
    }

    // Test relationships between tables
    console.log('\n🔍 Testing table relationships...');
    await testTableRelationships(diagnostic);

    // Generate recommendations
    console.log('\n🔍 Generating recommendations...');
    generateRecommendations(diagnostic);

    return diagnostic;
  };

  const analyzeDataQuality = (tableName, sampleData) => {
    if (!sampleData || sampleData.length === 0) {
      return { status: 'no_data', issues: ['No sample data available'] };
    }

    const issues = [];
    const sample = sampleData[0];
    const columns = Object.keys(sample);

    // Check for common data quality issues
    if (tableName === 'players') {
      if (!columns.includes('pfr_id')) issues.push('Missing pfr_id column');
      if (!columns.includes('player_name')) issues.push('Missing player_name column');
    }

    if (tableName === 'qb_passing_stats') {
      if (!columns.includes('pfr_id')) issues.push('Missing pfr_id column');
      if (!columns.includes('season')) issues.push('Missing season column');
      if (!columns.includes('team')) issues.push('Missing team column');
    }

    if (tableName === 'qb_splits' || tableName === 'qb_splits_advanced') {
      if (!columns.includes('pfr_id')) issues.push('Missing pfr_id column');
      if (!columns.includes('season')) issues.push('Missing season column');
      if (!columns.includes('split')) issues.push('Missing split column');
    }

    if (tableName === 'teams') {
      if (!columns.includes('team_abbr')) issues.push('Missing team_abbr column');
      if (!columns.includes('team_name')) issues.push('Missing team_name column');
    }

    // Check for null values in critical columns
    const nullIssues = [];
    sampleData.forEach((record, index) => {
      columns.forEach(column => {
        if (record[column] === null || record[column] === undefined) {
          nullIssues.push(`Record ${index + 1} has null ${column}`);
        }
      });
    });

    if (nullIssues.length > 0) {
      issues.push(`Found ${nullIssues.length} null value issues in sample data`);
    }

    return {
      status: issues.length === 0 ? 'good' : 'issues_found',
      issues: issues.length > 0 ? issues : ['No obvious data quality issues']
    };
  };

  const testTableRelationships = async (diagnostic) => {
    diagnostic.relationships = {};

    try {
      // Test players -> qb_passing_stats relationship
      console.log('🔍 Testing players -> qb_passing_stats relationship...');
      const { data: playerStats, error: playerStatsError } = await supabase
        .from('players')
        .select(`
          pfr_id,
          player_name,
          qb_passing_stats!inner(season, team, rate)
        `)
        .limit(5);

      if (playerStatsError) {
        diagnostic.relationships['players_qb_passing_stats'] = {
          status: 'error',
          error: playerStatsError.message
        };
      } else {
        diagnostic.relationships['players_qb_passing_stats'] = {
          status: 'ok',
          sampleCount: playerStats?.length || 0
        };
      }

      // Note: qb_passing_stats -> qb_splits relationships are not defined as FKs
      // They are linked by pfr_id but don't have explicit FK constraints
      console.log('🔍 Note: qb_passing_stats -> qb_splits relationships use pfr_id but no FK constraints');
      diagnostic.relationships['qb_passing_stats_qb_splits'] = {
        status: 'info',
        message: 'Linked by pfr_id (no FK constraint)'
      };
      
      diagnostic.relationships['qb_passing_stats_qb_splits_advanced'] = {
        status: 'info',
        message: 'Linked by pfr_id (no FK constraint)'
      };

      // Note: teams -> qb_passing_stats relationship is not used in current queries
      // Team codes are stored directly in qb_passing_stats.team field
      console.log('🔍 Note: teams table is separate, team codes stored directly in qb_passing_stats');
      diagnostic.relationships['teams_qb_passing_stats'] = {
        status: 'info',
        message: 'Team codes stored directly in qb_passing_stats.team field'
      };

    } catch (error) {
      console.error('❌ Error testing relationships:', error);
      diagnostic.relationships['general'] = {
        status: 'error',
        error: error.message
      };
    }
  };

  const generateRecommendations = (diagnostic) => {
    const recommendations = [];

    // Check table counts
    Object.entries(diagnostic.tables).forEach(([tableName, tableInfo]) => {
      if (tableInfo.status === 'ok') {
        if (tableInfo.count === 0) {
          recommendations.push(`${tableName} table is empty - consider populating with data`);
        } else if (tableInfo.count < 10) {
          recommendations.push(`${tableName} table has very few records (${tableInfo.count}) - verify data completeness`);
        }
      } else {
        recommendations.push(`${tableName} table has errors: ${tableInfo.error}`);
      }
    });

    // Check relationships
    Object.entries(diagnostic.relationships).forEach(([relName, relInfo]) => {
      if (relInfo.status === 'error') {
        recommendations.push(`Relationship ${relName} has errors: ${relInfo.error}`);
      }
    });

    // Check data quality
    Object.entries(diagnostic.tables).forEach(([tableName, tableInfo]) => {
      if (tableInfo.status === 'ok' && tableInfo.dataQuality) {
        if (tableInfo.dataQuality.status === 'issues_found') {
          recommendations.push(`${tableName} has data quality issues: ${tableInfo.dataQuality.issues.join(', ')}`);
        }
      }
    });

    diagnostic.recommendations = recommendations;
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'testing': return 'text-yellow-400';
      case 'unavailable': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '✅';
      case 'failed': return '❌';
      case 'testing': return '⏳';
      case 'unavailable': return '⚠️';
      default: return '❓';
    }
  };

  const isConnected = connectionStatus === 'connected';

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        🔧 Supabase Database Test (5-Table Schema)
      </h3>
      
      <div className="space-y-6">
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
              {connectionStatus === 'unavailable' && 'Supabase is not configured or unavailable'}
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

        {/* Table Statistics */}
        {Object.keys(tableStats).length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Table Statistics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(tableStats).map(([tableName, stats]) => (
                <div key={tableName} className={`p-4 rounded-lg border ${
                  stats.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-800 capitalize">{tableName.replace(/_/g, ' ')}</h5>
                    <span className={`text-sm px-2 py-1 rounded ${
                      stats.error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {stats.error ? 'Error' : 'OK'}
                    </span>
                  </div>
                  {stats.error ? (
                    <p className="text-red-600 text-sm">{stats.error}</p>
                  ) : (
                    <p className="text-green-600 text-sm font-medium">{stats.count} records</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sample Data Display */}
        {Object.keys(sampleData).length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Sample Data</h4>
            <div className="space-y-4">
              {Object.entries(sampleData).map(([tableName, sample]) => (
                <div key={tableName} className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-800 mb-2 capitalize">{tableName.replace(/_/g, ' ')}</h5>
                  {sample.error ? (
                    <p className="text-red-600 text-sm">{sample.error}</p>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded overflow-x-auto">
                      <pre className="text-xs text-gray-800">
                        {JSON.stringify(sample.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comprehensive Diagnostic */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Comprehensive Diagnostic</h4>
          
          <div className="space-y-4">
            <button
              onClick={runComprehensiveDiagnostic}
              disabled={isRunningDiagnostic || !isConnected}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunningDiagnostic ? 'Running Diagnostic...' : 'Run Comprehensive Diagnostic'}
            </button>
            
            {diagnosticOutput && (
              <div className="space-y-4">
                <h5 className="text-md font-semibold text-gray-700">Diagnostic Output</h5>
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