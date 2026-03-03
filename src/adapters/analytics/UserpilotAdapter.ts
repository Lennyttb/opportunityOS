import axios, { AxiosInstance } from 'axios';
import { FunnelData, FunnelStep, NPSData, NPSResponse, FeatureUsageData, UserpilotConfig, DateRange } from '../../types';
import { Logger } from '../../utils/Logger';
import { retry } from '../../utils/retry';
import { IAnalyticsAdapter } from './IAnalyticsAdapter';

// Internal types for Userpilot API raw responses
interface UserpilotFunnelResponse {
  id?: string;
  funnel_id?: string;
  name?: string;
  funnel_name?: string;
  steps?: Array<{
    name?: string;
    step_name?: string;
    user_count?: number;
    users?: number;
    dropoff_rate?: number;
    drop_rate?: number;
  }>;
  date_range?: { start?: string; end?: string };
  start_date?: string;
  end_date?: string;
}

interface UserpilotNPSResponse {
  score?: number;
  nps_score?: number;
  response_count?: number;
  total_responses?: number;
  detractors?: NPSResponse[];
  passives?: NPSResponse[];
  promoters?: NPSResponse[];
  date_range?: { start?: string; end?: string };
  start_date?: string;
  end_date?: string;
}

interface UserpilotFeatureResponse {
  id?: string;
  feature_id?: string;
  name?: string;
  feature_name?: string;
  active_users?: number;
  users?: number;
  total_users?: number;
  total?: number;
  date_range?: { start?: string; end?: string };
  start_date?: string;
  end_date?: string;
}

/**
 * UserpilotAdapter handles communication with Userpilot API
 * Implements IAnalyticsAdapter interface for provider-agnostic analytics integration
 */
export class UserpilotAdapter implements IAnalyticsAdapter {
  private client: AxiosInstance;
  private logger: Logger;

  constructor(config: UserpilotConfig) {
    // Validate required configuration
    if (!config.apiToken) {
      throw new Error('UserpilotAdapter: apiToken is required in configuration');
    }

    this.logger = Logger.getInstance().child('UserpilotAdapter');

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.userpilot.io/v1',
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.logger.info('UserpilotAdapter initialized', {
      baseUrl: config.baseUrl || 'https://api.userpilot.io/v1',
    });
  }

  /**
   * Implements IAnalyticsAdapter.getFunnels
   * Fetch all funnels from Userpilot
   */
  public async getFunnels(dateRange?: DateRange): Promise<FunnelData[]> {
    this.logger.debug('Fetching all funnels', { dateRange });

    return retry(async () => {
      const params = dateRange
        ? { start_date: dateRange.start, end_date: dateRange.end }
        : {};

      const response = await this.client.get('/funnels', { params });

      this.logger.info('Fetched all funnels', {
        count: response.data.funnels?.length,
      });

      return response.data.funnels.map((funnel: UserpilotFunnelResponse) => this.normalizeFunnelData(funnel));
    });
  }

  /**
   * Implements IAnalyticsAdapter.getNPS
   * Fetch NPS data from Userpilot
   * Returns array with single NPS result to match interface
   */
  public async getNPS(dateRange?: DateRange): Promise<NPSData[]> {
    this.logger.debug('Fetching NPS data', { dateRange });

    return retry(async () => {
      const params = dateRange
        ? { start_date: dateRange.start, end_date: dateRange.end }
        : {};

      const response = await this.client.get('/nps', { params });

      this.logger.info('Fetched NPS data', {
        score: response.data.score,
        responseCount: response.data.response_count,
      });

      // Wrap single NPS result in array to match interface
      return [this.normalizeNPSData(response.data)];
    });
  }

  /**
   * Implements IAnalyticsAdapter.getFeatureUsage
   * Fetch feature usage data from Userpilot
   */
  public async getFeatureUsage(dateRange?: DateRange): Promise<FeatureUsageData[]> {
    this.logger.debug('Fetching feature usage data', { dateRange });

    return retry(async () => {
      const params = dateRange
        ? { start_date: dateRange.start, end_date: dateRange.end }
        : {};

      const response = await this.client.get('/features/usage', { params });

      const features = response.data.features || [];

      this.logger.info('Fetched feature usage data', {
        count: features.length,
      });

      return features.map((feature: UserpilotFeatureResponse) => this.normalizeFeatureUsageData(feature));
    });
  }

  /**
   * Normalize funnel data from Userpilot API format
   */
  private normalizeFunnelData(data: UserpilotFunnelResponse): FunnelData {
    return {
      funnelId: data.id ?? data.funnel_id ?? '',
      funnelName: data.name ?? data.funnel_name ?? '',
      steps: (data.steps || []).map((step): FunnelStep => ({
        stepName: step.name ?? step.step_name ?? '',
        userCount: step.user_count ?? step.users ?? 0,
        dropoffRate: step.dropoff_rate ?? step.drop_rate ?? 0,
      })),
      dateRange: {
        start: data.date_range?.start || data.start_date || new Date().toISOString(),
        end: data.date_range?.end || data.end_date || new Date().toISOString(),
      },
    };
  }

  /**
   * Normalize NPS data from Userpilot API format
   */
  private normalizeNPSData(data: UserpilotNPSResponse): NPSData {
    return {
      score: data.score ?? data.nps_score ?? 0,
      responseCount: data.response_count ?? data.total_responses ?? 0,
      detractors: data.detractors || [],
      passives: data.passives || [],
      promoters: data.promoters || [],
      dateRange: {
        start: data.date_range?.start || data.start_date || new Date().toISOString(),
        end: data.date_range?.end || data.end_date || new Date().toISOString(),
      },
    };
  }

  /**
   * Normalize feature usage data from Userpilot API format
   */
  private normalizeFeatureUsageData(data: UserpilotFeatureResponse): FeatureUsageData {
    const activeUsers = data.active_users ?? data.users ?? 0;
    const totalUsers = data.total_users ?? data.total ?? 0;

    return {
      featureId: data.id ?? data.feature_id ?? '',
      featureName: data.name ?? data.feature_name ?? '',
      activeUsers,
      totalUsers,
      usageRate: totalUsers > 0 ? activeUsers / totalUsers : 0,
      dateRange: {
        start: data.date_range?.start || data.start_date || new Date().toISOString(),
        end: data.date_range?.end || data.end_date || new Date().toISOString(),
      },
    };
  }
}
