import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  weight?: number;
  height?: number;
  created_at: string;
  updated_at: string;
}

export interface VitalReading {
  id: string;
  user_id: string;
  heart_rate: number;
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  spo2: number;
  temperature: number;
  timestamp: string;
  source: 'manual' | 'sensor' | 'device';
  device_id?: string;
}

export interface HealthPrediction {
  id: string;
  user_id: string;
  vital_reading_id: string;
  risk_score: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  predicted_conditions: string[];
  confidence: number;
  feedback: string;
  recommendations: string[];
  model_version: string;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConnectedDevice {
  id: string;
  user_id: string;
  device_name: string;
  device_type: string;
  connection_type: string;
  is_active: boolean;
  last_sync?: string;
  created_at: string;
}