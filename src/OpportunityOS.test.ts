import { OpportunityOS } from './OpportunityOS';
import { OpportunityStatus, OpportunityType } from './types';
import { Logger } from './utils/Logger';

jest.mock('./config/ConfigurationManager');
jest.mock('./core/OpportunityStore');
jest.mock('./core/OpportunityDetector');
jest.mock('./integrations/UserpilotClient');
jest.mock('./integrations/SlackNotifier');
jest.mock('./integrations/KiroAgent');
jest.mock('./utils/Logger');
jest.mock('node-cron');

describe('OpportunityOS', () => {
  let opportunityOS: OpportunityOS;

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

    opportunityOS = new OpportunityOS(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize OpportunityOS', () => {
      expect(opportunityOS).toBeInstanceOf(OpportunityOS);
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

      (opportunityOS as any).store.getAll = jest.fn().mockReturnValue(mockOpportunities);

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

      (opportunityOS as any).store.getByStatus = jest
        .fn()
        .mockReturnValue(mockOpportunities);

      const result = opportunityOS.getOpportunitiesByStatus(OpportunityStatus.PROMOTED);

      expect(result).toEqual(mockOpportunities);
      expect((opportunityOS as any).store.getByStatus).toHaveBeenCalledWith(
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

      (opportunityOS as any).store.get = jest.fn().mockReturnValue(mockOpportunity);

      const result = opportunityOS.getOpportunity('opp-1');

      expect(result).toEqual(mockOpportunity);
      expect((opportunityOS as any).store.get).toHaveBeenCalledWith('opp-1');
    });
  });
});

