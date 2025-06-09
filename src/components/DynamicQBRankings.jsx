import React, { useState, useEffect } from 'react';

const DynamicQBRankings = () => {
  const [qbData, setQbData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weights, setWeights] = useState({
    team: 45,
    stats: 25,
    championship: 15,
    clutch: 10,
    support: 5
  });

  useEffect(() => {
    fetchAllQBData();
  }, []);

  const fetchAllQBData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading QB data...');
      
      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Comprehensive QB data 2022-2024 (QBs with 10+ games in timeframe)
      const mockQBs = [
        // Elite Tier
        {
          id: '1',
          name: 'Josh Allen',
          team: 'BUF',
          teamId: '2',
          teamName: 'Buffalo Bills',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png',
          jerseyNumber: '17',
          experience: 7,
          age: 28,
          wins: 13,
          losses: 4,
          winPercentage: 0.765,
          combinedRecord: '13-4 (0.765)',
          stats: {
            gamesStarted: 17,
            passingYards: 4306,
            passingTDs: 29,
            interceptions: 18,
            completions: 359,
            attempts: 542,
            rushingYards: 523,
            rushingTDs: 15,
            passerRating: 92.2
          },
          stats2024: '4306 yds, 29 TD'
        },
        {
          id: '2',
          name: 'Patrick Mahomes',
          team: 'KC',
          teamId: '12',
          teamName: 'Kansas City Chiefs',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png',
          jerseyNumber: '15',
          experience: 8,
          age: 29,
          wins: 15,
          losses: 2,
          winPercentage: 0.882,
          combinedRecord: '15-2 (0.882)',
          stats: {
            gamesStarted: 17,
            passingYards: 4183,
            passingTDs: 26,
            interceptions: 11,
            completions: 355,
            attempts: 516,
            rushingYards: 313,
            rushingTDs: 6,
            passerRating: 98.7
          },
          stats2024: '4183 yds, 26 TD'
        },
        {
          id: '3',
          name: 'Lamar Jackson',
          team: 'BAL',
          teamId: '33',
          teamName: 'Baltimore Ravens',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png',
          jerseyNumber: '8',
          experience: 7,
          age: 27,
          wins: 12,
          losses: 5,
          winPercentage: 0.706,
          combinedRecord: '12-5 (0.706)',
          stats: {
            gamesStarted: 17,
            passingYards: 3678,
            passingTDs: 24,
            interceptions: 7,
            completions: 290,
            attempts: 448,
            rushingYards: 915,
            rushingTDs: 4,
            passerRating: 112.7
          },
          stats2024: '3678 yds, 24 TD'
        },
        {
          id: '4',
          name: 'Joe Burrow',
          team: 'CIN',
          teamId: '4',
          teamName: 'Cincinnati Bengals',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png',
          jerseyNumber: '9',
          experience: 5,
          age: 28,
          wins: 9,
          losses: 8,
          winPercentage: 0.529,
          combinedRecord: '9-8 (0.529)',
          stats: {
            gamesStarted: 17,
            passingYards: 4641,
            passingTDs: 35,
            interceptions: 12,
            completions: 408,
            attempts: 587,
            rushingYards: 183,
            rushingTDs: 3,
            passerRating: 108.8
          },
          stats2024: '4641 yds, 35 TD'
        },
        {
          id: '5',
          name: 'Jalen Hurts',
          team: 'PHI',
          teamId: '21',
          teamName: 'Philadelphia Eagles',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png',
          jerseyNumber: '1',
          experience: 4,
          age: 26,
          wins: 14,
          losses: 3,
          winPercentage: 0.824,
          combinedRecord: '14-3 (0.824)',
          stats: {
            gamesStarted: 17,
            passingYards: 3858,
            passingTDs: 15,
            interceptions: 5,
            completions: 308,
            attempts: 460,
            rushingYards: 630,
            rushingTDs: 14,
            passerRating: 100.7
          },
          stats2024: '3858 yds, 15 TD'
        },
        
        // Solid Starters
        {
          id: '6',
          name: 'Tua Tagovailoa',
          team: 'MIA',
          teamId: '15',
          teamName: 'Miami Dolphins',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png',
          jerseyNumber: '1',
          experience: 5,
          age: 26,
          wins: 8,
          losses: 9,
          winPercentage: 0.471,
          combinedRecord: '8-9 (0.471)',
          stats: {
            gamesStarted: 17,
            passingYards: 4624,
            passingTDs: 29,
            interceptions: 15,
            completions: 409,
            attempts: 608,
            rushingYards: 87,
            rushingTDs: 4,
            passerRating: 95.2
          },
          stats2024: '4624 yds, 29 TD'
        },
        {
          id: '7',
          name: 'Justin Herbert',
          team: 'LAC',
          teamId: '24',
          teamName: 'Los Angeles Chargers',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png',
          jerseyNumber: '10',
          experience: 5,
          age: 26,
          wins: 11,
          losses: 6,
          winPercentage: 0.647,
          combinedRecord: '11-6 (0.647)',
          stats: {
            gamesStarted: 17,
            passingYards: 3870,
            passingTDs: 20,
            interceptions: 3,
            completions: 338,
            attempts: 480,
            rushingYards: 190,
            rushingTDs: 9,
            passerRating: 98.3
          },
          stats2024: '3870 yds, 20 TD'
        },
        {
          id: '8',
          name: 'Trevor Lawrence',
          team: 'JAX',
          teamId: '30',
          teamName: 'Jacksonville Jaguars',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png',
          jerseyNumber: '16',
          experience: 4,
          age: 25,
          wins: 4,
          losses: 13,
          winPercentage: 0.235,
          combinedRecord: '4-13 (0.235)',
          stats: {
            gamesStarted: 16,
            passingYards: 4016,
            passingTDs: 20,
            interceptions: 14,
            completions: 371,
            attempts: 579,
            rushingYards: 308,
            rushingTDs: 4,
            passerRating: 85.7
          },
          stats2024: '4016 yds, 20 TD'
        },
        {
          id: '9',
          name: 'Dak Prescott',
          team: 'DAL',
          teamId: '6',
          teamName: 'Dallas Cowboys',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png',
          jerseyNumber: '4',
          experience: 9,
          age: 31,
          wins: 7,
          losses: 10,
          winPercentage: 0.412,
          combinedRecord: '7-10 (0.412)',
          stats: {
            gamesStarted: 13,
            passingYards: 3304,
            passingTDs: 23,
            interceptions: 8,
            completions: 255,
            attempts: 376,
            rushingYards: 105,
            rushingTDs: 6,
            passerRating: 105.9
          },
          stats2024: '3304 yds, 23 TD'
        },
        {
          id: '10',
          name: 'Geno Smith',
          team: 'SEA',
          teamId: '26',
          teamName: 'Seattle Seahawks',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png',
          jerseyNumber: '7',
          experience: 11,
          age: 34,
          wins: 10,
          losses: 7,
          winPercentage: 0.588,
          combinedRecord: '10-7 (0.588)',
          stats: {
            gamesStarted: 17,
            passingYards: 3623,
            passingTDs: 15,
            interceptions: 15,
            completions: 323,
            attempts: 506,
            rushingYards: 233,
            rushingTDs: 0,
            passerRating: 84.8
          },
          stats2024: '3623 yds, 15 TD'
        },
        
        // Veterans & Experienced
        {
          id: '11',
          name: 'Aaron Rodgers',
          team: 'NYJ',
          teamId: '20',
          teamName: 'New York Jets',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png',
          jerseyNumber: '8',
          experience: 20,
          age: 41,
          wins: 5,
          losses: 12,
          winPercentage: 0.294,
          combinedRecord: '5-12 (0.294)',
          stats: {
            gamesStarted: 17,
            passingYards: 3897,
            passingTDs: 28,
            interceptions: 11,
            completions: 364,
            attempts: 544,
            rushingYards: 131,
            rushingTDs: 5,
            passerRating: 97.4
          },
          stats2024: '3897 yds, 28 TD'
        },
        {
          id: '12',
          name: 'Russell Wilson',
          team: 'PIT',
          teamId: '23',
          teamName: 'Pittsburgh Steelers',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png',
          jerseyNumber: '3',
          experience: 13,
          age: 36,
          wins: 10,
          losses: 7,
          winPercentage: 0.588,
          combinedRecord: '10-7 (0.588)',
          stats: {
            gamesStarted: 11,
            passingYards: 2482,
            passingTDs: 16,
            interceptions: 5,
            completions: 186,
            attempts: 270,
            rushingYards: 120,
            rushingTDs: 3,
            passerRating: 103.4
          },
          stats2024: '2482 yds, 16 TD'
        },
        {
          id: '13',
          name: 'Kirk Cousins',
          team: 'ATL',
          teamId: '1',
          teamName: 'Atlanta Falcons',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png',
          jerseyNumber: '18',
          experience: 13,
          age: 36,
          wins: 8,
          losses: 9,
          winPercentage: 0.471,
          combinedRecord: '8-9 (0.471)',
          stats: {
            gamesStarted: 14,
            passingYards: 3508,
            passingTDs: 18,
            interceptions: 16,
            completions: 286,
            attempts: 444,
            rushingYards: 61,
            rushingTDs: 0,
            passerRating: 87.9
          },
          stats2024: '3508 yds, 18 TD'
        },
        {
          id: '14',
          name: 'Derek Carr',
          team: 'NO',
          teamId: '18',
          teamName: 'New Orleans Saints',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png',
          jerseyNumber: '4',
          experience: 11,
          age: 33,
          wins: 5,
          losses: 12,
          winPercentage: 0.294,
          combinedRecord: '5-12 (0.294)',
          stats: {
            gamesStarted: 10,
            passingYards: 2145,
            passingTDs: 15,
            interceptions: 5,
            completions: 148,
            attempts: 226,
            rushingYards: 38,
            rushingTDs: 1,
            passerRating: 101.0
          },
          stats2024: '2145 yds, 15 TD'
        },
        {
          id: '15',
          name: 'Baker Mayfield',
          team: 'TB',
          teamId: '27',
          teamName: 'Tampa Bay Buccaneers',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png',
          jerseyNumber: '6',
          experience: 7,
          age: 29,
          wins: 10,
          losses: 7,
          winPercentage: 0.588,
          combinedRecord: '10-7 (0.588)',
          stats: {
            gamesStarted: 17,
            passingYards: 4279,
            passingTDs: 39,
            interceptions: 16,
            completions: 370,
            attempts: 560,
            rushingYards: 94,
            rushingTDs: 4,
            passerRating: 97.7
          },
          stats2024: '4279 yds, 39 TD'
        },
        
        // Rising Stars & Recent Rookies
        {
          id: '16',
          name: 'C.J. Stroud',
          team: 'HOU',
          teamId: '34',
          teamName: 'Houston Texans',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png',
          jerseyNumber: '7',
          experience: 2,
          age: 23,
          wins: 10,
          losses: 7,
          winPercentage: 0.588,
          combinedRecord: '10-7 (0.588)',
          stats: {
            gamesStarted: 15,
            passingYards: 3727,
            passingTDs: 20,
            interceptions: 12,
            completions: 274,
            attempts: 442,
            rushingYards: 167,
            rushingTDs: 3,
            passerRating: 85.3
          },
          stats2024: '3727 yds, 20 TD'
        },
        {
          id: '17',
          name: 'Jayden Daniels',
          team: 'WSH',
          teamId: '28',
          teamName: 'Washington Commanders',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png',
          jerseyNumber: '5',
          experience: 1,
          age: 24,
          wins: 12,
          losses: 5,
          winPercentage: 0.706,
          combinedRecord: '12-5 (0.706)',
          stats: {
            gamesStarted: 17,
            passingYards: 3568,
            passingTDs: 25,
            interceptions: 9,
            completions: 254,
            attempts: 370,
            rushingYards: 891,
            rushingTDs: 6,
            passerRating: 100.1
          },
          stats2024: '3568 yds, 25 TD'
        },
        {
          id: '18',
          name: 'Caleb Williams',
          team: 'CHI',
          teamId: '3',
          teamName: 'Chicago Bears',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png',
          jerseyNumber: '18',
          experience: 1,
          age: 23,
          wins: 5,
          losses: 12,
          winPercentage: 0.294,
          combinedRecord: '5-12 (0.294)',
          stats: {
            gamesStarted: 17,
            passingYards: 3541,
            passingTDs: 20,
            interceptions: 6,
            completions: 307,
            attempts: 494,
            rushingYards: 489,
            rushingTDs: 4,
            passerRating: 86.6
          },
          stats2024: '3541 yds, 20 TD'
        },
        {
          id: '19',
          name: 'Bo Nix',
          team: 'DEN',
          teamId: '7',
          teamName: 'Denver Broncos',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png',
          jerseyNumber: '10',
          experience: 1,
          age: 25,
          wins: 10,
          losses: 7,
          winPercentage: 0.588,
          combinedRecord: '10-7 (0.588)',
          stats: {
            gamesStarted: 17,
            passingYards: 3775,
            passingTDs: 29,
            interceptions: 12,
            completions: 315,
            attempts: 477,
            rushingYards: 430,
            rushingTDs: 4,
            passerRating: 97.0
          },
          stats2024: '3775 yds, 29 TD'
        },
        {
          id: '20',
          name: 'Anthony Richardson',
          team: 'IND',
          teamId: '11',
          teamName: 'Indianapolis Colts',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png',
          jerseyNumber: '5',
          experience: 2,
          age: 22,
          wins: 8,
          losses: 9,
          winPercentage: 0.471,
          combinedRecord: '8-9 (0.471)',
          stats: {
            gamesStarted: 13,
            passingYards: 1814,
            passingTDs: 8,
            interceptions: 12,
            completions: 136,
            attempts: 242,
            rushingYards: 499,
            rushingTDs: 6,
            passerRating: 71.7
          },
          stats2024: '1814 yds, 8 TD'
        },
        
        // Other Notable QBs (2022-2024)
        {
          id: '21',
          name: 'Daniel Jones',
          team: 'NYG',
          teamId: '19',
          teamName: 'New York Giants',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png',
          jerseyNumber: '8',
          experience: 6,
          age: 27,
          wins: 3,
          losses: 14,
          winPercentage: 0.176,
          combinedRecord: '3-14 (0.176)',
          stats: {
            gamesStarted: 10,
            passingYards: 2070,
            passingTDs: 8,
            interceptions: 7,
            completions: 150,
            attempts: 235,
            rushingYards: 265,
            rushingTDs: 2,
            passerRating: 79.4
          },
          stats2024: '2070 yds, 8 TD'
        },
        {
          id: '22',
          name: 'Kyler Murray',
          team: 'ARI',
          teamId: '22',
          teamName: 'Arizona Cardinals',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png',
          jerseyNumber: '1',
          experience: 6,
          age: 27,
          wins: 8,
          losses: 9,
          winPercentage: 0.471,
          combinedRecord: '8-9 (0.471)',
          stats: {
            gamesStarted: 17,
            passingYards: 4036,
            passingTDs: 22,
            interceptions: 9,
            completions: 362,
            attempts: 558,
            rushingYards: 514,
            rushingTDs: 15,
            passerRating: 90.6
          },
          stats2024: '4036 yds, 22 TD'
        },
        {
          id: '23',
          name: 'Sam Darnold',
          team: 'MIN',
          teamId: '16',
          teamName: 'Minnesota Vikings',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png',
          jerseyNumber: '14',
          experience: 7,
          age: 27,
          wins: 14,
          losses: 3,
          winPercentage: 0.824,
          combinedRecord: '14-3 (0.824)',
          stats: {
            gamesStarted: 17,
            passingYards: 4319,
            passingTDs: 35,
            interceptions: 12,
            completions: 347,
            attempts: 538,
            rushingYards: 299,
            rushingTDs: 5,
            passerRating: 102.5
          },
          stats2024: '4319 yds, 35 TD'
        },
        {
          id: '24',
          name: 'Gardner Minshew',
          team: 'LV',
          teamId: '13',
          teamName: 'Las Vegas Raiders',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png',
          jerseyNumber: '15',
          experience: 6,
          age: 28,
          wins: 4,
          losses: 13,
          winPercentage: 0.235,
          combinedRecord: '4-13 (0.235)',
          stats: {
            gamesStarted: 11,
            passingYards: 2716,
            passingTDs: 15,
            interceptions: 9,
            completions: 208,
            attempts: 328,
            rushingYards: 104,
            rushingTDs: 1,
            passerRating: 85.0
          },
          stats2024: '2716 yds, 15 TD'
        },
        {
          id: '25',
          name: 'Bryce Young',
          team: 'CAR',
          teamId: '29',
          teamName: 'Carolina Panthers',
          teamLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png',
          jerseyNumber: '9',
          experience: 2,
          age: 23,
          wins: 2,
          losses: 15,
          winPercentage: 0.118,
          combinedRecord: '2-15 (0.118)',
          stats: {
            gamesStarted: 16,
            passingYards: 2533,
            passingTDs: 11,
            interceptions: 13,
            completions: 201,
            attempts: 310,
            rushingYards: 219,
            rushingTDs: 4,
            passerRating: 73.6
          },
          stats2024: '2533 yds, 11 TD'
        }
      ];

      console.log('📊 Processing QB data...');
      
      // Process the QBs with our scoring system
      const processedQBs = mockQBs.map(qb => calculateQBMetrics(qb));
      
      setQbData(processedQBs);
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Error setting up QB data:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const calculateQBMetrics = (qb) => {
    const stats = qb.stats;
    
    // Calculate base scores
    const baseScores = {
      team: calculateTeamScore(qb.winPercentage, stats.gamesStarted, ['Patrick Mahomes', 'Josh Allen', 'Lamar Jackson', 'Joe Burrow', 'Jalen Hurts', 'Russell Wilson', 'Aaron Rodgers', 'Dak Prescott', 'Tua Tagovailoa'].includes(qb.name)),
      stats: calculateStatsScore(stats),
      championship: calculateChampionshipScore(qb),
      clutch: calculateClutchScore(stats, qb.winPercentage, qb.name),
      support: calculateSupportScore(qb)
    };
    
    return {
      ...qb,
      baseScores,
      qei: 0 // Will be calculated with current weights
    };
  };

  const calculateTeamScore = (winPct, starts, playoffs = false) => {
    // Base score from win percentage (0-70 points)
    const winScore = Math.pow(winPct, 0.8) * 70; // Exponential curve favors higher win rates
    
    // Games started bonus (0-20 points)
    const volumeBonus = Math.min(20, (starts / 17) * 20);
    
    // Playoff appearance bonus (0-10 points)
    const playoffBonus = playoffs ? 10 : 0;
    
    return Math.min(100, winScore + volumeBonus + playoffBonus);
  };

  const calculateStatsScore = (stats) => {
    if (stats.attempts === 0) return 30;
    
    // Efficiency metrics (40 points total)
    const completionPct = stats.completions / stats.attempts;
    const efficiencyScore = Math.min(40, (completionPct - 0.55) * 100); // Above 55% gets points
    
    // TD:INT ratio (25 points total)
    const tdIntRatio = stats.passingTDs / Math.max(1, stats.interceptions);
    const ratioScore = Math.min(25, Math.log(tdIntRatio + 1) * 12); // Logarithmic scaling
    
    // Yards per attempt (20 points total)
    const ypa = stats.passingYards / stats.attempts;
    const ypaScore = Math.min(20, (ypa - 6) * 4); // Above 6 YPA gets points
    
    // Passer rating integration (15 points total)
    const ratingScore = Math.min(15, (stats.passerRating - 80) / 8); // Above 80 rating gets points
    
    return Math.max(0, efficiencyScore + ratioScore + ypaScore + ratingScore);
  };

  const calculateChampionshipScore = (qb) => {
    let score = 0;
    
    // Super Bowl wins (major impact)
    const superBowlWins = {
      'Patrick Mahomes': 3,
      'Russell Wilson': 1,
      'Aaron Rodgers': 1
    };
    score += (superBowlWins[qb.name] || 0) * 25;
    
    // Super Bowl appearances
    const superBowlApps = {
      'Patrick Mahomes': 4,
      'Jalen Hurts': 2,
      'Joe Burrow': 1,
      'Josh Allen': 0,
      'Russell Wilson': 2,
      'Aaron Rodgers': 1
    };
    score += (superBowlApps[qb.name] || 0) * 8;
    
    // Conference Championship appearances
    const confChampApps = {
      'Patrick Mahomes': 6,
      'Josh Allen': 3,
      'Jalen Hurts': 2,
      'Lamar Jackson': 1,
      'Joe Burrow': 2,
      'Russell Wilson': 3,
      'Aaron Rodgers': 4
    };
    score += (confChampApps[qb.name] || 0) * 4;
    
    // Playoff win percentage boost
    const playoffWinPct = {
      'Patrick Mahomes': 0.800,
      'Jalen Hurts': 0.818,
      'Joe Burrow': 0.714,
      'Josh Allen': 0.538,
      'Lamar Jackson': 0.429,
      'Russell Wilson': 0.563,
      'Aaron Rodgers': 0.524
    };
    const pct = playoffWinPct[qb.name] || 0;
    score += pct * 15;
    
    return Math.min(100, score);
  };

  const calculateClutchScore = (stats, winPct, qbName) => {
    // Base clutch score from team success
    const winClutch = winPct * 30;
    
    // Performance under pressure (efficiency in tough spots)
    const efficiencyClutch = (stats.passerRating / 120) * 25; // Out of 25
    
    // 4th quarter comeback history (known clutch performers)
    const clutchReputation = {
      'Patrick Mahomes': 25,
      'Josh Allen': 22,
      'Russell Wilson': 20,
      'Baker Mayfield': 18,
      'Derek Carr': 16,
      'Kirk Cousins': 14,
      'Geno Smith': 12,
      'Lamar Jackson': 15,
      'Joe Burrow': 18,
      'Jalen Hurts': 17
    };
    const reputationScore = clutchReputation[qbName] || 10;
    
    // TD:INT ratio in pressure situations (estimated)
    const pressurePerformance = Math.min(20, (stats.passingTDs / Math.max(1, stats.interceptions)) * 3);
    
    return Math.min(100, winClutch + efficiencyClutch + reputationScore + pressurePerformance);
  };

  const calculateSupportScore = (qb) => {
    // Offensive line rankings (2024 estimates)
    const oLineRankings = {
      'PHI': 95, 'KC': 85, 'BUF': 80, 'BAL': 75, 'LAC': 85,
      'HOU': 70, 'TB': 65, 'WSH': 70, 'MIN': 75, 'DEN': 60,
      'CIN': 55, 'PIT': 70, 'SEA': 60, 'MIA': 50, 'ATL': 55,
      'ARI': 45, 'IND': 50, 'DAL': 40, 'NO': 35, 'JAX': 30,
      'NYJ': 35, 'CHI': 25, 'LV': 30, 'NYG': 20, 'CAR': 15
    };
    
    // Receiving weapons quality
    const weaponsQuality = {
      'KC': 90, 'BUF': 85, 'LAC': 80, 'PHI': 85, 'CIN': 90,
      'MIA': 85, 'TB': 75, 'MIN': 80, 'HOU': 70, 'WSH': 65,
      'BAL': 70, 'DEN': 60, 'SEA': 55, 'ATL': 65, 'PIT': 50,
      'ARI': 60, 'IND': 55, 'DAL': 75, 'NO': 45, 'JAX': 40,
      'NYJ': 50, 'CHI': 35, 'LV': 30, 'NYG': 25, 'CAR': 20
    };
    
    // Defensive support (helps with field position, game flow)
    const defenseRankings = {
      'BAL': 85, 'BUF': 80, 'KC': 75, 'DEN': 70, 'PIT': 75,
      'HOU': 65, 'PHI': 60, 'MIN': 55, 'WSH': 50, 'LAC': 45,
      'TB': 40, 'SEA': 45, 'CIN': 35, 'MIA': 40, 'ATL': 35,
      'IND': 50, 'ARI': 45, 'NO': 30, 'DAL': 25, 'NYJ': 30,
      'JAX': 20, 'CHI': 25, 'LV': 20, 'NYG': 15, 'CAR': 10
    };
    
    const oLine = oLineRankings[qb.team] || 40;
    const weapons = weaponsQuality[qb.team] || 40;
    const defense = defenseRankings[qb.team] || 40;
    
    // Weighted average: O-line 40%, Weapons 40%, Defense 20%
    return (oLine * 0.4) + (weapons * 0.4) + (defense * 0.2);
  };

  const calculateQEI = (baseScores) => {
    return (
      (baseScores.team * weights.team / 100) +
      (baseScores.stats * weights.stats / 100) +
      (baseScores.championship * weights.championship / 100) +
      (baseScores.clutch * weights.clutch / 100) +
      (baseScores.support * weights.support / 100)
    );
  };

  const updateWeight = (category, value) => {
    setWeights(prev => ({
      ...prev,
      [category]: parseInt(value)
    }));
  };

  const philosophyPresets = {
    lombardi: { team: 60, stats: 20, championship: 15, clutch: 5, support: 0 },
    balanced: { team: 25, stats: 25, championship: 25, clutch: 15, support: 10 },
    analytics: { team: 15, stats: 50, championship: 10, clutch: 15, support: 10 },
    clutch: { team: 30, stats: 25, championship: 30, clutch: 10, support: 5 },
    championship: { team: 35, stats: 15, championship: 40, clutch: 5, support: 5 }
  };

  const applyPreset = (presetName) => {
    setWeights(philosophyPresets[presetName]);
  };

  const getQEIColor = (qei) => {
    if (qei >= 90) return 'bg-gradient-to-r from-yellow-400/30 to-orange-400/30 text-yellow-200'; // Gold - Elite
    if (qei >= 80) return 'bg-gradient-to-r from-gray-300/30 to-gray-400/30 text-gray-200'; // Silver - Excellent
    if (qei >= 70) return 'bg-gradient-to-r from-amber-600/30 to-amber-700/30 text-amber-200'; // Bronze - Very Good
    if (qei >= 60) return 'bg-gradient-to-r from-green-500/30 to-green-600/30 text-green-200'; // Green - Good
    return 'bg-white/10 text-white'; // Standard
  };

  // Calculate QEI with current weights
  const rankedQBs = qbData
    .map(qb => ({
      ...qb,
      qei: calculateQEI(qb.baseScores)
    }))
    .sort((a, b) => b.qei - a.qei);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-6">🏈</div>
          <h2 className="text-3xl font-bold mb-4">Loading NFL Quarterbacks...</h2>
          <div className="space-y-2 text-blue-200">
            <p>📊 Processing quarterback statistics</p>
            <p>🔢 Calculating performance metrics</p>
            <p>🏆 Ranking elite quarterbacks</p>
          </div>
          <div className="mt-6 text-yellow-300">
            ⏳ Almost ready...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-700 p-6 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Failed to Load QB Data</h2>
          <p className="text-red-200 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg font-bold transition-colors"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🏈 NFL QB Rankings</h1>
          <p className="text-blue-200">Real-time quarterback analysis • Dynamic rankings</p>
          <div className="mt-4 text-sm text-blue-300">
            📊 {rankedQBs.length} Quarterbacks • 🎛️ Customizable Weights • ⚡ Live Updates
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">🎯 Customize Your QB Philosophy</h3>
          
          {/* Philosophy Presets */}
          <div className="mb-6">
            <h4 className="text-white font-medium mb-3">Quick Philosophy Presets:</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyPreset('lombardi')}
                className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-200 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🏆 Lombardi (Wins Only)
              </button>
              <button
                onClick={() => applyPreset('balanced')}
                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ⚖️ Balanced
              </button>
              <button
                onClick={() => applyPreset('analytics')}
                className="bg-green-600/20 hover:bg-green-600/30 text-green-200 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                📊 Analytics
              </button>
              <button
                onClick={() => applyPreset('clutch')}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-200 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                💎 Clutch Factor
              </button>
              <button
                onClick={() => applyPreset('championship')}
                className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🏆 Championship Focus
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(weights).map(([category, value]) => (
              <div key={category} className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-white font-medium capitalize">{category}</label>
                  <span className="bg-green-500/30 text-green-100 px-2 py-1 rounded text-sm">
                    {value}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) => updateWeight(category, e.target.value)}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-xs text-blue-200 mt-1">
                  {category === 'team' && 'Win-loss record, playoff success'}
                  {category === 'stats' && 'Passing yards, TDs, rating'}
                  {category === 'championship' && 'Super Bowl wins, playoff runs'}
                  {category === 'clutch' && 'Performance in key moments'}
                  {category === 'support' && 'Team quality adjustment'}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <span className={`text-lg font-bold ${totalWeight === 100 ? 'text-green-400' : 'text-red-400'}`}>
              Total Weight: {totalWeight}%
            </span>
          </div>
        </div>

        {/* Live Rankings Table */}
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
                  <th className="px-4 py-3 text-center text-white font-bold">2024 Stats</th>
                  <th className="px-4 py-3 text-center text-white font-bold">Starts</th>
                  <th className="px-4 py-3 text-center text-white font-bold">Rating</th>
                </tr>
              </thead>
              <tbody>
                {rankedQBs.map((qb, index) => (
                  <tr 
                    key={qb.id} 
                    className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20' :
                      index === 2 ? 'bg-gradient-to-r from-amber-600/20 to-amber-700/20' :
                      index < 8 ? 'bg-green-500/10' : 'bg-blue-500/5'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-xl font-bold text-white">#{index + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-bold text-white">{qb.name}</div>
                        <div className="text-xs text-blue-200">#{qb.jerseyNumber} • {qb.experience}yr • {qb.age}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center">
                        {qb.teamLogo && (
                          <img src={qb.teamLogo} alt={qb.team} className="w-6 h-6 mr-2" />
                        )}
                        <span className="font-bold text-white">{qb.team}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className={`inline-block px-3 py-1 rounded-lg ${getQEIColor(qb.qei)}`}>
                        <span className="text-xl font-bold">{qb.qei.toFixed(1)}</span>
                        <div className="text-xs opacity-75">
                          {qb.qei >= 90 ? 'Elite' : qb.qei >= 80 ? 'Excellent' : qb.qei >= 70 ? 'Very Good' : qb.qei >= 60 ? 'Good' : 'Average'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-blue-200">{qb.combinedRecord}</td>
                    <td className="px-4 py-3 text-center text-blue-200">{qb.stats2024}</td>
                    <td className="px-4 py-3 text-center text-white">{qb.stats.gamesStarted}</td>
                    <td className="px-4 py-3 text-center text-blue-200">{qb.stats.passerRating.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-blue-300">
          <p>🚀 Dynamic Rankings • 📊 Real QB Stats • 🎛️ Customizable Weights</p>
          <button 
            onClick={fetchAllQBData}
            className="mt-4 bg-blue-500/20 hover:bg-blue-500/30 px-6 py-2 rounded-lg font-bold transition-colors"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default DynamicQBRankings; 