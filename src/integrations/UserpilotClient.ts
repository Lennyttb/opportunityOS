import axios, { AxiosInstance } from 'axios';
import { FunnelData, NPSData, FeatureUsageData, UserpilotConfig } from '../types';
import { Logger } from '../utils/Logger';
import { retry } from '../utils/retry';

/**
 * UserpilotClient handles communication with Userpilot API
 */
export class UserpilotClient {
  private client: AxiosInstance;
  private logger: Logger;

  constructor(config: UserpilotConfig) {
    this.logger = Logger.getInstance().child('UserpilotClient');

    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.logger.info('UserpilotClient initialized', {
      baseUrl: config.baseUrl,
    });
  }

  /**
   * Fetch funnel data from Userpilot
   */
  public async getFunnelData(funnelId: string, dateRange?: { start: string; end: string }): Promise<FunnelData> {
    this.logger.debug('Fetching funnel data', { funnelId, dateRange });

    return retry(async () => {
      const params = dateRange
        ? { start_date: dateRange.start, end_date: dateRange.end }
        : {};

      const response = await this.client.get(`/funnels/${funnelId}`, { params });

      this.logger.info('Fetched funnel data', {
        funnelId,
        steps: response.data.steps?.length,
      });

      return this.normalizeFunnelData(response.data);
    });
  }

  /**
   * Fetch all funnels
   */
  public async getAllFunnels(dateRange?: { start: string; end: string }): Promise<FunnelData[]> {
    this.logger.debug('Fetching all funnels', { dateRange });

    return retry(async () => {
      const params = dateRange
        ? { start_date: dateRange.start, end_date: dateRange.end }
        : {};

      const response = await this.client.get('/funnels', { params });

      this.logger.info('Fetched all funnels', {
        count: response.data.funnels?.length,
      });

      return response.data.funnels.map((funnel: any) => this.normalizeFunnelData(funnel));
    });
  }

  /**
   * Fetch NPS data from Userpilot
   */
  public async getNPSData(dateRange?: { start: string; end: string }): Promise<NPSData> {
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

      return this.normalizeNPSData(response.data);
    });
  }

  /**
   * Fetch feature usage data from Userpilot
   */
  public async getFeatureUsageData(
    featureId?: string,
    dateRange?: { start: string; end: string }
  ): Promise<FeatureUsageData[]> {
    this.logger.debug('Fetching feature usage data', { featureId, dateRange });

    return retry(async () => {
      const params = dateRange
        ? { start_date: dateRange.start, end_date: dateRange.end }
        : {};

      const endpoint = featureId ? `/features/${featureId}/usage` : '/features/usage';
      const response = await this.client.get(endpoint, { params });

      const features = featureId ? [response.data] : response.data.features;

      this.logger.info('Fetched feature usage data', {
        count: features.length,
      });

      return features.map((feature: any) => this.normalizeFeatureUsageData(feature));
    });
  }

  /**
   * Normalize funnel data from Userpilot API format
   */
  private normalizeFunnelData(data: any): FunnelData {
    return {
      funnelId: data.id || data.funnel_id,
      funnelName: data.name || data.funnel_name,
      steps: (data.steps || []).map((step: any) => ({
        stepName: step.name || step.step_name,
        userCount: step.user_count || step.users || 0,
        dropoffRate: step.dropoff_rate || step.drop_rate || 0,
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
  private normalizeNPSData(data: any): NPSData {
    return {
      score: data.score || data.nps_score || 0,
      responseCount: data.response_count || data.total_responses || 0,
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
  private normalizeFeatureUsageData(data: any): FeatureUsageData {
    const activeUsers = data.active_users || data.users || 0;
    const totalUsers = data.total_users || data.total || 0;

    return {
      featureId: data.id || data.feature_id,
      featureName: data.name || data.feature_name,
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

