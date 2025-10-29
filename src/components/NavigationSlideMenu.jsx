/**
 * NavigationSlideMenu - Right-side slide-in navigation menu
 * 
 * Performance Optimizations:
 * 1. Memoized with React.memo to prevent unnecessary re-renders
 * 2. useCallback for all event handlers
 * 3. Single responsibility principle - navigation only
 * 4. High z-index positioning to overlay content
 */
import React, { useState, useCallback, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, BarChart3, BookOpen } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext.jsx';
import { PHILOSOPHY_PRESETS } from '../constants/teamData.js';

const NavigationSlideMenu = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  
  // Get navigation context
  const {
    currentPreset,
    onWeightsChange,
    onPresetChange
  } = useNavigation();

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const isActiveRoute = useCallback((path) => {
    return location.pathname === path;
  }, [location.pathname]);

  // Apply preset function - simplified version that only handles main weights
  // Sub-component weights will be handled by the main component when it detects preset change
  const applyPreset = useCallback((presetName) => {
    const preset = PHILOSOPHY_PRESETS[presetName];
    if (!preset) return;
    
    // Extract only the main weight categories
    const { description, supportWeights, statsWeights, teamWeights, clutchWeights, durabilityWeights, efficiencyWeights, protectionWeights, volumeWeights, ...weightCategories } = preset;
    
    // Apply main weights through context
    onWeightsChange(weightCategories);
    onPresetChange(presetName);
    
    // Close menu after applying preset
    closeMenu();
  }, [onWeightsChange, onPresetChange, closeMenu]);

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 right-4 z-50 bg-glass-medium hover:bg-glass-strong border border-glass-border backdrop-blur-lg p-3 rounded-lg transition-all duration-300 text-white hover:shadow-glow-blue-sm"
        aria-label="Open navigation menu"
      >
        <Menu size={24} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeMenu}
        />
      )}

      {/* Slide Menu */}
      <div className={`
        fixed top-0 right-0 h-full w-96 bg-glass-medium backdrop-blur-xl border-l border-glass-border
        transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        shadow-glass-lg
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-glass-border">
          <h2 className="text-xl font-bold text-white">Navigation</h2>
          <button
            onClick={closeMenu}
            className="text-slate-300 hover:text-white transition-all duration-300 hover:bg-glass-light p-2 rounded-lg"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="h-full overflow-y-auto pb-20">
          {/* Main Navigation */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Home size={20} />
              Main Pages
            </h3>
            <div className="space-y-2">
              <Link
                to="/"
                onClick={closeMenu}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                  isActiveRoute('/') 
                    ? 'bg-accent-500/30 text-white border border-accent-400/40' 
                    : 'text-slate-200 hover:bg-glass-light hover:text-white border border-transparent hover:border-glass-border'
                }`}
              >
                <BarChart3 size={20} />
                <span className="font-medium">QB Rankings</span>
              </Link>
              
              <Link
                to="/splits-comparison"
                onClick={closeMenu}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                  isActiveRoute('/splits-comparison') 
                    ? 'bg-amber-500/30 text-white border border-amber-400/40' 
                    : 'text-slate-200 hover:bg-glass-light hover:text-white border border-transparent hover:border-glass-border'
                }`}
              >
                <BarChart3 size={20} />
                <span className="font-medium">Splits Comparison</span>
              </Link>
              
              <Link
                to="/documentation"
                onClick={closeMenu}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                  isActiveRoute('/documentation') 
                    ? 'bg-emerald-500/30 text-white border border-emerald-400/40' 
                    : 'text-slate-200 hover:bg-glass-light hover:text-white border border-transparent hover:border-glass-border'
                }`}
              >
                <BookOpen size={20} />
                <span className="font-medium">Documentation</span>
              </Link>
              
            </div>
          </div>

          {/* QB Philosophy Presets */}
          <div className="p-6 border-t border-glass-border">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              QB Philosophy Presets
            </h3>
            <div className="space-y-2">
              {Object.entries(PHILOSOPHY_PRESETS).map(([presetKey, preset]) => (
                <button
                  key={presetKey}
                  onClick={() => applyPreset(presetKey)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-300 text-left ${
                    currentPreset === presetKey 
                      ? 'bg-accent-500/30 text-white border border-accent-400/50' 
                      : 'text-slate-200 hover:bg-glass-light hover:text-white border border-transparent hover:border-glass-border'
                  }`}
                  title={preset.description}
                >
                  <span className="text-lg">
                    {presetKey === 'default' ? '⚡' :
                     presetKey === 'winner' ? '🏆' :
                     presetKey === 'analyst' ? '📊' :
                     presetKey === 'context' ? '🎯' :
                     presetKey === 'volumeHero' ? '📈' :
                     presetKey === 'efficiencyPurist' ? '⚡' :
                     presetKey === 'balancedAttack' ? '⚖️' :
                     presetKey === 'scottsPreset' ? '🎯' : '🎯'}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">
                      {presetKey === 'default' ? 'Pure QB Quality' :
                       presetKey === 'winner' ? 'Winner Focus' :
                       presetKey === 'analyst' ? 'Analyst View' :
                       presetKey === 'context' ? 'Context Matters' :
                       presetKey === 'volumeHero' ? 'Volume Hero' :
                       presetKey === 'efficiencyPurist' ? 'Efficiency Purist' :
                       presetKey === 'balancedAttack' ? 'Balanced Attack' :
                       presetKey === 'scottsPreset' ? 'Scott\'s Preset' : presetKey}
                    </div>
                    <div className="text-xs opacity-75 line-clamp-1">
                      {preset.description.split(' - ')[1] || preset.description}
                    </div>
                  </div>
                  {currentPreset === presetKey && (
                    <div className="text-blue-300 text-sm">✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-glass-border mt-auto">
            <div className="text-center text-slate-300 text-sm">
              <p>🚀 Dynamic Rankings</p>
              <p>📈 Per-Season Analysis</p>
              <p>🎛️ Customizable Weights</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default NavigationSlideMenu;
