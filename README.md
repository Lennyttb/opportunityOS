# OpportunityOS

**AI-native product intelligence system** that automatically detects product opportunities from user behavior data and converts them into actionable specs.

## Features

- 🔍 **Automated Detection**: Analyzes Userpilot data (funnels, NPS, feature usage) to detect friction patterns
- 🤖 **AI-Powered Scoring**: Scores opportunities 0-100 based on impact and confidence
- 💬 **Slack Integration**: Posts opportunities to Slack with interactive buttons (Promote/Dismiss/Investigate)
- 📄 **Spec Generation**: Automatically generates PRDs via Kiro AI agent when promoted
- 📊 **Closed-Loop Learning**: Tracks post-release metrics to improve detection accuracy
- 🔄 **Scheduled Detection**: Runs on configurable cron schedule (default: Monday 9am)

## Installation

```bash
# Clone the repo
git clone https://github.com/Lennyttb/opportunityOS
cd opportunityOS

# Install dependencies
npm install

# Build the project
npm run build

# Run the demo
node dist/examples/demo.js
```

## 🎭 Try It Now - No Setup Required!

```bash
npx opportunityos demo
```

**That's it!** See the entire system in action with fake data - no API keys, no configuration!

## 🚀 Quick Start (Production)

### Interactive Setup

```bash
# Step 1: Initialize with interactive prompts
npx opportunityos init

# Step 2: Start the system
npx opportunityos start
```

The CLI will guide you through configuration with terminal prompts!

See [CLI_GUIDE.md](./CLI_GUIDE.md) for all commands.

## Alternative: Code-Based Setup

```typescript
import { OpportunityOS } from 'opportunityos';

const opportunityOS = new OpportunityOS({
  userpilot: {
    apiToken: process.env.USERPILOT_API_TOKEN,
  },
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    channelId: 'C123456', // Your Slack channel ID
  },
  kiro: {
    apiKey: process.env.KIRO_API_KEY,
  },
  // Optional configuration
  detectionSchedule: '0 9 * * 1', // Monday 9am (cron format)
  dataStorePath: './data/opportunities.json',
  logLevel: 'info',
  minOpportunityScore: 60,
});

// Start the system
await opportunityOS.start();

// Manually trigger detection
const opportunities = await opportunityOS.runDetection();

// Stop the system
await opportunityOS.stop();
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `npx opportunityos demo` | Run quick demo (no setup) |
| `npx opportunityos init` | Interactive configuration setup |
| `npx opportunityos start` | Start the system |
| `npx opportunityos start --demo` | Start in demo mode |
| `npx opportunityos stop` | Stop the system |
| `npx opportunityos status` | Show current status |
| `npx opportunityos config` | View configuration |
| `npx opportunityos config --edit` | Edit configuration |
| `npx opportunityos help` | Show help |

See [CLI_GUIDE.md](./CLI_GUIDE.md) for detailed documentation.

## Configuration

### Required Configuration

| Field | Type | Description |
|-------|------|-------------|
| `userpilot.apiToken` | string | Userpilot API token |
| `slack.botToken` | string | Slack bot token (xoxb-...) |
| `slack.appToken` | string | Slack app token (xapp-...) |
| `slack.channelId` | string | Slack channel ID for posting opportunities |
| `kiro.apiKey` | string | Kiro AI agent API key |

### Optional Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `userpilot.baseUrl` | string | `https://api.userpilot.io/v1` | Userpilot API base URL |
| `kiro.baseUrl` | string | `https://api.kiro.ai/v1` | Kiro API base URL |
| `detectionSchedule` | string | `0 9 * * 1` | Cron schedule for detection |
| `dataStorePath` | string | `./data/opportunities.json` | Path to store opportunities |
| `logLevel` | string | `info` | Log level (debug, info, warn, error) |
| `minOpportunityScore` | number | 60 | Minimum score to post opportunity |

## How It Works

### 1. Detection

OpportunityOS analyzes three types of data from Userpilot:

- **Funnel Dropoffs**: Detects steps with >30% dropoff rate
- **Low NPS**: Detects NPS scores <30 with sufficient responses
- **Feature Underuse**: Detects features with <20% adoption

Each opportunity is scored 0-100 based on:
- **Impact**: Severity of the issue (dropoff rate, NPS score, usage rate)
- **Confidence**: Volume of data (user count, response count)

### 2. Human Review

Opportunities are posted to Slack with three action buttons:

- **✅ Promote**: Generate a spec via Kiro AI
- **🔍 Investigate**: Mark for further investigation
- **❌ Dismiss**: Dismiss the opportunity

### 3. Spec Generation

When promoted, OpportunityOS:
1. Calls Kiro AI agent with opportunity details and evidence
2. Receives a generated PRD/spec URL
3. Updates the Slack message with the spec link

### 4. Tracking

After shipping, mark opportunities as shipped with actual metrics:

```typescript
await opportunityOS.markAsShipped('opp-123', {
  metricsBefore: { conversionRate: 0.45 },
  metricsAfter: { conversionRate: 0.62 },
});
```

This feedback improves future detection accuracy.

## API Reference

### OpportunityOS

#### `start(): Promise<void>`
Start the OpportunityOS system (Slack bot + cron scheduler)

#### `stop(): Promise<void>`
Stop the OpportunityOS system

#### `runDetection(): Promise<Opportunity[]>`
Manually trigger opportunity detection

#### `getOpportunities(): Opportunity[]`
Get all opportunities

#### `getOpportunitiesByStatus(status: OpportunityStatus): Opportunity[]`
Get opportunities filtered by status

#### `getOpportunity(id: string): Opportunity | undefined`
Get a specific opportunity by ID

#### `markAsShipped(opportunityId: string, actualImpact: ActualImpact): Promise<void>`
Mark an opportunity as shipped with actual metrics

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build
npm run build

# Lint
npm run lint

# Format
npm run format
```

## License

MIT

