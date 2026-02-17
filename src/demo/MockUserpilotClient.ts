import { FunnelData, NPSData, FeatureUsageData, UserpilotConfig } from '../types';
import { Logger } from '../utils/Logger';

/**
 * Mock UserpilotClient for testing without real API
 */
export class MockUserpilotClient {
  private logger: Logger;

  constructor(_config: UserpilotConfig) {
    this.logger = Logger.getInstance().child('MockUserpilotClient');
    this.logger.info('MockUserpilotClient initialized (DEMO MODE)');
  }

  /**
   * Generate fake funnel data
   */
  public async getFunnelData(funnelId: string): Promise<FunnelData> {
    this.logger.debug('Generating fake funnel data', { funnelId });

    return {
      funnelId,
      funnelName: 'Checkout Flow',
      steps: [
        { stepName: 'View Cart', userCount: 1000, dropoffRate: 0.1 },
        { stepName: 'Enter Payment', userCount: 900, dropoffRate: 0.45 }, // High dropoff!
        { stepName: 'Confirm Order', userCount: 495, dropoffRate: 0.05 },
      ],
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate fake funnel data for all funnels
   */
  public async getAllFunnels(): Promise<FunnelData[]> {
    this.logger.debug('Generating fake funnels data');

    return [
      {
        funnelId: 'funnel-1',
        funnelName: 'Onboarding Flow',
        steps: [
          { stepName: 'Sign Up', userCount: 2000, dropoffRate: 0.15 },
          { stepName: 'Profile Setup', userCount: 1700, dropoffRate: 0.35 }, // High dropoff
          { stepName: 'First Action', userCount: 1105, dropoffRate: 0.1 },
        ],
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      },
      {
        funnelId: 'funnel-2',
        funnelName: 'Checkout Flow',
        steps: [
          { stepName: 'View Cart', userCount: 1000, dropoffRate: 0.1 },
          { stepName: 'Enter Payment', userCount: 900, dropoffRate: 0.45 }, // High dropoff!
          { stepName: 'Confirm Order', userCount: 495, dropoffRate: 0.05 },
        ],
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      },
    ];
  }

  /**
   * Generate fake NPS data
   */
  public async getNPSData(): Promise<NPSData> {
    this.logger.debug('Generating fake NPS data');

    return {
      score: 25, // Low NPS!
      responseCount: 150,
      detractors: Array(90)
        .fill(null)
        .map((_, i) => ({
          userId: `user-${i}`,
          score: Math.floor(Math.random() * 7), // 0-6
          feedback: i < 5 ? 'The checkout process is too complicated' : undefined,
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        })),
      passives: Array(45)
        .fill(null)
        .map((_, i) => ({
          userId: `user-passive-${i}`,
          score: 7 + Math.floor(Math.random() * 2), // 7-8
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        })),
      promoters: Array(15)
        .fill(null)
        .map((_, i) => ({
          userId: `user-promoter-${i}`,
          score: 9 + Math.floor(Math.random() * 2), // 9-10
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        })),
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate fake feature usage data
   */
  public async getFeatureUsageData(): Promise<FeatureUsageData[]> {
    this.logger.debug('Generating fake feature usage data');

    return [
      {
        featureId: 'feature-1',
        featureName: 'Advanced Analytics Dashboard',
        activeUsers: 80,
        totalUsers: 1000,
        usageRate: 0.08, // Low usage!
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      },
      {
        featureId: 'feature-2',
        featureName: 'Export to CSV',
        activeUsers: 150,
        totalUsers: 1000,
        usageRate: 0.15, // Low usage!
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      },
      {
        featureId: 'feature-3',
        featureName: 'Basic Dashboard',
        activeUsers: 850,
        totalUsers: 1000,
        usageRate: 0.85, // Good usage
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      },
    ];
  }
}

