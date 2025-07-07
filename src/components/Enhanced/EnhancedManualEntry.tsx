import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Brain, Send, AlertCircle, CheckCircle, Info, Heart, Activity, Download, Lightbulb, TrendingUp, BarChart3, Utensils } from 'lucide-react';
import { supabase, VitalReading, HealthPrediction } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { vitalSignsSchema, VitalSignsInput } from '../../utils/validation';
import { generateHealthReport } from '../../utils/pdfGenerator';
import ExplainableAI from './ExplainableAI';
import ConditionSpecificModels from './ConditionSpecificModels';
import HealthTimeline from './HealthTimeline';
import WellnessPlan from './WellnessPlan';
import axios from 'axios';

interface EnhancedManualEntryProps {
  isDark: boolean;
}

interface PredictionResult {
  risk_score: number;
  risk_level: string;
  risk_description: string;
  urgency_level: string;
  predicted_conditions: string[];
  confidence: number;
  feedback: string;
  detailed_explanations: string[];
  recommendations: string[];
  summary: string;
  explainability?: any;
  modelContributions?: any;
  confidenceIntervals?: any;
  model_version: string;
}

const EnhancedManualEntry: React.FC<EnhancedManualEntryProps> = ({ isDark }) => {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showExplainableAI, setShowExplainableAI] = useState(false);
  const [showConditionModels, setShowConditionModels] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [currentVitals, setCurrentVitals] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'assessment' | 'wellness'>('assessment');
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<VitalSignsInput>({
    resolver: zodResolver(vitalSignsSchema),
  });

  const watchedValues = watch();

  // Temperature conversion functions
  const fahrenheitToCelsius = (fahrenheit: number) => (fahrenheit - 32) * 5/9;

  const onSubmit = async (data: VitalSignsInput) => {
    if (!user) {
      setError('Please log in to use this feature');
      return;
    }

    setIsLoading(true);
    setError('');
    
    // Convert temperature from Fahrenheit to Celsius for storage and processing
    const temperatureInCelsius = fahrenheitToCelsius(data.temperature);
    const vitalsData = {
      ...data,
      temperature: temperatureInCelsius
    };
    
    setCurrentVitals(vitalsData);

    try {
      // Save vital reading to database
      const { data: vitalReading, error: vitalError } = await supabase
        .from('vital_readings')
        .insert({
          user_id: user.id,
          heart_rate: vitalsData.heart_rate,
          blood_pressure_systolic: vitalsData.blood_pressure_systolic,
          blood_pressure_diastolic: vitalsData.blood_pressure_diastolic,
          spo2: vitalsData.spo2,
          temperature: temperatureInCelsius,
          source: 'manual',
        })
        .select()
        .single();

      if (vitalError) throw vitalError;

      // Get user profile for enhanced prediction
      const { data: profile } = await supabase
        .from('profiles')
        .select('age, gender, full_name, email')
        .eq('id', user.id)
        .single();

      // Call enhanced AI prediction API
      const response = await axios.post('http://localhost:3001/api/predict', {
        ...vitalsData,
        userId: user.id,
        age: profile?.age || 30,
        gender: profile?.gender || 'unknown',
        name: profile?.full_name || 'User',
        email: profile?.email
      });

      const predictionResult = response.data.prediction;

      // Save prediction to database
      const { error: predictionError } = await supabase
        .from('health_predictions')
        .insert({
          user_id: user.id,
          vital_reading_id: vitalReading.id,
          risk_score: predictionResult.risk_score,
          risk_level: predictionResult.risk_level,
          predicted_conditions: predictionResult.predicted_conditions,
          confidence: predictionResult.confidence,
          feedback: predictionResult.feedback,
          recommendations: predictionResult.recommendations,
          model_version: predictionResult.model_version || 'v3.0-ensemble',
        });

      if (predictionError) throw predictionError;

      setPrediction(predictionResult);
      // Keep the assessment tab active to show AI analysis results
      setActiveTab('assessment');
    } catch (err: any) {
      setError('Failed to process health assessment. Please try again.');
      console.error('Prediction error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = async () => {
    if (!user || !prediction) return;

    try {
      // Fetch recent data for report
      const { data: vitals } = await supabase
        .from('vital_readings')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(10);

      const { data: predictions } = await supabase
        .from('health_predictions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      await generateHealthReport({
        user: {
          name: profile?.full_name || 'User',
          age: profile?.age,
          gender: profile?.gender,
        },
        vitals: vitals || [],
        predictions: predictions || [],
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return isDark ? 'text-green-400' : 'text-green-600';
      case 'MODERATE': return isDark ? 'text-yellow-400' : 'text-yellow-600';
      case 'HIGH': return isDark ? 'text-orange-400' : 'text-orange-600';
      case 'CRITICAL': return isDark ? 'text-red-400' : 'text-red-600';
      default: return isDark ? 'text-slate-400' : 'text-slate-600';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'LOW': return isDark ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200';
      case 'MODERATE': return isDark ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200';
      case 'HIGH': return isDark ? 'bg-orange-900/20 border-orange-500/30' : 'bg-orange-50 border-orange-200';
      case 'CRITICAL': return isDark ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200';
      default: return isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'LOW': return CheckCircle;
      case 'MODERATE': return Info;
      case 'HIGH': return AlertCircle;
      case 'CRITICAL': return AlertCircle;
      default: return Info;
    }
  };

  if (!user) {
    return (
      <div className={`text-center py-12 rounded-2xl border ${
        isDark
          ? 'bg-slate-800/50 border-slate-700'
          : 'bg-white/70 border-slate-200'
      }`}>
        <Brain className={`w-16 h-16 mx-auto mb-4 opacity-50 ${
          isDark ? 'text-slate-600' : 'text-slate-400'
        }`} />
        <h3 className={`text-xl font-semibold mb-2 ${
          isDark ? 'text-slate-300' : 'text-slate-700'
        }`}>
          Login Required
        </h3>
        <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
          Please log in to access the enhanced AI health assessment feature
        </p>
      </div>
    );
  }

  if (showExplainableAI && prediction?.explainability) {
    return (
      <div className="space-y-6">
        <motion.button
          onClick={() => setShowExplainableAI(false)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            isDark
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>← Back to Results</span>
        </motion.button>
        
        <ExplainableAI
          explainability={prediction.explainability}
          modelContributions={prediction.modelContributions}
          confidenceIntervals={prediction.confidenceIntervals}
          isDark={isDark}
        />
      </div>
    );
  }

  if (showConditionModels && currentVitals) {
    return (
      <div className="space-y-6">
        <motion.button
          onClick={() => setShowConditionModels(false)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            isDark
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>← Back to Assessment</span>
        </motion.button>
        
        <ConditionSpecificModels
          vitals={currentVitals}
          userProfile={{ age: 30, gender: 'unknown' }}
          isDark={isDark}
        />
      </div>
    );
  }

  if (showTimeline) {
    return (
      <div className="space-y-6">
        <motion.button
          onClick={() => setShowTimeline(false)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            isDark
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>← Back to Assessment</span>
        </motion.button>
        
        <HealthTimeline isDark={isDark} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent`}>
            Enhanced AI Health Assessment
          </h1>
        </div>
        <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Advanced ensemble AI with condition-specific models and personalized wellness plans
        </p>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="flex justify-center space-x-2">
        <motion.button
          onClick={() => setActiveTab('assessment')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
            activeTab === 'assessment'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
              : isDark
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Brain className="w-4 h-4" />
          <span>Health Assessment</span>
        </motion.button>
        
        <motion.button
          onClick={() => setActiveTab('wellness')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
            activeTab === 'wellness'
              ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
              : isDark
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Utensils className="w-4 h-4" />
          <span>Wellness Plan</span>
        </motion.button>
        
        <motion.button
          onClick={() => setShowTimeline(true)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            isDark
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Timeline</span>
        </motion.button>
        
        {currentVitals && (
          <motion.button
            onClick={() => setShowConditionModels(true)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isDark
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Condition Analysis</span>
          </motion.button>
        )}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'assessment' ? (
          <motion.div
            key="assessment"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Enhanced Form */}
            <div className={`p-8 rounded-2xl border backdrop-blur-lg ${
              isDark
                ? 'bg-slate-800/50 border-slate-700'
                : 'bg-white/70 border-slate-200'
            }`}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <h3 className={`text-lg font-semibold flex items-center space-x-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <Activity className="w-5 h-5" />
                  <span>Enter Your Vital Signs</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Heart Rate <span className="text-xs opacity-70">(bpm)</span>
                    </label>
                    <input
                      type="number"
                      {...register('heart_rate', { valueAsNumber: true })}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                        isDark
                          ? 'bg-slate-700/50 border-slate-600 text-white focus:border-indigo-500'
                          : 'bg-white/50 border-slate-300 text-slate-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        errors.heart_rate ? 'border-red-500' : ''
                      }`}
                      placeholder="Normal: 60-100"
                    />
                    {errors.heart_rate && (
                      <p className="mt-1 text-sm text-red-500">{errors.heart_rate.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Blood Oxygen <span className="text-xs opacity-70">(SpO₂ %)</span>
                    </label>
                    <input
                      type="number"
                      {...register('spo2', { valueAsNumber: true })}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                        isDark
                          ? 'bg-slate-700/50 border-slate-600 text-white focus:border-indigo-500'
                          : 'bg-white/50 border-slate-300 text-slate-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        errors.spo2 ? 'border-red-500' : ''
                      }`}
                      placeholder="Normal: 95-100%"
                    />
                    {errors.spo2 && (
                      <p className="mt-1 text-sm text-red-500">{errors.spo2.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Systolic BP <span className="text-xs opacity-70">(mmHg)</span>
                    </label>
                    <input
                      type="number"
                      {...register('blood_pressure_systolic', { valueAsNumber: true })}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                        isDark
                          ? 'bg-slate-700/50 border-slate-600 text-white focus:border-indigo-500'
                          : 'bg-white/50 border-slate-300 text-slate-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        errors.blood_pressure_systolic ? 'border-red-500' : ''
                      }`}
                      placeholder="Normal: 90-120"
                    />
                    {errors.blood_pressure_systolic && (
                      <p className="mt-1 text-sm text-red-500">{errors.blood_pressure_systolic.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Diastolic BP <span className="text-xs opacity-70">(mmHg)</span>
                    </label>
                    <input
                      type="number"
                      {...register('blood_pressure_diastolic', { valueAsNumber: true })}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                        isDark
                          ? 'bg-slate-700/50 border-slate-600 text-white focus:border-indigo-500'
                          : 'bg-white/50 border-slate-300 text-slate-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        errors.blood_pressure_diastolic ? 'border-red-500' : ''
                      }`}
                      placeholder="Normal: 60-80"
                    />
                    {errors.blood_pressure_diastolic && (
                      <p className="mt-1 text-sm text-red-500">{errors.blood_pressure_diastolic.message}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Body Temperature <span className="text-xs opacity-70">(°F)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="89.6"
                      max="113"
                      {...register('temperature', { valueAsNumber: true })}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                        isDark
                          ? 'bg-slate-700/50 border-slate-600 text-white focus:border-indigo-500'
                          : 'bg-white/50 border-slate-300 text-slate-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        errors.temperature ? 'border-red-500' : ''
                      }`}
                      placeholder="Normal: 97-99°F"
                    />
                    {errors.temperature && (
                      <p className="mt-1 text-sm text-red-500">{errors.temperature.message}</p>
                    )}
                  </div>
                </div>

                {/* Real-time preview */}
                {Object.values(watchedValues).some(v => v !== undefined && v !== '') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`p-4 rounded-lg border ${
                      isDark ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Preview:
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {watchedValues.heart_rate && (
                        <div>HR: {watchedValues.heart_rate} bpm</div>
                      )}
                      {watchedValues.spo2 && (
                        <div>SpO₂: {watchedValues.spo2}%</div>
                      )}
                      {watchedValues.blood_pressure_systolic && watchedValues.blood_pressure_diastolic && (
                        <div>BP: {watchedValues.blood_pressure_systolic}/{watchedValues.blood_pressure_diastolic}</div>
                      )}
                      {watchedValues.temperature && (
                        <div>
                          Temp: {watchedValues.temperature}°F
                          <span className="text-xs opacity-70 ml-1">
                            ({fahrenheitToCelsius(watchedValues.temperature).toFixed(1)}°C)
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Analyze with Enhanced AI</span>
                    </>
                  )}
                </motion.button>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-4 rounded-xl border flex items-center space-x-2 ${
                        isDark
                          ? 'bg-red-900/20 border-red-500/30 text-red-400'
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}
                    >
                      <AlertCircle className="w-5 h-5" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>

            {/* Enhanced Results */}
            <div className={`p-8 rounded-2xl border backdrop-blur-lg ${
              isDark
                ? 'bg-slate-800/50 border-slate-700'
                : 'bg-white/70 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Enhanced AI Analysis
                </h3>
                {prediction && (
                  <div className="flex space-x-2">
                    {prediction.explainability && (
                      <motion.button
                        onClick={() => setShowExplainableAI(true)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? 'hover:bg-slate-700 text-slate-400'
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="View Explainable AI Analysis"
                      >
                        <Lightbulb className="w-5 h-5" />
                      </motion.button>
                    )}
                    <motion.button
                      onClick={downloadReport}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark
                          ? 'hover:bg-slate-700 text-slate-400'
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Download className="w-5 h-5" />
                    </motion.button>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {prediction ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Enhanced Summary Card */}
                    <div className={`p-6 rounded-xl border ${getRiskBgColor(prediction.risk_level)}`}>
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-full ${getRiskBgColor(prediction.risk_level)}`}>
                          {React.createElement(getRiskIcon(prediction.risk_level), {
                            className: `w-6 h-6 ${getRiskColor(prediction.risk_level)}`
                          })}
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-xl font-bold mb-2 ${getRiskColor(prediction.risk_level)}`}>
                            {prediction.risk_description}
                          </h4>
                          <p className={`text-lg font-medium mb-4 ${getRiskColor(prediction.risk_level)}`}>
                            {prediction.urgency_level}
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${getRiskColor(prediction.risk_level)}`}>
                                {prediction.risk_score}/100
                              </div>
                              <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                Risk Score
                              </div>
                            </div>
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${getRiskColor(prediction.risk_level)}`}>
                                {prediction.confidence}%
                              </div>
                              <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                Confidence
                              </div>
                            </div>
                          </div>
                          
                          {prediction.model_version && (
                            <div className="mt-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {prediction.model_version}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Feedback */}
                    <div>
                      <h4 className={`text-lg font-semibold mb-3 flex items-center space-x-2 ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        <Heart className="w-5 h-5" />
                        <span>AI Health Insights</span>
                      </h4>
                      <div className={`p-4 rounded-lg ${
                        isDark
                          ? 'bg-slate-700/50 text-slate-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-line">{prediction.feedback}</p>
                      </div>
                    </div>

                    {/* Enhanced Recommendations */}
                    {prediction.recommendations && prediction.recommendations.length > 0 && (
                      <div>
                        <h4 className={`text-lg font-semibold mb-3 ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          Personalized Recommendations
                        </h4>
                        <div className="space-y-2">
                          {prediction.recommendations.map((recommendation, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`flex items-start space-x-3 p-3 rounded-lg ${
                                isDark
                                  ? 'bg-blue-900/20 border border-blue-500/30'
                                  : 'bg-blue-50 border border-blue-200'
                              }`}
                            >
                              <CheckCircle className={`w-5 h-5 mt-0.5 ${
                                isDark ? 'text-blue-400' : 'text-blue-600'
                              }`} />
                              <p className={`text-sm leading-relaxed ${
                                isDark ? 'text-blue-300' : 'text-blue-700'
                              }`}>
                                {recommendation}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Model Information */}
                    {prediction.model_version === 'v3.0-ensemble' && (
                      <div className={`p-4 rounded-lg border-l-4 border-purple-500 ${
                        isDark ? 'bg-purple-900/20' : 'bg-purple-50'
                      }`}>
                        <h4 className={`font-semibold mb-2 ${
                          isDark ? 'text-purple-300' : 'text-purple-700'
                        }`}>
                          🤖 Enhanced AI Analysis
                        </h4>
                        <p className={`text-sm ${
                          isDark ? 'text-purple-200' : 'text-purple-600'
                        }`}>
                          This assessment used our advanced ensemble AI with 4 specialized models: 
                          cardiovascular, respiratory, metabolic, and general health analysis. 
                          {prediction.explainability && ' Click the lightbulb icon to see detailed explanations.'}
                        </p>
                      </div>
                    )}

                    {/* Summary */}
                    <div className={`p-4 rounded-lg border-l-4 ${
                      prediction.risk_level === 'LOW' 
                        ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20'
                        : prediction.risk_level === 'MODERATE'
                        ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/20'
                        : prediction.risk_level === 'HIGH'
                        ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/20'
                        : 'border-red-500 bg-red-50/50 dark:bg-red-900/20'
                    }`}>
                      <p className={`font-medium ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {prediction.summary}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className={`text-center py-12 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">
                      Ready for Enhanced AI Analysis
                    </p>
                    <p className="text-sm">
                      Enter your vital signs to get advanced AI insights with explainable predictions, 
                      condition-specific analysis, and personalized health timeline
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="wellness"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <WellnessPlan
              vitals={currentVitals}
              prediction={prediction}
              isDark={isDark}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedManualEntry;