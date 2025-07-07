import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Bluetooth, 
  Wifi, 
  Smartphone, 
  Watch, 
  Activity, 
  Heart, 
  Settings,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Battery,
  Signal,
  Clock
} from 'lucide-react';

interface DeviceGatewayProps {
  isDark: boolean;
}

interface Device {
  id: string;
  name: string;
  type: 'smartwatch' | 'fitness_tracker' | 'phone' | 'scale' | 'blood_pressure' | 'pulse_oximeter';
  manufacturer: string;
  model: string;
  connectionType: 'bluetooth' | 'wifi' | 'usb';
  status: 'connected' | 'disconnected' | 'pairing' | 'error';
  batteryLevel?: number;
  signalStrength?: number;
  lastSeen: string;
  dataTypes: string[];
  isSupported: boolean;
}

const DeviceGateway: React.FC<DeviceGatewayProps> = ({ isDark }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = () => {
    // Mock devices for demonstration
    const mockDevices: Device[] = [
      {
        id: '1',
        name: 'Galaxy Watch 6',
        type: 'smartwatch',
        manufacturer: 'Samsung',
        model: 'SM-R950F',
        connectionType: 'bluetooth',
        status: 'connected',
        batteryLevel: 78,
        signalStrength: 85,
        lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        dataTypes: ['heart_rate', 'steps', 'calories', 'sleep', 'stress'],
        isSupported: true
      },
      {
        id: '2',
        name: 'Fitbit Charge 5',
        type: 'fitness_tracker',
        manufacturer: 'Fitbit',
        model: 'FB421',
        connectionType: 'bluetooth',
        status: 'connected',
        batteryLevel: 45,
        signalStrength: 92,
        lastSeen: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        dataTypes: ['heart_rate', 'steps', 'calories', 'sleep', 'spo2'],
        isSupported: true
      },
      {
        id: '3',
        name: 'Apple Watch Series 9',
        type: 'smartwatch',
        manufacturer: 'Apple',
        model: 'A2986',
        connectionType: 'bluetooth',
        status: 'disconnected',
        batteryLevel: 23,
        signalStrength: 0,
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        dataTypes: ['heart_rate', 'steps', 'calories', 'sleep', 'ecg'],
        isSupported: true
      },
      {
        id: '4',
        name: 'Pixel 8 Pro',
        type: 'phone',
        manufacturer: 'Google',
        model: 'Pixel 8 Pro',
        connectionType: 'wifi',
        status: 'connected',
        batteryLevel: 92,
        signalStrength: 78,
        lastSeen: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        dataTypes: ['steps', 'calories', 'location'],
        isSupported: true
      },
      {
        id: '5',
        name: 'Omron BP Monitor',
        type: 'blood_pressure',
        manufacturer: 'Omron',
        model: 'HEM-7156T',
        connectionType: 'bluetooth',
        status: 'pairing',
        signalStrength: 65,
        lastSeen: new Date().toISOString(),
        dataTypes: ['blood_pressure', 'heart_rate'],
        isSupported: true
      },
      {
        id: '6',
        name: 'Unknown Device',
        type: 'fitness_tracker',
        manufacturer: 'Unknown',
        model: 'BT-DEVICE-001',
        connectionType: 'bluetooth',
        status: 'disconnected',
        signalStrength: 45,
        lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        dataTypes: [],
        isSupported: false
      }
    ];

    setDevices(mockDevices);
  };

  const scanForDevices = async () => {
    setIsScanning(true);
    
    // Simulate device scanning
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Add a new discovered device
    const newDevice: Device = {
      id: Date.now().toString(),
      name: 'Garmin Venu 3',
      type: 'smartwatch',
      manufacturer: 'Garmin',
      model: 'Venu 3',
      connectionType: 'bluetooth',
      status: 'disconnected',
      batteryLevel: 67,
      signalStrength: 72,
      lastSeen: new Date().toISOString(),
      dataTypes: ['heart_rate', 'steps', 'calories', 'sleep', 'gps'],
      isSupported: true
    };

    setDevices(prev => [newDevice, ...prev]);
    setIsScanning(false);
  };

  const connectDevice = async (deviceId: string) => {
    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, status: 'pairing' }
        : device
    ));

    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 2000));

    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, status: 'connected', lastSeen: new Date().toISOString() }
        : device
    ));
  };

  const disconnectDevice = async (deviceId: string) => {
    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, status: 'disconnected', signalStrength: 0 }
        : device
    ));
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'smartwatch': return Watch;
      case 'fitness_tracker': return Activity;
      case 'phone': return Smartphone;
      case 'blood_pressure': return Heart;
      case 'pulse_oximeter': return Activity;
      default: return Activity;
    }
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'bluetooth': return Bluetooth;
      case 'wifi': return Wifi;
      case 'usb': return Settings;
      default: return Bluetooth;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'disconnected': return 'text-gray-500';
      case 'pairing': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'connected': return isDark ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200';
      case 'disconnected': return isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200';
      case 'pairing': return isDark ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200';
      case 'error': return isDark ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200';
      default: return isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200';
    }
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return 'text-gray-400';
    if (level > 60) return 'text-green-500';
    if (level > 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSignalBars = (strength?: number) => {
    if (!strength) return 0;
    if (strength > 80) return 4;
    if (strength > 60) return 3;
    if (strength > 40) return 2;
    return 1;
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || device.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Device Gateway
          </h2>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Manage and connect your health monitoring devices
          </p>
        </div>
        
        <motion.button
          onClick={scanForDevices}
          disabled={isScanning}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isScanning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>{isScanning ? 'Scanning...' : 'Scan Devices'}</span>
        </motion.button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`} />
            <input
              type="text"
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 ${
                isDark
                  ? 'bg-slate-700/50 border-slate-600 text-white focus:border-purple-500'
                  : 'bg-white/50 border-slate-300 text-slate-900 focus:border-purple-500'
              } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
            />
          </div>
        </div>
        
        <div className="relative">
          <Filter className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`pl-10 pr-8 py-3 rounded-xl border transition-all duration-200 ${
              isDark
                ? 'bg-slate-700/50 border-slate-600 text-white focus:border-purple-500'
                : 'bg-white/50 border-slate-300 text-slate-900 focus:border-purple-500'
            } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
          >
            <option value="all">All Devices</option>
            <option value="smartwatch">Smart Watches</option>
            <option value="fitness_tracker">Fitness Trackers</option>
            <option value="phone">Phones</option>
            <option value="blood_pressure">Blood Pressure</option>
            <option value="pulse_oximeter">Pulse Oximeters</option>
          </select>
        </div>
      </div>

      {/* Device List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredDevices.map((device) => {
            const DeviceIcon = getDeviceIcon(device.type);
            const ConnectionIcon = getConnectionIcon(device.connectionType);
            
            return (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 rounded-xl border ${getStatusBg(device.status)} ${
                  !device.isSupported ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      device.status === 'connected' ? 'bg-green-500' :
                      device.status === 'pairing' ? 'bg-yellow-500' :
                      device.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
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
                  
                  <div className="flex items-center space-x-2">
                    <ConnectionIcon className={`w-4 h-4 ${getStatusColor(device.status)}`} />
                    {device.signalStrength !== undefined && device.status === 'connected' && (
                      <div className="flex items-center space-x-1">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 h-3 rounded-full ${
                              i < getSignalBars(device.signalStrength) 
                                ? 'bg-green-500' 
                                : isDark ? 'bg-slate-600' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium capitalize ${getStatusColor(device.status)}`}>
                      {device.status}
                      {device.status === 'pairing' && (
                        <RefreshCw className="w-3 h-3 inline ml-1 animate-spin" />
                      )}
                    </span>
                    
                    {device.batteryLevel && (
                      <div className="flex items-center space-x-1">
                        <Battery className={`w-4 h-4 ${getBatteryColor(device.batteryLevel)}`} />
                        <span className={`text-xs ${getBatteryColor(device.batteryLevel)}`}>
                          {device.batteryLevel}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {device.dataTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {device.dataTypes.slice(0, 3).map((type) => (
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
                      {device.dataTypes.length > 3 && (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          +{device.dataTypes.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className={`text-xs ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {formatTimeAgo(device.lastSeen)}
                    </p>
                    
                    {device.isSupported ? (
                      device.status === 'connected' ? (
                        <motion.button
                          onClick={() => disconnectDevice(device.id)}
                          className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                            isDark
                              ? 'bg-red-700 hover:bg-red-600 text-white'
                              : 'bg-red-100 hover:bg-red-200 text-red-700'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Disconnect
                        </motion.button>
                      ) : device.status === 'pairing' ? (
                        <div className={`px-3 py-1 rounded-lg text-xs ${
                          isDark ? 'bg-yellow-700 text-yellow-200' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          Pairing...
                        </div>
                      ) : (
                        <motion.button
                          onClick={() => connectDevice(device.id)}
                          className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                            isDark
                              ? 'bg-green-700 hover:bg-green-600 text-white'
                              : 'bg-green-100 hover:bg-green-200 text-green-700'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Connect
                        </motion.button>
                      )
                    ) : (
                      <span className={`px-3 py-1 rounded-lg text-xs ${
                        isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                      }`}>
                        Unsupported
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredDevices.length === 0 && (
        <div className={`text-center py-12 rounded-2xl border ${
          isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
        }`}>
          <Search className={`w-16 h-16 mx-auto mb-4 opacity-50 ${
            isDark ? 'text-slate-600' : 'text-slate-400'
          }`} />
          <h3 className={`text-xl font-semibold mb-2 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            No Devices Found
          </h3>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Click "Scan Devices" to discover nearby health devices'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default DeviceGateway;