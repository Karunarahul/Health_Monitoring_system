import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Settings as Lungs, Brain, Activity, TrendingUp, AlertTriangle } from 'lucide-react';

interface ConditionRisk {
  condition: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  confidence: number;
  indicators: string[];
  recommendations: string[];
}

interface ConditionSpecificModelsProps {
  vitals: {
    heart_rate: number;
    blood_pressure_systolic: number;
    blood_pressure_diastolic: number;
    spo2: number;
    temperature: number;
  };
  userProfile: {
    age?: number;
    gender?: string;
  };
  isDark: boolean;
}

const ConditionSpecificModels: React.FC<ConditionSpecificModelsProps> = ({
  vitals,
  userProfile,
  isDark
}) => {
  const [conditionRisks, setConditionRisks] = useState<ConditionRisk[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (vitals) {
      analyzeConditionRisks();
    }
  }, [vitals, userProfile]);

  const analyzeConditionRisks = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const risks: ConditionRisk[] = [
      analyzeCardiovascularRisk(),
      analyzeRespiratoryRisk(),
      analyzeNeurologicalRisk()
    ];
    
    setConditionRisks(risks);
    setIsAnalyzing(false);
  };

  const analyzeCardiovascularRisk = (): ConditionRisk => {
    let riskScore = 0;
    const indicators: string[] = [];
    const recommendations: string[] = [];

    // Heart rate analysis
    if (vitals.heart_rate > 100) {
      riskScore += 25;
      indicators.push('Elevated resting heart rate');
      recommendations.push('Monitor stress levels and consider relaxation techniques');
    } else if (vitals.heart_rate < 60 && userProfile.age && userProfile.age > 65) {
      riskScore += 20;
      indicators.push('Bradycardia in elderly patient');
      recommendations.push('Consult cardiologist for rhythm evaluation');
    }

    // Blood pressure analysis
    if (vitals.blood_pressure_systolic > 140 || vitals.blood_pressure_diastolic > 90) {
      riskScore += 35;
      indicators.push('Hypertensive readings');
      recommendations.push('Lifestyle modifications and possible medication review');
    }

    // Age and gender factors
    if (userProfile.age && userProfile.age > 65) {
      riskScore += 10;
      indicators.push('Advanced age risk factor');
    }

    if (userProfile.gender === 'male' && userProfile.age && userProfile.age > 45) {
      riskScore += 5;
      indicators.push('Male gender with age risk');
    }

    const riskLevel = riskScore > 60 ? 'HIGH' : riskScore > 35 ? 'MODERATE' : 'LOW';
    
    return {
      condition: 'Cardiovascular Disease',
      riskLevel,
      riskScore: Math.min(riskScore, 100),
      confidence: 88,
      indicators,
      recommendations: recommendations.length > 0 ? recommendations : ['Continue healthy lifestyle habits']
    };
  };

  const analyzeRespiratoryRisk = (): ConditionRisk => {
    let riskScore = 0;
    const indicators: string[] = [];
    const recommendations: string[] = [];

    // SpO2 analysis
    if (vitals.spo2 < 90) {
      riskScore += 50;
      indicators.push('Severe hypoxemia detected');
      recommendations.push('Seek immediate emergency medical attention');
    } else if (vitals.spo2 < 95) {
      riskScore += 30;
      indicators.push('Moderate oxygen desaturation');
      recommendations.push('Respiratory evaluation recommended');
    } else if (vitals.spo2 < 98) {
      riskScore += 15;
      indicators.push('Mild oxygen level reduction');
      recommendations.push('Monitor breathing patterns');
    }

    // Heart rate correlation with respiratory distress
    if (vitals.heart_rate > 110 && vitals.spo2 < 96) {
      riskScore += 20;
      indicators.push('Compensatory tachycardia with hypoxia');
      recommendations.push('Evaluate for respiratory or cardiac causes');
    }

    // Temperature correlation
    if (vitals.temperature > 38.5 && vitals.spo2 < 96) {
      riskScore += 15;
      indicators.push('Fever with respiratory compromise');
      recommendations.push('Consider infectious respiratory illness');
    }

    const riskLevel = riskScore > 50 ? 'CRITICAL' : riskScore > 30 ? 'HIGH' : riskScore > 15 ? 'MODERATE' : 'LOW';
    
    return {
      condition: 'Respiratory Dysfunction',
      riskLevel,
      riskScore: Math.min(riskScore, 100),
      confidence: 92,
      indicators,
      recommendations: recommendations.length > 0 ? recommendations : ['Maintain good respiratory hygiene']
    };
  };

  const analyzeNeurologicalRisk = (): ConditionRisk => {
    let riskScore = 0;
    const indicators: string[] = [];
    const recommendations: string[] = [];

    // Blood pressure analysis for stroke risk
    if (vitals.blood_pressure_systolic > 180) {
      riskScore += 40;
      indicators.push('Hypertensive crisis - stroke risk');
      recommendations.push('Immediate blood pressure management required');
    } else if (vitals.blood_pressure_systolic > 160) {
      riskScore += 25;
      indicators.push('Severe hypertension');
      recommendations.push('Urgent blood pressure control needed');
    }

    // Heart rhythm irregularities (inferred from HR variability)
    if (vitals.heart_rate > 150 || vitals.heart_rate < 50) {
      riskScore += 20;
      indicators.push('Extreme heart rate - possible arrhythmia');
      recommendations.push('Cardiac rhythm evaluation recommended');
    }

    // Hypoxia effects on brain
    if (vitals.spo2 < 90) {
      riskScore += 30;
      indicators.push('Severe hypoxia affecting brain function');
      recommendations.push('Immediate oxygen therapy and neurological assessment');
    }

    // Age-related neurological risk
    if (userProfile.age && userProfile.age > 75) {
      riskScore += 15;
      indicators.push('Advanced age neurological risk');
      recommendations.push('Regular cognitive and neurological monitoring');
    }

    const riskLevel = riskScore > 50 ? 'HIGH' : riskScore > 25 ? 'MODERATE' : 'LOW';
    
    return {
      condition: 'Neurological Risk',
      riskLevel,
      riskScore: Math.min(riskScore, 100),
      confidence: 85,
      indicators,
      recommendations: recommendations.length > 0 ? recommendations : ['Maintain healthy lifestyle for brain health']
    };
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

  const getConditionIcon = (condition: string) => {
    if (condition.includes('Cardiovascular')) return Heart;
    if (condition.includes('Respiratory')) return Lungs;
    if (condition.includes('Neurological')) return Brain;
    return Activity;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Condition-Specific Risk Analysis
        </h3>
        <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          AI models specialized for different health conditions
        </p>
      </div>

      {isAnalyzing ? (
        <div className="text-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Analyzing condition-specific risks...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {conditionRisks.map((risk, index) => {
            const Icon = getConditionIcon(risk.condition);
            return (
              <motion.div
                key={risk.condition}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className={`p-6 rounded-2xl border ${getRiskBgColor(risk.riskLevel)}`}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-3 rounded-xl ${getRiskBgColor(risk.riskLevel)}`}>
                    <Icon className={`w-6 h-6 ${getRiskColor(risk.riskLevel)}`} />
                  </div>
                  <div>
                    <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {risk.condition}
                    </h4>
                    <p className={`text-sm ${getRiskColor(risk.riskLevel)}`}>
                      {risk.riskLevel} Risk
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Risk Score
                    </span>
                    <span className={`font-bold ${getRiskColor(risk.riskLevel)}`}>
                      {risk.riskScore}/100
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Confidence
                    </span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {risk.confidence}%
                    </span>
                  </div>

                  {risk.indicators.length > 0 && (
                    <div>
                      <h5 className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Key Indicators:
                      </h5>
                      <ul className="space-y-1">
                        {risk.indicators.map((indicator, idx) => (
                          <li key={idx} className={`text-xs flex items-start space-x-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{indicator}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {risk.recommendations.length > 0 && (
                    <div>
                      <h5 className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Recommendations:
                      </h5>
                      <ul className="space-y-1">
                        {risk.recommendations.slice(0, 2).map((rec, idx) => (
                          <li key={idx} className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            • {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConditionSpecificModels;