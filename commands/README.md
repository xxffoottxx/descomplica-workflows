# n8n Sync Commands

Automation tools for managing n8n workflow synchronization between local files, GitHub, and production VM.

---

## Setup

**1. Configure environment variables**

Copy `.env.example` to `.env` and add your n8n API key:

```bash
cp .env.example .env
# Edit .env and add your API key
```

The `.env` file should contain:
```
N8N_API_URL=https://n8n.descomplicador.pt/api/v1
N8N_API_KEY=your_actual_api_key_here
```

**Get your API key:** n8n Settings → API → Create API Key

⚠️ **Security:** The `.env` file is gitignored and never committed to the repository.

---

## Quick Start

### Check sync status

```bash
python commands/sync-n8n-status.py
```

Shows drift between local files, GitHub, and production VM with color-coded report.

---

## Available Commands

### ✅ sync-n8n-status.py (IMPLEMENTED)

**Status checker** — Detects drift between local, GitHub, and production VM.

**Usage:**
```bash
# Full status report
python commands/sync-n8n-status.py

# Quiet mode (for pre-commit hooks)
python commands/sync-n8n-status.py --quiet

# JSON output
python commands/sync-n8n-status.py --json
```

**What it checks:**
- Local vs VM: Are files different from deployed workflows?
- Local vs GitHub: Are there uncommitted changes?
- Git history: When was each workflow last committed?

**Output example:**
```
✅ Synced (5)
   ✓ Hotel Concierge (last commit: 2 days ago)

❌ Drift detected (15)
   ✗ Sales Assistant (ID: 37)
      → Drift detected (local ≠ VM)
      Local: c81efc2f (last commit: 13 days ago)
      VM:    5cbebaec

📤 Not deployed to VM (25)
   ? Invoice OCR Demo
      → Not found on VM (may need to deploy)
```

**Exit codes:**
- `0` = All synced
- `1` = Drift detected (in `--quiet` mode)

---

### ✅ sync-n8n-export.py (IMPLEMENTED)

**Export workflows** — Pull latest workflow versions from production VM to local files.

**Usage:**
```bash
# Export all workflows (interactive confirmation)
python commands/sync-n8n-export.py

# Auto-confirm all exports
python commands/sync-n8n-export.py --yes

# Preview what would be exported
python commands/sync-n8n-export.py --dry-run

# Force export even with uncommitted changes (dangerous)
python commands/sync-n8n-export.py --force --yes
```

**Safety features:**
- Checks for uncommitted changes (aborts unless `--force`)
- Shows diff preview before exporting
- Requires confirmation (unless `--yes`)
- Creates timestamped backups (`.bak` files)
- Validates JSON before writing

**When to use:**
- VM has newer version (after making changes in n8n UI)
- After other team members deploy to VM
- To recover from local file corruption

---

### ✅ sync-n8n-deploy.py (IMPLEMENTED)

**Deploy workflows** — Push local workflow changes to production VM.

**Usage:**
```bash
# Deploy all workflows (interactive confirmation)
python commands/sync-n8n-deploy.py

# Deploy and activate workflows
python commands/sync-n8n-deploy.py --activate --yes

# Preview what would be deployed
python commands/sync-n8n-deploy.py --dry-run

# Force deploy even if VM is newer (dangerous)
python commands/sync-n8n-deploy.py --force --yes
```

**Safety features:**
- Checks for uncommitted changes (aborts unless `--force`)
- Detects conflicts (VM version newer than local)
- Shows diff preview before deploying
- Requires confirmation (unless `--yes`)
- Validates JSON before uploading

**When to use:**
- After editing workflows locally
- After committing workflow changes to GitHub
- To push configuration updates to production

---

### ✅ sync-n8n-full.py (IMPLEMENTED)

**Full sync orchestrator** — Complete workflow synchronization in one command.

Automatically:
1. Checks drift status
2. Exports from VM or deploys to VM (auto-detected)
3. Commits changes to git
4. Pushes to GitHub

**Usage:**
```bash
# Full auto sync (checks, syncs, commits, pushes)
python commands/sync-n8n-full.py

# Auto-confirm everything
python commands/sync-n8n-full.py --yes

# Preview what would happen
python commands/sync-n8n-full.py --dry-run

# Force export from VM
python commands/sync-n8n-full.py --direction export

# Force deploy to VM and activate workflows
python commands/sync-n8n-full.py --direction deploy --activate

# Sync without git commit/push
python commands/sync-n8n-full.py --skip-git
```

**Direction modes:**
- `auto` (default) — Auto-detects based on local changes
- `export` — Force pull from VM
- `deploy` — Force push to VM

**When to use:**
- Daily workflow sync routine
- After making changes in n8n UI
- After editing workflows locally
- When you want everything synced in one command

---

## Configuration

### Workflow Map

The script creates `.n8n-workflow-map.json` mapping workflow names to IDs:

```json
{
  "Hotel Concierge": "doLSUTaivmnon3YZ4tf75",
  "Sales Assistant": "egu23cPoHpVByWwk",
  "Error Monitor (with Rate Limiting)": "7msWfdcUmBjjvZPCLh4F9"
}
```

This file is auto-generated on first run by fetching all workflows from the n8n API.

### API Configuration

Hardcoded in `sync-n8n-status.py` (lines 34-36):
```python
N8N_API_URL = "https://n8n.descomplicador.pt/api/v1"
N8N_API_KEY = "eyJhbGc..."  # JWT token
```

**Note:** API key should be rotated periodically for security.

### Workflow Directories

Scanned directories (configured in `sync-n8n-status.py` line 37):
```python
WORKFLOW_DIRS = [
    "MVP's",
    "Ferramentas",
    "Projetos de Clientes",
    "Módulos reutilizáveis"
]
```

---

## Typical Workflow

### Daily check for drift

```bash
cd ~/Desktop/Apps/descomplica-workflows
python commands/sync-n8n-status.py
```

### If drift detected

**Option 1: VM has newer changes (pull from production)**
```bash
# Once implemented:
python commands/sync-n8n-export.py
git add .
git commit -m "Export latest workflows from production VM"
git push
```

**Option 2: Local has newer changes (push to production)**
```bash
# Commit local changes first
git add .
git commit -m "Update workflows locally"
git push

# Then deploy to VM (once implemented):
python commands/sync-n8n-deploy.py --activate
```

### Pre-commit hook integration

Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
python commands/sync-n8n-status.py --quiet
if [ $? -ne 0 ]; then
    echo "❌ n8n workflow drift detected!"
    echo "Run: python commands/sync-n8n-export.py"
    echo "Or commit anyway with: git commit --no-verify"
    exit 1
fi
```

---

## Troubleshooting

### Connection errors

**Symptom:** "Connection error: ..."

**Solution:**
- Check VM is accessible: `ping n8n.descomplicador.pt`
- Verify API key is valid (check VM `~/.bashrc`)
- Check firewall isn't blocking HTTPS requests

### Workflow not found on VM

**Symptom:** "Not found on VM (may need to deploy)"

**Causes:**
- Workflow is local-only (development, not deployed)
- Workflow was deleted from VM
- Workflow name mismatch (check `.n8n-workflow-map.json`)

**Solution:**
- Delete `.n8n-workflow-map.json` and re-run to refresh mapping
- Or manually deploy workflow via n8n UI

### UnicodeEncodeError on Windows

**Symptom:** `'charmap' codec can't encode character ...`

**Solution:** Script handles this automatically with UTF-8 encoding wrapper (lines 28-30).

---

## Implementation Status

| Script | Status | Lines | Features |
|--------|--------|-------|----------|
| `sync-n8n-status.py` | ✅ Complete | 390 | Drift detection, git status, color output, quiet mode |
| `sync-n8n-export.py` | ⏳ Planned | - | Pull from VM to local |
| `sync-n8n-deploy.py` | ⏳ Planned | - | Push local to VM |
| `sync-n8n-full.py` | ⏳ Planned | - | Full sync orchestration |
| `sync-n8n-normalize.py` | ⏳ Planned | - | JSON normalizer |

---

## Technical Details

### Hash Comparison

Workflows are compared using MD5 hashes of essential fields only:
- `name`
- `nodes`
- `connections`
- `settings`

This ignores metadata like `id`, `createdAt`, `updatedAt` which change automatically.

### Git Integration

Uses `git` commands to check:
- `git ls-files --error-unmatch` — is file tracked?
- `git status --porcelain` — uncommitted changes?
- `git log -1 --format=%ar` — last commit date

### n8n API Integration

Fetches workflows via:
```
GET https://n8n.descomplicador.pt/api/v1/workflows
GET https://n8n.descomplicador.pt/api/v1/workflows/{id}
```

With header: `X-N8N-API-KEY: {jwt_token}`

---

## Maintenance

**Weekly:**
- Run `sync-n8n-status.py` to catch drift early

**Monthly:**
- Review `.n8n-workflow-map.json` for accuracy
- Delete orphaned local workflow files
- Rotate n8n API key

**After major changes:**
- Delete `.n8n-workflow-map.json` to force refresh
- Re-run `sync-n8n-status.py` to rebuild mapping

---

**Last updated:** 2026-02-24
**Implemented by:** Claude Opus 4.6
