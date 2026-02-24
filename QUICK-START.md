# n8n Sync - Quick Start Guide

## Terminal Shortcuts (Bash Aliases)

After reloading your shell (`source ~/.bashrc`), use these commands from anywhere:

### Daily Commands

```bash
n8n-sync        # Full sync (auto-detect, commit, push) - USE THIS MOST
n8n-check       # Just check status (no changes)
n8n-preview     # Preview what would happen (dry-run)
```

### Manual Control

```bash
n8n-pull        # Force pull from VM → local → GitHub
n8n-push        # Force push local → VM (and activate)
```

## VS Code Integration

Press `Ctrl+Shift+B` or `Cmd+Shift+B` to run "n8n: Full Sync"

Or use the Command Palette (`Ctrl+Shift+P`):
- Type "Tasks: Run Task"
- Choose:
  - **n8n: Full Sync** (most common)
  - n8n: Check Status
  - n8n: Preview Sync
  - n8n: Pull from VM
  - n8n: Push to VM

## Typical Daily Workflow

### Morning Routine
```bash
n8n-sync
```
That's it!

### After Editing in n8n UI
```bash
n8n-sync
```

### Before Starting Work
```bash
n8n-check
```

### Preview Before Syncing
```bash
n8n-preview
```

## What Happens Automatically

- ✅ Pre-commit hook prevents commits with drift
- ✅ Backups created before overwriting
- ✅ Auto-detects sync direction
- ✅ Commits and pushes to GitHub
- ✅ Shows clear status messages

## Troubleshooting

**Hook blocks your commit?**
```bash
n8n-sync  # Sync first, then commit again
```

**Want to force a specific direction?**
```bash
n8n-pull  # Force export from VM
n8n-push  # Force deploy to VM
```

**Just want to see what's different?**
```bash
n8n-check
```

---

**That's all you need!** 90% of the time: `n8n-sync`
