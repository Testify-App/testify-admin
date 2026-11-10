import { z } from 'zod'

/** Same rule as the backend: 8+ characters, one uppercase letter, one number, no spaces. */
export const newPassword = z
  .string()
  .min(8, 'Use at least 8 characters')
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/\d/, 'Include at least one number')
  .regex(/^\S*$/, 'Passwords cannot contain spaces')

export const newPasswordForm = z
  .object({ password: newPassword, confirm: z.string().min(1, 'Confirm your new password') })
  .refine((values) => values.password === values.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  })
export type NewPasswordValues = z.infer<typeof newPasswordForm>

export const emailField = z
  .string()
  .trim()
  .min(1, 'Enter your email address')
  .email('Enter a valid email address')
