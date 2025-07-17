# Team Logos Setup

This document explains how to download and set up local NFL team logos for the QB Rankings application.

## Overview

The application uses local team logos instead of external ESPN URLs to:
- Avoid CORS issues
- Improve loading performance
- Remove external API dependencies
- Ensure consistent availability

## Quick Setup

1. **Download all team logos:**
   ```bash
   npm run download-logos
   ```

2. **Verify the logos are downloaded:**
   - Check that `public/logos/` directory contains 32 PNG files
   - Each file should be named with lowercase team abbreviation (e.g., `cin.png`, `kan.png`)

## Manual Setup (if needed)

If the automatic download fails, you can manually download the logos:

1. **Create the logos directory:**
   ```bash
   mkdir -p public/logos
   ```

2. **Download logos from ESPN:**
   - Visit: `https://a.espncdn.com/i/teamlogos/nfl/500/[team].png`
   - Replace `[team]` with the lowercase team abbreviation
   - Save each file as `[team].png` in the `public/logos/` directory

## Team Abbreviations

The application supports comprehensive team abbreviation mapping covering both 2-letter and 3-letter variations:

### Standard 2-Letter Abbreviations

| Abbreviation | Team Name | Filename |
|--------------|-----------|----------|
| ARI | Arizona Cardinals | ari.png |
| ATL | Atlanta Falcons | atl.png |
| BAL | Baltimore Ravens | bal.png |
| BUF | Buffalo Bills | buf.png |
| CAR | Carolina Panthers | car.png |
| CHI | Chicago Bears | chi.png |
| CIN | Cincinnati Bengals | cin.png |
| CLE | Cleveland Browns | cle.png |
| DAL | Dallas Cowboys | dal.png |
| DEN | Denver Broncos | den.png |
| DET | Detroit Lions | det.png |
| GB | Green Bay Packers | gb.png |
| HOU | Houston Texans | hou.png |
| IND | Indianapolis Colts | ind.png |
| JAX | Jacksonville Jaguars | jax.png |
| KC | Kansas City Chiefs | kc.png |
| LV | Las Vegas Raiders | lv.png |
| LAC | Los Angeles Chargers | lac.png |
| LAR | Los Angeles Rams | lar.png |
| MIA | Miami Dolphins | mia.png |
| MIN | Minnesota Vikings | min.png |
| NE | New England Patriots | ne.png |
| NO | New Orleans Saints | no.png |
| NYG | New York Giants | nyg.png |
| NYJ | New York Jets | nyj.png |
| PHI | Philadelphia Eagles | phi.png |
| PIT | Pittsburgh Steelers | pit.png |
| SF | San Francisco 49ers | sf.png |
| SEA | Seattle Seahawks | sea.png |
| TB | Tampa Bay Buccaneers | tb.png |
| TEN | Tennessee Titans | ten.png |
| WSH | Washington Commanders | wsh.png |

### 3-Letter PFR Abbreviations

The application also supports 3-letter abbreviations used by Pro Football Reference (PFR):

| 3-Letter Abbr | Maps To | Team Name | Uses Logo |
|---------------|---------|-----------|-----------|
| GNB | GB | Green Bay Packers | gb.png |
| KAN | KC | Kansas City Chiefs | kc.png |
| LVR | LV | Las Vegas Raiders | lv.png |
| NWE | NE | New England Patriots | ne.png |
| NOR | NO | New Orleans Saints | no.png |
| SFO | SF | San Francisco 49ers | sf.png |
| TAM | TB | Tampa Bay Buccaneers | tb.png |
| WAS | WSH | Washington Commanders | wsh.png |

### Special Cases

| Abbreviation | Description | Logo |
|--------------|-------------|------|
| 2TM | Multiple Teams (players who played for multiple teams) | None |

## Data Source Compatibility

This mapping ensures compatibility with:
- **CSV Data**: Uses 3-letter PFR abbreviations (KAN, LVR, GNB, etc.)
- **Supabase Data**: May use either 2-letter or 3-letter abbreviations
- **Display**: Always shows the appropriate team logo regardless of source abbreviation

## Troubleshooting

### Logos not displaying
1. Check that all 32 PNG files exist in `public/logos/`
2. Verify file permissions allow web server to read the files
3. Check browser console for 404 errors on logo requests
4. Ensure team abbreviations are correctly mapped in `src/constants/teamData.js`

### Download script fails
1. Ensure you have Node.js installed
2. Check internet connection
3. Verify ESPN CDN is accessible
4. Check file system permissions for writing to `public/logos/`

### Missing team data
If a team abbreviation is not found in the database:
- The logo will not display
- The team abbreviation will be shown as fallback
- Check the team mapping in `src/constants/teamData.js`
- Verify the abbreviation is included in the comprehensive mapping

## File Structure

```
public/
└── logos/
    ├── ari.png (Arizona Cardinals)
    ├── atl.png (Atlanta Falcons)
    ├── bal.png (Baltimore Ravens)
    ├── buf.png (Buffalo Bills)
    ├── car.png (Carolina Panthers)
    ├── chi.png (Chicago Bears)
    ├── cin.png (Cincinnati Bengals)
    ├── cle.png (Cleveland Browns)
    ├── dal.png (Dallas Cowboys)
    ├── den.png (Denver Broncos)
    ├── det.png (Detroit Lions)
    ├── gb.png (Green Bay Packers)
    ├── hou.png (Houston Texans)
    ├── ind.png (Indianapolis Colts)
    ├── jax.png (Jacksonville Jaguars)
    ├── kc.png (Kansas City Chiefs)
    ├── lv.png (Las Vegas Raiders)
    ├── lac.png (Los Angeles Chargers)
    ├── lar.png (Los Angeles Rams)
    ├── mia.png (Miami Dolphins)
    ├── min.png (Minnesota Vikings)
    ├── ne.png (New England Patriots)
    ├── no.png (New Orleans Saints)
    ├── nyg.png (New York Giants)
    ├── nyj.png (New York Jets)
    ├── phi.png (Philadelphia Eagles)
    ├── pit.png (Pittsburgh Steelers)
    ├── sf.png (San Francisco 49ers)
    ├── sea.png (Seattle Seahawks)
    ├── tb.png (Tampa Bay Buccaneers)
    ├── ten.png (Tennessee Titans)
    └── wsh.png (Washington Commanders)
```

## Maintenance

### Adding New Teams
If the NFL adds new teams:
1. Add the team to the `teams` array in `scripts/download-team-logos.js`
2. Add the team mapping to `src/constants/teamData.js`
3. Run `npm run download-logos` to get the new logo
4. Update this documentation

### Updating Logos
To update team logos:
1. Run `npm run download-logos` to re-download all logos
2. The script will overwrite existing files with updated versions

### Team Relocations/Rebrands
If teams relocate or rebrand:
1. Update the team name in `src/constants/teamData.js`
2. Update the logo file if needed
3. Consider maintaining backward compatibility for historical data 