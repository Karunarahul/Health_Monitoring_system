import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface AlertBannerProps {
  isDark: boolean;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ isDark }) => {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`relative overflow-hidden rounded-xl p-4 border ${
        isDark
          ? 'bg-red-900/20 border-red-500/30'
          : 'bg-red-50 border-red-200'
      }`}
    >
      {/* Animated Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10"
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <AlertTriangle className={`w-6 h-6 ${
              isDark ? 'text-red-400' : 'text-red-600'
            }`} />
          </motion.div>
          <div>
            <h4 className={`font-semibold ${
              isDark ? 'text-red-400' : 'text-red-700'
            }`}>
              Abnormal Vitals Detected
            </h4>
            <p className={`text-sm ${
              isDark ? 'text-red-300' : 'text-red-600'
            }`}>
              One or more vital signs are outside normal ranges. Please monitor closely.
            </p>
          </div>
        </div>
        
        <motion.button
          onClick={() => setIsVisible(false)}
          className={`p-1 rounded-full hover:bg-red-500/20 transition-colors ${
            isDark ? 'text-red-400' : 'text-red-600'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default AlertBanner;