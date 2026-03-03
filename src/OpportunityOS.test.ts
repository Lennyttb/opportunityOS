import { OpportunityOS } from './OpportunityOS';
import { OpportunityStatus, OpportunityType } from './types';
import { Logger } from './utils/Logger';
import { createAnalyticsAdapter } from './adapters/analytics/AnalyticsAdapterFactory';
import type { ConfigurationManager as ConfigurationManagerType } from './config/ConfigurationManager';

jest.mock('./config/ConfigurationManager');
jest.mock('./core/OpportunityStore');
jest.mock('./core/OpportunityDetector');
jest.mock('./integrations/SlackNotifier');
jest.mock('./integrations/KiroAgent');
jest.mock('./utils/Logger');
jest.mock('node-cron');
jest.mock('./adapters/analytics/AnalyticsAdapterFactory', () => ({
  createAnalyticsAdapter: jest.fn().mockReturnValue({
    getFunnels: jest.fn().mockResolvedValue([]),
    getNPS: jest.fn().mockResolvedValue([]),
    getFeatureUsage: jest.fn().mockResolvedValue([]),
  }),
}));

describe('OpportunityOS', () => {
  let opportunityOS: OpportunityOS;
  let mockConfigManager: jest.Mocked<ConfigurationManagerType>;

  const mockConfig = {
    userpilot: { apiToken: 'test-token' },
    slack: { botToken: 'xoxb-test', appToken: 'xapp-test', channelId: 'C123' },
    kiro: { apiKey: 'test-key' },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    Logger.getInstance = jest.fn().mockReturnValue(mockLogger);

    // Mock ConfigurationManager to return config values
    const configMap: Record<string, unknown> = {
      userpilot: mockConfig.userpilot,
      slack: mockConfig.slack,
      kiro: mockConfig.kiro,
      logLevel: 'info',
      dataStorePath: './data/opportunities.json',
      minOpportunityScore: 60,
      detectionSchedule: '0 9 * * 1',
      autoGenerateSpecs: false,
    };

    mockConfigManager = {
      get: jest.fn((key: string) => configMap[key]),
      getConfig: jest.fn().mockReturnValue(mockConfig),
    } as unknown as jest.Mocked<ConfigurationManagerType>;

    const { ConfigurationManager } = jest.requireMock('./config/ConfigurationManager') as { ConfigurationManager: jest.Mock };
    ConfigurationManager.mockImplementation(() => mockConfigManager);

    opportunityOS = new OpportunityOS(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize OpportunityOS', () => {
      expect(opportunityOS).toBeInstanceOf(OpportunityOS);
    });

    it('should create analytics adapter using factory with correct config', () => {
      expect(createAnalyticsAdapter).toHaveBeenCalledWith({
        adapter: 'userpilot',
        config: mockConfig.userpilot,
      });
    });
  });

  describe('getOpportunities', () => {
    it('should return all opportunities from store', () => {
      const mockOpportunities = [
        {
          id: 'opp-1',
          type: OpportunityType.FUNNEL_DROP,
          status: OpportunityStatus.DETECTED,
          score: 85,
          title: 'Test Opportunity',
          description: 'Test',
          evidence: {
            dataSource: 'userpilot' as const,
            rawData: {},
            metrics: {},
            insights: [],
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      (opportunityOS as unknown as { store: { getAll: jest.Mock } }).store.getAll = jest.fn().mockReturnValue(mockOpportunities);

      const result = opportunityOS.getOpportunities();

      expect(result).toEqual(mockOpportunities);
    });
  });

  describe('getOpportunitiesByStatus', () => {
    it('should return opportunities filtered by status', () => {
      const mockOpportunities = [
        {
          id: 'opp-1',
          status: OpportunityStatus.PROMOTED,
        },
      ];

      const storeWithStatus = opportunityOS as unknown as { store: { getByStatus: jest.Mock } };
      storeWithStatus.store.getByStatus = jest
        .fn()
        .mockReturnValue(mockOpportunities);

      const result = opportunityOS.getOpportunitiesByStatus(OpportunityStatus.PROMOTED);

      expect(result).toEqual(mockOpportunities);
      expect(storeWithStatus.store.getByStatus).toHaveBeenCalledWith(
        OpportunityStatus.PROMOTED
      );
    });
  });

  describe('getOpportunity', () => {
    it('should return a specific opportunity', () => {
      const mockOpportunity = {
        id: 'opp-1',
        type: OpportunityType.FUNNEL_DROP,
      };

      const storeWithGet = opportunityOS as unknown as { store: { get: jest.Mock } };
      storeWithGet.store.get = jest.fn().mockReturnValue(mockOpportunity);

      const result = opportunityOS.getOpportunity('opp-1');

      expect(result).toEqual(mockOpportunity);
      expect(storeWithGet.store.get).toHaveBeenCalledWith('opp-1');
    });
  });
});

