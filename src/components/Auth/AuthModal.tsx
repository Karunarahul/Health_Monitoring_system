import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Mail, Lock, User, Eye, EyeOff, Calendar, Users, Weight, Ruler, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authSchema, AuthInput } from '../../utils/validation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, isDark }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  
  const { signIn, signUp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<AuthInput>({
    resolver: zodResolver(authSchema),
  });

  const watchedValues = watch();

  const onSubmit = async (data: AuthInput) => {
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await signUp(
          data.email, 
          data.password, 
          data.full_name || '',
          data.age,
          data.gender,
          data.weight,
          data.height
        );
        if (error) throw error;
      } else {
        const { error } = await signIn(data.email, data.password);
        if (error) throw error;
      }
      
      // Close modal and reset form after successful authentication
      onClose();
      reset();
      setCurrentStep(1);
      setError('');
      setIsSignUp(false);
    } catch (err: any) {
      // Handle specific error cases
      if (err.message?.includes('User already registered') || err.message?.includes('user_already_exists')) {
        setError('This email is already registered. Please sign in instead or use a different email address.');
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please check your email and click the confirmation link before signing in.');
      } else {
        setError(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setCurrentStep(1);
    reset();
  };

  const nextStep = () => {
    if (currentStep < 2) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const calculateBMI = () => {
    if (watchedValues.weight && watchedValues.height) {
      const heightInM = watchedValues.height / 100;
      return (watchedValues.weight / (heightInM * heightInM)).toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600' };
    return { category: 'Obese', color: 'text-red-600' };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            // Only allow closing if user clicks the backdrop and there's no error requiring attention
            if (e.target === e.currentTarget && !error.includes('already registered')) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`w-full max-w-md p-8 rounded-2xl border backdrop-blur-lg shadow-2xl ${
              isDark
                ? 'bg-slate-800/90 border-slate-700'
                : 'bg-white/95 border-indigo-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <motion.h2 
                className={`text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </motion.h2>
              <motion.button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-slate-700 text-slate-400'
                    : 'hover:bg-indigo-50 text-slate-600'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Progress Indicator for Sign Up */}
            {isSignUp && (
              <motion.div 
                className="mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Step {currentStep} of 2
                  </span>
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {currentStep === 1 ? 'Account Details' : 'Physical Details'}
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-indigo-100'}`}>
                  <motion.div
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    initial={{ width: '50%' }}
                    animate={{ width: currentStep === 1 ? '50%' : '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <AnimatePresence mode="wait">
                {(!isSignUp || currentStep === 1) && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {isSignUp && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          Full Name
                        </label>
                        <div className="relative">
                          <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`} />
                          <input
                            type="text"
                            {...register('full_name')}
                            className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 ${
                              isDark
                                ? 'bg-slate-700/50 border-slate-600 text-white focus:border-indigo-500'
                                : 'bg-white/70 border-indigo-300 text-slate-900 focus:border-indigo-500'
                            } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                              errors.full_name ? 'border-red-500' : ''
                            }`}
                            placeholder="Enter your full name"
                          />
                        </div>
                        {errors.full_name && (
                          <motion.p 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1 text-sm text-red-500"
                          >
                            {errors.full_name.message}
                          </motion.p>
                        )}
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: isSignUp ? 0.2 : 0.1 }}
                    >
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        Email
                      </label>
                      <div className="relative">
                        <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`} />
                        <input
                          type="email"
                          {...register('email')}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 ${
                            isDark
                              ? 'bg-slate-700/50 border-slate-600 text-white focus:border-indigo-500'
                              : 'bg-white/70 border-indigo-300 text-slate-900 focus:border-indigo-500'
                          } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                            errors.email ? 'border-red-500' : ''
                          }`}
                          placeholder="Enter your email"
                        />
                      </div>
                      {errors.email && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-sm text-red-500"
                        >
                          {errors.email.message}
                        </motion.p>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: isSignUp ? 0.3 : 0.2 }}
                    >
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        Password
                      </label>
                      <div className="relative">
                        <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          {...register('password')}
                          className={`w-full pl-10 pr-12 py-3 rounded-xl border transition-all duration-200 ${
                            isDark
                              ? 'bg-slate-700/50 border-slate-600 text-white focus:border-indigo-500'
                              : 'bg-white/70 border-indigo-300 text-slate-900 focus:border-indigo-500'
                          } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                            errors.password ? 'border-red-500' : ''
                          }`}
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-sm text-red-500"
                        >
                          {errors.password.message}
                        </motion.p>
                      )}
                    </motion.div>

                    {isSignUp && (
                      <div className="grid grid-cols-2 gap-4">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <label className={`block text-sm font-medium mb-2 ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            Age
                          </label>
                          <div className="relative">
                            <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                              isDark ? 'text-slate-400' : 'text-slate-500'
                            }`} />
                            <input
                              type="number"
                              {...register('age', { valueAsNumber: true })}
                              className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 ${
                                isDark
                                  ? 'bg-slate-700/50 border-slate-600 text-white focus:border-indigo-500'
                                  : 'bg-white/70 border-indigo-300 text-slate-900 focus:border-indigo-500'
                              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                              placeholder="Age"
                            />
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <label className={`block text-sm font-medium mb-2 ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            Gender
                          </label>
                          <div className="relative">
                            <Users className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                              isDark ? 'text-slate-400' : 'text-slate-500'
                            }`} />
                            <select
                              {...register('gender')}
                              className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 ${
                                isDark
                                  ? 'bg-slate-700/50 border-slate-600 text-white focus:border-indigo-500'
                                  : 'bg-white/70 border-indigo-300 text-slate-900 focus:border-indigo-500'
                              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                            >
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                )}

                {isSignUp && currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        Weight (kg) <span className="text-xs opacity-70">- Optional</span>
                      </label>
                      <div className="relative">
                        <Weight className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`} />
                        <input
                          type="number"
                          {...register('weight', { valueAsNumber: true })}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 ${
                            isDark
                              ? 'bg-slate-700/50 border-slate-600 text-white focus:border-indigo-500'
                              : 'bg-white/70 border-indigo-300 text-slate-900 focus:border-indigo-500'
                          } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                          placeholder="Enter weight in kg"
                        />
                      </div>
                      {errors.weight && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-sm text-red-500"
                        >
                          {errors.weight.message}
                        </motion.p>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        Height (cm) <span className="text-xs opacity-70">- Optional</span>
                      </label>
                      <div className="relative">
                        <Ruler className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`} />
                        <input
                          type="number"
                          {...register('height', { valueAsNumber: true })}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 ${
                            isDark
                              ? 'bg-slate-700/50 border-slate-600 text-white focus:border-indigo-500'
                              : 'bg-white/70 border-indigo-300 text-slate-900 focus:border-indigo-500'
                          } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                          placeholder="Enter height in cm"
                        />
                      </div>
                      {errors.height && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-sm text-red-500"
                        >
                          {errors.height.message}
                        </motion.p>
                      )}
                    </motion.div>

                    {/* BMI Calculator */}
                    {watchedValues.weight && watchedValues.height && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className={`p-4 rounded-xl border ${
                          isDark
                            ? 'bg-indigo-900/20 border-indigo-500/30'
                            : 'bg-indigo-50 border-indigo-200'
                        }`}
                      >
                        <h4 className={`font-semibold mb-2 ${
                          isDark ? 'text-indigo-300' : 'text-indigo-700'
                        }`}>
                          BMI Calculator
                        </h4>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`text-2xl font-bold ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}>
                              {calculateBMI()}
                            </div>
                            <div className={`text-sm ${
                              isDark ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              BMI
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-medium ${
                              getBMICategory(parseFloat(calculateBMI() || '0')).color
                            }`}>
                              {getBMICategory(parseFloat(calculateBMI() || '0')).category}
                            </div>
                            <div className={`text-xs ${
                              isDark ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              Category
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 rounded-xl border flex items-start space-x-3 ${
                    isDark
                      ? 'bg-red-900/20 border-red-500/30 text-red-400'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm">{error}</span>
                    {error.includes('already registered') && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={toggleMode}
                          className={`text-sm font-medium underline ${
                            isDark ? 'text-red-300 hover:text-red-200' : 'text-red-600 hover:text-red-500'
                          }`}
                        >
                          Switch to Sign In
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              <div className="flex space-x-3">
                {isSignUp && currentStep === 2 && (
                  <motion.button
                    type="button"
                    onClick={prevStep}
                    className={`flex-1 py-3 px-6 border rounded-xl font-semibold transition-all duration-200 ${
                      isDark
                        ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                        : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Back
                  </motion.button>
                )}

                <motion.button
                  type={isSignUp && currentStep === 1 ? "button" : "submit"}
                  onClick={isSignUp && currentStep === 1 ? nextStep : undefined}
                  disabled={loading}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : isSignUp && currentStep === 1 ? (
                    'Next'
                  ) : isSignUp ? (
                    'Create Account'
                  ) : (
                    'Sign In'
                  )}
                </motion.button>
              </div>
            </form>

            <motion.div 
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button
                  onClick={toggleMode}
                  className="ml-1 text-indigo-500 hover:text-indigo-600 font-medium transition-colors"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;