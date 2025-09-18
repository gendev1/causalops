import { ZodError } from 'zod';

export class EnvironmentValidationError extends Error {
  constructor(public issues: ZodError['issues']) {
    super('Environment validation failed');
    this.name = 'EnvironmentValidationError';
  }
}

export function createEnvironmentValidator<T>(
  validatorFn: () => T,
  appName: string
) {
  return (): T => {
    try {
      console.log(`🔧 Validating ${appName} environment...`);
      const env = validatorFn();
      console.log(`✅ ${appName} environment validation passed`);
      return env;
    } catch (error) {
      if (error instanceof ZodError) {
        console.error(`❌ ${appName} environment validation failed:`);
        error.issues.forEach((issue) => {
          const path = issue.path.join('.');
          console.error(`  ${path}: ${issue.message}`);
        });
        console.error('\n💡 Check your .env file or environment variables');
        process.exit(1);
      }
      throw error;
    }
  };
}