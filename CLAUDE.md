# descomplica-workflows — Claude Code Configuration

## Project Overview

This repository contains n8n workflow definitions for Descomplicador.pt client projects. All workflows sync between:
- **Local files** (this repo)
- **GitHub** (version control)
- **Production VM** (n8n instance at hub.descomplicador.pt)

---

## ⚠️ IMPORTANT: n8n Sync Workflow

**WHENEVER discussing anything n8n-related, ALWAYS remind the user of these commands:**

### Quick Commands (Bash Aliases)

```bash
n8n-sync        # Full sync (auto-detect, commit, push) - USE THIS MOST
n8n-check       # Check status only
n8n-preview     # Preview what would happen (dry-run)
n8n-pull        # Force pull from VM
n8n-push        # Force push to VM
```

### Daily Workflow

**After making changes in n8n UI:**
```bash
n8n-sync
```

**Before editing workflows:**
```bash
n8n-check
```

**Preview before syncing:**
```bash
n8n-preview
```

### VS Code Integration

- Press `Ctrl+Shift+B` to run "n8n: Full Sync"
- Or use Command Palette → "Tasks: Run Task"

### Safety Features

- ✅ Pre-commit hook blocks commits with drift
- ✅ Auto-creates backups before overwriting
- ✅ Auto-detects sync direction
- ✅ Shows clear status messages

**See QUICK-START.md for complete guide.**

---

## Project Structure

```
descomplica-workflows/
├── MVP's/                          # Production workflows
│   ├── Assistente de Voz/         # Vapi voice assistants
│   ├── Chatbots/                  # Flowise chatbots
│   ├── Analista de Dados/         # Data analysis workflows
│   └── Gestor Comunicações/       # WhatsApp workflows
├── Ferramentas/                    # Utility workflows
├── Projetos de Clientes/          # Client-specific workflows
├── commands/                       # Sync automation scripts
│   ├── sync-n8n-status.py        # Drift detection
│   ├── sync-n8n-export.py        # Export from VM
│   ├── sync-n8n-deploy.py        # Deploy to VM
│   ├── sync-n8n-full.py          # Full sync orchestrator
│   └── README.md                  # Complete documentation
├── hooks/                          # Git hooks
│   ├── pre-commit                 # Drift prevention hook
│   └── README.md                  # Hook documentation
└── .env                            # API credentials (gitignored)
```

---

## n8n API Configuration

### Environment Variables

Located in `.env` (gitignored):
```
N8N_API_URL=https://hub.descomplicador.pt/api/v1
N8N_API_KEY=<your-api-key>
```

Get API key: n8n Settings → API → Create API Key

### Production VM Access

- **Host:** 34.175.249.49
- **SSH:** `ssh -i ~/.ssh/gcloud-key andrefloresbrasil@34.175.249.49`
- **n8n URL:** https://hub.descomplicador.pt
- **User:** andrefloresbrasil@gmail.com

---

## Language Rules

- **Frontend / client-facing:** European Portuguese (pt-PT) - NEVER Brazilian Portuguese
- **Backend / code:** English (variable names, comments, commit messages)
- **Documentation:** English for technical docs, pt-PT for user-facing content

---

## Workflow Development Guidelines

### When Creating/Editing Workflows

1. **Edit in n8n UI** (most common)
   - Make changes in production n8n
   - Save and test
   - Run `n8n-sync` to pull changes locally

2. **Edit local JSON files** (advanced)
   - Edit workflow JSON directly
   - Run `n8n-push` to deploy to VM
   - Activate workflow if needed

### Workflow Naming Convention

- Use descriptive names in European Portuguese
- Include type prefix: "Assistente de...", "Vapi -...", "Chatbot..."
- Be specific: "Hotel Concierge - flowise" not just "Chatbot"

### Testing Workflows

- Always test in production n8n before syncing
- Use test mode for webhook triggers
- Verify credentials are configured correctly

---

## Git Workflow

### Pre-Commit Hook

The pre-commit hook **automatically blocks commits** if workflows are out of sync with the VM.

**If blocked:**
```bash
n8n-sync  # Sync first
git commit -m "Your message"  # Then commit
```

**Bypass (emergency only):**
```bash
git commit --no-verify -m "Emergency fix"
```

### Commit Messages

Follow conventional commits format:
```
feat: Add new voice assistant workflow
fix: Correct email template in Hotel Concierge
docs: Update workflow documentation
sync: Export latest workflows from VM
```

---

## Common Tasks

### Add New Workflow

1. Create in n8n UI
2. Save and test
3. Run `n8n-sync`
4. Workflow appears in local files automatically

### Update Existing Workflow

1. Edit in n8n UI
2. Save changes
3. Run `n8n-sync`
4. Local files updated + committed + pushed

### Deploy Local Changes

1. Edit workflow JSON locally
2. Run `n8n-push`
3. Verify in n8n UI

### Fix Drift

```bash
n8n-check       # See what's different
n8n-preview     # Preview the sync
n8n-sync        # Execute the sync
```

---

## Troubleshooting

### "Commit blocked: Workflow drift detected"

```bash
n8n-sync  # Sync workflows first
```

### "N8N_API_KEY not found"

```bash
cp .env.example .env
# Edit .env and add your API key
```

### Workflow not syncing

```bash
n8n-check  # Check if it's mapped
# If not in .n8n-workflow-map.json, run:
python commands/sync-n8n-status.py
```

### Want to force a specific direction

```bash
n8n-pull  # Force export from VM
n8n-push  # Force deploy to VM
```

---

## Important Files

- **QUICK-START.md** — Quick reference for sync commands
- **SYNC-IMPLEMENTATION-SUMMARY.md** — Complete implementation details
- **commands/README.md** — Detailed script documentation
- **hooks/README.md** — Git hook documentation
- **.n8n-workflow-map.json** — Workflow name → ID mapping

---

## Security Notes

- Never commit `.env` file (already gitignored)
- Never commit `n8n-automation-key.json` (gitignored)
- API keys stored in environment variables only
- Backup files (*.bak.*) are gitignored
- All credentials managed via n8n's credential system

---

**For complete documentation, see:**
- `QUICK-START.md` — Daily usage
- `commands/README.md` — Script details
- `SYNC-IMPLEMENTATION-SUMMARY.md` — Full implementation story
