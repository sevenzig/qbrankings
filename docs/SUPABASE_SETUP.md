# Supabase Integration Setup

## Overview
This project now supports both CSV files and Supabase as data sources for QB rankings. Users can switch between data sources using the Data Source Selector component.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install @supabase/supabase-js
```

### 2. Environment Variables
Create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Schema
The project uses a comprehensive database schema with multiple tables. Run the complete SQL schema provided in your database initialization script, which includes:

- **`players`** - Master player information table
- **`teams`** - Team information table  
- **`qb_passing_stats`** - Main passing statistics (matches CSV format)
- **`qb_splits`** - Advanced splits data
- **`qb_splits_advanced`** - Detailed splits analysis
- **`scraping_logs`** - Audit trail for data collection
- **Views**: `qb_season_summary`, `database_stats`
- **Functions**: `get_player_season_data`, `get_splits_by_type`

The schema is designed to match Pro Football Reference CSV exports exactly, with no calculations - raw data only.

## Architecture

### Data Source Management
- **Unified Hook**: `useUnifiedQBData.js` manages switching between CSV and Supabase
- **Service Layer**: `supabase.js` provides data fetching utilities
- **UI Component**: `DataSourceSelector.jsx` allows users to choose data source

### Key Components

#### 1. Supabase Client (`src/utils/supabase.js`)
- Configures Supabase client with environment variables
- Provides data fetching services using the `qb_season_summary` view
- Includes error handling and real-time subscriptions
- Advanced query methods for detailed player data and splits

#### 2. Custom Hook (`src/hooks/useSupabaseQBData.js`)
- Manages Supabase data fetching state
- Integrates with existing QB calculations via data transformation
- Provides caching and error handling
- Validates data structure and transforms to CSV format

#### 3. Unified Hook (`src/hooks/useUnifiedQBData.js`)
- Switches between CSV and Supabase data sources
- Maintains consistent API across data sources
- Handles loading states and errors

#### 4. UI Selector (`src/components/DataSourceSelector.jsx`)
- Allows users to choose data source
- Shows connection status and availability
- Provides visual feedback during switching

#### 5. Data Transformer (`src/utils/supabaseDataTransformer.js`)
- Converts Supabase data format to CSV format
- Ensures compatibility with existing QB calculations
- Validates data structure and provides transformation statistics

## Usage

### Switching Data Sources
Users can switch between CSV and Supabase using the Data Source Selector:

1. **CSV Mode**: Uses local CSV files (default)
2. **Supabase Mode**: Uses cloud database (requires setup)

### Data Fetching Methods
The unified hook provides consistent methods regardless of data source:

```javascript
const {
  qbData,
  loading,
  error,
  dataSource,
  switchDataSource,
  fetchAllQBData,
  fetchQBDataByYear,
  fetchQBDataByName,
  fetchQBDataWithFilters
} = useUnifiedQBData();
```

## Features

### CSV Data Source
- ✅ Fast loading (no network dependency)
- ✅ Static data from public files
- ✅ No setup required
- ❌ No real-time updates
- ❌ Limited filtering options

### Supabase Data Source
- ✅ Real-time data updates
- ✅ Advanced filtering and querying
- ✅ Cloud-based storage
- ✅ Scalable and reliable
- ❌ Requires setup and configuration
- ❌ Network dependency

## Error Handling

### Environment Variables
- Validates Supabase URL and API key on startup
- Falls back to CSV if Supabase is not configured
- Shows helpful error messages for missing configuration

### Connection Issues
- Graceful fallback to CSV data source
- User-friendly error messages
- Retry mechanisms for failed connections

### Data Validation
- Validates data structure from both sources
- Handles missing or malformed data
- Provides fallback values for missing fields

## Testing

### Connection Test
The `SupabaseTest` component verifies:
- Environment variable configuration
- Database connection
- Data fetching capabilities
- Sample data retrieval

### Development Workflow
1. Start with CSV data source (no setup required)
2. Configure Supabase environment variables
3. Test connection using the test component
4. Switch to Supabase for advanced features

## Performance Considerations

### Caching
- Both data sources use 15-minute caching
- Reduces unnecessary API calls
- Improves user experience

### Loading States
- Smooth transitions between data sources
- Visual feedback during data fetching
- Prevents UI blocking during switches

### Bundle Size
- Supabase client is loaded only when needed
- Tree-shaking removes unused code
- Minimal impact on initial bundle size

## Future Enhancements

### Real-time Features
- Live data updates from Supabase
- Push notifications for data changes
- Collaborative features

### Advanced Filtering
- Complex database queries
- Custom filter combinations
- Saved filter presets

### Data Synchronization
- Sync CSV data to Supabase
- Backup and restore functionality
- Data migration tools

## Troubleshooting

### Common Issues

#### 1. "Supabase not available" error
- Check environment variables in `.env.local`
- Verify Supabase project URL and API key
- Ensure Supabase project is active

#### 2. Database connection errors
- Check Supabase project status
- Verify table exists and has correct schema
- Check Row Level Security (RLS) policies

#### 3. Data not loading
- Verify table contains data
- Check column names match expected schema
- Review browser console for detailed errors

### Debug Mode
Enable debug logging by checking browser console for:
- Connection status messages
- Data fetching progress
- Error details and stack traces

## Security

### Row Level Security (RLS)
Configure RLS policies in Supabase for production:

```sql
-- Allow read access to quarterbacks table
CREATE POLICY "Allow read access" ON quarterbacks
  FOR SELECT USING (true);
```

### API Key Security
- Use anon key for client-side access
- Restrict permissions appropriately
- Monitor API usage and limits

## Deployment

### Vercel Environment Variables
Set environment variables in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Production Considerations
- Enable RLS policies
- Monitor API usage
- Set up proper error tracking
- Configure backup strategies 