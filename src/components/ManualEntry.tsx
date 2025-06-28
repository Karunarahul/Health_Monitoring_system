import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Brain, User, Calendar, Send, AlertCircle, CheckCircle, Info, Heart, Activity } from 'lucide-react';

interface ManualEntryProps {
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
}

const ManualEntry: React.FC<ManualEntryProps> = ({ isDark }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    heart_rate: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    spo2: '',
    temperature: ''
  });
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const vitalsData = {
        ...formData,
        age: parseInt(formData.age),
        heart_rate: parseInt(formData.heart_rate),
        blood_pressure_systolic: parseInt(formData.blood_pressure_systolic),
        blood_pressure_diastolic: parseInt(formData.blood_pressure_diastolic),
        spo2: parseInt(formData.spo2),
        temperature: parseFloat(formData.temperature)
      };

      const response = await axios.post('http://localhost:3001/api/predict', vitalsData);
      setPrediction(response.data.prediction);
    } catch (err) {
      setError('Failed to get prediction. Please check your inputs and try again.');
      console.error('Prediction error:', err);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent`}>
            Personal Health Assessment
          </h1>
        </div>
        <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Get instant, easy-to-understand health insights from your vital signs
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`p-8 rounded-2xl border backdrop-blur-lg ${
            isDark
              ? 'bg-slate-800/50 border-slate-700'
              : 'bg-white/70 border-slate-200'
          }`}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold flex items-center space-x-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <User className="w-5 h-5" />
                <span>About You</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isDark
                        ? 'bg-slate-700/50 border-slate-600 text-white focus:border-purple-500'
                        : 'bg-white/50 border-slate-300 text-slate-900 focus:border-purple-500'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="120"
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isDark
                        ? 'bg-slate-700/50 border-slate-600 text-white focus:border-purple-500'
                        : 'bg-white/50 border-slate-300 text-slate-900 focus:border-purple-500'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                    placeholder="Your age"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                    isDark
                      ? 'bg-slate-700/50 border-slate-600 text-white focus:border-purple-500'
                      : 'bg-white/50 border-slate-300 text-slate-900 focus:border-purple-500'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Vital Signs */}
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold flex items-center space-x-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <Activity className="w-5 h-5" />
                <span>Your Vital Signs</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Heart Rate <span className="text-xs opacity-70">(beats per minute)</span>
                  </label>
                  <input
                    type="number"
                    name="heart_rate"
                    value={formData.heart_rate}
                    onChange={handleInputChange}
                    required
                    min="30"
                    max="200"
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isDark
                        ? 'bg-slate-700/50 border-slate-600 text-white focus:border-purple-500'
                        : 'bg-white/50 border-slate-300 text-slate-900 focus:border-purple-500'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                    placeholder="Normal: 60-100"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Blood Oxygen <span className="text-xs opacity-70">(SpO₂ percentage)</span>
                  </label>
                  <input
                    type="number"
                    name="spo2"
                    value={formData.spo2}
                    onChange={handleInputChange}
                    required
                    min="70"
                    max="100"
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isDark
                        ? 'bg-slate-700/50 border-slate-600 text-white focus:border-purple-500'
                        : 'bg-white/50 border-slate-300 text-slate-900 focus:border-purple-500'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                    placeholder="Normal: 95-100%"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Upper Blood Pressure <span className="text-xs opacity-70">(systolic)</span>
                  </label>
                  <input
                    type="number"
                    name="blood_pressure_systolic"
                    value={formData.blood_pressure_systolic}
                    onChange={handleInputChange}
                    required
                    min="70"
                    max="250"
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isDark
                        ? 'bg-slate-700/50 border-slate-600 text-white focus:border-purple-500'
                        : 'bg-white/50 border-slate-300 text-slate-900 focus:border-purple-500'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                    placeholder="Normal: 90-120"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Lower Blood Pressure <span className="text-xs opacity-70">(diastolic)</span>
                  </label>
                  <input
                    type="number"
                    name="blood_pressure_diastolic"
                    value={formData.blood_pressure_diastolic}
                    onChange={handleInputChange}
                    required
                    min="40"
                    max="150"
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isDark
                        ? 'bg-slate-700/50 border-slate-600 text-white focus:border-purple-500'
                        : 'bg-white/50 border-slate-300 text-slate-900 focus:border-purple-500'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                    placeholder="Normal: 60-80"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Body Temperature <span className="text-xs opacity-70">(Celsius)</span>
                  </label>
                  <input
                    type="number"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleInputChange}
                    required
                    min="30"
                    max="45"
                    step="0.1"
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isDark
                        ? 'bg-slate-700/50 border-slate-600 text-white focus:border-purple-500'
                        : 'bg-white/50 border-slate-300 text-slate-900 focus:border-purple-500'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                    placeholder="Normal: 36.1-37.2°C"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Get My Health Assessment</span>
                </>
              )}
            </motion.button>

            {/* Error Message */}
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
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`p-8 rounded-2xl border backdrop-blur-lg ${
            isDark
              ? 'bg-slate-800/50 border-slate-700'
              : 'bg-white/70 border-slate-200'
          }`}
        >
          <h3 className={`text-lg font-semibold mb-6 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Your Health Assessment
          </h3>

          <AnimatePresence>
            {prediction ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Summary Card */}
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
                      <p className={`text-lg font-medium mb-2 ${getRiskColor(prediction.risk_level)}`}>
                        {prediction.urgency_level}
                      </p>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getRiskColor(prediction.risk_level)}`}>
                            {prediction.risk_score}/100
                          </div>
                          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Risk Score
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`text-xl font-bold ${getRiskColor(prediction.risk_level)}`}>
                            {prediction.confidence}%
                          </div>
                          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Confidence
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Feedback */}
                <div>
                  <h4 className={`text-lg font-semibold mb-3 flex items-center space-x-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    <Heart className="w-5 h-5" />
                    <span>What This Means for You</span>
                  </h4>
                  <div className={`p-4 rounded-lg ${
                    isDark
                      ? 'bg-slate-700/50 text-slate-300'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    <p className="leading-relaxed whitespace-pre-line">{prediction.feedback}</p>
                  </div>
                </div>

                {/* Detailed Explanations */}
                {prediction.detailed_explanations && prediction.detailed_explanations.length > 0 && (
                  <div>
                    <h4 className={`text-lg font-semibold mb-3 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      Understanding Your Results
                    </h4>
                    <div className="space-y-3">
                      {prediction.detailed_explanations.map((explanation, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-3 rounded-lg ${
                            isDark
                              ? 'bg-slate-700/30 text-slate-300'
                              : 'bg-slate-50 text-slate-700'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{explanation}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {prediction.recommendations && prediction.recommendations.length > 0 && (
                  <div>
                    <h4 className={`text-lg font-semibold mb-3 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      Recommended Actions
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
                  Ready to analyze your health
                </p>
                <p className="text-sm">
                  Fill in your vital signs to get personalized health insights that are easy to understand
                </p>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default ManualEntry;