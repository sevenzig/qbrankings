import React, { memo } from 'react';
import { getTeamInfo } from '../constants/teamData.js';

/**
 * TeamBreakdown - Shows detailed team-specific stats for multi-team seasons
 * 
 * Performance Optimizations:
 * 1. Memoized with React.memo to prevent unnecessary re-renders
 * 2. Single responsibility - only handles team breakdown display
 */
const TeamBreakdown = memo(({ qb, season }) => {
  if (!season || !season.teamsPlayed || season.teamsPlayed.length <= 1) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-glass-light rounded-lg border border-accent-400/30 backdrop-blur-lg">
      <div className="text-base font-semibold text-accent-200 mb-3 tracking-tight">
        📊 {season.year} Team Breakdown
      </div>
      <div className="space-y-3">
        {season.teamsPlayed.map((team, index) => {
          const teamInfo = getTeamInfo(team);
          const teamStats = season.teamStats?.[team] || {};
          const gamesStarted = season.gamesStartedPerTeam?.[index] || 0;
          
          return (
            <div key={team} className="flex items-center justify-between bg-glass-medium rounded-lg p-3 border border-glass-border">
              <div className="flex items-center space-x-3">
                {teamInfo.logo && (
                  <img 
                    src={teamInfo.logo} 
                    alt={teamInfo.name}
                    className="w-6 h-6 lg:w-8 lg:h-8 rounded shadow-md"
                    style={{
                      filter: 'drop-shadow(0 0 0 1px white) drop-shadow(0 0 0 2px white)',
                      objectFit: 'contain'
                    }}
                  />
                )}
                <span className="text-white font-medium">{teamInfo.name}</span>
                <span className="text-slate-300 text-sm font-light tabular-nums">({gamesStarted} GS)</span>
              </div>
              <div className="text-right text-sm text-slate-200">
                {teamStats.wins !== undefined && teamStats.losses !== undefined && (
                  <div className="font-semibold tabular-nums">{teamStats.wins}-{teamStats.losses}</div>
                )}
                {teamStats.passingYards > 0 && (
                  <div className="text-xs text-slate-300 font-light tabular-nums">
                    {teamStats.passingYards.toLocaleString()} yds, {teamStats.passingTDs} TD
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

TeamBreakdown.displayName = 'TeamBreakdown';

export default TeamBreakdown;

