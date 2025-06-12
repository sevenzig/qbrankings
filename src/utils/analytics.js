import ReactGA from 'react-ga4';

// Initialize Google Analytics
export const initGA = (measurementId) => {
  if (measurementId && measurementId !== 'G-XXXXXXXXXX') {
    ReactGA.initialize(measurementId);
    return true;
  }
  return false;
};

// Track page views
export const trackPageView = (path = null) => {
  const page = path || window.location.pathname + window.location.search;
  ReactGA.send({ hitType: "pageview", page });
};

// Track custom events
export const trackEvent = (action, category = 'User Interaction', label = null, value = null) => {
  ReactGA.event({
    action,
    category,
    label,
    value
  });
};

// Track QB Rankings specific events
export const trackQBEvent = {
  // Track when user changes ranking weights
  weightChange: (metric, newWeight) => {
    trackEvent('Weight Change', 'QB Rankings', metric, newWeight);
  },
  
  // Track when user refreshes data
  dataRefresh: () => {
    trackEvent('Data Refresh', 'QB Rankings');
  },
  
  // Track when user views documentation
  viewDocumentation: () => {
    trackEvent('View Documentation', 'QB Rankings');
  },
  
  // Track when user shares rankings
  shareRankings: (method = 'unknown') => {
    trackEvent('Share Rankings', 'QB Rankings', method);
  },
  
  // Track top QB selections
  selectTopQB: (qbName) => {
    trackEvent('Select Top QB', 'QB Rankings', qbName);
  }
};

export default {
  initGA,
  trackPageView,
  trackEvent,
  trackQBEvent
}; 