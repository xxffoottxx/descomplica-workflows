#!/usr/bin/env python3
"""
sync-n8n-deploy.py — Deploy local n8n workflows to production VM

Pushes local workflow JSON files to the n8n instance running on the VM.
This is the reverse operation of sync-n8n-export.py (local → VM instead of VM → local).

Usage:
    python sync-n8n-deploy.py [--activate] [--yes] [--force] [--dry-run] [--quiet]

Options:
    --activate    Activate workflows after deployment
    --yes         Auto-confirm all deployments (skip confirmation prompts)
    --force       Deploy even if VM version is newer (dangerous)
    --dry-run     Preview what would be deployed without making changes
    --quiet       Suppress progress output

Safety Features:
    - Checks for uncommitted local changes (aborts unless --force)
    - Compares local vs VM to detect conflicts (newer VM version)
    - Shows diff preview of changes being deployed
    - Requires user confirmation before deploying (unless --yes)
    - Validates JSON before uploading
    - Optionally activates workflows after deployment

Requirements:
    - .n8n-workflow-map.json must exist (run sync-n8n-status.py first)
    - n8n API must be accessible at https://n8n.descomplicador.pt

Examples:
    # Preview what would be deployed
    python sync-n8n-deploy.py --dry-run

    # Deploy all workflows with drift (interactive)
    python sync-n8n-deploy.py

    # Deploy and activate workflows (auto-confirm)
    python sync-n8n-deploy.py --activate --yes

    # Force deploy even if VM is newer (dangerous)
    python sync-n8n-deploy.py --force --yes
"""

import os
import sys
import json
import hashlib
import requests
import subprocess
from pathlib import Path
from datetime import datetime
import io

# Windows UTF-8 console fix
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# ANSI color codes
RESET = "\033[0m"
BOLD = "\033[1m"
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
CYAN = "\033[36m"
GRAY = "\033[90m"

# n8n API configuration
N8N_BASE_URL = "https://n8n.descomplicador.pt/api/v1"
N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZDQwYWYwYS1kZWEwLTQ5MzYtYmNkNC1lMTUxYzlkOGZjOGIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzcwNjgxNTU4fQ.5DjZY1bGwJOd-TnPl54ICAzOlvU0p_NwfSngsLEjVTM"

# Project root
PROJECT_ROOT = Path(__file__).parent.parent.absolute()
WORKFLOW_MAP_FILE = PROJECT_ROOT / ".n8n-workflow-map.json"


def get_json_hash(data: dict) -> str:
    """Calculate MD5 hash of essential workflow fields."""
    essential = {
        'name': data.get('name', ''),
        'nodes': data.get('nodes', []),
        'connections': data.get('connections', {}),
        'settings': data.get('settings', {})
    }
    json_str = json.dumps(essential, sort_keys=True, separators=(',', ':'))
    return hashlib.md5(json_str.encode()).hexdigest()


def fetch_workflow_from_vm(workflow_id: str) -> dict:
    """Fetch workflow from n8n API."""
    url = f"{N8N_BASE_URL}/workflows/{workflow_id}"
    headers = {"X-N8N-API-KEY": N8N_API_KEY}

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to fetch workflow from VM: {e}")


def deploy_workflow_to_vm(workflow_id: str, workflow_data: dict) -> dict:
    """Deploy workflow to n8n API via PUT."""
    url = f"{N8N_BASE_URL}/workflows/{workflow_id}"
    headers = {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json"
    }

    # Extract only the fields n8n API accepts
    payload = {
        'name': workflow_data.get('name'),
        'nodes': workflow_data.get('nodes'),
        'connections': workflow_data.get('connections'),
        'settings': workflow_data.get('settings', {})
    }

    try:
        response = requests.put(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to deploy workflow to VM: {e}")


def activate_workflow(workflow_id: str) -> bool:
    """Activate a workflow via n8n API."""
    url = f"{N8N_BASE_URL}/workflows/{workflow_id}/activate"
    headers = {"X-N8N-API-KEY": N8N_API_KEY}

    try:
        response = requests.post(url, headers=headers, timeout=10)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException:
        return False


def get_git_status(file_path: Path) -> dict:
    """Check git status for a file."""
    try:
        # Check if file has uncommitted changes
        result = subprocess.run(
            ['git', 'status', '--porcelain', str(file_path)],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=5
        )
        has_changes = bool(result.stdout.strip())

        return {
            'has_uncommitted': has_changes,
            'status_code': result.stdout[:2] if result.stdout else '  '
        }
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError):
        return {'has_uncommitted': False, 'status_code': '??'}


def confirm_action(prompt: str, default_yes: bool = False) -> bool:
    """Ask user for confirmation."""
    suffix = " [Y/n]: " if default_yes else " [y/N]: "
    response = input(f"{YELLOW}{prompt}{suffix}{RESET}").strip().lower()

    if not response:
        return default_yes
    return response in ['y', 'yes']


def show_diff_summary(local_data: dict, vm_data: dict) -> None:
    """Display summary of changes being deployed."""
    local_nodes = {n['id']: n for n in local_data.get('nodes', [])}
    vm_nodes = {n['id']: n for n in vm_data.get('nodes', [])}

    added = set(local_nodes.keys()) - set(vm_nodes.keys())
    removed = set(vm_nodes.keys()) - set(local_nodes.keys())

    # Check for modified nodes
    modified = []
    for node_id in set(local_nodes.keys()) & set(vm_nodes.keys()):
        if json.dumps(local_nodes[node_id], sort_keys=True) != json.dumps(vm_nodes[node_id], sort_keys=True):
            modified.append(node_id)

    print(f"\n{CYAN}Changes to be deployed:{RESET}")
    if added:
        print(f"{GREEN}  + {len(added)} nodes added{RESET}")
    if removed:
        print(f"{RED}  - {len(removed)} nodes removed{RESET}")
    if modified:
        print(f"{YELLOW}  ~ {len(modified)} nodes modified{RESET}")
    if not (added or removed or modified):
        print(f"{GRAY}  (no node-level changes detected){RESET}")


def deploy_workflow(workflow_id: str, workflow_name: str, local_file: Path,
                   dry_run: bool = False, force: bool = False, auto_yes: bool = False,
                   activate: bool = False, quiet: bool = False) -> tuple[bool, str]:
    """Deploy a single workflow to VM."""

    # Load local file
    try:
        with open(local_file, 'r', encoding='utf-8') as f:
            local_data = json.load(f)
    except Exception as e:
        return False, f"Failed to read local file: {e}"

    # Validate local JSON
    if not all(k in local_data for k in ['name', 'nodes', 'connections']):
        return False, "Invalid workflow JSON (missing required fields)"

    # Check git status
    git_status = get_git_status(local_file)
    has_uncommitted = git_status['has_uncommitted']

    if has_uncommitted and not force:
        return False, f"Local file has uncommitted changes ({git_status['status_code']}). Commit first or use --force"

    # Fetch current VM version
    try:
        vm_data = fetch_workflow_from_vm(workflow_id)
    except Exception as e:
        return False, f"Failed to fetch VM version: {e}"

    # Calculate hashes
    local_hash = get_json_hash(local_data)
    vm_hash = get_json_hash(vm_data)

    # Check if already synced
    if local_hash == vm_hash:
        return True, "Already synced (skipped)"

    # Check if VM is newer (conflict)
    if not force:
        local_updated = local_data.get('updatedAt', '')
        vm_updated = vm_data.get('updatedAt', '')

        if vm_updated > local_updated:
            return False, f"VM version is newer ({vm_updated} > {local_updated}). Use --force to overwrite or run sync-n8n-export.py first"

    # Show diff preview
    if not quiet:
        print(f"\n{BOLD}{workflow_name}{RESET}")
        print(f"{GRAY}Local:  {local_hash[:8]}  ({local_file.name}){RESET}")
        print(f"{GRAY}VM:     {vm_hash[:8]}  (production){RESET}")
        show_diff_summary(local_data, vm_data)

    # Confirm deployment
    if not auto_yes and not quiet:
        if not confirm_action(f"Deploy '{workflow_name}' to VM?", default_yes=True):
            return True, "Skipped by user"

    # Dry run: stop here
    if dry_run:
        return True, "Would deploy (dry-run)"

    # Deploy to VM
    try:
        deploy_workflow_to_vm(workflow_id, local_data)
    except Exception as e:
        return False, f"Deployment failed: {e}"

    # Activate if requested
    activation_msg = ""
    if activate:
        if activate_workflow(workflow_id):
            activation_msg = " (activated)"
        else:
            activation_msg = " (failed to activate)"

    return True, f"Deployed successfully{activation_msg}"


def load_workflow_map() -> dict:
    """Load workflow name → ID mapping."""
    if not WORKFLOW_MAP_FILE.exists():
        print(f"{RED}✗ Error: {WORKFLOW_MAP_FILE} not found{RESET}")
        print(f"{YELLOW}Run sync-n8n-status.py first to generate the workflow map.{RESET}")
        sys.exit(1)

    with open(WORKFLOW_MAP_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def find_local_workflows() -> list[tuple[str, Path]]:
    """Find all local workflow JSON files."""
    workflows = []

    for json_file in PROJECT_ROOT.rglob("*.json"):
        # Skip non-workflow files
        if json_file.name in ['.n8n-workflow-map.json', 'package.json', 'package-lock.json']:
            continue
        if '.bak.' in json_file.name:
            continue
        if 'node_modules' in json_file.parts:
            continue

        # Try to parse as workflow
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            if 'nodes' in data and 'connections' in data and 'name' in data:
                workflow_name = data['name']
                workflows.append((workflow_name, json_file))
        except (json.JSONDecodeError, KeyError):
            continue

    return workflows


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='Deploy local n8n workflows to production VM',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument('--activate', action='store_true', help='Activate workflows after deployment')
    parser.add_argument('--yes', action='store_true', help='Auto-confirm all deployments')
    parser.add_argument('--force', action='store_true', help='Deploy even if VM version is newer')
    parser.add_argument('--dry-run', action='store_true', help='Preview without deploying')
    parser.add_argument('--quiet', action='store_true', help='Suppress progress output')

    args = parser.parse_args()

    # Header
    if not args.quiet:
        print(f"\n{BOLD}{BLUE}n8n Workflow Deployment{RESET}")
        print(f"{GRAY}{'=' * 60}{RESET}\n")

        if args.dry_run:
            print(f"{YELLOW}[DRY RUN MODE]{RESET}\n")

    # Load workflow map
    workflow_map = load_workflow_map()

    # Find local workflows
    local_workflows = find_local_workflows()

    if not local_workflows:
        print(f"{RED}✗ No workflows found in local directory{RESET}")
        sys.exit(1)

    # Deploy workflows
    total = 0
    deployed = 0
    skipped = 0
    errors = 0

    for workflow_name, local_file in sorted(local_workflows, key=lambda x: x[0]):
        # Check if workflow exists on VM
        if workflow_name not in workflow_map:
            if not args.quiet:
                print(f"{GRAY}⊘ {workflow_name} — not deployed to VM (local-only){RESET}")
            skipped += 1
            continue

        workflow_id = workflow_map[workflow_name]
        total += 1

        # Deploy
        success, message = deploy_workflow(
            workflow_id, workflow_name, local_file,
            dry_run=args.dry_run,
            force=args.force,
            auto_yes=args.yes,
            activate=args.activate,
            quiet=args.quiet
        )

        # Report result
        if success:
            if "skipped" in message.lower():
                if not args.quiet:
                    print(f"{GRAY}⊙ {workflow_name} — {message}{RESET}")
                skipped += 1
            else:
                if not args.quiet:
                    print(f"{GREEN}✓ {workflow_name} — {message}{RESET}")
                deployed += 1
        else:
            print(f"{RED}✗ {workflow_name} — {message}{RESET}")
            errors += 1

    # Summary
    if not args.quiet:
        print(f"\n{GRAY}{'=' * 60}{RESET}")
        print(f"{BOLD}Summary:{RESET}")
        print(f"  Total workflows checked: {total}")
        print(f"  {GREEN}Deployed: {deployed}{RESET}")
        print(f"  {GRAY}Skipped: {skipped}{RESET}")
        if errors > 0:
            print(f"  {RED}Errors: {errors}{RESET}")
        print()

    # Exit code
    sys.exit(1 if errors > 0 else 0)


if __name__ == '__main__':
    main()
