import { DemoOpportunityOS } from '../../demo/DemoOpportunityOS';
import { OpportunityStatus } from '../../types';

/**
 * Run a quick demo
 */
export async function demoCommand(): Promise<void> {
  console.log('\n🎭 OpportunityOS Demo\n');
  console.log('━'.repeat(60));
  console.log('This demo uses fake data - no API keys required!\n');

  const demo = new DemoOpportunityOS();

  try {
    // Start the system
    await demo.start();

    // Run detection
    console.log('🔍 Running opportunity detection...\n');
    const opportunities = await demo.runDetection();

    console.log(`\n✅ Detected ${opportunities.length} opportunities!\n`);

    // Wait a bit
    await sleep(2000);

    // Simulate interactions
    if (opportunities.length > 0) {
      console.log('🎭 Simulating user interactions...\n');

      // Promote the first
      const firstOpp = opportunities[0];
      console.log(`👉 Promoting: "${firstOpp.title}"\n`);
      await sleep(1000);
      await demo.simulateUserAction(firstOpp.id, 'promote');
      await sleep(2000);

      // Investigate the second
      if (opportunities.length > 1) {
        const secondOpp = opportunities[1];
        console.log(`👉 Investigating: "${secondOpp.title}"\n`);
        await sleep(1000);
        await demo.simulateUserAction(secondOpp.id, 'investigate');
        await sleep(2000);
      }

      // Dismiss the third
      if (opportunities.length > 2) {
        const thirdOpp = opportunities[2];
        console.log(`👉 Dismissing: "${thirdOpp.title}"\n`);
        await sleep(1000);
        await demo.simulateUserAction(thirdOpp.id, 'dismiss');
        await sleep(2000);
      }
    }

    // Show summary
    console.log('\n' + '━'.repeat(60));
    console.log('📊 DEMO SUMMARY');
    console.log('━'.repeat(60));

    const promoted = demo.getOpportunitiesByStatus(OpportunityStatus.PROMOTED);
    const specGenerated = demo.getOpportunitiesByStatus(OpportunityStatus.SPEC_GENERATED);
    const investigating = demo.getOpportunitiesByStatus(OpportunityStatus.INVESTIGATING);
    const dismissed = demo.getOpportunitiesByStatus(OpportunityStatus.DISMISSED);

    console.log(`\n✅ Promoted: ${promoted.length}`);
    promoted.forEach((opp) => console.log(`   - ${opp.title}`));

    console.log(`\n📄 Spec Generated: ${specGenerated.length}`);
    specGenerated.forEach((opp) => {
      console.log(`   - ${opp.title}`);
      console.log(`     ${opp.specUrl}`);
    });

    console.log(`\n🔍 Investigating: ${investigating.length}`);
    investigating.forEach((opp) => console.log(`   - ${opp.title}`));

    console.log(`\n❌ Dismissed: ${dismissed.length}`);
    dismissed.forEach((opp) => console.log(`   - ${opp.title}`));

    // Mark as shipped
    if (specGenerated.length > 0) {
      const shipped = specGenerated[0];
      console.log(`\n\n🚀 Simulating shipping: "${shipped.title}"\n`);
      await sleep(1000);

      await demo.markAsShipped(shipped.id, {
        metricsBefore: { conversionRate: 0.45, dropoffRate: 0.55 },
        metricsAfter: { conversionRate: 0.62, dropoffRate: 0.38 },
      });
    }

    console.log('\n' + '━'.repeat(60));
    console.log('✅ DEMO COMPLETE!');
    console.log('━'.repeat(60));
    console.log('\n📁 Data stored in: ./demo-data/opportunities.json');
    console.log('\n💡 To run with your own config:');
    console.log('   1. npx opportunityos init');
    console.log('   2. npx opportunityos start\n');

    await demo.stop();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Demo failed:', (error as Error).message);
    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

