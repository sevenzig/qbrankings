import React, { memo, useCallback, useMemo } from 'react';
import { getQEIColor, getQEITier } from '../utils/uiHelpers.js';
import { getTeamInfo } from '../constants/teamData.js';
import GlobalSettings from './GlobalSettings.jsx';
import TeamBreakdown from './TeamBreakdown.jsx';

const QBRankingsTable = memo(({ 
  rankedQBs, 
  includePlayoffs, 
  include2024Only = false, 
  yearMode, 
  onYearModeChange,
  // New props for filtering
  showFilterControls = false,
  filterSettings = null,
  onFilterSettingsChange = () => {}
}) => {
  // Extract all QBs with QEI scores for dynamic tier calculation
  const allQBsWithQEI = useMemo(() => rankedQBs, [rankedQBs]);
  // Helper function to get teams a QB played for in the selected season
  const getQBTeams = useCallback((qb, yearMode) => {
    if (!qb.seasonData || qb.seasonData.length === 0) {
      return [{ team: qb.team, logo: qb.teamLogo }];
    }
    
    // Parse yearMode to numeric value
    const targetYear = parseInt(yearMode);
    
    // Filter to only the selected year's seasons
    const seasonsForYear = qb.seasonData.filter(season => season.year === targetYear);
    
    // If no data for the selected year, fall back to most recent season
    const seasonsToProcess = seasonsForYear.length > 0 ? seasonsForYear : [qb.seasonData[0]];
    
    // Get unique teams from the filtered season data
    const uniqueTeams = [];
    const seenTeams = new Set();
    
    seasonsToProcess.forEach(season => {
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
    const baseClasses = 'border-t border-slate-700/30 hover:bg-slate-700/20 transition-colors duration-150';
    if (index === 0) return `${baseClasses} bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-emerald-500/5`;
    if (index === 1) return `${baseClasses} bg-gradient-to-r from-slate-500/5 via-slate-500/10 to-slate-500/5`;
    if (index === 2) return `${baseClasses} bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5`;
    if (index < 8) return `${baseClasses} bg-slate-800/20`;
    return `${baseClasses} bg-slate-800/40`;
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 backdrop-blur-xl rounded-3xl overflow-hidden border border-slate-700/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] w-full">
      <div className="py-6 px-8 border-b border-slate-700/30 bg-gradient-to-r from-slate-800 to-slate-800/80">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-50 tracking-tight">QB Rankings</h3>
          <GlobalSettings
            yearMode={yearMode}
            onYearModeChange={onYearModeChange}
            showFilterControls={showFilterControls}
            filterSettings={filterSettings}
            onFilterSettingsChange={onFilterSettingsChange}
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-800 to-slate-800/80 sticky top-0 z-10">
            <tr>
              <th className="py-4 px-6 text-left text-xs font-bold text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-800/95 backdrop-blur-sm z-10 border-r border-slate-700/30">Rank</th>
              <th className="py-4 px-6 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Team</th>
              <th className="py-4 px-6 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">QB</th>
              <th className="py-4 px-6 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">QEI</th>
              <th className="py-4 px-6 text-center text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Team Record</th>
              <th className="py-4 px-6 text-center text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Per-Game Averages</th>
              <th className="py-4 px-6 text-center text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Seasons</th>
            </tr>
          </thead>
          <tbody>
            {rankedQBs.map((qb, index) => {
              const playoffRecord = calculatePlayoffRecord(qb, include2024Only);
              const playoffStarts = calculatePlayoffStarts(qb, include2024Only);
              const hasPlayoffRecord = playoffRecord.wins > 0 || playoffRecord.losses > 0;
              
              return (
                <>
                  <tr key={qb.id} className={getRowClassName(index)}>
                    <td className="py-4 px-6 sticky left-0 bg-slate-800/95 backdrop-blur-sm z-10 border-r border-slate-700/30">
                      <span className="text-base font-black text-slate-50 tabular-nums">{index + 1}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getQBTeams(qb, yearMode).map((teamData, teamIndex) => (
                          <div key={teamData.team} className="flex items-center">
                            {teamData.logo && (
                              <img 
                                src={teamData.logo} 
                                alt={teamData.team} 
                                className="w-16 h-16 lg:w-16 lg:h-16 rounded-lg p-1 shadow-lg" 
                                style={{
                                  filter: 'drop-shadow(0 0 0 2px white) drop-shadow(0 0 0 3px white)',
                                  objectFit: 'contain'
                                }}
                                title={teamData.team}
                              />
                            )}
                            {teamIndex < getQBTeams(qb, yearMode).length - 1 && (
                              <span className="text-slate-400 mx-1">/</span>
                            )}
                          </div>
                        ))}
                        {getQBTeams(qb, yearMode).length > 1 && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-slate-500/10 text-slate-500" title={`Played for ${getQBTeams(qb, yearMode).length} teams`}>
                            {getQBTeams(qb, yearMode).length}TM
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-black text-slate-50 text-base">{qb.name}</div>
                        <div className="text-sm text-slate-300 font-medium">{qb.experience} seasons • Age {qb.age}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className={`inline-block px-4 py-2 rounded-lg ${getQEIColor(qb, allQBsWithQEI)}`}>
                        <span className="text-2xl font-black tabular-nums">{qb.qei.toFixed(2)}</span>
                        <div className="text-xs font-bold">
                          {getQEILabel(qb)}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center text-slate-200 hidden md:table-cell">
                      <div className="font-bold tabular-nums">{qb.combinedRecord}</div>
                      {includePlayoffs && hasPlayoffRecord && (
                        <div className="text-xs text-amber-400 mt-1 font-bold">
                          Playoffs: {playoffRecord.wins}-{playoffRecord.losses}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center text-slate-200 hidden md:table-cell">
                      <div className="font-bold tabular-nums">{qb.stats?.yardsPerGame?.toFixed(1) || '0.0'} yds/g</div>
                      <div className="text-sm text-slate-300 font-medium tabular-nums">{qb.stats?.tdsPerGame?.toFixed(2) || '0.00'} TD/g, {qb.stats?.turnoversPerGame?.toFixed(2) || '0.00'} TO/g</div>
                    </td>
                    <td className="py-4 px-6 text-center text-slate-50 hidden md:table-cell">
                      <div className="font-black tabular-nums">{qb.experience}</div>
                      <div className="text-sm text-slate-300 font-medium tabular-nums">{qb.stats?.gamesStarted || 0} starts</div>
                      {includePlayoffs && playoffStarts > 0 && (
                        <div className="text-xs text-amber-400 mt-1 font-bold tabular-nums">
                          {playoffStarts} playoff starts
                        </div>
                      )}
                    </td>
                  </tr>
                  {/* Team breakdown for multi-team seasons */}
                  {qb.seasonData && qb.seasonData.some(season => season.teamsPlayed && season.teamsPlayed.length > 1) && (
                    <tr className="bg-slate-800/20">
                      <td colSpan="7" className="py-4 px-6">
                        {qb.seasonData
                          .filter(season => season.teamsPlayed && season.teamsPlayed.length > 1)
                          .map(season => (
                            <TeamBreakdown key={season.year} qb={qb} season={season} />
                          ))}
                      </td>
                    </tr>
                  )}
                </>
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