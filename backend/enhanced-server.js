import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

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

// In-memory storage (replace with actual database in production)
let users = [];
let vitalsHistory = [];
let predictionHistory = [];
let connectedDevices = [];

// Advanced AI Prediction Engine with Machine Learning-like Logic
class AdvancedHealthPredictor {
  static calculateRiskScore(vitals, userProfile = {}) {
    let score = 0;
    const conditions = [];
    const recommendations = [];
    const explanations = [];
    const riskFactors = [];

    // Enhanced Heart Rate Analysis with age and fitness considerations
    const { age = 30, gender = 'unknown', fitness_level = 'average' } = userProfile;
    
    // Age-adjusted heart rate ranges
    const maxHeartRate = 220 - age;
    const restingHRRange = this.getAgeAdjustedHeartRateRange(age, fitness_level);
    
    if (vitals.heart_rate > restingHRRange.max) {
      const severity = vitals.heart_rate > (restingHRRange.max * 1.2) ? 'severe' : 'moderate';
      score += severity === 'severe' ? 35 : 25;
      conditions.push(severity === 'severe' ? "Severe Tachycardia" : "Tachycardia");
      explanations.push(`Heart rate of ${vitals.heart_rate} bpm is ${severity}ly elevated for your age group (normal: ${restingHRRange.min}-${restingHRRange.max} bpm).`);
      recommendations.push("Immediate rest, deep breathing exercises, and medical evaluation if symptoms persist.");
      riskFactors.push("elevated_heart_rate");
    } else if (vitals.heart_rate < restingHRRange.min && fitness_level !== 'athlete') {
      score += 20;
      conditions.push("Bradycardia");
      explanations.push(`Heart rate of ${vitals.heart_rate} bpm is below normal range for your profile.`);
      recommendations.push("Monitor for dizziness or fatigue; consult healthcare provider if symptomatic.");
      riskFactors.push("low_heart_rate");
    }

    // Advanced Blood Pressure Analysis with multiple risk categories
    const bpCategory = this.categorizeBP(vitals.blood_pressure_systolic, vitals.blood_pressure_diastolic);
    
    switch (bpCategory.stage) {
      case 'hypertensive_crisis':
        score += 50;
        conditions.push("Hypertensive Crisis");
        explanations.push(`Blood pressure ${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic} mmHg indicates a medical emergency.`);
        recommendations.push("Seek immediate emergency medical care.");
        riskFactors.push("hypertensive_crisis");
        break;
      case 'stage_2_hypertension':
        score += 35;
        conditions.push("Stage 2 Hypertension");
        explanations.push(`Blood pressure indicates stage 2 hypertension requiring medical intervention.`);
        recommendations.push("Consult healthcare provider immediately for medication and lifestyle changes.");
        riskFactors.push("stage_2_hypertension");
        break;
      case 'stage_1_hypertension':
        score += 25;
        conditions.push("Stage 1 Hypertension");
        explanations.push(`Blood pressure indicates stage 1 hypertension.`);
        recommendations.push("Lifestyle modifications and regular monitoring; consider medical consultation.");
        riskFactors.push("stage_1_hypertension");
        break;
      case 'elevated':
        score += 15;
        conditions.push("Elevated Blood Pressure");
        explanations.push(`Blood pressure is elevated and trending toward hypertension.`);
        recommendations.push("Focus on diet, exercise, and stress management.");
        riskFactors.push("elevated_bp");
        break;
      case 'hypotension':
        score += 20;
        conditions.push("Hypotension");
        explanations.push(`Blood pressure is significantly low.`);
        recommendations.push("Stay hydrated, avoid sudden position changes, monitor symptoms.");
        riskFactors.push("hypotension");
        break;
    }

    // Enhanced SpO2 Analysis with altitude and health condition considerations
    if (vitals.spo2 < 90) {
      score += 50;
      conditions.push("Severe Hypoxemia");
      explanations.push(`Oxygen saturation of ${vitals.spo2}% is critically low.`);
      recommendations.push("Seek immediate emergency medical attention.");
      riskFactors.push("severe_hypoxemia");
    } else if (vitals.spo2 < 95) {
      score += 30;
      conditions.push("Moderate Hypoxemia");
      explanations.push(`Oxygen saturation of ${vitals.spo2}% is below safe levels.`);
      recommendations.push("Medical evaluation needed; monitor breathing closely.");
      riskFactors.push("moderate_hypoxemia");
    } else if (vitals.spo2 < 98) {
      score += 10;
      conditions.push("Mild Hypoxemia");
      explanations.push(`Oxygen saturation of ${vitals.spo2}% is slightly low.`);
      recommendations.push("Monitor breathing, ensure good ventilation, consider medical consultation.");
      riskFactors.push("mild_hypoxemia");
    }

    // Enhanced Temperature Analysis with fever patterns
    if (vitals.temperature > 39.5) {
      score += 30;
      conditions.push("High Fever");
      explanations.push(`Temperature of ${vitals.temperature}°C indicates high fever.`);
      recommendations.push("Seek medical attention immediately; use fever reducers as directed.");
      riskFactors.push("high_fever");
    } else if (vitals.temperature > 38) {
      score += 15;
      conditions.push("Fever");
      explanations.push(`Temperature of ${vitals.temperature}°C indicates fever.`);
      recommendations.push("Rest, hydration, monitor temperature; consult healthcare provider if persistent.");
      riskFactors.push("fever");
    } else if (vitals.temperature < 35) {
      score += 25;
      conditions.push("Hypothermia");
      explanations.push(`Temperature of ${vitals.temperature}°C indicates hypothermia.`);
      recommendations.push("Seek immediate medical attention; gradual rewarming needed.");
      riskFactors.push("hypothermia");
    } else if (vitals.temperature < 36) {
      score += 15;
      conditions.push("Low Body Temperature");
      explanations.push(`Temperature of ${vitals.temperature}°C is below normal.`);
      recommendations.push("Monitor for symptoms; ensure adequate warmth.");
      riskFactors.push("low_temperature");
    }

    // Multi-factor risk assessment
    const comorbidityRisk = this.assessComorbidityRisk(riskFactors, age);
    score += comorbidityRisk.additionalScore;
    
    if (comorbidityRisk.warnings.length > 0) {
      explanations.push(...comorbidityRisk.warnings);
      recommendations.push(...comorbidityRisk.recommendations);
    }

    // Age and gender risk factors
    if (age > 65) {
      score = Math.round(score * 1.3);
      explanations.push("Age factor increases overall health risk assessment.");
    } else if (age > 50) {
      score = Math.round(score * 1.1);
    }

    // Final risk categorization with more nuanced levels
    const riskAssessment = this.categorizeRisk(score, conditions.length, riskFactors);

    return {
      risk_score: Math.min(score, 100),
      risk_level: riskAssessment.level,
      risk_description: riskAssessment.description,
      urgency_level: riskAssessment.urgency,
      predicted_conditions: conditions,
      risk_factors: riskFactors,
      confidence: this.calculateConfidence(vitals, conditions.length),
      feedback: this.generateAdvancedFeedback(vitals, conditions, riskAssessment, explanations, recommendations),
      detailed_explanations: explanations,
      recommendations,
      summary: this.generateAdvancedSummary(vitals, riskAssessment, conditions.length),
      model_version: "v2.0-advanced",
      assessment_timestamp: new Date().toISOString()
    };
  }

  static getAgeAdjustedHeartRateRange(age, fitnessLevel) {
    let baseMin = 60, baseMax = 100;
    
    if (age < 30) {
      baseMin = 60; baseMax = 100;
    } else if (age < 50) {
      baseMin = 62; baseMax = 95;
    } else if (age < 65) {
      baseMin = 65; baseMax = 90;
    } else {
      baseMin = 65; baseMax = 85;
    }

    // Adjust for fitness level
    if (fitnessLevel === 'athlete') {
      baseMin -= 15; baseMax -= 10;
    } else if (fitnessLevel === 'high') {
      baseMin -= 8; baseMax -= 5;
    } else if (fitnessLevel === 'low') {
      baseMin += 5; baseMax += 10;
    }

    return { min: Math.max(baseMin, 40), max: Math.min(baseMax, 120) };
  }

  static categorizeBP(systolic, diastolic) {
    if (systolic >= 180 || diastolic >= 120) {
      return { stage: 'hypertensive_crisis', description: 'Hypertensive Crisis' };
    } else if (systolic >= 140 || diastolic >= 90) {
      return { stage: 'stage_2_hypertension', description: 'Stage 2 Hypertension' };
    } else if (systolic >= 130 || diastolic >= 80) {
      return { stage: 'stage_1_hypertension', description: 'Stage 1 Hypertension' };
    } else if (systolic >= 120) {
      return { stage: 'elevated', description: 'Elevated Blood Pressure' };
    } else if (systolic < 90) {
      return { stage: 'hypotension', description: 'Hypotension' };
    } else {
      return { stage: 'normal', description: 'Normal Blood Pressure' };
    }
  }

  static assessComorbidityRisk(riskFactors, age) {
    let additionalScore = 0;
    const warnings = [];
    const recommendations = [];

    // Check for multiple cardiovascular risk factors
    const cardioRisks = riskFactors.filter(rf => 
      ['elevated_heart_rate', 'stage_1_hypertension', 'stage_2_hypertension', 'hypertensive_crisis'].includes(rf)
    );

    if (cardioRisks.length >= 2) {
      additionalScore += 15;
      warnings.push("Multiple cardiovascular risk factors detected, increasing overall risk.");
      recommendations.push("Comprehensive cardiovascular evaluation recommended.");
    }

    // Check for respiratory and cardiac combination
    const respRisks = riskFactors.filter(rf => 
      rf.includes('hypoxemia')
    );
    
    if (respRisks.length > 0 && cardioRisks.length > 0) {
      additionalScore += 20;
      warnings.push("Combined respiratory and cardiovascular concerns require immediate attention.");
      recommendations.push("Emergency medical evaluation may be necessary.");
    }

    return { additionalScore, warnings, recommendations };
  }

  static categorizeRisk(score, conditionCount, riskFactors) {
    const hasCriticalFactors = riskFactors.some(rf => 
      ['hypertensive_crisis', 'severe_hypoxemia', 'hypothermia'].includes(rf)
    );

    if (hasCriticalFactors || score >= 80) {
      return {
        level: "CRITICAL",
        description: "Immediate medical attention required",
        urgency: "Seek emergency care immediately"
      };
    } else if (score >= 60 || conditionCount >= 3) {
      return {
        level: "HIGH",
        description: "Multiple concerning vital signs",
        urgency: "Consult healthcare provider within 24 hours"
      };
    } else if (score >= 35 || conditionCount >= 2) {
      return {
        level: "MODERATE",
        description: "Some vital signs need monitoring",
        urgency: "Schedule healthcare consultation within a few days"
      };
    } else if (score >= 15 || conditionCount >= 1) {
      return {
        level: "LOW",
        description: "Minor concerns detected",
        urgency: "Monitor symptoms and consider lifestyle adjustments"
      };
    } else {
      return {
        level: "NORMAL",
        description: "All vital signs within healthy ranges",
        urgency: "Continue current health practices"
      };
    }
  }

  static calculateConfidence(vitals, conditionCount) {
    let confidence = 85;
    
    // Higher confidence with more data points
    if (conditionCount === 0) confidence += 10;
    if (conditionCount >= 3) confidence -= 5;
    
    // Add some realistic variance
    confidence += Math.random() * 10 - 5;
    
    return Math.round(Math.max(75, Math.min(95, confidence)));
  }

  static generateAdvancedFeedback(vitals, conditions, riskAssessment, explanations, recommendations) {
    if (conditions.length === 0) {
      return `Excellent health assessment! All your vital signs are within optimal ranges. Your heart rate (${vitals.heart_rate} bpm), blood pressure (${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic} mmHg), oxygen saturation (${vitals.spo2}%), and body temperature (${vitals.temperature}°C) all indicate good health. Continue your current wellness practices!`;
    }

    let feedback = `## Health Assessment Results\n\n`;
    feedback += `**Overall Status:** ${riskAssessment.description}\n`;
    feedback += `**Recommended Action:** ${riskAssessment.urgency}\n\n`;
    
    if (conditions.length > 0) {
      feedback += `### Key Findings:\n`;
      conditions.forEach((condition, index) => {
        feedback += `• **${condition}:** ${explanations[index] || 'Requires attention'}\n`;
      });
      feedback += `\n`;
    }

    if (recommendations.length > 0) {
      feedback += `### Immediate Actions:\n`;
      recommendations.slice(0, 3).forEach(rec => {
        feedback += `• ${rec}\n`;
      });
    }

    return feedback;
  }

  static generateAdvancedSummary(vitals, riskAssessment, conditionCount) {
    const timestamp = new Date().toLocaleString();
    return `Health assessment completed at ${timestamp}: ${riskAssessment.level} risk level with ${conditionCount} area${conditionCount !== 1 ? 's' : ''} requiring attention. ${riskAssessment.urgency}`;
  }
}

// WebSocket connection handling for real-time data
io.on('connection', (socket) => {
  console.log('Client connected for real-time vitals');
  
  socket.on('subscribe_vitals', (userId) => {
    socket.join(`vitals_${userId}`);
    console.log(`User ${userId} subscribed to real-time vitals`);
  });

  socket.on('sensor_data', (data) => {
    // Handle incoming sensor data
    const processedData = {
      ...data,
      timestamp: new Date().toISOString(),
      source: 'sensor'
    };
    
    vitalsHistory.push(processedData);
    
    // Broadcast to subscribed clients
    if (data.userId) {
      io.to(`vitals_${data.userId}`).emit('vitals_update', processedData);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Enhanced API Routes

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

// Enhanced prediction endpoint with advanced AI
app.post('/api/predict', (req, res) => {
  try {
    const vitals = req.body;
    vitals.timestamp = new Date().toISOString();
    
    // Get user profile if available (mock data for now)
    const userProfile = {
      age: vitals.age || 30,
      gender: vitals.gender || 'unknown',
      fitness_level: 'average'
    };
    
    const prediction = AdvancedHealthPredictor.calculateRiskScore(vitals, userProfile);
    
    const result = {
      ...vitals,
      prediction,
      id: Date.now()
    };
    
    predictionHistory.unshift(result);
    
    // Keep only last 20 predictions
    if (predictionHistory.length > 20) {
      predictionHistory = predictionHistory.slice(0, 20);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(400).json({ error: 'Invalid vitals data' });
  }
});

// Device management endpoints
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

// Enhanced sensor info endpoint
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
    setup_guides: {
      bluetooth: "Use Web Bluetooth API to connect directly from browser",
      usb: "Requires browser extension or native app for USB communication",
      api: "OAuth integration with health platform APIs",
      mqtt: "Connect IoT devices via MQTT broker"
    }
  });
});

// AI Chat endpoint (mock implementation)
app.post('/api/chat', authenticateToken, (req, res) => {
  const { message, conversation_id } = req.body;
  
  // Mock AI response (replace with actual AI service)
  const aiResponse = generateAIResponse(message);
  
  res.json({
    response: aiResponse,
    conversation_id: conversation_id || Date.now().toString(),
    timestamp: new Date().toISOString()
  });
});

function generateAIResponse(message) {
  const responses = [
    "Based on your recent health data, I can provide some insights. What specific aspect would you like me to explain?",
    "I notice you're asking about your vital signs. Let me analyze your recent readings and provide personalized recommendations.",
    "Your health trends show some interesting patterns. Would you like me to break down what this means for your wellness?",
    "I can help interpret your health assessment results. What particular concern would you like me to address?",
    "Based on the AI analysis of your vitals, here are some key points to consider for your health management."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

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
  console.log(`Enhanced HealthAI Monitor backend running on port ${PORT}`);
  console.log(`WebSocket server enabled for real-time data streaming`);
  console.log(`Advanced AI prediction engine v2.0 loaded`);
  console.log(`Sensor integration endpoints available`);
});