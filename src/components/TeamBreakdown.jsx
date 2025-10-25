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
    <div className="mt-3 p-3 bg-blue-900/30 rounded-lg border border-blue-700/30">
      <div className="text-sm font-semibold text-blue-200 mb-2">
        📊 {season.year} Team Breakdown
      </div>
      <div className="space-y-2">
        {season.teamsPlayed.map((team, index) => {
          const teamInfo = getTeamInfo(team);
          const teamStats = season.teamStats?.[team] || {};
          const gamesStarted = season.gamesStartedPerTeam?.[index] || 0;
          
          return (
            <div key={team} className="flex items-center justify-between bg-blue-800/20 rounded p-2">
              <div className="flex items-center space-x-2">
                {teamInfo.logo && (
                  <img 
                    src={teamInfo.logo} 
                    alt={teamInfo.name}
                    className="w-5 h-5"
                  />
                )}
                <span className="text-blue-200 font-medium">{teamInfo.name}</span>
                <span className="text-blue-300 text-xs">({gamesStarted} GS)</span>
              </div>
              <div className="text-right text-sm text-blue-200">
                {teamStats.wins !== undefined && teamStats.losses !== undefined && (
                  <div>{teamStats.wins}-{teamStats.losses}</div>
                )}
                {teamStats.passingYards > 0 && (
                  <div className="text-xs text-blue-300">
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

