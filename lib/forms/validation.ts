import { z } from 'zod';

/**
 * Reusable validation schemas for common form fields
 * 
 * These can be composed together to create complex form validations
 * while maintaining consistency across the application.
 */

/**
 * Common email validation
 * - Basic format validation
 * - Lowercase transformation
 * - Trim whitespace
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .transform(val => val.trim().toLowerCase());

/**
 * Common password validation
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Basic strong password - less strict than passwordSchema
 * - Just enforces minimum length
 */
export const basicPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

/**
 * Basic confirm password validation schema
 */
export const confirmPasswordSchema = z
  .string()
  .min(1, 'Please confirm your password');

/**
 * Helper to add password confirmation validation to a schema
 * 
 * Example usage:
 * ```
 * const schema = z.object({
 *   password: passwordSchema,
 *   confirmPassword: confirmPasswordSchema,
 * }).refine(passwordsMatch, {
 *   message: "Passwords don't match",
 *   path: ["confirmPassword"],
 * });
 * ```
 */
export const passwordsMatch = (data: { 
  password: string; 
  confirmPassword: string;
}) => data.password === data.confirmPassword;

/**
 * Username validation
 * - 3-20 characters
 * - Alphanumeric plus underscores and hyphens
 * - Lowercase transformation
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be less than 20 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .transform(val => val.toLowerCase());

/**
 * Full name validation
 * - 2-50 characters
 * - Trims whitespace
 */
export const nameSchema = z
  .string()
  .min(2, 'Name is required and must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .transform(val => val.trim());

/**
 * Phone number validation (basic)
 * - Min 10 characters
 * - Max 15 characters
 */
export const phoneSchema = z
  .string()
  .min(10, 'Please enter a valid phone number')
  .max(15, 'Phone number is too long')
  .regex(/^[0-9+\-\s()]+$/, 'Please enter a valid phone number format');

/**
 * URL validation with optional protocol
 * - Adds https:// if missing
 */
export const urlSchema = z
  .string()
  .min(1, 'URL is required')
  .refine(val => {
    try {
      // Try to create a URL - will throw if invalid
      new URL(val.startsWith('http') ? val : `https://${val}`);
      return true;
    } catch {
      return false;
    }
  }, 'Please enter a valid URL')
  .transform(val => val.startsWith('http') ? val : `https://${val}`);

/**
 * Date validation (ISO format string)
 */
export const dateSchema = z
  .string()
  .refine(val => !isNaN(Date.parse(val)), { message: 'Please enter a valid date' })
  .transform(val => new Date(val));

/**
 * Required checkbox (must be checked)
 * Common for terms acceptance
 */
export const requiredCheckboxSchema = z
  .boolean()
  .refine(val => val === true, { message: 'This field must be checked' });

/**
 * Age validation (must be at least 18)
 */
export const adultAgeSchema = z
  .number()
  .min(18, 'You must be at least 18 years old');

/**
 * Custom validator for credit card numbers
 */
export const creditCardSchema = z
  .string()
  .min(13, 'Please enter a valid credit card number')
  .max(19, 'Please enter a valid credit card number')
  .regex(/^[0-9]+$/, 'Credit card number can only contain digits')
  .refine(
    // Implement Luhn algorithm for credit card validation
    (cardNumber) => {
      const digits = cardNumber.split('').map(Number);
      let sum = 0;
      let shouldDouble = false;
      
      // Loop from right to left
      for (let i = digits.length - 1; i >= 0; i--) {
        let digit = digits[i];
        
        if (shouldDouble) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        
        sum += digit;
        shouldDouble = !shouldDouble;
      }
      
      return sum % 10 === 0;
    },
    { message: 'Please enter a valid credit card number' }
  );

/**
 * Postal/ZIP code validation (simple patterns for US/Canada)
 */
export const postalCodeSchema = z
  .string()
  .min(5, 'Please enter a valid postal/zip code')
  .max(10, 'Please enter a valid postal/zip code')
  // Allow common formats: US (12345, 12345-6789) or Canada (A1A 1A1)
  .regex(/^[A-Z0-9]{3,10}(-| )?[A-Z0-9]{0,7}$/i, 'Please enter a valid postal/zip code');

/**
 * Helper to create a z.enum from string options with appropriate TypeScript types
 */
export function createSelectSchema<T extends string>(
  options: readonly T[], 
  errorMessage = 'Please select a valid option'
) {
  return z.enum(options as [T, ...T[]], {
    errorMap: () => ({ message: errorMessage }),
  });
}

/**
 * Schema for form with terms and conditions acceptance
 */
export const termsSchema = z.object({
  agreeToTerms: requiredCheckboxSchema,
});

/**
 * Common login form schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

/**
 * Common registration form schema
 */
export const registrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: confirmPasswordSchema,
  agreeToTerms: requiredCheckboxSchema,
})
.refine(passwordsMatch, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}); 