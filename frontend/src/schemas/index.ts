import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof LoginSchema>;

export const RegisterSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().regex(/^[0-9+ -]{10,15}$/, 'Please enter a valid phone number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof RegisterSchema>;

export const ReportPotholeSchema = z.object({
  description: z.string().min(10, 'Please describe the road condition (min 10 characters)'),
  landmark: z.string().optional(),
  latitude: z.number({ required_error: 'Latitude is required' }),
  longitude: z.number({ required_error: 'Longitude is required' }),
  address: z.string().min(3, 'Address is required'),
  wardId: z.string().min(1, 'Please select a ward'),
  imageUrl: z.string().min(1, 'Photo upload is required'),
});

export type ReportPotholeFormData = z.infer<typeof ReportPotholeSchema>;

export const AssignWorkOrderSchema = z.object({
  assignedWorkerId: z.string().min(1, 'Please select a field worker'),
  instructions: z.string().min(5, 'Please provide repair instructions for field unit'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  dueDate: z.string().min(1, 'Please set a due date'),
});

export type AssignWorkOrderFormData = z.infer<typeof AssignWorkOrderSchema>;

export const CompleteWorkOrderSchema = z.object({
  afterImageUrl: z.string().min(1, 'After-repair photo is required'),
  notes: z.string().optional(),
});

export type CompleteWorkOrderFormData = z.infer<typeof CompleteWorkOrderSchema>;

export const ProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email(),
  phone: z.string().optional(),
  preferredLanguage: z.enum(['en', 'hi']),
});

export type ProfileFormData = z.infer<typeof ProfileSchema>;
