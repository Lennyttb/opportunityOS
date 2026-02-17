import * as fs from 'fs/promises';
import * as path from 'path';

const PID_FILE = path.join(process.cwd(), '.opportunityos.pid');

/**
 * Save the current process ID
 */
export async function savePid(): Promise<void> {
  await fs.writeFile(PID_FILE, process.pid.toString(), 'utf-8');
}

/**
 * Get the saved process ID
 */
export async function getPid(): Promise<number | null> {
  try {
    const data = await fs.readFile(PID_FILE, 'utf-8');
    const pid = parseInt(data.trim());
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}

/**
 * Remove the PID file
 */
export async function removePid(): Promise<void> {
  try {
    await fs.unlink(PID_FILE);
  } catch {
    // Ignore if file doesn't exist
  }
}

/**
 * Check if a process is running
 */
export function isProcessRunning(pid: number): boolean {
  try {
    // Sending signal 0 checks if process exists without killing it
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Kill a process by PID
 */
export function killProcess(pid: number): boolean {
  try {
    process.kill(pid, 'SIGTERM');
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if OpportunityOS is currently running
 */
export async function isRunning(): Promise<boolean> {
  const pid = await getPid();
  if (!pid) return false;
  return isProcessRunning(pid);
}

/**
 * Stop the running OpportunityOS process
 */
export async function stopProcess(): Promise<boolean> {
  const pid = await getPid();
  if (!pid) return false;
  
  if (!isProcessRunning(pid)) {
    // Process not running, clean up PID file
    await removePid();
    return false;
  }
  
  const killed = killProcess(pid);
  if (killed) {
    await removePid();
  }
  return killed;
}

