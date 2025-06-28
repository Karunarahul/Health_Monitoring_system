import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  BarChart3, 
  Info, 
  Heart, 
  Droplets, 
  Wind, 
  Thermometer,
  Target,
  Lightbulb
} from 'lucide-react';

interface FeatureImportance {
  importance_score: number;
  impact_description: string;
  contribution_percentage: number;
}

interface Explainability {
  feature_importance: {
    heart_rate: FeatureImportance;
    blood_pressure: FeatureImportance;
    spo2: FeatureImportance;
    temperature: FeatureImportance;
  };
  explanations: {
    why_this_risk_level: string;
    key_contributing_factors: Array<{
      factor: string;
      impact: string;
      importance: number;
    }>;
    model_reasoning: {
      cardiovascular: string;
      respiratory: string;
      metabolic: string;
      general: string;
    };
    confidence_factors: string;
  };
  decision_path: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
  };
}

interface ModelContributions {
  cardiovascular: { risk_score: number; weight: number; contribution: number };
  respiratory: { risk_score: number; weight: number; contribution: number };
  metabolic: { risk_score: number; weight: number; contribution: number };
  general: { risk_score: number; weight: number; contribution: number };
}

interface ConfidenceIntervals {
  mean_confidence: number;
  confidence_range: { lower: number; upper: number };
  reliability_score: number;
}

interface ExplainableAIProps {
  explainability: Explainability;
  modelContributions: ModelContributions;
  confidenceIntervals: ConfidenceIntervals;
  isDark: boolean;
}

const ExplainableAI: React.FC<ExplainableAIProps> = ({
  explainability,
  modelContributions,
  confidenceIntervals,
  isDark
}) => {
  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'heart_rate': return Heart;
      case 'blood_pressure': return Droplets;
      case 'spo2': return Wind;
      case 'temperature': return Thermometer;
      default: return BarChart3;
    }
  };

  const getFeatureColor = (importance: number) => {
    if (importance > 0.7) return isDark ? 'text-red-400' : 'text-red-600';
    if (importance > 0.4) return isDark ? 'text-orange-400' : 'text-orange-600';
    if (importance > 0.2) return isDark ? 'text-yellow-400' : 'text-yellow-600';
    return isDark ? 'text-green-400' : 'text-green-600';
  };

  const getFeatureBgColor = (importance: number) => {
    if (importance > 0.7) return isDark ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200';
    if (importance > 0.4) return isDark ? 'bg-orange-900/20 border-orange-500/30' : 'bg-orange-50 border-orange-200';
    if (importance > 0.2) return isDark ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200';
    return isDark ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent`}>
            Explainable AI Analysis
          </h1>
        </div>
        <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Understanding how AI reached its health assessment
        </p>
      </motion.div>

      {/* Feature Importance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-2xl border ${
          isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
        }`}
      >
        <h3 className={`text-xl font-bold mb-4 flex items-center space-x-2 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          <TrendingUp className="w-6 h-6" />
          <span>Feature Importance Analysis</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(explainability.feature_importance).map(([feature, data]) => {
            const Icon = getFeatureIcon(feature);
            return (
              <motion.div
                key={feature}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-xl border ${getFeatureBgColor(data.importance_score)}`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Icon className={`w-6 h-6 ${getFeatureColor(data.importance_score)}`} />
                  <h4 className={`font-semibold capitalize ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {feature.replace('_', ' ')}
                  </h4>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Impact Score
                    </span>
                    <span className={`font-bold ${getFeatureColor(data.importance_score)}`}>
                      {data.contribution_percentage}%
                    </span>
                  </div>
                  
                  <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${data.contribution_percentage}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-2 rounded-full ${
                        data.importance_score > 0.7 ? 'bg-red-500' :
                        data.importance_score > 0.4 ? 'bg-orange-500' :
                        data.importance_score > 0.2 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                    />
                  </div>
                  
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {data.impact_description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Model Contributions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`p-6 rounded-2xl border ${
          isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
        }`}
      >
        <h3 className={`text-xl font-bold mb-4 flex items-center space-x-2 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          <BarChart3 className="w-6 h-6" />
          <span>Ensemble Model Contributions</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(modelContributions).map(([model, data]) => (
            <motion.div
              key={model}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <h4 className={`font-semibold mb-2 capitalize ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {model}
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Risk Score:
                  </span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {data.risk_score}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Weight:
                  </span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {(data.weight * 100).toFixed(0)}%
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Contribution:
                  </span>
                  <span className={`font-bold text-purple-500`}>
                    {data.contribution}
                  </span>
                </div>
                
                <div className={`w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(data.weight * 100)}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Confidence Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`p-6 rounded-2xl border ${
          isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
        }`}
      >
        <h3 className={`text-xl font-bold mb-4 flex items-center space-x-2 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          <Target className="w-6 h-6" />
          <span>Confidence Analysis</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${
              confidenceIntervals.mean_confidence >= 85 ? 'text-green-500' :
              confidenceIntervals.mean_confidence >= 70 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {confidenceIntervals.mean_confidence}%
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Mean Confidence
            </p>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {confidenceIntervals.confidence_range.lower}% - {confidenceIntervals.confidence_range.upper}%
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Confidence Range
            </p>
          </div>
          
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${
              confidenceIntervals.reliability_score >= 85 ? 'text-green-500' :
              confidenceIntervals.reliability_score >= 70 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {confidenceIntervals.reliability_score}%
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Reliability Score
            </p>
          </div>
        </div>
        
        <div className={`mt-4 p-4 rounded-lg ${
          isDark ? 'bg-slate-700/50' : 'bg-slate-100'
        }`}>
          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {explainability.explanations.confidence_factors}
          </p>
        </div>
      </motion.div>

      {/* Decision Path */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`p-6 rounded-2xl border ${
          isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
        }`}
      >
        <h3 className={`text-xl font-bold mb-4 flex items-center space-x-2 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          <Lightbulb className="w-6 h-6" />
          <span>AI Decision Process</span>
        </h3>
        
        <div className="space-y-4">
          {Object.entries(explainability.decision_path).map(([step, description], index) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-start space-x-4"
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-cyan-500`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Model Reasoning */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`p-6 rounded-2xl border ${
          isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
        }`}
      >
        <h3 className={`text-xl font-bold mb-4 flex items-center space-x-2 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          <Info className="w-6 h-6" />
          <span>Specialized Model Reasoning</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(explainability.explanations.model_reasoning).map(([model, reasoning]) => (
            <motion.div
              key={model}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <h4 className={`font-semibold mb-2 capitalize ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {model} Model
              </h4>
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {reasoning}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Key Contributing Factors */}
      {explainability.explanations.key_contributing_factors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`p-6 rounded-2xl border ${
            isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
          }`}
        >
          <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Key Contributing Factors
          </h3>
          
          <div className="space-y-3">
            {explainability.explanations.key_contributing_factors.map((factor, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`p-3 rounded-lg border-l-4 ${
                  factor.importance > 0.7 ? 'border-red-500 bg-red-50/50 dark:bg-red-900/20' :
                  factor.importance > 0.4 ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/20' :
                  'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/20'
                }`}
              >
                <h4 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {factor.factor}
                </h4>
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {factor.impact}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Risk Level Explanation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className={`p-6 rounded-2xl border ${
          isDark ? 'bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30' : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
        }`}
      >
        <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Why This Risk Level?
        </h3>
        <p className={`text-lg leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          {explainability.explanations.why_this_risk_level}
        </p>
      </motion.div>
    </div>
  );
};

export default ExplainableAI;