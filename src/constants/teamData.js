// Team mapping data and philosophy presets

// Comprehensive team mapping covering all abbreviation variations
export const TEAM_MAP = {
  // Standard 2-letter abbreviations
  'ARI': { id: '22', name: 'Arizona Cardinals', logo: '/logos/ari.png' },
  'ATL': { id: '1', name: 'Atlanta Falcons', logo: '/logos/atl.png' },
  'BAL': { id: '33', name: 'Baltimore Ravens', logo: '/logos/bal.png' },
  'BUF': { id: '2', name: 'Buffalo Bills', logo: '/logos/buf.png' },
  'CAR': { id: '29', name: 'Carolina Panthers', logo: '/logos/car.png' },
  'CHI': { id: '3', name: 'Chicago Bears', logo: '/logos/chi.png' },
  'CIN': { id: '4', name: 'Cincinnati Bengals', logo: '/logos/cin.png' },
  'CLE': { id: '5', name: 'Cleveland Browns', logo: '/logos/cle.png' },
  'DAL': { id: '6', name: 'Dallas Cowboys', logo: '/logos/dal.png' },
  'DEN': { id: '7', name: 'Denver Broncos', logo: '/logos/den.png' },
  'DET': { id: '8', name: 'Detroit Lions', logo: '/logos/det.png' },
  'GB': { id: '9', name: 'Green Bay Packers', logo: '/logos/gb.png' },
  'HOU': { id: '34', name: 'Houston Texans', logo: '/logos/hou.png' },
  'IND': { id: '11', name: 'Indianapolis Colts', logo: '/logos/ind.png' },
  'JAX': { id: '30', name: 'Jacksonville Jaguars', logo: '/logos/jax.png' },
  'KC': { id: '12', name: 'Kansas City Chiefs', logo: '/logos/kc.png' },
  'LV': { id: '13', name: 'Las Vegas Raiders', logo: '/logos/lv.png' },
  'LAC': { id: '24', name: 'Los Angeles Chargers', logo: '/logos/lac.png' },
  'LAR': { id: '14', name: 'Los Angeles Rams', logo: '/logos/lar.png' },
  'MIA': { id: '15', name: 'Miami Dolphins', logo: '/logos/mia.png' },
  'MIN': { id: '16', name: 'Minnesota Vikings', logo: '/logos/min.png' },
  'NE': { id: '17', name: 'New England Patriots', logo: '/logos/ne.png' },
  'NO': { id: '18', name: 'New Orleans Saints', logo: '/logos/no.png' },
  'NYG': { id: '19', name: 'New York Giants', logo: '/logos/nyg.png' },
  'NYJ': { id: '20', name: 'New York Jets', logo: '/logos/nyj.png' },
  'PHI': { id: '21', name: 'Philadelphia Eagles', logo: '/logos/phi.png' },
  'PIT': { id: '23', name: 'Pittsburgh Steelers', logo: '/logos/pit.png' },
  'SF': { id: '25', name: 'San Francisco 49ers', logo: '/logos/sf.png' },
  'SEA': { id: '26', name: 'Seattle Seahawks', logo: '/logos/sea.png' },
  'TB': { id: '27', name: 'Tampa Bay Buccaneers', logo: '/logos/tb.png' },
  'TEN': { id: '10', name: 'Tennessee Titans', logo: '/logos/ten.png' },
  'WSH': { id: '28', name: 'Washington Commanders', logo: '/logos/wsh.png' },
  
  // 3-letter PFR abbreviations (mapping to same teams)
  'GNB': { id: '9', name: 'Green Bay Packers', logo: '/logos/gb.png' },
  'KAN': { id: '12', name: 'Kansas City Chiefs', logo: '/logos/kc.png' },
  'LVR': { id: '13', name: 'Las Vegas Raiders', logo: '/logos/lv.png' },
  'NWE': { id: '17', name: 'New England Patriots', logo: '/logos/ne.png' },
  'NOR': { id: '18', name: 'New Orleans Saints', logo: '/logos/no.png' },
  'SFO': { id: '25', name: 'San Francisco 49ers', logo: '/logos/sf.png' },
  'TAM': { id: '27', name: 'Tampa Bay Buccaneers', logo: '/logos/tb.png' },
  'WAS': { id: '28', name: 'Washington Commanders', logo: '/logos/wsh.png' },
  
  // Special cases
  '2TM': { id: '0', name: 'Multiple Teams', logo: '' } // Special case for players who played for multiple teams
};

export const PHILOSOPHY_PRESETS = {
  default: {
    team: 40, stats: 40, clutch: 0, durability: 10, support: 10,
    description: "Balanced default configuration with equal team/stats emphasis",
    // Sub-component weights for default preset
    supportWeights: {
      offensiveLine: 34,
      weapons: 33,
      defense: 33
    },
    statsWeights: {
      efficiency: 40,
      protection: 35,
      volume: 25
    },
    teamWeights: {
      regularSeason: 60,
      offenseDVOA: 40,
      playoff: 0
    },
    clutchWeights: {
      gameWinningDrives: 25,
      fourthQuarterComebacks: 25,
      clutchRate: 25,
      playoffBonus: 25
    },
    durabilityWeights: {
      availability: 60,
      consistency: 40
    },
    // Inverted protection weights - INT% more important than Sack%
    efficiencyWeights: {
      anyA: 45,
      tdPct: 30,
      completionPct: 25
    },
    protectionWeights: {
      sackPct: 40,        // Reduced - more O-line dependent
      turnoverRate: 60    // Increased - more QB dependent
    },
    volumeWeights: {
      passYards: 25,
      passTDs: 25,
      rushYards: 20,
      rushTDs: 15,
      totalAttempts: 15
    }
  },
  
  winner: {
    team: 70, stats: 25, clutch: 0, durability: 5, support: 0,
    description: "Winning is everything - results-focused with elite QB recognition",
    // Sub-component weights for winner preset
    supportWeights: {
      offensiveLine: 34,
      weapons: 33,
      defense: 33
    },
    statsWeights: {
      efficiency: 45,      // Reduced to make room for volume
      protection: 30,
      volume: 25           // Increased - volume separates great from good
    },
    teamWeights: {
      regularSeason: 75,   // Slightly reduced to balance elite QB recognition
      offenseDVOA: 25,     // Increased - captures offensive impact beyond W-L
      playoff: 0
    },
    clutchWeights: {
      gameWinningDrives: 30,
      fourthQuarterComebacks: 20,
      clutchRate: 20,
      playoffBonus: 30
    },
    durabilityWeights: {
      availability: 80,    // Winners need to be on the field
      consistency: 20
    },
    efficiencyWeights: {
      anyA: 50,            // Increased - best single metric for winning
      tdPct: 35,           // Increased - TDs win games
      completionPct: 15    // Reduced - completion% less predictive of wins
    },
    protectionWeights: {
      sackPct: 35,         // Reduced - less QB control
      turnoverRate: 65     // Increased - turnovers kill wins
    },
    volumeWeights: {
      passYards: 25,
      passTDs: 35,         // Increased - TDs are what matter for winning
      rushYards: 15,       // Reduced to emphasize passing TDs
      rushTDs: 20,
      totalAttempts: 5     // Reduced - attempts don't win games, production does
    }
  },
  
  analyst: {
    team: 15, stats: 70, clutch: 0, durability: 10, support: 5,
    description: "Numbers don't lie - advanced metrics with volume recognition",
    // Sub-component weights for analyst preset
    supportWeights: {
      offensiveLine: 40,    // Slightly higher - analysts understand O-line impact
      weapons: 35,
      defense: 25
    },
    statsWeights: {
      efficiency: 45,       // Reduced to make room for volume
      protection: 30,
      volume: 25            // Increased - volume is crucial for elite evaluation
    },
    teamWeights: {
      regularSeason: 15,    // Reduced - analysts focus on process over results
      offenseDVOA: 85,      // Increased - advanced metrics are everything
      playoff: 0
    },
    clutchWeights: {
      gameWinningDrives: 25,
      fourthQuarterComebacks: 25,
      clutchRate: 25,
      playoffBonus: 25
    },
    durabilityWeights: {
      availability: 25,     // Reduced - analysts value consistency over availability
      consistency: 75       // Increased - long-term performance patterns matter
    },
    efficiencyWeights: {
      anyA: 55,             // Increased - ANY/A is the holy grail for analysts
      tdPct: 30,            // Reduced to emphasize ANY/A
      completionPct: 15     // Maintained - completion% has limitations
    },
    protectionWeights: {
      sackPct: 30,          // Reduced - analysts know this is mostly O-line
      turnoverRate: 70      // Increased - QB decision-making is everything
    },
    volumeWeights: {
      passYards: 35,        // Increased - volume matters for greatness
      passTDs: 35,          // Increased - production matters
      rushYards: 10,        // Reduced - analysts focus on passing
      rushTDs: 10,          // Reduced - passing is more predictive
      totalAttempts: 10     // Reduced - efficiency over volume attempts
    }
  },
  
  context: {
    team: 20, stats: 45, clutch: 0, durability: 10, support: 25,
    description: "Context matters - situational excellence with pressure recognition",
    // Sub-component weights for context preset
    supportWeights: {
      offensiveLine: 45,    // Increased - O-line is crucial for context evaluation
      weapons: 30,          // Reduced to emphasize O-line importance
      defense: 25           // Maintained - defensive context matters
    },
    statsWeights: {
      efficiency: 30,       // Reduced - efficiency less reliable in bad situations
      protection: 45,       // Increased - decision-making under pressure is key
      volume: 25            // Maintained - volume shows workload in tough spots
    },
    teamWeights: {
      regularSeason: 40,    // Reduced - context matters more than raw wins
      offenseDVOA: 60,      // Increased - advanced metrics show true impact
      playoff: 0
    },
    clutchWeights: {
      gameWinningDrives: 25,
      fourthQuarterComebacks: 25,
      clutchRate: 25,
      playoffBonus: 25
    },
    durabilityWeights: {
      availability: 60,     // Increased - staying healthy in tough situations
      consistency: 40       // Reduced - context can explain inconsistency
    },
    efficiencyWeights: {
      anyA: 35,             // Reduced - ANY/A can be misleading in bad situations
      tdPct: 25,            // Maintained - TDs still matter
      completionPct: 40     // Increased - completion% crucial under pressure
    },
    protectionWeights: {
      sackPct: 40,          // Reduced slightly - still context-dependent
      turnoverRate: 60      // Increased - protecting ball under pressure is key
    },
    volumeWeights: {
      passYards: 20,        // Reduced - yards less meaningful in tough spots
      passTDs: 25,          // Increased - TDs matter more than yards
      rushYards: 30,        // Increased - rushing crucial when passing is tough
      rushTDs: 20,          // Maintained - goal line rushing matters
      totalAttempts: 5      // Reduced - attempts don't show context value
    }
  }
};

export const getTeamInfo = (teamAbbr) => {
  return TEAM_MAP[teamAbbr] || { id: '0', name: teamAbbr, logo: '' };
}; 