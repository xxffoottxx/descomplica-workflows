#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
sync-n8n-export.py — Export n8n workflows from VM to local files

Pulls the latest workflow versions from production VM and updates local JSON files.
Includes safety checks to prevent accidental data loss.

Usage:
    python commands/sync-n8n-export.py [OPTIONS] [WORKFLOW_IDS...]

Options:
    --yes           Auto-confirm all overwrites (skip confirmation prompts)
    --force         Overwrite even if local has uncommitted changes (dangerous!)
    --dry-run       Show what would be exported without making changes
    --quiet         Suppress progress output
    --no-backup     Don't create .bak files before overwriting

Examples:
    python commands/sync-n8n-export.py                    # Interactive mode
    python commands/sync-n8n-export.py --dry-run          # Preview changes
    python commands/sync-n8n-export.py 42 37              # Export specific workflows
    python commands/sync-n8n-export.py --yes              # Auto-confirm all
"""

import json
import os
import sys
import shutil
import hashlib
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import urllib.request
import urllib.error
from datetime import datetime
import io

# Force UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# ANSI color codes
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

# Load environment variables from .env file
def load_env():
    """Load environment variables from .env file in project root."""
    env_file = Path(__file__).parent.parent / '.env'
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ.setdefault(key.strip(), value.strip())

load_env()

# Configuration
N8N_API_URL = os.getenv('N8N_API_URL', 'https://hub.descomplicador.pt/api/v1')
N8N_API_KEY = os.getenv('N8N_API_KEY')

if not N8N_API_KEY:
    print(f"{Colors.RED}✗ Error: N8N_API_KEY not found in environment or .env file{Colors.RESET}", file=sys.stderr)
    sys.exit(1)

WORKFLOW_MAP_FILE = ".n8n-workflow-map.json"


def get_json_hash(data: dict) -> str:
    """Get deterministic hash of JSON data (ignoring field order)."""
    essential = {
        'name': data.get('name', ''),
        'nodes': data.get('nodes', []),
        'connections': data.get('connections', {}),
        'settings': data.get('settings', {})
    }
    json_str = json.dumps(essential, sort_keys=True, separators=(',', ':'))
    return hashlib.md5(json_str.encode()).hexdigest()


def call_n8n_api(endpoint: str, method: str = "GET") -> Optional[dict]:
    """Call n8n API and return JSON response."""
    url = f"{N8N_API_URL}/{endpoint}"
    req = urllib.request.Request(url, method=method)
    req.add_header("X-N8N-API-KEY", N8N_API_KEY)
    req.add_header("Accept", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        print(f"{Colors.RED}API Error {e.code}: {e.reason}{Colors.RESET}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"{Colors.RED}Connection error: {e}{Colors.RESET}", file=sys.stderr)
        return None


def load_workflow_map() -> Dict[str, str]:
    """Load workflow name -> ID mapping."""
    map_file = Path(WORKFLOW_MAP_FILE)
    if not map_file.exists():
        print(f"{Colors.RED}Error: {WORKFLOW_MAP_FILE} not found{Colors.RESET}")
        print(f"Run sync-n8n-status.py first to generate the workflow map")
        sys.exit(1)

    with open(map_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_git_status(file_path: Path) -> Tuple[bool, Optional[str], Optional[str]]:
    """Check if file has uncommitted changes, last commit date, and committed hash."""
    try:
        # Check if file is tracked
        result = subprocess.run(
            ['git', 'ls-files', '--error-unmatch', str(file_path)],
            capture_output=True,
            text=True,
            cwd=file_path.parent
        )

        if result.returncode != 0:
            return False, None, None

        # Check for uncommitted changes
        result = subprocess.run(
            ['git', 'status', '--porcelain', str(file_path)],
            capture_output=True,
            text=True,
            cwd=file_path.parent
        )
        has_changes = bool(result.stdout.strip())

        # Get last commit date
        result = subprocess.run(
            ['git', 'log', '-1', '--format=%ar', '--', str(file_path)],
            capture_output=True,
            text=True,
            cwd=file_path.parent
        )
        last_commit = result.stdout.strip() if result.stdout else None

        # Get committed version hash (what's in Git HEAD)
        result = subprocess.run(
            ['git', 'show', f'HEAD:{file_path}'],
            capture_output=True,
            text=True,
            cwd=file_path.parent
        )

        if result.returncode == 0:
            try:
                committed_data = json.loads(result.stdout)
                committed_hash = get_json_hash(committed_data)
            except:
                committed_hash = None
        else:
            committed_hash = None

        return has_changes, last_commit, committed_hash
    except Exception:
        return False, None, None


def find_workflow_file(workflow_name: str) -> Optional[Path]:
    """Find local JSON file for a workflow by name."""
    base_path = Path.cwd()
    search_dirs = ["MVP's", "Ferramentas", "Projetos de Clientes", "Módulos reutilizáveis"]

    for dir_name in search_dirs:
        dir_path = base_path / dir_name
        if not dir_path.exists():
            continue

        # Search recursively for matching JSON files
        for json_file in dir_path.rglob("*.json"):
            if 'node_modules' in str(json_file) or '.claude' in str(json_file):
                continue

            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if data.get('name') == workflow_name:
                        return json_file
            except:
                continue

    return None


def create_backup(file_path: Path) -> Path:
    """Create timestamped backup of file."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = file_path.with_suffix(f'.json.bak.{timestamp}')
    shutil.copy2(file_path, backup_path)
    return backup_path


def show_diff_summary(local_data: dict, vm_data: dict) -> List[str]:
    """Show summary of changes between local and VM versions."""
    changes = []

    # Compare nodes
    local_nodes = {n['id']: n for n in local_data.get('nodes', [])}
    vm_nodes = {n['id']: n for n in vm_data.get('nodes', [])}

    # Added nodes
    added = set(vm_nodes.keys()) - set(local_nodes.keys())
    for node_id in added:
        node_name = vm_nodes[node_id].get('name', node_id)
        changes.append(f"{Colors.GREEN}  + Added node: {node_name}{Colors.RESET}")

    # Removed nodes
    removed = set(local_nodes.keys()) - set(vm_nodes.keys())
    for node_id in removed:
        node_name = local_nodes[node_id].get('name', node_id)
        changes.append(f"{Colors.RED}  - Removed node: {node_name}{Colors.RESET}")

    # Modified nodes
    for node_id in set(local_nodes.keys()) & set(vm_nodes.keys()):
        local_hash = hashlib.md5(json.dumps(local_nodes[node_id], sort_keys=True).encode()).hexdigest()
        vm_hash = hashlib.md5(json.dumps(vm_nodes[node_id], sort_keys=True).encode()).hexdigest()

        if local_hash != vm_hash:
            node_name = vm_nodes[node_id].get('name', node_id)
            changes.append(f"{Colors.YELLOW}  ~ Modified node: {node_name}{Colors.RESET}")

    if not changes:
        changes.append(f"{Colors.CYAN}  (Metadata or settings changed){Colors.RESET}")

    return changes


def confirm_action(prompt: str, default_yes: bool = False) -> bool:
    """Ask user for confirmation."""
    options = "[Y/n]" if default_yes else "[y/N]"
    response = input(f"{prompt} {options}: ").strip().lower()

    if default_yes:
        return response != 'n'
    else:
        return response == 'y'


def export_workflow(
    workflow_id: str,
    workflow_name: str,
    dry_run: bool = False,
    force: bool = False,
    auto_yes: bool = False,
    create_backup_file: bool = True,
    quiet: bool = False
) -> Tuple[bool, str]:
    """
    Export a single workflow from VM to local file.

    Returns:
        (success: bool, message: str)
    """
    # Fetch workflow from VM
    vm_workflow = call_n8n_api(f"workflows/{workflow_id}")
    if not vm_workflow:
        return False, "Failed to fetch from VM API"

    # Find local file
    local_file = find_workflow_file(workflow_name)
    if not local_file:
        return False, f"Local file not found for workflow '{workflow_name}'"

    # Read local file
    try:
        with open(local_file, 'r', encoding='utf-8') as f:
            local_data = json.load(f)
    except Exception as e:
        return False, f"Failed to read local file: {e}"

    # Compare hashes
    local_hash = get_json_hash(local_data)
    vm_hash = get_json_hash(vm_workflow)

    if local_hash == vm_hash:
        return True, "Already in sync (skipped)"

    # Check git status
    has_uncommitted, last_commit, committed_hash = get_git_status(local_file)

    # Safety check: uncommitted changes
    if has_uncommitted and not force:
        return False, f"{Colors.RED}Local file has uncommitted changes. Use --force to overwrite{Colors.RESET}"

    # Safety check: local is ahead of committed version (user made local edits)
    if committed_hash and local_hash != committed_hash and not has_uncommitted:
        # This means local file differs from Git HEAD but Git shows no changes
        # (shouldn't happen, but check anyway)
        return False, f"{Colors.RED}Local file state inconsistent. Manual review needed{Colors.RESET}"

    if not quiet:
        print(f"\n{Colors.BOLD}Workflow: {workflow_name}{Colors.RESET}")
        print(f"  File:   {local_file}")
        print(f"  Local:  {local_hash[:8]} {f'(committed {last_commit})' if last_commit else ''}")
        print(f"  VM:     {vm_hash[:8]} (production version)")
        if has_uncommitted:
            print(f"  {Colors.YELLOW}⚠️  Has uncommitted changes{Colors.RESET}")

        print(f"\n{Colors.CYAN}Changes from VM:{Colors.RESET}")
        changes = show_diff_summary(local_data, vm_workflow)
        for change in changes[:10]:  # Limit to 10 changes
            print(change)
        if len(changes) > 10:
            print(f"{Colors.CYAN}  ... and {len(changes) - 10} more changes{Colors.RESET}")

    if dry_run:
        return True, "Would export (dry-run)"

    # Confirm action
    if not auto_yes and not quiet:
        if not confirm_action(f"\n{Colors.BOLD}Export from VM?{Colors.RESET}", default_yes=True):
            return True, "Skipped by user"

    # Create backup
    if create_backup_file:
        try:
            backup_path = create_backup(local_file)
            if not quiet:
                print(f"{Colors.GREEN}✓ Backup created: {backup_path.name}{Colors.RESET}")
        except Exception as e:
            return False, f"Failed to create backup: {e}"

    # Write VM data to local file (preserving formatting)
    try:
        with open(local_file, 'w', encoding='utf-8') as f:
            json.dump(vm_workflow, f, indent=2, ensure_ascii=False)
            f.write('\n')  # Add trailing newline

        return True, f"{Colors.GREEN}✓ Exported from VM{Colors.RESET}"
    except Exception as e:
        return False, f"Failed to write file: {e}"


def main():
    """Main entry point."""
    # Parse arguments
    args = sys.argv[1:]

    dry_run = '--dry-run' in args
    force = '--force' in args
    auto_yes = '--yes' in args
    quiet = '--quiet' in args
    no_backup = '--no-backup' in args

    # Filter out flags to get workflow IDs
    workflow_ids = [arg for arg in args if not arg.startswith('--')]

    # Change to script directory
    os.chdir(Path(__file__).parent.parent)

    # Load workflow map
    workflow_map = load_workflow_map()

    # Reverse map (ID -> name)
    id_to_name = {v: k for k, v in workflow_map.items()}

    # Determine which workflows to export
    if workflow_ids:
        # Export specific workflows
        workflows_to_export = []
        for wf_id in workflow_ids:
            if wf_id in id_to_name:
                workflows_to_export.append((wf_id, id_to_name[wf_id]))
            else:
                print(f"{Colors.YELLOW}Warning: Workflow ID {wf_id} not found in map{Colors.RESET}")
    else:
        # Export all workflows (that need it)
        # Run status check to find workflows with drift
        workflows_to_export = []

        for name, wf_id in workflow_map.items():
            local_file = find_workflow_file(name)
            if not local_file:
                continue

            try:
                with open(local_file, 'r', encoding='utf-8') as f:
                    local_data = json.load(f)
            except:
                continue

            vm_workflow = call_n8n_api(f"workflows/{wf_id}")
            if not vm_workflow:
                continue

            local_hash = get_json_hash(local_data)
            vm_hash = get_json_hash(vm_workflow)

            if local_hash != vm_hash:
                workflows_to_export.append((wf_id, name))

    if not workflows_to_export:
        print(f"{Colors.GREEN}✓ All workflows are already in sync!{Colors.RESET}")
        sys.exit(0)

    # Print header
    if not quiet:
        print()
        print(f"{Colors.BOLD}{'='*70}{Colors.RESET}")
        print(f"{Colors.BOLD}n8n Workflow Export from VM{Colors.RESET}")
        print(f"{Colors.BOLD}{'='*70}{Colors.RESET}")

        if dry_run:
            print(f"{Colors.CYAN}[DRY RUN MODE - No changes will be made]{Colors.RESET}")
        if force:
            print(f"{Colors.YELLOW}[FORCE MODE - Will overwrite uncommitted changes]{Colors.RESET}")
        if auto_yes:
            print(f"{Colors.YELLOW}[AUTO-CONFIRM MODE - No prompts]{Colors.RESET}")

        print(f"\nExporting {len(workflows_to_export)} workflow(s)...\n")

    # Export workflows
    results = []
    for wf_id, wf_name in workflows_to_export:
        if not quiet:
            print(f"{Colors.CYAN}Processing: {wf_name}...{Colors.RESET}")

        success, message = export_workflow(
            wf_id,
            wf_name,
            dry_run=dry_run,
            force=force,
            auto_yes=auto_yes,
            create_backup_file=not no_backup,
            quiet=quiet
        )

        results.append((wf_name, success, message))

        if not quiet:
            if success:
                print(f"  {message}\n")
            else:
                print(f"  {Colors.RED}✗ {message}{Colors.RESET}\n")

    # Print summary
    if not quiet:
        print(f"{Colors.BOLD}{'='*70}{Colors.RESET}")

        successful = sum(1 for _, s, _ in results if s)
        failed = len(results) - successful

        if dry_run:
            print(f"{Colors.CYAN}Dry run complete: {successful} workflows would be exported{Colors.RESET}")
        else:
            print(f"{Colors.GREEN}✓ Exported: {successful}{Colors.RESET}")
            if failed > 0:
                print(f"{Colors.RED}✗ Failed: {failed}{Colors.RESET}")
                print(f"\nFailed workflows:")
                for name, success, message in results:
                    if not success:
                        print(f"  • {name}: {message}")

        print(f"{Colors.BOLD}{'='*70}{Colors.RESET}")

        if successful > 0 and not dry_run:
            print(f"\n{Colors.YELLOW}Next steps:{Colors.RESET}")
            print("  git status                    # Review changes")
            print("  git diff                      # See what changed")
            print("  git add .                     # Stage changes")
            print("  git commit -m 'Export latest workflows from production VM'")
            print("  git push                      # Sync to GitHub")
            print()

    # Exit with error code if any failed
    sys.exit(1 if any(not s for _, s, _ in results) else 0)


if __name__ == '__main__':
    main()
