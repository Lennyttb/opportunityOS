import axios, { AxiosInstance } from 'axios';
import { KiroConfig, SpecGenerationRequest, SpecGenerationResponse } from '../types';
import { Logger } from '../utils/Logger';
import { retry } from '../utils/retry';

/**
 * KiroAgent handles communication with Kiro AI agent for spec generation
 */
export class KiroAgent {
  private client: AxiosInstance;
  private logger: Logger;

  constructor(config: KiroConfig) {
    this.logger = Logger.getInstance().child('KiroAgent');

    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 2 minutes for spec generation
    });

    this.logger.info('KiroAgent initialized', {
      baseUrl: config.baseUrl,
    });
  }

  /**
   * Generate a spec from an opportunity
   */
  public async generateSpec(request: SpecGenerationRequest): Promise<SpecGenerationResponse> {
    this.logger.info('Requesting spec generation', {
      opportunityId: request.opportunityId,
      title: request.title,
    });

    return retry(
      async () => {
        const response = await this.client.post('/specs/generate', {
          opportunity_id: request.opportunityId,
          title: request.title,
          description: request.description,
          evidence: {
            data_source: request.evidence.dataSource,
            raw_data: request.evidence.rawData,
            metrics: request.evidence.metrics,
            insights: request.evidence.insights,
          },
        });

        this.logger.info('Spec generation completed', {
          opportunityId: request.opportunityId,
          specUrl: response.data.spec_url,
        });

        return {
          specUrl: response.data.spec_url,
          generatedAt: response.data.generated_at || new Date().toISOString(),
        };
      },
      {
        maxAttempts: 2, // Spec generation is expensive, limit retries
        delayMs: 5000,
      }
    );
  }

  /**
   * Check the status of a spec generation request
   */
  public async getSpecStatus(opportunityId: string): Promise<{
    status: 'pending' | 'completed' | 'failed';
    specUrl?: string;
    error?: string;
  }> {
    this.logger.debug('Checking spec generation status', { opportunityId });

    const response = await this.client.get(`/specs/${opportunityId}/status`);

    return {
      status: response.data.status,
      specUrl: response.data.spec_url,
      error: response.data.error,
    };
  }

  /**
   * Provide feedback on a generated spec
   */
  public async provideFeedback(
    opportunityId: string,
    feedback: {
      rating: number; // 1-5
      comments?: string;
      actualImpact?: Record<string, number>;
    }
  ): Promise<void> {
    this.logger.info('Providing spec feedback', {
      opportunityId,
      rating: feedback.rating,
    });

    await this.client.post(`/specs/${opportunityId}/feedback`, {
      rating: feedback.rating,
      comments: feedback.comments,
      actual_impact: feedback.actualImpact,
    });

    this.logger.info('Feedback submitted', { opportunityId });
  }
}

