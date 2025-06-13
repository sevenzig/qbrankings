import React, { memo, useCallback, useMemo } from 'react';
import { getQEIColor, getQEITier } from '../utils/uiHelpers.js';
import { getTeamInfo } from '../constants/teamData.js';

const QBRankingsTable = memo(({ rankedQBs, includePlayoffs, include2024Only = false }) => {
  // Extract all QBs with QEI scores for dynamic tier calculation
  const allQBsWithQEI = useMemo(() => rankedQBs, [rankedQBs]);
  // Helper function to get all unique teams a QB played for
  const getQBTeams = useCallback((qb) => {
    if (!qb.seasonData || qb.seasonData.length === 0) {
      return [{ team: qb.team, logo: qb.teamLogo }];
    }
    
    // Get unique teams from season data
    const uniqueTeams = [];
    const seenTeams = new Set();
    
    qb.seasonData.forEach(season => {
      // First check if this season has a teamsPlayed array (for multi-team seasons)
      if (season.teamsPlayed && season.teamsPlayed.length > 0) {
        season.teamsPlayed.forEach(team => {
          if (!seenTeams.has(team)) {
            seenTeams.add(team);
            const teamInfo = getTeamInfo(team);
            uniqueTeams.push({
              team: team,
              logo: teamInfo.logo
            });
          }
        });
      } else if (season.team && !seenTeams.has(season.team) && !season.team.match(/^\d+TM$/)) {
        // Fallback to season.team if no teamsPlayed array, but skip "2TM" type entries
        seenTeams.add(season.team);
        const teamInfo = getTeamInfo(season.team);
        uniqueTeams.push({
          team: season.team,
          logo: teamInfo.logo
        });
      }
    });
    
    return uniqueTeams.length > 0 ? uniqueTeams : [{ team: qb.team, logo: qb.teamLogo }];
  }, []);

  const calculatePlayoffRecord = useCallback((qb, include2024Only = false) => {
    let totalPlayoffWins = 0;
    let totalPlayoffLosses = 0;
    
    if (qb.seasonData) {
      // Filter to only 2024 seasons if include2024Only is enabled
      const seasonsToProcess = include2024Only 
        ? qb.seasonData.filter(season => season.year === 2024)
        : qb.seasonData;
        
      seasonsToProcess.forEach(season => {
        if (season.playoffData) {
          totalPlayoffWins += season.playoffData.wins || 0;
          totalPlayoffLosses += season.playoffData.losses || 0;
        }
      });
    }
    
    return { wins: totalPlayoffWins, losses: totalPlayoffLosses };
  }, []);

  const calculatePlayoffStarts = useCallback((qb, include2024Only = false) => {
    let totalPlayoffStarts = 0;
    
    if (qb.seasonData) {
      // Filter to only 2024 seasons if include2024Only is enabled
      const seasonsToProcess = include2024Only 
        ? qb.seasonData.filter(season => season.year === 2024)
        : qb.seasonData;
        
      seasonsToProcess.forEach(season => {
        if (season.playoffData) {
          totalPlayoffStarts += season.playoffData.gamesStarted || 0;
        }
      });
    }
    
    return totalPlayoffStarts;
  }, []);

  const getQEILabel = useCallback((qb) => {
    return getQEITier(qb, allQBsWithQEI);
  }, [allQBsWithQEI]);

  const getRowClassName = useCallback((index) => {
    const baseClasses = 'border-b border-white/10 hover:bg-white/5 transition-colors';
    if (index === 0) return `${baseClasses} bg-gradient-to-r from-yellow-500/20 to-orange-500/20`;
    if (index === 1) return `${baseClasses} bg-gradient-to-r from-gray-400/20 to-gray-500/20`;
    if (index === 2) return `${baseClasses} bg-gradient-to-r from-amber-600/20 to-amber-700/20`;
    if (index < 8) return `${baseClasses} bg-green-500/10`;
    return `${baseClasses} bg-blue-500/5`;
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/20">
        <h3 className="text-xl font-bold text-white">🏆 QB Rankings ({rankedQBs.length} Active QBs)</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-white font-bold">Rank</th>
              <th className="px-4 py-3 text-left text-white font-bold">QB</th>
              <th className="px-4 py-3 text-center text-white font-bold">Team</th>
              <th className="px-4 py-3 text-center text-white font-bold">QEI</th>
              <th className="px-4 py-3 text-center text-white font-bold">Team Record</th>
              <th className="px-4 py-3 text-center text-white font-bold">Per-Game Averages</th>
              <th className="px-4 py-3 text-center text-white font-bold">Seasons</th>
              <th className="px-4 py-3 text-center text-white font-bold">Avg Rating</th>
            </tr>
          </thead>
          <tbody>
            {rankedQBs.map((qb, index) => {
              const playoffRecord = calculatePlayoffRecord(qb, include2024Only);
              const playoffStarts = calculatePlayoffStarts(qb, include2024Only);
              const hasPlayoffRecord = playoffRecord.wins > 0 || playoffRecord.losses > 0;
              
              return (
                <tr key={qb.id} className={getRowClassName(index)}>
                  <td className="px-4 py-3">
                    <span className="text-xl font-bold text-white">#{index + 1}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-bold text-white">{qb.name}</div>
                      <div className="text-xs text-blue-200">{qb.experience} seasons • Age {qb.age}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center flex-wrap">
                      {getQBTeams(qb).map((teamData, teamIndex) => (
                        <div key={teamData.team} className="flex items-center">
                          {teamData.logo && (
                            <img 
                              src={teamData.logo} 
                              alt={teamData.team} 
                              className="w-6 h-6" 
                              title={teamData.team}
                            />
                          )}
                          {teamIndex < getQBTeams(qb).length - 1 && (
                            <span className="text-white/50 mx-1">/</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className={`inline-block px-3 py-1 rounded-lg ${getQEIColor(qb, allQBsWithQEI)}`}>
                      <span className="text-xl font-bold">{qb.qei.toFixed(2)}</span>
                      <div className="text-xs opacity-75">
                        {getQEILabel(qb)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-blue-200">
                    <div>{qb.combinedRecord}</div>
                    {includePlayoffs && hasPlayoffRecord && (
                      <div className="text-xs text-yellow-300 mt-1">
                        Playoffs: {playoffRecord.wins}-{playoffRecord.losses}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-blue-200">
                    <div>{qb.stats.yardsPerGame.toFixed(1)} yds/g</div>
                    <div className="text-xs">{qb.stats.tdsPerGame.toFixed(2)} TD/g, {qb.stats.turnoversPerGame.toFixed(2)} TO/g</div>
                  </td>
                  <td className="px-4 py-3 text-center text-white">
                    <div>{qb.experience}</div>
                    <div className="text-xs text-blue-200">{qb.stats.gamesStarted} starts</div>
                    {includePlayoffs && playoffStarts > 0 && (
                      <div className="text-xs text-yellow-300 mt-1">
                        {playoffStarts} playoff starts
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-blue-200">{qb.stats.passerRating.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

QBRankingsTable.displayName = 'QBRankingsTable';

export default QBRankingsTable; 