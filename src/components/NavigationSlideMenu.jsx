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

const NavigationSlideMenu = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);


  const isActiveRoute = useCallback((path) => {
    return location.pathname === path;
  }, [location.pathname]);

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 right-4 z-50 bg-blue-600/20 hover:bg-blue-600/30 backdrop-blur-lg p-3 rounded-lg transition-colors text-white"
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
        fixed top-0 right-0 h-full w-96 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 
        transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        shadow-2xl
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Navigation</h2>
          <button
            onClick={closeMenu}
            className="text-white/70 hover:text-white transition-colors"
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
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActiveRoute('/') 
                    ? 'bg-blue-500/30 text-white' 
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <BarChart3 size={20} />
                <span className="font-medium">QB Rankings</span>
              </Link>
              
              <Link
                to="/splits-comparison"
                onClick={closeMenu}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActiveRoute('/splits-comparison') 
                    ? 'bg-orange-500/30 text-white' 
                    : 'text-orange-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <BarChart3 size={20} />
                <span className="font-medium">Splits Comparison</span>
              </Link>
              
              <Link
                to="/documentation"
                onClick={closeMenu}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActiveRoute('/documentation') 
                    ? 'bg-green-500/30 text-white' 
                    : 'text-green-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <BookOpen size={20} />
                <span className="font-medium">Documentation</span>
              </Link>
              
            </div>
          </div>



          {/* Footer */}
          <div className="p-6 border-t border-white/10 mt-auto">
            <div className="text-center text-blue-300 text-sm">
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
