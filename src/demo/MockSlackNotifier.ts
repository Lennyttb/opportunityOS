import { Opportunity, SlackConfig, OpportunityStatus } from '../types';
import { Logger } from '../utils/Logger';
import { OpportunityActionHandler } from '../integrations/SlackNotifier';

/**
 * Mock SlackNotifier for testing without real Slack API
 */
export class MockSlackNotifier {
  private logger: Logger;
  private actionHandler?: OpportunityActionHandler;
  private postedOpportunities: Map<string, Opportunity> = new Map();

  constructor(config: SlackConfig) {
    this.logger = Logger.getInstance().child('MockSlackNotifier');
    this.logger.info('MockSlackNotifier initialized (DEMO MODE)', {
      channelId: config.channelId,
    });
  }

  /**
   * Start the mock Slack app
   */
  public async start(): Promise<void> {
    this.logger.info('Mock Slack app started (no actual connection)');
  }

  /**
   * Stop the mock Slack app
   */
  public async stop(): Promise<void> {
    this.logger.info('Mock Slack app stopped');
  }

  /**
   * Register a handler for opportunity actions
   */
  public onAction(handler: OpportunityActionHandler): void {
    this.actionHandler = handler;
    this.logger.debug('Action handler registered');
  }

  /**
   * Mock posting opportunity to Slack (just logs it)
   */
  public async postOpportunity(opportunity: Opportunity): Promise<string> {
    const messageTs = `${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;

    this.postedOpportunities.set(opportunity.id, opportunity);

    this.logger.info('📢 MOCK SLACK POST', {
      opportunityId: opportunity.id,
      messageTs,
    });

    console.log('\n' + '='.repeat(80));
    console.log('🔔 NEW OPPORTUNITY DETECTED');
    console.log('='.repeat(80));
    console.log(`Title: ${opportunity.title}`);
    console.log(`Type: ${opportunity.type}`);
    console.log(`Score: ${opportunity.score}/100 ${this.getScoreEmoji(opportunity.score)}`);
    console.log(`Status: ${opportunity.status}`);
    console.log(`\nDescription:\n${opportunity.description}`);
    console.log(`\nKey Insights:`);
    opportunity.evidence.insights.forEach((insight) => {
      console.log(`  • ${insight}`);
    });
    console.log(`\nMetrics:`);
    Object.entries(opportunity.evidence.metrics).forEach(([key, value]) => {
      console.log(`  • ${key}: ${value}`);
    });

    if (opportunity.status === OpportunityStatus.DETECTED) {
      console.log(`\n💡 Actions Available:`);
      console.log(`  [1] Promote (generate spec)`);
      console.log(`  [2] Investigate (mark for review)`);
      console.log(`  [3] Dismiss`);
      console.log(`\n(In demo mode, actions are simulated automatically)`);
    }

    if (opportunity.specUrl) {
      console.log(`\n📄 Spec: ${opportunity.specUrl}`);
    }

    console.log('='.repeat(80) + '\n');

    return messageTs;
  }

  /**
   * Mock updating opportunity in Slack
   */
  public async updateOpportunity(messageTs: string, opportunity: Opportunity): Promise<void> {
    this.postedOpportunities.set(opportunity.id, opportunity);

    this.logger.info('📝 MOCK SLACK UPDATE', {
      opportunityId: opportunity.id,
      messageTs,
      status: opportunity.status,
    });

    console.log('\n' + '-'.repeat(80));
    console.log(`🔄 OPPORTUNITY UPDATED: ${opportunity.title}`);
    console.log('-'.repeat(80));
    console.log(`Status: ${opportunity.status}`);
    if (opportunity.specUrl) {
      console.log(`Spec: ${opportunity.specUrl}`);
    }
    console.log('-'.repeat(80) + '\n');
  }

  /**
   * Simulate a user action (for demo purposes)
   */
  public async simulateAction(
    opportunityId: string,
    action: 'promote' | 'dismiss' | 'investigate'
  ): Promise<void> {
    this.logger.info('🎭 SIMULATING USER ACTION', { opportunityId, action });

    console.log(`\n👤 Simulated user clicked: ${action.toUpperCase()}\n`);

    if (this.actionHandler) {
      await this.actionHandler(opportunityId, action);
    }
  }

  /**
   * Get all posted opportunities (for demo inspection)
   */
  public getPostedOpportunities(): Opportunity[] {
    return Array.from(this.postedOpportunities.values());
  }

  /**
   * Get score emoji
   */
  private getScoreEmoji(score: number): string {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    return '🔴';
  }
}

