import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../utils/apiClient';
import { 
  Bluetooth, 
  Usb, 
  Wifi, 
  Smartphone, 
  Heart, 
  Thermometer, 
  Activity,
  Droplets,
  Info,
  ExternalLink,
  Zap,
  Settings,
  Plus
} from 'lucide-react';
import GoogleFitIntegration from './GoogleFit/GoogleFitIntegration';
import DeviceGateway from './GoogleFit/DeviceGateway';

interface SensorInfo {
  name: string;
  measures: string[];
  protocols: string[];
  examples: string[];
}

interface SensorGuideProps {
  isDark: boolean;
}

const SensorGuide: React.FC<SensorGuideProps> = ({ isDark }) => {
  const [sensorInfo, setSensorInfo] = useState<{
    supported_sensors: SensorInfo[];
    integration_methods: string[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'googlefit' | 'gateway'>('overview');

  useEffect(() => {
    const fetchSensorInfo = async () => {
      try {
        const data = await apiClient.getSensorInfo();
        setSensorInfo(data);
      } catch (error) {
        console.error('Failed to fetch sensor info:', error);
      }
    };

    fetchSensorInfo();
  }, []);

  const getProtocolIcon = (protocol: string) => {
    switch (protocol.toLowerCase()) {
      case 'bluetooth': return Bluetooth;
      case 'usb': return Usb;
      case 'wifi': return Wifi;
      case 'api': return Smartphone;
      default: return Zap;
    }
  };

  const getMeasureIcon = (measure: string) => {
    if (measure.includes('heart')) return Heart;
    if (measure.includes('temperature')) return Thermometer;
    if (measure.includes('pressure')) return Droplets;
    if (measure.includes('spo2')) return Activity;
    return Activity;
  };

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'googlefit', label: 'Google Fit', icon: Smartphone },
    { id: 'gateway', label: 'Device Gateway', icon: Settings },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent`}>
            Device Integration Hub
          </h1>
        </div>
        <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Connect real medical devices and sync health data automatically
        </p>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="flex justify-center space-x-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : isDark
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Quick Start */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-2xl border ${
                isDark
                  ? 'bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30'
                  : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
              }`}
            >
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                🚀 Quick Start Options
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-white/70'}`}>
                  <Smartphone className={`w-8 h-8 mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Google Fit Integration
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Connect your Google Fit account to sync data from all your connected devices automatically
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-white/70'}`}>
                  <Activity className={`w-8 h-8 mb-2 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Device Gateway
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Directly connect and manage individual health monitoring devices
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-white/70'}`}>
                  <Heart className={`w-8 h-8 mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Real-time Monitoring
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Get live health data streaming directly to your dashboard
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Supported Sensors */}
            {sensorInfo && (
              <div className="space-y-6">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Supported Medical Sensors
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sensorInfo.supported_sensors.map((sensor, index) => (
                    <motion.div
                      key={sensor.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-6 rounded-2xl border backdrop-blur-lg ${
                        isDark
                          ? 'bg-slate-800/50 border-slate-700'
                          : 'bg-white/70 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500">
                          {React.createElement(getMeasureIcon(sensor.measures[0]), {
                            className: "w-6 h-6 text-white"
                          })}
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold mb-2 ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                            {sensor.name}
                          </h3>
                          
                          {/* What it measures */}
                          <div className="mb-3">
                            <h4 className={`text-sm font-medium mb-1 ${
                              isDark ? 'text-slate-300' : 'text-slate-700'
                            }`}>
                              Measures:
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {sensor.measures.map((measure, idx) => (
                                <span
                                  key={idx}
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    isDark
                                      ? 'bg-blue-900/30 text-blue-300'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {measure.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Connection methods */}
                          <div className="mb-3">
                            <h4 className={`text-sm font-medium mb-1 ${
                              isDark ? 'text-slate-300' : 'text-slate-700'
                            }`}>
                              Connection:
                            </h4>
                            <div className="flex space-x-2">
                              {sensor.protocols.map((protocol, idx) => {
                                const Icon = getProtocolIcon(protocol);
                                return (
                                  <div
                                    key={idx}
                                    className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs ${
                                      isDark
                                        ? 'bg-slate-700/50 text-slate-300'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    <Icon className="w-3 h-3" />
                                    <span>{protocol}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Examples */}
                          <div>
                            <h4 className={`text-sm font-medium mb-1 ${
                              isDark ? 'text-slate-300' : 'text-slate-700'
                            }`}>
                              Popular Models:
                            </h4>
                            <div className="text-xs space-y-1">
                              {sensor.examples.map((example, idx) => (
                                <div
                                  key={idx}
                                  className={`flex items-center space-x-2 ${
                                    isDark ? 'text-slate-400' : 'text-slate-600'
                                  }`}
                                >
                                  <div className="w-1 h-1 bg-current rounded-full" />
                                  <span>{example}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Integration Methods */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-2xl border backdrop-blur-lg ${
                isDark
                  ? 'bg-slate-800/50 border-slate-700'
                  : 'bg-white/70 border-slate-200'
              }`}
            >
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                How to Connect Your Devices
              </h2>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                  <h3 className={`font-semibold mb-2 flex items-center space-x-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    <Smartphone className="w-5 h-5 text-green-500" />
                    <span>Google Fit Integration (Recommended)</span>
                  </h3>
                  <p className={`text-sm mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    The easiest way to connect multiple devices through Google's health platform:
                  </p>
                  <ol className={`text-sm space-y-1 ml-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <li>1. Install Google Fit app on your phone</li>
                    <li>2. Connect your devices to Google Fit</li>
                    <li>3. Use our Google Fit integration tab to sync data</li>
                    <li>4. Enjoy automatic data synchronization</li>
                  </ol>
                </div>

                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                  <h3 className={`font-semibold mb-2 flex items-center space-x-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    <Bluetooth className="w-5 h-5 text-blue-500" />
                    <span>Direct Device Connection</span>
                  </h3>
                  <p className={`text-sm mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Connect devices directly using our Device Gateway:
                  </p>
                  <ol className={`text-sm space-y-1 ml-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <li>1. Enable Bluetooth on your device</li>
                    <li>2. Put your medical device in pairing mode</li>
                    <li>3. Use Device Gateway tab to scan and connect</li>
                    <li>4. Stream data in real-time to the dashboard</li>
                  </ol>
                </div>
              </div>
            </motion.div>

            {/* Implementation Guide */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-2xl border backdrop-blur-lg ${
                isDark
                  ? 'bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-500/30'
                  : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
              }`}
            >
              <h2 className={`text-xl font-bold mb-4 flex items-center space-x-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <Info className="w-6 h-6" />
                <span>Getting Started</span>
              </h2>
              
              <div className="space-y-4">
                <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Choose your preferred integration method:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-white/70'}`}>
                    <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      🌟 For Most Users (Recommended)
                    </h3>
                    <ul className={`text-sm space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      <li>• Use Google Fit integration</li>
                      <li>• Connect all your devices to Google Fit first</li>
                      <li>• Enjoy automatic synchronization</li>
                      <li>• Works with most popular devices</li>
                    </ul>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-white/70'}`}>
                    <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      🔧 For Advanced Users
                    </h3>
                    <ul className={`text-sm space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      <li>• Use Device Gateway for direct connections</li>
                      <li>• Real-time data streaming</li>
                      <li>• More control over individual devices</li>
                      <li>• Requires technical setup</li>
                    </ul>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg border-l-4 border-blue-500 ${
                  isDark ? 'bg-blue-900/20' : 'bg-blue-50'
                }`}>
                  <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                    <strong>💡 Pro Tip:</strong> Start with Google Fit integration for the easiest setup. 
                    You can always add direct device connections later for specific devices that need real-time monitoring.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'googlefit' && (
          <motion.div
            key="googlefit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GoogleFitIntegration isDark={isDark} />
          </motion.div>
        )}

        {activeTab === 'gateway' && (
          <motion.div
            key="gateway"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <DeviceGateway isDark={isDark} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SensorGuide;