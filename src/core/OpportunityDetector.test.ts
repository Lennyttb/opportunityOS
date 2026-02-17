import { OpportunityDetector } from './OpportunityDetector';
import { FunnelData, NPSData, FeatureUsageData, OpportunityType } from '../types';
import { Logger } from '../utils/Logger';

jest.mock('../utils/Logger');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}));

describe('OpportunityDetector', () => {
  let detector: OpportunityDetector;

  beforeEach(() => {
    jest.clearAllMocks();

    Logger.getInstance = jest.fn().mockReturnValue({
      child: jest.fn().mockReturnValue({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      }),
    });

    detector = new OpportunityDetector(60);
  });

  describe('detectFunnelOpportunities', () => {
    it('should detect high dropoff in funnel', () => {
      const funnels: FunnelData[] = [
        {
          funnelId: 'funnel-1',
          funnelName: 'Checkout Flow',
          steps: [
            { stepName: 'Cart', userCount: 1000, dropoffRate: 0.1 },
            { stepName: 'Payment', userCount: 900, dropoffRate: 0.45 }, // High dropoff
            { stepName: 'Confirmation', userCount: 495, dropoffRate: 0.05 },
          ],
          dateRange: { start: '2024-01-01', end: '2024-01-31' },
        },
      ];

      const opportunities = detector.detectFunnelOpportunities(funnels);

      expect(opportunities).toHaveLength(1);
      expect(opportunities[0].type).toBe(OpportunityType.FUNNEL_DROP);
      expect(opportunities[0].title).toContain('Payment');
      expect(opportunities[0].score).toBeGreaterThanOrEqual(60);
    });

    it('should not detect low dropoff rates', () => {
      const funnels: FunnelData[] = [
        {
          funnelId: 'funnel-1',
          funnelName: 'Checkout Flow',
          steps: [
            { stepName: 'Cart', userCount: 1000, dropoffRate: 0.1 },
            { stepName: 'Payment', userCount: 900, dropoffRate: 0.15 }, // Low dropoff
          ],
          dateRange: { start: '2024-01-01', end: '2024-01-31' },
        },
      ];

      const opportunities = detector.detectFunnelOpportunities(funnels);

      expect(opportunities).toHaveLength(0);
    });

    it('should filter opportunities below min score', () => {
      const highThresholdDetector = new OpportunityDetector(90);

      const funnels: FunnelData[] = [
        {
          funnelId: 'funnel-1',
          funnelName: 'Checkout Flow',
          steps: [
            { stepName: 'Payment', userCount: 100, dropoffRate: 0.35 }, // Score ~35
          ],
          dateRange: { start: '2024-01-01', end: '2024-01-31' },
        },
      ];

      const opportunities = highThresholdDetector.detectFunnelOpportunities(funnels);

      expect(opportunities).toHaveLength(0);
    });
  });

  describe('detectNPSOpportunities', () => {
    it('should detect low NPS score', () => {
      const npsData: NPSData = {
        score: 15,
        responseCount: 100,
        detractors: Array(60).fill({ userId: 'user', score: 3, feedback: 'Not good' }),
        passives: Array(30).fill({ userId: 'user', score: 7 }),
        promoters: Array(10).fill({ userId: 'user', score: 9 }),
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
      };

      const opportunities = detector.detectNPSOpportunities(npsData);

      expect(opportunities).toHaveLength(1);
      expect(opportunities[0].type).toBe(OpportunityType.LOW_NPS);
      expect(opportunities[0].title).toContain('15');
      expect(opportunities[0].score).toBeGreaterThanOrEqual(60);
    });

    it('should not detect acceptable NPS scores', () => {
      const npsData: NPSData = {
        score: 50,
        responseCount: 100,
        detractors: [],
        passives: [],
        promoters: [],
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
      };

      const opportunities = detector.detectNPSOpportunities(npsData);

      expect(opportunities).toHaveLength(0);
    });

    it('should not detect low NPS with insufficient responses', () => {
      const npsData: NPSData = {
        score: 10,
        responseCount: 5, // Too few responses
        detractors: [],
        passives: [],
        promoters: [],
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
      };

      const opportunities = detector.detectNPSOpportunities(npsData);

      expect(opportunities).toHaveLength(0);
    });
  });

  describe('detectFeatureUsageOpportunities', () => {
    it('should detect low feature usage', () => {
      const features: FeatureUsageData[] = [
        {
          featureId: 'feature-1',
          featureName: 'Advanced Analytics',
          activeUsers: 50,
          totalUsers: 1000,
          usageRate: 0.05,
          dateRange: { start: '2024-01-01', end: '2024-01-31' },
        },
      ];

      const opportunities = detector.detectFeatureUsageOpportunities(features);

      expect(opportunities).toHaveLength(1);
      expect(opportunities[0].type).toBe(OpportunityType.FEATURE_UNDERUSE);
      expect(opportunities[0].title).toContain('Advanced Analytics');
      expect(opportunities[0].score).toBeGreaterThanOrEqual(60);
    });

    it('should not detect high feature usage', () => {
      const features: FeatureUsageData[] = [
        {
          featureId: 'feature-1',
          featureName: 'Dashboard',
          activeUsers: 800,
          totalUsers: 1000,
          usageRate: 0.8,
          dateRange: { start: '2024-01-01', end: '2024-01-31' },
        },
      ];

      const opportunities = detector.detectFeatureUsageOpportunities(features);

      expect(opportunities).toHaveLength(0);
    });

    it('should not detect low usage with small user base', () => {
      const features: FeatureUsageData[] = [
        {
          featureId: 'feature-1',
          featureName: 'Beta Feature',
          activeUsers: 5,
          totalUsers: 50, // Too few users
          usageRate: 0.1,
          dateRange: { start: '2024-01-01', end: '2024-01-31' },
        },
      ];

      const opportunities = detector.detectFeatureUsageOpportunities(features);

      expect(opportunities).toHaveLength(0);
    });
  });
});

