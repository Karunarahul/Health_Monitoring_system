import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { EnsembleHealthPredictor } from './ai-engine/EnsembleHealthPredictor.js';
import { SmartAlertSystem } from './alerts/SmartAlertSystem.js';
import { WellnessPlanGenerator } from './wellness/WellnessPlanGenerator.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

app.use(cors());
app.use(express.json());

// Initialize AI Engine, Alert System, and Wellness Plan Generator
const aiEngine = new EnsembleHealthPredictor();
const alertSystem = new SmartAlertSystem();
const wellnessGenerator = new WellnessPlanGenerator();

// In-memory storage (replace with actual database in production)
let users = [];
let vitalsHistory = [];
let predictionHistory = [];
let connectedDevices = [];
let emergencyContacts = [];

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected for real-time monitoring');
  
  socket.on('subscribe_alerts', (userId) => {
    socket.join(`alerts_${userId}`);
    console.log(`User ${userId} subscribed to real-time alerts`);
  });

  socket.on('acknowledge_alert', (data) => {
    const { alertId, userId } = data;
    const acknowledged = alertSystem.acknowledgeAlert(alertId, userId);
    
    if (acknowledged) {
      io.to(`alerts_${userId}`).emit('alert_acknowledged', { alertId });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Enhanced prediction endpoint with AI ensemble and alerts
app.post('/api/predict', async (req, res) => {
  try {
    const vitals = req.body;
    vitals.timestamp = new Date().toISOString();
    
    // Get user profile if available
    const userProfile = {
      id: vitals.userId || 'anonymous',
      age: vitals.age || 30,
      gender: vitals.gender || 'unknown',
      email: vitals.email,
      phone: vitals.phone,
      full_name: vitals.name || 'User'
    };
    
    // Get AI prediction using ensemble model
    const prediction = await aiEngine.predict(vitals, userProfile);
    
    const result = {
      ...vitals,
      prediction,
      id: Date.now()
    };
    
    predictionHistory.unshift(result);
    
    // Keep only last 50 predictions
    if (predictionHistory.length > 50) {
      predictionHistory = predictionHistory.slice(0, 50);
    }

    // Process alerts if user is authenticated
    if (userProfile.id !== 'anonymous') {
      try {
        const alert = await alertSystem.processHealthAssessment(
          userProfile.id, 
          vitals, 
          prediction, 
          userProfile
        );

        if (alert) {
          // Emit real-time alert to user
          io.to(`alerts_${userProfile.id}`).emit('new_alert', alert);
          
          // Add alert info to response
          result.alert = {
            id: alert.id,
            level: alert.alertLevel,
            timestamp: alert.timestamp
          };
        }
      } catch (alertError) {
        console.error('Alert processing error:', alertError);
        // Don't fail the prediction if alerts fail
      }
    }
    
    res.json(result);
  } catch (error) {
    console.error('Enhanced prediction error:', error);
    res.status(500).json({ 
      error: 'Failed to process health assessment',
      details: error.message 
    });
  }
});

// Wellness Plan endpoint
app.post('/api/wellness-plan', async (req, res) => {
  console.log('🍎 Wellness plan endpoint called with data:', req.body);
  try {
    const { userData, vitals, riskLevel, healthHistory } = req.body;
    
    const wellnessPlan = await wellnessGenerator.generateWellnessPlan(
      userData,
      vitals,
      riskLevel,
      healthHistory
    );
    
    console.log('✅ Wellness plan generated successfully');
    res.json(wellnessPlan);
  } catch (error) {
    console.error('❌ Wellness plan generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate wellness plan',
      details: error.message 
    });
  }
});
console.log('🍎 Wellness plan endpoint registered at /api/wellness-plan');

// Alert management endpoints
app.get('/api/alerts', authenticateToken, (req, res) => {
  const alerts = alertSystem.getActiveAlerts(req.user.id);
  res.json(alerts);
});

app.post('/api/alerts/:alertId/acknowledge', authenticateToken, (req, res) => {
  const { alertId } = req.params;
  const acknowledged = alertSystem.acknowledgeAlert(alertId, req.user.id);
  
  if (acknowledged) {
    io.to(`alerts_${req.user.id}`).emit('alert_acknowledged', { alertId });
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Alert not found' });
  }
});

// Emergency contacts management
app.get('/api/emergency-contacts', authenticateToken, (req, res) => {
  const contacts = alertSystem.getEmergencyContacts(req.user.id);
  res.json(contacts);
});

app.post('/api/emergency-contacts', authenticateToken, (req, res) => {
  const contact = req.body;
  alertSystem.addEmergencyContact(req.user.id, contact);
  res.json({ success: true });
});

app.delete('/api/emergency-contacts/:contactId', authenticateToken, (req, res) => {
  const { contactId } = req.params;
  alertSystem.removeEmergencyContact(req.user.id, contactId);
  res.json({ success: true });
});

// Alert settings management
app.get('/api/alert-settings', authenticateToken, (req, res) => {
  const settings = alertSystem.getUserAlertSettings(req.user.id);
  res.json(settings);
});

app.put('/api/alert-settings', authenticateToken, (req, res) => {
  const settings = req.body;
  alertSystem.updateUserAlertSettings(req.user.id, settings);
  res.json({ success: true });
});

// AI Model information endpoint
app.get('/api/ai-model-info', (req, res) => {
  res.json({
    model_version: "v3.0-ensemble",
    features: [
      "Ensemble stacking with 4 specialized models",
      "Cardiovascular risk assessment",
      "Respiratory health analysis", 
      "Metabolic risk evaluation",
      "General health pattern recognition",
      "SHAP-like explainability",
      "Confidence intervals",
      "Smart alert system",
      "Emergency contact notifications",
      "Personalized wellness plans",
      "AI-enhanced diet recommendations",
      "Lifestyle optimization"
    ],
    specialized_models: {
      cardiovascular: {
        focus: "Heart rate and blood pressure analysis",
        weight: 0.3,
        conditions: ["Tachycardia", "Bradycardia", "Hypertension"]
      },
      respiratory: {
        focus: "Oxygen saturation and breathing patterns",
        weight: 0.25,
        conditions: ["Hypoxemia", "Respiratory distress"]
      },
      metabolic: {
        focus: "Temperature and metabolic indicators",
        weight: 0.25,
        conditions: ["Fever", "Hypothermia", "Metabolic stress"]
      },
      general: {
        focus: "Overall health pattern analysis",
        weight: 0.2,
        conditions: ["Multi-system dysfunction"]
      }
    },
    alert_system: {
      levels: ["CRITICAL", "HIGH", "MODERATE"],
      features: [
        "Email and SMS notifications",
        "Emergency contact alerts",
        "Response time monitoring",
        "Escalation procedures",
        "Fall detection concepts"
      ],
      response_times: {
        critical: "30 seconds",
        high: "2 minutes", 
        moderate: "5 minutes"
      }
    },
    wellness_features: {
      meal_planning: "AI-generated personalized meal plans",
      lifestyle_tips: "Condition-specific lifestyle recommendations",
      nutrition_targets: "Calculated daily nutrition goals",
      ai_enhancement: "OpenAI-powered plan optimization"
    }
  });
});

// Enhanced vitals endpoint with real-time capabilities
app.get('/api/vitals', (req, res) => {
  const newVitals = generateRealisticVitals();
  vitalsHistory.push(newVitals);
  
  // Keep only last 100 readings
  if (vitalsHistory.length > 100) {
    vitalsHistory = vitalsHistory.slice(-100);
  }

  // Emit real-time update
  io.emit('vitals_update', newVitals);

  res.json({
    current: newVitals,
    history: vitalsHistory.slice(-20)
  });
});

// Test alert endpoint (for development)
app.post('/api/test-alert', authenticateToken, async (req, res) => {
  const { severity = 'HIGH' } = req.body;
  
  const testVitals = {
    heart_rate: severity === 'CRITICAL' ? 150 : 95,
    blood_pressure_systolic: severity === 'CRITICAL' ? 180 : 145,
    blood_pressure_diastolic: severity === 'CRITICAL' ? 110 : 95,
    spo2: severity === 'CRITICAL' ? 85 : 94,
    temperature: 37.5
  };

  const testPrediction = {
    risk_score: severity === 'CRITICAL' ? 85 : 65,
    risk_level: severity,
    predicted_conditions: severity === 'CRITICAL' ? 
      ['Severe Hypertension', 'Tachycardia'] : 
      ['Mild Hypertension'],
    confidence: 90,
    recommendations: ['Seek medical attention']
  };

  const userProfile = {
    id: req.user.id,
    email: 'test@example.com',
    phone: '+1234567890',
    full_name: 'Test User'
  };

  try {
    const alert = await alertSystem.processHealthAssessment(
      req.user.id,
      testVitals,
      testPrediction,
      userProfile
    );

    res.json({ 
      success: true, 
      alert,
      message: `Test ${severity} alert triggered` 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to trigger test alert',
      details: error.message 
    });
  }
});

// Existing endpoints...
app.get('/api/predictions', (req, res) => {
  res.json(predictionHistory);
});

app.get('/api/devices', authenticateToken, (req, res) => {
  const userDevices = connectedDevices.filter(device => device.userId === req.user.id);
  res.json(userDevices);
});

app.post('/api/devices', authenticateToken, (req, res) => {
  const device = {
    id: Date.now().toString(),
    userId: req.user.id,
    ...req.body,
    connected_at: new Date().toISOString(),
    is_active: true
  };
  
  connectedDevices.push(device);
  res.json(device);
});

app.delete('/api/devices/:id', authenticateToken, (req, res) => {
  const deviceIndex = connectedDevices.findIndex(
    device => device.id === req.params.id && device.userId === req.user.id
  );
  
  if (deviceIndex === -1) {
    return res.status(404).json({ error: 'Device not found' });
  }
  
  connectedDevices.splice(deviceIndex, 1);
  res.json({ message: 'Device removed successfully' });
});

app.get('/api/sensor-info', (req, res) => {
  res.json({
    supported_sensors: [
      {
        name: "Pulse Oximeter",
        measures: ["heart_rate", "spo2"],
        protocols: ["USB", "Bluetooth", "Serial"],
        examples: ["Nonin 3230", "Masimo MightySat", "CMS50D+"],
        integration_difficulty: "Easy",
        real_time_capable: true
      },
      {
        name: "Blood Pressure Monitor",
        measures: ["blood_pressure_systolic", "blood_pressure_diastolic"],
        protocols: ["Bluetooth", "USB"],
        examples: ["Omron HeartGuide", "Withings BPM Connect", "A&D UA-651BLE"],
        integration_difficulty: "Medium",
        real_time_capable: true
      },
      {
        name: "Digital Thermometer",
        measures: ["temperature"],
        protocols: ["Bluetooth", "Infrared"],
        examples: ["Kinsa Smart Thermometer", "Braun ThermoScan", "Temporal Scanner"],
        integration_difficulty: "Easy",
        real_time_capable: true
      },
      {
        name: "Wearable Devices",
        measures: ["heart_rate", "temperature", "activity", "sleep"],
        protocols: ["Bluetooth", "WiFi", "API"],
        examples: ["Apple Watch", "Fitbit", "Garmin", "Samsung Galaxy Watch"],
        integration_difficulty: "Medium",
        real_time_capable: true
      },
      {
        name: "ECG Monitors",
        measures: ["heart_rhythm", "heart_rate"],
        protocols: ["Bluetooth", "USB"],
        examples: ["AliveCor KardiaMobile", "Omron Complete", "Wellue DuoEK"],
        integration_difficulty: "Hard",
        real_time_capable: true
      }
    ],
    integration_methods: [
      "WebSocket real-time streaming",
      "REST API polling",
      "Bluetooth Web API",
      "Serial port communication",
      "Third-party health APIs (Apple HealthKit, Google Fit)",
      "MQTT for IoT devices",
      "HL7 FHIR for medical devices"
    ],
    ai_features: [
      "Ensemble model predictions",
      "Explainable AI with feature importance",
      "Confidence intervals",
      "Smart alert system",
      "Emergency notifications",
      "Personalized wellness plans",
      "AI-enhanced diet recommendations"
    ]
  });
});

// Add a health check endpoint to verify server is running correctly
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    server: 'enhanced-ai-server',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/predict',
      '/api/wellness-plan',
      '/api/alerts',
      '/api/emergency-contacts',
      '/api/alert-settings',
      '/api/ai-model-info',
      '/api/vitals',
      '/api/predictions',
      '/api/devices',
      '/api/sensor-info'
    ]
  });
});

function generateRealisticVitals() {
  const now = new Date();
  const timeOfDay = now.getHours();
  
  // Simulate circadian rhythm effects
  let heartRateBase = 70;
  let tempBase = 36.8;
  
  if (timeOfDay >= 6 && timeOfDay <= 10) {
    heartRateBase += 5; // Morning increase
  } else if (timeOfDay >= 14 && timeOfDay <= 18) {
    heartRateBase += 8; // Afternoon peak
  } else if (timeOfDay >= 22 || timeOfDay <= 4) {
    heartRateBase -= 10; // Night decrease
    tempBase -= 0.3;
  }
  
  return {
    heart_rate: Math.round(heartRateBase + Math.random() * 20 - 10),
    blood_pressure_systolic: Math.round(115 + Math.random() * 25 - 12.5),
    blood_pressure_diastolic: Math.round(75 + Math.random() * 15 - 7.5),
    spo2: Math.round(97 + Math.random() * 3),
    temperature: Math.round((tempBase + Math.random() * 1.0 - 0.5) * 10) / 10,
    timestamp: now.toISOString(),
    source: 'simulated'
  };
}

// Initialize with some historical data
for (let i = 0; i < 50; i++) {
  const vitals = generateRealisticVitals();
  vitals.timestamp = new Date(Date.now() - (50 - i) * 10000).toISOString();
  vitalsHistory.push(vitals);
}

server.listen(PORT, () => {
  console.log(`🚀 Enhanced HealthAI Monitor backend running on port ${PORT}`);
  console.log(`🤖 AI Ensemble Engine v3.0 loaded with 4 specialized models`);
  console.log(`🚨 Smart Alert System initialized with email/SMS capabilities`);
  console.log(`📊 Real-time monitoring and emergency features enabled`);
  console.log(`🔬 Explainable AI with SHAP-like features active`);
  console.log(`🍎 Wellness Plan Generator with AI enhancement ready`);
  console.log(`💡 Personalized diet and lifestyle recommendations enabled`);
  console.log(`🔍 Health check endpoint available at /api/health`);
});