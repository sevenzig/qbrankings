import React, { useState } from 'react';
import DynamicQBRankings from './components/DynamicQBRankings';
import Documentation from './components/Documentation';

function App() {
  const [currentView, setCurrentView] = useState('rankings');

  const showDocumentation = () => setCurrentView('documentation');
  const showRankings = () => setCurrentView('rankings');

  if (currentView === 'documentation') {
    return <Documentation onBack={showRankings} />;
  }

  return <DynamicQBRankings onShowDocumentation={showDocumentation} />;
}

export default App
