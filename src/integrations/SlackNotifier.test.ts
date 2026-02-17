import { SlackNotifier } from './SlackNotifier';
import { Opportunity, OpportunityStatus, OpportunityType } from '../types';
import { Logger } from '../utils/Logger';

jest.mock('@slack/bolt');
jest.mock('../utils/Logger');

const mockApp = {
  start: jest.fn(),
  stop: jest.fn(),
  action: jest.fn(),
  client: {
    chat: {
      postMessage: jest.fn(),
      update: jest.fn(),
    },
  },
};

jest.mock('@slack/bolt', () => ({
  App: jest.fn(() => mockApp),
}));

describe('SlackNotifier', () => {
  let notifier: SlackNotifier;

  const mockOpportunity: Opportunity = {
    id: 'opp-123',
    type: OpportunityType.FUNNEL_DROP,
    status: OpportunityStatus.DETECTED,
    score: 85,
    title: 'High Dropoff in Checkout',
    description: 'Users are dropping off at payment step',
    evidence: {
      dataSource: 'userpilot',
      rawData: {} as any,
      metrics: { dropoffRate: 0.45 },
      insights: ['45% dropoff at payment step', 'Highest on mobile devices'],
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

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

    notifier = new SlackNotifier({
      botToken: 'xoxb-test-token',
      appToken: 'xapp-test-token',
      channelId: 'C123456',
    });
  });

  describe('constructor', () => {
    it('should initialize Slack app with correct config', () => {
      const { App } = require('@slack/bolt');
      expect(App).toHaveBeenCalledWith({
        token: 'xoxb-test-token',
        appToken: 'xapp-test-token',
        socketMode: true,
      });
    });

    it('should setup action handlers', () => {
      expect(mockApp.action).toHaveBeenCalledTimes(3);
      expect(mockApp.action).toHaveBeenCalledWith(/^promote_(.+)$/, expect.any(Function));
      expect(mockApp.action).toHaveBeenCalledWith(/^investigate_(.+)$/, expect.any(Function));
      expect(mockApp.action).toHaveBeenCalledWith(/^dismiss_(.+)$/, expect.any(Function));
    });
  });

  describe('start and stop', () => {
    it('should start the Slack app', async () => {
      await notifier.start();
      expect(mockApp.start).toHaveBeenCalled();
    });

    it('should stop the Slack app', async () => {
      await notifier.stop();
      expect(mockApp.stop).toHaveBeenCalled();
    });
  });

  describe('postOpportunity', () => {
    it('should post opportunity to Slack', async () => {
      mockApp.client.chat.postMessage.mockResolvedValue({
        ts: '1234567890.123456',
      });

      const messageTs = await notifier.postOpportunity(mockOpportunity);

      expect(mockApp.client.chat.postMessage).toHaveBeenCalledWith({
        channel: 'C123456',
        text: 'New Opportunity: High Dropoff in Checkout',
        blocks: expect.any(Array),
      });

      expect(messageTs).toBe('1234567890.123456');
    });

    it('should include action buttons for detected opportunities', async () => {
      mockApp.client.chat.postMessage.mockResolvedValue({
        ts: '1234567890.123456',
      });

      await notifier.postOpportunity(mockOpportunity);

      const call = mockApp.client.chat.postMessage.mock.calls[0][0];
      const blocks = call.blocks;

      const actionsBlock = blocks.find((b: any) => b.type === 'actions');
      expect(actionsBlock).toBeDefined();
      expect(actionsBlock.elements).toHaveLength(3);
      expect(actionsBlock.elements[0].action_id).toBe('promote_opp-123');
      expect(actionsBlock.elements[1].action_id).toBe('investigate_opp-123');
      expect(actionsBlock.elements[2].action_id).toBe('dismiss_opp-123');
    });

    it('should not include action buttons for non-detected opportunities', async () => {
      const promotedOpp = { ...mockOpportunity, status: OpportunityStatus.PROMOTED };

      mockApp.client.chat.postMessage.mockResolvedValue({
        ts: '1234567890.123456',
      });

      await notifier.postOpportunity(promotedOpp);

      const call = mockApp.client.chat.postMessage.mock.calls[0][0];
      const blocks = call.blocks;

      const actionsBlock = blocks.find((b: any) => b.type === 'actions');
      expect(actionsBlock).toBeUndefined();
    });

    it('should throw error if no timestamp returned', async () => {
      mockApp.client.chat.postMessage.mockResolvedValue({});

      await expect(notifier.postOpportunity(mockOpportunity)).rejects.toThrow(
        'Failed to post message to Slack: no timestamp returned'
      );
    });
  });

  describe('updateOpportunity', () => {
    it('should update existing opportunity message', async () => {
      await notifier.updateOpportunity('1234567890.123456', mockOpportunity);

      expect(mockApp.client.chat.update).toHaveBeenCalledWith({
        channel: 'C123456',
        ts: '1234567890.123456',
        text: 'Updated Opportunity: High Dropoff in Checkout',
        blocks: expect.any(Array),
      });
    });
  });

  describe('onAction', () => {
    it('should register action handler', async () => {
      const handler = jest.fn();
      notifier.onAction(handler);

      // Simulate button click
      const actionHandler = mockApp.action.mock.calls[0][1];
      const mockAck = jest.fn();
      const mockAction = { value: 'opp-123' };
      const mockBody = { user: { id: 'U123' } };

      await actionHandler({ ack: mockAck, action: mockAction, body: mockBody });

      expect(mockAck).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith('opp-123', 'promote');
    });
  });
});

