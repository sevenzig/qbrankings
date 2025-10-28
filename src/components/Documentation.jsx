import React, { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';

/**
 * Documentation - Comprehensive QB rankings methodology documentation
 * 
 * Performance Optimizations:
 * 1. Memoized with React.memo to prevent unnecessary re-renders
 * 2. Scroll event listener with proper cleanup
 * 3. Single responsibility principle - documentation display only
 */
const Documentation = memo(() => {
  // Scroll to top functionality
  const [showScrollTop, setShowScrollTop] = useState(false);
  // Modal state for technical details
  const [showTechnicalModal, setShowTechnicalModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="mb-4 bg-blue-500/20 hover:bg-blue-500/30 px-4 py-2 rounded-lg text-blue-200 hover:text-white transition-colors"
          >
            ← Back to Rankings
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">
            🏈 QB Rankings Methodology
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Comprehensive documentation of our quarterback evaluation system
          </p>
        </div>

        {/* Navigation */}
        <div className="bg-glass-medium backdrop-blur-xl rounded-xl p-6 mb-8 border border-glass-border">
          <h2 className="text-2xl font-bold text-white mb-4">📋 Documentation Sections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="#statistical-methodology" className="bg-glass-light hover:bg-glass-medium p-4 rounded-lg transition-all duration-300 border border-glass-border">
              <h3 className="text-lg font-bold text-cyan-300 mb-2">📈 Statistical Methodology</h3>
              <p className="text-sm text-blue-200">Z-scores, standard deviation, and percentile-based scoring</p>
            </a>
            <a href="#quarterback-scoring" className="bg-glass-light hover:bg-glass-medium p-4 rounded-lg transition-all duration-300 border border-glass-border">
              <h3 className="text-lg font-bold text-green-300 mb-2">📊 Overall System</h3>
              <p className="text-sm text-blue-200">Complete QB evaluation methodology and QEI calculation</p>
            </a>
            <a href="#statistical-performance" className="bg-glass-light hover:bg-glass-medium p-4 rounded-lg transition-all duration-300 border border-glass-border">
              <h3 className="text-lg font-bold text-blue-300 mb-2">📉 Statistical Performance</h3>
              <p className="text-sm text-blue-200">Efficiency, volume, and risk management metrics</p>
            </a>
            <a href="#team-scoring" className="bg-glass-light hover:bg-glass-medium p-4 rounded-lg transition-all duration-300 border border-glass-border">
              <h3 className="text-lg font-bold text-yellow-300 mb-2">🏆 Team Success</h3>
              <p className="text-sm text-blue-200">Win percentage, playoff achievements, and availability</p>
            </a>
            <a href="#supporting-cast" className="bg-glass-light hover:bg-glass-medium p-4 rounded-lg transition-all duration-300 border border-glass-border">
              <h3 className="text-lg font-bold text-purple-300 mb-2">🏟️ Supporting Cast</h3>
              <p className="text-sm text-blue-200">Context-aware evaluation of organizational support</p>
            </a>
            <a href="#durability-scoring" className="bg-glass-light hover:bg-glass-medium p-4 rounded-lg transition-all duration-300 border border-glass-border">
              <h3 className="text-lg font-bold text-orange-300 mb-2">⚡ Durability</h3>
              <p className="text-sm text-blue-200">Availability and consistency (Work in Progress)</p>
            </a>
            <a href="#clutch-scoring" className="bg-glass-light hover:bg-glass-medium p-4 rounded-lg transition-all duration-300 border border-glass-border">
              <h3 className="text-lg font-bold text-red-300 mb-2">💎 Clutch Performance</h3>
              <p className="text-sm text-blue-200">Critical situations and late-game heroics (Work in Progress)</p>
            </a>
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="space-y-12">
          
          {/* Statistical Methodology */}
          <section id="statistical-methodology" className="bg-glass-medium backdrop-blur-xl rounded-xl p-6 border border-glass-border">
            <h2 className="text-3xl font-bold text-cyan-300 mb-6 flex items-center">
              📈 Statistical Scoring Methodology
            </h2>
            <div className="prose prose-invert max-w-none">
              <div className="bg-white/5 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-white mb-3">Z-Score Normalization</h3>
                <p className="text-blue-200 mb-4">
                  Our scoring system uses <strong>z-score normalization</strong> to fairly compare quarterback performance 
                  across different eras, teams, and playing conditions. Individual category scores (Team, Stats, Clutch, etc.) 
                  are calculated as z-scores, then hierarchically weighted to create a composite z-score, which is finally 
                  converted to a percentile (0-100) for the overall QEI score.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-cyan-300">Why Z-Scores?</h4>
                    <ul className="text-sm text-blue-200 mt-2 space-y-1">
                      <li>• <strong>Era-Adjusted:</strong> Accounts for rule changes and evolving gameplay</li>
                      <li>• <strong>Outlier Handling:</strong> Prevents extreme values from skewing rankings</li>
                      <li>• <strong>Fair Comparisons:</strong> Measures performance relative to peers</li>
                      <li>• <strong>Statistical Rigor:</strong> Based on standard deviation and distribution</li>
                    </ul>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-cyan-300">Metrics Using Z-Scores</h4>
                    <ul className="text-sm text-blue-200 mt-2 space-y-1">
                      <li>• <strong>Statistical Performance:</strong> ANY/A, TD%, Completion%, Sack%, Turnover Rate, Passing/Rushing yards & TDs</li>
                      <li>• <strong>Team Success:</strong> Win percentage, Offensive DVOA, Playoff achievements</li>
                      <li>• <strong>Supporting Cast:</strong> Offensive line, Weapons, Defense quality</li>
                      <li>• <strong>Clutch Performance:</strong> Game-winning drives, Comebacks, Playoff bonuses</li>
                      <li>• <strong>Durability Exception:</strong> Uses linear 0-100 scoring (not z-scores)</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-white mb-3">Hierarchical Scoring Process</h3>
                <p className="text-blue-200 mb-4">
                  The system uses a <strong>two-stage process</strong>: First, individual categories (Team, Stats, Clutch, etc.) 
                  are calculated as z-scores. These z-scores are then hierarchically weighted based on user preferences to create 
                  a composite z-score. Only the final composite z-score is converted to a percentile (0-100) for the QEI score.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-cyan-300 mb-2">Stage 1: Individual Z-Scores</h4>
                    <p className="text-blue-200 text-xs">
                      Each category (Team, Stats, Clutch, etc.) calculates z-scores for comparison within that category. 
                      Z-scores are capped at ±3 standard deviations to handle outliers.
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-cyan-300 mb-2">Stage 2: Hierarchical Weighting</h4>
                    <p className="text-blue-200 text-xs">
                      User-defined weights combine category z-scores into a composite z-score. 
                      This preserves statistical variance while allowing customization.
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-cyan-300 mb-2">Stage 3: Percentile Conversion</h4>
                    <p className="text-blue-200 text-xs">
                      Only the final composite z-score becomes a percentile (0-100) for the QEI score. 
                      50 = average, 84 = elite (+1 SD), 16 = below average (-1 SD).
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => setShowTechnicalModal(true)}
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 px-6 py-3 rounded-lg text-cyan-200 hover:text-white transition-colors font-medium"
                >
                  📚 Learn More - Technical Details
                </button>
              </div>
            </div>
          </section>
          
          {/* Quarterback Scoring System */}
          <section id="quarterback-scoring" className="bg-glass-medium backdrop-blur-xl rounded-xl p-6 border border-glass-border">
            <h2 className="text-3xl font-bold text-green-300 mb-6 flex items-center">
              📊 Quarterback Excellence Index (QEI) System
            </h2>
            <div className="prose prose-invert max-w-none">
              <div className="bg-white/5 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-white mb-3">System Overview</h3>
                <p className="text-blue-200 mb-4">
                  The QB Rankings system evaluates quarterback performance using a comprehensive Quarterback Excellence Index (QEI) 
                  that combines five major scoring categories. Each category is scored on a 0-100 scale and weighted based on user preferences. 
                  Currently focused on the 2025 season with full customization available.
                </p>
                <div className="bg-white/5 p-3 rounded">
                  <h4 className="font-bold text-green-300 mb-3">Current Default Weights (2025 Season)</h4>
                  <div className="space-y-2 text-sm text-blue-200">
                    <div className="flex justify-between items-center">
                      <span>• <strong>Statistical Performance:</strong> 40% (Active)</span>
                      <span className="text-green-400">✓ Enabled</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>• <strong>Team Success:</strong> 30% (Active)</span>
                      <span className="text-green-400">✓ Enabled</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>• <strong>Clutch Performance:</strong> 15% (Default)</span>
                      <span className="text-yellow-400">⚠ Disabled</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>• <strong>Durability:</strong> 10% (Default)</span>
                      <span className="text-yellow-400">⚠ Disabled</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>• <strong>Supporting Cast:</strong> 5% (Default)</span>
                      <span className="text-yellow-400">⚠ Disabled</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-3">Temporarily Disabled Sliders</h3>
                <div className="space-y-4">
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-red-300">💎 Clutch Performance (15% default)</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      <strong>Status:</strong> Work in Progress<br />
                      <strong>Reason:</strong> Building comprehensive clutch system with 3rd/4th down conversions, 
                      4th quarter performance metrics, and late-season splits (November/December/January). 
                      These advanced metrics require complex database queries currently in development.
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-orange-300">⚡ Durability (10% default)</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      <strong>Status:</strong> Temporarily Disabled<br />
                      <strong>Reason:</strong> Awaiting complete 2025 season data integration. 
                      Will be re-enabled once sufficient games have been played to accurately assess availability patterns.
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-purple-300">🏟️ Supporting Cast (5% default)</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      <strong>Status:</strong> Currently Unavailable<br />
                      <strong>Reason:</strong> Missing 2025 DVOA (Defense-adjusted Value Over Average) data required 
                      for accurate offensive line, weapons, and defensive quality assessments. Will be enabled when 
                      Football Outsiders releases 2025 metrics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Statistical Performance */}
          <section id="statistical-performance" className="bg-glass-medium backdrop-blur-xl rounded-xl p-6 border border-glass-border">
            <h2 className="text-3xl font-bold text-blue-300 mb-6 flex items-center">
              📉 Statistical Performance Analysis
            </h2>
            <div className="prose prose-invert max-w-none">
              <div className="bg-white/5 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-white mb-3">Why This System Works</h3>
                <p className="text-blue-200 mb-4">
                  The current default statistical weighting system (40% of overall QEI) represents the optimal balance 
                  for evaluating quarterback performance. This methodology focuses on three core dimensions that best 
                  predict both individual excellence and team success.
                </p>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-white mb-3">Hierarchical Weighting Structure</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-blue-300">Efficiency (50%)</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      <strong>Key Metrics:</strong> ANY/A, TD%, Completion%<br />
                      <strong>Why:</strong> Efficiency metrics are the strongest predictors of winning. 
                      Yards per attempt accounts for big plays, TD% shows red zone effectiveness, 
                      and completion percentage indicates accuracy and decision-making.
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-blue-300">Volume/Production (30%)</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      <strong>Key Metrics:</strong> Passing yards, passing TDs, rushing production<br />
                      <strong>Why:</strong> Volume demonstrates workload and team trust. 
                      Elite QBs handle larger offensive responsibilities. Rushing production 
                      reflects the modern dual-threat QB value.
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-blue-300">Risk Management (20%)</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      <strong>Key Metrics:</strong> INT%, Fumble%, Sack%<br />
                      <strong>Why:</strong> Turnover avoidance and pocket presence prevent losses. 
                      Low interception rates indicate smart decision-making. Controlling sack rate 
                      shows awareness and quick processing.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-3">Statistical Foundation</h3>
                <p className="text-blue-200 mb-3">
                  The z-score based approach enables fair cross-era comparisons by normalizing all statistics 
                  relative to league average for each season. This accounts for:
                </p>
                <ul className="text-sm text-blue-200 space-y-2">
                  <li>• <strong>Rule Changes:</strong> Defensive holding penalties, roughing the passer evolution</li>
                  <li>• <strong>Gameplay Evolution:</strong> RPO proliferation, spread offense adoption, increased passing volume</li>
                  <li>• <strong>Era Adjustments:</strong> 2004 rule changes inflated passing stats; z-scores normalize this</li>
                  <li>• <strong>Outlier Protection:</strong> Capping at ±3 standard deviations prevents extreme performances from distorting rankings</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Team Scoring System */}
          <section id="team-scoring" className="bg-glass-medium backdrop-blur-xl rounded-xl p-6 border border-glass-border">
            <h2 className="text-3xl font-bold text-yellow-300 mb-6 flex items-center">
              🏆 Team Success Scoring
            </h2>
            <div className="prose prose-invert max-w-none">
              <div className="bg-white/5 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-white mb-3">Why Team Success Matters</h3>
                <p className="text-blue-200 mb-4">
                  Team success comprises 30% of the overall QEI because <strong>quarterbacks are ultimately judged by wins</strong>. 
                  The position has the greatest individual impact on game outcomes in football. Win percentage is the most direct 
                  measure of QB impact, while playoff success demonstrates the ability to elevate performance when stakes are highest.
                </p>
                <ul className="text-sm text-blue-200 space-y-2">
                  <li>• <strong>Winning Correlation:</strong> QB play is the single strongest predictor of team success</li>
                  <li>• <strong>High-Pressure Performance:</strong> Playoff achievements reveal ability under maximum scrutiny</li>
                  <li>• <strong>Leadership Factor:</strong> Great QBs find ways to win even when stats aren't elite</li>
                  <li>• <strong>Historical Context:</strong> Every Hall of Fame discussion centers on championships and playoff wins</li>
                </ul>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-white mb-3">Components (Max 100 points)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-yellow-300">Regular Season Win %</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      0-50 points based on (Win% ^ 0.6) × 50. Includes weighted playoff performance and bye week bonuses.
                      <br /><strong>Formula balances:</strong> Rewards winning without over-penalizing close losses.
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-yellow-300">Offensive Output Score</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      0-15 points. Based on team offensive DVOA and overall efficiency metrics.
                      <br /><strong>Why included:</strong> Separates QB contribution from pure W-L record luck.
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-yellow-300">Career Playoff Achievement</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      0-45 points (capped). Super Bowl wins (15 pts), appearances (9 pts), plus playoff participation bonuses.
                      <br /><strong>Rationale:</strong> Postseason success is the ultimate QB evaluation metric.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-3">Playoff Round Weighting</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center bg-white/5 p-3 rounded">
                    <div className="font-bold text-yellow-300">Super Bowl Win</div>
                    <div className="text-blue-200">0.6 weight</div>
                  </div>
                  <div className="text-center bg-white/5 p-3 rounded">
                    <div className="font-bold text-yellow-300">Conf Championship Win</div>
                    <div className="text-blue-200">0.42 weight</div>
                  </div>
                  <div className="text-center bg-white/5 p-3 rounded">
                    <div className="font-bold text-yellow-300">Divisional Win</div>
                    <div className="text-blue-200">0.3 weight</div>
                  </div>
                  <div className="text-center bg-white/5 p-3 rounded">
                    <div className="font-bold text-yellow-300">Wild Card Win</div>
                    <div className="text-blue-200">0.21 weight</div>
                  </div>
                </div>
                <p className="text-sm text-blue-200 mt-3 text-center">
                  Playoff wins receive progressively higher weights based on round importance, recognizing that 
                  championship-round victories represent peak performance under ultimate pressure.
                </p>
              </div>
            </div>
          </section>

          {/* Supporting Cast */}
          <section id="supporting-cast" className="bg-glass-medium backdrop-blur-xl rounded-xl p-6 border border-glass-border">
            <h2 className="text-3xl font-bold text-purple-300 mb-6 flex items-center">
              🏟️ Supporting Cast Quality Assessment
            </h2>
            <div className="prose prose-invert max-w-none">
              <div className="bg-white/5 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-white mb-3">Context-Aware Scoring Logic</h3>
                <p className="text-blue-200 mb-4">
                  <strong>"Excellence Despite Adversity"</strong> - This system uses an <strong>inverted scoring approach</strong> 
                  where better supporting cast quality results in <strong>lower QB scores</strong>. The reasoning: A quarterback 
                  who produces elite statistics with a poor offensive line, limited weapons, and weak defense deserves more credit 
                  than one who achieves similar numbers with elite organizational support.
                </p>
                <div className="bg-white/5 p-3 rounded mb-4">
                  <h4 className="font-bold text-purple-300 mb-2">Why This Matters</h4>
                  <p className="text-sm text-blue-200">
                    This adjustment provides fair context for QB evaluation. Great stats with poor support is objectively 
                    more impressive than great stats with elite support. This scoring category rewards quarterbacks who elevate 
                    their teams despite lacking talent around them, while contextualizing the achievements of QBs in ideal situations.
                  </p>
                </div>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-white mb-3">Assessment Components</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-purple-300">Offensive Line Quality</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      0-35 points. Pass protection, run blocking, PBWR/RBWR metrics.
                      <br /><strong>Poor OL = Higher QB Score:</strong> NE (35 pts), HOU (33 pts)
                      <br /><strong>Elite OL = Lower QB Score:</strong> DEN (0 pts), PHI (3 pts)
                      <br /><em className="text-xs">Producing with poor protection is impressive</em>
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-purple-300">Weapons Quality</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      0-40 points. WR/TE/RB talent, depth, versatility.
                      <br /><strong>Limited Weapons = Higher QB Score:</strong> CAR (40 pts), NE (39 pts)
                      <br /><strong>Elite Weapons = Lower QB Score:</strong> CIN (2 pts), MIA (4 pts)
                      <br /><em className="text-xs">Elite stats with limited targets shows true QB skill</em>
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-purple-300">Defense Quality</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      0-25 points. Field position, game flow impact.
                      <br /><strong>Weak Defense = Higher QB Score:</strong> CAR (25 pts), NE (24 pts)
                      <br /><strong>Elite Defense = Lower QB Score:</strong> BAL (0 pts), BUF (1 pt)
                      <br /><em className="text-xs">Carrying weak defenses demonstrates leadership</em>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-3">💡 Implementation Status</h3>
                <p className="text-blue-200 mb-3">
                  <strong>✅ This inverted logic is already implemented in the system.</strong> The supporting cast z-score 
                  is automatically inverted during the hierarchical calculation, so QBs with elite support receive 
                  penalty points while QBs with poor support receive bonus points.
                </p>
                <p className="text-blue-200">
                  This ensures that when evaluating QB performance, we account for the talent around them. 
                  Patrick Mahomes with elite weapons and protection is expected to excel. A QB producing at a high level 
                  with bottom-tier support deserves additional recognition. This creates a more complete, context-aware evaluation 
                  that separates individual QB excellence from organizational advantages.
                </p>
              </div>
            </div>
          </section>

          {/* Durability */}
          <section id="durability-scoring" className="bg-glass-medium backdrop-blur-xl rounded-xl p-6 border border-glass-border">
            <h2 className="text-3xl font-bold text-orange-300 mb-6 flex items-center">
              ⚡ Durability & Availability
            </h2>
            <div className="prose prose-invert max-w-none">
              <div className="bg-yellow-500/10 border-2 border-yellow-500/30 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-yellow-300 mb-2">⚠️ WORK IN PROGRESS</h3>
                <p className="text-blue-200">
                  This scoring category is currently disabled while we complete data integration for the 2025 season. 
                  Durability metrics require sufficient game sample size to accurately assess availability patterns. 
                  This feature will be re-enabled once we have adequate data to make meaningful evaluations.
                </p>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-white mb-3">"The Best Ability is Availability" (Planned Methodology)</h3>
                <p className="text-blue-200 mb-4">
                  When enabled, this will use <strong>linear scoring (0-100)</strong> based on games started, not z-scores. 
                  This approach is fairer because availability is an absolute measure - 17 games is objectively better 
                  than 16, regardless of league-wide injury rates.
                </p>
                <div className="bg-white/5 p-3 rounded mb-4">
                  <h4 className="font-bold text-orange-300 mb-2">Why Linear Scoring?</h4>
                  <p className="text-sm text-blue-200">
                    <strong>Availability is absolute, not relative.</strong> A QB who starts 16 games shouldn't be 
                    penalized just because other QBs in that season were also healthy. Z-scores would unfairly 
                    penalize healthy QBs in injury-heavy seasons.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-orange-300">Linear Scale (0-100)</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      <strong>17+ games:</strong> 100% (perfect availability)<br />
                      <strong>8.5 games:</strong> 50% (half season)<br />
                      <strong>0 games:</strong> 0% (no availability)<br />
                      <em className="text-xs">Linear progression based on games started</em>
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-orange-300">Z-Score Conversion</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      The 0-100 durability score is converted to a z-score only for the final hierarchical calculation. 
                      This preserves the absolute nature of availability while allowing integration with other categories.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-orange-300">Season Availability (0-80 points)</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      Weighted average availability across seasons. 17 games = 80 points, 16 games = 75.3 points, etc.
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-orange-300">Consistency Bonus (0-20 points)</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      Full season bonus (16+ games): 10 pts per season. Near-full (14-15 games): 5 pts. Multi-year bonus: +5 pts.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-3">Performance Tiers</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-orange-300">Elite (90-100)</div>
                    <div className="text-blue-200">16+ games consistently</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-orange-300">Very Good (80-89)</div>
                    <div className="text-blue-200">14-16 games most seasons</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-orange-300">Average (55-69)</div>
                    <div className="text-blue-200">10-13 games average</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-orange-300">Poor (25-39)</div>
                    <div className="text-blue-200">&lt;10 games often</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Clutch Performance */}
          <section id="clutch-scoring" className="bg-glass-medium backdrop-blur-xl rounded-xl p-6 border border-glass-border">
            <h2 className="text-3xl font-bold text-red-300 mb-6 flex items-center">
              💎 Clutch Performance Under Pressure
            </h2>
            <div className="prose prose-invert max-w-none">
              <div className="bg-yellow-500/10 border-2 border-yellow-500/30 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-yellow-300 mb-2">⚠️ WORK IN PROGRESS - Building Comprehensive System</h3>
                <p className="text-blue-200 mb-3">
                  We are developing an advanced clutch performance system that goes far beyond traditional game-winning drives. 
                  This comprehensive evaluation will provide additional credit for quarterbacks who perform well in high-pressure, 
                  high-stakes situations when games are truly on the line.
                </p>
                <p className="text-sm text-blue-200">
                  <strong>Development Note:</strong> This requires complex SQL queries against our expanded database with 
                  situational splits and detailed play-by-play data. The system is currently in active development.
                </p>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-white mb-3">Expanded Scope - What We're Building</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-red-300">🎯 Critical Downs Performance</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      <strong>3rd Down Conversions:</strong> Success rate on 3rd downs, especially 3rd & 7+<br />
                      <strong>4th Down Conversions:</strong> Willingness and success in crucial 4th down attempts<br />
                      <em className="text-xs">These situations often determine game outcomes</em>
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-red-300">⏰ Late-Game Excellence</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      <strong>4th Quarter Performance:</strong> Efficiency, completion %, and TD:INT ratio in final frame<br />
                      <strong>Game-Winning Drives:</strong> Successful final drives for victory<br />
                      <strong>Comebacks:</strong> Overcoming deficits when it matters most
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-red-300">📅 Late-Season Performance</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      <strong>November Performance:</strong> Stats and wins as weather deteriorates<br />
                      <strong>December Performance:</strong> Playoff race intensity metrics<br />
                      <strong>January Performance:</strong> Playing in the most consequential games<br />
                      <em className="text-xs">Elite QBs elevate when stakes are highest</em>
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-red-300">🏆 Playoff Performance</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      <strong>Playoff Win Rate:</strong> Success in single-elimination pressure<br />
                      <strong>Round-Weighted Bonuses:</strong> Progressive rewards for deeper playoff runs<br />
                      <strong>Championship Performance:</strong> Ultimate pressure situations
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-white mb-3">Planned Components (Max 100 points)</h3>
                <div className="space-y-3 text-sm text-blue-200">
                  <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                    <span><strong>Critical Downs Score:</strong> 3rd/4th down conversion rates</span>
                    <span className="text-red-300">0-30 pts</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                    <span><strong>Late-Game Score:</strong> 4th quarter efficiency and GWDs</span>
                    <span className="text-red-300">0-30 pts</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                    <span><strong>Late-Season Score:</strong> Nov/Dec/Jan performance splits</span>
                    <span className="text-red-300">0-20 pts</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                    <span><strong>Playoff Bonus:</strong> Postseason success multipliers</span>
                    <span className="text-red-300">0-20 pts</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-3">Playoff Performance Multipliers</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center bg-white/5 p-3 rounded">
                    <div className="font-bold text-red-300">Super Bowl</div>
                    <div className="text-blue-200">1.22× multiplier</div>
                  </div>
                  <div className="text-center bg-white/5 p-3 rounded">
                    <div className="font-bold text-red-300">Conf Championship</div>
                    <div className="text-blue-200">1.12× multiplier</div>
                  </div>
                  <div className="text-center bg-white/5 p-3 rounded">
                    <div className="font-bold text-red-300">Divisional</div>
                    <div className="text-blue-200">1.08× multiplier</div>
                  </div>
                  <div className="text-center bg-white/5 p-3 rounded">
                    <div className="font-bold text-red-300">Wild Card</div>
                    <div className="text-blue-200">1.06× multiplier</div>
                  </div>
                </div>
                <p className="text-sm text-blue-200 mt-3 text-center">
                  Clutch performance receives progressive multipliers based on game importance. Championship-round 
                  performances under maximum pressure will receive the highest bonuses.
                </p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="text-center mt-12 py-8 border-t border-glass-border">
          <Link
            to="/"
            className="bg-blue-500/20 hover:bg-blue-500/30 px-6 py-3 rounded-lg text-blue-200 hover:text-white transition-colors font-medium"
          >
            ← Return to QB Rankings
          </Link>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-purple-500/20 hover:bg-purple-500/30 backdrop-blur-lg text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 border border-purple-400/30"
          title="Scroll to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Technical Details Modal */}
      {showTechnicalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-cyan-500/30">
            <div className="sticky top-0 bg-gradient-to-r from-cyan-900/95 to-blue-900/95 backdrop-blur-lg p-6 border-b border-cyan-500/30 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-cyan-300">📚 Technical Details - Z-Score Methodology</h2>
              <button
                onClick={() => setShowTechnicalModal(false)}
                className="bg-red-500/20 hover:bg-red-500/30 text-white p-2 rounded-lg transition-colors"
                title="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Z-Score Formula */}
              <div className="bg-glass-light p-4 rounded-lg border border-glass-border">
                <h3 className="text-xl font-bold text-cyan-300 mb-3">Z-Score Formula</h3>
                <div className="bg-black/30 p-4 rounded font-mono text-cyan-200 text-center text-lg mb-3">
                  z = (X - μ) / σ
                </div>
                <div className="space-y-2 text-sm text-blue-200">
                  <p><strong>Where:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• <strong>z</strong> = standardized score (z-score)</li>
                    <li>• <strong>X</strong> = individual quarterback's stat value</li>
                    <li>• <strong>μ</strong> (mu) = population mean (average of all QBs for that stat in that season)</li>
                    <li>• <strong>σ</strong> (sigma) = population standard deviation (measure of spread/variation)</li>
                  </ul>
                </div>
              </div>

              {/* Standard Deviation Calculation */}
              <div className="bg-glass-light p-4 rounded-lg border border-glass-border">
                <h3 className="text-xl font-bold text-cyan-300 mb-3">Standard Deviation Calculation</h3>
                <div className="bg-black/30 p-4 rounded font-mono text-cyan-200 text-sm mb-3">
                  <div className="text-center mb-2">σ = √(Σ(Xi - μ)² / N)</div>
                </div>
                <p className="text-sm text-blue-200">
                  Standard deviation measures how spread out the values are. A larger σ means more variation in QB performance, 
                  while a smaller σ indicates QB stats are clustered closer together. This normalization ensures that a 
                  QB performing 1 standard deviation above average receives the same z-score regardless of the era.
                </p>
              </div>

              {/* Percentile Conversion */}
              <div className="bg-glass-light p-4 rounded-lg border border-glass-border">
                <h3 className="text-xl font-bold text-cyan-300 mb-3">Percentile Conversion (CDF)</h3>
                <div className="bg-black/30 p-4 rounded font-mono text-cyan-200 text-sm mb-3">
                  <div className="text-center">Percentile = 50 × (1 + erf(z / √2))</div>
                </div>
                <p className="text-sm text-blue-200 mb-3">
                  We convert z-scores to percentiles (0-100) using the <strong>cumulative normal distribution</strong> via the 
                  error function (erf). This uses the <strong>Abramowitz and Stegun approximation</strong> for computational efficiency.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white/5 p-2 rounded text-center">
                    <div className="font-bold text-cyan-300">z = -2.0</div>
                    <div className="text-blue-200">2.3rd percentile</div>
                  </div>
                  <div className="bg-white/5 p-2 rounded text-center">
                    <div className="font-bold text-cyan-300">z = -1.0</div>
                    <div className="text-blue-200">15.9th percentile</div>
                  </div>
                  <div className="bg-white/5 p-2 rounded text-center">
                    <div className="font-bold text-cyan-300">z = 0.0</div>
                    <div className="text-blue-200">50th percentile</div>
                  </div>
                  <div className="bg-white/5 p-2 rounded text-center">
                    <div className="font-bold text-cyan-300">z = +1.0</div>
                    <div className="text-blue-200">84.1st percentile</div>
                  </div>
                  <div className="bg-white/5 p-2 rounded text-center">
                    <div className="font-bold text-cyan-300">z = +2.0</div>
                    <div className="text-blue-200">97.7th percentile</div>
                  </div>
                  <div className="bg-white/5 p-2 rounded text-center">
                    <div className="font-bold text-cyan-300">z = +3.0</div>
                    <div className="text-blue-200">99.9th percentile</div>
                  </div>
                </div>
              </div>

              {/* Outlier Capping */}
              <div className="bg-glass-light p-4 rounded-lg border border-glass-border">
                <h3 className="text-xl font-bold text-cyan-300 mb-3">Outlier Protection (±3σ Cap)</h3>
                <p className="text-sm text-blue-200 mb-3">
                  We cap z-scores at ±3 standard deviations to prevent extreme outliers from distorting the rankings. 
                  In a normal distribution, 99.7% of all values fall within ±3σ, making values beyond this extremely rare.
                </p>
                <div className="bg-black/30 p-3 rounded text-sm text-cyan-200">
                  <code>z = Math.max(-3, Math.min(3, z));</code>
                </div>
                <p className="text-xs text-blue-200 mt-2">
                  This ensures that even historic outlier performances (e.g., 2004 Peyton Manning, 2013 Peyton Manning) 
                  receive elite scores without breaking the scale for other QBs.
                </p>
              </div>

              {/* Hierarchical Z-Score Process */}
              <div className="bg-glass-light p-4 rounded-lg border border-glass-border">
                <h3 className="text-xl font-bold text-cyan-300 mb-3">Hierarchical Z-Score Process</h3>
                <p className="text-sm text-blue-200 mb-3">
                  The system uses a <strong>three-stage hierarchical approach</strong>: Category scoring, z-score conversion, 
                  and hierarchical weighting to create the final composite z-score.
                </p>
                <div className="space-y-3 text-sm text-blue-200">
                  <div className="bg-black/30 p-3 rounded">
                    <p className="font-bold text-cyan-300 mb-2">Stage 1: Category Scoring</p>
                    <p>Most categories calculate z-scores directly. <strong>Durability uses linear 0-100 scoring</strong> 
                    because availability is absolute (17 games is objectively better than 16).</p>
                  </div>
                  <div className="bg-black/30 p-3 rounded">
                    <p className="font-bold text-cyan-300 mb-2">Stage 2: Z-Score Conversion</p>
                    <p>All category scores are converted to z-scores for hierarchical weighting. Durability's 0-100 
                    score becomes a z-score using: <code>z = (score - 50) / 25</code></p>
                  </div>
                  <div className="bg-black/30 p-3 rounded">
                    <p className="font-bold text-cyan-300 mb-2">Stage 3: Hierarchical Weighting</p>
                    <div className="font-mono text-cyan-200 text-xs mt-2">
                      <div>composite_z = (team_z × weight_team) + (stats_z × weight_stats) + ...</div>
                    </div>
                    <p className="mt-2">User weights combine category z-scores into a single composite z-score.</p>
                  </div>
                  <div className="bg-black/30 p-3 rounded">
                    <p className="font-bold text-cyan-300 mb-2">Stage 4: Final Percentile</p>
                    <p>Only the final composite z-score is converted to a percentile (0-100) for the QEI score.</p>
                  </div>
                </div>
              </div>

              {/* Example Calculation */}
              <div className="bg-glass-light p-4 rounded-lg border border-glass-border">
                <h3 className="text-xl font-bold text-cyan-300 mb-3">Example Calculation</h3>
                <div className="space-y-3 text-sm text-blue-200">
                  <div className="bg-black/30 p-3 rounded">
                    <p className="font-bold text-cyan-300 mb-2">Scenario: 2024 QB with Category Scores</p>
                    <ul className="space-y-1 ml-4">
                      <li>• <strong>Team Success:</strong> z = +1.2 (above average)</li>
                      <li>• <strong>Statistical Performance:</strong> z = +0.8 (good stats)</li>
                      <li>• <strong>Clutch Performance:</strong> z = +0.3 (slightly above average)</li>
                      <li>• <strong>Durability:</strong> 85/100 → z = +1.4 (converted from linear score)</li>
                      <li>• <strong>Supporting Cast:</strong> z = -0.4 (inverted - good support = penalty)</li>
                    </ul>
                  </div>
                  <div className="bg-black/30 p-3 rounded">
                    <p className="font-bold text-cyan-300 mb-2">Hierarchical Weighting (Default Weights)</p>
                    <ul className="space-y-1 ml-4">
                      <li>• <strong>Composite Z-Score:</strong> (1.2×0.3) + (0.8×0.4) + (0.3×0.15) + (1.4×0.1) + (-0.4×0.05)</li>
                      <li>• <strong>Composite Z-Score:</strong> 0.36 + 0.32 + 0.045 + 0.14 - 0.02 = <strong>0.845</strong></li>
                      <li>• <strong>Final QEI Score:</strong> 79.9 (80th percentile)</li>
                    </ul>
                  </div>
                  <p className="text-xs">
                    This QB's composite z-score of 0.845 converts to the 80th percentile, indicating they perform 
                    better than 80% of quarterbacks when all factors are considered. The durability score (85/100) 
                    is converted to a z-score for hierarchical calculation, while the supporting cast penalty 
                    reduces their score since they have good organizational support.
                  </p>
                </div>
              </div>

              {/* Benefits Summary */}
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-cyan-300 mb-3">Key Benefits of This Approach</h3>
                <ul className="space-y-2 text-sm text-blue-200">
                  <li>✅ <strong>Era-Independent:</strong> Compare QBs from 2010 vs 2024 fairly despite rule changes</li>
                  <li>✅ <strong>Hierarchical Flexibility:</strong> User weights allow customization while preserving statistical integrity</li>
                  <li>✅ <strong>Outlier-Resistant:</strong> ±3σ capping prevents extreme values from distorting rankings</li>
                  <li>✅ <strong>Intuitive Scoring:</strong> Final percentiles are easy to understand (50 = average, 84 = elite)</li>
                  <li>✅ <strong>Context-Aware:</strong> Supporting cast inversion provides fair evaluation of QB performance</li>
                  <li>✅ <strong>Fair Durability:</strong> Linear scoring for availability prevents penalizing healthy QBs in injury-heavy seasons</li>
                  <li>✅ <strong>Statistically Rigorous:</strong> Based on proven z-score methodology with proper variance preservation</li>
                </ul>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gradient-to-r from-cyan-900/95 to-blue-900/95 backdrop-blur-lg p-4 border-t border-cyan-500/30 text-center">
              <button
                onClick={() => setShowTechnicalModal(false)}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 px-6 py-3 rounded-lg text-cyan-200 hover:text-white transition-colors font-medium"
              >
                Close Technical Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default Documentation; 