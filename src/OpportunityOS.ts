import * as cron from 'node-cron';
import { OpportunityOSConfig, Opportunity, OpportunityStatus } from './types';
import { ConfigurationManager } from './config/ConfigurationManager';
import { Logger } from './utils/Logger';
import { OpportunityStore } from './core/OpportunityStore';
import { OpportunityDetector } from './core/OpportunityDetector';
import { UserpilotClient } from './integrations/UserpilotClient';
import { SlackNotifier } from './integrations/SlackNotifier';
import { KiroAgent } from './integrations/KiroAgent';

/**
 * OpportunityOS - Main orchestrator class
 */
export class OpportunityOS {
  private config: ConfigurationManager;
  private logger: Logger;
  private store: OpportunityStore;
  private detector: OpportunityDetector;
  private userpilot: UserpilotClient;
  private slack: SlackNotifier;
  private kiro: KiroAgent;
  private cronJob?: cron.ScheduledTask;
  private isRunning: boolean = false;

  constructor(config: Partial<OpportunityOSConfig>) {
    this.config = new ConfigurationManager(config);
    this.logger = Logger.getInstance(
      this.config.get('logLevel'),
      'OpportunityOS'
    );

    // Initialize components
    this.store = new OpportunityStore(this.config.get('dataStorePath')!);
    this.detector = new OpportunityDetector(this.config.get('minOpportunityScore')!);
    this.userpilot = new UserpilotClient(this.config.get('userpilot'));
    this.slack = new SlackNotifier(this.config.get('slack'));
    this.kiro = new KiroAgent(this.config.get('kiro'));

    // Register Slack action handler
    this.slack.onAction(this.handleOpportunityAction.bind(this));

    this.logger.info('OpportunityOS initialized');
  }

  /**
   * Start OpportunityOS
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('OpportunityOS is already running');
      return;
    }

    this.logger.info('Starting OpportunityOS');

    // Initialize store
    await this.store.initialize();

    // Start Slack bot
    await this.slack.start();

    // Schedule detection job
    const schedule = this.config.get('detectionSchedule')!;
    this.cronJob = cron.schedule(schedule, async () => {
      await this.runDetection();
    });

    this.isRunning = true;
    this.logger.info('OpportunityOS started', { schedule });
  }

  /**
   * Stop OpportunityOS
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('OpportunityOS is not running');
      return;
    }

    this.logger.info('Stopping OpportunityOS');

    // Stop cron job
    if (this.cronJob) {
      this.cronJob.stop();
    }

    // Stop Slack bot
    await this.slack.stop();

    this.isRunning = false;
    this.logger.info('OpportunityOS stopped');
  }

  /**
   * Run opportunity detection manually
   */
  public async runDetection(): Promise<Opportunity[]> {
    this.logger.info('Running opportunity detection');

    try {
      const opportunities: Opportunity[] = [];

      // Fetch data from Userpilot
      const [funnels, npsData, features] = await Promise.all([
        this.userpilot.getAllFunnels(),
        this.userpilot.getNPSData(),
        this.userpilot.getFeatureUsageData(),
      ]);

      // Detect opportunities
      const funnelOpps = this.detector.detectFunnelOpportunities(funnels);
      const npsOpps = this.detector.detectNPSOpportunities(npsData);
      const featureOpps = this.detector.detectFeatureUsageOpportunities(features);

      opportunities.push(...funnelOpps, ...npsOpps, ...featureOpps);

      this.logger.info('Detection complete', {
        totalOpportunities: opportunities.length,
        funnel: funnelOpps.length,
        nps: npsOpps.length,
        feature: featureOpps.length,
      });

      // Store and post new opportunities
      for (const opp of opportunities) {
        await this.store.create(opp);

        // Post to Slack
        const messageTs = await this.slack.postOpportunity(opp);

        // Update with Slack message timestamp
        await this.store.update(opp.id, { slackMessageTs: messageTs });
      }

      return opportunities;
    } catch (error) {
      this.logger.error('Error during detection', error as Error);
      throw error;
    }
  }

  /**
   * Handle opportunity action from Slack
   */
  private async handleOpportunityAction(
    opportunityId: string,
    action: 'promote' | 'dismiss' | 'investigate'
  ): Promise<void> {
    this.logger.info('Handling opportunity action', { opportunityId, action });

    const opportunity = this.store.get(opportunityId);
    if (!opportunity) {
      this.logger.error('Opportunity not found', undefined, { opportunityId });
      return;
    }

    try {
      if (action === 'promote') {
        await this.promoteOpportunity(opportunity);
      } else if (action === 'dismiss') {
        await this.dismissOpportunity(opportunity);
      } else if (action === 'investigate') {
        await this.investigateOpportunity(opportunity);
      }
    } catch (error) {
      this.logger.error('Error handling action', error as Error, {
        opportunityId,
        action,
      });
      throw error;
    }
  }

  /**
   * Promote an opportunity (generate spec)
   */
  private async promoteOpportunity(opportunity: Opportunity): Promise<void> {
    this.logger.info('Promoting opportunity', { opportunityId: opportunity.id });

    // Update status to promoted
    const updated = await this.store.update(opportunity.id, {
      status: OpportunityStatus.PROMOTED,
    });

    // Update Slack message
    if (updated.slackMessageTs) {
      await this.slack.updateOpportunity(updated.slackMessageTs, updated);
    }

    // Generate spec via Kiro
    try {
      const spec = await this.kiro.generateSpec({
        opportunityId: opportunity.id,
        title: opportunity.title,
        description: opportunity.description,
        evidence: opportunity.evidence,
      });

      // Update with spec URL
      const withSpec = await this.store.update(opportunity.id, {
        status: OpportunityStatus.SPEC_GENERATED,
        specUrl: spec.specUrl,
      });

      // Update Slack message with spec link
      if (withSpec.slackMessageTs) {
        await this.slack.updateOpportunity(withSpec.slackMessageTs, withSpec);
      }

      this.logger.info('Spec generated', {
        opportunityId: opportunity.id,
        specUrl: spec.specUrl,
      });
    } catch (error) {
      this.logger.error('Failed to generate spec', error as Error, {
        opportunityId: opportunity.id,
      });
      // Revert to promoted status
      await this.store.update(opportunity.id, {
        status: OpportunityStatus.PROMOTED,
      });
      throw error;
    }
  }

  /**
   * Dismiss an opportunity
   */
  private async dismissOpportunity(opportunity: Opportunity): Promise<void> {
    this.logger.info('Dismissing opportunity', { opportunityId: opportunity.id });

    const updated = await this.store.update(opportunity.id, {
      status: OpportunityStatus.DISMISSED,
    });

    // Update Slack message
    if (updated.slackMessageTs) {
      await this.slack.updateOpportunity(updated.slackMessageTs, updated);
    }
  }

  /**
   * Mark opportunity for investigation
   */
  private async investigateOpportunity(opportunity: Opportunity): Promise<void> {
    this.logger.info('Marking opportunity for investigation', {
      opportunityId: opportunity.id,
    });

    const updated = await this.store.update(opportunity.id, {
      status: OpportunityStatus.INVESTIGATING,
    });

    // Update Slack message
    if (updated.slackMessageTs) {
      await this.slack.updateOpportunity(updated.slackMessageTs, updated);
    }
  }

  /**
   * Get all opportunities
   */
  public getOpportunities(): Opportunity[] {
    return this.store.getAll();
  }

  /**
   * Get opportunities by status
   */
  public getOpportunitiesByStatus(status: OpportunityStatus): Opportunity[] {
    return this.store.getByStatus(status);
  }

  /**
   * Get a specific opportunity
   */
  public getOpportunity(id: string): Opportunity | undefined {
    return this.store.get(id);
  }

  /**
   * Mark an opportunity as shipped and provide actual impact data
   */
  public async markAsShipped(
    opportunityId: string,
    actualImpact: {
      metricsBefore: Record<string, number>;
      metricsAfter: Record<string, number>;
    }
  ): Promise<void> {
    this.logger.info('Marking opportunity as shipped', { opportunityId });

    const opportunity = this.store.get(opportunityId);
    if (!opportunity) {
      throw new Error(`Opportunity ${opportunityId} not found`);
    }

    // Update with actual impact
    const updated = await this.store.update(opportunityId, {
      status: OpportunityStatus.SHIPPED,
      actualImpact: {
        ...actualImpact,
        measuredAt: new Date().toISOString(),
      },
    });

    // Update Slack message
    if (updated.slackMessageTs) {
      await this.slack.updateOpportunity(updated.slackMessageTs, updated);
    }

    // Provide feedback to Kiro for learning
    if (opportunity.specUrl) {
      await this.kiro.provideFeedback(opportunityId, {
        rating: 5, // Default rating, could be customized
        actualImpact: actualImpact.metricsAfter,
      });
    }

    this.logger.info('Opportunity marked as shipped', { opportunityId });
  }
}

