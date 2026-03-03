import { OpportunityOSConfig, Opportunity, OpportunityStatus, ActualImpact, SpecGenerationRequest, LogLevel } from '../types';
import { ConfigurationManager } from '../config/ConfigurationManager';
import { Logger } from '../utils/Logger';
import { OpportunityStore } from '../core/OpportunityStore';
import { OpportunityDetector } from '../core/OpportunityDetector';
import { MockUserpilotAdapter } from './MockUserpilotAdapter';
import { MockSlackNotifier } from './MockSlackNotifier';
import { MockKiroAgent } from './MockKiroAgent';

/**
 * Demo version of OpportunityOS that uses mock integrations
 * No real API tokens required!
 */
export class DemoOpportunityOS {
  private config: ConfigurationManager;
  private logger: Logger;
  private store: OpportunityStore;
  private detector: OpportunityDetector;
  private userpilot: MockUserpilotAdapter;
  private slack: MockSlackNotifier;
  private kiro: MockKiroAgent;

  constructor(config?: Partial<OpportunityOSConfig>) {
    // Use demo defaults if no config provided
    const demoConfig = {
      userpilot: {
        apiToken: 'demo-token',
      },
      slack: {
        botToken: 'xoxb-demo-token',
        appToken: 'xapp-demo-token',
        channelId: 'C-DEMO-CHANNEL',
      },
      kiro: {
        apiKey: 'demo-api-key',
      },
      dataStorePath: './demo-data/opportunities.json',
      logLevel: LogLevel.INFO,
      minOpportunityScore: 60,
      ...config,
    };

    this.config = new ConfigurationManager(demoConfig);
    this.logger = Logger.getInstance(this.config.get('logLevel'), 'DemoOpportunityOS');

    // Initialize components with MOCK versions
    this.store = new OpportunityStore(this.config.get('dataStorePath')!);
    this.detector = new OpportunityDetector(this.config.get('minOpportunityScore')!);
    this.userpilot = new MockUserpilotAdapter(this.config.get('userpilot'));
    this.slack = new MockSlackNotifier(this.config.get('slack'));
    this.kiro = new MockKiroAgent(this.config.get('kiro'));

    // Register Slack action handler
    this.slack.onAction(this.handleOpportunityAction.bind(this));

    console.log('\n' + '🎭'.repeat(40));
    console.log('🎭  DEMO MODE - Using Mock Data (No Real APIs Required)  🎭');
    console.log('🎭'.repeat(40) + '\n');

    this.logger.info('DemoOpportunityOS initialized');
  }

  /**
   * Start the demo system
   */
  public async start(): Promise<void> {
    this.logger.info('Starting DemoOpportunityOS');

    await this.store.initialize();
    await this.slack.start();

    this.logger.info('DemoOpportunityOS started');
  }

  /**
   * Stop the demo system
   */
  public async stop(): Promise<void> {
    this.logger.info('Stopping DemoOpportunityOS');
    await this.slack.stop();
    this.logger.info('DemoOpportunityOS stopped');
  }

  /**
   * Run opportunity detection with mock data
   */
  public async runDetection(): Promise<Opportunity[]> {
    this.logger.info('Running opportunity detection with MOCK DATA');

    try {
      const opportunities: Opportunity[] = [];

      // Fetch MOCK data
      console.log('\n📊 Fetching mock data from "Userpilot"...\n');
      const [funnels, npsData, features] = await Promise.all([
        this.userpilot.getFunnels(),
        this.userpilot.getNPS(),
        this.userpilot.getFeatureUsage(),
      ]);

      // Detect opportunities
      console.log('🔍 Analyzing data for opportunities...\n');
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

        // Post to "Slack"
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
   * Handle opportunity action
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
   * Promote an opportunity (generate spec if auto-enabled, otherwise just mark as promoted)
   */
  private async promoteOpportunity(opportunity: Opportunity): Promise<void> {
    this.logger.info('Promoting opportunity', { opportunityId: opportunity.id });

    const updated = await this.store.update(opportunity.id, {
      status: OpportunityStatus.PROMOTED,
    });

    if (updated.slackMessageTs) {
      await this.slack.updateOpportunity(updated.slackMessageTs, updated);
    }

    // Check if auto-generate is enabled (demo mode always auto-generates for simplicity)
    const autoGenerate = this.config.get('autoGenerateSpecs') ?? true;

    if (!autoGenerate) {
      this.logger.info('Auto-spec generation disabled, waiting for manual approval', {
        opportunityId: opportunity.id,
      });
      return;
    }

    // Generate spec via Mock Kiro
    await this.generateSpec(opportunity.id);
  }

  /**
   * Generate spec for a promoted opportunity
   */
  public async generateSpec(opportunityId: string): Promise<void> {
    const opportunity = this.store.get(opportunityId);
    if (!opportunity) {
      throw new Error(`Opportunity ${opportunityId} not found`);
    }

    if (opportunity.status !== OpportunityStatus.PROMOTED) {
      throw new Error(`Opportunity ${opportunityId} is not in PROMOTED status`);
    }

    this.logger.info('Generating spec via Mock Kiro', { opportunityId });

    const request: SpecGenerationRequest = {
      opportunityId: opportunity.id,
      title: opportunity.title,
      description: opportunity.description,
      evidence: opportunity.evidence,
    };
    const spec = await this.kiro.generateSpec(request);

    const updated = await this.store.update(opportunityId, {
      status: OpportunityStatus.SPEC_GENERATED,
      specUrl: spec.specUrl,
    });

    if (updated.slackMessageTs) {
      await this.slack.updateOpportunity(updated.slackMessageTs, updated);
    }

    this.logger.info('Spec generated successfully', { opportunityId, specUrl: spec.specUrl });
  }

  /**
   * Dismiss an opportunity
   */
  private async dismissOpportunity(opportunity: Opportunity): Promise<void> {
    this.logger.info('Dismissing opportunity', { opportunityId: opportunity.id });

    const updated = await this.store.update(opportunity.id, {
      status: OpportunityStatus.DISMISSED,
    });

    if (updated.slackMessageTs) {
      await this.slack.updateOpportunity(updated.slackMessageTs, updated);
    }
  }

  /**
   * Mark opportunity for investigation
   */
  private async investigateOpportunity(opportunity: Opportunity): Promise<void> {
    this.logger.info('Marking opportunity for investigation', { opportunityId: opportunity.id });

    const updated = await this.store.update(opportunity.id, {
      status: OpportunityStatus.INVESTIGATING,
    });

    if (updated.slackMessageTs) {
      await this.slack.updateOpportunity(updated.slackMessageTs, updated);
    }
  }

  /**
   * Simulate user action (for demo purposes)
   */
  public async simulateUserAction(
    opportunityId: string,
    action: 'promote' | 'dismiss' | 'investigate'
  ): Promise<void> {
    await this.handleOpportunityAction(opportunityId, action);
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
   * Mark opportunity as shipped
   */
  public async markAsShipped(
    opportunityId: string,
    metrics: Omit<ActualImpact, 'measuredAt'>
  ): Promise<void> {
    const opportunity = this.store.get(opportunityId);
    if (!opportunity) {
      throw new Error(`Opportunity ${opportunityId} not found`);
    }

    const actualImpact: ActualImpact = { ...metrics, measuredAt: new Date().toISOString() };
    this.logger.info('Marking opportunity as shipped', { opportunityId, actualImpact });

    const updated = await this.store.update(opportunityId, {
      status: OpportunityStatus.SHIPPED,
      actualImpact,
    });

    if (updated.slackMessageTs) {
      await this.slack.updateOpportunity(updated.slackMessageTs, updated);
    }
  }
}

