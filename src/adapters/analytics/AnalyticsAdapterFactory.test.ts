import { createAnalyticsAdapter, resolveEnvVars, AnalyticsAdapterConfig } from './AnalyticsAdapterFactory';
import { UserpilotAdapter } from './UserpilotAdapter';
import { IAnalyticsAdapter } from './IAnalyticsAdapter';

describe('AnalyticsAdapterFactory', () => {
  describe('resolveEnvVars', () => {
    it('should resolve environment variables with ${ENV_VAR} syntax', () => {
      process.env.TEST_TOKEN = 'test-token-123';
      
      const config = {
        apiToken: '${TEST_TOKEN}',
        baseUrl: 'https://api.example.com'
      };
      
      const resolved = resolveEnvVars(config);
      
      expect(resolved.apiToken).toBe('test-token-123');
      expect(resolved.baseUrl).toBe('https://api.example.com');
      
      delete process.env.TEST_TOKEN;
    });

    it('should throw error when environment variable is not set', () => {
      const config = {
        apiToken: '${MISSING_TOKEN}'
      };
      
      expect(() => resolveEnvVars(config)).toThrow(
        'Environment variable MISSING_TOKEN is not set (required for config.apiToken)'
      );
    });

    it('should pass through non-environment variable values unchanged', () => {
      const config = {
        apiToken: 'direct-token',
        baseUrl: 'https://api.example.com'
      };
      
      const resolved = resolveEnvVars(config);
      
      expect(resolved.apiToken).toBe('direct-token');
      expect(resolved.baseUrl).toBe('https://api.example.com');
    });
  });

  describe('createAnalyticsAdapter', () => {
    it('should return UserpilotAdapter instance for userpilot adapter type', () => {
      const config: AnalyticsAdapterConfig = {
        adapter: 'userpilot',
        config: {
          apiToken: 'test-token'
        }
      };
      
      const adapter = createAnalyticsAdapter(config);
      
      expect(adapter).toBeInstanceOf(UserpilotAdapter);
      expect(adapter).toHaveProperty('getFunnels');
      expect(adapter).toHaveProperty('getNPS');
      expect(adapter).toHaveProperty('getFeatureUsage');
    });

    it('should resolve environment variables before passing to adapter', () => {
      process.env.USERPILOT_TOKEN = 'resolved-token';
      
      const config: AnalyticsAdapterConfig = {
        adapter: 'userpilot',
        config: {
          apiToken: '${USERPILOT_TOKEN}'
        }
      };
      
      const adapter = createAnalyticsAdapter(config);
      
      expect(adapter).toBeInstanceOf(UserpilotAdapter);
      
      delete process.env.USERPILOT_TOKEN;
    });

    it('should throw descriptive error for unsupported adapter types', () => {
      const config = {
        adapter: 'posthog',
        config: {
          apiKey: 'test-key'
        }
      } as unknown as AnalyticsAdapterConfig;
      
      expect(() => createAnalyticsAdapter(config)).toThrow(
        'Unsupported analytics adapter: "posthog". Supported adapters: userpilot'
      );
    });

    it('should list all supported adapters in error message', () => {
      const config = {
        adapter: 'amplitude',
        config: {}
      } as unknown as AnalyticsAdapterConfig;
      
      expect(() => createAnalyticsAdapter(config)).toThrow(/Supported adapters: userpilot/);
    });

    it('should return instance that implements IAnalyticsAdapter interface', () => {
      const config: AnalyticsAdapterConfig = {
        adapter: 'userpilot',
        config: {
          apiToken: 'test-token'
        }
      };
      
      const adapter: IAnalyticsAdapter = createAnalyticsAdapter(config);
      
      // Verify interface methods exist
      expect(typeof adapter.getFunnels).toBe('function');
      expect(typeof adapter.getNPS).toBe('function');
      expect(typeof adapter.getFeatureUsage).toBe('function');
    });
  });
});
