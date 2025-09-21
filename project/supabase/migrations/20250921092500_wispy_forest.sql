/*
  # Smart Tourist Safety Monitoring System Database Schema

  1. New Tables
    - `tourists` - Stores KYC data and Digital Tourist ID information
    - `locations` - Tracks real-time location updates from tourists
    - `restricted_zones` - Defines geofenced areas with risk levels
    - `itineraries` - Stores planned tourist routes and destinations
    - `anomalies` - Records detected safety anomalies and incidents
    - `safety_scores` - Maintains dynamic safety scores for each tourist

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Add admin policies for dashboard access

  3. Indexes
    - Location-based indexes for efficient geospatial queries
    - Time-based indexes for anomaly detection
*/

-- Create tourists table for KYC and DTID management
CREATE TABLE IF NOT EXISTS tourists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dtid text UNIQUE NOT NULL,
  aadhaar_number text,
  passport_number text,
  full_name text NOT NULL,
  date_of_birth date NOT NULL,
  contact_number text NOT NULL,
  email text,
  emergency_contact_1 text NOT NULL,
  emergency_contact_2 text,
  nationality text NOT NULL DEFAULT 'India',
  qr_code_url text,
  kyc_status text DEFAULT 'verified' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create locations table for real-time tracking
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dtid text NOT NULL REFERENCES tourists(dtid) ON DELETE CASCADE,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  altitude decimal(8, 2) DEFAULT 0,
  accuracy decimal(6, 2),
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create restricted zones for geofencing
CREATE TABLE IF NOT EXISTS restricted_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  radius_meters integer NOT NULL DEFAULT 1000,
  risk_level text DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  zone_type text DEFAULT 'restricted' CHECK (zone_type IN ('restricted', 'dangerous', 'emergency', 'border')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create itineraries table for planned routes
CREATE TABLE IF NOT EXISTS itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dtid text NOT NULL REFERENCES tourists(dtid) ON DELETE CASCADE,
  destination_name text NOT NULL,
  destination_lat decimal(10, 8) NOT NULL,
  destination_lng decimal(11, 8) NOT NULL,
  planned_arrival timestamptz,
  planned_departure timestamptz,
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Create anomalies table for incident tracking
CREATE TABLE IF NOT EXISTS anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dtid text NOT NULL REFERENCES tourists(dtid) ON DELETE CASCADE,
  anomaly_type text NOT NULL CHECK (anomaly_type IN ('inactivity', 'geofence_breach', 'route_deviation', 'altitude_drop', 'speed_anomaly')),
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  metadata jsonb DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_positive')),
  detected_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create safety scores table
CREATE TABLE IF NOT EXISTS safety_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dtid text NOT NULL REFERENCES tourists(dtid) ON DELETE CASCADE,
  current_score integer DEFAULT 100 CHECK (current_score >= 0 AND current_score <= 100),
  last_updated timestamptz DEFAULT now(),
  factors jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Insert sample restricted zones for testing
INSERT INTO restricted_zones (name, description, latitude, longitude, radius_meters, risk_level, zone_type) VALUES
('Border Area - Pakistan', 'International border restricted zone', 32.7767, 74.8728, 5000, 'critical', 'border'),
('Naxal Affected Area - Chhattisgarh', 'High risk area with security concerns', 20.2961, 81.8847, 10000, 'high', 'dangerous'),
('Landslide Prone Zone - Uttarakhand', 'Geological hazard zone', 30.7333, 79.6167, 3000, 'high', 'dangerous'),
('Military Cantonment - Delhi', 'Restricted military area', 28.6129, 77.2295, 2000, 'medium', 'restricted'),
('Wildlife Sanctuary - Jim Corbett', 'Protected wildlife area with entry restrictions', 29.5371, 78.7644, 15000, 'medium', 'restricted');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_locations_dtid_timestamp ON locations(dtid, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_anomalies_dtid_status ON anomalies(dtid, status);
CREATE INDEX IF NOT EXISTS idx_restricted_zones_coords ON restricted_zones(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_tourists_dtid ON tourists(dtid);

-- Enable Row Level Security
ALTER TABLE tourists ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE restricted_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for tourists table
CREATE POLICY "Tourists can read own data"
  ON tourists
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = dtid OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage all tourists"
  ON tourists
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for locations table
CREATE POLICY "Users can insert own location"
  ON locations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = dtid OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can read own location"
  ON locations
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = dtid OR auth.jwt() ->> 'role' = 'admin');

-- Create policies for other tables (admin access)
CREATE POLICY "Admin can manage restricted zones"
  ON restricted_zones
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage itineraries"
  ON itineraries
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage anomalies"
  ON anomalies
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage safety scores"
  ON safety_scores
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');