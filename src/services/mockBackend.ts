// Mock backend service for deployment
export class MockBackendService {
  private static vitalsHistory: any[] = [];
  private static predictionHistory: any[] = [];

  // Initialize with some mock data
  static {
    // Generate initial vitals history
    for (let i = 0; i < 20; i++) {
      const now = new Date(Date.now() - i * 300000); // 5 minutes apart
      this.vitalsHistory.push({
        heart_rate: Math.round(65 + Math.random() * 30),
        blood_pressure_systolic: Math.round(110 + Math.random() * 30),
        blood_pressure_diastolic: Math.round(70 + Math.random() * 20),
        spo2: Math.round(96 + Math.random() * 4),
        temperature: Math.round((36.5 + Math.random() * 1.5) * 10) / 10,
        timestamp: now.toISOString(),
        source: 'simulated'
      });
    }
  }

  static async getVitals() {
    // Add new simulated vital
    const newVital = {
      heart_rate: Math.round(65 + Math.random() * 30),
      blood_pressure_systolic: Math.round(110 + Math.random() * 30),
      blood_pressure_diastolic: Math.round(70 + Math.random() * 20),
      spo2: Math.round(96 + Math.random() * 4),
      temperature: Math.round((36.5 + Math.random() * 1.5) * 10) / 10,
      timestamp: new Date().toISOString(),
      source: 'simulated'
    };

    this.vitalsHistory.push(newVital);
    
    // Keep only last 50 readings
    if (this.vitalsHistory.length > 50) {
      this.vitalsHistory = this.vitalsHistory.slice(-50);
    }

    return {
      current: newVital,
      history: this.vitalsHistory.slice(-20)
    };
  }

  static async predict(vitals: any) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Enhanced AI prediction logic
    const prediction = this.calculateAdvancedRiskScore(vitals);
    
    const result = {
      ...vitals,
      prediction,
      id: Date.now()
    };
    
    this.predictionHistory.unshift(result);
    
    // Keep only last 20 predictions
    if (this.predictionHistory.length > 20) {
      this.predictionHistory = this.predictionHistory.slice(0, 20);
    }
    
    return result;
  }

  static async generateWellnessPlan(userData: any, vitals: any, riskLevel: string) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const bmi = userData.weight && userData.height ? 
      userData.weight / Math.pow(userData.height / 100, 2) : null;

    return {
      meal_plan: {
        breakfast: this.getMealRecommendation('breakfast', riskLevel, bmi),
        lunch: this.getMealRecommendation('lunch', riskLevel, bmi),
        dinner: this.getMealRecommendation('dinner', riskLevel, bmi),
        snacks: this.getSnackRecommendation(riskLevel, bmi)
      },
      lifestyle_tips: this.getLifestyleTips(vitals, riskLevel, userData.age),
      nutrition_targets: this.getNutritionTargets(userData.age, userData.gender, userData.weight),
      health_focus_areas: this.getHealthFocusAreas(vitals, riskLevel),
      bmi_info: bmi ? {
        value: parseFloat(bmi.toFixed(1)),
        category: this.getBMICategory(bmi),
        recommendations: this.getBMIRecommendations(bmi)
      } : null,
      plan_type: 'ai_enhanced_demo',
      generated_at: new Date().toISOString(),
      note: "This is a demo wellness plan. For production use, consult healthcare professionals."
    };
  }

  private static calculateAdvancedRiskScore(vitals: any) {
    let score = 0;
    const conditions: string[] = [];
    const recommendations: string[] = [];
    const explanations: string[] = [];

    // Heart Rate Analysis
    if (vitals.heart_rate > 100) {
      score += 25;
      conditions.push("Tachycardia");
      explanations.push(`Heart rate of ${vitals.heart_rate} bpm is elevated above normal range (60-100 bpm)`);
      recommendations.push("Consider stress reduction techniques and monitor caffeine intake");
    } else if (vitals.heart_rate < 60) {
      score += 15;
      conditions.push("Bradycardia");
      explanations.push(`Heart rate of ${vitals.heart_rate} bpm is below normal range`);
      recommendations.push("Monitor for symptoms like dizziness; consult healthcare provider if symptomatic");
    } else {
      explanations.push(`Heart rate of ${vitals.heart_rate} bpm is within healthy range`);
    }

    // Blood Pressure Analysis
    if (vitals.blood_pressure_systolic > 140 || vitals.blood_pressure_diastolic > 90) {
      score += 30;
      conditions.push("Hypertension");
      explanations.push(`Blood pressure ${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic} mmHg indicates hypertension`);
      recommendations.push("Reduce sodium intake, increase physical activity, and consult healthcare provider");
    } else if (vitals.blood_pressure_systolic < 90) {
      score += 20;
      conditions.push("Hypotension");
      explanations.push(`Systolic pressure of ${vitals.blood_pressure_systolic} mmHg is low`);
      recommendations.push("Stay hydrated and avoid sudden position changes");
    } else {
      explanations.push(`Blood pressure ${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic} mmHg is within healthy range`);
    }

    // SpO2 Analysis
    if (vitals.spo2 < 95) {
      score += 40;
      conditions.push("Hypoxemia");
      explanations.push(`Oxygen saturation of ${vitals.spo2}% is below normal (95-100%)`);
      recommendations.push("Seek medical attention for breathing evaluation");
    } else if (vitals.spo2 < 98) {
      score += 10;
      conditions.push("Mild Oxygen Desaturation");
      explanations.push(`Oxygen saturation of ${vitals.spo2}% is slightly below optimal`);
      recommendations.push("Monitor breathing and ensure good ventilation");
    } else {
      explanations.push(`Oxygen saturation of ${vitals.spo2}% is excellent`);
    }

    // Temperature Analysis
    if (vitals.temperature > 38) {
      score += 15;
      conditions.push("Fever");
      explanations.push(`Temperature of ${vitals.temperature}°C indicates fever`);
      recommendations.push("Rest, stay hydrated, and monitor symptoms");
    } else if (vitals.temperature < 36) {
      score += 20;
      conditions.push("Hypothermia");
      explanations.push(`Temperature of ${vitals.temperature}°C is below normal`);
      recommendations.push("Warm up gradually and seek medical attention if persistent");
    } else {
      explanations.push(`Temperature of ${vitals.temperature}°C is normal`);
    }

    // Determine risk level
    let risk_level: string;
    let risk_description: string;
    let urgency_level: string;

    if (score >= 60) {
      risk_level = "HIGH";
      risk_description = "Multiple concerning vital signs detected";
      urgency_level = "Consult healthcare provider within 24 hours";
    } else if (score >= 35) {
      risk_level = "MODERATE";
      risk_description = "Some vital signs need attention";
      urgency_level = "Monitor closely and consider medical consultation";
    } else if (score >= 15) {
      risk_level = "LOW";
      risk_description = "Minor concerns detected";
      urgency_level = "Continue monitoring and maintain healthy habits";
    } else {
      risk_level = "LOW";
      risk_description = "All vital signs within healthy ranges";
      urgency_level = "Continue current health practices";
    }

    // Generate comprehensive feedback
    const feedback = this.generateFeedback(vitals, conditions, risk_level, explanations);

    // Generate explainability data
    const explainability = this.generateExplainability(vitals, conditions, explanations);
    const modelContributions = this.generateModelContributions(vitals);
    const confidenceIntervals = this.generateConfidenceIntervals();

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
      summary: `Health assessment completed: ${risk_level} risk level with ${conditions.length} area${conditions.length !== 1 ? 's' : ''} requiring attention.`,
      explainability,
      modelContributions,
      confidenceIntervals,
      model_version: "v3.0-ensemble-demo"
    };
  }

  private static generateFeedback(vitals: any, conditions: string[], riskLevel: string, explanations: string[]) {
    if (conditions.length === 0) {
      return `Excellent! All your vital signs are within healthy ranges. Your heart rate (${vitals.heart_rate} bpm), blood pressure (${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic} mmHg), oxygen levels (${vitals.spo2}%), and temperature (${vitals.temperature}°C) all look good. Keep up your healthy lifestyle!`;
    }

    let feedback = `## Health Assessment Results\n\n`;
    feedback += `**Overall Status:** ${riskLevel} risk level detected\n\n`;
    
    if (conditions.length > 0) {
      feedback += `**Key Findings:**\n`;
      conditions.forEach((condition, index) => {
        feedback += `• **${condition}:** ${explanations[index] || 'Requires attention'}\n`;
      });
    }

    return feedback;
  }

  private static generateExplainability(vitals: any, conditions: string[], explanations: string[]) {
    return {
      feature_importance: {
        heart_rate: {
          importance_score: Math.abs(vitals.heart_rate - 75) / 75,
          impact_description: vitals.heart_rate > 100 ? 'Elevated heart rate increases risk' : 'Heart rate impact on assessment',
          contribution_percentage: Math.round(Math.abs(vitals.heart_rate - 75) / 75 * 100)
        },
        blood_pressure: {
          importance_score: Math.max(Math.abs(vitals.blood_pressure_systolic - 120) / 120, Math.abs(vitals.blood_pressure_diastolic - 80) / 80),
          impact_description: vitals.blood_pressure_systolic > 140 ? 'High blood pressure significantly increases risk' : 'Blood pressure impact on assessment',
          contribution_percentage: Math.round(Math.max(Math.abs(vitals.blood_pressure_systolic - 120) / 120, Math.abs(vitals.blood_pressure_diastolic - 80) / 80) * 100)
        },
        spo2: {
          importance_score: Math.abs(vitals.spo2 - 98) / 98,
          impact_description: vitals.spo2 < 95 ? 'Low oxygen saturation indicates respiratory concerns' : 'Oxygen saturation impact',
          contribution_percentage: Math.round(Math.abs(vitals.spo2 - 98) / 98 * 100)
        },
        temperature: {
          importance_score: Math.abs(vitals.temperature - 36.8) / 36.8,
          impact_description: vitals.temperature > 38 ? 'Fever indicates possible infection' : 'Temperature impact on assessment',
          contribution_percentage: Math.round(Math.abs(vitals.temperature - 36.8) / 36.8 * 100)
        }
      },
      explanations: {
        why_this_risk_level: `Risk assessment based on deviation from normal vital sign ranges and clinical significance of findings.`,
        key_contributing_factors: conditions.map((condition, index) => ({
          factor: condition,
          impact: explanations[index] || 'Contributing to overall risk assessment',
          importance: 0.7 + Math.random() * 0.3
        })),
        model_reasoning: {
          cardiovascular: "Heart rate and blood pressure analysis for cardiovascular risk",
          respiratory: "Oxygen saturation analysis for respiratory function",
          metabolic: "Temperature analysis for metabolic and infectious processes",
          general: "Overall vital sign pattern analysis"
        },
        confidence_factors: "High confidence based on clear vital sign measurements and established clinical ranges"
      },
      decision_path: {
        step1: "Vital signs collected and validated",
        step2: "Individual parameters analyzed against normal ranges",
        step3: "Risk factors identified and weighted",
        step4: "Overall risk score calculated using ensemble approach",
        step5: "Recommendations generated based on findings"
      }
    };
  }

  private static generateModelContributions(vitals: any) {
    return {
      cardiovascular: {
        risk_score: Math.round(Math.max(Math.abs(vitals.heart_rate - 75), Math.abs(vitals.blood_pressure_systolic - 120)) / 2),
        weight: 0.3,
        contribution: Math.round(Math.max(Math.abs(vitals.heart_rate - 75), Math.abs(vitals.blood_pressure_systolic - 120)) / 2 * 0.3)
      },
      respiratory: {
        risk_score: Math.round(Math.abs(vitals.spo2 - 98) * 10),
        weight: 0.25,
        contribution: Math.round(Math.abs(vitals.spo2 - 98) * 10 * 0.25)
      },
      metabolic: {
        risk_score: Math.round(Math.abs(vitals.temperature - 36.8) * 20),
        weight: 0.25,
        contribution: Math.round(Math.abs(vitals.temperature - 36.8) * 20 * 0.25)
      },
      general: {
        risk_score: Math.round((Math.abs(vitals.heart_rate - 75) + Math.abs(vitals.spo2 - 98)) / 4),
        weight: 0.2,
        contribution: Math.round((Math.abs(vitals.heart_rate - 75) + Math.abs(vitals.spo2 - 98)) / 4 * 0.2)
      }
    };
  }

  private static generateConfidenceIntervals() {
    const mean = 85 + Math.random() * 10;
    return {
      mean_confidence: Math.round(mean),
      confidence_range: {
        lower: Math.round(mean - 5),
        upper: Math.round(mean + 5)
      },
      reliability_score: Math.round(80 + Math.random() * 15)
    };
  }

  private static getMealRecommendation(mealType: string, riskLevel: string, bmi: number | null) {
    const meals = {
      breakfast: {
        LOW: "Oatmeal with fresh berries, nuts, and Greek yogurt",
        MODERATE: "Whole grain toast with avocado and poached egg",
        HIGH: "Heart-healthy smoothie with spinach, banana, and protein powder"
      },
      lunch: {
        LOW: "Grilled chicken salad with mixed vegetables and olive oil dressing",
        MODERATE: "Quinoa bowl with roasted vegetables and lean protein",
        HIGH: "Steamed fish with brown rice and steamed broccoli"
      },
      dinner: {
        LOW: "Baked salmon with sweet potato and asparagus",
        MODERATE: "Lean turkey with quinoa and green beans",
        HIGH: "Grilled white fish with cauliflower rice and spinach"
      }
    };

    let meal = meals[mealType as keyof typeof meals][riskLevel as keyof typeof meals.breakfast] || meals[mealType as keyof typeof meals].LOW;
    
    if (bmi && bmi > 30) {
      meal += " (focus on portion control)";
    } else if (bmi && bmi < 18.5) {
      meal += " with extra healthy fats";
    }

    return meal;
  }

  private static getSnackRecommendation(riskLevel: string, bmi: number | null) {
    const snacks = {
      LOW: "Mixed nuts and fresh fruit",
      MODERATE: "Greek yogurt with berries",
      HIGH: "Vegetable sticks with hummus"
    };

    return snacks[riskLevel as keyof typeof snacks] || snacks.LOW;
  }

  private static getLifestyleTips(vitals: any, riskLevel: string, age?: number) {
    const tips = [
      "💧 Drink 8-10 glasses of water daily",
      "😴 Get 7-9 hours of quality sleep nightly"
    ];

    if (vitals.heart_rate > 100) {
      tips.push("🧘‍♀️ Practice stress reduction techniques like meditation or deep breathing");
      tips.push("☕ Limit caffeine intake, especially in the afternoon");
    }

    if (vitals.blood_pressure_systolic > 140) {
      tips.push("🧂 Reduce sodium intake to less than 2,300mg daily");
      tips.push("🚶‍♀️ Engage in 30 minutes of moderate exercise daily");
    }

    if (vitals.spo2 < 95) {
      tips.push("🫁 Practice breathing exercises and ensure good air quality");
      tips.push("🚭 Avoid smoking and secondhand smoke");
    }

    if (age && age > 65) {
      tips.push("💪 Include light strength training 2-3 times per week");
      tips.push("🧠 Engage in mental activities like reading or puzzles");
    }

    return tips;
  }

  private static getNutritionTargets(age?: number, gender?: string, weight?: number) {
    const baseCalories = gender === 'female' ? 1800 : 2200;
    const proteinTarget = weight ? Math.round(weight * 0.8) : 60;

    return {
      calories: baseCalories,
      protein: proteinTarget,
      fiber: age && age > 50 ? (gender === 'female' ? 21 : 30) : (gender === 'female' ? 25 : 38),
      sodium: 2300,
      potassium: 3500,
      calcium: age && age > 50 ? 1200 : 1000,
      water: weight ? Math.round(weight * 35) : 2500
    };
  }

  private static getHealthFocusAreas(vitals: any, riskLevel: string) {
    const areas = [];

    if (vitals.heart_rate > 100 || vitals.blood_pressure_systolic > 140) {
      areas.push({ condition: "Cardiovascular Health", priority: "high" });
    }

    if (vitals.spo2 < 95) {
      areas.push({ condition: "Respiratory Function", priority: "high" });
    }

    if (vitals.temperature > 38) {
      areas.push({ condition: "Infection Management", priority: "moderate" });
    }

    return areas;
  }

  private static getBMICategory(bmi: number) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  private static getBMIRecommendations(bmi: number) {
    if (bmi < 18.5) {
      return ['Focus on nutrient-dense foods', 'Include healthy fats', 'Consider strength training'];
    } else if (bmi < 25) {
      return ['Maintain current healthy weight', 'Continue regular activity', 'Focus on whole foods'];
    } else if (bmi < 30) {
      return ['Create moderate caloric deficit', 'Increase physical activity', 'Focus on high-fiber foods'];
    } else {
      return ['Consult healthcare provider', 'Focus on sustainable changes', 'Prioritize low-impact exercises'];
    }
  }

  static getPredictions() {
    return this.predictionHistory;
  }

  static getSensorInfo() {
    return {
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
        }
      ],
      integration_methods: [
        "WebSocket real-time streaming",
        "REST API polling",
        "Bluetooth Web API",
        "Serial port communication",
        "Third-party health APIs (Apple HealthKit, Google Fit)",
        "MQTT for IoT devices"
      ]
    };
  }
}