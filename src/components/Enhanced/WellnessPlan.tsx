import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Utensils, 
  Activity, 
  RefreshCw, 
  Download, 
  ChevronDown, 
  ChevronUp,
  Heart,
  Droplets,
  Moon,
  Zap,
  Target,
  Clock,
  Award,
  TrendingUp,
  Calculator
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { apiClient } from '../../utils/apiClient';

interface WellnessPlanProps {
  vitals: {
    heart_rate: number;
    blood_pressure_systolic: number;
    blood_pressure_diastolic: number;
    spo2: number;
    temperature: number;
  } | null;
  prediction: {
    risk_level: string;
    risk_score: number;
  } | null;
  isDark: boolean;
}

interface WellnessPlan {
  meal_plan: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
  };
  lifestyle_tips: string[];
  nutrition_targets: {
    calories: number;
    protein: number;
    fiber: number;
    sodium: number;
    potassium: number;
    calcium: number;
    water: number;
  };
  health_focus_areas: any[];
  bmi_info?: {
    value: number;
    category: string;
    recommendations: string[];
  };
  plan_type: string;
  generated_at: string;
  note: string;
}

const WellnessPlan: React.FC<WellnessPlanProps> = ({ vitals, prediction, isDark }) => {
  const [wellnessPlan, setWellnessPlan] = useState<WellnessPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    meals: true,
    lifestyle: false,
    nutrition: false,
    bmi: false,
    insights: false
  });
  const [userProfile, setUserProfile] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (vitals && prediction && userProfile) {
      generateWellnessPlan();
    }
  }, [vitals, prediction, userProfile]);

  const fetchUserProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data && !error) {
      setUserProfile(data);
    }
  };

  const generateWellnessPlan = async () => {
    setIsLoading(true);
    
    try {
      // Get recent health history
      const { data: recentPredictions } = await supabase
        .from('health_predictions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const userData = {
        name: userProfile.full_name || 'User',
        age: userProfile.age || 30,
        gender: userProfile.gender || 'unknown',
        weight: userProfile.weight,
        height: userProfile.height,
        chronic_conditions: [] // Could be added to profile
      };

      // Call backend wellness plan API
      const response = await apiClient.generateWellnessPlan(
        userData,
        vitals,
        prediction!.risk_level,
        recentPredictions || []
      );

      setWellnessPlan(response);
    } catch (error) {
      console.error('Failed to generate wellness plan:', error);
      // Fallback to basic plan
      setWellnessPlan(generateBasicPlan());
    } finally {
      setIsLoading(false);
    }
  };

  const generateBasicPlan = (): WellnessPlan => {
    const bmi = userProfile?.weight && userProfile?.height ? 
      userProfile.weight / Math.pow(userProfile.height / 100, 2) : null;

    return {
      meal_plan: {
        breakfast: "Oatmeal with fresh berries and nuts",
        lunch: "Grilled chicken salad with mixed vegetables",
        dinner: "Baked salmon with quinoa and steamed broccoli",
        snacks: "Greek yogurt with almonds or fresh fruit"
      },
      lifestyle_tips: [
        "💧 Drink 8-10 glasses of water daily",
        "🚶‍♀️ Take a 30-minute walk daily",
        "😴 Get 7-9 hours of quality sleep",
        "🧘‍♀️ Practice 10 minutes of meditation or deep breathing"
      ],
      nutrition_targets: {
        calories: 2000,
        protein: 60,
        fiber: 25,
        sodium: 2300,
        potassium: 3500,
        calcium: 1000,
        water: 2500
      },
      health_focus_areas: [],
      bmi_info: bmi ? {
        value: parseFloat(bmi.toFixed(1)),
        category: getBMICategory(bmi),
        recommendations: getBMIRecommendations(bmi)
      } : undefined,
      plan_type: 'basic',
      generated_at: new Date().toISOString(),
      note: "These recommendations are based on your current vitals and are for guidance only."
    };
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const getBMIRecommendations = (bmi: number) => {
    if (bmi < 18.5) {
      return ['Focus on nutrient-dense foods', 'Include healthy fats', 'Consider strength training'];
    } else if (bmi < 25) {
      return ['Maintain current healthy weight', 'Continue regular activity', 'Focus on whole foods'];
    } else if (bmi < 30) {
      return ['Create moderate caloric deficit', 'Increase physical activity', 'Focus on high-fiber foods'];
    } else {
      return ['Consult healthcare provider', 'Focus on sustainable changes', 'Prioritize low-impact exercises'];
    }
  };

  const getBMIColor = (category: string) => {
    switch (category) {
      case 'Underweight': return isDark ? 'text-blue-400' : 'text-blue-600';
      case 'Normal weight': return isDark ? 'text-green-400' : 'text-green-600';
      case 'Overweight': return isDark ? 'text-yellow-400' : 'text-yellow-600';
      case 'Obese': return isDark ? 'text-red-400' : 'text-red-600';
      default: return isDark ? 'text-slate-400' : 'text-slate-600';
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const downloadPlan = () => {
    if (!wellnessPlan) return;

    const planText = `
PERSONALIZED WELLNESS PLAN
Generated: ${new Date(wellnessPlan.generated_at).toLocaleDateString()}

${wellnessPlan.bmi_info ? `BMI: ${wellnessPlan.bmi_info.value} (${wellnessPlan.bmi_info.category})` : ''}

MEAL PLAN:
Breakfast: ${wellnessPlan.meal_plan.breakfast}
Lunch: ${wellnessPlan.meal_plan.lunch}
Dinner: ${wellnessPlan.meal_plan.dinner}
Snacks: ${wellnessPlan.meal_plan.snacks}

LIFESTYLE TIPS:
${wellnessPlan.lifestyle_tips.map(tip => `• ${tip}`).join('\n')}

NUTRITION TARGETS:
• Calories: ${wellnessPlan.nutrition_targets.calories}
• Protein: ${wellnessPlan.nutrition_targets.protein}g
• Fiber: ${wellnessPlan.nutrition_targets.fiber}g
• Sodium: ${wellnessPlan.nutrition_targets.sodium}mg
• Water: ${wellnessPlan.nutrition_targets.water}ml

${wellnessPlan.note}
    `;

    const blob = new Blob([planText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wellness-plan-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return isDark ? 'text-green-400' : 'text-green-600';
      case 'MODERATE': return isDark ? 'text-yellow-400' : 'text-yellow-600';
      case 'HIGH': return isDark ? 'text-orange-400' : 'text-orange-600';
      case 'CRITICAL': return isDark ? 'text-red-400' : 'text-red-600';
      default: return isDark ? 'text-slate-400' : 'text-slate-600';
    }
  };

  if (!user) {
    return (
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-indigo-200'
      }`}>
        <div className="text-center">
          <Utensils className={`w-12 h-12 mx-auto mb-3 opacity-50 ${
            isDark ? 'text-slate-600' : 'text-slate-400'
          }`} />
          <h3 className={`text-lg font-semibold mb-2 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Login Required
          </h3>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            Please log in to access personalized wellness plans
          </p>
        </div>
      </div>
    );
  }

  // Check if prediction is null
  if (!prediction) {
    return (
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-indigo-200'
      }`}>
        <div className="text-center">
          <Utensils className={`w-12 h-12 mx-auto mb-3 opacity-50 ${
            isDark ? 'text-slate-600' : 'text-slate-400'
          }`} />
          <h3 className={`text-lg font-semibold mb-2 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Health Assessment Required
          </h3>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            Please complete a health assessment to generate your personalized wellness plan
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-2xl border ${
      isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-indigo-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-blue-500">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Personalized Wellness Plan
            </h3>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Tailored for your {prediction.risk_level.toLowerCase()} risk level
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <motion.button
            onClick={generateWellnessPlan}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
            } disabled:opacity-50`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
          
          {wellnessPlan && (
            <motion.button
              onClick={downloadPlan}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Generating your personalized wellness plan...
          </p>
        </div>
      ) : wellnessPlan ? (
        <div className="space-y-4">
          {/* Plan Status */}
          <div className={`p-4 rounded-lg border-l-4 ${
            prediction.risk_level === 'LOW' 
              ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20'
              : prediction.risk_level === 'MODERATE'
              ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/20'
              : prediction.risk_level === 'HIGH'
              ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/20'
              : 'border-red-500 bg-red-50/50 dark:bg-red-900/20'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`font-semibold ${getRiskColor(prediction.risk_level)}`}>
                  Plan optimized for {prediction.risk_level} risk level
                </h4>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Generated using {wellnessPlan.plan_type === 'ai_enhanced' ? 'AI-enhanced' : 'rule-based'} analysis
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Award className={`w-5 h-5 ${getRiskColor(prediction.risk_level)}`} />
                <span className={`text-sm font-medium ${getRiskColor(prediction.risk_level)}`}>
                  Personalized
                </span>
              </div>
            </div>
          </div>

          {/* BMI Section */}
          {wellnessPlan.bmi_info && (
            <div className={`border rounded-xl ${
              isDark ? 'border-slate-700' : 'border-indigo-200'
            }`}>
              <button
                onClick={() => toggleSection('bmi')}
                className={`w-full p-4 flex items-center justify-between transition-colors ${
                  isDark ? 'hover:bg-slate-700/50' : 'hover:bg-indigo-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Calculator className={`w-5 h-5 ${getBMIColor(wellnessPlan.bmi_info.category)}`} />
                  <div className="text-left">
                    <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      BMI Analysis: {wellnessPlan.bmi_info.value}
                    </h4>
                    <p className={`text-sm ${getBMIColor(wellnessPlan.bmi_info.category)}`}>
                      {wellnessPlan.bmi_info.category}
                    </p>
                  </div>
                </div>
                {expandedSections.bmi ? (
                  <ChevronUp className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                ) : (
                  <ChevronDown className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                )}
              </button>
              
              <AnimatePresence>
                {expandedSections.bmi && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 space-y-3">
                      <div className={`p-3 rounded-lg ${
                        isDark ? 'bg-slate-700/50' : 'bg-indigo-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Your BMI
                          </span>
                          <span className={`text-2xl font-bold ${getBMIColor(wellnessPlan.bmi_info.category)}`}>
                            {wellnessPlan.bmi_info.value}
                          </span>
                        </div>
                        <div className={`text-center text-sm font-medium ${getBMIColor(wellnessPlan.bmi_info.category)}`}>
                          {wellnessPlan.bmi_info.category}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          BMI-Specific Recommendations:
                        </h5>
                        <div className="space-y-2">
                          {wellnessPlan.bmi_info.recommendations.map((rec, index) => (
                            <div
                              key={index}
                              className={`p-2 rounded-lg text-sm ${
                                isDark ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-50 text-slate-700'
                              }`}
                            >
                              • {rec}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Meal Plan Section */}
          <div className={`border rounded-xl ${
            isDark ? 'border-slate-700' : 'border-indigo-200'
          }`}>
            <button
              onClick={() => toggleSection('meals')}
              className={`w-full p-4 flex items-center justify-between transition-colors ${
                isDark ? 'hover:bg-slate-700/50' : 'hover:bg-indigo-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Utensils className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Daily Meal Plan
                </h4>
              </div>
              {expandedSections.meals ? (
                <ChevronUp className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              ) : (
                <ChevronDown className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSections.meals && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-4">
                    {Object.entries(wellnessPlan.meal_plan).map(([meal, description]) => (
                      <div
                        key={meal}
                        className={`p-3 rounded-lg ${
                          isDark ? 'bg-slate-700/50' : 'bg-indigo-50'
                        }`}
                      >
                        <h5 className={`font-medium mb-2 capitalize ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {meal}
                        </h5>
                        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {description}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Lifestyle Tips Section */}
          <div className={`border rounded-xl ${
            isDark ? 'border-slate-700' : 'border-indigo-200'
          }`}>
            <button
              onClick={() => toggleSection('lifestyle')}
              className={`w-full p-4 flex items-center justify-between transition-colors ${
                isDark ? 'hover:bg-slate-700/50' : 'hover:bg-indigo-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Activity className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Lifestyle Recommendations
                </h4>
              </div>
              {expandedSections.lifestyle ? (
                <ChevronUp className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              ) : (
                <ChevronDown className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSections.lifestyle && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-2">
                    {wellnessPlan.lifestyle_tips.map((tip, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-3 rounded-lg ${
                          isDark ? 'bg-slate-700/50' : 'bg-indigo-50'
                        }`}
                      >
                        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {tip}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Nutrition Targets Section */}
          <div className={`border rounded-xl ${
            isDark ? 'border-slate-700' : 'border-indigo-200'
          }`}>
            <button
              onClick={() => toggleSection('nutrition')}
              className={`w-full p-4 flex items-center justify-between transition-colors ${
                isDark ? 'hover:bg-slate-700/50' : 'hover:bg-indigo-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Target className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Daily Nutrition Targets
                </h4>
              </div>
              {expandedSections.nutrition ? (
                <ChevronUp className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              ) : (
                <ChevronDown className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSections.nutrition && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(wellnessPlan.nutrition_targets).map(([nutrient, target]) => (
                        <div
                          key={nutrient}
                          className={`p-3 rounded-lg text-center ${
                            isDark ? 'bg-slate-700/50' : 'bg-indigo-50'
                          }`}
                        >
                          <div className={`text-lg font-bold ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                            {target}
                          </div>
                          <div className={`text-xs capitalize ${
                            isDark ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            {nutrient === 'water' ? 'ml' : 
                             nutrient === 'calories' ? 'kcal' :
                             ['sodium', 'potassium', 'calcium'].includes(nutrient) ? 'mg' : 'g'}
                          </div>
                          <div className={`text-xs capitalize ${
                            isDark ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            {nutrient.replace('_', ' ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Health Focus Areas */}
          {wellnessPlan.health_focus_areas.length > 0 && (
            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-blue-900/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'
            }`}>
              <h4 className={`font-semibold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                🎯 Health Focus Areas
              </h4>
              <div className="flex flex-wrap gap-2">
                {wellnessPlan.health_focus_areas.map((area, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 rounded-full text-xs ${
                      isDark
                        ? 'bg-blue-800/50 text-blue-300'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {area.condition}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className={`p-3 rounded-lg text-xs ${
            isDark
              ? 'bg-slate-700/50 text-slate-400'
              : 'bg-indigo-100 text-slate-600'
          }`}>
            {wellnessPlan.note}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Utensils className={`w-12 h-12 mx-auto mb-3 opacity-50 ${
            isDark ? 'text-slate-600' : 'text-slate-400'
          }`} />
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Complete your health assessment to generate a personalized wellness plan
          </p>
        </div>
      )}
    </div>
  );
};

export default WellnessPlan;