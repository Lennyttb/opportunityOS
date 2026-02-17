/**
 * Basic usage example for OpportunityOS
 */

import { OpportunityOS, OpportunityStatus, LogLevel } from '../src';

async function main() {
  // Initialize OpportunityOS with configuration
  const opportunityOS = new OpportunityOS({
    userpilot: {
      apiToken: process.env.USERPILOT_API_TOKEN || 'your-userpilot-token',
    },
    slack: {
      botToken: process.env.SLACK_BOT_TOKEN || 'xoxb-your-bot-token',
      appToken: process.env.SLACK_APP_TOKEN || 'xapp-your-app-token',
      channelId: process.env.SLACK_CHANNEL_ID || 'C123456',
    },
    kiro: {
      apiKey: process.env.KIRO_API_KEY || 'your-kiro-api-key',
    },
    // Optional: Customize settings
    detectionSchedule: '0 9 * * 1', // Every Monday at 9am
    minOpportunityScore: 70, // Only show high-priority opportunities
    logLevel: LogLevel.INFO,
  });

  try {
    // Start the system (Slack bot + cron scheduler)
    console.log('Starting OpportunityOS...');
    await opportunityOS.start();
    console.log('OpportunityOS started successfully!');

    // Manually trigger detection (optional - will also run on schedule)
    console.log('\nRunning manual detection...');
    const opportunities = await opportunityOS.runDetection();
    console.log(`Detected ${opportunities.length} opportunities`);

    // View all opportunities
    console.log('\nAll opportunities:');
    const allOpportunities = opportunityOS.getOpportunities();
    allOpportunities.forEach((opp) => {
      console.log(`- [${opp.status}] ${opp.title} (Score: ${opp.score})`);
    });

    // View promoted opportunities
    console.log('\nPromoted opportunities:');
    const promoted = opportunityOS.getOpportunitiesByStatus(OpportunityStatus.PROMOTED);
    promoted.forEach((opp) => {
      console.log(`- ${opp.title}`);
      if (opp.specUrl) {
        console.log(`  Spec: ${opp.specUrl}`);
      }
    });

    // Example: Mark an opportunity as shipped with actual metrics
    if (promoted.length > 0) {
      const firstPromoted = promoted[0];
      console.log(`\nMarking opportunity ${firstPromoted.id} as shipped...`);

      await opportunityOS.markAsShipped(firstPromoted.id, {
        metricsBefore: {
          conversionRate: 0.45,
          dropoffRate: 0.55,
        },
        metricsAfter: {
          conversionRate: 0.62,
          dropoffRate: 0.38,
        },
      });

      console.log('Opportunity marked as shipped with actual impact data');
    }

    // Keep the process running to handle Slack interactions
    console.log('\nOpportunityOS is running. Press Ctrl+C to stop.');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down OpportunityOS...');
      await opportunityOS.stop();
      console.log('OpportunityOS stopped successfully');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error running OpportunityOS:', error);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  main();
}

export { main };

