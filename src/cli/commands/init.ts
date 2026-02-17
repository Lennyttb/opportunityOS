import { prompt, confirm, select } from '../prompts';
import { saveConfig, configExists, createDefaultConfig, displayConfig } from '../config';
import { LogLevel } from '../../types';

/**
 * Initialize OpportunityOS configuration
 */
export async function initCommand(): Promise<void> {
  console.log('\n🚀 OpportunityOS Configuration Setup\n');
  console.log('━'.repeat(60));

  // Check if config already exists
  if (await configExists()) {
    const overwrite = await confirm(
      '\n⚠️  Configuration file already exists. Overwrite?',
      false
    );
    
    if (!overwrite) {
      console.log('\n❌ Initialization cancelled.\n');
      return;
    }
  }

  // Ask if demo mode
  console.log('\n📋 Configuration Mode:\n');
  const mode = await select(
    'How would you like to configure OpportunityOS?',
    ['Demo Mode (fake data, no API keys required)', 'Production Mode (real API keys)'],
    0
  );

  const isDemoMode = mode.includes('Demo');

  if (isDemoMode) {
    // Demo mode - use defaults
    console.log('\n🎭 Setting up Demo Mode...\n');
    const config = createDefaultConfig(true);
    
    await saveConfig(config);
    
    console.log('✅ Demo configuration created!\n');
    displayConfig(config);
    
    console.log('🎯 Next steps:');
    console.log('  1. Run: npx opportunityos start --demo');
    console.log('  2. Or run: npx opportunityos demo\n');
    
    return;
  }

  // Production mode - collect API keys
  console.log('\n🔐 Production Mode Setup\n');
  console.log('You will need API credentials for:\n');
  console.log('  • Userpilot (product analytics)');
  console.log('  • Slack (bot and app tokens)');
  console.log('  • Kiro AI (spec generation)\n');

  const proceed = await confirm('Do you have these credentials ready?', true);
  
  if (!proceed) {
    console.log('\n💡 Tip: Get your API credentials first, then run this command again.\n');
    console.log('Documentation:');
    console.log('  • Userpilot: https://docs.userpilot.com/api');
    console.log('  • Slack: https://api.slack.com/apps');
    console.log('  • Kiro: https://kiro.ai/docs\n');
    return;
  }

  // Collect Userpilot config
  console.log('\n📊 Userpilot Configuration:\n');
  const userpilotToken = await prompt('Userpilot API Token');
  const userpilotUrl = await prompt('Userpilot Base URL', 'https://api.userpilot.io/v1');

  // Collect Slack config
  console.log('\n💬 Slack Configuration:\n');
  const slackBotToken = await prompt('Slack Bot Token (xoxb-...)');
  const slackAppToken = await prompt('Slack App Token (xapp-...)');
  const slackChannelId = await prompt('Slack Channel ID (C...)');

  // Collect Kiro config
  console.log('\n🤖 Kiro AI Configuration:\n');
  const kiroApiKey = await prompt('Kiro API Key');
  const kiroUrl = await prompt('Kiro Base URL', 'https://api.kiro.ai/v1');

  // Collect settings
  console.log('\n⚙️  System Settings:\n');
  const schedule = await prompt('Detection Schedule (cron format)', '0 9 * * 1');
  const dataPath = await prompt('Data Storage Path', './data/opportunities.json');
  
  const logLevelChoice = await select(
    'Log Level',
    ['debug', 'info', 'warn', 'error'],
    1
  );
  
  const minScore = await prompt('Minimum Opportunity Score (0-100)', '60');

  // Create config object
  const config = {
    userpilot: {
      apiToken: userpilotToken,
      baseUrl: userpilotUrl,
    },
    slack: {
      botToken: slackBotToken,
      appToken: slackAppToken,
      channelId: slackChannelId,
    },
    kiro: {
      apiKey: kiroApiKey,
      baseUrl: kiroUrl,
    },
    detectionSchedule: schedule,
    dataStorePath: dataPath,
    logLevel: logLevelChoice as LogLevel,
    minOpportunityScore: parseInt(minScore) || 60,
  };

  // Save config
  await saveConfig(config);

  console.log('\n✅ Configuration saved successfully!\n');
  displayConfig(config);

  console.log('🎯 Next steps:');
  console.log('  1. Review config: cat opportunityos.config.json');
  console.log('  2. Start system: npx opportunityos start');
  console.log('  3. View status: npx opportunityos status\n');
}

