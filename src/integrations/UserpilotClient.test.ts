import axios from 'axios';
import { UserpilotClient } from './UserpilotClient';
import { Logger } from '../utils/Logger';

jest.mock('axios');
jest.mock('../utils/Logger');
jest.mock('../utils/retry', () => ({
  retry: jest.fn((fn) => fn()),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('UserpilotClient', () => {
  let client: UserpilotClient;
  let mockAxiosInstance: any;

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

    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
    };

    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

    client = new UserpilotClient({
      apiToken: 'test-token',
      baseUrl: 'https://api.userpilot.io/v1',
    });
  });

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.userpilot.io/v1',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    });
  });

  describe('getFunnelData', () => {
    it('should fetch and normalize funnel data', async () => {
      const mockResponse = {
        data: {
          id: 'funnel-123',
          name: 'Onboarding Funnel',
          steps: [
            { name: 'Step 1', user_count: 100, dropoff_rate: 0.1 },
            { name: 'Step 2', user_count: 90, dropoff_rate: 0.2 },
          ],
          start_date: '2024-01-01T00:00:00Z',
          end_date: '2024-01-31T23:59:59Z',
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getFunnelData('funnel-123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/funnels/funnel-123', {
        params: {},
      });

      expect(result).toEqual({
        funnelId: 'funnel-123',
        funnelName: 'Onboarding Funnel',
        steps: [
          { stepName: 'Step 1', userCount: 100, dropoffRate: 0.1 },
          { stepName: 'Step 2', userCount: 90, dropoffRate: 0.2 },
        ],
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
      });
    });

    it('should include date range in params when provided', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { id: 'funnel-123', steps: [] } });

      await client.getFunnelData('funnel-123', {
        start: '2024-01-01',
        end: '2024-01-31',
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/funnels/funnel-123', {
        params: { start_date: '2024-01-01', end_date: '2024-01-31' },
      });
    });
  });

  describe('getAllFunnels', () => {
    it('should fetch and normalize all funnels', async () => {
      const mockResponse = {
        data: {
          funnels: [
            { id: 'funnel-1', name: 'Funnel 1', steps: [] },
            { id: 'funnel-2', name: 'Funnel 2', steps: [] },
          ],
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getAllFunnels();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/funnels', { params: {} });
      expect(result).toHaveLength(2);
      expect(result[0].funnelId).toBe('funnel-1');
      expect(result[1].funnelId).toBe('funnel-2');
    });
  });

  describe('getNPSData', () => {
    it('should fetch and normalize NPS data', async () => {
      const mockResponse = {
        data: {
          score: 45,
          response_count: 100,
          detractors: [{ userId: 'user-1', score: 3, feedback: 'Not good' }],
          passives: [{ userId: 'user-2', score: 7 }],
          promoters: [{ userId: 'user-3', score: 9 }],
          start_date: '2024-01-01T00:00:00Z',
          end_date: '2024-01-31T23:59:59Z',
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getNPSData();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/nps', { params: {} });
      expect(result.score).toBe(45);
      expect(result.responseCount).toBe(100);
      expect(result.detractors).toHaveLength(1);
      expect(result.passives).toHaveLength(1);
      expect(result.promoters).toHaveLength(1);
    });
  });

  describe('getFeatureUsageData', () => {
    it('should fetch all feature usage data when no featureId provided', async () => {
      const mockResponse = {
        data: {
          features: [
            {
              id: 'feature-1',
              name: 'Feature 1',
              active_users: 50,
              total_users: 100,
            },
          ],
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getFeatureUsageData();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/features/usage', { params: {} });
      expect(result).toHaveLength(1);
      expect(result[0].featureId).toBe('feature-1');
      expect(result[0].usageRate).toBe(0.5);
    });
  });
});

