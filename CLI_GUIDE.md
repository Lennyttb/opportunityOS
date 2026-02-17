# OpportunityOS CLI Guide

OpportunityOS now includes a **terminal-based CLI** for easy configuration and management!

## 🚀 Quick Start

### Option 1: Try Demo Mode (No Setup Required)

```bash
npx opportunityos demo
```

This runs a complete demo with fake data - no API keys needed!

### Option 2: Production Setup

```bash
# Step 1: Initialize configuration (interactive prompts)
npx opportunityos init

# Step 2: Start the system
npx opportunityos start
```

---

## 📋 Available Commands

### `npx opportunityos init`

**Interactive configuration setup**

Prompts you for:
- Mode selection (Demo or Production)
- API credentials (Userpilot, Slack, Kiro)
- System settings (schedule, log level, etc.)

Creates: `opportunityos.config.json` in your current directory

**Example:**
```bash
$ npx opportunityos init

🚀 OpportunityOS Configuration Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Configuration Mode:

How would you like to configure OpportunityOS?
  > 1. Demo Mode (fake data, no API keys required)
    2. Production Mode (real API keys)

Select (1-2): 1

🎭 Setting up Demo Mode...

✅ Demo configuration created!
```

---

### `npx opportunityos start`

**Start OpportunityOS**

Starts the system using your configuration file.

**Options:**
- `--demo` - Force demo mode (uses mock data)

**Examples:**
```bash
# Start in production mode
npx opportunityos start

# Start in demo mode
npx opportunityos start --demo
```

**What happens:**
- Checks if already running (prevents duplicates)
- Loads configuration from `opportunityos.config.json`
- Saves process ID to `.opportunityos.pid`
- Starts Slack bot (or mock in demo mode)
- Schedules detection jobs
- Runs continuously until stopped

---

### `npx opportunityos stop`

**Stop OpportunityOS**

Stops the running OpportunityOS process.

```bash
npx opportunityos stop
```

**What happens:**
- Finds the running process (from `.opportunityos.pid`)
- Sends graceful shutdown signal (SIGTERM)
- Cleans up resources
- Removes PID file

**Output:**
```bash
$ npx opportunityos stop

🛑 Stopping OpportunityOS...

📍 Found running process (PID: 12345)

✅ OpportunityOS stopped successfully!
```

---

### `npx opportunityos status`

**Show current status**

Displays whether OpportunityOS is running and shows configuration summary.

```bash
npx opportunityos status
```

**Output:**
```bash
$ npx opportunityos status

📊 OpportunityOS Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Status: Running
📍 Process ID: 12345
🎭 Mode: Production
📅 Schedule: 0 9 * * 1
📁 Data Path: ./data/opportunities.json
📊 Min Score: 60

💡 Commands:
   • Stop: npx opportunityos stop
   • View config: npx opportunityos config
```

---

### `npx opportunityos demo`

**Run a quick demo**

Runs a complete demonstration:
1. Detects opportunities from fake data
2. Simulates user interactions (promote, investigate, dismiss)
3. Generates mock specs
4. Shows final summary

**No configuration file needed!**

```bash
npx opportunityos demo
```

Perfect for:
- First-time users
- Testing the workflow
- Demonstrations
- Understanding how it works

---

### `npx opportunityos config`

**View current configuration**

Displays your configuration in a readable format (with secrets masked).

```bash
$ npx opportunityos config

📋 Current Configuration:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔌 Userpilot:
  API Token: user...xyz
  Base URL: https://api.userpilot.io/v1

💬 Slack:
  Bot Token: xoxb...abc
  App Token: xapp...def
  Channel ID: C123456

...
```

**Options:**
- `--edit` - Open config file in your default editor

```bash
npx opportunityos config --edit
```

---

### `npx opportunityos help`

**Show help message**

Displays all available commands and examples.

```bash
npx opportunityos help
```

---

### `npx opportunityos version`

**Show version**

Displays the current version of OpportunityOS.

```bash
npx opportunityos version
```

---

## 📁 Configuration File

The CLI creates `opportunityos.config.json` in your current directory.

**Example (Demo Mode):**
```json
{
  "userpilot": {
    "apiToken": "demo-token"
  },
  "slack": {
    "botToken": "xoxb-demo-token",
    "appToken": "xapp-demo-token",
    "channelId": "C-DEMO-CHANNEL"
  },
  "kiro": {
    "apiKey": "demo-api-key"
  },
  "detectionSchedule": "0 9 * * 1",
  "dataStorePath": "./demo-data/opportunities.json",
  "logLevel": "info",
  "minOpportunityScore": 60
}
```

**You can edit this file directly:**
```bash
nano opportunityos.config.json
# or
npx opportunityos config --edit
```

---

## 🎯 Typical Workflow

### First Time Setup

```bash
# 1. Try the demo first
npx opportunityos demo

# 2. Initialize your own config
npx opportunityos init

# 3. Review the config
npx opportunityos config

# 4. Edit if needed
npx opportunityos config --edit

# 5. Start the system
npx opportunityos start
```

### Daily Use

```bash
# Start the system (runs in background)
npx opportunityos start

# System runs on schedule (e.g., Monday 9am)
# Opportunities posted to Slack
# Team reviews via Slack buttons
# Specs auto-generated

# Stop with Ctrl+C
```

---

## 💡 Tips

1. **Start with demo mode** to understand the workflow
2. **Keep config file in version control** (but use environment variables for secrets in production)
3. **Use PM2 for production** to keep it running 24/7
4. **Check logs** if something goes wrong

---

## 🔒 Security Note

The config file contains API tokens. In production:

- **Don't commit** `opportunityos.config.json` to git
- **Use environment variables** for sensitive values
- **Restrict file permissions**: `chmod 600 opportunityos.config.json`

---

## 🆘 Troubleshooting

**"No configuration found"**
```bash
npx opportunityos init
```

**"Failed to start"**
- Check your API tokens are correct
- Verify Slack channel ID exists
- Try demo mode first: `npx opportunityos start --demo`

**Want to reset?**
```bash
rm opportunityos.config.json
npx opportunityos init
```

---

Happy opportunity hunting! 🎯

