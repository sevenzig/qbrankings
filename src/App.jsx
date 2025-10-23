import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import GoogleAnalytics from './components/GoogleAnalytics';
import NavigationSlideMenu from './components/NavigationSlideMenu.jsx';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext.jsx';
import DynamicQBRankings from './components/DynamicQBRankings';
import Documentation from './components/Documentation';
import ThirdAndShortTest from './components/ThirdAndShortTest';
import ThirdAndShortDiagnostic from './components/ThirdAndShortDiagnostic';
import SupabaseTest from './components/SupabaseTest';
import SplitsComparison from './components/SplitsComparison';
import DataSourceSelector from './components/DataSourceSelector.jsx';
import { useUnifiedQBData } from './hooks/useUnifiedQBData.js';

// Get GA Measurement ID from environment variables
// In production, set VITE_GA_MEASUREMENT_ID in your Vercel environment variables
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

function App() {
  return (
    <NavigationProvider>
      <Router>
        <div>
          <Routes>
            <Route path="/" element={<AppWithNavigation />} />
            <Route path="/documentation" element={<DocumentationPage />} />
            <Route path="/splits-comparison" element={<SplitsComparisonPage />} />
            <Route path="/sql-test" element={<SQLTestPage />} />
          </Routes>
        </div>
        <Analytics />
        <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
      </Router>
    </NavigationProvider>
  );
}

// Main app with navigation
const AppWithNavigation = () => {
  return (
    <>
      <DynamicQBRankings />
      <NavigationSlideMenu />
    </>
  );
};

// Documentation page with navigation
const DocumentationPage = () => {
  return (
    <>
      <Documentation />
      <NavigationSlideMenu />
    </>
  );
};

// Splits Comparison Page Component
const SplitsComparisonPage = () => {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Link
                  to="/"
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  ← Back to Rankings
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    QB Splits Comparison
                  </h1>
                  <p className="text-gray-600">
                    Compare any statistic from qb_splits or qb_splits_advanced tables
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <SplitsComparison />
        </div>
      </div>
      <NavigationSlideMenu />
    </>
  );
};

// SQL Test Page Component
const SQLTestPage = () => {
  const [activeTab, setActiveTab] = useState('connection');
  
  // Initialize the unified data hook for data source management
  const {
    dataSource,
    switchDataSource,
    isSwitching,
    isSupabaseAvailable
  } = useUnifiedQBData('csv'); // Default to CSV for testing

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Link
                  to="/"
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  ← Back to Rankings
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    SQL Test & Data Examples
                  </h1>
                  <p className="text-gray-600">
                    Test Supabase connections and explore 3rd & 1-3 quarterback data
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Source Selector */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Data Source Configuration</h2>
            <DataSourceSelector
              dataSource={dataSource}
              onDataSourceChange={switchDataSource}
              loading={isSwitching}
              disabled={!isSupabaseAvailable}
            />
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('connection')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'connection'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🔧 Connection Test
              </button>
              <button
                onClick={() => setActiveTab('diagnostic')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'diagnostic'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🔍 Data Diagnostic
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'analysis'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📊 Data Analysis
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-lg">
            {activeTab === 'connection' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Supabase Connection Test</h2>
                <SupabaseTest />
              </div>
            )}
            
            {activeTab === 'diagnostic' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">3rd & 1-3 Data Diagnostic</h2>
                <ThirdAndShortDiagnostic />
              </div>
            )}
            
            {activeTab === 'analysis' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">3rd & 1-3 Data Analysis</h2>
                <ThirdAndShortTest />
              </div>
            )}
          </div>
        </div>
      </div>
      <NavigationSlideMenu />
    </>
  );
};

export default App;
