// CSV parsing utility functions

export const parseCSV = (csvText) => {
  if (!csvText || csvText.trim().length === 0) {
    console.warn('Empty CSV text provided');
    return [];
  }
  
  const lines = csvText.trim().split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    console.warn('No lines found in CSV');
    return [];
  }
  
  console.log(`🔍 CSV has ${lines.length} lines`);
  
  const headers = lines[0].split(',').map(h => h.trim());
  console.log('🔍 Headers found:', headers);
  
  const dataRows = lines.slice(1)
    .map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((header, headerIndex) => {
        obj[header] = values[headerIndex] || '';
      });
      
      // IMPORTANT FIX: Handle duplicate 'Yds' columns and extract all missing data
      // Column 11 = Passing Yards (what we want)
      // Column 17 = Succ% (Success Rate)
      // Column 25 = Sack Yards (what we were accidentally getting)  
      // Column 27 = Sk% (Sack Percentage)
      // Column 29 = ANY/A (Adjusted Net Yards per Attempt)
      // Column 30 = 4QC (4th Quarter Comebacks)
      // Column 31 = GWD (Game Winning Drives)
      // Look for additional rushing columns if present
      if (values.length > 30) {
        obj.PassingYds = values[11] || '0';  // Force passing yards
        obj.SuccessRate = values[17] || '0'; // Success rate (column 18, index 17)
        obj.SackYds = values[25] || '0';     // Separate sack yards
        obj.SackPct = values[27] || '0';     // Sack percentage (column 28, index 27)
        obj.AnyPerAttempt = values[29] || '0'; // ANY/A (column 30, index 29)
        obj.ClutchFourthQC = values[30] || '0'; // 4th Quarter Comebacks (column 31, index 30)
        obj.ClutchGWD = values[31] || '0';     // Game Winning Drives (column 32, index 31)
        
        // Check for rushing stats in extended columns (if available)
        if (values.length > 35) {
          obj.RushingAtt = values[32] || '0';   // Rushing attempts
          obj.RushingYds = values[33] || '0';   // Rushing yards  
          obj.RushingTDs = values[34] || '0';   // Rushing touchdowns
          obj.RushingYPA = values[35] || '0';   // Rushing yards per attempt
        }
      }
      
      // Debug first few rows
      if (index < 3) {
        console.log(`🔍 Row ${index + 1}:`, obj);
      }
      
      return obj;
    })
    .filter(obj => {
      // More lenient filtering - just check if Player field exists and isn't empty
      const hasPlayer = obj.Player && obj.Player.trim() !== '' && obj.Player !== 'Player';
      if (!hasPlayer && obj.Player) {
        console.log('🔍 Filtered out row with Player:', obj.Player);
      }
      return hasPlayer;
    });
  
  console.log(`🔍 Parsed ${dataRows.length} valid data rows`);
  return dataRows;
};

export const parseQBRecord = (qbRecord) => {
  if (!qbRecord || qbRecord === '') {
    return { wins: 0, losses: 0, winPercentage: 0 };
  }
  
  const parts = qbRecord.split('-');
  const wins = parseInt(parts[0]) || 0;
  const losses = parseInt(parts[1]) || 0;
  const ties = parseInt(parts[2]) || 0;
  
  const totalGames = wins + losses + ties;
  const winPercentage = totalGames > 0 ? wins / totalGames : 0;
  
  return { wins, losses, winPercentage };
}; 