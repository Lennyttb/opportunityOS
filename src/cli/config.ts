import * as fs from 'fs/promises';
import * as path from 'path';
import { OpportunityOSConfig, LogLevel } from '../types';

const CONFIG_FILE_NAME = 'opportunityos.config.json';

/**
 * Get the config file path (in current working directory)
 */
export function getConfigPath(): string {
  return path.join(process.cwd(), CONFIG_FILE_NAME);
}

/**
 * Check if config file exists
 */
export async function configExists(): Promise<boolean> {
  try {
    await fs.access(getConfigPath());
    return true;
  } catch {
    return false;
  }
}

/**
 * Load config from file
 */
export async function loadConfig(): Promise<Partial<OpportunityOSConfig>> {
  try {
    const configPath = getConfigPath();
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to load config: ${(error as Error).message}`);
  }
}

/**
 * Save config to file
 */
export async function saveConfig(config: Partial<OpportunityOSConfig>): Promise<void> {
  try {
    const configPath = getConfigPath();
    const data = JSON.stringify(config, null, 2);
    await fs.writeFile(configPath, data, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to save config: ${(error as Error).message}`);
  }
}

/**
 * Create default config template
 */
export function createDefaultConfig(demo: boolean = false): Partial<OpportunityOSConfig> {
  if (demo) {
    return {
      userpilot: {
        apiToken: 'demo-token',
      },
      slack: {
        botToken: 'xoxb-demo-token',
        appToken: 'xapp-demo-token',
        channelId: 'C-DEMO-CHANNEL',
      },
      kiro: {
        apiKey: 'demo-api-key',
      },
      detectionSchedule: '0 9 * * 1',
      dataStorePath: './demo-data/opportunities.json',
      logLevel: LogLevel.INFO,
      minOpportunityScore: 60,
    };
  }

  return {
    userpilot: {
      apiToken: '',
      baseUrl: 'https://api.userpilot.io/v1',
    },
    slack: {
      botToken: '',
      appToken: '',
      channelId: '',
    },
    kiro: {
      apiKey: '',
      baseUrl: 'https://api.kiro.ai/v1',
    },
    detectionSchedule: '0 9 * * 1',
    dataStorePath: './data/opportunities.json',
    logLevel: LogLevel.INFO,
    minOpportunityScore: 60,
  };
}

/**
 * Display config in a readable format
 */
export function displayConfig(config: Partial<OpportunityOSConfig>): void {
  console.log('\n📋 Current Configuration:');
  console.log('━'.repeat(60));
  
  console.log('\n🔌 Userpilot:');
  console.log(`  API Token: ${maskSecret(config.userpilot?.apiToken)}`);
  console.log(`  Base URL: ${config.userpilot?.baseUrl || 'default'}`);
  
  console.log('\n💬 Slack:');
  console.log(`  Bot Token: ${maskSecret(config.slack?.botToken)}`);
  console.log(`  App Token: ${maskSecret(config.slack?.appToken)}`);
  console.log(`  Channel ID: ${config.slack?.channelId || 'not set'}`);
  
  console.log('\n🤖 Kiro AI:');
  console.log(`  API Key: ${maskSecret(config.kiro?.apiKey)}`);
  console.log(`  Base URL: ${config.kiro?.baseUrl || 'default'}`);
  
  console.log('\n⚙️  Settings:');
  console.log(`  Detection Schedule: ${config.detectionSchedule || 'default'}`);
  console.log(`  Data Store Path: ${config.dataStorePath || 'default'}`);
  console.log(`  Log Level: ${config.logLevel || 'default'}`);
  console.log(`  Min Opportunity Score: ${config.minOpportunityScore || 'default'}`);
  
  console.log('\n━'.repeat(60));
  console.log(`📁 Config file: ${getConfigPath()}\n`);
}

/**
 * Mask secret values for display
 */
function maskSecret(value?: string): string {
  if (!value) return 'not set';
  if (value.includes('demo')) return value;
  if (value.length <= 8) return '***';
  return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
}

