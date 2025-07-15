import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '../utils/apiClient';
import { History, User, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface PredictionRecord {
  id: number;
  name: string;
  age: number;
  gender: string;
  heart_rate: number;
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  spo2: number;
  temperature: number;
  timestamp: string;
  prediction: {
    risk_score: number;
    risk_level: string;
    predicted_conditions: string[];
    confidence: number;
    feedback: string;
  };
}

interface PredictionHistoryProps {
  isDark: boolean;
}

const PredictionHistory: React.FC<PredictionHistoryProps> = ({ isDark }) => {
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionRecord | null>(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const data = await apiClient.getPredictions();
        setPredictions(data);
      } catch (error) {
        console.error('Failed to fetch predictions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPredictions();
    const interval = setInterval(fetchPredictions, 10000);
    return () => clearInterval(interval);
  }, []);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500">
            <History className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent`}>
            Prediction History
          </h1>
        </div>
        <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Review past health assessments and AI predictions
        </p>
      </motion.div>

      {predictions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center py-12 rounded-2xl border ${
            isDark
              ? 'bg-slate-800/50 border-slate-700'
              : 'bg-white/70 border-slate-200'
          }`}
        >
          <History className={`w-16 h-16 mx-auto mb-4 opacity-50 ${
            isDark ? 'text-slate-600' : 'text-slate-400'
          }`} />
          <h3 className={`text-xl font-semibold mb-2 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            No Predictions Yet
          </h3>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            Use the Health Check feature to create your first AI health assessment
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Predictions List */}
          <div className="lg:col-span-2 space-y-4">
            {predictions.map((prediction, index) => (
              <motion.div
                key={prediction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-2xl border backdrop-blur-lg cursor-pointer transition-all duration-200 ${
                  selectedPrediction?.id === prediction.id
                    ? isDark
                      ? 'bg-slate-700/50 border-purple-500/50'
                      : 'bg-purple-50/70 border-purple-300'
                    : isDark
                      ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      : 'bg-white/70 border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setSelectedPrediction(prediction)}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {prediction.name}
                      </h3>
                      <p className={`text-sm ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {prediction.age} years, {prediction.gender}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskBgColor(prediction.prediction.risk_level)} ${getRiskColor(prediction.prediction.risk_level)}`}>
                    {prediction.prediction.risk_level}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getRiskColor(prediction.prediction.risk_level)}`}>
                        {prediction.prediction.risk_score}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Risk Score
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {prediction.prediction.confidence}%
                      </div>
                      <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Confidence
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {format(new Date(prediction.timestamp), 'MMM dd, yyyy')}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {format(new Date(prediction.timestamp), 'HH:mm')}
                    </div>
                  </div>
                </div>

                {prediction.prediction.predicted_conditions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-2 text-sm">
                      <AlertCircle className={`w-4 h-4 ${
                        isDark ? 'text-yellow-400' : 'text-yellow-600'
                      }`} />
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                        {prediction.prediction.predicted_conditions.length} condition(s) identified
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-1">
            {selectedPrediction ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-6 rounded-2xl border backdrop-blur-lg sticky top-8 ${
                  isDark
                    ? 'bg-slate-800/50 border-slate-700'
                    : 'bg-white/70 border-slate-200'
                }`}
              >
                <h3 className={`text-lg font-semibold mb-4 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Assessment Details
                </h3>

                {/* Patient Info */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Name:</span>
                    <span className={isDark ? 'text-white' : 'text-slate-900'}>{selectedPrediction.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Age:</span>
                    <span className={isDark ? 'text-white' : 'text-slate-900'}>{selectedPrediction.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Gender:</span>
                    <span className={isDark ? 'text-white' : 'text-slate-900'}>{selectedPrediction.gender}</span>
                  </div>
                </div>

                {/* Vital Signs */}
                <div className="space-y-3 mb-6">
                  <h4 className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Vital Signs
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Heart Rate:</span>
                      <span className={isDark ? 'text-white' : 'text-slate-900'}>{selectedPrediction.heart_rate} bpm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Blood Pressure:</span>
                      <span className={isDark ? 'text-white' : 'text-slate-900'}>
                        {selectedPrediction.blood_pressure_systolic}/{selectedPrediction.blood_pressure_diastolic} mmHg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>SpO₂:</span>
                      <span className={isDark ? 'text-white' : 'text-slate-900'}>{selectedPrediction.spo2}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Temperature:</span>
                      <span className={isDark ? 'text-white' : 'text-slate-900'}>{selectedPrediction.temperature}°C</span>
                    </div>
                  </div>
                </div>

                {/* Predicted Conditions */}
                {selectedPrediction.prediction.predicted_conditions.length > 0 && (
                  <div className="mb-6">
                    <h4 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Predicted Conditions
                    </h4>
                    <div className="space-y-2">
                      {selectedPrediction.prediction.predicted_conditions.map((condition, index) => (
                        <div
                          key={index}
                          className={`flex items-center space-x-2 p-2 rounded-lg text-sm ${
                            isDark
                              ? 'bg-slate-700/50 text-slate-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <AlertCircle className={`w-3 h-3 ${
                            isDark ? 'text-yellow-400' : 'text-yellow-600'
                          }`} />
                          <span>{condition}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Feedback */}
                <div>
                  <h4 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    AI Feedback
                  </h4>
                  <div className={`p-3 rounded-lg text-sm leading-relaxed ${
                    isDark
                      ? 'bg-slate-700/50 text-slate-300'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {selectedPrediction.prediction.feedback}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className={`p-6 rounded-2xl border backdrop-blur-lg text-center ${
                isDark
                  ? 'bg-slate-800/50 border-slate-700'
                  : 'bg-white/70 border-slate-200'
              }`}>
                <TrendingUp className={`w-12 h-12 mx-auto mb-4 opacity-50 ${
                  isDark ? 'text-slate-600' : 'text-slate-400'
                }`} />
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  Select a prediction to view details
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionHistory;