import { App, ButtonAction } from '@slack/bolt';
import { Opportunity, SlackConfig, OpportunityStatus } from '../types';
import { Logger } from '../utils/Logger';

export type OpportunityActionHandler = (
  opportunityId: string,
  action: 'promote' | 'dismiss' | 'investigate'
) => Promise<void>;

/**
 * SlackNotifier handles posting opportunities to Slack and managing interactions
 */
export class SlackNotifier {
  private app: App;
  private channelId: string;
  private logger: Logger;
  private actionHandler?: OpportunityActionHandler;

  constructor(config: SlackConfig) {
    this.logger = Logger.getInstance().child('SlackNotifier');
    this.channelId = config.channelId;

    this.app = new App({
      token: config.botToken,
      appToken: config.appToken,
      socketMode: true,
    });

    this.setupActionHandlers();

    this.logger.info('SlackNotifier initialized', {
      channelId: config.channelId,
    });
  }

  /**
   * Start the Slack app (socket mode)
   */
  public async start(): Promise<void> {
    await this.app.start();
    this.logger.info('Slack app started in socket mode');
  }

  /**
   * Stop the Slack app
   */
  public async stop(): Promise<void> {
    await this.app.stop();
    this.logger.info('Slack app stopped');
  }

  /**
   * Register a handler for opportunity actions
   */
  public onAction(handler: OpportunityActionHandler): void {
    this.actionHandler = handler;
  }

  /**
   * Post a new opportunity to Slack
   */
  public async postOpportunity(opportunity: Opportunity): Promise<string> {
    this.logger.debug('Posting opportunity to Slack', {
      opportunityId: opportunity.id,
      type: opportunity.type,
    });

    const blocks = this.buildOpportunityBlocks(opportunity);

    const result = await this.app.client.chat.postMessage({
      channel: this.channelId,
      text: `New Opportunity: ${opportunity.title}`,
      blocks,
    });

    if (!result.ts) {
      throw new Error('Failed to post message to Slack: no timestamp returned');
    }

    this.logger.info('Posted opportunity to Slack', {
      opportunityId: opportunity.id,
      messageTs: result.ts,
    });

    return result.ts;
  }

  /**
   * Update an existing opportunity message in Slack
   */
  public async updateOpportunity(
    messageTs: string,
    opportunity: Opportunity
  ): Promise<void> {
    this.logger.debug('Updating opportunity in Slack', {
      opportunityId: opportunity.id,
      messageTs,
    });

    const blocks = this.buildOpportunityBlocks(opportunity);

    await this.app.client.chat.update({
      channel: this.channelId,
      ts: messageTs,
      text: `Updated Opportunity: ${opportunity.title}`,
      blocks,
    });

    this.logger.info('Updated opportunity in Slack', {
      opportunityId: opportunity.id,
      messageTs,
    });
  }

  /**
   * Build Slack blocks for an opportunity
   */
  private buildOpportunityBlocks(opportunity: Opportunity): any[] {
    const statusEmoji = this.getStatusEmoji(opportunity.status);
    const scoreColor = this.getScoreColor(opportunity.score);

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${statusEmoji} ${opportunity.title}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Type:*\n${opportunity.type}`,
          },
          {
            type: 'mrkdwn',
            text: `*Score:*\n${scoreColor} ${opportunity.score}/100`,
          },
          {
            type: 'mrkdwn',
            text: `*Status:*\n${opportunity.status}`,
          },
          {
            type: 'mrkdwn',
            text: `*Created:*\n${new Date(opportunity.createdAt).toLocaleDateString()}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Description:*\n${opportunity.description}`,
        },
      },
    ];

    // Add insights if available
    if (opportunity.evidence.insights.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Key Insights:*\n${opportunity.evidence.insights.map((i) => `• ${i}`).join('\n')}`,
        },
      });
    }

    // Add spec URL if available
    if (opportunity.specUrl) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Spec:* <${opportunity.specUrl}|View Generated Spec>`,
        },
      });
    }

    // Add action buttons only for detected opportunities
    if (opportunity.status === OpportunityStatus.DETECTED) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '✅ Promote',
            },
            style: 'primary',
            action_id: `promote_${opportunity.id}`,
            value: opportunity.id,
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '🔍 Investigate',
            },
            action_id: `investigate_${opportunity.id}`,
            value: opportunity.id,
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '❌ Dismiss',
            },
            style: 'danger',
            action_id: `dismiss_${opportunity.id}`,
            value: opportunity.id,
          },
        ],
      });
    }

    return blocks;
  }

  /**
   * Setup action handlers for Slack buttons
   */
  private setupActionHandlers(): void {
    // Handle promote action
    this.app.action(/^promote_(.+)$/, async ({ ack, action, body }) => {
      await ack();
      await this.handleAction(action as ButtonAction, 'promote', body);
    });

    // Handle investigate action
    this.app.action(/^investigate_(.+)$/, async ({ ack, action, body }) => {
      await ack();
      await this.handleAction(action as ButtonAction, 'investigate', body);
    });

    // Handle dismiss action
    this.app.action(/^dismiss_(.+)$/, async ({ ack, action, body }) => {
      await ack();
      await this.handleAction(action as ButtonAction, 'dismiss', body);
    });
  }

  /**
   * Handle button action
   */
  private async handleAction(
    action: ButtonAction,
    actionType: 'promote' | 'dismiss' | 'investigate',
    body: any
  ): Promise<void> {
    const opportunityId = action.value;

    if (!opportunityId) {
      this.logger.error('No opportunity ID in action');
      return;
    }

    this.logger.info('Handling opportunity action', {
      opportunityId,
      action: actionType,
      user: body.user?.id,
    });

    if (this.actionHandler) {
      try {
        await this.actionHandler(opportunityId, actionType);
      } catch (error) {
        this.logger.error('Error handling opportunity action', error as Error, {
          opportunityId,
          action: actionType,
        });
        throw error;
      }
    } else {
      this.logger.warn('No action handler registered');
    }
  }

  /**
   * Get emoji for opportunity status
   */
  private getStatusEmoji(status: OpportunityStatus): string {
    const emojiMap: Record<OpportunityStatus, string> = {
      [OpportunityStatus.DETECTED]: '🔔',
      [OpportunityStatus.PROMOTED]: '⭐',
      [OpportunityStatus.DISMISSED]: '❌',
      [OpportunityStatus.INVESTIGATING]: '🔍',
      [OpportunityStatus.SPEC_GENERATED]: '📄',
      [OpportunityStatus.SHIPPED]: '🚀',
    };
    return emojiMap[status] || '•';
  }

  /**
   * Get color indicator for score
   */
  private getScoreColor(score: number): string {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    return '🔴';
  }
}

