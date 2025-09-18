import 'dotenv/config';
import { validateAgentEnvironment, createEnvironmentValidator } from '@repo/shared';

export const validateEnv = createEnvironmentValidator(
  () => validateAgentEnvironment(),
  'Agent'
);

export const env = validateEnv();
export type Env = typeof env;