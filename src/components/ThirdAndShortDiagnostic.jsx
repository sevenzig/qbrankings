/**
 * ThirdAndShortDiagnostic - Component to diagnose 3rd & 1-3 data issues
 * 
 * Performance Optimizations:
 * 1. Memoized with React.memo to prevent unnecessary re-renders
 * 2. useCallback for event handlers
 * 3. useMemo for expensive calculations
 */
import React, { useState, useCallback, memo } from 'react';
import { diagnoseThirdAndShortData, getAllSplitTypes, findQBsWithSplitPattern, findQBByName } from '../utils/thirdAndShortDiagnostic.js';
import { diagnoseQBData } from '../utils/thirdAndShortExtractor.js';

const ThirdAndShortDiagnostic = memo(() => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const runDiagnostic = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setResults(null);
    
    try {
      // Capture console output
      const originalLog = console.log;
      const logs = [];
      
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };
      
      await diagnoseThirdAndShortData();
      
      console.log = originalLog;
      
      setResults({
        logs,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const getSplitTypes = useCallback(async () => {
    try {
      const splitTypes = await getAllSplitTypes(2024);
      console.log('📋 All split types for 2024:', splitTypes);
      
      // Display in a more readable format
      const formattedResults = Object.entries(splitTypes).map(([split, values]) => ({
        split,
        values: Array.from(values)
      }));
      
      setResults({
        splitTypes: formattedResults,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const searchPattern = useCallback(async (pattern) => {
    try {
      const results = await findQBsWithSplitPattern(pattern, 2024);
      console.log(`📋 QBs with pattern "${pattern}":`, results);
      
      setResults({
        patternSearch: {
          pattern,
          results,
          count: results.length
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const findQB = useCallback(async (playerName) => {
    try {
      const results = await findQBByName(playerName, 2024);
      console.log(`📋 QBs matching "${playerName}":`, results);
      
      setResults({
        qbSearch: {
          playerName,
          results,
          count: results.length
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const testSpecificQB = useCallback(async () => {
    try {
      console.log('🧪 Testing specific QB data...');
      
      // Test with the hardcoded ID that's failing
      const diagnostic = await diagnoseQBData('MahomPa00', 2024);
      
      setResults({
        qbDiagnostic: diagnostic,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        🔍 3rd & 1-3 Data Diagnostic Tool
      </h2>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          This tool helps diagnose why 3rd & 1-3 data extraction is returning no results.
          It examines the qb_splits table structure and content to identify the issue.
        </p>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={runDiagnostic}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isRunning ? '🔍 Running Diagnostic...' : '🔍 Run Full Diagnostic'}
          </button>
          
          <button
            onClick={getSplitTypes}
            disabled={isRunning}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            📋 Get All Split Types
          </button>
          
          <button
            onClick={() => searchPattern('3rd')}
            disabled={isRunning}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            🔍 Search "3rd" Pattern
          </button>
          
          <button
            onClick={() => searchPattern('1-3')}
            disabled={isRunning}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
          >
            🔍 Search "1-3" Pattern
          </button>
          
          <button
            onClick={() => findQB('Mahomes')}
            disabled={isRunning}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            🔍 Find Mahomes
          </button>
          
          <button
            onClick={() => findQB('Allen')}
            disabled={isRunning}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            🔍 Find Allen
          </button>
          
          <button
            onClick={testSpecificQB}
            disabled={isRunning}
            className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50"
          >
            🧪 Test MahomPa00
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {results && (
        <div className="space-y-6">
          {results.logs && (
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="text-lg font-semibold mb-3">📋 Diagnostic Logs</h3>
              <div className="bg-black text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-96">
                {results.logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {results.splitTypes && (
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="text-lg font-semibold mb-3">📋 Split Types Found</h3>
              <div className="space-y-2">
                {results.splitTypes.map((item, index) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="font-semibold text-blue-600">{item.split}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Values: {item.values.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {results.patternSearch && (
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="text-lg font-semibold mb-3">
                🔍 Pattern Search: "{results.patternSearch.pattern}"
              </h3>
              <div className="mb-2">
                <span className="font-semibold">Found {results.patternSearch.count} results</span>
              </div>
              {results.patternSearch.results.length > 0 && (
                <div className="bg-white p-3 rounded border">
                  <div className="font-mono text-sm">
                    <pre>{JSON.stringify(results.patternSearch.results.slice(0, 3), null, 2)}</pre>
                    {results.patternSearch.results.length > 3 && (
                      <div className="text-gray-500 mt-2">
                        ... and {results.patternSearch.results.length - 3} more results
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {results.qbSearch && (
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="text-lg font-semibold mb-3">
                🔍 QB Search: "{results.qbSearch.playerName}"
              </h3>
              <div className="mb-2">
                <span className="font-semibold">Found {results.qbSearch.count} results</span>
              </div>
              {results.qbSearch.results.length > 0 && (
                <div className="bg-white p-3 rounded border">
                  <div className="space-y-2">
                    {results.qbSearch.results.map((qb, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded">
                        <div className="font-semibold">{qb.player_name}</div>
                        <div className="text-sm text-gray-600">
                          ID: {qb.pfr_id}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {results.qbDiagnostic && (
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="text-lg font-semibold mb-3">🧪 QB Diagnostic Results</h3>
              <div className="space-y-4">
                <div className="bg-white p-3 rounded border">
                  <div className="font-semibold text-blue-600">QB: {results.qbDiagnostic.pfrId}</div>
                  <div className="text-sm text-gray-600 mt-1">Season: {results.qbDiagnostic.season}</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-green-600">qb_splits_advanced</div>
                    <div className="text-sm text-gray-600">
                      Exists: {results.qbDiagnostic.exists.qb_splits_advanced ? '✅' : '❌'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Records: {results.qbDiagnostic.data.qb_splits_advanced.length}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-blue-600">qb_splits</div>
                    <div className="text-sm text-gray-600">
                      Exists: {results.qbDiagnostic.exists.qb_splits ? '✅' : '❌'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Records: {results.qbDiagnostic.data.qb_splits.length}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-purple-600">qb_passing_stats</div>
                    <div className="text-sm text-gray-600">
                      Exists: {results.qbDiagnostic.exists.qb_passing_stats ? '✅' : '❌'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Records: {results.qbDiagnostic.data.qb_passing_stats.length}
                    </div>
                  </div>
                </div>
                
                {results.qbDiagnostic.data.qb_splits_advanced.length > 0 && (
                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-green-600 mb-2">Sample qb_splits_advanced Records</div>
                    <div className="space-y-2">
                      {results.qbDiagnostic.data.qb_splits_advanced.slice(0, 5).map((record, index) => (
                        <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                          <div>Split: "{record.split}"</div>
                          <div>Value: "{record.value}"</div>
                          <div>Player: {record.player_name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {results.qbDiagnostic.data.qb_splits.length > 0 && (
                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-blue-600 mb-2">Sample qb_splits Records</div>
                    <div className="space-y-2">
                      {results.qbDiagnostic.data.qb_splits.slice(0, 5).map((record, index) => (
                        <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                          <div>Split: "{record.split}"</div>
                          <div>Value: "{record.value}"</div>
                          <div>Player: {record.player_name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            Last updated: {new Date(results.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
});

export default ThirdAndShortDiagnostic; 