import { IAnalyticsAdapter } from './IAnalyticsAdapter';
import { UserpilotAdapter } from './UserpilotAdapter';
import { UserpilotConfig } from '../../types';

/**
 * Configuration for the analytics adapter factory.
 * Specifies which adapter to use and its provider-specific configuration.
 */
export interface AnalyticsAdapterConfig {
  adapter: 'userpilot'; // Will be extended with 'posthog' | 'amplitude' | 'mixpanel' | 'custom' in future specs
  config: UserpilotConfig; // Union type will be extended when new adapters are added
}

/**
 * Resolves environment variables in configuration values.
 * Supports ${ENV_VAR_NAME} syntax for sensitive values like API tokens.
 * 
 * @param config Configuration object that may contain environment variable references
 * @returns Configuration object with environment variables resolved to their actual values
 * @throws Error if a referenced environment variable is not set
 * 
 * @example
 * // With process.env.USERPILOT_TOKEN = "abc123"
 * resolveEnvVars({ apiToken: "${USERPILOT_TOKEN}" })
 * // Returns: { apiToken: "abc123" }
 */
export function resolveEnvVars(config: Record<string, unknown>): Record<string, unknown> {
  if (!config || typeof config !== 'object') {
    return config;
  }

  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      const envVarName = value.slice(2, -1);
      const envValue = process.env[envVarName];

      if (!envValue) {
        throw new Error(
          `Environment variable ${envVarName} is not set (required for config.${key})`
        );
      }

      resolved[key] = envValue;
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

/**
 * Factory function to create the appropriate analytics adapter based on configuration.
 * Resolves environment variables in the configuration before instantiating the adapter.
 * 
 * @param config Analytics adapter configuration specifying the adapter type and its config
 * @returns Instance of IAnalyticsAdapter for the specified provider
 * @throws Error if the adapter type is not supported
 * 
 * @example
 * const adapter = createAnalyticsAdapter({
 *   adapter: 'userpilot',
 *   config: { apiToken: '${USERPILOT_TOKEN}' }
 * });
 */
export function createAnalyticsAdapter(config: AnalyticsAdapterConfig): IAnalyticsAdapter {
  // Resolve environment variables in config before passing to adapter
  const resolvedConfig = resolveEnvVars(config.config as unknown as Record<string, unknown>) as unknown as UserpilotConfig;

  switch (config.adapter) {
    case 'userpilot':
      return new UserpilotAdapter(resolvedConfig);

    default:
      throw new Error(
        `Unsupported analytics adapter: "${config.adapter}". ` +
        `Supported adapters: userpilot`
      );
  }
}
