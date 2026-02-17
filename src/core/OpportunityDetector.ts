import { v4 as uuidv4 } from 'uuid';
import {
  Opportunity,
  OpportunityType,
  OpportunityStatus,
  FunnelData,
  NPSData,
  FeatureUsageData,
} from '../types';
import { Logger } from '../utils/Logger';

/**
 * OpportunityDetector analyzes data and detects product opportunities
 */
export class OpportunityDetector {
  private logger: Logger;
  private minOpportunityScore: number;

  constructor(minOpportunityScore: number = 60) {
    this.logger = Logger.getInstance().child('OpportunityDetector');
    this.minOpportunityScore = minOpportunityScore;
  }

  /**
   * Detect opportunities from funnel data
   */
  public detectFunnelOpportunities(funnels: FunnelData[]): Opportunity[] {
    this.logger.info('Detecting funnel opportunities', { funnelCount: funnels.length });

    const opportunities: Opportunity[] = [];

    for (const funnel of funnels) {
      // Find steps with high dropoff rates
      for (let i = 0; i < funnel.steps.length; i++) {
        const step = funnel.steps[i];

        // Detect significant dropoff (>30%)
        if (step.dropoffRate > 0.3) {
          const score = this.calculateFunnelScore(step.dropoffRate, step.userCount);

          if (score >= this.minOpportunityScore) {
            const opportunity = this.createFunnelOpportunity(funnel, step, i, score);
            opportunities.push(opportunity);
          }
        }
      }
    }

    this.logger.info('Detected funnel opportunities', { count: opportunities.length });
    return opportunities;
  }

  /**
   * Detect opportunities from NPS data
   */
  public detectNPSOpportunities(npsData: NPSData): Opportunity[] {
    this.logger.info('Detecting NPS opportunities', { score: npsData.score });

    const opportunities: Opportunity[] = [];

    // Detect low NPS (< 30)
    if (npsData.score < 30 && npsData.responseCount >= 20) {
      const score = this.calculateNPSScore(npsData.score, npsData.responseCount);

      if (score >= this.minOpportunityScore) {
        const opportunity = this.createNPSOpportunity(npsData, score);
        opportunities.push(opportunity);
      }
    }

    this.logger.info('Detected NPS opportunities', { count: opportunities.length });
    return opportunities;
  }

  /**
   * Detect opportunities from feature usage data
   */
  public detectFeatureUsageOpportunities(features: FeatureUsageData[]): Opportunity[] {
    this.logger.info('Detecting feature usage opportunities', {
      featureCount: features.length,
    });

    const opportunities: Opportunity[] = [];

    for (const feature of features) {
      // Detect low usage (< 20%)
      if (feature.usageRate < 0.2 && feature.totalUsers >= 100) {
        const score = this.calculateFeatureUsageScore(
          feature.usageRate,
          feature.totalUsers
        );

        if (score >= this.minOpportunityScore) {
          const opportunity = this.createFeatureUsageOpportunity(feature, score);
          opportunities.push(opportunity);
        }
      }
    }

    this.logger.info('Detected feature usage opportunities', {
      count: opportunities.length,
    });
    return opportunities;
  }

  /**
   * Calculate score for funnel dropoff
   */
  private calculateFunnelScore(dropoffRate: number, userCount: number): number {
    // Base score from dropoff rate (0-70 points)
    const dropoffScore = Math.min(dropoffRate * 100, 70);

    // Impact multiplier based on user count (0-30 points)
    const impactScore = Math.min((userCount / 1000) * 30, 30);

    return Math.round(dropoffScore + impactScore);
  }

  /**
   * Calculate score for NPS
   */
  private calculateNPSScore(npsScore: number, responseCount: number): number {
    // Inverse NPS score (lower NPS = higher opportunity score, 0-70 points)
    const baseScore = Math.max(0, (30 - npsScore) * 2);

    // Confidence multiplier based on response count (0-30 points)
    const confidenceScore = Math.min((responseCount / 100) * 30, 30);

    return Math.round(baseScore + confidenceScore);
  }

  /**
   * Calculate score for feature usage
   */
  private calculateFeatureUsageScore(usageRate: number, totalUsers: number): number {
    // Inverse usage rate (lower usage = higher opportunity score, 0-70 points)
    const baseScore = (1 - usageRate) * 70;

    // Potential impact based on total users (0-30 points)
    const impactScore = Math.min((totalUsers / 1000) * 30, 30);

    return Math.round(baseScore + impactScore);
  }

  /**
   * Create opportunity from funnel data
   */
  private createFunnelOpportunity(
    funnel: FunnelData,
    step: any,
    stepIndex: number,
    score: number
  ): Opportunity {
    const insights = [
      `${(step.dropoffRate * 100).toFixed(1)}% dropoff at step ${stepIndex + 1}`,
      `Affecting ${step.userCount} users`,
    ];

    if (step.dropoffRate > 0.5) {
      insights.push('Critical: Over 50% dropoff rate');
    }

    return {
      id: uuidv4(),
      type: OpportunityType.FUNNEL_DROP,
      status: OpportunityStatus.DETECTED,
      score,
      title: `High Dropoff in ${funnel.funnelName} - ${step.stepName}`,
      description: `Users are dropping off at "${step.stepName}" with a ${(
        step.dropoffRate * 100
      ).toFixed(1)}% dropoff rate.`,
      evidence: {
        dataSource: 'userpilot',
        rawData: funnel,
        metrics: {
          dropoffRate: step.dropoffRate,
          userCount: step.userCount,
          stepIndex,
        },
        insights,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Create opportunity from NPS data
   */
  private createNPSOpportunity(npsData: NPSData, score: number): Opportunity {
    const insights = [
      `NPS score of ${npsData.score} (below 30 threshold)`,
      `${npsData.detractors.length} detractors out of ${npsData.responseCount} responses`,
    ];

    // Analyze detractor feedback
    const feedbackSample = npsData.detractors
      .filter((d) => d.feedback)
      .slice(0, 3)
      .map((d) => d.feedback);

    if (feedbackSample.length > 0) {
      insights.push(`Common feedback: "${feedbackSample[0]}"`);
    }

    return {
      id: uuidv4(),
      type: OpportunityType.LOW_NPS,
      status: OpportunityStatus.DETECTED,
      score,
      title: `Low NPS Score: ${npsData.score}`,
      description: `Product has a low NPS score of ${npsData.score} with ${npsData.detractors.length} detractors.`,
      evidence: {
        dataSource: 'userpilot',
        rawData: npsData,
        metrics: {
          npsScore: npsData.score,
          detractorCount: npsData.detractors.length,
          responseCount: npsData.responseCount,
        },
        insights,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Create opportunity from feature usage data
   */
  private createFeatureUsageOpportunity(
    feature: FeatureUsageData,
    score: number
  ): Opportunity {
    const usagePercent = (feature.usageRate * 100).toFixed(1);
    const insights = [
      `Only ${usagePercent}% usage rate`,
      `${feature.totalUsers - feature.activeUsers} users not using this feature`,
    ];

    if (feature.usageRate < 0.1) {
      insights.push('Critical: Less than 10% adoption');
    }

    return {
      id: uuidv4(),
      type: OpportunityType.FEATURE_UNDERUSE,
      status: OpportunityStatus.DETECTED,
      score,
      title: `Low Adoption of ${feature.featureName}`,
      description: `Feature "${feature.featureName}" has only ${usagePercent}% adoption rate.`,
      evidence: {
        dataSource: 'userpilot',
        rawData: feature,
        metrics: {
          usageRate: feature.usageRate,
          activeUsers: feature.activeUsers,
          totalUsers: feature.totalUsers,
        },
        insights,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

