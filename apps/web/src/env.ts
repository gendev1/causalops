import 'dotenv/config';
import { validateWebEnvironment, createEnvironmentValidator } from '@repo/shared';

export const validateEnv = createEnvironmentValidator(
  () => validateWebEnvironment(),
  'Web'
);

export const env = validateEnv();
export type Env = typeof env;