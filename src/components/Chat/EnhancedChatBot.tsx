import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Bot, User, Loader, Brain, Heart, TrendingUp } from 'lucide-react';
import { supabase, ChatMessage, ChatConversation } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import ReactMarkdown from 'react-markdown';

interface EnhancedChatBotProps {
  isDark: boolean;
}

interface HealthContext {
  recentVitals: any[];
  recentPredictions: any[];
  riskTrends: string;
  alertHistory: any[];
}

const EnhancedChatBot: React.FC<EnhancedChatBotProps> = ({ isDark }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [healthContext, setHealthContext] = useState<HealthContext | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && user && !currentConversation) {
      initializeChat();
    }
  }, [isOpen, user]);

  const initializeChat = async () => {
    if (!user) return;

    // Load health context
    await loadHealthContext();

    // Create or load conversation
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: user.id,
        title: `Health Chat ${new Date().toLocaleDateString()}`,
      })
      .select()
      .single();

    if (data && !error) {
      setCurrentConversation(data);
      
      // Generate personalized welcome message
      const welcomeMessage = await generateWelcomeMessage();
      const welcomeMsg = {
        id: 'welcome',
        conversation_id: data.id,
        role: 'assistant' as const,
        content: welcomeMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMsg]);

      // Generate suggested questions
      generateSuggestedQuestions();
    }
  };

  const loadHealthContext = async () => {
    if (!user) return;

    try {
      // Get recent vitals (last 7 days)
      const { data: vitals } = await supabase
        .from('vital_readings')
        .select('*')
        .eq('user_id', user.id)
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })
        .limit(20);

      // Get recent predictions (last 30 days)
      const { data: predictions } = await supabase
        .from('health_predictions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Analyze trends
      const riskTrends = analyzeRiskTrends(predictions || []);

      setHealthContext({
        recentVitals: vitals || [],
        recentPredictions: predictions || [],
        riskTrends,
        alertHistory: [] // Could be expanded to include alert history
      });
    } catch (error) {
      console.error('Error loading health context:', error);
    }
  };

  const analyzeRiskTrends = (predictions: any[]): string => {
    if (predictions.length < 2) return 'insufficient_data';
    
    const recentScores = predictions.slice(0, 5).map(p => p.risk_score);
    const olderScores = predictions.slice(5, 10).map(p => p.risk_score);
    
    if (recentScores.length === 0 || olderScores.length === 0) return 'insufficient_data';
    
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 10) return 'increasing';
    if (difference < -10) return 'decreasing';
    return 'stable';
  };

  const generateWelcomeMessage = async (): Promise<string> => {
    if (!healthContext) {
      return "Hello! I'm your AI health assistant. I can help you understand your vital signs, provide health insights, and answer questions about your wellness. How can I assist you today?";
    }

    const { recentVitals, recentPredictions, riskTrends } = healthContext;
    
    let message = "Hello! I'm your AI health assistant with access to your health data. ";
    
    if (recentPredictions.length > 0) {
      const latestPrediction = recentPredictions[0];
      message += `I see your latest health assessment showed a ${latestPrediction.risk_level} risk level. `;
      
      if (latestPrediction.risk_level === 'HIGH' || latestPrediction.risk_level === 'CRITICAL') {
        message += "I'm concerned about some of your recent readings. ";
      }
    }
    
    if (riskTrends === 'increasing') {
      message += "I notice your risk scores have been trending upward recently. ";
    } else if (riskTrends === 'decreasing') {
      message += "Good news - your risk scores have been improving! ";
    }
    
    if (recentVitals.length > 0) {
      message += `I have access to your recent ${recentVitals.length} vital sign readings. `;
    }
    
    message += "\n\nI can help you with:\n";
    message += "• Understanding your health trends\n";
    message += "• Explaining your risk assessments\n";
    message += "• Providing personalized health advice\n";
    message += "• Answering questions about your symptoms\n\n";
    message += "What would you like to know about your health today?";
    
    return message;
  };

  const generateSuggestedQuestions = () => {
    if (!healthContext) {
      setSuggestedQuestions([
        "What do my vital signs mean?",
        "How can I improve my health?",
        "What should I monitor daily?"
      ]);
      return;
    }

    const questions: string[] = [];
    const { recentPredictions, riskTrends } = healthContext;
    
    if (recentPredictions.length > 0) {
      const latestPrediction = recentPredictions[0];
      questions.push(`Why is my risk level ${latestPrediction.risk_level}?`);
      
      if (latestPrediction.predicted_conditions.length > 0) {
        questions.push(`Tell me about ${latestPrediction.predicted_conditions[0]}`);
      }
    }
    
    if (riskTrends === 'increasing') {
      questions.push("Why are my risk scores increasing?");
      questions.push("What can I do to improve my health?");
    } else if (riskTrends === 'decreasing') {
      questions.push("What am I doing right with my health?");
    }
    
    questions.push("Should I see a doctor?");
    questions.push("What symptoms should I watch for?");
    questions.push("How often should I check my vitals?");
    
    setSuggestedQuestions(questions.slice(0, 4));
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim() || !currentConversation || !user || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      conversation_id: currentConversation.id,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Save user message to database
    await supabase.from('chat_messages').insert({
      conversation_id: currentConversation.id,
      role: 'user',
      content: textToSend,
    });

    try {
      // Generate AI response with health context
      const aiResponse = await generateContextualAIResponse(textToSend);
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        conversation_id: currentConversation.id,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to database
      await supabase.from('chat_messages').insert({
        conversation_id: currentConversation.id,
        role: 'assistant',
        content: aiResponse,
      });
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        conversation_id: currentConversation.id,
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again later.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateContextualAIResponse = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (!healthContext) {
      return generateBasicResponse(message);
    }

    const { recentVitals, recentPredictions, riskTrends } = healthContext;

    // Risk level questions
    if (lowerMessage.includes('why') && (lowerMessage.includes('risk') || lowerMessage.includes('level'))) {
      if (recentPredictions.length > 0) {
        const latest = recentPredictions[0];
        let response = `Your current risk level is ${latest.risk_level} (${latest.risk_score}/100) based on several factors:\n\n`;
        
        if (latest.predicted_conditions.length > 0) {
          response += `**Identified concerns:**\n`;
          latest.predicted_conditions.forEach((condition: string) => {
            response += `• ${condition}\n`;
          });
          response += `\n`;
        }
        
        if (recentVitals.length > 0) {
          const avgVitals = calculateAverageVitals(recentVitals.slice(0, 5));
          response += `**Your recent vital signs:**\n`;
          response += `• Heart Rate: ${avgVitals.heart_rate} bpm ${avgVitals.heart_rate > 100 ? '(elevated)' : avgVitals.heart_rate < 60 ? '(low)' : '(normal)'}\n`;
          response += `• Blood Pressure: ${avgVitals.blood_pressure_systolic}/${avgVitals.blood_pressure_diastolic} mmHg ${avgVitals.blood_pressure_systolic > 140 ? '(high)' : '(normal)'}\n`;
          response += `• SpO₂: ${avgVitals.spo2}% ${avgVitals.spo2 < 95 ? '(low)' : '(good)'}\n`;
          response += `• Temperature: ${avgVitals.temperature}°C ${avgVitals.temperature > 38 ? '(fever)' : '(normal)'}\n\n`;
        }
        
        if (latest.recommendations && latest.recommendations.length > 0) {
          response += `**My recommendations:**\n`;
          latest.recommendations.slice(0, 3).forEach((rec: string) => {
            response += `• ${rec}\n`;
          });
        }
        
        return response;
      }
    }

    // Trend questions
    if (lowerMessage.includes('trend') || lowerMessage.includes('improving') || lowerMessage.includes('getting worse')) {
      let response = `Based on your recent health data:\n\n`;
      
      if (riskTrends === 'increasing') {
        response += `📈 **Trend: Increasing Risk**\nYour risk scores have been trending upward recently. `;
        
        if (recentPredictions.length >= 3) {
          const criticalCount = recentPredictions.slice(0, 5).filter(p => p.risk_level === 'CRITICAL' || p.risk_level === 'HIGH').length;
          if (criticalCount >= 2) {
            response += `You've had ${criticalCount} high-risk assessments in recent readings. This pattern suggests you should consult with a healthcare provider soon.\n\n`;
          }
        }
        
        response += `**Possible factors:**\n`;
        response += `• Stress or lifestyle changes\n`;
        response += `• Medication adherence\n`;
        response += `• Sleep or diet patterns\n`;
        response += `• Underlying health conditions\n\n`;
        response += `**I recommend:** Schedule a check-up with your doctor to discuss these trends.`;
        
      } else if (riskTrends === 'decreasing') {
        response += `📉 **Trend: Improving**\nGreat news! Your risk scores have been decreasing. `;
        response += `Whatever you're doing is working well. Keep up the good habits!\n\n`;
        response += `**Continue to:**\n`;
        response += `• Maintain your current lifestyle\n`;
        response += `• Keep monitoring your vitals\n`;
        response += `• Stay consistent with any treatments\n`;
        response += `• Celebrate your progress!`;
        
      } else {
        response += `📊 **Trend: Stable**\nYour health metrics have been relatively stable, which is generally good. `;
        response += `Consistency in your readings suggests your current health management is working.\n\n`;
        response += `**To maintain stability:**\n`;
        response += `• Continue current health practices\n`;
        response += `• Regular monitoring\n`;
        response += `• Preventive care measures`;
      }
      
      return response;
    }

    // Doctor consultation questions
    if (lowerMessage.includes('doctor') || lowerMessage.includes('see') || lowerMessage.includes('consult')) {
      let response = `Based on your health data, here's my assessment:\n\n`;
      
      if (recentPredictions.length > 0) {
        const criticalCount = recentPredictions.slice(0, 5).filter(p => p.risk_level === 'CRITICAL').length;
        const highCount = recentPredictions.slice(0, 5).filter(p => p.risk_level === 'HIGH').length;
        
        if (criticalCount > 0) {
          response += `🚨 **Urgent:** You've had ${criticalCount} CRITICAL risk assessment${criticalCount > 1 ? 's' : ''} recently. You should seek medical attention immediately.\n\n`;
        } else if (highCount >= 2) {
          response += `⚠️ **Soon:** You've had ${highCount} HIGH risk assessments recently. I recommend scheduling an appointment within the next few days.\n\n`;
        } else if (riskTrends === 'increasing') {
          response += `📅 **Routine:** While not urgent, your increasing risk trend suggests a check-up within the next 1-2 weeks would be wise.\n\n`;
        } else {
          response += `✅ **Routine:** Your current readings don't indicate urgent medical needs, but regular check-ups are always good practice.\n\n`;
        }
      }
      
      response += `**When to see a doctor immediately:**\n`;
      response += `• Chest pain or difficulty breathing\n`;
      response += `• Severe dizziness or fainting\n`;
      response += `• Persistent high fever\n`;
      response += `• Any symptoms that worry you\n\n`;
      response += `Remember: I'm an AI assistant, not a replacement for professional medical advice.`;
      
      return response;
    }

    // Symptoms questions
    if (lowerMessage.includes('symptom') || lowerMessage.includes('feel') || lowerMessage.includes('experiencing')) {
      let response = `Let me help you understand potential symptoms to watch for based on your health profile:\n\n`;
      
      if (recentPredictions.length > 0) {
        const conditions = recentPredictions[0].predicted_conditions || [];
        if (conditions.length > 0) {
          response += `**Based on your recent assessment (${conditions.join(', ')}):**\n\n`;
          
          conditions.forEach((condition: string) => {
            if (condition.toLowerCase().includes('cardiovascular') || condition.toLowerCase().includes('heart')) {
              response += `**Cardiovascular symptoms to monitor:**\n`;
              response += `• Chest pain or pressure\n`;
              response += `• Shortness of breath\n`;
              response += `• Irregular heartbeat\n`;
              response += `• Dizziness or lightheadedness\n\n`;
            }
            
            if (condition.toLowerCase().includes('respiratory') || condition.toLowerCase().includes('breathing')) {
              response += `**Respiratory symptoms to monitor:**\n`;
              response += `• Difficulty breathing\n`;
              response += `• Persistent cough\n`;
              response += `• Chest tightness\n`;
              response += `• Fatigue with minimal exertion\n\n`;
            }
          });
        }
      }
      
      response += `**General warning signs:**\n`;
      response += `• Sudden severe symptoms\n`;
      response += `• Symptoms that worsen rapidly\n`;
      response += `• Multiple symptoms occurring together\n`;
      response += `• Symptoms that interfere with daily activities\n\n`;
      response += `**Important:** If you're experiencing any concerning symptoms, don't hesitate to seek medical attention.`;
      
      return response;
    }

    // Vitals explanation
    if (lowerMessage.includes('vital') || lowerMessage.includes('reading') || lowerMessage.includes('numbers')) {
      if (recentVitals.length > 0) {
        const latest = recentVitals[0];
        const avg = calculateAverageVitals(recentVitals.slice(0, 5));
        
        let response = `Here's what your recent vital signs tell us:\n\n`;
        response += `**Latest Reading:**\n`;
        response += `• Heart Rate: ${latest.heart_rate} bpm\n`;
        response += `• Blood Pressure: ${latest.blood_pressure_systolic}/${latest.blood_pressure_diastolic} mmHg\n`;
        response += `• SpO₂: ${latest.spo2}%\n`;
        response += `• Temperature: ${latest.temperature}°C\n\n`;
        
        response += `**5-Day Average:**\n`;
        response += `• Heart Rate: ${avg.heart_rate} bpm\n`;
        response += `• Blood Pressure: ${avg.blood_pressure_systolic}/${avg.blood_pressure_diastolic} mmHg\n`;
        response += `• SpO₂: ${avg.spo2}%\n`;
        response += `• Temperature: ${avg.temperature}°C\n\n`;
        
        response += `**What this means:**\n`;
        if (avg.heart_rate > 100) {
          response += `• Your heart rate is elevated - consider stress management\n`;
        } else if (avg.heart_rate < 60) {
          response += `• Your heart rate is low - monitor for symptoms\n`;
        } else {
          response += `• Your heart rate is in a healthy range\n`;
        }
        
        if (avg.blood_pressure_systolic > 140) {
          response += `• Your blood pressure is elevated - lifestyle changes recommended\n`;
        } else {
          response += `• Your blood pressure looks good\n`;
        }
        
        if (avg.spo2 < 95) {
          response += `• Your oxygen levels are concerning - seek medical evaluation\n`;
        } else {
          response += `• Your oxygen levels are excellent\n`;
        }
        
        return response;
      }
    }

    // Fall back to basic response with context
    return generateBasicResponse(message);
  };

  const calculateAverageVitals = (vitals: any[]) => {
    if (vitals.length === 0) return {};
    
    return {
      heart_rate: Math.round(vitals.reduce((sum, v) => sum + v.heart_rate, 0) / vitals.length),
      blood_pressure_systolic: Math.round(vitals.reduce((sum, v) => sum + v.blood_pressure_systolic, 0) / vitals.length),
      blood_pressure_diastolic: Math.round(vitals.reduce((sum, v) => sum + v.blood_pressure_diastolic, 0) / vitals.length),
      spo2: Math.round(vitals.reduce((sum, v) => sum + v.spo2, 0) / vitals.length),
      temperature: (vitals.reduce((sum, v) => sum + v.temperature, 0) / vitals.length).toFixed(1),
    };
  };

  const generateBasicResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    // Basic health information responses
    if (lowerMessage.includes('heart rate') || lowerMessage.includes('pulse')) {
      return "Heart rate is an important vital sign that measures how many times your heart beats per minute. A normal resting heart rate for adults is typically between 60-100 bpm. Factors like exercise, stress, caffeine, and medications can affect your heart rate. Regular monitoring helps track your cardiovascular health.";
    }
    
    if (lowerMessage.includes('blood pressure') || lowerMessage.includes('bp')) {
      return "Blood pressure measures the force of blood against your artery walls. It's expressed as two numbers: systolic (pressure when heart beats) over diastolic (pressure when heart rests). Normal blood pressure is typically below 120/80 mmHg. High blood pressure increases risk of heart disease and stroke.";
    }
    
    if (lowerMessage.includes('oxygen') || lowerMessage.includes('spo2')) {
      return "Blood oxygen saturation (SpO₂) measures the percentage of oxygen-carrying red blood cells in your blood. Normal levels are 95-100%. Lower levels may indicate respiratory or circulatory issues. This measurement is especially important for monitoring lung and heart function.";
    }
    
    if (lowerMessage.includes('temperature') || lowerMessage.includes('fever')) {
      return "Body temperature is a vital sign that indicates your body's ability to generate and get rid of heat. Normal body temperature is around 36.1-37.2°C (97-99°F). Fever typically indicates your body is fighting an infection. Persistent fever or very high temperatures require medical attention.";
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `I can help you with:

**📊 Health Data Analysis**
- Explain your vital signs and what they mean
- Interpret your health risk assessments
- Track trends in your health data

**💡 Health Insights**
- Provide information about normal ranges for vital signs
- Explain health conditions and symptoms
- Offer general wellness tips

**🔍 Personalized Guidance**
- Review your recent health assessments
- Suggest when to consult healthcare providers
- Help you understand your health trends

**❓ General Health Questions**
- Answer questions about vital signs
- Provide health education
- Explain medical terminology

Feel free to ask me about any of your health data or general health questions!`;
    }
    
    // Default response
    return `I understand you're asking about "${message}". While I can provide general health information and help interpret your vital signs data, I recommend consulting with a healthcare professional for specific medical advice. 

Is there something specific about your health data or vital signs you'd like me to explain? I can help you understand your recent readings, risk assessments, or provide general health information.`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg ${
          isDark
            ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700'
            : 'bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600'
        } text-white transition-all duration-200`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <MessageCircle className="w-6 h-6" />
              {healthContext && healthContext.recentPredictions.some(p => p.risk_level === 'HIGH' || p.risk_level === 'CRITICAL') && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-24 right-6 z-30 w-96 h-[600px] rounded-2xl border shadow-2xl backdrop-blur-lg ${
              isDark
                ? 'bg-slate-800/95 border-slate-700'
                : 'bg-white/95 border-slate-200'
            }`}
          >
            {/* Header */}
            <div className={`p-4 border-b rounded-t-2xl ${
              isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50/50'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Enhanced AI Health Assistant
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    With access to your health data
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto h-[420px]">
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[85%] ${
                      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      <div className={`p-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-cyan-500'
                          : isDark
                            ? 'bg-slate-700'
                            : 'bg-slate-100'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Brain className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
                        )}
                      </div>
                      <div className={`p-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                          : isDark
                            ? 'bg-slate-700 text-slate-200'
                            : 'bg-slate-100 text-slate-800'
                      }`}>
                        {message.role === 'assistant' ? (
                          <ReactMarkdown className="text-sm prose prose-sm max-w-none dark:prose-invert">
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Suggested Questions */}
                {messages.length === 1 && suggestedQuestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Suggested questions:
                    </p>
                    {suggestedQuestions.map((question, index) => (
                      <motion.button
                        key={index}
                        onClick={() => sendMessage(question)}
                        className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                          isDark
                            ? 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {question}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start space-x-2">
                      <div className={`p-2 rounded-lg ${
                        isDark ? 'bg-slate-700' : 'bg-slate-100'
                      }`}>
                        <Brain className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
                      </div>
                      <div className={`p-3 rounded-2xl ${
                        isDark ? 'bg-slate-700' : 'bg-slate-100'
                      }`}>
                        <Loader className={`w-4 h-4 animate-spin ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className={`p-4 border-t ${
              isDark ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your health..."
                  className={`flex-1 px-3 py-2 rounded-xl border transition-all duration-200 ${
                    isDark
                      ? 'bg-slate-700/50 border-slate-600 text-white focus:border-purple-500'
                      : 'bg-white/50 border-slate-300 text-slate-900 focus:border-purple-500'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  disabled={isLoading}
                />
                <motion.button
                  onClick={() => sendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EnhancedChatBot;