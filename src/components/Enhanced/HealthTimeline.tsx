import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { Calendar, TrendingUp, AlertTriangle, CheckCircle, Activity, Clock } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'vital' | 'prediction' | 'alert' | 'action';
  riskLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  data: any;
  description: string;
}

interface HealthTimelineProps {
  isDark: boolean;
}

const HealthTimeline: React.FC<HealthTimelineProps> = ({ isDark }) => {
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'risk_score' | 'heart_rate' | 'blood_pressure' | 'spo2'>('risk_score');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTimelineData();
    }
  }, [user, timeRange]);

  const fetchTimelineData = async () => {
    setLoading(true);
    
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = subDays(new Date(), days).toISOString();

    try {
      // Fetch vital readings
      const { data: vitals } = await supabase
        .from('vital_readings')
        .select('*')
        .eq('user_id', user!.id)
        .gte('timestamp', startDate)
        .order('timestamp', { ascending: true });

      // Fetch health predictions
      const { data: predictions } = await supabase
        .from('health_predictions')
        .select('*')
        .eq('user_id', user!.id)
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

      // Process data for timeline chart
      const chartData = processChartData(vitals || [], predictions || []);
      setTimelineData(chartData);

      // Process events for timeline
      const timelineEvents = processTimelineEvents(vitals || [], predictions || []);
      setEvents(timelineEvents);

    } catch (error) {
      console.error('Error fetching timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (vitals: any[], predictions: any[]) => {
    const dataMap = new Map();

    // Process vitals
    vitals.forEach(vital => {
      const date = format(parseISO(vital.timestamp), 'yyyy-MM-dd');
      if (!dataMap.has(date)) {
        dataMap.set(date, { date, vitals: [], predictions: [] });
      }
      dataMap.get(date).vitals.push(vital);
    });

    // Process predictions
    predictions.forEach(prediction => {
      const date = format(parseISO(prediction.created_at), 'yyyy-MM-dd');
      if (!dataMap.has(date)) {
        dataMap.set(date, { date, vitals: [], predictions: [] });
      }
      dataMap.get(date).predictions.push(prediction);
    });

    // Convert to array and calculate averages
    return Array.from(dataMap.values()).map(dayData => {
      const vitalsAvg = dayData.vitals.length > 0 ? {
        heart_rate: Math.round(dayData.vitals.reduce((sum: number, v: any) => sum + v.heart_rate, 0) / dayData.vitals.length),
        blood_pressure_systolic: Math.round(dayData.vitals.reduce((sum: number, v: any) => sum + v.blood_pressure_systolic, 0) / dayData.vitals.length),
        spo2: Math.round(dayData.vitals.reduce((sum: number, v: any) => sum + v.spo2, 0) / dayData.vitals.length),
      } : null;

      const predictionsAvg = dayData.predictions.length > 0 ? {
        risk_score: Math.round(dayData.predictions.reduce((sum: number, p: any) => sum + p.risk_score, 0) / dayData.predictions.length),
        confidence: Math.round(dayData.predictions.reduce((sum: number, p: any) => sum + p.confidence, 0) / dayData.predictions.length),
      } : null;

      return {
        date: dayData.date,
        displayDate: format(parseISO(dayData.date), 'MMM dd'),
        ...vitalsAvg,
        ...predictionsAvg,
        vitalsCount: dayData.vitals.length,
        predictionsCount: dayData.predictions.length,
      };
    }).filter(d => d.vitalsCount > 0 || d.predictionsCount > 0);
  };

  const processTimelineEvents = (vitals: any[], predictions: any[]): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Add prediction events
    predictions.forEach(prediction => {
      events.push({
        id: prediction.id,
        timestamp: prediction.created_at,
        type: 'prediction',
        riskLevel: prediction.risk_level,
        data: prediction,
        description: `Health assessment: ${prediction.risk_level} risk (${prediction.risk_score}/100)`
      });

      // Add alert events for high/critical predictions
      if (prediction.risk_level === 'HIGH' || prediction.risk_level === 'CRITICAL') {
        events.push({
          id: `alert_${prediction.id}`,
          timestamp: prediction.created_at,
          type: 'alert',
          riskLevel: prediction.risk_level,
          data: prediction,
          description: `${prediction.risk_level} risk alert triggered`
        });
      }
    });

    // Add vital reading events (sample some to avoid clutter)
    vitals.filter((_, index) => index % 5 === 0).forEach(vital => {
      events.push({
        id: vital.id,
        timestamp: vital.timestamp,
        type: 'vital',
        data: vital,
        description: `Vital signs recorded: HR ${vital.heart_rate}, BP ${vital.blood_pressure_systolic}/${vital.blood_pressure_diastolic}`
      });
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getMetricData = () => {
    switch (selectedMetric) {
      case 'risk_score':
        return { key: 'risk_score', name: 'Risk Score', color: '#ef4444', unit: '/100' };
      case 'heart_rate':
        return { key: 'heart_rate', name: 'Heart Rate', color: '#f59e0b', unit: ' bpm' };
      case 'blood_pressure':
        return { key: 'blood_pressure_systolic', name: 'Systolic BP', color: '#3b82f6', unit: ' mmHg' };
      case 'spo2':
        return { key: 'spo2', name: 'SpO₂', color: '#10b981', unit: '%' };
      default:
        return { key: 'risk_score', name: 'Risk Score', color: '#ef4444', unit: '/100' };
    }
  };

  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'vital': return Activity;
      case 'prediction': return TrendingUp;
      case 'alert': return AlertTriangle;
      case 'action': return CheckCircle;
      default: return Clock;
    }
  };

  const getEventColor = (event: TimelineEvent) => {
    if (event.type === 'alert' || event.riskLevel === 'CRITICAL') return 'text-red-500';
    if (event.riskLevel === 'HIGH') return 'text-orange-500';
    if (event.riskLevel === 'MODERATE') return 'text-yellow-500';
    if (event.type === 'vital') return 'text-blue-500';
    return 'text-green-500';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 rounded-lg border shadow-lg ${
          isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}${getMetricData().unit}`}
            </p>
          ))}
          <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {data.vitalsCount} readings, {data.predictionsCount} assessments
          </p>
        </div>
      );
    }
    return null;
  };

  if (!user) {
    return (
      <div className={`text-center py-12 rounded-2xl border ${
        isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
      }`}>
        <Calendar className={`w-16 h-16 mx-auto mb-4 opacity-50 ${
          isDark ? 'text-slate-600' : 'text-slate-400'
        }`} />
        <h3 className={`text-xl font-semibold mb-2 ${
          isDark ? 'text-slate-300' : 'text-slate-700'
        }`}>
          Login Required
        </h3>
        <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
          Please log in to view your personalized health timeline
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Personalized Health Timeline
          </h2>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Track your health trends and risk patterns over time
          </p>
        </div>
        
        <div className="flex space-x-2">
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                timeRange === range
                  ? 'bg-purple-500 text-white'
                  : isDark
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Loading your health timeline...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline Chart */}
          <div className={`lg:col-span-2 p-6 rounded-2xl border ${
            isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Health Trends
              </h3>
              
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className={`px-3 py-1 rounded-lg border text-sm ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="risk_score">Risk Score</option>
                <option value="heart_rate">Heart Rate</option>
                <option value="blood_pressure">Blood Pressure</option>
                <option value="spo2">SpO₂</option>
              </select>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="displayDate"
                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                    fontSize={12}
                  />
                  <YAxis 
                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey={getMetricData().key}
                    stroke={getMetricData().color}
                    fill={getMetricData().color}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  {selectedMetric === 'risk_score' && (
                    <>
                      <ReferenceLine y={35} stroke="#f59e0b" strokeDasharray="5 5" label="Moderate Risk" />
                      <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="5 5" label="High Risk" />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Timeline Events */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Recent Events
            </h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {events.slice(0, 20).map((event, index) => {
                const Icon = getEventIcon(event);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start space-x-3"
                  >
                    <div className={`p-2 rounded-lg ${
                      isDark ? 'bg-slate-700/50' : 'bg-slate-100'
                    }`}>
                      <Icon className={`w-4 h-4 ${getEventColor(event)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {event.description}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {format(parseISO(event.timestamp), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthTimeline;