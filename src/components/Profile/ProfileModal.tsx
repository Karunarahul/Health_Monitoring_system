import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, User, Calendar, Users, Save, Weight, Ruler } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Profile } from '../../lib/supabase';
import { profileSchema, ProfileInput } from '../../utils/validation';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, isDark }) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { user, updateProfile } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });

  const watchedValues = watch();

  useEffect(() => {
    if (isOpen && user) {
      fetchProfile();
    }
  }, [isOpen, user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data && !error) {
      setProfile(data);
      setValue('full_name', data.full_name || '');
      setValue('age', data.age || 25);
      setValue('gender', data.gender || 'male');
      setValue('weight', data.weight || undefined);
      setValue('height', data.height || undefined);
    }
  };

  const onSubmit = async (data: ProfileInput) => {
    setLoading(true);

    try {
      const { error } = await updateProfile(data);
      if (error) throw error;

      onClose();
    } catch (err: any) {
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
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
          onClick={onClose}
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
                Profile Settings
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
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
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        errors.age ? 'border-red-500' : ''
                      }`}
                      placeholder="Age"
                    />
                  </div>
                  {errors.age && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-sm text-red-500"
                    >
                      {errors.age.message}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
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

              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Weight (kg)
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
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        errors.weight ? 'border-red-500' : ''
                      }`}
                      placeholder="Weight"
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
                  transition={{ delay: 0.5 }}
                >
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Height (cm)
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
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        errors.height ? 'border-red-500' : ''
                      }`}
                      placeholder="Height"
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
              </div>

              {/* BMI Display */}
              {watchedValues.weight && watchedValues.height && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
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

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Profile</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;