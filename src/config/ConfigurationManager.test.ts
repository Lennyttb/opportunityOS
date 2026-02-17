import { ConfigurationManager } from './ConfigurationManager';
import { LogLevel } from '../types';

describe('ConfigurationManager', () => {
  const validConfig = {
    userpilot: {
      apiToken: 'test-userpilot-token',
    },
    slack: {
      botToken: 'xoxb-test-bot-token',
      appToken: 'xapp-test-app-token',
      channelId: 'C123456',
    },
    kiro: {
      apiKey: 'test-kiro-key',
    },
  };

  describe('constructor', () => {
    it('should create instance with valid config', () => {
      const manager = new ConfigurationManager(validConfig);
      expect(manager).toBeInstanceOf(ConfigurationManager);
    });

    it('should throw error when userpilot.apiToken is missing', () => {
      const invalidConfig = { ...validConfig };
      delete (invalidConfig as any).userpilot;

      expect(() => new ConfigurationManager(invalidConfig)).toThrow(
        'Configuration error: userpilot.apiToken is required'
      );
    });

    it('should throw error when slack.botToken is missing', () => {
      const invalidConfig = {
        ...validConfig,
        slack: { ...validConfig.slack, botToken: '' },
      };
      delete (invalidConfig.slack as any).botToken;

      expect(() => new ConfigurationManager(invalidConfig)).toThrow(
        'Configuration error: slack.botToken is required'
      );
    });

    it('should throw error when slack.appToken is missing', () => {
      const invalidConfig = {
        ...validConfig,
        slack: { ...validConfig.slack, appToken: '' },
      };
      delete (invalidConfig.slack as any).appToken;

      expect(() => new ConfigurationManager(invalidConfig)).toThrow(
        'Configuration error: slack.appToken is required'
      );
    });

    it('should throw error when slack.channelId is missing', () => {
      const invalidConfig = {
        ...validConfig,
        slack: { ...validConfig.slack, channelId: '' },
      };
      delete (invalidConfig.slack as any).channelId;

      expect(() => new ConfigurationManager(invalidConfig)).toThrow(
        'Configuration error: slack.channelId is required'
      );
    });

    it('should throw error when kiro.apiKey is missing', () => {
      const invalidConfig = { ...validConfig };
      delete (invalidConfig as any).kiro;

      expect(() => new ConfigurationManager(invalidConfig)).toThrow(
        'Configuration error: kiro.apiKey is required'
      );
    });

    it('should apply default values', () => {
      const manager = new ConfigurationManager(validConfig);
      const config = manager.getConfig();

      expect(config.userpilot.baseUrl).toBe('https://api.userpilot.io/v1');
      expect(config.kiro.baseUrl).toBe('https://api.kiro.ai/v1');
      expect(config.detectionSchedule).toBe('0 9 * * 1');
      expect(config.dataStorePath).toBe('./data/opportunities.json');
      expect(config.logLevel).toBe(LogLevel.INFO);
      expect(config.minOpportunityScore).toBe(60);
    });

    it('should use custom values when provided', () => {
      const customConfig = {
        ...validConfig,
        userpilot: {
          ...validConfig.userpilot,
          baseUrl: 'https://custom.userpilot.com',
        },
        detectionSchedule: '0 10 * * 2',
        dataStorePath: './custom/path.json',
        logLevel: LogLevel.DEBUG,
        minOpportunityScore: 70,
      };

      const manager = new ConfigurationManager(customConfig);
      const config = manager.getConfig();

      expect(config.userpilot.baseUrl).toBe('https://custom.userpilot.com');
      expect(config.detectionSchedule).toBe('0 10 * * 2');
      expect(config.dataStorePath).toBe('./custom/path.json');
      expect(config.logLevel).toBe(LogLevel.DEBUG);
      expect(config.minOpportunityScore).toBe(70);
    });
  });

  describe('getConfig', () => {
    it('should return a copy of the configuration', () => {
      const manager = new ConfigurationManager(validConfig);
      const config1 = manager.getConfig();
      const config2 = manager.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different object references
    });
  });

  describe('get', () => {
    it('should return specific configuration value', () => {
      const manager = new ConfigurationManager(validConfig);

      expect(manager.get('logLevel')).toBe(LogLevel.INFO);
      expect(manager.get('minOpportunityScore')).toBe(60);
      expect(manager.get('userpilot')).toEqual({
        apiToken: 'test-userpilot-token',
        baseUrl: 'https://api.userpilot.io/v1',
      });
    });
  });

  describe('update', () => {
    it('should update configuration values', () => {
      const manager = new ConfigurationManager(validConfig);

      manager.update({ logLevel: LogLevel.DEBUG, minOpportunityScore: 80 });

      expect(manager.get('logLevel')).toBe(LogLevel.DEBUG);
      expect(manager.get('minOpportunityScore')).toBe(80);
    });

    it('should validate updated configuration', () => {
      const manager = new ConfigurationManager(validConfig);

      expect(() => {
        manager.update({ userpilot: { apiToken: '' } } as any);
      }).toThrow('Configuration error: userpilot.apiToken is required');
    });
  });

  describe('validate', () => {
    it('should return true for valid configuration', () => {
      expect(ConfigurationManager.validate(validConfig)).toBe(true);
    });

    it('should return false for invalid configuration', () => {
      const invalidConfig = { ...validConfig };
      delete (invalidConfig as any).userpilot;

      expect(ConfigurationManager.validate(invalidConfig)).toBe(false);
    });
  });
});

