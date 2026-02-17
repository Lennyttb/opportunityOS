/**
 * OpportunityOS - AI-native product intelligence system
 *
 * Main entry point for the package
 */

export * from './types';
export * from './config/ConfigurationManager';
export * from './core/OpportunityStore';
export * from './core/OpportunityDetector';
export * from './integrations/UserpilotClient';
export * from './integrations/SlackNotifier';
export * from './integrations/KiroAgent';
export * from './utils/Logger';
export * from './utils/retry';
export * from './OpportunityOS';

// Demo/Mock exports (for testing without real APIs)
export * from './demo/DemoOpportunityOS';
export * from './demo/MockUserpilotClient';
export * from './demo/MockSlackNotifier';
export * from './demo/MockKiroAgent';

