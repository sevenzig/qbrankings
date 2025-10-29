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
  
  // Historical team abbreviations (mapped to current teams)
  'OAK': { id: '13', name: 'Las Vegas Raiders', logo: '/logos/lv.png' }, // Oakland Raiders → Las Vegas Raiders
  'RAI': { id: '13', name: 'Las Vegas Raiders', logo: '/logos/lv.png' }, // Raiders → Las Vegas Raiders
  'SDG': { id: '24', name: 'Los Angeles Chargers', logo: '/logos/lac.png' }, // San Diego Chargers → Los Angeles Chargers  
  'STL': { id: '14', name: 'Los Angeles Rams', logo: '/logos/lar.png' }, // St. Louis Rams → Los Angeles Rams
  'RAM': { id: '14', name: 'Los Angeles Rams', logo: '/logos/lar.png' }, // Rams → Los Angeles Rams
  'PHO': { id: '22', name: 'Arizona Cardinals', logo: '/logos/ari.png' }, // Phoenix Cardinals → Arizona Cardinals
  
  // Special cases
  '2TM': { id: '0', name: 'Multiple Teams', logo: '' } // Special case for players who played for multiple teams
};

export const PHILOSOPHY_PRESETS = {
  default: {
    team: 0, stats: 100, clutch: 0, durability: 0, support: 0,
    description: "Pure QB Quality Focus - Statistical evaluation isolating individual quarterback talent",
    statsWeights: {
      efficiency: 45,      // Efficiency core, aligned with default UI
      protection: 30,      // Decision making and ball security
      volume: 25          // Production matters but secondary
    },
    // Efficiency weights optimized for pure QB evaluation
    efficiencyWeights: {
      anyA: 45,           // ANY/A primary efficiency metric
      tdPct: 35,          // TD% strong efficiency signal
      completionPct: 20   // Accuracy matters
    },
    // Protection weights focused on QB decision-making
    protectionWeights: {
      sackPct: 25,        // Reduced - heavily influenced by O-line
      turnoverRate: 75    // Increased - pure QB decision-making and ball security
    },
    // Volume weights balanced for production evaluation
    volumeWeights: {
      passYards: 40,      // Passing yard production
      passTDs: 30,        // Passing touchdown production
      rushYards: 10,      // Rushing yard production
      rushTDs: 15,        // Rushing TDs
      totalAttempts: 5    // Total workload
    }
  },
  
  winner: {
    team: 70, stats: 30, clutch: 0, durability: 0, support: 0,
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
  
  
  
  volumeHero: {
    team: 0, stats: 100, clutch: 0, durability: 0, support: 0,
    description: "📊 Volume Hero - Stat padding reigns supreme, filling up the stat sheet is everything",
    statsWeights: {
      efficiency: 10,       // De-emphasized - efficiency doesn't matter for stat padding
      protection: 5,        // Minimal - turnovers are just stats
      volume: 85            // Maximized - volume is everything
    },
    efficiencyWeights: {
      anyA: 30,             // Reduced - ANY/A efficiency doesn't matter for volume
      tdPct: 40,            // Increased - TDs are volume stats
      completionPct: 30     // Maintained - completions are volume
    },
    protectionWeights: {
      sackPct: 20,          // Reduced - sacks don't help volume
      turnoverRate: 80      // Increased - turnovers hurt volume
    },
    volumeWeights: {
      passYards: 35,        // Increased - passing yards are king for volume
      passTDs: 40,          // Increased - TDs are the ultimate volume stat
      rushYards: 15,        // Maintained - rushing yards add to total volume
      rushTDs: 5,           // Reduced - passing TDs more valuable
      totalAttempts: 5      // Reduced - attempts don't measure volume quality
    }
  },
  
  efficiencyPurist: {
    team: 0, stats: 100, clutch: 0, durability: 0, support: 0,
    description: "⚡ Efficiency Purist - Minimize mistakes, maximize per-play value",
    statsWeights: {
      efficiency: 70,       // Heavily emphasized - ANY/A, TD%, Comp% are king
      protection: 25,       // Important - ball security matters
      volume: 5             // Minimal - efficiency > volume
    },
    efficiencyWeights: {
      anyA: 60,             // Increased - ANY/A is the gold standard efficiency metric
      tdPct: 30,            // Increased - TD% shows scoring efficiency
      completionPct: 10     // Reduced - completion% has limitations in modern NFL
    },
    protectionWeights: {
      sackPct: 20,          // Reduced - somewhat QB-dependent
      turnoverRate: 80      // Increased - critical for efficiency, protecting the ball
    },
    volumeWeights: {
      passYards: 20,        // Reduced - efficiency over raw yards
      passTDs: 30,          // Maintained - TDs still matter for efficiency
      rushYards: 10,        // Reduced - rushing efficiency less important
      rushTDs: 10,          // Reduced - passing efficiency more valuable
      totalAttempts: 30     // Increased - attempts show efficiency at scale
    }
  },
  
  balancedAttack: {
    team: 0, stats: 100, clutch: 0, durability: 0, support: 0,
    description: "⚖️ Balanced Attack - Complete QB evaluation across all statistical categories",
    statsWeights: {
      efficiency: 40,        // Important but not dominant
      protection: 30,       // Decision-making matters
      volume: 30            // Production matters
    },
    efficiencyWeights: {
      anyA: 45,             // Balanced - ANY/A is important but not dominant
      tdPct: 35,            // Balanced - TD% matters for scoring
      completionPct: 20     // Balanced - completion% has value
    },
    protectionWeights: {
      sackPct: 40,          // Balanced - sack avoidance matters
      turnoverRate: 60      // Balanced - ball security is crucial
    },
    volumeWeights: {
      passYards: 30,        // Balanced - passing yards show production
      passTDs: 35,          // Balanced - TDs are ultimate success measure
      rushYards: 15,        // Balanced - rushing adds value
      rushTDs: 15,          // Balanced - rushing TDs matter
      totalAttempts: 5      // Reduced - attempts don't measure quality
    }
  },
  
  scottsPreset: {
    team: 33, stats: 67, clutch: 0, durability: 0, support: 0,
    description: "🎯 Scott's Preset - Balanced team success and statistical performance evaluation",
    statsWeights: {
      efficiency: 45,       // Core efficiency metrics
      protection: 10,       // Minimal protection focus
      volume: 45           // Strong volume emphasis
    },
    efficiencyWeights: {
      anyA: 45,            // ANY/A as primary efficiency metric
      tdPct: 40,           // Strong TD% emphasis
      completionPct: 15    // Reduced completion% weight
    },
    protectionWeights: {
      sackPct: 25,         // Moderate sack avoidance
      turnoverRate: 75     // Strong emphasis on ball security
    },
    volumeWeights: {
      passYards: 35,       // Strong passing yard production
      passTDs: 35,         // Strong passing TD production
      rushYards: 10,       // Moderate rushing yard production
      rushTDs: 15,         // Moderate rushing TD production
      totalAttempts: 5     // Minimal attempt weighting
    }
  }
};

export const getTeamInfo = (teamAbbr) => {
  return TEAM_MAP[teamAbbr] || { id: '0', name: teamAbbr, logo: '' };
}; 