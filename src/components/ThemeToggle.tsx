import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, setIsDark }) => {
  return (
    <motion.button
      onClick={() => setIsDark(!isDark)}
      className={`relative p-2 rounded-xl transition-all duration-300 ${
        isDark
          ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600'
          : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        key={isDark ? 'dark' : 'light'}
        initial={{ rotate: -180, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;