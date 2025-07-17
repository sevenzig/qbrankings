# QB Splits Comparison Tool Guide

## Overview

The QB Splits Comparison Tool is a powerful, flexible interface that allows you to compare any statistic from either the `qb_splits` or `qb_splits_advanced` tables. This tool goes beyond the basic 3rd & 1-3 analysis to provide comprehensive insights into quarterback performance across all available situational splits.

## Features

### 🎯 **Flexible Split Selection**
- Choose from any available split type (Down, Place, Result, Quarter, Distance, etc.)
- Select specific split values (3rd, Red Zone, Win, 4th Quarter, etc.)
- Support for both `qb_splits` and `qb_splits_advanced` tables

### 📊 **Multi-Statistic Comparison**
- Compare multiple statistics simultaneously
- Automatic calculation of derived statistics (completion rate, yards per attempt, etc.)
- Customizable minimum attempts filter for meaningful comparisons

### 🏆 **Top Performers Analysis**
- Rank QBs by any selected statistic
- Comprehensive summary statistics
- Complete QB breakdown with all relevant metrics

### ⚡ **Quick Access**
- Popular splits for common analysis scenarios
- Season selection (2022-2024)
- Real-time data loading and processing

## How to Use

### 1. Access the Tool
- Click the "📊 Splits Comparison Tool" button from the main rankings page
- The tool will load available split types for the selected season

### 2. Configure Your Analysis
- **Season**: Select the year to analyze (2022, 2023, or 2024)
- **Split Type**: Choose the category of splits (Down, Place, Result, etc.)
- **Split Value**: Select the specific value within that category
- **Min Attempts**: Set minimum attempts to filter out small sample sizes
- **Statistics**: Check the statistics you want to compare

### 3. Run Comparison
- Click "Run Comparison" to execute the analysis
- View results in multiple formats:
  - Summary statistics
  - Top performers by each statistic
  - Complete QB breakdown

## Available Split Types

The database uses a single split type called "other" with various values that represent different situational contexts:

### Down-Based Splits
- **3rd**: Third down performance
- **4th**: Fourth down performance
- **3rd & 1-3**: Third and short situations
- **3rd & 4-6**: Third and medium situations
- **3rd & 7-9**: Third and long situations
- **3rd & 10+**: Third and very long situations

### Place-Based Splits
- **Red Zone**: Performance inside the 20-yard line
- **Own 1-10**: Performance inside own 10-yard line
- **Own 1-20**: Performance inside own 20-yard line
- **Own 21-50**: Performance between own 21-50 yard lines
- **Opp 1-10**: Performance inside opponent's 10-yard line
- **Opp 49-20**: Performance between opponent's 49-20 yard lines

### Quarter-Based Splits
- **1st Qtr**: First quarter performance
- **2nd Qtr**: Second quarter performance
- **3rd Qtr**: Third quarter performance
- **4th Qtr**: Fourth quarter performance
- **1st Half**: First half performance
- **2nd Half**: Second half performance
- **OT**: Overtime performance

### Game Situation Splits
- **Leading**: Performance when leading in the game
- **Trailing**: Performance when trailing in the game
- **Tied**: Performance when the game is tied
- **Win**: Performance in winning games
- **Loss**: Performance in losing games

### Formation Splits
- **Shotgun**: Performance from shotgun formation
- **Under Center**: Performance from under center formation
- **Huddle**: Performance from huddle formation
- **No Huddle**: Performance from no-huddle formation

### Play Type Splits
- **play action**: Performance on play action passes
- **non-play action**: Performance on non-play action passes
- **rpo**: Performance on RPO (run-pass option) plays
- **non-rpo**: Performance on non-RPO plays

### Time-Based Splits
- **< 2.5 seconds**: Performance on quick throws
- **2.5+ seconds**: Performance on longer developing plays
- **< 2 min to go**: Performance in final 2 minutes
- **< 4 min to go**: Performance in final 4 minutes

### Location Splits
- **Home**: Performance in home games
- **Road**: Performance in road games
- **dome**: Performance in dome stadiums
- **outdoors**: Performance in outdoor stadiums

## Available Statistics

### Basic Statistics
- **Attempts**: Number of pass attempts
- **Completions**: Number of completions
- **Yards**: Total passing yards
- **Touchdowns**: Number of passing touchdowns
- **Interceptions**: Number of interceptions
- **Passer Rating**: NFL passer rating

### Derived Statistics
- **Completion Rate**: Completion percentage
- **Yards per Attempt**: Average yards per attempt
- **TD Rate**: Touchdown percentage
- **INT Rate**: Interception percentage

### Advanced Statistics
- **Adjusted Yards per Attempt**: ANY/A
- **Net Yards per Attempt**: NY/A
- **Adjusted Net Yards per Attempt**: ANY/A
- **Success Rate**: Percentage of successful plays

## Popular Analysis Scenarios

### 1. **3rd Down Performance**
- Split Type: `other`
- Split Value: `3rd`
- Statistics: `completion_rate`, `yards_per_attempt`, `td_rate`
- Min Attempts: `15`

### 2. **Red Zone Efficiency**
- Split Type: `other`
- Split Value: `Red Zone`
- Statistics: `completion_rate`, `td_rate`, `int_rate`
- Min Attempts: `10`

### 3. **Clutch Performance (4th Quarter)**
- Split Type: `other`
- Split Value: `4th Qtr`
- Statistics: `completion_rate`, `yards_per_attempt`, `passer_rating`
- Min Attempts: `20`

### 4. **Short Yardage Situations**
- Split Type: `other`
- Split Value: `3rd & 1-3`
- Statistics: `completion_rate`, `yards_per_attempt`, `td_rate`
- Min Attempts: `10`

### 5. **Winning vs Losing Performance**
- Split Type: `other`
- Split Value: `Win` or `Loss`
- Statistics: `completion_rate`, `yards_per_attempt`, `passer_rating`
- Min Attempts: `25`

## Interpreting Results

### Summary Statistics
- **Total QBs**: Number of quarterbacks meeting the criteria
- **Total Attempts**: Combined attempts across all QBs
- **Average Completion %**: League average completion rate
- **Average Y/A**: League average yards per attempt

### Top Performers
- Ranked by the selected statistic
- Shows player name, team, attempts, and statistic value
- Includes team logos for easy identification

### Complete Breakdown
- Full table of all QBs with their statistics
- Sorted by the primary comparison statistic
- Includes all relevant metrics for context

## Technical Details

### Data Sources
- **qb_splits**: Basic splits data from Pro Football Reference
- **qb_splits_advanced**: Advanced splits with additional metrics
- Automatic fallback between tables for maximum data coverage

### Performance Optimizations
- Lazy loading of split types and statistics
- Efficient database queries with proper indexing
- Client-side caching of frequently accessed data

### Error Handling
- Graceful handling of missing data
- Clear error messages for troubleshooting
- Fallback options when specific splits aren't available

## Troubleshooting

### No Data Found
- Check that the selected season has data available
- Try different split types or values
- Lower the minimum attempts filter
- Verify Supabase connection is working

### Slow Loading
- Reduce the number of selected statistics
- Increase the minimum attempts filter
- Check network connection
- Try a different season

### Missing Statistics
- Some splits may not have all statistics available
- Check the available statistics list for the selected split
- Try different split combinations

## Examples

### Example 1: Finding the Best 3rd Down QBs
1. Select Season: `2024`
2. Select Split Type: `other`
3. Select Split Value: `3rd`
4. Set Min Attempts: `20`
5. Select Statistics: `completion_rate`, `yards_per_attempt`, `td_rate`
6. Click "Run Comparison"

### Example 2: Red Zone Efficiency Analysis
1. Select Season: `2024`
2. Select Split Type: `other`
3. Select Split Value: `Red Zone`
4. Set Min Attempts: `15`
5. Select Statistics: `completion_rate`, `td_rate`, `int_rate`
6. Click "Run Comparison"

### Example 3: 4th Quarter Clutch Performance
1. Select Season: `2024`
2. Select Split Type: `other`
3. Select Split Value: `4th Qtr`
4. Set Min Attempts: `25`
5. Select Statistics: `completion_rate`, `yards_per_attempt`, `passer_rating`
6. Click "Run Comparison"

## Advanced Usage

### Custom Analysis
- Combine multiple statistics for comprehensive evaluation
- Use minimum attempts to focus on meaningful sample sizes
- Compare across different seasons for trend analysis

### Data Export
- Results can be copied from the browser for external analysis
- Use browser developer tools to export data as JSON
- Screenshot functionality available for sharing results

### Integration with Rankings
- Use splits analysis to inform QB ranking weights
- Compare splits performance with overall QB evaluation
- Identify situational strengths and weaknesses

## Support

For technical support or feature requests:
- Check the main documentation for general QB rankings information
- Review the SQL Test & Data Examples for database connectivity
- Contact the development team for specific issues

---

This tool represents a significant advancement in QB analysis capabilities, providing unprecedented flexibility in examining quarterback performance across all available situational contexts. 