import axios from 'axios';
import { UserpilotAdapter } from './UserpilotAdapter';
import { Logger } from '../../utils/Logger';

jest.mock('axios');
jest.mock('../../utils/Logger');
jest.mock('../../utils/retry', () => ({
  retry: jest.fn((fn) => fn()),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('UserpilotAdapter', () => {
  let adapter: UserpilotAdapter;
  let mockAxiosInstance: { get: jest.Mock; post: jest.Mock };

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

    adapter = new UserpilotAdapter({
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

  describe('getFunnels', () => {
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

      const result = await adapter.getFunnels();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/funnels', { params: {} });
      expect(result).toHaveLength(2);
      expect(result[0].funnelId).toBe('funnel-1');
      expect(result[1].funnelId).toBe('funnel-2');
    });
  });

  describe('getNPS', () => {
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

      const result = await adapter.getNPS();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/nps', { params: {} });
      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(45);
      expect(result[0].responseCount).toBe(100);
      expect(result[0].detractors).toHaveLength(1);
      expect(result[0].passives).toHaveLength(1);
      expect(result[0].promoters).toHaveLength(1);
    });

    it('should return array with single element', async () => {
      const mockResponse = {
        data: {
          score: 50,
          response_count: 200,
          detractors: [],
          passives: [],
          promoters: [],
          start_date: '2024-01-01T00:00:00Z',
          end_date: '2024-01-31T23:59:59Z',
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await adapter.getNPS();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('score');
      expect(result[0]).toHaveProperty('responseCount');
    });
  });

  describe('getFeatureUsage', () => {
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

      const result = await adapter.getFeatureUsage();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/features/usage', { params: {} });
      expect(result).toHaveLength(1);
      expect(result[0].featureId).toBe('feature-1');
      expect(result[0].usageRate).toBe(0.5);
    });
  });
});
