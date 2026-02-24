# Git Hooks for descomplica-workflows

Git hooks to maintain workflow synchronization and prevent drift.

## Available Hooks

### pre-commit

**Purpose:** Prevents committing workflows that have drift from production VM.

**What it does:**
- Runs `sync-n8n-status.py --quiet` before each commit
- Blocks commit if drift detected
- Shows helpful instructions for syncing
- Exits cleanly if no drift

**When it blocks:**
- Local workflow differs from VM version
- VM has newer version than local
- Uncommitted workflow changes detected

## Installation

### Automatic Installation

```bash
bash hooks/install.sh
```

### Manual Installation

```bash
cp hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## Usage

Once installed, the hooks run automatically:

```bash
# Normal commit - hook checks for drift
git commit -m "Update workflow"

# Bypass hook if needed (not recommended)
git commit --no-verify -m "Emergency fix"
```

## Hook Behavior

### ✅ No Drift - Commit Proceeds

```
🔍 Checking for workflow drift...
✅ No drift detected - proceeding with commit
[main abc1234] Update workflow
```

### ❌ Drift Detected - Commit Blocked

```
🔍 Checking for workflow drift...

❌ Commit blocked: Workflow drift detected

Your local workflows differ from production VM.
Run one of these commands to sync:

  1. Export from VM (if VM is newer):
     python commands/sync-n8n-export.py

  2. Deploy to VM (if local is newer):
     python commands/sync-n8n-deploy.py

  3. Check status for details:
     python commands/sync-n8n-status.py

To bypass this check (not recommended):
  git commit --no-verify
```

## Troubleshooting

### Hook not running

```bash
# Check if hook is executable
ls -la .git/hooks/pre-commit

# Make it executable
chmod +x .git/hooks/pre-commit

# Verify hook exists
cat .git/hooks/pre-commit
```

### False positives

If the hook incorrectly detects drift:

1. Run full status check: `python commands/sync-n8n-status.py`
2. Verify .env configuration is correct
3. Check n8n API is accessible

### Disabling temporarily

```bash
# Single commit bypass
git commit --no-verify -m "Message"

# Remove hook entirely (not recommended)
rm .git/hooks/pre-commit

# Reinstall later
bash hooks/install.sh
```

## Development

To modify the hook:

1. Edit `hooks/pre-commit`
2. Test changes: `bash hooks/pre-commit`
3. Reinstall: `bash hooks/install.sh`
4. Commit changes to hooks/ directory

## Why Use Hooks?

**Benefits:**
- Prevents accidental commits with drift
- Maintains consistency between local and production
- Catches sync issues before they reach GitHub
- Forces workflow sync discipline

**When to bypass:**
- Emergency hotfixes
- Intentional local-only changes
- Testing experimental workflows
- Hook malfunction

**Best practice:** Don't bypass unless you have a specific reason.
