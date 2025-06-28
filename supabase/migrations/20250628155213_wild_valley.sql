/*
  # Health Monitoring Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `age` (integer)
      - `gender` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `vital_readings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `heart_rate` (integer)
      - `blood_pressure_systolic` (integer)
      - `blood_pressure_diastolic` (integer)
      - `spo2` (integer)
      - `temperature` (decimal)
      - `timestamp` (timestamp)
      - `source` (text) - 'manual', 'sensor', 'device'
      - `device_id` (text, optional)
    
    - `health_predictions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `vital_reading_id` (uuid, references vital_readings)
      - `risk_score` (integer)
      - `risk_level` (text)
      - `predicted_conditions` (jsonb)
      - `confidence` (integer)
      - `feedback` (text)
      - `recommendations` (jsonb)
      - `model_version` (text)
      - `created_at` (timestamp)
    
    - `chat_conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `chat_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references chat_conversations)
      - `role` (text) - 'user', 'assistant'
      - `content` (text)
      - `timestamp` (timestamp)
    
    - `connected_devices`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `device_name` (text)
      - `device_type` (text)
      - `connection_type` (text)
      - `is_active` (boolean)
      - `last_sync` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  age integer,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vital_readings table
CREATE TABLE IF NOT EXISTS vital_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  heart_rate integer NOT NULL CHECK (heart_rate > 0 AND heart_rate < 300),
  blood_pressure_systolic integer NOT NULL CHECK (blood_pressure_systolic > 0 AND blood_pressure_systolic < 300),
  blood_pressure_diastolic integer NOT NULL CHECK (blood_pressure_diastolic > 0 AND blood_pressure_diastolic < 200),
  spo2 integer NOT NULL CHECK (spo2 >= 0 AND spo2 <= 100),
  temperature decimal(4,1) NOT NULL CHECK (temperature > 30 AND temperature < 50),
  timestamp timestamptz DEFAULT now(),
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'sensor', 'device')),
  device_id text
);

-- Create health_predictions table
CREATE TABLE IF NOT EXISTS health_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vital_reading_id uuid REFERENCES vital_readings(id) ON DELETE CASCADE NOT NULL,
  risk_score integer NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level text NOT NULL CHECK (risk_level IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
  predicted_conditions jsonb DEFAULT '[]'::jsonb,
  confidence integer NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  feedback text,
  recommendations jsonb DEFAULT '[]'::jsonb,
  model_version text DEFAULT 'v1.0',
  created_at timestamptz DEFAULT now()
);

-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Create connected_devices table
CREATE TABLE IF NOT EXISTS connected_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  device_name text NOT NULL,
  device_type text NOT NULL,
  connection_type text NOT NULL,
  is_active boolean DEFAULT true,
  last_sync timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_devices ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for vital_readings
CREATE POLICY "Users can read own vital readings"
  ON vital_readings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vital readings"
  ON vital_readings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vital readings"
  ON vital_readings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for health_predictions
CREATE POLICY "Users can read own predictions"
  ON health_predictions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions"
  ON health_predictions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for chat_conversations
CREATE POLICY "Users can read own conversations"
  ON chat_conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON chat_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON chat_conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for chat_messages
CREATE POLICY "Users can read messages from own conversations"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to own conversations"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

-- Create policies for connected_devices
CREATE POLICY "Users can read own devices"
  ON connected_devices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices"
  ON connected_devices
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
  ON connected_devices
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
  ON connected_devices
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vital_readings_user_timestamp ON vital_readings(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_predictions_user_created ON health_predictions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_connected_devices_user_active ON connected_devices(user_id, is_active);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();