import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Simulated vitals data store
let vitalsHistory = [];
let predictionHistory = [];

// Enhanced AI Prediction Engine with User-Friendly Analysis
class HealthPredictor {
  static calculateRiskScore(vitals) {
    let score = 0;
    const conditions = [];
    const recommendations = [];
    const explanations = [];

    // Heart Rate Analysis with detailed explanations
    if (vitals.heart_rate > 100) {
      score += 25;
      conditions.push("Fast Heart Rate (Tachycardia)");
      explanations.push(`Your heart rate of ${vitals.heart_rate} beats per minute is higher than the normal resting range (60-100 bpm). This could indicate stress, anxiety, dehydration, or physical activity.`);
      recommendations.push("Consider relaxation techniques, stay hydrated, and avoid caffeine. If persistent, consult a healthcare provider.");
    } else if (vitals.heart_rate < 60) {
      score += 15;
      conditions.push("Slow Heart Rate (Bradycardia)");
      explanations.push(`Your heart rate of ${vitals.heart_rate} beats per minute is lower than the typical range. This might be normal if you're very fit, but could also indicate heart rhythm issues.`);
      recommendations.push("If you're not an athlete and feel dizzy or tired, consider consulting a healthcare provider.");
    } else {
      explanations.push(`Your heart rate of ${vitals.heart_rate} beats per minute is within the healthy range (60-100 bpm).`);
    }

    // Blood Pressure Analysis with detailed explanations
    if (vitals.blood_pressure_systolic > 140 || vitals.blood_pressure_diastolic > 90) {
      score += 30;
      conditions.push("High Blood Pressure (Hypertension)");
      explanations.push(`Your blood pressure reading of ${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic} mmHg is elevated. Normal blood pressure is typically below 120/80 mmHg.`);
      recommendations.push("Reduce salt intake, exercise regularly, manage stress, and limit alcohol. Monitor regularly and consult a healthcare provider.");
    } else if (vitals.blood_pressure_systolic < 90) {
      score += 20;
      conditions.push("Low Blood Pressure (Hypotension)");
      explanations.push(`Your systolic blood pressure of ${vitals.blood_pressure_systolic} mmHg is lower than normal. This might cause dizziness or fainting.`);
      recommendations.push("Stay hydrated, eat small frequent meals, and avoid sudden position changes. Consult a healthcare provider if you feel unwell.");
    } else {
      explanations.push(`Your blood pressure of ${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic} mmHg is within the healthy range.`);
    }

    // SpO2 Analysis with detailed explanations
    if (vitals.spo2 < 95) {
      score += 40;
      conditions.push("Low Blood Oxygen (Severe Hypoxemia)");
      explanations.push(`Your blood oxygen level of ${vitals.spo2}% is significantly below normal (95-100%). This means your blood isn't carrying enough oxygen to your organs.`);
      recommendations.push("This requires immediate medical attention. Seek emergency care if you're experiencing shortness of breath or chest pain.");
    } else if (vitals.spo2 < 98) {
      score += 10;
      conditions.push("Slightly Low Blood Oxygen");
      explanations.push(`Your blood oxygen level of ${vitals.spo2}% is slightly below optimal (98-100%). This might indicate mild breathing issues or high altitude effects.`);
      recommendations.push("Monitor your breathing, ensure good ventilation, and consult a healthcare provider if you have respiratory symptoms.");
    } else {
      explanations.push(`Your blood oxygen level of ${vitals.spo2}% is excellent, indicating your lungs and heart are working well together.`);
    }

    // Temperature Analysis with detailed explanations
    if (vitals.temperature > 38) {
      score += 15;
      conditions.push("Fever/High Body Temperature");
      explanations.push(`Your body temperature of ${vitals.temperature}°C is above normal (36.1-37.2°C). This typically indicates your body is fighting an infection.`);
      recommendations.push("Rest, stay hydrated, and monitor your temperature. Consult a healthcare provider if fever persists or you feel very unwell.");
    } else if (vitals.temperature < 36) {
      score += 20;
      conditions.push("Low Body Temperature (Hypothermia)");
      explanations.push(`Your body temperature of ${vitals.temperature}°C is below normal. This could indicate exposure to cold or other health issues.`);
      recommendations.push("Warm up gradually, wear appropriate clothing, and seek medical attention if you feel confused or very cold.");
    } else {
      explanations.push(`Your body temperature of ${vitals.temperature}°C is normal, indicating good metabolic function.`);
    }

    // Age factor with explanation
    if (vitals.age > 65) {
      score = Math.round(score * 1.2);
      explanations.push("As we age, our bodies may be more sensitive to changes in vital signs, so we're being extra cautious with your assessment.");
    }

    // Determine risk level with user-friendly descriptions
    let risk_level, risk_description, urgency_level;
    if (score <= 25) {
      risk_level = "LOW";
      risk_description = "Your vital signs look good overall";
      urgency_level = "Continue your healthy habits";
    } else if (score <= 50) {
      risk_level = "MODERATE";
      risk_description = "Some vital signs need attention";
      urgency_level = "Consider lifestyle changes and monitoring";
    } else if (score <= 75) {
      risk_level = "HIGH";
      risk_description = "Several vital signs are concerning";
      urgency_level = "Recommend consulting a healthcare provider soon";
    } else {
      risk_level = "CRITICAL";
      risk_description = "Multiple vital signs require immediate attention";
      urgency_level = "Seek medical care immediately";
    }

    // Generate comprehensive, user-friendly feedback
    const feedback = this.generateUserFriendlyFeedback(vitals, conditions, risk_level, explanations, recommendations);

    return {
      risk_score: Math.min(score, 100),
      risk_level,
      risk_description,
      urgency_level,
      predicted_conditions: conditions,
      confidence: Math.round(85 + Math.random() * 10),
      feedback,
      detailed_explanations: explanations,
      recommendations,
      summary: this.generateSummary(vitals, risk_level, conditions.length)
    };
  }

  static generateUserFriendlyFeedback(vitals, conditions, riskLevel, explanations, recommendations) {
    if (conditions.length === 0) {
      return `Great news! All your vital signs are within healthy ranges. Your heart rate (${vitals.heart_rate} bpm), blood pressure (${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic} mmHg), oxygen levels (${vitals.spo2}%), and body temperature (${vitals.temperature}°C) all look good. Keep up your healthy lifestyle!`;
    }

    let feedback = `Based on your vital signs, here's what we found:\n\n`;
    
    // Add the main concern
    const primaryConcern = conditions[0];
    feedback += `🔍 **Primary Finding:** ${primaryConcern}\n`;
    
    // Add explanation for the primary concern
    feedback += `${explanations[0]}\n\n`;
    
    // Add urgency based on risk level
    if (riskLevel === "CRITICAL") {
      feedback += `⚠️ **Important:** This requires immediate medical attention. Please contact a healthcare provider or emergency services right away.\n\n`;
    } else if (riskLevel === "HIGH") {
      feedback += `📞 **Recommendation:** We suggest scheduling an appointment with your healthcare provider within the next few days to discuss these findings.\n\n`;
    } else if (riskLevel === "MODERATE") {
      feedback += `💡 **Suggestion:** Consider monitoring these values and making some lifestyle adjustments. If symptoms persist, consult your healthcare provider.\n\n`;
    }

    // Add the main recommendation
    if (recommendations.length > 0) {
      feedback += `🎯 **What you can do:** ${recommendations[0]}`;
    }

    return feedback;
  }

  static generateSummary(vitals, riskLevel, conditionCount) {
    const name = vitals.name || "Patient";
    
    if (conditionCount === 0) {
      return `${name}'s health assessment shows all vital signs within normal ranges. Overall health status appears good.`;
    }
    
    const riskDescriptions = {
      "LOW": "minor attention needed",
      "MODERATE": "some monitoring recommended", 
      "HIGH": "medical consultation advised",
      "CRITICAL": "immediate medical attention required"
    };
    
    return `${name}'s assessment shows ${conditionCount} area${conditionCount > 1 ? 's' : ''} of concern with ${riskDescriptions[riskLevel]}.`;
  }
}

// Generate realistic vitals data
function generateVitals() {
  const now = new Date();
  return {
    heart_rate: Math.round(60 + Math.random() * 40 + Math.sin(Date.now() / 10000) * 15),
    blood_pressure_systolic: Math.round(110 + Math.random() * 30 + Math.sin(Date.now() / 15000) * 10),
    blood_pressure_diastolic: Math.round(70 + Math.random() * 20 + Math.sin(Date.now() / 12000) * 8),
    spo2: Math.round(96 + Math.random() * 4),
    temperature: Math.round((36.5 + Math.random() * 1.5) * 10) / 10,
    timestamp: now.toISOString()
  };
}

// Initialize with some historical data
for (let i = 0; i < 50; i++) {
  const vitals = generateVitals();
  vitals.timestamp = new Date(Date.now() - (50 - i) * 10000).toISOString();
  vitalsHistory.push(vitals);
}

// API Routes
app.get('/api/vitals', (req, res) => {
  // Add new vitals data
  const newVitals = generateVitals();
  vitalsHistory.push(newVitals);
  
  // Keep only last 100 readings
  if (vitalsHistory.length > 100) {
    vitalsHistory = vitalsHistory.slice(-100);
  }

  res.json({
    current: newVitals,
    history: vitalsHistory.slice(-20) // Last 20 readings
  });
});

app.post('/api/predict', (req, res) => {
  try {
    const vitals = req.body;
    vitals.timestamp = new Date().toISOString();
    
    const prediction = HealthPredictor.calculateRiskScore(vitals);
    
    const result = {
      ...vitals,
      prediction,
      id: Date.now()
    };
    
    predictionHistory.unshift(result);
    
    // Keep only last 10 predictions
    if (predictionHistory.length > 10) {
      predictionHistory = predictionHistory.slice(0, 10);
    }
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'Invalid vitals data' });
  }
});

app.get('/api/predictions', (req, res) => {
  res.json(predictionHistory);
});

// New endpoint for sensor integration guidance
app.get('/api/sensor-info', (req, res) => {
  res.json({
    supported_sensors: [
      {
        name: "Pulse Oximeter",
        measures: ["heart_rate", "spo2"],
        protocols: ["USB", "Bluetooth", "Serial"],
        examples: ["Nonin 3230", "Masimo MightySat", "CMS50D+"]
      },
      {
        name: "Blood Pressure Monitor",
        measures: ["blood_pressure_systolic", "blood_pressure_diastolic"],
        protocols: ["Bluetooth", "USB"],
        examples: ["Omron HeartGuide", "Withings BPM Connect", "A&D UA-651BLE"]
      },
      {
        name: "Digital Thermometer",
        measures: ["temperature"],
        protocols: ["Bluetooth", "Infrared"],
        examples: ["Kinsa Smart Thermometer", "Braun ThermoScan", "Temporal Scanner"]
      },
      {
        name: "Wearable Devices",
        measures: ["heart_rate", "temperature", "activity"],
        protocols: ["Bluetooth", "WiFi", "API"],
        examples: ["Apple Watch", "Fitbit", "Garmin", "Samsung Galaxy Watch"]
      }
    ],
    integration_methods: [
      "WebSocket real-time streaming",
      "REST API polling",
      "Bluetooth Web API",
      "Serial port communication",
      "Third-party health APIs (Apple HealthKit, Google Fit)"
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Enhanced health monitoring backend running on port ${PORT}`);
  console.log(`Sensor integration info available at: http://localhost:${PORT}/api/sensor-info`);
});