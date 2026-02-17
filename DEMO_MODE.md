# Demo Mode - Test Without Real APIs

OpportunityOS includes a **demo mode** that lets you test the entire system with fake data - **no real API tokens required**!

## Quick Start

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

## What the Demo Does

The demo script:

1. ✅ **Generates fake data** from "Userpilot" (funnels, NPS, feature usage)
2. 🔍 **Detects opportunities** using the real detection algorithms
3. 📢 **Posts to console** (simulating Slack notifications)
4. 🤖 **Generates mock specs** (simulating Kiro AI)
5. 📊 **Tracks the full lifecycle** from detection to shipping

## Demo Output

You'll see:

- **Detected opportunities** with scores, insights, and metrics
- **Simulated Slack posts** with formatted opportunity details
- **Mock spec generation** with AI-generated PRD summaries
- **Status updates** as opportunities move through the workflow
- **Final summary** of all opportunities by status

## Using Demo Mode in Your Code

```typescript
import { DemoOpportunityOS } from 'opportunityos';

const demo = new DemoOpportunityOS({
  // Optional: customize settings
  minOpportunityScore: 60,
  dataStorePath: './demo-data/opportunities.json',
});

await demo.start();

// Run detection with mock data
const opportunities = await demo.runDetection();

// Simulate user actions
await demo.simulateUserAction(opportunities[0].id, 'promote');

// View results
console.log(demo.getOpportunities());

await demo.stop();
```

## Mock Components

The demo mode includes three mock clients:

### MockUserpilotClient
- Generates realistic funnel data with high dropoffs
- Creates low NPS scores with detractor feedback
- Simulates feature usage with low adoption rates

### MockSlackNotifier
- Logs formatted opportunities to console
- Simulates button interactions
- Tracks posted opportunities

### MockKiroAgent
- Generates mock PRD summaries
- Simulates AI processing time (2 seconds)
- Creates demo spec URLs

## What Gets Tested

Even though it uses fake data, the demo exercises:

- ✅ **Real detection algorithms** - Same scoring logic as production
- ✅ **Real opportunity store** - Actual JSON file persistence
- ✅ **Real workflow** - Complete lifecycle from detection to shipping
- ✅ **Real configuration** - Same config validation as production

## Data Storage

Demo data is stored in `./demo-data/opportunities.json`

You can inspect this file to see the full opportunity data structure.

## Benefits

1. **No API Setup** - Test immediately without any API tokens
2. **Reproducible** - Same fake data every time
3. **Fast** - No network calls, instant results
4. **Educational** - See exactly how the system works
5. **Development** - Perfect for testing changes locally

## Switching to Production

When ready for production, simply use `OpportunityOS` instead of `DemoOpportunityOS`:

```typescript
// Demo mode
import { DemoOpportunityOS } from 'opportunityos';
const system = new DemoOpportunityOS();

// Production mode
import { OpportunityOS } from 'opportunityos';
const system = new OpportunityOS({
  userpilot: { apiToken: process.env.USERPILOT_API_TOKEN },
  slack: { 
    botToken: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    channelId: process.env.SLACK_CHANNEL_ID
  },
  kiro: { apiKey: process.env.KIRO_API_KEY }
});
```

The API is identical - just swap the class!

## Example Demo Run

```
🚀 Starting OpportunityOS Demo

📊 Fetching mock data from "Userpilot"...
🔍 Analyzing data for opportunities...

================================================================================
🔔 NEW OPPORTUNITY DETECTED
================================================================================
Title: High Dropoff in Checkout Flow - Enter Payment
Type: funnel_drop
Score: 72/100 🟡
Status: detected

Description:
Users are dropping off at "Enter Payment" with a 45.0% dropoff rate.

Key Insights:
  • 45.0% dropoff at step 2
  • Affecting 900 users

💡 Actions Available:
  [1] Promote (generate spec)
  [2] Investigate (mark for review)
  [3] Dismiss
================================================================================

✅ Detected 4 opportunities!

🎭 Simulating user interactions...
👉 Promoting opportunity: "Low Adoption of Advanced Analytics Dashboard"

🤖 KIRO AI - SPEC GENERATION COMPLETE
...

✅ DEMO COMPLETE!
```

Perfect for learning, testing, and development!

