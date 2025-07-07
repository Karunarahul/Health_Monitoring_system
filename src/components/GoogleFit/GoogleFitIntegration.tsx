import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, 
  Watch, 
  Heart, 
  Activity, 
  Wifi, 
  Bluetooth, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Settings,
  Shield,
  Link,
  Unlink,
  Download,
  Clock,
  TrendingUp,
  Battery
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface GoogleFitIntegrationProps {
  isDark: boolean;
}

interface ConnectedDevice {
  id: string;
  name: string;
  type: 'smartwatch' | 'fitness_tracker' | 'phone' | 'scale' | 'blood_pressure' | 'pulse_oximeter';
  manufacturer: string;
  model: string;
  lastSync: string;
  batteryLevel?: number;
  isActive: boolean;
  dataTypes: string[];
}

interface HealthData {
  type: 'heart_rate' | 'steps' | 'calories' | 'sleep' | 'weight' | 'blood_pressure' | 'spo2';
  value: number;
  unit: string;
  timestamp: string;
  source: string;
}

const GoogleFitIntegration: React.FC<GoogleFitIntegrationProps> = ({ isDark }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [recentData, setRecentData] = useState<HealthData[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkGoogleFitConnection();
      loadConnectedDevices();
    }
  }, [user]);

  const checkGoogleFitConnection = async () => {
    // Check if user has Google Fit connected
    const stored = localStorage.getItem('googlefit_connected');
    if (stored) {
      setIsConnected(true);
      setPermissions(['heart_rate', 'steps', 'calories', 'sleep', 'weight']);
      setLastSyncTime(localStorage.getItem('googlefit_last_sync'));
    }
  };

  const loadConnectedDevices = async () => {
    // Mock data - in real implementation, this would fetch from Google Fit API
    const mockDevices: ConnectedDevice[] = [
      {
        id: '1',
        name: 'Galaxy Watch 6',
        type: 'smartwatch',
        manufacturer: 'Samsung',
        model: 'SM-R950F',
        lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        batteryLevel: 78,
        isActive: true,
        dataTypes: ['heart_rate', 'steps', 'calories', 'sleep']
      },
      {
        id: '2',
        name: 'Pixel 8 Pro',
        type: 'phone',
        manufacturer: 'Google',
        model: 'Pixel 8 Pro',
        lastSync: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        batteryLevel: 92,
        isActive: true,
        dataTypes: ['steps', 'calories']
      },
      {
        id: '3',
        name: 'Fitbit Charge 5',
        type: 'fitness_tracker',
        manufacturer: 'Fitbit',
        model: 'FB421',
        lastSync: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        batteryLevel: 45,
        isActive: true,
        dataTypes: ['heart_rate', 'steps', 'calories', 'sleep', 'spo2']
      }
    ];

    if (isConnected) {
      setConnectedDevices(mockDevices);
      generateMockHealthData(mockDevices);
    }
  };

  const generateMockHealthData = (devices: ConnectedDevice[]) => {
    const mockData: HealthData[] = [
      {
        type: 'heart_rate',
        value: 72,
        unit: 'bpm',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        source: 'Galaxy Watch 6'
      },
      {
        type: 'steps',
        value: 8547,
        unit: 'steps',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        source: 'Pixel 8 Pro'
      },
      {
        type: 'calories',
        value: 2156,
        unit: 'kcal',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        source: 'Fitbit Charge 5'
      },
      {
        type: 'spo2',
        value: 98,
        unit: '%',
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        source: 'Fitbit Charge 5'
      }
    ];

    setRecentData(mockData);
  };

  const connectGoogleFit = async () => {
    setIsConnecting(true);
    
    try {
      // Simulate Google OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would use Google Fit API
      // const auth = await gapi.auth2.getAuthInstance().signIn({
      //   scope: 'https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.activity.read'
      // });
      
      setIsConnected(true);
      setPermissions(['heart_rate', 'steps', 'calories', 'sleep', 'weight']);
      localStorage.setItem('googlefit_connected', 'true');
      localStorage.setItem('googlefit_last_sync', new Date().toISOString());
      setLastSyncTime(new Date().toISOString());
      
      await loadConnectedDevices();
    } catch (error) {
      console.error('Failed to connect to Google Fit:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectGoogleFit = async () => {
    setIsConnected(false);
    setConnectedDevices([]);
    setRecentData([]);
    setPermissions([]);
    setLastSyncTime(null);
    localStorage.removeItem('googlefit_connected');
    localStorage.removeItem('googlefit_last_sync');
  };

  const syncData = async () => {
    setSyncStatus('syncing');
    
    try {
      // Simulate data sync
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // In real implementation, fetch latest data from Google Fit
      await loadConnectedDevices();
      
      setSyncStatus('success');
      setLastSyncTime(new Date().toISOString());
      localStorage.setItem('googlefit_last_sync', new Date().toISOString());
      
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'smartwatch': return Watch;
      case 'fitness_tracker': return Activity;
      case 'phone': return Smartphone;
      case 'scale': return TrendingUp;
      case 'blood_pressure': return Heart;
      case 'pulse_oximeter': return Activity;
      default: return Activity;
    }
  };

  const getDataTypeIcon = (type: string) => {
    switch (type) {
      case 'heart_rate': return Heart;
      case 'steps': return Activity;
      case 'calories': return TrendingUp;
      case 'sleep': return Clock;
      case 'weight': return TrendingUp;
      case 'spo2': return Activity;
      default: return Activity;
    }
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return 'text-gray-400';
    if (level > 60) return 'text-green-500';
    if (level > 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (!user) {
    return (
      <div className={`text-center py-12 rounded-2xl border ${
        isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
      }`}>
        <Smartphone className={`w-16 h-16 mx-auto mb-4 opacity-50 ${
          isDark ? 'text-slate-600' : 'text-slate-400'
        }`} />
        <h3 className={`text-xl font-semibold mb-2 ${
          isDark ? 'text-slate-300' : 'text-slate-700'
        }`}>
          Login Required
        </h3>
        <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
          Please log in to connect your Google Fit and health devices
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Google Fit Integration
          </h2>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Connect your devices and sync health data automatically
          </p>
        </div>
        
        {isConnected && (
          <div className="flex space-x-2">
            <motion.button
              onClick={syncData}
              disabled={syncStatus === 'syncing'}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
              } disabled:opacity-50`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>Sync Now</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* Connection Status */}
      <div className={`p-6 rounded-2xl border ${
        isConnected
          ? isDark ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200'
          : isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${
              isConnected ? 'bg-green-500' : 'bg-gray-500'
            }`}>
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Google Fit Connection
              </h3>
              <p className={`text-sm ${
                isConnected
                  ? isDark ? 'text-green-400' : 'text-green-600'
                  : isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {isConnected ? 'Connected and syncing' : 'Not connected'}
              </p>
              {lastSyncTime && (
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  Last sync: {formatTimeAgo(lastSyncTime)}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {syncStatus === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {syncStatus === 'error' && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            
            {isConnected ? (
              <motion.button
                onClick={disconnectGoogleFit}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-red-700 hover:bg-red-600 text-white'
                    : 'bg-red-100 hover:bg-red-200 text-red-700'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Unlink className="w-4 h-4" />
                <span>Disconnect</span>
              </motion.button>
            ) : (
              <motion.button
                onClick={connectGoogleFit}
                disabled={isConnecting}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-green-600 transition-all duration-200 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isConnecting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Link className="w-4 h-4" />
                )}
                <span>{isConnecting ? 'Connecting...' : 'Connect Google Fit'}</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Permissions */}
      {isConnected && permissions.length > 0 && (
        <div className={`p-6 rounded-2xl border ${
          isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            <Shield className="w-5 h-5" />
            <span>Data Permissions</span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {permissions.map((permission) => (
              <div
                key={permission}
                className={`flex items-center space-x-2 p-3 rounded-lg ${
                  isDark ? 'bg-slate-700/50' : 'bg-indigo-50'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className={`text-sm capitalize ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {permission.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connected Devices */}
      {isConnected && connectedDevices.length > 0 && (
        <div className={`p-6 rounded-2xl border ${
          isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Connected Devices ({connectedDevices.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedDevices.map((device) => {
              const DeviceIcon = getDeviceIcon(device.type);
              return (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border ${
                    device.isActive
                      ? isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'
                      : isDark ? 'bg-slate-800/50 border-slate-700 opacity-60' : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        device.isActive ? 'bg-green-500' : 'bg-gray-500'
                      }`}>
                        <DeviceIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className={`font-medium ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {device.name}
                        </h4>
                        <p className={`text-xs ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          {device.manufacturer} {device.model}
                        </p>
                      </div>
                    </div>
                    
                    {device.batteryLevel && (
                      <div className="flex items-center space-x-1">
                        <Battery className={`w-4 h-4 ${getBatteryColor(device.batteryLevel)}`} />
                        <span className={`text-xs ${getBatteryColor(device.batteryLevel)}`}>
                          {device.batteryLevel}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {device.dataTypes.map((type) => (
                        <span
                          key={type}
                          className={`px-2 py-1 rounded-full text-xs ${
                            isDark
                              ? 'bg-blue-900/30 text-blue-300'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {type.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                    
                    <p className={`text-xs ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      Last sync: {formatTimeAgo(device.lastSync)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Data */}
      {isConnected && recentData.length > 0 && (
        <div className={`p-6 rounded-2xl border ${
          isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Recent Health Data
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentData.map((data, index) => {
              const DataIcon = getDataTypeIcon(data.type);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <DataIcon className={`w-5 h-5 ${
                      isDark ? 'text-indigo-400' : 'text-indigo-600'
                    }`} />
                    <h4 className={`font-medium capitalize ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {data.type.replace('_', ' ')}
                    </h4>
                  </div>
                  
                  <div className="space-y-1">
                    <div className={`text-2xl font-bold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {data.value.toLocaleString()}
                      <span className={`text-sm font-normal ml-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {data.unit}
                      </span>
                    </div>
                    
                    <p className={`text-xs ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      From {data.source}
                    </p>
                    
                    <p className={`text-xs ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      {formatTimeAgo(data.timestamp)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Setup Guide */}
      {!isConnected && (
        <div className={`p-6 rounded-2xl border ${
          isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Setup Guide
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className={`font-medium mb-3 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                For Users:
              </h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">1</div>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Purchase compatible devices
                    </p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Smart watches, fitness trackers, or health monitors
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">2</div>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Install manufacturer apps
                    </p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Samsung Health, Fitbit, Garmin Connect, etc.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">3</div>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Enable data sharing permissions
                    </p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Allow apps to sync with Google Fit
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">4</div>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Connect via Bluetooth or WiFi
                    </p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Ensure devices are paired and syncing
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className={`font-medium mb-3 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Supported Devices:
              </h4>
              <div className="space-y-2">
                {[
                  { name: 'Samsung Galaxy Watch', icon: Watch },
                  { name: 'Apple Watch', icon: Watch },
                  { name: 'Fitbit Devices', icon: Activity },
                  { name: 'Garmin Watches', icon: Watch },
                  { name: 'Wear OS Devices', icon: Watch },
                  { name: 'Android/iOS Phones', icon: Smartphone }
                ].map((device, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-2 rounded-lg ${
                      isDark ? 'bg-slate-700/50' : 'bg-slate-50'
                    }`}
                  >
                    <device.icon className={`w-4 h-4 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`} />
                    <span className={`text-sm ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {device.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleFitIntegration;