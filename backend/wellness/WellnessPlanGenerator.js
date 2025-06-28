import OpenAI from 'openai';

export class WellnessPlanGenerator {
  constructor() {
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    }) : null;
  }

  async generateWellnessPlan(userData, vitals, riskLevel, healthHistory = []) {
    // First try rule-based approach, then enhance with AI if available
    const basePlan = this.generateRuleBasedPlan(userData, vitals, riskLevel);
    
    if (this.openai) {
      try {
        const enhancedPlan = await this.enhanceWithAI(basePlan, userData, vitals, riskLevel, healthHistory);
        return enhancedPlan;
      } catch (error) {
        console.error('AI enhancement failed, using rule-based plan:', error);
        return basePlan;
      }
    }
    
    return basePlan;
  }

  generateRuleBasedPlan(userData, vitals, riskLevel) {
    const { age, gender, weight, height, chronic_conditions = [] } = userData;
    
    // Calculate BMI if weight and height are available
    const bmi = weight && height ? weight / Math.pow(height / 100, 2) : null;
    
    // Analyze health conditions
    const conditions = this.analyzeHealthConditions(vitals, age, gender, chronic_conditions, bmi);
    
    // Generate meal plan
    const mealPlan = this.generateMealPlan(conditions, age, gender, bmi, riskLevel);
    
    // Generate lifestyle tips
    const lifestyleTips = this.generateLifestyleTips(conditions, vitals, age, gender, riskLevel, bmi);
    
    // Calculate nutrition targets
    const nutritionTargets = this.calculateNutritionTargets(age, gender, weight, conditions, bmi);
    
    return {
      meal_plan: mealPlan,
      lifestyle_tips: lifestyleTips,
      nutrition_targets: nutritionTargets,
      health_focus_areas: conditions,
      bmi_info: bmi ? {
        value: parseFloat(bmi.toFixed(1)),
        category: this.getBMICategory(bmi),
        recommendations: this.getBMIRecommendations(bmi)
      } : null,
      plan_type: 'rule_based',
      generated_at: new Date().toISOString(),
      note: "These recommendations are based on your current vitals and profile data. Consult healthcare professionals for medical advice."
    };
  }

  getBMICategory(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  getBMIRecommendations(bmi) {
    if (bmi < 18.5) {
      return [
        'Focus on nutrient-dense, calorie-rich foods',
        'Include healthy fats like nuts, avocados, and olive oil',
        'Consider strength training to build muscle mass',
        'Eat frequent, smaller meals throughout the day'
      ];
    } else if (bmi < 25) {
      return [
        'Maintain current healthy weight with balanced nutrition',
        'Continue regular physical activity',
        'Focus on whole foods and adequate hydration',
        'Monitor portion sizes to maintain stability'
      ];
    } else if (bmi < 30) {
      return [
        'Create a moderate caloric deficit for gradual weight loss',
        'Increase physical activity, especially cardio exercises',
        'Focus on high-fiber, low-calorie foods',
        'Practice portion control and mindful eating'
      ];
    } else {
      return [
        'Consult healthcare provider for comprehensive weight management',
        'Focus on sustainable lifestyle changes',
        'Prioritize low-impact exercises initially',
        'Consider working with a registered dietitian'
      ];
    }
  }

  analyzeHealthConditions(vitals, age, gender, chronicConditions, bmi) {
    const conditions = [];
    
    // Blood pressure analysis
    if (vitals.blood_pressure_systolic > 140 || vitals.blood_pressure_diastolic > 90) {
      conditions.push({
        condition: 'hypertension',
        severity: vitals.blood_pressure_systolic > 160 ? 'high' : 'moderate',
        recommendations: ['low_sodium', 'dash_diet', 'potassium_rich']
      });
    }
    
    // Heart rate analysis
    if (vitals.heart_rate > 100) {
      conditions.push({
        condition: 'tachycardia',
        severity: vitals.heart_rate > 120 ? 'high' : 'moderate',
        recommendations: ['reduce_caffeine', 'stress_management', 'moderate_exercise']
      });
    } else if (vitals.heart_rate < 60 && age > 65) {
      conditions.push({
        condition: 'bradycardia',
        severity: 'moderate',
        recommendations: ['gentle_exercise', 'heart_healthy_foods']
      });
    }
    
    // Oxygen saturation analysis
    if (vitals.spo2 < 95) {
      conditions.push({
        condition: 'hypoxemia',
        severity: vitals.spo2 < 90 ? 'high' : 'moderate',
        recommendations: ['antioxidant_rich', 'breathing_exercises', 'iron_rich']
      });
    }
    
    // Temperature analysis
    if (vitals.temperature > 38) {
      conditions.push({
        condition: 'fever',
        severity: vitals.temperature > 39 ? 'high' : 'moderate',
        recommendations: ['hydration', 'light_foods', 'rest']
      });
    }
    
    // BMI-based conditions
    if (bmi) {
      if (bmi < 18.5) {
        conditions.push({
          condition: 'underweight',
          severity: 'moderate',
          recommendations: ['calorie_dense', 'protein_rich', 'strength_training']
        });
      } else if (bmi >= 30) {
        conditions.push({
          condition: 'obesity',
          severity: bmi >= 35 ? 'high' : 'moderate',
          recommendations: ['calorie_deficit', 'low_impact_exercise', 'portion_control']
        });
      } else if (bmi >= 25) {
        conditions.push({
          condition: 'overweight',
          severity: 'moderate',
          recommendations: ['balanced_diet', 'increased_activity', 'mindful_eating']
        });
      }
    }
    
    // Age-related conditions
    if (age > 65) {
      conditions.push({
        condition: 'elderly_nutrition',
        severity: 'standard',
        recommendations: ['calcium_rich', 'vitamin_d', 'protein_focus', 'fiber_rich']
      });
    }
    
    // Gender-specific conditions
    if (gender === 'female' && age > 50) {
      conditions.push({
        condition: 'postmenopausal',
        severity: 'standard',
        recommendations: ['calcium_rich', 'phytoestrogens', 'bone_health']
      });
    }
    
    // Add chronic conditions
    chronicConditions.forEach(condition => {
      conditions.push({
        condition: condition.toLowerCase(),
        severity: 'chronic',
        recommendations: this.getChronicConditionRecommendations(condition)
      });
    });
    
    return conditions;
  }

  generateMealPlan(conditions, age, gender, bmi, riskLevel) {
    const dietaryNeeds = this.analyzeDietaryNeeds(conditions);
    
    const mealPlan = {
      breakfast: this.generateMeal('breakfast', dietaryNeeds, age, gender, bmi),
      lunch: this.generateMeal('lunch', dietaryNeeds, age, gender, bmi),
      dinner: this.generateMeal('dinner', dietaryNeeds, age, gender, bmi),
      snacks: this.generateSnacks(dietaryNeeds, age, gender, bmi)
    };
    
    return mealPlan;
  }

  analyzeDietaryNeeds(conditions) {
    const needs = {
      low_sodium: false,
      high_potassium: false,
      antioxidant_rich: false,
      heart_healthy: false,
      anti_inflammatory: false,
      high_protein: false,
      high_fiber: false,
      calcium_rich: false,
      iron_rich: false,
      hydrating: false,
      light_foods: false,
      calorie_dense: false,
      calorie_deficit: false
    };
    
    conditions.forEach(condition => {
      condition.recommendations.forEach(rec => {
        switch (rec) {
          case 'low_sodium':
            needs.low_sodium = true;
            break;
          case 'potassium_rich':
            needs.high_potassium = true;
            break;
          case 'antioxidant_rich':
            needs.antioxidant_rich = true;
            break;
          case 'heart_healthy_foods':
            needs.heart_healthy = true;
            break;
          case 'calcium_rich':
            needs.calcium_rich = true;
            break;
          case 'iron_rich':
            needs.iron_rich = true;
            break;
          case 'hydration':
            needs.hydrating = true;
            break;
          case 'light_foods':
            needs.light_foods = true;
            break;
          case 'calorie_dense':
            needs.calorie_dense = true;
            break;
          case 'calorie_deficit':
            needs.calorie_deficit = true;
            break;
        }
      });
    });
    
    return needs;
  }

  generateMeal(mealType, dietaryNeeds, age, gender, bmi) {
    const mealOptions = {
      breakfast: {
        heart_healthy: [
          "Oatmeal with fresh berries, walnuts, and a drizzle of honey",
          "Greek yogurt parfait with blueberries, chia seeds, and almonds",
          "Avocado toast on whole grain bread with a poached egg",
          "Smoothie bowl with spinach, banana, berries, and flax seeds"
        ],
        low_sodium: [
          "Fresh fruit salad with unsalted nuts and yogurt",
          "Homemade granola with fresh berries and low-fat milk",
          "Scrambled eggs with herbs and vegetables (no added salt)",
          "Quinoa breakfast bowl with fresh fruits and cinnamon"
        ],
        high_protein: [
          "Protein smoothie with Greek yogurt, banana, and protein powder",
          "Egg white omelet with vegetables and cottage cheese",
          "Greek yogurt with nuts, seeds, and protein granola",
          "Quinoa breakfast bowl with nuts and Greek yogurt"
        ],
        light_foods: [
          "Fresh fruit smoothie with coconut water",
          "Plain toast with a small amount of honey",
          "Herbal tea with a small portion of crackers",
          "Rice porridge with a touch of ginger"
        ],
        calorie_dense: [
          "Peanut butter and banana smoothie with whole milk and oats",
          "Avocado toast with scrambled eggs and cheese",
          "Granola with full-fat yogurt, nuts, and dried fruits",
          "Pancakes with nut butter and fresh fruit"
        ],
        calorie_deficit: [
          "Egg white omelet with vegetables and herbs",
          "Greek yogurt with berries (no added sugar)",
          "Green smoothie with spinach, cucumber, and apple",
          "Overnight oats with almond milk and cinnamon"
        ]
      },
      lunch: {
        heart_healthy: [
          "Grilled salmon salad with mixed greens, avocado, and olive oil dressing",
          "Quinoa bowl with roasted vegetables and chickpeas",
          "Lentil soup with whole grain roll",
          "Mediterranean wrap with hummus, vegetables, and lean protein"
        ],
        low_sodium: [
          "Fresh herb-seasoned grilled chicken with steamed vegetables",
          "Homemade vegetable soup with herbs (no added salt)",
          "Quinoa salad with fresh vegetables and lemon dressing",
          "Baked sweet potato with black beans and fresh salsa"
        ],
        high_protein: [
          "Grilled chicken breast with quinoa and roasted vegetables",
          "Tuna salad with mixed greens and chickpeas",
          "Lean beef stir-fry with brown rice",
          "Tofu and vegetable curry with lentils"
        ],
        light_foods: [
          "Clear vegetable broth with small portions of rice",
          "Steamed fish with plain rice and mild vegetables",
          "Banana and rice with a small amount of yogurt",
          "Mild vegetable soup with crackers"
        ],
        calorie_dense: [
          "Chicken and avocado wrap with cheese and nuts",
          "Quinoa bowl with salmon, nuts, and olive oil dressing",
          "Pasta with meat sauce and parmesan cheese",
          "Rice bowl with chicken, beans, and guacamole"
        ],
        calorie_deficit: [
          "Large salad with grilled chicken and light vinaigrette",
          "Vegetable soup with lean protein",
          "Zucchini noodles with turkey meatballs",
          "Cauliflower rice bowl with vegetables and tofu"
        ]
      },
      dinner: {
        heart_healthy: [
          "Baked cod with roasted Brussels sprouts and sweet potato",
          "Grilled chicken with quinoa pilaf and steamed broccoli",
          "Vegetarian chili with whole grain cornbread",
          "Salmon with roasted asparagus and brown rice"
        ],
        low_sodium: [
          "Herb-crusted baked chicken with roasted root vegetables",
          "Grilled fish with steamed vegetables and quinoa",
          "Homemade vegetable stir-fry with brown rice",
          "Lentil curry with fresh herbs and brown rice"
        ],
        high_protein: [
          "Grilled lean steak with roasted vegetables",
          "Baked chicken thighs with quinoa and green beans",
          "Fish tacos with black beans and avocado",
          "Turkey meatballs with whole wheat pasta"
        ],
        light_foods: [
          "Steamed white fish with plain rice",
          "Chicken broth with small portions of noodles",
          "Baked potato with a small amount of plain yogurt",
          "Mild vegetable soup with toast"
        ],
        calorie_dense: [
          "Grilled salmon with quinoa and avocado",
          "Beef stir-fry with nuts and brown rice",
          "Chicken thighs with sweet potato and olive oil",
          "Pasta with meat sauce and cheese"
        ],
        calorie_deficit: [
          "Grilled fish with steamed vegetables",
          "Chicken breast with cauliflower rice",
          "Vegetable stir-fry with tofu",
          "Zucchini lasagna with lean ground turkey"
        ]
      }
    };
    
    // Select appropriate meal based on dietary needs
    let selectedMeals = [];
    
    if (dietaryNeeds.light_foods) {
      selectedMeals = mealOptions[mealType].light_foods;
    } else if (dietaryNeeds.calorie_dense) {
      selectedMeals = mealOptions[mealType].calorie_dense;
    } else if (dietaryNeeds.calorie_deficit) {
      selectedMeals = mealOptions[mealType].calorie_deficit;
    } else if (dietaryNeeds.heart_healthy) {
      selectedMeals = mealOptions[mealType].heart_healthy;
    } else if (dietaryNeeds.low_sodium) {
      selectedMeals = mealOptions[mealType].low_sodium;
    } else if (dietaryNeeds.high_protein) {
      selectedMeals = mealOptions[mealType].high_protein;
    } else {
      selectedMeals = mealOptions[mealType].heart_healthy; // Default
    }
    
    // Add BMI-specific modifications
    let meal = selectedMeals[Math.floor(Math.random() * selectedMeals.length)];
    
    if (age > 65) {
      meal += " (Consider smaller portions and ensure adequate hydration)";
    }
    
    if (bmi && bmi < 18.5) {
      meal += " with extra healthy fats and protein";
    } else if (bmi && bmi >= 30) {
      meal += " with focus on vegetables and lean proteins";
    }
    
    if (dietaryNeeds.calcium_rich && mealType === 'breakfast') {
      meal += " with added calcium-fortified options";
    }
    
    return meal;
  }

  generateSnacks(dietaryNeeds, age, gender, bmi) {
    const snackOptions = {
      heart_healthy: [
        "Mixed nuts (unsalted)",
        "Apple slices with almond butter",
        "Greek yogurt with berries",
        "Hummus with vegetable sticks"
      ],
      low_sodium: [
        "Fresh fruit",
        "Unsalted nuts and seeds",
        "Plain yogurt with honey",
        "Raw vegetables with homemade dip"
      ],
      high_protein: [
        "Greek yogurt",
        "Hard-boiled eggs",
        "Protein smoothie",
        "Cottage cheese with fruit"
      ],
      light_foods: [
        "Herbal tea with plain crackers",
        "Small portion of banana",
        "Rice cakes",
        "Clear broth"
      ],
      calorie_dense: [
        "Trail mix with nuts and dried fruit",
        "Peanut butter with apple slices",
        "Cheese and whole grain crackers",
        "Smoothie with protein powder and nut butter"
      ],
      calorie_deficit: [
        "Cucumber slices with hummus",
        "Berries with a small amount of yogurt",
        "Celery sticks with almond butter",
        "Herbal tea with a few almonds"
      ]
    };
    
    let selectedSnacks = [];
    
    if (dietaryNeeds.light_foods) {
      selectedSnacks = snackOptions.light_foods;
    } else if (dietaryNeeds.calorie_dense) {
      selectedSnacks = snackOptions.calorie_dense;
    } else if (dietaryNeeds.calorie_deficit) {
      selectedSnacks = snackOptions.calorie_deficit;
    } else if (dietaryNeeds.heart_healthy) {
      selectedSnacks = snackOptions.heart_healthy;
    } else if (dietaryNeeds.low_sodium) {
      selectedSnacks = snackOptions.low_sodium;
    } else if (dietaryNeeds.high_protein) {
      selectedSnacks = snackOptions.high_protein;
    } else {
      selectedSnacks = snackOptions.heart_healthy;
    }
    
    return selectedSnacks.slice(0, 2).join(" or ");
  }

  generateLifestyleTips(conditions, vitals, age, gender, riskLevel, bmi) {
    const tips = [];
    
    // BMI-specific exercise recommendations
    if (bmi) {
      if (bmi < 18.5) {
        tips.push("💪 Focus on strength training to build muscle mass and healthy weight gain");
        tips.push("🏃‍♀️ Include moderate cardio but prioritize muscle-building exercises");
      } else if (bmi >= 30) {
        tips.push("🚶‍♀️ Start with low-impact exercises like walking, swimming, or cycling");
        tips.push("💪 Gradually incorporate strength training as fitness improves");
      } else if (bmi >= 25) {
        tips.push("🏃‍♀️ Aim for 150 minutes of moderate aerobic activity per week");
        tips.push("💪 Include strength training 2-3 times per week");
      } else {
        tips.push("🏃‍♀️ Maintain current activity level with varied exercises");
        tips.push("💪 Continue balanced cardio and strength training routine");
      }
    } else {
      // Default exercise recommendations
      if (vitals.heart_rate > 100) {
        tips.push("🏃‍♀️ Start with gentle walking for 10-15 minutes daily, gradually increasing as your heart rate stabilizes");
        tips.push("🧘‍♀️ Practice deep breathing exercises 3 times daily to help reduce heart rate");
      } else if (age > 65) {
        tips.push("🚶‍♀️ Aim for 30 minutes of gentle walking daily, broken into 10-minute sessions if needed");
        tips.push("💪 Include light strength training 2-3 times per week to maintain muscle mass");
      } else {
        tips.push("🏃‍♀️ Aim for 150 minutes of moderate aerobic activity per week");
        tips.push("💪 Include strength training exercises 2-3 times per week");
      }
    }
    
    // Hydration recommendations
    if (vitals.temperature > 38 || conditions.some(c => c.condition === 'fever')) {
      tips.push("💧 Increase fluid intake to 10-12 glasses of water daily to help reduce fever");
    } else {
      tips.push("💧 Drink 8-10 glasses of water daily, more if you're active or in hot weather");
    }
    
    // Sleep recommendations
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      tips.push("😴 Prioritize 7-9 hours of quality sleep to support recovery and immune function");
      tips.push("🌙 Establish a consistent bedtime routine and avoid screens 1 hour before bed");
    } else {
      tips.push("😴 Maintain 7-9 hours of sleep nightly for optimal health");
    }
    
    // Stress management
    if (vitals.heart_rate > 100 || vitals.blood_pressure_systolic > 140) {
      tips.push("🧘‍♀️ Practice stress-reduction techniques like meditation, yoga, or deep breathing for 10-15 minutes daily");
      tips.push("📱 Limit screen time and news consumption to reduce stress and anxiety");
    }
    
    // Blood pressure specific
    if (vitals.blood_pressure_systolic > 140) {
      tips.push("🧂 Limit sodium intake to less than 2,300mg daily (ideally 1,500mg)");
      tips.push("🍌 Include potassium-rich foods like bananas, oranges, and leafy greens");
    }
    
    // Oxygen saturation specific
    if (vitals.spo2 < 95) {
      tips.push("🫁 Practice breathing exercises: inhale for 4 counts, hold for 4, exhale for 6");
      tips.push("🌿 Ensure good air quality in your living space and consider air purification");
    }
    
    // BMI-specific lifestyle tips
    if (bmi) {
      if (bmi < 18.5) {
        tips.push("🍽️ Eat frequent, smaller meals throughout the day to increase caloric intake");
        tips.push("🥜 Include healthy fats like nuts, avocados, and olive oil in your diet");
      } else if (bmi >= 30) {
        tips.push("🍽️ Practice portion control and mindful eating techniques");
        tips.push("📝 Consider keeping a food diary to track eating patterns");
      } else if (bmi >= 25) {
        tips.push("🍽️ Focus on whole foods and limit processed foods");
        tips.push("⏰ Practice mindful eating and avoid eating while distracted");
      }
    }
    
    // Age-specific tips
    if (age > 65) {
      tips.push("☀️ Get 15-20 minutes of sunlight daily for vitamin D synthesis");
      tips.push("🧠 Engage in mental activities like reading, puzzles, or learning new skills");
    }
    
    // Gender-specific tips
    if (gender === 'female' && age > 50) {
      tips.push("🦴 Focus on calcium and vitamin D intake for bone health");
    }
    
    return tips;
  }

  calculateNutritionTargets(age, gender, weight, conditions, bmi) {
    const baseCalories = this.calculateBaseCalories(age, gender, weight, bmi);
    
    const targets = {
      calories: baseCalories,
      protein: Math.round((weight || 70) * 0.8), // grams
      fiber: age > 50 ? (gender === 'female' ? 21 : 30) : (gender === 'female' ? 25 : 38), // grams
      sodium: 2300, // mg (reduced if hypertension)
      potassium: 3500, // mg
      calcium: age > 50 ? 1200 : 1000, // mg
      water: Math.round((weight || 70) * 35) // ml
    };
    
    // Adjust for conditions
    conditions.forEach(condition => {
      if (condition.condition === 'hypertension') {
        targets.sodium = 1500; // Reduced sodium for hypertension
        targets.potassium = 4700; // Increased potassium
      }
      if (condition.condition === 'elderly_nutrition') {
        targets.protein = Math.round((weight || 70) * 1.0); // Increased protein for elderly
      }
      if (condition.condition === 'underweight') {
        targets.calories += 300; // Additional calories for weight gain
        targets.protein = Math.round((weight || 70) * 1.2); // Higher protein for muscle building
      }
      if (condition.condition === 'obesity' || condition.condition === 'overweight') {
        targets.calories -= 300; // Caloric deficit for weight loss
        targets.fiber += 5; // Extra fiber for satiety
      }
    });
    
    return targets;
  }

  calculateBaseCalories(age, gender, weight, bmi) {
    const baseWeight = weight || 70; // Default weight if not provided
    
    // Simplified BMR calculation
    let bmr;
    if (gender === 'female') {
      bmr = 655 + (9.6 * baseWeight) + (1.8 * 165) - (4.7 * age);
    } else {
      bmr = 66 + (13.7 * baseWeight) + (5 * 175) - (6.8 * age);
    }
    
    // Adjust for BMI if available
    if (bmi) {
      if (bmi < 18.5) {
        bmr *= 1.2; // Increase for underweight individuals
      } else if (bmi >= 30) {
        bmr *= 0.9; // Slight decrease for weight loss
      }
    }
    
    return Math.round(bmr);
  }

  getChronicConditionRecommendations(condition) {
    const recommendations = {
      diabetes: ['low_glycemic', 'high_fiber', 'portion_control'],
      hypertension: ['low_sodium', 'potassium_rich', 'dash_diet'],
      heart_disease: ['heart_healthy', 'omega3_rich', 'low_saturated_fat'],
      arthritis: ['anti_inflammatory', 'omega3_rich', 'antioxidant_rich'],
      osteoporosis: ['calcium_rich', 'vitamin_d', 'protein_focus']
    };
    
    return recommendations[condition.toLowerCase()] || ['balanced_diet'];
  }

  async enhanceWithAI(basePlan, userData, vitals, riskLevel, healthHistory) {
    const prompt = this.buildAIPrompt(basePlan, userData, vitals, riskLevel, healthHistory);
    
    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a certified nutritionist and wellness expert. Provide personalized, safe, and evidence-based recommendations. Always include disclaimers about consulting healthcare professionals."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });
    
    const aiResponse = completion.choices[0].message.content;
    
    // Parse AI response and enhance the base plan
    const enhancedPlan = this.parseAIResponse(aiResponse, basePlan);
    enhancedPlan.plan_type = 'ai_enhanced';
    enhancedPlan.ai_insights = aiResponse;
    
    return enhancedPlan;
  }

  buildAIPrompt(basePlan, userData, vitals, riskLevel, healthHistory) {
    const bmiInfo = userData.weight && userData.height ? 
      `BMI: ${(userData.weight / Math.pow(userData.height / 100, 2)).toFixed(1)}` : 
      'BMI: Not available';

    return `
Create a personalized wellness plan for:
- ${userData.age} year old ${userData.gender}
- Weight: ${userData.weight || 'Not provided'}kg, Height: ${userData.height || 'Not provided'}cm
- ${bmiInfo}
- Current vitals: HR ${vitals.heart_rate}, BP ${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic}, SpO2 ${vitals.spo2}%, Temp ${vitals.temperature}°C
- Risk level: ${riskLevel}
- Chronic conditions: ${userData.chronic_conditions?.join(', ') || 'None'}
- Recent health trends: ${healthHistory.length > 0 ? 'Multiple assessments available' : 'First assessment'}

Current rule-based plan:
${JSON.stringify(basePlan, null, 2)}

Please enhance this plan with:
1. More specific meal suggestions with portion sizes
2. Detailed exercise recommendations considering current health status and BMI
3. Specific timing for meals and activities
4. Additional lifestyle modifications
5. Warning signs to watch for

Respond in JSON format matching the original structure but with enhanced content.
    `;
  }

  parseAIResponse(aiResponse, basePlan) {
    try {
      // Try to parse JSON response
      const parsed = JSON.parse(aiResponse);
      return { ...basePlan, ...parsed };
    } catch (error) {
      // If not JSON, extract insights and keep base plan
      return {
        ...basePlan,
        ai_insights: aiResponse,
        enhanced_recommendations: this.extractRecommendations(aiResponse)
      };
    }
  }

  extractRecommendations(text) {
    // Extract key recommendations from AI text response
    const recommendations = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      if (line.includes('•') || line.includes('-') || line.includes('1.') || line.includes('2.')) {
        recommendations.push(line.trim());
      }
    });
    
    return recommendations;
  }
}