import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format } from 'date-fns';

interface VitalsData {
  heart_rate: number;
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  spo2: number;
  temperature: number;
  timestamp: string;
}

interface VitalsChartProps {
  title: string;
  data: VitalsData[];
  metrics: string[];
  colors: string[];
  isDark: boolean;
}

const VitalsChart: React.FC<VitalsChartProps> = ({
  title,
  data,
  metrics,
  colors,
  isDark
}) => {
  const chartData = data.map(item => ({
    ...item,
    time: format(new Date(item.timestamp), 'HH:mm:ss')
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg border shadow-lg ${
          isDark
            ? 'bg-slate-800 border-slate-600 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <p className="font-medium mb-2">{`Time: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}${
                entry.dataKey.includes('heart') ? ' bpm' :
                entry.dataKey.includes('pressure') ? ' mmHg' :
                entry.dataKey.includes('spo2') ? '%' :
                entry.dataKey.includes('temperature') ? '°C' : ''
              }`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getMetricName = (metric: string) => {
    const names: { [key: string]: string } = {
      heart_rate: 'Heart Rate',
      blood_pressure_systolic: 'Systolic BP',
      blood_pressure_diastolic: 'Diastolic BP',
      spo2: 'SpO₂',
      temperature: 'Temperature'
    };
    return names[metric] || metric;
  };

  return (
    <motion.div
      className={`p-6 rounded-2xl border backdrop-blur-lg ${
        isDark
          ? 'bg-slate-800/50 border-slate-700'
          : 'bg-white/70 border-slate-200'
      }`}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <h3 className={`text-lg font-semibold mb-4 ${
        isDark ? 'text-white' : 'text-slate-900'
      }`}>
        {title}
      </h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDark ? '#374151' : '#e5e7eb'}
            />
            <XAxis 
              dataKey="time"
              stroke={isDark ? '#9ca3af' : '#6b7280'}
              fontSize={12}
            />
            <YAxis 
              stroke={isDark ? '#9ca3af' : '#6b7280'}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {metrics.map((metric, index) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={colors[index]}
                strokeWidth={2}
                dot={{ fill: colors[index], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: colors[index], strokeWidth: 2 }}
                name={getMetricName(metric)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default VitalsChart;