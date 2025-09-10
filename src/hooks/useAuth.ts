import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Explicitly handle sign out and user deletion events
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setSession(null);
        setUser(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string, 
    password: string, 
    fullName: string,
    age?: number,
    gender?: 'male' | 'female' | 'other',
    weight?: number,
    height?: number
  ) => {
    // Check if Supabase is properly configured
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project-id')) {
      return { 
        data: null, 
        error: { 
          message: 'Demo Mode: Please configure Supabase to enable authentication. Click "Connect to Supabase" in the top right to set up your database.' 
        } 
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (data.user && !error) {
      // Create profile with additional data
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
        age,
        gender,
        weight,
        height,
      });
    }

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    // Check if Supabase is properly configured
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project-id')) {
      return { 
        data: null, 
        error: { 
          message: 'Demo Mode: Please configure Supabase to enable authentication. Click "Connect to Supabase" in the top right to set up your database.' 
        } 
      };
    }

    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    return await supabase.auth.signOut();
  };

  const updateProfile = async (updates: {
    full_name?: string;
    age?: number;
    gender?: 'male' | 'female' | 'other';
    weight?: number;
    height?: number;
  }) => {
    if (!user) return { error: new Error('No user logged in') };

    return await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };
}