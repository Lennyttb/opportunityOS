import { loadConfig, configExists } from '../config';
import { OpportunityOS } from '../../OpportunityOS';
import { DemoOpportunityOS } from '../../demo/DemoOpportunityOS';
import { savePid, removePid, isRunning } from '../processManager';

/**
 * Start OpportunityOS
 */
export async function startCommand(options: { demo?: boolean }): Promise<void> {
  console.log('\n🚀 Starting OpportunityOS...\n');

  // Check if already running
  if (await isRunning()) {
    console.log('⚠️  OpportunityOS is already running!\n');
    console.log('💡 To stop it, run: npx opportunityos stop\n');
    console.log('💡 To check status, run: npx opportunityos status\n');
    process.exit(1);
  }

  // Check if config exists
  if (!await configExists()) {
    console.log('❌ No configuration found!\n');
    console.log('Please run: npx opportunityos init\n');
    process.exit(1);
  }

  try {
    // Load config
    const config = await loadConfig();

    // Determine if demo mode
    const isDemoMode = options.demo || config.userpilot?.apiToken?.includes('demo');

    // Save PID for process management
    await savePid();

    if (isDemoMode) {
      console.log('🎭 Starting in DEMO MODE (using mock data)\n');
      const demo = new DemoOpportunityOS(config);

      await demo.start();

      console.log('✅ Demo OpportunityOS started successfully!\n');
      console.log('📊 The system is now running with mock data.');
      console.log('💡 Check the console output for detected opportunities.\n');
      console.log('To stop: Press Ctrl+C or run: npx opportunityos stop\n');

      // Run initial detection
      console.log('🔍 Running initial detection...\n');
      await demo.runDetection();

      // Keep process alive
      process.on('SIGINT', async () => {
        console.log('\n\n🛑 Stopping OpportunityOS...\n');
        await demo.stop();
        await removePid();
        console.log('✅ OpportunityOS stopped.\n');
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        console.log('\n\n🛑 Stopping OpportunityOS...\n');
        await demo.stop();
        await removePid();
        console.log('✅ OpportunityOS stopped.\n');
        process.exit(0);
      });

      // Prevent process from exiting
      await new Promise(() => {});

    } else {
      console.log('🔌 Starting in PRODUCTION MODE (using real APIs)\n');
      const system = new OpportunityOS(config);
      
      await system.start();
      
      console.log('✅ OpportunityOS started successfully!\n');
      console.log('📊 The system is now running and will:');
      console.log(`   • Detect opportunities on schedule: ${config.detectionSchedule}`);
      console.log(`   • Post to Slack channel: ${config.slack?.channelId}`);
      console.log(`   • Store data in: ${config.dataStorePath}\n`);
      console.log('To stop: Press Ctrl+C or run: npx opportunityos stop\n');

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n\n🛑 Stopping OpportunityOS...\n');
        await system.stop();
        await removePid();
        console.log('✅ OpportunityOS stopped.\n');
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        console.log('\n\n🛑 Stopping OpportunityOS...\n');
        await system.stop();
        await removePid();
        console.log('✅ OpportunityOS stopped.\n');
        process.exit(0);
      });

      // Prevent process from exiting
      await new Promise(() => {});
    }
  } catch (error) {
    console.error('❌ Failed to start OpportunityOS:\n');
    console.error((error as Error).message);
    console.error('\n💡 Check your configuration and try again.\n');
    process.exit(1);
  }
}

