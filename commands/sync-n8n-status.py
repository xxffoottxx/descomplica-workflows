#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
sync-n8n-status.py — n8n Workflow Drift Detection

Checks for differences (drift) between:
1. Local workflow JSON files
2. GitHub committed versions
3. Production VM deployed workflows

Usage:
    python commands/sync-n8n-status.py [--quiet] [--json]

Options:
    --quiet    Exit with code 1 if drift detected (for pre-commit hooks)
    --json     Output JSON instead of colored text
"""

import json
import os
import sys
import hashlib
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import urllib.request
import urllib.error
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

# Configuration
N8N_API_URL = "https://n8n.descomplicador.pt/api/v1"
N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZDQwYWYwYS1kZWEwLTQ5MzYtYmNkNC1lMTUxYzlkOGZjOGIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzcwNjgxNTU4fQ.5DjZY1bGwJOd-TnPl54ICAzOlvU0p_NwfSngsLEjVTM"
WORKFLOW_DIRS = ["MVP's", "Ferramentas", "Projetos de Clientes", "Módulos reutilizáveis"]
WORKFLOW_MAP_FILE = ".n8n-workflow-map.json"


def get_json_hash(data: dict) -> str:
    """Get deterministic hash of JSON data (ignoring field order)."""
    # Only hash the essential workflow fields
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


def find_workflow_files() -> List[Path]:
    """Find all workflow JSON files in configured directories."""
    workflows = []
    base_path = Path.cwd()

    for dir_name in WORKFLOW_DIRS:
        dir_path = base_path / dir_name
        if dir_path.exists():
            # Find all .json files, excluding evaluators and test files
            for json_file in dir_path.rglob("*.json"):
                # Skip node_modules, .claude, and test/evaluator files
                if any(skip in str(json_file) for skip in ['node_modules', '.claude', 'evaluator', 'Evaluator', 'test']):
                    continue
                workflows.append(json_file)

    return sorted(workflows)


def load_or_create_workflow_map() -> Dict[str, str]:
    """Load or create workflow name -> ID mapping."""
    map_file = Path(WORKFLOW_MAP_FILE)

    if map_file.exists():
        with open(map_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    # Create new map by fetching all workflows from n8n API
    print(f"{Colors.CYAN}Creating workflow map from n8n API...{Colors.RESET}")
    workflows = call_n8n_api("workflows")

    if not workflows or 'data' not in workflows:
        print(f"{Colors.YELLOW}Warning: Could not fetch workflows from API{Colors.RESET}")
        return {}

    # Map workflow names to IDs
    workflow_map = {}
    for wf in workflows['data']:
        workflow_map[wf['name']] = wf['id']

    # Save the map
    with open(map_file, 'w', encoding='utf-8') as f:
        json.dump(workflow_map, f, indent=2, ensure_ascii=False)

    print(f"{Colors.GREEN}✓ Created {WORKFLOW_MAP_FILE} with {len(workflow_map)} workflows{Colors.RESET}")
    return workflow_map


def get_git_status(file_path: Path) -> Tuple[bool, Optional[str]]:
    """Check if file has uncommitted changes and get last commit date."""
    try:
        # Check if file is tracked
        result = subprocess.run(
            ['git', 'ls-files', '--error-unmatch', str(file_path)],
            capture_output=True,
            text=True,
            cwd=file_path.parent
        )

        if result.returncode != 0:
            return False, None  # File not tracked

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

        return has_changes, last_commit
    except Exception:
        return False, None


def check_workflow_status(file_path: Path, workflow_map: Dict[str, str]) -> dict:
    """Check sync status for a single workflow file."""
    # Read local file
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            local_data = json.load(f)
    except Exception as e:
        return {
            'file': str(file_path),
            'name': file_path.stem,
            'error': f"Failed to read local file: {e}"
        }

    workflow_name = local_data.get('name', file_path.stem)
    local_hash = get_json_hash(local_data)

    # Get git status
    has_uncommitted, last_commit = get_git_status(file_path)

    # Get workflow ID from map
    workflow_id = workflow_map.get(workflow_name)

    if not workflow_id:
        return {
            'file': str(file_path),
            'name': workflow_name,
            'id': None,
            'local_hash': local_hash,
            'vm_hash': None,
            'git_uncommitted': has_uncommitted,
            'git_last_commit': last_commit,
            'status': 'not_deployed',
            'message': 'Not found on VM (may need to deploy)'
        }

    # Fetch workflow from VM
    vm_workflow = call_n8n_api(f"workflows/{workflow_id}")

    if not vm_workflow:
        return {
            'file': str(file_path),
            'name': workflow_name,
            'id': workflow_id,
            'local_hash': local_hash,
            'vm_hash': None,
            'git_uncommitted': has_uncommitted,
            'git_last_commit': last_commit,
            'status': 'vm_error',
            'message': 'Could not fetch from VM'
        }

    vm_hash = get_json_hash(vm_workflow)

    # Determine status
    if local_hash == vm_hash:
        if has_uncommitted:
            status = 'synced_uncommitted'
            message = 'Local matches VM but has uncommitted changes'
        else:
            status = 'synced'
            message = 'Fully synced'
    else:
        if has_uncommitted:
            status = 'drift_uncommitted'
            message = 'Drift detected AND uncommitted changes'
        else:
            status = 'drift'
            message = 'Drift detected (local ≠ VM)'

    return {
        'file': str(file_path),
        'name': workflow_name,
        'id': workflow_id,
        'local_hash': local_hash,
        'vm_hash': vm_hash,
        'git_uncommitted': has_uncommitted,
        'git_last_commit': last_commit,
        'status': status,
        'message': message
    }


def print_status_report(results: List[dict], quiet: bool = False):
    """Print colored status report."""
    if quiet:
        # Just exit with error code if drift detected
        has_drift = any(r['status'] in ['drift', 'drift_uncommitted', 'not_deployed'] for r in results)
        sys.exit(1 if has_drift else 0)

    print()
    print(f"{Colors.BOLD}{'='*70}{Colors.RESET}")
    print(f"{Colors.BOLD}n8n Workflow Sync Status Report{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*70}{Colors.RESET}")
    print()

    # Group by status
    synced = [r for r in results if r['status'] == 'synced']
    synced_uncommitted = [r for r in results if r['status'] == 'synced_uncommitted']
    drift = [r for r in results if r['status'] == 'drift']
    drift_uncommitted = [r for r in results if r['status'] == 'drift_uncommitted']
    not_deployed = [r for r in results if r['status'] == 'not_deployed']
    errors = [r for r in results if r['status'] == 'vm_error' or 'error' in r]

    # Print synced workflows
    if synced:
        print(f"{Colors.GREEN}{Colors.BOLD}✅ Synced ({len(synced)}){Colors.RESET}")
        for r in synced:
            commit_info = f" (last commit: {r['git_last_commit']})" if r['git_last_commit'] else ""
            print(f"   {Colors.GREEN}✓{Colors.RESET} {r['name']}{commit_info}")
        print()

    # Print synced but uncommitted
    if synced_uncommitted:
        print(f"{Colors.YELLOW}{Colors.BOLD}⚠️  Synced with VM but uncommitted changes ({len(synced_uncommitted)}){Colors.RESET}")
        for r in synced_uncommitted:
            print(f"   {Colors.YELLOW}△{Colors.RESET} {r['name']}")
            print(f"      {Colors.YELLOW}→ Local matches VM but not committed to GitHub{Colors.RESET}")
        print()

    # Print drift
    if drift:
        print(f"{Colors.RED}{Colors.BOLD}❌ Drift detected ({len(drift)}){Colors.RESET}")
        for r in drift:
            print(f"   {Colors.RED}✗{Colors.RESET} {r['name']} (ID: {r['id']})")
            print(f"      {Colors.RED}→ {r['message']}{Colors.RESET}")
            commit_info = f" (last commit: {r['git_last_commit']})" if r['git_last_commit'] else ""
            print(f"      Local: {r['local_hash'][:8]}{commit_info}")
            print(f"      VM:    {r['vm_hash'][:8]}")
        print()

    # Print drift with uncommitted changes
    if drift_uncommitted:
        print(f"{Colors.RED}{Colors.BOLD}🔥 Critical: Drift + uncommitted ({len(drift_uncommitted)}){Colors.RESET}")
        for r in drift_uncommitted:
            print(f"   {Colors.RED}⚠{Colors.RESET} {r['name']} (ID: {r['id']})")
            print(f"      {Colors.RED}→ {r['message']}{Colors.RESET}")
            print(f"      Local: {r['local_hash'][:8]} (uncommitted)")
            print(f"      VM:    {r['vm_hash'][:8]}")
        print()

    # Print not deployed
    if not_deployed:
        print(f"{Colors.CYAN}{Colors.BOLD}📤 Not deployed to VM ({len(not_deployed)}){Colors.RESET}")
        for r in not_deployed:
            print(f"   {Colors.CYAN}?{Colors.RESET} {r['name']}")
            print(f"      {Colors.CYAN}→ {r['message']}{Colors.RESET}")
        print()

    # Print errors
    if errors:
        print(f"{Colors.RED}{Colors.BOLD}💥 Errors ({len(errors)}){Colors.RESET}")
        for r in errors:
            print(f"   {Colors.RED}!{Colors.RESET} {r['name']}")
            print(f"      {Colors.RED}→ {r.get('error', r.get('message', 'Unknown error'))}{Colors.RESET}")
        print()

    # Summary
    print(f"{Colors.BOLD}{'='*70}{Colors.RESET}")
    total = len(results)
    issues = len(synced_uncommitted) + len(drift) + len(drift_uncommitted) + len(not_deployed)

    if issues == 0:
        print(f"{Colors.GREEN}{Colors.BOLD}✅ All {total} workflows in sync!{Colors.RESET}")
    else:
        print(f"{Colors.YELLOW}{Colors.BOLD}⚠️  {issues}/{total} workflows need attention{Colors.RESET}")

    print(f"{Colors.BOLD}{'='*70}{Colors.RESET}")
    print()

    # Recommendations
    if drift or drift_uncommitted:
        print(f"{Colors.YELLOW}Recommendations:{Colors.RESET}")
        print("  • Run: python commands/sync-n8n-export.py  (to pull changes from VM)")
        print("  • Or:  python commands/sync-n8n-deploy.py  (to push local changes to VM)")
        print()

    if synced_uncommitted:
        print(f"{Colors.YELLOW}Uncommitted changes detected:{Colors.RESET}")
        print("  • Run: git add . && git commit -m 'Update workflows'")
        print()


def main():
    """Main entry point."""
    args = sys.argv[1:]
    quiet = '--quiet' in args
    output_json = '--json' in args

    # Change to script directory
    os.chdir(Path(__file__).parent.parent)

    # Find workflow files
    workflow_files = find_workflow_files()

    if not workflow_files:
        print(f"{Colors.YELLOW}No workflow files found in configured directories{Colors.RESET}")
        sys.exit(0)

    # Load or create workflow map
    workflow_map = load_or_create_workflow_map()

    # Check each workflow
    results = []
    for wf_file in workflow_files:
        if not quiet:
            print(f"{Colors.CYAN}Checking {wf_file.name}...{Colors.RESET}", end='\r')
        result = check_workflow_status(wf_file, workflow_map)
        results.append(result)

    # Clear progress line
    if not quiet:
        print(" " * 80, end='\r')

    # Output results
    if output_json:
        print(json.dumps(results, indent=2))
    else:
        print_status_report(results, quiet=quiet)


if __name__ == '__main__':
    main()
