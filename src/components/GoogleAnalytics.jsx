import { useEffect } from 'react';
import { initGA, trackPageView } from '../utils/analytics';

const GoogleAnalytics = ({ measurementId }) => {
  useEffect(() => {
    // Initialize Google Analytics with your Measurement ID
    if (initGA(measurementId)) {
      // Track the initial page view
      trackPageView();
    }
  }, [measurementId]);

  // Track page views when location changes (for SPA navigation)
  useEffect(() => {
    const handleLocationChange = () => {
      if (measurementId && measurementId !== 'G-XXXXXXXXXX') {
        trackPageView();
      }
    };

    // Listen for browser navigation events
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [measurementId]);

  return null;
};

export default GoogleAnalytics; 