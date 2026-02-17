import { isRunning, getPid } from '../processManager';
import { configExists, loadConfig } from '../config';

/**
 * Show OpportunityOS status
 */
export async function statusCommand(): Promise<void> {
  console.log('\n📊 OpportunityOS Status\n');
  console.log('━'.repeat(60));

  // Check if configured
  if (!(await configExists())) {
    console.log('\n⚠️  Status: Not Configured');
    console.log('\n💡 Run: npx opportunityos init\n');
    return;
  }

  // Check if running
  const running = await isRunning();
  const pid = await getPid();

  if (running && pid) {
    console.log('\n✅ Status: Running');
    console.log(`📍 Process ID: ${pid}`);
  } else {
    console.log('\n⭕ Status: Stopped');
  }

  // Show config
  try {
    const config = await loadConfig();
    const isDemoMode = config.userpilot?.apiToken?.includes('demo');

    console.log(`🎭 Mode: ${isDemoMode ? 'Demo' : 'Production'}`);
    console.log(`📅 Schedule: ${config.detectionSchedule || 'default'}`);
    console.log(`📁 Data Path: ${config.dataStorePath || 'default'}`);
    console.log(`📊 Min Score: ${config.minOpportunityScore || 'default'}`);

    console.log('\n━'.repeat(60));

    if (running) {
      console.log('\n💡 Commands:');
      console.log('   • Stop: npx opportunityos stop');
      console.log('   • View config: npx opportunityos config\n');
    } else {
      console.log('\n💡 Commands:');
      console.log('   • Start: npx opportunityos start');
      console.log('   • View config: npx opportunityos config\n');
    }
  } catch (error) {
    console.error('\n❌ Error loading config:', (error as Error).message);
  }
}

