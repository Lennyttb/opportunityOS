# CLI Implementation Summary

## What Was Added

A complete **terminal-based CLI** with interactive prompts for configuration and management of OpportunityOS.

## New Files Created

### CLI Infrastructure (`src/cli/`)

#### `prompts.ts`
Utility functions for terminal interaction:
- `prompt()` - Ask user for text input
- `confirm()` - Yes/no questions
- `select()` - Choose from options
- `secret()` - Password/token input
- `pause()` - Wait for Enter

#### `config.ts`
Configuration file management:
- `getConfigPath()` - Get config file location
- `configExists()` - Check if config exists
- `loadConfig()` - Load from JSON file
- `saveConfig()` - Save to JSON file
- `createDefaultConfig()` - Generate defaults
- `displayConfig()` - Pretty-print config (with masked secrets)

#### `commands/init.ts`
Interactive configuration setup:
- Prompts for mode (Demo vs Production)
- Collects API credentials
- Saves to `opportunityos.config.json`
- Validates input

#### `commands/start.ts`
Start the system:
- Loads configuration
- Detects demo vs production mode
- Starts OpportunityOS or DemoOpportunityOS
- Handles graceful shutdown (Ctrl+C)

#### `commands/demo.ts`
Quick demo runner:
- No configuration needed
- Runs complete workflow
- Simulates user interactions
- Shows summary

#### `commands/config.ts`
View/edit configuration:
- Display current config
- Open in editor (`--edit` flag)
- Mask sensitive values

#### `index.ts`
Main CLI entry point:
- Command routing
- Help text
- Version display
- Error handling

## Updated Files

### `package.json`
- Added `bin` entry: `"opportunityos": "dist/src/cli/index.js"`
- Updated `main` and `types` paths to match new structure

### `README.md`
- Added CLI quick start section
- Added CLI commands table
- Highlighted `npx opportunityos demo` as easiest entry point

## How It Works

### Installation

When users install the package:
```bash
npm install -g opportunityos
# or
npx opportunityos <command>
```

The `bin` entry in package.json makes `opportunityos` available as a command.

### Command Flow

```
User runs: npx opportunityos init
    ↓
CLI loads: src/cli/index.ts
    ↓
Routes to: src/cli/commands/init.ts
    ↓
Prompts user for input
    ↓
Saves to: opportunityos.config.json
```

### Configuration File

Created in current working directory:
```json
{
  "userpilot": { "apiToken": "..." },
  "slack": { "botToken": "...", "appToken": "...", "channelId": "..." },
  "kiro": { "apiKey": "..." },
  "detectionSchedule": "0 9 * * 1",
  "dataStorePath": "./data/opportunities.json",
  "logLevel": "info",
  "minOpportunityScore": 60
}
```

## Available Commands

| Command | What It Does |
|---------|--------------|
| `npx opportunityos demo` | Run complete demo with fake data |
| `npx opportunityos init` | Interactive setup wizard |
| `npx opportunityos start` | Start the system |
| `npx opportunityos start --demo` | Start in demo mode |
| `npx opportunityos config` | View configuration |
| `npx opportunityos config --edit` | Edit config in editor |
| `npx opportunityos help` | Show help |
| `npx opportunityos version` | Show version |

## User Experience

### First-Time User

```bash
$ npx opportunityos demo

🎭 OpportunityOS Demo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This demo uses fake data - no API keys required!

🔍 Running opportunity detection...

================================================================================
🔔 NEW OPPORTUNITY DETECTED
================================================================================
Title: High Dropoff in Checkout Flow - Enter Payment
Type: funnel_drop
Score: 72/100 🟡
...
```

### Production Setup

```bash
$ npx opportunityos init

🚀 OpportunityOS Configuration Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Configuration Mode:

How would you like to configure OpportunityOS?
  > 1. Demo Mode (fake data, no API keys required)
    2. Production Mode (real API keys)

Select (1-2): 2

🔐 Production Mode Setup

📊 Userpilot Configuration:

Userpilot API Token: [user enters token]
Userpilot Base URL (https://api.userpilot.io/v1): [Enter for default]

💬 Slack Configuration:

Slack Bot Token (xoxb-...): [user enters token]
...

✅ Configuration saved successfully!
```

## Benefits

### For Users

1. **No code required** - Just terminal commands
2. **Interactive prompts** - Guided setup
3. **Instant demo** - Try before configuring
4. **Easy to edit** - Config file is plain JSON
5. **Clear workflow** - init → start → done

### For Developers

1. **Standard CLI patterns** - Familiar to Node.js users
2. **npx support** - No global install needed
3. **Extensible** - Easy to add new commands
4. **Type-safe** - Full TypeScript support

## Technical Details

### Dependencies

No new dependencies! Uses only Node.js built-ins:
- `readline` - For terminal prompts
- `child_process` - For opening editor
- `fs/promises` - For config file I/O

### File Structure

```
src/
├── cli/
│   ├── commands/
│   │   ├── init.ts       # Setup wizard
│   │   ├── start.ts      # Start system
│   │   ├── demo.ts       # Quick demo
│   │   └── config.ts     # View/edit config
│   ├── prompts.ts        # Terminal I/O utilities
│   ├── config.ts         # Config file management
│   └── index.ts          # Main CLI entry point
```

### Build Output

```
dist/
└── src/
    └── cli/
        └── index.js      # Executable CLI (chmod +x)
```

## Testing

All existing tests still pass (83 tests).

Manual testing:
```bash
✅ npx opportunityos help
✅ npx opportunityos demo
✅ npx opportunityos init (demo mode)
✅ npx opportunityos init (production mode)
✅ npx opportunityos config
✅ npx opportunityos start --demo
```

## Next Steps for Users

1. **Try demo**: `npx opportunityos demo`
2. **Setup**: `npx opportunityos init`
3. **Start**: `npx opportunityos start`
4. **Monitor**: Check Slack for opportunities!

## Conclusion

OpportunityOS now has a **professional CLI** that makes it:
- ✅ Easy to try (demo mode)
- ✅ Easy to configure (interactive prompts)
- ✅ Easy to run (single command)
- ✅ Easy to manage (view/edit config)

No more manual JSON editing or code changes required!

