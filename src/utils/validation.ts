import { z } from 'zod';

export const vitalSignsSchema = z.object({
  heart_rate: z.number()
    .min(30, 'Heart rate must be at least 30 bpm')
    .max(250, 'Heart rate cannot exceed 250 bpm'),
  blood_pressure_systolic: z.number()
    .min(70, 'Systolic pressure must be at least 70 mmHg')
    .max(250, 'Systolic pressure cannot exceed 250 mmHg'),
  blood_pressure_diastolic: z.number()
    .min(40, 'Diastolic pressure must be at least 40 mmHg')
    .max(150, 'Diastolic pressure cannot exceed 150 mmHg'),
  spo2: z.number()
    .min(70, 'SpO₂ must be at least 70%')
    .max(100, 'SpO₂ cannot exceed 100%'),
  temperature: z.number()
    .min(89.6, 'Temperature must be at least 89.6°F')
    .max(113, 'Temperature cannot exceed 113°F'),
});

export const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.number()
    .min(1, 'Age must be at least 1')
    .max(120, 'Age cannot exceed 120'),
  gender: z.enum(['male', 'female', 'other']),
  weight: z.number()
    .min(20, 'Weight must be at least 20 kg')
    .max(500, 'Weight cannot exceed 500 kg')
    .optional(),
  height: z.number()
    .min(50, 'Height must be at least 50 cm')
    .max(300, 'Height cannot exceed 300 cm')
    .optional(),
});

export const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  age: z.number()
    .min(1, 'Age must be at least 1')
    .max(120, 'Age cannot exceed 120')
    .optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  weight: z.number()
    .min(20, 'Weight must be at least 20 kg')
    .max(500, 'Weight cannot exceed 500 kg')
    .optional(),
  height: z.number()
    .min(50, 'Height must be at least 50 cm')
    .max(300, 'Height cannot exceed 300 cm')
    .optional(),
});

export type VitalSignsInput = z.infer<typeof vitalSignsSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type AuthInput = z.infer<typeof authSchema>;