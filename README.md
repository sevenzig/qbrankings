# 🏈 NFL QB Rankings React App

A dynamic React application that fetches real-time NFL quarterback data from ESPN's API and provides customizable rankings based on multiple performance metrics.

## Features

- **Real-time Data**: Fetches live NFL quarterback statistics from ESPN API
- **Dynamic Rankings**: Customizable weighting system for different performance metrics
- **Interactive UI**: Beautiful gradient design with responsive tables and controls
- **Live Updates**: Refresh data on demand to get the latest statistics
- **Performance Metrics**: Comprehensive QB evaluation including team success, individual stats, championship history, clutch performance, and team support

## Tech Stack

- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **ESPN API** - Real-time NFL data source
- **Lucide React** - Icon components

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd qb-rankings
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

The project includes a `vercel.json` configuration file for easy deployment to Vercel:

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

## How It Works

1. **Data Fetching**: The app fetches team rosters from ESPN to identify all active quarterbacks
2. **Statistics**: Individual QB statistics are retrieved for the current season
3. **Metrics Calculation**: Five key metrics are calculated:
   - **Team Success** (45%): Win-loss record and playoff performance
   - **Individual Stats** (25%): Passing yards, TDs, completion percentage, passer rating
   - **Championship History** (15%): Super Bowl wins and playoff success
   - **Clutch Performance** (10%): Performance in key moments
   - **Team Support** (5%): Quality of supporting cast adjustment

4. **Dynamic Rankings**: Users can adjust the weight of each metric to see how rankings change
5. **Real-time Updates**: Rankings update instantly as weights are adjusted

## Customization

The weighting system allows you to customize rankings based on your QB philosophy:
- Increase **Team Success** weight if you value winning above all
- Boost **Individual Stats** for pure statistical performance
- Emphasize **Championship History** for proven winners
- Adjust **Clutch Performance** for pressure situations
- Modify **Team Support** to account for surrounding talent

## API Usage

This app uses ESPN's public APIs:
- Team rosters: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams`
- Individual stats: `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/{id}/stats`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
