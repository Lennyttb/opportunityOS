import { OpportunityOSConfig, LogLevel } from '../types';

/**
 * ConfigurationManager handles validation and management of OpportunityOS configuration
 */
export class ConfigurationManager {
  private config: OpportunityOSConfig;

  constructor(config: Partial<OpportunityOSConfig>) {
    this.config = this.validateAndNormalize(config);
  }

  /**
   * Validates and normalizes the configuration with defaults
   */
  private validateAndNormalize(config: Partial<OpportunityOSConfig>): OpportunityOSConfig {
    // Validate required fields
    if (!config.userpilot?.apiToken) {
      throw new Error('Configuration error: userpilot.apiToken is required');
    }

    if (!config.slack?.botToken) {
      throw new Error('Configuration error: slack.botToken is required');
    }

    if (!config.slack?.appToken) {
      throw new Error('Configuration error: slack.appToken is required');
    }

    if (!config.slack?.channelId) {
      throw new Error('Configuration error: slack.channelId is required');
    }

    if (!config.kiro?.apiKey) {
      throw new Error('Configuration error: kiro.apiKey is required');
    }

    // Return normalized config with defaults
    return {
      userpilot: {
        apiToken: config.userpilot.apiToken,
        baseUrl: config.userpilot.baseUrl || 'https://api.userpilot.io/v1',
      },
      slack: {
        botToken: config.slack.botToken,
        appToken: config.slack.appToken,
        channelId: config.slack.channelId,
      },
      kiro: {
        apiKey: config.kiro.apiKey,
        baseUrl: config.kiro.baseUrl || 'https://api.kiro.ai/v1',
      },
      detectionSchedule: config.detectionSchedule || '0 9 * * 1', // Monday 9am
      dataStorePath: config.dataStorePath || './data/opportunities.json',
      logLevel: config.logLevel || LogLevel.INFO,
      minOpportunityScore: config.minOpportunityScore ?? 60,
      autoGenerateSpecs: config.autoGenerateSpecs ?? false, // Require manual approval by default
    };
  }

  /**
   * Get the full configuration
   */
  public getConfig(): OpportunityOSConfig {
    return { ...this.config };
  }

  /**
   * Get a specific configuration value
   */
  public get<K extends keyof OpportunityOSConfig>(key: K): OpportunityOSConfig[K] {
    return this.config[key];
  }

  /**
   * Update configuration (useful for runtime changes)
   */
  public update(updates: Partial<OpportunityOSConfig>): void {
    this.config = this.validateAndNormalize({
      ...this.config,
      ...updates,
    });
  }

  /**
   * Validate configuration without creating an instance
   */
  public static validate(config: Partial<OpportunityOSConfig>): boolean {
    try {
      new ConfigurationManager(config);
      return true;
    } catch {
      return false;
    }
  }
}

