import { z } from 'zod'

const passwordSchema = z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain a special character')

const phoneSchema = z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number')

const registerSchema = z.object({
    full_name: z.string().trim().min(2).max(100),
    email:z.email().max(255).toLowerCase(),
    password: passwordSchema,
    phone: phoneSchema.optional(),

})

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1, 'Password is required'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

export { registerSchema, loginSchema }
