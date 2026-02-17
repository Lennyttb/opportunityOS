import { stopProcess, isRunning, getPid } from '../processManager';

/**
 * Stop OpportunityOS
 */
export async function stopCommand(): Promise<void> {
  console.log('\n🛑 Stopping OpportunityOS...\n');

  // Check if running
  if (!(await isRunning())) {
    console.log('ℹ️  OpportunityOS is not currently running.\n');
    return;
  }

  const pid = await getPid();
  console.log(`📍 Found running process (PID: ${pid})\n`);

  // Stop the process
  const stopped = await stopProcess();

  if (stopped) {
    console.log('✅ OpportunityOS stopped successfully!\n');
  } else {
    console.log('❌ Failed to stop OpportunityOS.\n');
    console.log('💡 Try manually: kill ' + pid + '\n');
    process.exit(1);
  }
}

