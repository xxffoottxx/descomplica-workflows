#!/usr/bin/env python3
"""
sync-n8n-full.py — Complete 3-way sync orchestrator

Orchestrates the full workflow synchronization in one command:
1. Check drift status
2. Export from VM or deploy to VM (based on what's needed)
3. Commit changes to git
4. Push to GitHub

Usage:
    python commands/sync-n8n-full.py [OPTIONS]

Options:
    --direction auto|export|deploy   Sync direction (default: auto)
    --activate                       Activate workflows after deploy
    --yes                            Auto-confirm all actions
    --dry-run                        Preview what would happen
    --skip-git                       Skip git commit/push steps
    --quiet                          Suppress progress output

Direction Modes:
    auto    - Automatically determine direction based on timestamps
    export  - Force pull from VM (VM → local → GitHub)
    deploy  - Force push to VM (local → VM, then commit + push)

Examples:
    # Full auto sync (checks, syncs, commits, pushes)
    python commands/sync-n8n-full.py

    # Auto-confirm everything
    python commands/sync-n8n-full.py --yes

    # Force export from VM
    python commands/sync-n8n-full.py --direction export

    # Deploy to VM and activate workflows
    python commands/sync-n8n-full.py --direction deploy --activate

    # Preview without making changes
    python commands/sync-n8n-full.py --dry-run

    # Sync without git operations
    python commands/sync-n8n-full.py --skip-git
"""

import os
import sys
import subprocess
import json
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

# Project root
PROJECT_ROOT = Path(__file__).parent.parent.absolute()


def run_command(cmd: list, description: str, capture_output: bool = False, check: bool = True):
    """Run a subprocess command with optional output capture."""
    try:
        if capture_output:
            result = subprocess.run(
                cmd,
                cwd=PROJECT_ROOT,
                capture_output=True,
                text=True,
                check=check
            )
            return result
        else:
            result = subprocess.run(cmd, cwd=PROJECT_ROOT, check=check)
            return result
    except subprocess.CalledProcessError as e:
        print(f"{RED}✗ {description} failed{RESET}")
        if capture_output and e.stderr:
            print(f"{GRAY}{e.stderr}{RESET}")
        return None


def check_git_status() -> dict:
    """Check git status for uncommitted changes."""
    result = run_command(
        ['git', 'status', '--porcelain'],
        "Check git status",
        capture_output=True
    )

    if not result:
        return {'has_changes': False, 'files': []}

    has_changes = bool(result.stdout.strip())
    files = [line.strip() for line in result.stdout.split('\n') if line.strip()]

    return {'has_changes': has_changes, 'files': files}


def check_drift_status(quiet: bool = False) -> dict:
    """Run sync-n8n-status.py and parse results."""
    cmd = ['python', 'commands/sync-n8n-status.py', '--json']

    if not quiet:
        print(f"{CYAN}🔍 Checking workflow drift status...{RESET}")

    result = run_command(cmd, "Check drift status", capture_output=True)

    if not result:
        return {'error': True, 'workflows': []}

    try:
        workflows = json.loads(result.stdout)

        drift = [w for w in workflows if w['status'] in ['drift', 'drift_uncommitted']]
        synced = [w for w in workflows if w['status'] in ['synced', 'synced_uncommitted']]
        not_deployed = [w for w in workflows if w['status'] == 'not_deployed']

        return {
            'error': False,
            'workflows': workflows,
            'drift': drift,
            'synced': synced,
            'not_deployed': not_deployed,
            'has_drift': len(drift) > 0
        }
    except json.JSONDecodeError:
        return {'error': True, 'workflows': []}


def export_from_vm(yes: bool = False, quiet: bool = False, dry_run: bool = False) -> bool:
    """Run sync-n8n-export.py to pull from VM."""
    cmd = ['python', 'commands/sync-n8n-export.py']

    if yes:
        cmd.append('--yes')
    if quiet:
        cmd.append('--quiet')
    if dry_run:
        cmd.append('--dry-run')

    if not quiet:
        print(f"\n{BLUE}📥 Exporting workflows from VM...{RESET}")

    result = run_command(cmd, "Export from VM", check=False)
    return result is not None and result.returncode == 0


def deploy_to_vm(activate: bool = False, yes: bool = False, quiet: bool = False, dry_run: bool = False) -> bool:
    """Run sync-n8n-deploy.py to push to VM."""
    cmd = ['python', 'commands/sync-n8n-deploy.py']

    if activate:
        cmd.append('--activate')
    if yes:
        cmd.append('--yes')
    if quiet:
        cmd.append('--quiet')
    if dry_run:
        cmd.append('--dry-run')

    if not quiet:
        print(f"\n{BLUE}📤 Deploying workflows to VM...{RESET}")

    result = run_command(cmd, "Deploy to VM", check=False)
    return result is not None and result.returncode == 0


def git_commit_and_push(message: str, quiet: bool = False, dry_run: bool = False) -> bool:
    """Commit changes and push to GitHub."""
    if not quiet:
        print(f"\n{BLUE}📝 Committing changes to git...{RESET}")

    # Check if there are changes to commit
    git_status = check_git_status()

    if not git_status['has_changes']:
        if not quiet:
            print(f"{GRAY}  No changes to commit{RESET}")
        return True

    if dry_run:
        if not quiet:
            print(f"{YELLOW}  [DRY RUN] Would commit: {message}{RESET}")
            print(f"{GRAY}  Files to commit:{RESET}")
            for file in git_status['files']:
                print(f"{GRAY}    {file}{RESET}")
        return True

    # Add all changes
    result = run_command(['git', 'add', '.'], "Git add", capture_output=True)
    if not result:
        return False

    # Commit with message
    result = run_command(
        ['git', 'commit', '-m', message],
        "Git commit",
        capture_output=True,
        check=False
    )

    if not result or result.returncode != 0:
        if not quiet:
            print(f"{YELLOW}  No changes to commit or commit failed{RESET}")
        return True  # Not necessarily an error

    if not quiet:
        print(f"{GREEN}  ✓ Committed: {message}{RESET}")

    # Push to GitHub
    if not quiet:
        print(f"{BLUE}📤 Pushing to GitHub...{RESET}")

    result = run_command(['git', 'push'], "Git push", capture_output=True)

    if not result:
        return False

    if not quiet:
        print(f"{GREEN}  ✓ Pushed to GitHub{RESET}")

    return True


def confirm_action(prompt: str, default_yes: bool = False) -> bool:
    """Ask user for confirmation."""
    suffix = " [Y/n]: " if default_yes else " [y/N]: "

    try:
        response = input(f"{YELLOW}{prompt}{suffix}{RESET}").strip().lower()
    except (EOFError, KeyboardInterrupt):
        print()  # New line after prompt
        return default_yes

    if not response:
        return default_yes
    return response in ['y', 'yes']


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='Complete n8n workflow synchronization orchestrator',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument('--direction', choices=['auto', 'export', 'deploy'], default='auto',
                       help='Sync direction (default: auto)')
    parser.add_argument('--activate', action='store_true',
                       help='Activate workflows after deploy')
    parser.add_argument('--yes', action='store_true',
                       help='Auto-confirm all actions')
    parser.add_argument('--dry-run', action='store_true',
                       help='Preview without making changes')
    parser.add_argument('--skip-git', action='store_true',
                       help='Skip git commit/push steps')
    parser.add_argument('--quiet', action='store_true',
                       help='Suppress progress output')

    args = parser.parse_args()

    # Change to project root
    os.chdir(PROJECT_ROOT)

    # Header
    if not args.quiet:
        print(f"\n{BOLD}{BLUE}n8n Full Sync Orchestrator{RESET}")
        print(f"{GRAY}{'=' * 60}{RESET}\n")

        if args.dry_run:
            print(f"{YELLOW}[DRY RUN MODE]{RESET}\n")

    # Step 1: Check drift status
    drift_status = check_drift_status(quiet=args.quiet)

    if drift_status['error']:
        print(f"{RED}✗ Failed to check drift status{RESET}")
        sys.exit(1)

    if not args.quiet:
        drift_count = len(drift_status['drift'])
        synced_count = len(drift_status['synced'])

        print(f"{CYAN}Status:{RESET}")
        print(f"  {GREEN}✓{RESET} Synced: {synced_count} workflows")
        print(f"  {YELLOW}⚠{RESET} Drift:  {drift_count} workflows")
        print()

    # Step 2: Determine sync direction
    if not drift_status['has_drift']:
        if not args.quiet:
            print(f"{GREEN}✅ All workflows in sync - nothing to do!{RESET}")

        # Check for uncommitted changes
        git_status = check_git_status()
        if git_status['has_changes'] and not args.skip_git:
            if not args.quiet:
                print(f"\n{YELLOW}⚠ Uncommitted changes detected{RESET}")

            if args.yes or args.dry_run or confirm_action("Commit and push changes?", default_yes=True):
                success = git_commit_and_push(
                    "Update workflows (sync-n8n-full.py)",
                    quiet=args.quiet,
                    dry_run=args.dry_run
                )

                if success:
                    if not args.quiet:
                        print(f"\n{GREEN}✅ Full sync complete{RESET}")
                    sys.exit(0)
                else:
                    print(f"{RED}✗ Git operations failed{RESET}")
                    sys.exit(1)

        sys.exit(0)

    # Determine direction
    direction = args.direction

    if direction == 'auto':
        # Simple heuristic: if we have uncommitted local changes, deploy. Otherwise export.
        git_status = check_git_status()

        if git_status['has_changes']:
            direction = 'deploy'
            if not args.quiet:
                print(f"{CYAN}Auto-detected: Local changes present → Deploy to VM{RESET}\n")
        else:
            direction = 'export'
            if not args.quiet:
                print(f"{CYAN}Auto-detected: No local changes → Export from VM{RESET}\n")

    # Confirm action
    if not args.yes and not args.quiet and not args.dry_run:
        action_desc = "export from VM and commit to GitHub" if direction == 'export' else "deploy to VM and commit to GitHub"

        if not confirm_action(f"Ready to {action_desc}. Continue?", default_yes=True):
            print(f"{YELLOW}Cancelled by user{RESET}")
            sys.exit(0)
        print()

    # Step 3: Execute sync operation
    if direction == 'export':
        success = export_from_vm(yes=args.yes, quiet=args.quiet, dry_run=args.dry_run)
        commit_msg = "Export latest workflows from VM (sync-n8n-full.py)"
    else:  # deploy
        success = deploy_to_vm(
            activate=args.activate,
            yes=args.yes,
            quiet=args.quiet,
            dry_run=args.dry_run
        )
        commit_msg = "Deploy workflows to VM (sync-n8n-full.py)"

    if not success:
        print(f"{RED}✗ Sync operation failed{RESET}")
        sys.exit(1)

    # Step 4: Git commit and push
    if not args.skip_git:
        success = git_commit_and_push(commit_msg, quiet=args.quiet, dry_run=args.dry_run)

        if not success:
            print(f"{RED}✗ Git operations failed{RESET}")
            sys.exit(1)

    # Success
    if not args.quiet:
        print(f"\n{GREEN}{'=' * 60}{RESET}")
        print(f"{GREEN}{BOLD}✅ Full sync complete!{RESET}")
        print(f"{GREEN}{'=' * 60}{RESET}\n")

        if args.dry_run:
            print(f"{YELLOW}Note: This was a dry run. No actual changes were made.{RESET}\n")

    sys.exit(0)


if __name__ == '__main__':
    main()
