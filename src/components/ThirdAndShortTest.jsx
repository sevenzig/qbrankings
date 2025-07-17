/**
 * Third and Short Test Page
 * 
 * A comprehensive test page for displaying and analyzing 3rd & 1-3 splits data
 * for NFL quarterbacks from the Supabase database.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  extractThirdAndShortData2024,
  getThirdAndShortSummary,
  getTopPerformers,
  compareQBs,
  analyzeByTeam,
  exportToCSV
} from '../utils/thirdAndShortExtractor.js';

const ThirdAndShortTest = ({ onBack }) => {
  // State management
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMetric, setSelectedMetric] = useState('completion_rate');
  const [minAttempts, setMinAttempts] = useState(10);
  const [topPerformers, setTopPerformers] = useState(null);
  const [teamAnalysis, setTeamAnalysis] = useState(null);
  const [comparisonQBs, setComparisonQBs] = useState({ qb1: '', qb2: '' });
  const [comparisonResult, setComparisonResult] = useState(null);
  const [csvData, setCsvData] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading 3rd & 1-3 data...');
      
      // Load all data
      const rawData = await extractThirdAndShortData2024();
      setData(rawData);
      
      // Load summary
      const summaryData = await getThirdAndShortSummary();
      setSummary(summaryData);
      
      // Load team analysis
      const teamData = analyzeByTeam(rawData);
      setTeamAnalysis(teamData);
      
      // Generate CSV
      const csv = exportToCSV(rawData);
      setCsvData(csv);
      
      console.log('✅ Data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate top performers when data or filters change
  useEffect(() => {
    if (data) {
      const performers = getTopPerformers(data, selectedMetric, minAttempts, 20);
      setTopPerformers(performers);
    }
  }, [data, selectedMetric, minAttempts]);

  const handleCompareQBs = useCallback(async () => {
    if (!comparisonQBs.qb1 || !comparisonQBs.qb2) {
      alert('Please select two QBs to compare');
      return;
    }
    
    setLoading(true);
    try {
      const result = await compareQBs(comparisonQBs.qb1, comparisonQBs.qb2);
      setComparisonResult(result);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [comparisonQBs]);

  const downloadCSV = useCallback(() => {
    if (!csvData) return;
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'third_and_short_2024.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [csvData]);

  const getMetricLabel = (metric) => {
    const labels = {
      completion_rate: 'Completion Rate',
      yards_per_attempt: 'Yards per Attempt',
      td_rate: 'TD Rate',
      int_rate: 'INT Rate'
    };
    return labels[metric] || metric;
  };

  const getMetricFormat = (metric, value) => {
    if (metric === 'completion_rate' || metric === 'td_rate' || metric === 'int_rate') {
      return `${value}%`;
    }
    if (metric === 'yards_per_attempt') {
      return value.toFixed(1);
    }
    return value;
  };

  const getMetricColor = (metric, value) => {
    if (metric === 'int_rate') {
      // Lower is better for INT rate
      if (value <= 1) return 'text-green-600';
      if (value <= 2) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      // Higher is better for other metrics
      if (value >= 80) return 'text-green-600';
      if (value >= 60) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800">Loading 3rd & 1-3 Data...</h2>
            <p className="text-gray-600 mt-2">Fetching data from Supabase database</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Error Loading Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  ← Back to Rankings
                </button>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  3rd & 1-3 Data Analysis
                </h1>
                <p className="text-gray-600">
                  Comprehensive analysis of quarterback performance in 3rd & 1-3 situations (2024)
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
              <button
                onClick={downloadCSV}
                disabled={!csvData}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'performers', label: 'Top Performers', icon: '🏆' },
                { id: 'teams', label: 'Team Analysis', icon: '🏈' },
                { id: 'compare', label: 'Compare QBs', icon: '⚖️' },
                { id: 'raw', label: 'Raw Data', icon: '📋' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && summary && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">League Overview</h2>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Total QBs</div>
                  <div className="text-2xl font-bold text-blue-800">{summary.totalQBs}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Total Attempts</div>
                  <div className="text-2xl font-bold text-green-800">{summary.totalAttempts}</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-yellow-600 font-medium">Avg Comp %</div>
                  <div className="text-2xl font-bold text-yellow-800">{summary.averageCompletionRate}%</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">Avg Y/A</div>
                  <div className="text-2xl font-bold text-purple-800">{summary.averageYardsPerAttempt}</div>
                </div>
              </div>

              {/* QB Breakdown Table */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">QB Performance Breakdown</h3>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left border-b font-medium">QB</th>
                        <th className="px-4 py-3 text-left border-b font-medium">Team</th>
                        <th className="px-4 py-3 text-center border-b font-medium">Att</th>
                        <th className="px-4 py-3 text-center border-b font-medium">Comp</th>
                        <th className="px-4 py-3 text-center border-b font-medium">Yds</th>
                        <th className="px-4 py-3 text-center border-b font-medium">TD</th>
                        <th className="px-4 py-3 text-center border-b font-medium">Int</th>
                        <th className="px-4 py-3 text-center border-b font-medium">Comp%</th>
                        <th className="px-4 py-3 text-center border-b font-medium">Y/A</th>
                        <th className="px-4 py-3 text-center border-b font-medium">TD%</th>
                        <th className="px-4 py-3 text-center border-b font-medium">Int%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.qbBreakdown.slice(0, 15).map((qb, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 border-b font-medium">{qb.player_name}</td>
                          <td className="px-4 py-3 border-b">{qb.team}</td>
                          <td className="px-4 py-3 border-b text-center">{qb.attempts}</td>
                          <td className="px-4 py-3 border-b text-center">{qb.completions}</td>
                          <td className="px-4 py-3 border-b text-center">{qb.yards}</td>
                          <td className="px-4 py-3 border-b text-center">{qb.tds}</td>
                          <td className="px-4 py-3 border-b text-center">{qb.ints}</td>
                          <td className={`px-4 py-3 border-b text-center ${getMetricColor('completion_rate', qb.completion_rate)}`}>
                            {qb.completion_rate}%
                          </td>
                          <td className={`px-4 py-3 border-b text-center ${getMetricColor('yards_per_attempt', qb.yards_per_attempt)}`}>
                            {qb.yards_per_attempt}
                          </td>
                          <td className={`px-4 py-3 border-b text-center ${getMetricColor('td_rate', qb.td_rate)}`}>
                            {qb.td_rate}%
                          </td>
                          <td className={`px-4 py-3 border-b text-center ${getMetricColor('int_rate', qb.int_rate)}`}>
                            {qb.int_rate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Top Performers Tab */}
          {activeTab === 'performers' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Top Performers</h2>
              
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="completion_rate">Completion Rate</option>
                    <option value="yards_per_attempt">Yards per Attempt</option>
                    <option value="td_rate">TD Rate</option>
                    <option value="int_rate">INT Rate (Lower is Better)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Attempts
                  </label>
                  <input
                    type="number"
                    value={minAttempts}
                    onChange={(e) => setMinAttempts(parseInt(e.target.value) || 10)}
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="50"
                  />
                </div>
              </div>

              {/* Top Performers Table */}
              {topPerformers && (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left border-b font-medium">Rank</th>
                        <th className="px-4 py-3 text-left border-b font-medium">QB</th>
                        <th className="px-4 py-3 text-left border-b font-medium">Team</th>
                        <th className="px-4 py-3 text-center border-b font-medium">Attempts</th>
                        <th className="px-4 py-3 text-center border-b font-medium">Completions</th>
                        <th className="px-4 py-3 text-center border-b font-medium">Yards</th>
                        <th className="px-4 py-3 text-center border-b font-medium">TDs</th>
                        <th className="px-4 py-3 text-center border-b font-medium">INTs</th>
                        <th className="px-4 py-3 text-center border-b font-medium">Comp%</th>
                        <th className="px-4 py-3 text-center border-b font-medium">Y/A</th>
                        <th className="px-4 py-3 text-center border-b font-medium">TD%</th>
                        <th className="px-4 py-3 text-center border-b font-medium">INT%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPerformers.map((qb, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 border-b font-bold text-center">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 border-b font-medium">{qb.player_name}</td>
                          <td className="px-4 py-3 border-b">{qb.team}</td>
                          <td className="px-4 py-3 border-b text-center">{qb.totalAttempts}</td>
                          <td className="px-4 py-3 border-b text-center">{qb.completions}</td>
                          <td className="px-4 py-3 border-b text-center">{qb.yards}</td>
                          <td className="px-4 py-3 border-b text-center">{qb.tds}</td>
                          <td className="px-4 py-3 border-b text-center">{qb.ints}</td>
                          <td className={`px-4 py-3 border-b text-center font-semibold ${getMetricColor('completion_rate', qb.completion_rate)}`}>
                            {qb.completion_rate}%
                          </td>
                          <td className={`px-4 py-3 border-b text-center font-semibold ${getMetricColor('yards_per_attempt', qb.yards_per_attempt)}`}>
                            {qb.yards_per_attempt}
                          </td>
                          <td className={`px-4 py-3 border-b text-center font-semibold ${getMetricColor('td_rate', qb.td_rate)}`}>
                            {qb.td_rate}%
                          </td>
                          <td className={`px-4 py-3 border-b text-center font-semibold ${getMetricColor('int_rate', qb.int_rate)}`}>
                            {qb.int_rate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Team Analysis Tab */}
          {activeTab === 'teams' && teamAnalysis && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Team Analysis</h2>
              
              <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left border-b font-medium">Team</th>
                      <th className="px-4 py-3 text-center border-b font-medium">QBs</th>
                      <th className="px-4 py-3 text-center border-b font-medium">Attempts</th>
                      <th className="px-4 py-3 text-center border-b font-medium">Completions</th>
                      <th className="px-4 py-3 text-center border-b font-medium">Yards</th>
                      <th className="px-4 py-3 text-center border-b font-medium">TDs</th>
                      <th className="px-4 py-3 text-center border-b font-medium">INTs</th>
                      <th className="px-4 py-3 text-center border-b font-medium">Comp%</th>
                      <th className="px-4 py-3 text-center border-b font-medium">Y/A</th>
                      <th className="px-4 py-3 text-center border-b font-medium">TD%</th>
                      <th className="px-4 py-3 text-center border-b font-medium">INT%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(teamAnalysis)
                      .sort(([,a], [,b]) => parseFloat(b.completionRate) - parseFloat(a.completionRate))
                      .map(([team, stats]) => (
                        <tr key={team} className="hover:bg-gray-50">
                          <td className="px-4 py-3 border-b font-medium">{team}</td>
                          <td className="px-4 py-3 border-b text-center">{stats.qbCount}</td>
                          <td className="px-4 py-3 border-b text-center">{stats.totalAttempts}</td>
                          <td className="px-4 py-3 border-b text-center">{stats.totalCompletions}</td>
                          <td className="px-4 py-3 border-b text-center">{stats.totalYards}</td>
                          <td className="px-4 py-3 border-b text-center">{stats.totalTDs}</td>
                          <td className="px-4 py-3 border-b text-center">{stats.totalInts}</td>
                          <td className={`px-4 py-3 border-b text-center font-semibold ${getMetricColor('completion_rate', stats.completionRate)}`}>
                            {stats.completionRate}%
                          </td>
                          <td className={`px-4 py-3 border-b text-center font-semibold ${getMetricColor('yards_per_attempt', stats.yardsPerAttempt)}`}>
                            {stats.yardsPerAttempt}
                          </td>
                          <td className={`px-4 py-3 border-b text-center font-semibold ${getMetricColor('td_rate', stats.tdRate)}`}>
                            {stats.tdRate}%
                          </td>
                          <td className={`px-4 py-3 border-b text-center font-semibold ${getMetricColor('int_rate', stats.intRate)}`}>
                            {stats.intRate}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Compare QBs Tab */}
          {activeTab === 'compare' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Compare Quarterbacks</h2>
              
              {/* QB Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QB 1 (PFR ID)
                  </label>
                  <input
                    type="text"
                    value={comparisonQBs.qb1}
                    onChange={(e) => setComparisonQBs(prev => ({ ...prev, qb1: e.target.value }))}
                    placeholder="e.g., MahomPa00"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QB 2 (PFR ID)
                  </label>
                  <input
                    type="text"
                    value={comparisonQBs.qb2}
                    onChange={(e) => setComparisonQBs(prev => ({ ...prev, qb2: e.target.value }))}
                    placeholder="e.g., AlleJo02"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <button
                onClick={handleCompareQBs}
                disabled={loading || !comparisonQBs.qb1 || !comparisonQBs.qb2}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Comparing...' : 'Compare QBs'}
              </button>

              {/* Comparison Results */}
              {comparisonResult && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Comparison Results</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* QB 1 Stats */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-3">QB 1</h4>
                      <div className="space-y-2 text-sm">
                        <div>Attempts: {comparisonResult.qb1.attempts}</div>
                        <div>Completions: {comparisonResult.qb1.completions}</div>
                        <div>Yards: {comparisonResult.qb1.yards}</div>
                        <div>TDs: {comparisonResult.qb1.tds}</div>
                        <div>INTs: {comparisonResult.qb1.ints}</div>
                        <div className="font-semibold">Comp%: {comparisonResult.qb1.completionRate.toFixed(1)}%</div>
                        <div className="font-semibold">Y/A: {comparisonResult.qb1.yardsPerAttempt.toFixed(1)}</div>
                        <div className="font-semibold">TD%: {comparisonResult.qb1.tdRate.toFixed(1)}%</div>
                        <div className="font-semibold">INT%: {comparisonResult.qb1.intRate.toFixed(1)}%</div>
                      </div>
                    </div>

                    {/* QB 2 Stats */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-3">QB 2</h4>
                      <div className="space-y-2 text-sm">
                        <div>Attempts: {comparisonResult.qb2.attempts}</div>
                        <div>Completions: {comparisonResult.qb2.completions}</div>
                        <div>Yards: {comparisonResult.qb2.yards}</div>
                        <div>TDs: {comparisonResult.qb2.tds}</div>
                        <div>INTs: {comparisonResult.qb2.ints}</div>
                        <div className="font-semibold">Comp%: {comparisonResult.qb2.completionRate.toFixed(1)}%</div>
                        <div className="font-semibold">Y/A: {comparisonResult.qb2.yardsPerAttempt.toFixed(1)}</div>
                        <div className="font-semibold">TD%: {comparisonResult.qb2.tdRate.toFixed(1)}%</div>
                        <div className="font-semibold">INT%: {comparisonResult.qb2.intRate.toFixed(1)}%</div>
                      </div>
                    </div>

                    {/* Differences */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">Difference (QB1 - QB2)</h4>
                      <div className="space-y-2 text-sm">
                        <div className={`font-semibold ${comparisonResult.comparison.completionRateDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Comp%: {comparisonResult.comparison.completionRateDiff > 0 ? '+' : ''}{comparisonResult.comparison.completionRateDiff.toFixed(1)}%
                        </div>
                        <div className={`font-semibold ${comparisonResult.comparison.yardsPerAttemptDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Y/A: {comparisonResult.comparison.yardsPerAttemptDiff > 0 ? '+' : ''}{comparisonResult.comparison.yardsPerAttemptDiff.toFixed(1)}
                        </div>
                        <div className={`font-semibold ${comparisonResult.comparison.tdRateDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          TD%: {comparisonResult.comparison.tdRateDiff > 0 ? '+' : ''}{comparisonResult.comparison.tdRateDiff.toFixed(1)}%
                        </div>
                        <div className={`font-semibold ${comparisonResult.comparison.intRateDiff < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          INT%: {comparisonResult.comparison.intRateDiff > 0 ? '+' : ''}{comparisonResult.comparison.intRateDiff.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Raw Data Tab */}
          {activeTab === 'raw' && data && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Raw Data</h2>
              
              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-600">
                  Showing {data.length} records of 3rd & 1-3 splits data
                </p>
                <button
                  onClick={downloadCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Download CSV
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded overflow-x-auto max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-800">
                  {JSON.stringify(data.slice(0, 10), null, 2)}
                </pre>
                {data.length > 10 && (
                  <p className="text-gray-500 mt-2">
                    ... and {data.length - 10} more records
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThirdAndShortTest; 