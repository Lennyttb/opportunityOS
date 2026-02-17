/**
 * Demo script for OpportunityOS using mock data
 * NO REAL API TOKENS REQUIRED!
 */

import { DemoOpportunityOS } from '../src/demo/DemoOpportunityOS';
import { OpportunityStatus, LogLevel } from '../src/types';

async function runDemo() {
  console.log('\n🚀 Starting OpportunityOS Demo\n');
  console.log('This demo uses fake data and simulates all API interactions.');
  console.log('No real Userpilot, Slack, or Kiro API tokens required!\n');

  // Initialize demo system (no real API tokens needed!)
  const demo = new DemoOpportunityOS({
    logLevel: LogLevel.INFO,
    minOpportunityScore: 60,
  });

  try {
    // Start the system
    await demo.start();

    // Run detection with mock data
    console.log('⏳ Running opportunity detection...\n');
    const opportunities = await demo.runDetection();

    console.log(`\n✅ Detected ${opportunities.length} opportunities!\n`);

    // Wait a bit for user to read
    await sleep(2000);

    // Simulate user interactions
    if (opportunities.length > 0) {
      console.log('🎭 Simulating user interactions...\n');

      // Promote the first opportunity (highest score)
      const firstOpp = opportunities[0];
      console.log(`\n👉 Promoting opportunity: "${firstOpp.title}"\n`);
      await sleep(1000);
      await demo.simulateUserAction(firstOpp.id, 'promote');

      await sleep(2000);

      // Investigate the second if it exists
      if (opportunities.length > 1) {
        const secondOpp = opportunities[1];
        console.log(`\n👉 Marking for investigation: "${secondOpp.title}"\n`);
        await sleep(1000);
        await demo.simulateUserAction(secondOpp.id, 'investigate');
        await sleep(2000);
      }

      // Dismiss the third if it exists
      if (opportunities.length > 2) {
        const thirdOpp = opportunities[2];
        console.log(`\n👉 Dismissing: "${thirdOpp.title}"\n`);
        await sleep(1000);
        await demo.simulateUserAction(thirdOpp.id, 'dismiss');
        await sleep(2000);
      }
    }

    // Show final status
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL STATUS SUMMARY');
    console.log('='.repeat(80));

    const promoted = demo.getOpportunitiesByStatus(OpportunityStatus.PROMOTED);
    const specGenerated = demo.getOpportunitiesByStatus(OpportunityStatus.SPEC_GENERATED);
    const investigating = demo.getOpportunitiesByStatus(OpportunityStatus.INVESTIGATING);
    const dismissed = demo.getOpportunitiesByStatus(OpportunityStatus.DISMISSED);

    console.log(`\n✅ Promoted: ${promoted.length}`);
    promoted.forEach((opp) => {
      console.log(`   - ${opp.title}`);
    });

    console.log(`\n📄 Spec Generated: ${specGenerated.length}`);
    specGenerated.forEach((opp) => {
      console.log(`   - ${opp.title}`);
      console.log(`     Spec: ${opp.specUrl}`);
    });

    console.log(`\n🔍 Investigating: ${investigating.length}`);
    investigating.forEach((opp) => {
      console.log(`   - ${opp.title}`);
    });

    console.log(`\n❌ Dismissed: ${dismissed.length}`);
    dismissed.forEach((opp) => {
      console.log(`   - ${opp.title}`);
    });

    // Simulate marking as shipped
    if (specGenerated.length > 0) {
      const shipped = specGenerated[0];
      console.log(`\n\n🚀 Simulating shipping: "${shipped.title}"\n`);
      await sleep(1000);

      await demo.markAsShipped(shipped.id, {
        metricsBefore: {
          conversionRate: 0.45,
          dropoffRate: 0.55,
        },
        metricsAfter: {
          conversionRate: 0.62,
          dropoffRate: 0.38,
        },
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ DEMO COMPLETE!');
    console.log('='.repeat(80));
    console.log('\nAll opportunities are stored in: ./demo-data/opportunities.json');
    console.log('You can inspect this file to see the full data structure.\n');

    // Stop the system
    await demo.stop();

    console.log('👋 Demo finished. Thank you!\n');
  } catch (error) {
    console.error('❌ Error running demo:', error);
    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the demo
if (require.main === module) {
  runDemo();
}

export { runDemo };

