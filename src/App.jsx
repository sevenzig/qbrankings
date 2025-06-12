import React, { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import GoogleAnalytics from './components/GoogleAnalytics';
import DynamicQBRankings from './components/DynamicQBRankings';
import Documentation from './components/Documentation';

// Get GA Measurement ID from environment variables
// In production, set VITE_GA_MEASUREMENT_ID in your Vercel environment variables
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

function App() {
  const [currentView, setCurrentView] = useState('rankings');

  const showDocumentation = () => setCurrentView('documentation');
  const showRankings = () => setCurrentView('rankings');

  if (currentView === 'documentation') {
    return (
      <>
        <Documentation onBack={showRankings} />
        <Analytics />
        <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
      </>
    );
  }

  return (
    <>
      <div>
        <DynamicQBRankings onShowDocumentation={showDocumentation} />
      </div>
      <Analytics />
      <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
    </>
  );
}

export default App
