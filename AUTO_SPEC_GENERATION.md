# Auto-Spec Generation Feature

## Overview

OpportunityOS now supports **optional automatic spec generation**. You can choose during setup whether specs should be generated automatically when opportunities are promoted, or if manual approval is required.

## Configuration

### During Init

When you run `npx opportunityos init`, you'll be asked:

```
🤖 Spec Generation Behavior:

Auto-generate specs when opportunities are promoted?
  • Yes: Specs generated immediately on "Promote" click
  • No: Requires manual approval before spec generation
(y/N):
```

**Default: No** (manual approval required)

### In Config File

The setting is stored in `opportunityos.config.json`:

```json
{
  "autoGenerateSpecs": false
}
```

You can edit this manually:
- `true` - Auto-generate specs on promote
- `false` - Require manual approval (default)

## Behavior

### Auto-Generate Enabled (`autoGenerateSpecs: true`)

**Workflow:**
1. Opportunity detected → Posted to Slack
2. User clicks "✅ Promote" button
3. **Spec automatically generated** via Kiro AI
4. Slack message updated with spec URL
5. Status: `SPEC_GENERATED`

**Use case:** Fast-moving teams that trust the AI detection

### Auto-Generate Disabled (`autoGenerateSpecs: false`) - DEFAULT

**Workflow:**
1. Opportunity detected → Posted to Slack
2. User clicks "✅ Promote" button
3. Status changed to `PROMOTED`
4. **Waits for manual spec generation**
5. PM/Engineer manually triggers spec generation
6. Spec generated via Kiro AI
7. Status: `SPEC_GENERATED`

**Use case:** Teams that want human review before spending AI credits

## Manual Spec Generation

When auto-generate is disabled, you can manually generate specs:

### Via Code

```typescript
import { OpportunityOS } from 'opportunityos';

const system = new OpportunityOS(config);

// Get promoted opportunities
const promoted = system.getOpportunitiesByStatus(OpportunityStatus.PROMOTED);

// Manually generate spec for a specific opportunity
await system.generateSpec(promoted[0].id);
```

### Via CLI (Future Enhancement)

```bash
# List promoted opportunities
npx opportunityos list --status=promoted

# Generate spec for specific opportunity
npx opportunityos generate-spec <opportunity-id>
```

## Comparison

| Feature | Auto-Generate ON | Auto-Generate OFF (Default) |
|---------|------------------|------------------------------|
| **Promote button** | Generates spec immediately | Just marks as promoted |
| **Human approval** | Not required | Required before spec generation |
| **AI credits used** | Automatically | Only when manually triggered |
| **Speed** | Faster | Slower (requires manual step) |
| **Control** | Less | More |
| **Best for** | High-trust teams | Teams wanting review |

## Example Scenarios

### Scenario 1: High-Trust Team (Auto ON)

```
Monday 9am: Opportunity detected
Monday 9:05am: PM sees Slack notification
Monday 9:06am: PM clicks "Promote"
Monday 9:07am: Spec auto-generated, ready to review
Monday 10am: Engineering starts implementation
```

**Total time: ~1 hour**

### Scenario 2: Review-First Team (Auto OFF - Default)

```
Monday 9am: Opportunity detected
Monday 9:05am: PM sees Slack notification
Monday 9:06am: PM clicks "Promote"
Monday 10am: PM reviews with team in standup
Monday 10:30am: Team approves, PM manually triggers spec generation
Monday 10:35am: Spec generated, ready to review
Monday 11am: Engineering starts implementation
```

**Total time: ~2 hours**

## Configuration Examples

### Demo Mode (Auto ON)

```json
{
  "userpilot": { "apiToken": "demo-token" },
  "slack": { "botToken": "xoxb-demo-token", ... },
  "kiro": { "apiKey": "demo-api-key" },
  "autoGenerateSpecs": true
}
```

### Production Mode (Auto OFF - Recommended)

```json
{
  "userpilot": { "apiToken": "real-token" },
  "slack": { "botToken": "xoxb-real-token", ... },
  "kiro": { "apiKey": "real-api-key" },
  "autoGenerateSpecs": false
}
```

## Viewing Current Setting

```bash
npx opportunityos config
```

Output:
```
⚙️  Settings:
  Detection Schedule: 0 9 * * 1
  Data Store Path: ./data/opportunities.json
  Log Level: info
  Min Opportunity Score: 60
  Auto-Generate Specs: No (manual approval required)
```

## Changing the Setting

### Option 1: Edit Config File

```bash
npx opportunityos config --edit
```

Change `autoGenerateSpecs` to `true` or `false`.

### Option 2: Re-run Init

```bash
npx opportunityos init
```

Choose your preference when prompted.

## API Reference

### `OpportunityOS.generateSpec(opportunityId: string)`

Manually generate a spec for a promoted opportunity.

**Parameters:**
- `opportunityId` - ID of the opportunity

**Throws:**
- Error if opportunity not found
- Error if opportunity not in `PROMOTED` status

**Example:**
```typescript
const system = new OpportunityOS(config);

// Promote an opportunity (doesn't auto-generate if disabled)
// ... user clicks Promote in Slack ...

// Later, manually generate spec
await system.generateSpec('opp-123');
```

## Recommendation

**For most teams:** Keep `autoGenerateSpecs: false` (default)

**Reasons:**
1. Prevents accidental AI credit usage
2. Allows team discussion before spec generation
3. Gives PM control over timing
4. Reduces noise from low-quality opportunities

**Enable auto-generate if:**
- You have high confidence in detection accuracy
- You want maximum speed
- You review specs after generation anyway
- AI credits are not a concern

## Summary

- ✅ **Default: Manual approval required** (`autoGenerateSpecs: false`)
- ✅ **Optional: Auto-generate on promote** (`autoGenerateSpecs: true`)
- ✅ **Configurable during init**
- ✅ **Editable in config file**
- ✅ **Manual generation API available**
- ✅ **Visible in status display**

This gives teams full control over when AI resources are used! 🎯

