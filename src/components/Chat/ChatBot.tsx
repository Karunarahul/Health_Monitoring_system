import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Bot, User, Loader } from 'lucide-react';
import { supabase, ChatMessage, ChatConversation } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import ReactMarkdown from 'react-markdown';

interface ChatBotProps {
  isDark: boolean;
}

const ChatBot: React.FC<ChatBotProps> = ({ isDark }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
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
      createNewConversation();
    }
  }, [isOpen, user]);

  const createNewConversation = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: user.id,
        title: `Chat ${new Date().toLocaleDateString()}`,
      })
      .select()
      .single();

    if (data && !error) {
      setCurrentConversation(data);
      // Add welcome message
      const welcomeMessage = {
        id: 'welcome',
        conversation_id: data.id,
        role: 'assistant' as const,
        content: "Hello! I'm your AI health assistant. I can help you understand your vital signs, provide health insights, and answer questions about your wellness. How can I assist you today?",
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation || !user || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      conversation_id: currentConversation.id,
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Save user message to database
    await supabase.from('chat_messages').insert({
      conversation_id: currentConversation.id,
      role: 'user',
      content: inputMessage,
    });

    try {
      // Simulate AI response (replace with actual AI service)
      const aiResponse = await generateAIResponse(inputMessage, user.id);
      
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

  const generateAIResponse = async (message: string, userId: string): Promise<string> => {
    // Get user's recent health data for context
    const { data: recentVitals } = await supabase
      .from('vital_readings')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(5);

    const { data: recentPredictions } = await supabase
      .from('health_predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    // Simple AI response logic (replace with actual AI service like OpenAI)
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('heart rate') || lowerMessage.includes('pulse')) {
      if (recentVitals && recentVitals.length > 0) {
        const avgHeartRate = Math.round(recentVitals.reduce((sum, v) => sum + v.heart_rate, 0) / recentVitals.length);
        return `Based on your recent readings, your average heart rate is ${avgHeartRate} bpm. A normal resting heart rate for adults is typically between 60-100 bpm. ${avgHeartRate > 100 ? 'Your heart rate appears elevated. Consider relaxation techniques and consult a healthcare provider if this persists.' : avgHeartRate < 60 ? 'Your heart rate is on the lower side. If you\'re not an athlete and feel symptoms like dizziness, consider consulting a healthcare provider.' : 'Your heart rate appears to be in a healthy range.'}`;
      }
      return "Heart rate is an important vital sign that measures how many times your heart beats per minute. A normal resting heart rate for adults is typically between 60-100 bpm. Factors like exercise, stress, caffeine, and medications can affect your heart rate.";
    }
    
    if (lowerMessage.includes('blood pressure') || lowerMessage.includes('bp')) {
      if (recentVitals && recentVitals.length > 0) {
        const latest = recentVitals[0];
        return `Your most recent blood pressure reading was ${latest.blood_pressure_systolic}/${latest.blood_pressure_diastolic} mmHg. Normal blood pressure is typically below 120/80 mmHg. ${latest.blood_pressure_systolic > 140 || latest.blood_pressure_diastolic > 90 ? 'This reading is elevated. Consider lifestyle changes like reducing salt intake, regular exercise, and stress management. Consult your healthcare provider for proper evaluation.' : 'This reading appears to be in a healthy range.'}`;
      }
      return "Blood pressure measures the force of blood against your artery walls. It's expressed as two numbers: systolic (pressure when heart beats) over diastolic (pressure when heart rests). Normal blood pressure is typically below 120/80 mmHg.";
    }
    
    if (lowerMessage.includes('oxygen') || lowerMessage.includes('spo2')) {
      if (recentVitals && recentVitals.length > 0) {
        const avgSpo2 = Math.round(recentVitals.reduce((sum, v) => sum + v.spo2, 0) / recentVitals.length);
        return `Your average blood oxygen level (SpO₂) is ${avgSpo2}%. Normal SpO₂ levels are typically 95-100%. ${avgSpo2 < 95 ? 'This is concerning and may indicate breathing or circulation issues. Seek medical attention if you experience shortness of breath.' : avgSpo2 < 98 ? 'This is slightly below optimal but may be normal for some individuals. Monitor for any breathing difficulties.' : 'This is an excellent oxygen level, indicating good lung and heart function.'}`;
      }
      return "Blood oxygen saturation (SpO₂) measures the percentage of oxygen-carrying red blood cells in your blood. Normal levels are 95-100%. Lower levels may indicate respiratory or circulatory issues.";
    }
    
    if (lowerMessage.includes('temperature') || lowerMessage.includes('fever')) {
      if (recentVitals && recentVitals.length > 0) {
        const latest = recentVitals[0];
        return `Your most recent temperature reading was ${latest.temperature}°C. Normal body temperature is typically 36.1-37.2°C (97-99°F). ${latest.temperature > 38 ? 'This indicates a fever. Rest, stay hydrated, and monitor your symptoms. Consult a healthcare provider if fever persists or you feel very unwell.' : latest.temperature < 36 ? 'This is below normal body temperature. Ensure you\'re warm and consider consulting a healthcare provider if you feel unwell.' : 'This is within the normal temperature range.'}`;
      }
      return "Body temperature is a vital sign that indicates your body's ability to generate and get rid of heat. Normal body temperature is around 36.1-37.2°C (97-99°F). Fever typically indicates your body is fighting an infection.";
    }
    
    if (lowerMessage.includes('risk') || lowerMessage.includes('prediction')) {
      if (recentPredictions && recentPredictions.length > 0) {
        const latest = recentPredictions[0];
        return `Your most recent health assessment showed a ${latest.risk_level} risk level with a score of ${latest.risk_score}/100. ${latest.predicted_conditions.length > 0 ? `Areas of concern include: ${latest.predicted_conditions.join(', ')}. ` : ''}${latest.recommendations.length > 0 ? `Key recommendations: ${latest.recommendations.slice(0, 2).join(' ')}` : 'Continue monitoring your vital signs regularly.'}`;
      }
      return "I can help you understand your health risk assessments. These predictions are based on your vital signs and use AI to identify potential health concerns. Remember, these are for informational purposes and should not replace professional medical advice.";
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
    return null; // Don't show chat if user is not logged in
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
            >
              <MessageCircle className="w-6 h-6" />
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
            className={`fixed bottom-24 right-6 z-30 w-96 h-[500px] rounded-2xl border shadow-2xl backdrop-blur-lg ${
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
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    AI Health Assistant
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Ask me about your health data
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto h-[360px]">
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[80%] ${
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
                          <Bot className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
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
                          <ReactMarkdown className="text-sm prose prose-sm max-w-none">
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
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
                        <Bot className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
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
                  onClick={sendMessage}
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

export default ChatBot;