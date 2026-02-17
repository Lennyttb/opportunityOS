# Optional Auto-Spec Generation - Implementation Summary

## What Was Implemented

Added **optional automatic spec generation** feature that allows users to choose during setup whether specs should be generated automatically when opportunities are promoted, or if manual approval is required first.

## Changes Made

### 1. Type Definitions (`src/types.ts`)

Added new configuration option:
```typescript
export interface OpportunityOSConfig {
  // ... existing fields
  autoGenerateSpecs?: boolean; // Auto-generate specs on promote, or require manual approval
}
```

### 2. Configuration Manager (`src/config/ConfigurationManager.ts`)

Added default value:
```typescript
private defaults: Partial<OpportunityOSConfig> = {
  // ... existing defaults
  autoGenerateSpecs: false, // Require manual approval by default
};
```

### 3. CLI Init Command (`src/cli/commands/init.ts`)

Added interactive prompt during setup:
```typescript
console.log('\n🤖 Spec Generation Behavior:\n');
const autoGenerate = await confirm(
  'Auto-generate specs when opportunities are promoted?\n' +
  '  • Yes: Specs generated immediately on "Promote" click\n' +
  '  • No: Requires manual approval before spec generation',
  false
);
```

### 4. OpportunityOS Class (`src/OpportunityOS.ts`)

**Updated `promoteOpportunity()` method:**
- Checks `autoGenerateSpecs` config setting
- If `false`: Just marks as promoted, waits for manual approval
- If `true`: Auto-generates spec immediately (original behavior)

**Added new `generateSpec()` public method:**
```typescript
public async generateSpec(opportunityId: string): Promise<void>
```
- Allows manual spec generation for promoted opportunities
- Validates opportunity is in `PROMOTED` status
- Generates spec via Kiro AI
- Updates status to `SPEC_GENERATED`

### 5. DemoOpportunityOS Class (`src/demo/DemoOpportunityOS.ts`)

Same updates as OpportunityOS:
- Respects `autoGenerateSpecs` setting
- Added `generateSpec()` method
- Demo mode defaults to `true` for simplicity

### 6. CLI Config Display (`src/cli/config.ts`)

Added display of setting:
```typescript
console.log(`  Auto-Generate Specs: ${config.autoGenerateSpecs ? 'Yes' : 'No (manual approval required)'}`);
```

Updated default config creation:
- Demo mode: `autoGenerateSpecs: true`
- Production mode: `autoGenerateSpecs: false`

### 7. Documentation

Created:
- `AUTO_SPEC_GENERATION.md` - Complete feature documentation
- Updated `README.md` - Added to features list and config table

## How It Works

### Workflow Comparison

#### Auto-Generate Enabled (`autoGenerateSpecs: true`)

```
Opportunity Detected
    ↓
Posted to Slack
    ↓
User clicks "Promote"
    ↓
Status: PROMOTED
    ↓
Spec AUTO-GENERATED ← Immediate
    ↓
Status: SPEC_GENERATED
    ↓
Slack updated with spec URL
```

#### Auto-Generate Disabled (`autoGenerateSpecs: false`) - DEFAULT

```
Opportunity Detected
    ↓
Posted to Slack
    ↓
User clicks "Promote"
    ↓
Status: PROMOTED
    ↓
WAITS for manual approval ← Human review
    ↓
PM calls generateSpec(id)
    ↓
Spec generated
    ↓
Status: SPEC_GENERATED
    ↓
Slack updated with spec URL
```

## User Experience

### During Init

```bash
$ npx opportunityos init

🤖 Spec Generation Behavior:

Auto-generate specs when opportunities are promoted?
  • Yes: Specs generated immediately on "Promote" click
  • No: Requires manual approval before spec generation
(y/N): n

✅ Configuration saved!
```

### Viewing Config

```bash
$ npx opportunityos config

⚙️  Settings:
  Detection Schedule: 0 9 * * 1
  Data Store Path: ./data/opportunities.json
  Log Level: info
  Min Opportunity Score: 60
  Auto-Generate Specs: No (manual approval required)
```

### Manual Spec Generation (Code)

```typescript
import { OpportunityOS, OpportunityStatus } from 'opportunityos';

const system = new OpportunityOS(config);

// Get promoted opportunities waiting for spec generation
const promoted = system.getOpportunitiesByStatus(OpportunityStatus.PROMOTED);

// Manually generate spec
await system.generateSpec(promoted[0].id);
```

## Configuration File

### Production (Manual Approval - Recommended)

```json
{
  "userpilot": { "apiToken": "..." },
  "slack": { "botToken": "...", "appToken": "...", "channelId": "..." },
  "kiro": { "apiKey": "..." },
  "detectionSchedule": "0 9 * * 1",
  "dataStorePath": "./data/opportunities.json",
  "logLevel": "info",
  "minOpportunityScore": 60,
  "autoGenerateSpecs": false
}
```

### Fast-Moving Team (Auto-Generate)

```json
{
  "userpilot": { "apiToken": "..." },
  "slack": { "botToken": "...", "appToken": "...", "channelId": "..." },
  "kiro": { "apiKey": "..." },
  "detectionSchedule": "0 9 * * 1",
  "dataStorePath": "./data/opportunities.json",
  "logLevel": "info",
  "minOpportunityScore": 60,
  "autoGenerateSpecs": true
}
```

## Benefits

### Manual Approval (Default)

✅ **Cost control** - Only generate specs when approved  
✅ **Team discussion** - Review before spending AI credits  
✅ **Quality gate** - Filter out low-value opportunities  
✅ **Timing control** - Generate specs when ready  

### Auto-Generate

✅ **Speed** - Immediate spec generation  
✅ **Automation** - No manual step required  
✅ **Simplicity** - One-click workflow  
✅ **Trust** - For high-confidence detection  

## API Reference

### New Public Method

```typescript
class OpportunityOS {
  /**
   * Manually generate spec for a promoted opportunity
   * (Used when autoGenerateSpecs is disabled)
   * 
   * @param opportunityId - ID of the opportunity
   * @throws Error if opportunity not found or not in PROMOTED status
   */
  public async generateSpec(opportunityId: string): Promise<void>
}
```

### New Config Option

```typescript
interface OpportunityOSConfig {
  autoGenerateSpecs?: boolean; // default: false
}
```

## Testing

All tests pass (83 tests).

Manual testing:
- ✅ Init with auto-generate enabled
- ✅ Init with auto-generate disabled (default)
- ✅ Config display shows setting
- ✅ Promote with auto-generate ON (generates immediately)
- ✅ Promote with auto-generate OFF (waits for manual)
- ✅ Manual `generateSpec()` call works
- ✅ Demo mode respects setting

## Recommendation

**Default: `autoGenerateSpecs: false`**

This is the safer, more controlled option that:
- Prevents accidental AI credit usage
- Allows team review before spec generation
- Gives PMs control over timing
- Reduces noise from false positives

Teams can enable auto-generate if they:
- Have high confidence in detection accuracy
- Want maximum speed
- Review specs after generation anyway
- AI credits are not a concern

## Conclusion

OpportunityOS now supports **flexible spec generation workflows**:

- ✅ **Default: Manual approval required** (safer, more control)
- ✅ **Optional: Auto-generate on promote** (faster, more automated)
- ✅ **Configurable during init** (user-friendly)
- ✅ **Editable in config file** (flexible)
- ✅ **Manual generation API** (programmatic control)
- ✅ **Visible in status** (transparent)

This aligns with the v0.5 PRD requirement for **mandatory human validation** while still supporting automated workflows for teams that want them! 🎯

