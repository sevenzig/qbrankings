import React, { memo, useCallback } from 'react';
import { Database, FileText } from 'lucide-react';

const DataSourceSelector = memo(({ 
  dataSource, 
  onDataSourceChange, 
  loading = false,
  disabled = false 
}) => {
  const handleSourceChange = useCallback((newSource) => {
    if (disabled || loading) return;
    onDataSourceChange(newSource);
  }, [onDataSourceChange, disabled, loading]);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            Data Source
          </h3>
          <p className="text-blue-200 text-sm">
            Choose where to fetch QB data from
          </p>
        </div>
        
        <div className="flex gap-2">
          {/* CSV Data Source Option */}
          <button
            onClick={() => handleSourceChange('csv')}
            disabled={disabled || loading}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
              ${dataSource === 'csv' 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-white/5 text-blue-200 hover:bg-white/10'
              }
              ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <FileText size={16} />
            <span className="hidden sm:inline">CSV Files</span>
            <span className="sm:hidden">CSV</span>
          </button>

          {/* Supabase Data Source Option */}
          <button
            onClick={() => handleSourceChange('supabase')}
            disabled={disabled || loading}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
              ${dataSource === 'supabase' 
                ? 'bg-green-500 text-white shadow-lg' 
                : 'bg-white/5 text-blue-200 hover:bg-white/10'
              }
              ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Database size={16} />
            <span className="hidden sm:inline">Supabase</span>
            <span className="sm:hidden">DB</span>
          </button>
        </div>
      </div>

      {/* Data Source Info */}
      <div className="mt-3 p-3 bg-white/5 rounded-lg">
        <div className="text-sm text-blue-200">
          {dataSource === 'csv' ? (
            <div className="flex items-start gap-2">
              <FileText size={14} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">CSV Files (Local)</p>
                <p className="text-blue-300 text-xs">
                  Static data from public CSV files. Fast loading, no network dependency.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <Database size={14} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Supabase (Cloud)</p>
                <p className="text-blue-300 text-xs">
                  Real-time data from cloud database. Live updates, advanced filtering.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mt-3 flex items-center gap-2 text-blue-200 text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-200"></div>
          <span>Switching data source...</span>
        </div>
      )}
    </div>
  );
});

export default DataSourceSelector; 