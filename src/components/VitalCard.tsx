import React from 'react';
import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface VitalCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: LucideIcon;
  normal: any;
  color: string;
  isDark: boolean;
}

const VitalCard: React.FC<VitalCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  normal,
  color,
  isDark
}) => {
  const isNormal = () => {
    if (typeof value === 'string') return true;
    
    if (title === 'Blood Pressure') return true; // Handle separately
    
    const numValue = Number(value);
    return numValue >= normal.min && numValue <= normal.max;
  };

  const getStatus = () => {
    if (typeof value === 'string') {
      const [sys, dia] = value.split('/').map(Number);
      if (sys > 140 || dia > 90) return 'high';
      if (sys < 90) return 'low';
      return 'normal';
    }
    
    const numValue = Number(value);
    if (numValue > normal.max) return 'high';
    if (numValue < normal.min) return 'low';
    return 'normal';
  };

  const status = getStatus();

  // Convert temperature display if it's temperature
  const getDisplayValue = () => {
    if (title === 'Temperature' && typeof value === 'number') {
      // Convert Celsius to Fahrenheit for display
      const celsius = value;
      const fahrenheit = (celsius * 9/5) + 32;
      return `${fahrenheit.toFixed(1)}°F`;
    }
    return value;
  };

  const getDisplayUnit = () => {
    if (title === 'Temperature') {
      return ''; // Unit is included in the value display
    }
    return unit;
  };

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl p-6 border backdrop-blur-lg ${
        isDark
          ? 'bg-slate-800/50 border-slate-700'
          : 'bg-white/70 border-slate-200'
      }`}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Background Gradient */}
      <div 
        className={`absolute inset-0 opacity-10 bg-gradient-to-br ${color}`}
      />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === 'normal'
              ? isDark
                ? 'bg-green-900/30 text-green-400'
                : 'bg-green-100 text-green-700'
              : status === 'high'
                ? isDark
                  ? 'bg-red-900/30 text-red-400'
                  : 'bg-red-100 text-red-700'
                : isDark
                  ? 'bg-yellow-900/30 text-yellow-400'
                  : 'bg-yellow-100 text-yellow-700'
          }`}>
            {status === 'normal' ? 'Normal' : status === 'high' ? 'High' : 'Low'}
          </div>
        </div>
        
        <div className="space-y-1">
          <h3 className={`text-sm font-medium ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {title}
          </h3>
          <div className="flex items-baseline space-x-1">
            <motion.span
              key={value}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-2xl font-bold ${
                isDark ? 'text-white' : 'text-slate-900'
              } ${title === 'Temperature' ? 'text-lg' : ''}`}
            >
              {getDisplayValue()}
            </motion.span>
            {getDisplayUnit() && (
              <span className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {getDisplayUnit()}
              </span>
            )}
          </div>
          
          {/* Show Celsius equivalent for temperature */}
          {title === 'Temperature' && typeof value === 'number' && (
            <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              ({value.toFixed(1)}°C)
            </div>
          )}
        </div>

        {/* Pulse Animation for Heart Rate */}
        {title === 'Heart Rate' && (
          <motion.div
            className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1]
            }}
            transition={{
              duration: 60 / Number(value),
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>
    </motion.div>
  );
};

export default VitalCard;