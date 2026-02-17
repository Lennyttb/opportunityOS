import axios from 'axios';
import { KiroAgent } from './KiroAgent';
import { SpecGenerationRequest } from '../types';
import { Logger } from '../utils/Logger';

jest.mock('axios');
jest.mock('../utils/Logger');
jest.mock('../utils/retry', () => ({
  retry: jest.fn((fn) => fn()),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('KiroAgent', () => {
  let agent: KiroAgent;
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

    agent = new KiroAgent({
      apiKey: 'test-kiro-key',
      baseUrl: 'https://api.kiro.ai/v1',
    });
  });

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.kiro.ai/v1',
        headers: {
          Authorization: 'Bearer test-kiro-key',
          'Content-Type': 'application/json',
        },
        timeout: 120000,
      });
    });
  });

  describe('generateSpec', () => {
    it('should generate spec from opportunity', async () => {
      const request: SpecGenerationRequest = {
        opportunityId: 'opp-123',
        title: 'Improve Checkout Flow',
        description: 'Users are dropping off at payment step',
        evidence: {
          dataSource: 'userpilot',
          rawData: {} as any,
          metrics: { dropoffRate: 0.45 },
          insights: ['High dropoff at payment'],
        },
      };

      const mockResponse = {
        data: {
          spec_url: 'https://kiro.ai/specs/spec-456',
          generated_at: '2024-01-01T12:00:00Z',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await agent.generateSpec(request);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/specs/generate', {
        opportunity_id: 'opp-123',
        title: 'Improve Checkout Flow',
        description: 'Users are dropping off at payment step',
        evidence: {
          data_source: 'userpilot',
          raw_data: {},
          metrics: { dropoffRate: 0.45 },
          insights: ['High dropoff at payment'],
        },
      });

      expect(result).toEqual({
        specUrl: 'https://kiro.ai/specs/spec-456',
        generatedAt: '2024-01-01T12:00:00Z',
      });
    });

    it('should use current timestamp if not provided', async () => {
      const request: SpecGenerationRequest = {
        opportunityId: 'opp-123',
        title: 'Test',
        description: 'Test',
        evidence: {
          dataSource: 'userpilot',
          rawData: {} as any,
          metrics: {},
          insights: [],
        },
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          spec_url: 'https://kiro.ai/specs/spec-456',
        },
      });

      const result = await agent.generateSpec(request);

      expect(result.generatedAt).toBeDefined();
      expect(new Date(result.generatedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('getSpecStatus', () => {
    it('should check spec generation status', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          status: 'completed',
          spec_url: 'https://kiro.ai/specs/spec-456',
        },
      });

      const result = await agent.getSpecStatus('opp-123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/specs/opp-123/status');
      expect(result).toEqual({
        status: 'completed',
        specUrl: 'https://kiro.ai/specs/spec-456',
        error: undefined,
      });
    });

    it('should return error status when failed', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          status: 'failed',
          error: 'Insufficient data',
        },
      });

      const result = await agent.getSpecStatus('opp-123');

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Insufficient data');
    });
  });

  describe('provideFeedback', () => {
    it('should submit feedback for generated spec', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} });

      await agent.provideFeedback('opp-123', {
        rating: 4,
        comments: 'Great spec!',
        actualImpact: { conversionRate: 0.15 },
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/specs/opp-123/feedback', {
        rating: 4,
        comments: 'Great spec!',
        actual_impact: { conversionRate: 0.15 },
      });
    });
  });
});

