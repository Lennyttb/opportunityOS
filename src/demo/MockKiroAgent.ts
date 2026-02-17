import { KiroConfig, SpecGenerationRequest, SpecGenerationResponse } from '../types';
import { Logger } from '../utils/Logger';

/**
 * Mock KiroAgent for testing without real Kiro API
 */
export class MockKiroAgent {
  private logger: Logger;
  private generatedSpecs: Map<string, string> = new Map();

  constructor(_config: KiroConfig) {
    this.logger = Logger.getInstance().child('MockKiroAgent');
    this.logger.info('MockKiroAgent initialized (DEMO MODE)');
  }

  /**
   * Generate a mock spec
   */
  public async generateSpec(request: SpecGenerationRequest): Promise<SpecGenerationResponse> {
    this.logger.info('🤖 GENERATING MOCK SPEC', {
      opportunityId: request.opportunityId,
      title: request.title,
    });

    // Simulate AI processing time
    await this.sleep(2000);

    const specUrl = `https://demo.kiro.ai/specs/${request.opportunityId}`;
    this.generatedSpecs.set(request.opportunityId, specUrl);

    console.log('\n' + '='.repeat(80));
    console.log('🤖 KIRO AI - SPEC GENERATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`Opportunity: ${request.title}`);
    console.log(`\nGenerated PRD Summary:`);
    console.log(`\n## Problem Statement`);
    console.log(request.description);
    console.log(`\n## Evidence`);
    request.evidence.insights.forEach((insight) => {
      console.log(`  • ${insight}`);
    });
    console.log(`\n## Proposed Solution`);
    console.log(`Based on the evidence, we recommend:`);
    console.log(`  1. Analyze the friction points in the user journey`);
    console.log(`  2. Implement A/B tests to validate solutions`);
    console.log(`  3. Monitor key metrics post-implementation`);
    console.log(`\n## Success Metrics`);
    Object.entries(request.evidence.metrics).forEach(([key, value]) => {
      console.log(`  • Improve ${key} from ${value}`);
    });
    console.log(`\n📄 Full Spec URL: ${specUrl}`);
    console.log('='.repeat(80) + '\n');

    return {
      specUrl,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Check spec generation status (always completed in mock)
   */
  public async getSpecStatus(opportunityId: string): Promise<{
    status: 'pending' | 'completed' | 'failed';
    specUrl?: string;
    error?: string;
  }> {
    const specUrl = this.generatedSpecs.get(opportunityId);

    if (specUrl) {
      return {
        status: 'completed',
        specUrl,
      };
    }

    return {
      status: 'pending',
    };
  }

  /**
   * Provide feedback on a generated spec
   */
  public async provideFeedback(
    opportunityId: string,
    feedback: {
      rating: number;
      comments?: string;
      actualImpact?: Record<string, number>;
    }
  ): Promise<void> {
    this.logger.info('📊 MOCK FEEDBACK RECEIVED', {
      opportunityId,
      rating: feedback.rating,
    });

    console.log('\n' + '-'.repeat(80));
    console.log('📊 FEEDBACK SUBMITTED TO KIRO AI');
    console.log('-'.repeat(80));
    console.log(`Opportunity ID: ${opportunityId}`);
    console.log(`Rating: ${'⭐'.repeat(feedback.rating)} (${feedback.rating}/5)`);
    if (feedback.comments) {
      console.log(`Comments: ${feedback.comments}`);
    }
    if (feedback.actualImpact) {
      console.log(`\nActual Impact:`);
      Object.entries(feedback.actualImpact).forEach(([key, value]) => {
        console.log(`  • ${key}: ${value}`);
      });
    }
    console.log(`\n✅ This feedback will improve future opportunity detection`);
    console.log('-'.repeat(80) + '\n');
  }

  /**
   * Get all generated specs (for demo inspection)
   */
  public getGeneratedSpecs(): Map<string, string> {
    return new Map(this.generatedSpecs);
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

