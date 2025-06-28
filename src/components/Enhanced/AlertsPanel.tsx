import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  X, 
  Bell, 
  Phone, 
  Mail,
  Users,
  Settings,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';

interface Alert {
  id: string;
  userId: string;
  alertLevel: 'CRITICAL' | 'HIGH' | 'MODERATE';
  vitals: any;
  prediction: any;
  timestamp: string;
  acknowledged: boolean;
  escalated: boolean;
}

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  email: string;
  phone: string;
  priority: number;
}

interface AlertSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  emergencyContactsEnabled: boolean;
  responseTimeoutSeconds: number;
  quietHours: { start: string; end: string };
}

interface AlertsPanelProps {
  isDark: boolean;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ isDark }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    emailEnabled: true,
    smsEnabled: true,
    emergencyContactsEnabled: true,
    responseTimeoutSeconds: 60,
    quietHours: { start: '22:00', end: '07:00' }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    relationship: '',
    email: '',
    phone: '',
    priority: 1
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAlerts();
      fetchEmergencyContacts();
      fetchAlertSettings();
    }
  }, [user]);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('/api/alerts', {
        headers: { Authorization: `Bearer ${user?.access_token}` }
      });
      // Ensure we always set an array
      setAlerts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      // Set empty array on error
      setAlerts([]);
    }
  };

  const fetchEmergencyContacts = async () => {
    try {
      const response = await axios.get('/api/emergency-contacts', {
        headers: { Authorization: `Bearer ${user?.access_token}` }
      });
      // Ensure we always set an array
      setEmergencyContacts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch emergency contacts:', error);
      // Set empty array on error
      setEmergencyContacts([]);
    }
  };

  const fetchAlertSettings = async () => {
    try {
      const response = await axios.get('/api/alert-settings', {
        headers: { Authorization: `Bearer ${user?.access_token}` }
      });
      setAlertSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch alert settings:', error);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await axios.post(`/api/alerts/${alertId}/acknowledge`, {}, {
        headers: { Authorization: `Bearer ${user?.access_token}` }
      });
      
      setAlerts(prev => Array.isArray(prev) ? prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ) : []);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const addEmergencyContact = async () => {
    try {
      await axios.post('/api/emergency-contacts', newContact, {
        headers: { Authorization: `Bearer ${user?.access_token}` }
      });
      
      setNewContact({ name: '', relationship: '', email: '', phone: '', priority: 1 });
      setShowAddContact(false);
      fetchEmergencyContacts();
    } catch (error) {
      console.error('Failed to add emergency contact:', error);
    }
  };

  const removeEmergencyContact = async (contactId: string) => {
    try {
      await axios.delete(`/api/emergency-contacts/${contactId}`, {
        headers: { Authorization: `Bearer ${user?.access_token}` }
      });
      fetchEmergencyContacts();
    } catch (error) {
      console.error('Failed to remove emergency contact:', error);
    }
  };

  const updateAlertSettings = async (settings: AlertSettings) => {
    try {
      await axios.put('/api/alert-settings', settings, {
        headers: { Authorization: `Bearer ${user?.access_token}` }
      });
      setAlertSettings(settings);
    } catch (error) {
      console.error('Failed to update alert settings:', error);
    }
  };

  const triggerTestAlert = async (severity: 'CRITICAL' | 'HIGH' | 'MODERATE') => {
    try {
      await axios.post('/api/test-alert', { severity }, {
        headers: { Authorization: `Bearer ${user?.access_token}` }
      });
      
      // Refresh alerts after test
      setTimeout(fetchAlerts, 1000);
    } catch (error) {
      console.error('Failed to trigger test alert:', error);
    }
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL': return AlertTriangle;
      case 'HIGH': return AlertTriangle;
      case 'MODERATE': return Bell;
      default: return Bell;
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return isDark ? 'text-red-400' : 'text-red-600';
      case 'HIGH': return isDark ? 'text-orange-400' : 'text-orange-600';
      case 'MODERATE': return isDark ? 'text-yellow-400' : 'text-yellow-600';
      default: return isDark ? 'text-slate-400' : 'text-slate-600';
    }
  };

  const getAlertBgColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return isDark ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200';
      case 'HIGH': return isDark ? 'bg-orange-900/20 border-orange-500/30' : 'bg-orange-50 border-orange-200';
      case 'MODERATE': return isDark ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200';
      default: return isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200';
    }
  };

  if (!user) {
    return (
      <div className={`text-center py-12 rounded-2xl border ${
        isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
      }`}>
        <Bell className={`w-16 h-16 mx-auto mb-4 opacity-50 ${
          isDark ? 'text-slate-600' : 'text-slate-400'
        }`} />
        <h3 className={`text-xl font-semibold mb-2 ${
          isDark ? 'text-slate-300' : 'text-slate-700'
        }`}>
          Login Required
        </h3>
        <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
          Please log in to access smart alerts and emergency features
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
            Smart Alerts & Emergency System
          </h2>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            AI-powered health monitoring with emergency response
          </p>
        </div>
        
        <div className="flex space-x-2">
          <motion.button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Test Alert Buttons */}
      <div className={`p-4 rounded-xl border ${
        isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Test Alert System
        </h3>
        <div className="flex space-x-3">
          <motion.button
            onClick={() => triggerTestAlert('MODERATE')}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Test Moderate
          </motion.button>
          <motion.button
            onClick={() => triggerTestAlert('HIGH')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Test High
          </motion.button>
          <motion.button
            onClick={() => triggerTestAlert('CRITICAL')}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Test Critical
          </motion.button>
        </div>
      </div>

      {/* Active Alerts */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Active Alerts
        </h3>
        
        {!Array.isArray(alerts) || alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className={`w-12 h-12 mx-auto mb-3 ${
              isDark ? 'text-green-400' : 'text-green-600'
            }`} />
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              No active alerts. Your health monitoring is running smoothly.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const Icon = getAlertIcon(alert.alertLevel);
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${getAlertBgColor(alert.alertLevel)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Icon className={`w-6 h-6 mt-1 ${getAlertColor(alert.alertLevel)}`} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className={`font-semibold ${getAlertColor(alert.alertLevel)}`}>
                            {alert.alertLevel} Alert
                          </h4>
                          {alert.acknowledged && (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                            }`}>
                              Acknowledged
                            </span>
                          )}
                          {alert.escalated && (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                            }`}>
                              Escalated
                            </span>
                          )}
                        </div>
                        
                        <p className={`text-sm mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Risk Score: {alert.prediction?.risk_score || 0}/100
                        </p>
                        
                        {alert.prediction?.predicted_conditions && Array.isArray(alert.prediction.predicted_conditions) && alert.prediction.predicted_conditions.length > 0 && (
                          <div className="mb-2">
                            <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              Conditions:
                            </p>
                            <ul className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              {alert.prediction.predicted_conditions.map((condition, index) => (
                                <li key={index}>• {condition}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {!alert.acknowledged && (
                      <motion.button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          isDark
                            ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Acknowledge
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Emergency Contacts */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Emergency Contacts
          </h3>
          <motion.button
            onClick={() => setShowAddContact(true)}
            className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-600 hover:to-cyan-600 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>
        
        {!Array.isArray(emergencyContacts) || emergencyContacts.length === 0 ? (
          <div className="text-center py-6">
            <Users className={`w-12 h-12 mx-auto mb-3 opacity-50 ${
              isDark ? 'text-slate-600' : 'text-slate-400'
            }`} />
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              No emergency contacts added yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {emergencyContacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-3 rounded-lg border ${
                  isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {contact.name}
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {contact.relationship}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      {contact.email && (
                        <div className="flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {contact.email}
                          </span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {contact.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={() => removeEmergencyContact(contact.id)}
                    className={`p-1 rounded text-red-500 hover:bg-red-500/20 transition-colors`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddContact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddContact(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-2xl border ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Add Emergency Contact
                </h3>
                <button
                  onClick={() => setShowAddContact(false)}
                  className={`p-1 rounded ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                
                <input
                  type="text"
                  placeholder="Relationship"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                
                <input
                  type="email"
                  placeholder="Email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                
                <input
                  type="tel"
                  placeholder="Phone"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddContact(false)}
                    className={`flex-1 py-2 px-4 rounded-lg border ${
                      isDark
                        ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addEmergencyContact}
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg hover:from-purple-600 hover:to-cyan-600"
                  >
                    Add Contact
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-6 rounded-2xl border ${
              isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
            }`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Alert Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Email Alerts</span>
                <input
                  type="checkbox"
                  checked={alertSettings.emailEnabled}
                  onChange={(e) => updateAlertSettings({ ...alertSettings, emailEnabled: e.target.checked })}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>SMS Alerts</span>
                <input
                  type="checkbox"
                  checked={alertSettings.smsEnabled}
                  onChange={(e) => updateAlertSettings({ ...alertSettings, smsEnabled: e.target.checked })}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Emergency Contacts</span>
                <input
                  type="checkbox"
                  checked={alertSettings.emergencyContactsEnabled}
                  onChange={(e) => updateAlertSettings({ ...alertSettings, emergencyContactsEnabled: e.target.checked })}
                  className="rounded"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Response Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={alertSettings.responseTimeoutSeconds}
                  onChange={(e) => updateAlertSettings({ ...alertSettings, responseTimeoutSeconds: parseInt(e.target.value) })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AlertsPanel;