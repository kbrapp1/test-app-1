/**
 * Validates the onboarding form data.
 * Throws an error with a user-friendly message if validation fails.
 */
export function validateOnboardingForm(fullName: string, password?: string, confirmPassword?: string, needsPwSet: boolean = true): void {
  if (!fullName.trim()) {
    throw new Error('Name is required');
  }

  if (needsPwSet) {
    if (!password) {
      throw new Error('Password is required');
    }
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }
  }
} 