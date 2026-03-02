# n8n Workflow Sync — 3-Way Sync Automation

## Purpose

Automates the critical **3-way sync workflow** identified in CLAUDE.md:
```
local files → GitHub → production VM
```

Prevents drift between your local n8n workflow JSON files, the GitHub repository, and the deployed workflows on the production VM (`hub.descomplicador.pt`).

---

## Prerequisites

1. **SSH access to VM configured:**
   ```bash
   ssh -i "C:\Users\andre\.ssh\gcloud-key" andrefloresbrasil@34.175.249.49
   ```

2. **n8n API key available** (stored in `~/.bashrc` on the VM):
   ```bash
   ssh -i "C:\Users\andre\.ssh\gcloud-key" andrefloresbrasil@34.175.249.49 'echo $N8N_API_KEY'
   ```

3. **Local workflow JSON files** in `descomplica-workflows/` directory

4. **Git repository initialized** and connected to GitHub remote

---

## How to Use

### Option 1: Quick Status Check
Shows which workflows have drifted between local, GitHub, and production VM.

```bash
# From descomplica-workflows/ directory
python ../commands/sync-n8n-status.py
```

**Output:**
```
Workflow Sync Status Report
============================

✅ Hotel Concierge (ID: 42)
   Local:  ✅ Up to date
   GitHub: ✅ Up to date (committed 2 days ago)
   VM:     ✅ Up to date (deployed)

⚠️  Sales Assistant (ID: 37)
   Local:  ✅ Modified (newer than GitHub)
   GitHub: ❌ Behind local (last commit 5 days ago)
   VM:     ✅ Up to date with GitHub

❌ WhatsApp Auto-Reply (ID: 53)
   Local:  ✅ Up to date
   GitHub: ✅ Up to date
   VM:     ❌ DRIFT DETECTED (different version deployed)
```

### Option 2: Full Sync (Local → GitHub → VM)
Syncs everything in one command.

```bash
# From descomplica-workflows/ directory
python ../commands/sync-n8n-full.py --push
```

**What it does:**
1. Exports latest workflow JSON from n8n API → local files
2. Git adds + commits changes with descriptive message
3. Pushes to GitHub
4. Deploys updated workflows back to VM via n8n API
5. Verifies all workflows are active and running

**Flags:**
- `--push` — Actually push to GitHub (omit for dry-run)
- `--export-only` — Just export from VM to local, don't deploy back
- `--skip-github` — Sync local ↔ VM only, skip GitHub push

### Option 3: Export from VM
Pull latest production workflows to local without deploying changes.

```bash
python ../commands/sync-n8n-export.py
```

Use this when:
- You made changes directly in the n8n UI
- You want to snapshot current production state
- You're debugging and want to compare local vs production

### Option 4: Deploy to VM
Push local changes to production VM.

```bash
python ../commands/sync-n8n-deploy.py workflow-id-1 workflow-id-2 --activate
```

**Flags:**
- `--activate` — Activate workflows after upload
- `--dry-run` — Show what would be deployed without actually doing it
- Specify workflow IDs to deploy specific workflows, or omit to deploy all

---

## Workflow ID Mapping

Each n8n workflow has a numeric ID. The sync scripts maintain a mapping file:

**Location:** `descomplica-workflows/.n8n-workflow-map.json`

```json
{
  "Hotel Concierge.json": 42,
  "Sales Assistant.json": 37,
  "WhatsApp Auto-Reply.json": 53,
  "Invoice Branding Service.json": 61
}
```

This file is auto-generated and should be committed to Git.

---

## Pre-Commit Hook Integration

Add this to `.git/hooks/pre-commit` to automatically check for drift before commits:

```bash
#!/bin/bash
# Check for n8n workflow drift before allowing commit

if [ -d "descomplica-workflows" ]; then
    cd descomplica-workflows
    python ../commands/sync-n8n-status.py --quiet

    if [ $? -ne 0 ]; then
        echo "❌ n8n workflow drift detected!"
        echo "Run: python ../commands/sync-n8n-export.py"
        echo "Or commit anyway with: git commit --no-verify"
        exit 1
    fi
fi
```

---

## n8n API Reference

### Get Workflow by ID
```bash
curl -X GET https://hub.descomplicador.pt/api/v1/workflows/42 \
  -H "X-N8N-API-KEY: $N8N_API_KEY"
```

### Update Workflow
```bash
curl -X PUT https://hub.descomplicador.pt/api/v1/workflows/42 \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hotel Concierge",
    "nodes": [...],
    "connections": {...},
    "settings": {...}
  }'
```

**IMPORTANT:** Only include `name`, `nodes`, `connections`, `settings` in the body. Extra fields will cause API rejection.

### Activate Workflow
```bash
curl -X POST https://hub.descomplicador.pt/api/v1/workflows/42/activate \
  -H "X-N8N-API-KEY: $N8N_API_KEY"
```

### List All Workflows
```bash
curl -X GET https://hub.descomplicador.pt/api/v1/workflows \
  -H "X-N8N-API-KEY: $N8N_API_KEY"
```

---

## PostgreSQL Direct Access (Emergency Use Only)

If a workflow is archived and the API can't unarchive it, use direct PostgreSQL:

```bash
# SSH into VM
ssh -i "C:\Users\andre\.ssh\gcloud-key" andrefloresbrasil@34.175.249.49

# Connect to n8n database
docker exec -it n8n_postgres psql -U xxffoott -d n8n

# Unarchive workflow
UPDATE workflow_entity SET "isArchived" = false WHERE id = '42';
\q
```

**Credentials:**
- User: `xxffoott`
- Password: `E5D4N13a1.`
- Database: `n8n`

---

## Troubleshooting

### Workflow Upload Fails with 400 Bad Request
**Problem:** Extra fields in JSON payload (e.g., `id`, `createdAt`, `updatedAt`)

**Fix:**
```bash
# Use the sync script to strip invalid fields automatically
python ../commands/sync-n8n-deploy.py 42 --strip-metadata
```

### API Key Not Found
**Problem:** `$N8N_API_KEY` environment variable not set

**Fix:**
```bash
# Retrieve from VM
N8N_API_KEY=$(ssh -i "C:\Users\andre\.ssh\gcloud-key" andrefloresbrasil@34.175.249.49 'echo $N8N_API_KEY')

# Or set manually (get key from VM ~/.bashrc)
export N8N_API_KEY="your-api-key-here"
```

### Workflow is Archived
**Problem:** Cannot activate or update archived workflows via API

**Fix:** Use PostgreSQL direct access (see above) to set `isArchived = false`

### Drift Detected but Files Look Identical
**Problem:** Workflow JSON has differences in whitespace, field ordering, or metadata

**Fix:**
```bash
# Normalize JSON formatting
python ../commands/sync-n8n-normalize.py workflow-file.json
```

---

## Best Practices

1. **Always export before editing locally** — ensures you start with current production state
2. **Test in n8n UI first** — make changes in the UI, test thoroughly, then export
3. **Commit frequently** — small, atomic commits make drift easier to resolve
4. **Run status check daily** — catch drift early before it accumulates
5. **Use descriptive commit messages** — include workflow names and what changed:
   ```
   Update Hotel Concierge workflow: Add breakfast time validation

   - Added IF node to check booking time
   - Updated error message formatting
   - Deployed to production VM
   ```

---

## Maintenance Schedule

- **Daily:** Run `sync-n8n-status.py` to check for drift
- **Weekly:** Full export from VM to capture UI-only changes
- **Monthly:** Audit `.n8n-workflow-map.json` for accuracy

---

## Script Implementation Status

**✅ Implemented:**
- None yet (this is the design spec)

**📋 To Implement:**
1. `sync-n8n-status.py` — Status checker
2. `sync-n8n-export.py` — Export from VM to local
3. `sync-n8n-deploy.py` — Deploy local to VM
4. `sync-n8n-full.py` — Full 3-way sync orchestrator
5. `sync-n8n-normalize.py` — JSON normalizer for drift comparison

**Priority:** Implement #1 (status checker) first for immediate value.

---

## Quick Reference Commands

```bash
# Check sync status
python ../commands/sync-n8n-status.py

# Export all workflows from VM
python ../commands/sync-n8n-export.py

# Deploy specific workflow to VM
python ../commands/sync-n8n-deploy.py 42 --activate

# Full sync: local → GitHub → VM
python ../commands/sync-n8n-full.py --push

# Normalize workflow JSON
python ../commands/sync-n8n-normalize.py workflow.json

# Get n8n API key from VM
ssh -i "C:\Users\andre\.ssh\gcloud-key" andrefloresbrasil@34.175.249.49 'echo $N8N_API_KEY'
```

---

**Last updated:** 2026-02-24
**Next steps:** Implement `sync-n8n-status.py` as MVP script
