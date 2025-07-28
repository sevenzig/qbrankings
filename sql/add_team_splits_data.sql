-- Add Team Splits Data to Database
-- This script populates the teams table with all NFL teams from the splits mapping

-- Insert all NFL teams with their conference and division information
-- Use ON CONFLICT to update existing records instead of failing
INSERT INTO teams (team_code, team_name, city, conference, division, founded_year, stadium_name, stadium_capacity) VALUES
-- AFC East
('BUF', 'Buffalo Bills', 'Buffalo', 'AFC', 'East', 1960, 'Highmark Stadium', 71608),
('MIA', 'Miami Dolphins', 'Miami', 'AFC', 'East', 1966, 'Hard Rock Stadium', 65326),
('NWE', 'New England Patriots', 'Foxborough', 'AFC', 'East', 1960, 'Gillette Stadium', 65878),
('NYJ', 'New York Jets', 'East Rutherford', 'AFC', 'East', 1960, 'MetLife Stadium', 82500),

-- AFC North
('BAL', 'Baltimore Ravens', 'Baltimore', 'AFC', 'North', 1996, 'M&T Bank Stadium', 71008),
('CIN', 'Cincinnati Bengals', 'Cincinnati', 'AFC', 'North', 1968, 'Paycor Stadium', 65515),
('CLE', 'Cleveland Browns', 'Cleveland', 'AFC', 'North', 1946, 'Cleveland Browns Stadium', 67895),
('PIT', 'Pittsburgh Steelers', 'Pittsburgh', 'AFC', 'North', 1933, 'Acrisure Stadium', 68400),

-- AFC South
('HOU', 'Houston Texans', 'Houston', 'AFC', 'South', 2002, 'NRG Stadium', 72220),
('IND', 'Indianapolis Colts', 'Indianapolis', 'AFC', 'South', 1953, 'Lucas Oil Stadium', 67000),
('JAX', 'Jacksonville Jaguars', 'Jacksonville', 'AFC', 'South', 1995, 'EverBank Stadium', 67250),
('TEN', 'Tennessee Titans', 'Nashville', 'AFC', 'South', 1960, 'Nissan Stadium', 69143),

-- AFC West
('DEN', 'Denver Broncos', 'Denver', 'AFC', 'West', 1960, 'Empower Field at Mile High', 76125),
('KAN', 'Kansas City Chiefs', 'Kansas City', 'AFC', 'West', 1960, 'Arrowhead Stadium', 76416),
('LAC', 'Los Angeles Chargers', 'Los Angeles', 'AFC', 'West', 1960, 'SoFi Stadium', 70240),
('LVR', 'Las Vegas Raiders', 'Las Vegas', 'AFC', 'West', 1960, 'Allegiant Stadium', 65000),

-- NFC East
('DAL', 'Dallas Cowboys', 'Dallas', 'NFC', 'East', 1960, 'AT&T Stadium', 80000),
('NYG', 'New York Giants', 'East Rutherford', 'NFC', 'East', 1925, 'MetLife Stadium', 82500),
('PHI', 'Philadelphia Eagles', 'Philadelphia', 'NFC', 'East', 1933, 'Lincoln Financial Field', 69596),
('WAS', 'Washington Commanders', 'Landover', 'NFC', 'East', 1932, 'FedExField', 82000),

-- NFC North
('CHI', 'Chicago Bears', 'Chicago', 'NFC', 'North', 1920, 'Soldier Field', 61500),
('DET', 'Detroit Lions', 'Detroit', 'NFC', 'North', 1930, 'Ford Field', 65000),
('GNB', 'Green Bay Packers', 'Green Bay', 'NFC', 'North', 1919, 'Lambeau Field', 81441),
('MIN', 'Minnesota Vikings', 'Minneapolis', 'NFC', 'North', 1961, 'U.S. Bank Stadium', 66855),

-- NFC South
('ATL', 'Atlanta Falcons', 'Atlanta', 'NFC', 'South', 1966, 'Mercedes-Benz Stadium', 71000),
('CAR', 'Carolina Panthers', 'Charlotte', 'NFC', 'South', 1995, 'Bank of America Stadium', 75523),
('NOR', 'New Orleans Saints', 'New Orleans', 'NFC', 'South', 1967, 'Caesars Superdome', 73208),
('TAM', 'Tampa Bay Buccaneers', 'Tampa', 'NFC', 'South', 1976, 'Raymond James Stadium', 65890),

-- NFC West
('ARI', 'Arizona Cardinals', 'Glendale', 'NFC', 'West', 1898, 'State Farm Stadium', 63400),
('LAR', 'Los Angeles Rams', 'Los Angeles', 'NFC', 'West', 1936, 'SoFi Stadium', 70240),
('SFO', 'San Francisco 49ers', 'Santa Clara', 'NFC', 'West', 1946, 'Levi''s Stadium', 68500),
('SEA', 'Seattle Seahawks', 'Seattle', 'NFC', 'West', 1976, 'Lumen Field', 69000)
ON CONFLICT (team_code) 
DO UPDATE SET
    team_name = EXCLUDED.team_name,
    city = EXCLUDED.city,
    conference = EXCLUDED.conference,
    division = EXCLUDED.division,
    founded_year = EXCLUDED.founded_year,
    stadium_name = EXCLUDED.stadium_name,
    stadium_capacity = EXCLUDED.stadium_capacity;

-- Verify the data was inserted correctly
SELECT 
    team_code,
    team_name,
    city,
    conference,
    division,
    founded_year
FROM teams 
ORDER BY conference, division, team_name;

-- Show count by conference and division
SELECT 
    conference,
    division,
    COUNT(*) as team_count
FROM teams 
GROUP BY conference, division 
ORDER BY conference, division; 