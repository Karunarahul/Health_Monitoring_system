import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import Dashboard from './components/Dashboard';
import EnhancedManualEntry from './components/Enhanced/EnhancedManualEntry';
import PredictionHistory from './components/PredictionHistory';
import SensorGuide from './components/SensorGuide';
import AlertsPanel from './components/Enhanced/AlertsPanel';
import ThemeToggle from './components/ThemeToggle';
import AuthModal from './components/Auth/AuthModal';
import ProfileModal from './components/Profile/ProfileModal';
import EnhancedChatBot from './components/Chat/EnhancedChatBot';
import { Activity, Brain, History, Zap, User, LogOut, AlertTriangle, Shield } from 'lucide-react';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isDark, setIsDark] = useState(false); // Changed to light mode by default
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Show auth modal when app loads and user is not logged in
  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
    } else if (!loading && user) {
      // User is logged in, ensure modal is closed
      setShowAuthModal(false);
    }
  }, [loading, user]);

  const navigationItems = [
    { id: 'dashboard', label: 'Live Dashboard', icon: Activity },
    { id: 'manual', label: 'Health Check', icon: Brain },
    { id: 'history', label: 'History', icon: History },
    { id: 'sensors', label: 'Connect Sensors', icon: Zap },
    { id: 'alerts', label: 'Smart Alerts', icon: AlertTriangle },
  ];

  const handleSignOut = async () => {
    await signOut();
    setActiveView('dashboard');
    setShowAuthModal(true); // Show login modal after sign out
  };

  const handleAuthSuccess = () => {
    // Called when authentication is successful
    setShowAuthModal(false);
    setActiveView('dashboard'); // Redirect to dashboard
  };

  const handleAuthClose = () => {
    // Only allow closing auth modal if user is logged in
    if (user) {
      setShowAuthModal(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full opacity-10"
          style={{
            background: isDark 
              ? 'radial-gradient(circle, #8b5cf6, transparent 50%)'
              : 'radial-gradient(circle, #6366f1, transparent 50%)'
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full opacity-10"
          style={{
            background: isDark 
              ? 'radial-gradient(circle, #06b6d4, transparent 50%)'
              : 'radial-gradient(circle, #8b5cf6, transparent 50%)'
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 0]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`relative z-10 border-b backdrop-blur-lg ${
          isDark 
            ? 'bg-slate-900/50 border-slate-700' 
            : 'bg-white/70 border-indigo-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div 
                className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Activity className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className={`text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent`}>
                  HealthAI Monitor
                </h1>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  AI-Powered Health Insights with Smart Alerts & Timeline
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle isDark={isDark} setIsDark={setIsDark} />
              
              {user ? (
                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={() => setShowProfileModal(true)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                      isDark
                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                        : 'bg-white hover:bg-indigo-50 text-slate-900 shadow-sm border border-indigo-200'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">Profile</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={handleSignOut}
                    className={`p-2 rounded-xl transition-colors ${
                      isDark
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-400'
                        : 'bg-white hover:bg-red-50 text-slate-600 shadow-sm border border-red-200'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <LogOut className="w-4 h-4" />
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign In
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Navigation - Only show if user is logged in */}
      {user && (
        <motion.nav 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`relative z-10 border-b backdrop-blur-lg ${
            isDark 
              ? 'bg-slate-800/50 border-slate-700' 
              : 'bg-white/50 border-indigo-200'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-all duration-200 relative ${
                      activeView === item.id
                        ? isDark
                          ? 'text-purple-300'
                          : 'text-indigo-600'
                        : isDark
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {activeView === item.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.nav>
      )}

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {user ? (
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeView === 'dashboard' && <Dashboard isDark={isDark} />}
            {activeView === 'manual' && <EnhancedManualEntry isDark={isDark} />}
            {activeView === 'history' && <PredictionHistory isDark={isDark} />}
            {activeView === 'sensors' && <SensorGuide isDark={isDark} />}
            {activeView === 'alerts' && <AlertsPanel isDark={isDark} />}
          </motion.div>
        ) : (
          // Welcome screen when not logged in
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="p-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Activity className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Welcome to HealthAI Monitor
              </h1>
              <p className={`text-xl mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Your AI-powered health companion for real-time monitoring and personalized insights
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
            >
              <div className={`p-6 rounded-2xl border ${
                isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-indigo-200'
              }`}>
                <Brain className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  AI Health Analysis
                </h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Advanced ensemble AI models analyze your vital signs and provide personalized health insights
                </p>
              </div>

              <div className={`p-6 rounded-2xl border ${
                isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-indigo-200'
              }`}>
                <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Smart Alerts
                </h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Intelligent alert system with emergency notifications and response monitoring
                </p>
              </div>

              <div className={`p-6 rounded-2xl border ${
                isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-indigo-200'
              }`}>
                <Activity className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Wellness Plans
                </h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Personalized meal plans and lifestyle recommendations based on your health data
                </p>
              </div>
            </motion.div>

            <motion.button
              onClick={() => setShowAuthModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-lg text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              Get Started - Sign In or Create Account
            </motion.button>
          </motion.div>
        )}
      </main>

      {/* Modals and Components */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={handleAuthClose}
        isDark={isDark} 
      />
      
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
        isDark={isDark} 
      />
      
      {user && <EnhancedChatBot isDark={isDark} />}
    </div>
  );
}

export default App;