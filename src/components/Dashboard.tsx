import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import VitalsChart from './VitalsChart';
import VitalCard from './VitalCard';
import AlertBanner from './AlertBanner';
import { apiClient } from '../utils/apiClient';
import { Heart, Thermometer, Droplets, Wind } from 'lucide-react';

interface VitalsData {
  heart_rate: number;
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  spo2: number;
  temperature: number;
  timestamp: string;
}

interface DashboardProps {
  isDark: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ isDark }) => {
  const [currentVitals, setCurrentVitals] = useState<VitalsData | null>(null);
  const [vitalsHistory, setVitalsHistory] = useState<VitalsData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const fetchVitals = async () => {
      try {
        const data = await apiClient.getVitals();
        setCurrentVitals(data.current);
        setVitalsHistory(data.history);
        setIsConnected(true);
      } catch (error) {
        setIsConnected(false);
        console.error('Failed to fetch vitals:', error);
      }
    };

    fetchVitals();
    const interval = setInterval(fetchVitals, 5000);

    return () => clearInterval(interval);
  }, []);

  const vitalCards = currentVitals ? [
    {
      title: 'Heart Rate',
      value: currentVitals.heart_rate,
      unit: 'bpm',
      icon: Heart,
      normal: { min: 60, max: 100 },
      color: 'from-red-500 to-pink-500'
    },
    {
      title: 'Blood Pressure',
      value: `${currentVitals.blood_pressure_systolic}/${currentVitals.blood_pressure_diastolic}`,
      unit: 'mmHg',
      icon: Droplets,
      normal: { systolic: { min: 90, max: 140 }, diastolic: { min: 60, max: 90 } },
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'SpO₂',
      value: currentVitals.spo2,
      unit: '%',
      icon: Wind,
      normal: { min: 95, max: 100 },
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Temperature',
      value: currentVitals.temperature,
      unit: '°C',
      icon: Thermometer,
      normal: { min: 36.1, max: 37.2 },
      color: 'from-orange-500 to-yellow-500'
    }
  ] : [];

  const hasAbnormalVitals = currentVitals && (
    currentVitals.heart_rate > 100 || currentVitals.heart_rate < 60 ||
    currentVitals.blood_pressure_systolic > 140 || currentVitals.blood_pressure_systolic < 90 ||
    currentVitals.spo2 < 95 || currentVitals.temperature > 38 || currentVitals.temperature < 36
  );

  return (
    <div className="space-y-8">
      {/* Connection Status */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between p-4 rounded-xl border ${
          isConnected
            ? isDark
              ? 'bg-green-900/20 border-green-500/30 text-green-400'
              : 'bg-green-50 border-green-200 text-green-700'
            : isDark
              ? 'bg-red-900/20 border-red-500/30 text-red-400'
              : 'bg-red-50 border-red-200 text-red-700'
        }`}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="font-medium">
            {isConnected ? 'Connected to Health Monitor' : 'Connection Lost'}
          </span>
        </div>
        {isConnected && (
          <span className="text-sm opacity-70">
            Last updated: {currentVitals ? new Date(currentVitals.timestamp).toLocaleTimeString() : 'N/A'}
          </span>
        )}
      </motion.div>

      {/* Alert Banner */}
      {hasAbnormalVitals && <AlertBanner isDark={isDark} />}

      {/* Vital Signs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {vitalCards.map((vital, index) => (
          <motion.div
            key={vital.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <VitalCard {...vital} isDark={isDark} />
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <VitalsChart
            title="Heart Rate & SpO₂"
            data={vitalsHistory}
            metrics={['heart_rate', 'spo2']}
            colors={['#ef4444', '#10b981']}
            isDark={isDark}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <VitalsChart
            title="Blood Pressure"
            data={vitalsHistory}
            metrics={['blood_pressure_systolic', 'blood_pressure_diastolic']}
            colors={['#3b82f6', '#06b6d4']}
            isDark={isDark}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;