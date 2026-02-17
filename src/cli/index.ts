#!/usr/bin/env node

import { initCommand } from './commands/init';
import { startCommand } from './commands/start';
import { stopCommand } from './commands/stop';
import { statusCommand } from './commands/status';
import { demoCommand } from './commands/demo';
import { configCommand } from './commands/config';

/**
 * OpportunityOS CLI
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const flags = args.slice(1);

  // Parse flags
  const options: Record<string, boolean> = {};
  flags.forEach((flag) => {
    if (flag.startsWith('--')) {
      options[flag.substring(2)] = true;
    }
  });

  try {
    switch (command) {
      case 'init':
        await initCommand();
        break;

      case 'start':
        await startCommand(options);
        break;

      case 'stop':
        await stopCommand();
        break;

      case 'status':
        await statusCommand();
        break;

      case 'demo':
        await demoCommand();
        break;

      case 'config':
        await configCommand(options);
        break;

      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;

      case 'version':
      case '--version':
      case '-v':
        showVersion();
        break;

      default:
        if (!command) {
          showHelp();
        } else {
          console.log(`\n❌ Unknown command: ${command}\n`);
          showHelp();
          process.exit(1);
        }
    }
  } catch (error) {
    console.error('\n❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                      OpportunityOS CLI                        ║
║          AI-native product intelligence system                ║
╚═══════════════════════════════════════════════════════════════╝

USAGE:
  npx opportunityos <command> [options]

COMMANDS:
  init              Initialize configuration (interactive setup)
  start             Start OpportunityOS
  start --demo      Start in demo mode (mock data)
  stop              Stop OpportunityOS
  status            Show current status
  demo              Run a quick demo (no config needed)
  config            Show current configuration
  config --edit     Edit configuration file
  help              Show this help message
  version           Show version information

EXAMPLES:
  # First time setup (interactive prompts)
  npx opportunityos init

  # Try demo mode (no API keys needed)
  npx opportunityos demo

  # Start in production mode
  npx opportunityos start

  # Start in demo mode
  npx opportunityos start --demo

  # Check status
  npx opportunityos status

  # Stop the system
  npx opportunityos stop

  # View configuration
  npx opportunityos config

  # Edit configuration
  npx opportunityos config --edit

WORKFLOW:
  1. Run 'init' to create configuration
  2. Run 'start' to launch the system
  3. System runs on schedule (default: Monday 9am)
  4. Opportunities posted to Slack
  5. Team reviews and approves via Slack buttons
  6. Specs auto-generated for approved items

DOCUMENTATION:
  https://github.com/Lennyttb/opportunityOS

`);
}

function showVersion() {
  const packageJson = require('../../package.json');
  console.log(`\nOpportunityOS v${packageJson.version}\n`);
}

// Run CLI
main();

