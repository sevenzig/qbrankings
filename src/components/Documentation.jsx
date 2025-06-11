import React, { useState, useEffect } from 'react';

const Documentation = ({ onBack }) => {
  // Scroll to top functionality
  const [showScrollTop, setShowScrollTop] = useState(false);

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
          <button
            onClick={onBack}
            className="mb-4 bg-blue-500/20 hover:bg-blue-500/30 px-4 py-2 rounded-lg text-blue-200 hover:text-white transition-colors"
          >
            ← Back to Rankings
          </button>
          <h1 className="text-4xl font-bold text-white mb-4">
            🏈 QB Rankings Methodology
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Comprehensive documentation of our quarterback evaluation system
          </p>
        </div>

        {/* Navigation */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">📋 Documentation Sections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="#quarterback-scoring" className="bg-white/5 hover:bg-white/10 p-4 rounded-lg transition-colors">
              <h3 className="text-lg font-bold text-green-300 mb-2">📊 Overall System</h3>
              <p className="text-sm text-blue-200">Complete QB evaluation methodology and QEI calculation</p>
            </a>
            <a href="#team-scoring" className="bg-white/5 hover:bg-white/10 p-4 rounded-lg transition-colors">
              <h3 className="text-lg font-bold text-yellow-300 mb-2">🏆 Team Success</h3>
              <p className="text-sm text-blue-200">Win percentage, playoff achievements, and availability</p>
            </a>
            <a href="#supporting-cast" className="bg-white/5 hover:bg-white/10 p-4 rounded-lg transition-colors">
              <h3 className="text-lg font-bold text-purple-300 mb-2">🏟️ Supporting Cast</h3>
              <p className="text-sm text-blue-200">Offensive line, weapons, and defense quality assessment</p>
            </a>
            <a href="#durability-scoring" className="bg-white/5 hover:bg-white/10 p-4 rounded-lg transition-colors">
              <h3 className="text-lg font-bold text-orange-300 mb-2">⚡ Durability</h3>
              <p className="text-sm text-blue-200">Availability and consistency over multiple seasons</p>
            </a>
            <a href="#clutch-scoring" className="bg-white/5 hover:bg-white/10 p-4 rounded-lg transition-colors">
              <h3 className="text-lg font-bold text-red-300 mb-2">💎 Clutch Performance</h3>
              <p className="text-sm text-blue-200">Game-winning drives and high-pressure situations</p>
            </a>
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="space-y-12">
          
          {/* Quarterback Scoring System */}
          <section id="quarterback-scoring" className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h2 className="text-3xl font-bold text-green-300 mb-6 flex items-center">
              📊 Quarterback Excellence Index (QEI) System
            </h2>
            <div className="prose prose-invert max-w-none">
              <div className="bg-white/5 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-white mb-3">System Overview</h3>
                <p className="text-blue-200 mb-4">
                  The QB Rankings system evaluates quarterback performance using a comprehensive Quarterback Excellence Index (QEI) 
                  that combines five major scoring categories. Each category is scored on a 0-100 scale and weighted based on user preferences.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-green-300">Core Weighting System</h4>
                    <ul className="text-sm text-blue-200 mt-2 space-y-1">
                      <li>• Team Success: 30% (default)</li>
                      <li>• Statistical Performance: 40% (default)</li>
                      <li>• Clutch Performance: 15% (default)</li>
                      <li>• Durability: 10% (default)</li>
                      <li>• Supporting Cast: 5% (default)</li>
                    </ul>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-green-300">Year Weighting System</h4>
                    <ul className="text-sm text-blue-200 mt-2 space-y-1">
                      <li>• 2024: 55% weight (current season)</li>
                      <li>• 2023: 35% weight (recent performance)</li>
                      <li>• 2022: 10% weight (historical context)</li>
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-blue-200">
                The system uses temporal weighting across the last three seasons, with configurable philosophy presets 
                ranging from "Winner" (team success focused) to "Context" (supporting cast aware).
              </p>
            </div>
          </section>

          {/* Team Scoring System */}
          <section id="team-scoring" className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h2 className="text-3xl font-bold text-yellow-300 mb-6 flex items-center">
              🏆 Team Success Scoring
            </h2>
            <div className="prose prose-invert max-w-none">
              <div className="bg-white/5 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-white mb-3">Components (Max 100 points)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-yellow-300">Regular Season Win %</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      0-50 points based on (Win% ^ 0.6) × 50. Includes weighted playoff performance and bye week bonuses.
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-yellow-300">Offensive DVOA Score</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      0-15 points. Based on team offensive DVOA performance (Defense-adjusted Value Over Average).
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-yellow-300">Career Playoff Achievement</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      0-45 points (capped). Super Bowl wins (15 pts), appearances (9 pts), plus playoff participation bonuses.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-3">Playoff Round Weighting (70% Reduced)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-yellow-300">Super Bowl Win</div>
                    <div className="text-blue-200">0.6 weight</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-yellow-300">Conf Championship Win</div>
                    <div className="text-blue-200">0.42 weight</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-yellow-300">Divisional Win</div>
                    <div className="text-blue-200">0.3 weight</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-yellow-300">Wild Card Win</div>
                    <div className="text-blue-200">0.21 weight</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Supporting Cast */}
          <section id="supporting-cast" className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h2 className="text-3xl font-bold text-purple-300 mb-6 flex items-center">
              🏟️ Supporting Cast Quality Assessment
            </h2>
            <div className="prose prose-invert max-w-none">
              <div className="bg-white/5 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-white mb-3">Direct Quality Logic</h3>
                <p className="text-blue-200 mb-4">
                  <strong>"Elite Teams, Elite Scores"</strong> - Better supporting cast quality results in higher scores. 
                  This system rewards quarterbacks playing with superior organizational support.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-purple-300">Offensive Line Quality</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      0-35 points. Pass protection, run blocking, PBWR/RBWR metrics. 
                      <br /><strong>Elite:</strong> DEN (35), PHI (32), DET (31)
                      <br /><strong>Poor:</strong> NE (6), HOU (8)
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-purple-300">Weapons Quality</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      0-40 points. WR/TE/RB talent, depth, versatility.
                      <br /><strong>Elite:</strong> CIN (38), MIA (36), MIN (35)
                      <br /><strong>Poor:</strong> CAR (7), NE (8), NYG (9)
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-purple-300">Defense Quality</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      0-25 points. Field position, game flow impact.
                      <br /><strong>Elite:</strong> BAL (25), BUF (24), KC (23)
                      <br /><strong>Poor:</strong> CAR (5), NE (6), NYG (7)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Durability */}
          <section id="durability-scoring" className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h2 className="text-3xl font-bold text-orange-300 mb-6 flex items-center">
              ⚡ Durability & Availability
            </h2>
            <div className="prose prose-invert max-w-none">
              <div className="bg-white/5 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-white mb-3">"The Best Ability is Availability"</h3>
                <p className="text-blue-200 mb-4">
                  Pure availability metric focused on games started, injury resilience, and multi-season reliability.
                </p>
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
          <section id="clutch-scoring" className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h2 className="text-3xl font-bold text-red-300 mb-6 flex items-center">
              💎 Clutch Performance Under Pressure
            </h2>
            <div className="prose prose-invert max-w-none">
              <div className="bg-white/5 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-white mb-3">High-Pressure Situations (Max 100 points)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-red-300">Game Winning Drives (0-40 pts)</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      Drives that directly lead to game-winning scores. Elite: 0.33 GWD/game = 40 points.
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-red-300">4th Quarter Comebacks (0-25 pts)</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      Successful comebacks initiated in 4th quarter. Elite: 0.25 comebacks/game = 25 points.
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-red-300">Combined Clutch Rate (0-15 pts)</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      Total clutch opportunities per game. Rewards consistent clutch performance.
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <h4 className="font-bold text-red-300">Playoff Success Bonus (0-20 pts)</h4>
                    <p className="text-sm text-blue-200 mt-2">
                      Playoff win rate × 20 + games × 2. Rewards clutch performance in highest pressure games.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-3">Playoff Clutch Multipliers (70% Reduced)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-red-300">Super Bowl</div>
                    <div className="text-blue-200">1.22× multiplier</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-red-300">Conf Championship</div>
                    <div className="text-blue-200">1.12× multiplier</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-red-300">Divisional</div>
                    <div className="text-blue-200">1.08× multiplier</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-red-300">Wild Card</div>
                    <div className="text-blue-200">1.06× multiplier</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="text-center mt-12 py-8 border-t border-white/10">
          <button
            onClick={onBack}
            className="bg-blue-500/20 hover:bg-blue-500/30 px-6 py-3 rounded-lg text-blue-200 hover:text-white transition-colors font-medium"
          >
            ← Return to QB Rankings
          </button>
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
    </div>
  );
};

export default Documentation; 