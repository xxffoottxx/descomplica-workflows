#!/bin/bash
# Install git hooks for descomplica-workflows

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)

if [ -z "$REPO_ROOT" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

echo "📦 Installing git hooks..."

# Install pre-commit hook
if [ -f "$REPO_ROOT/hooks/pre-commit" ]; then
    cp "$REPO_ROOT/hooks/pre-commit" "$REPO_ROOT/.git/hooks/pre-commit"
    chmod +x "$REPO_ROOT/.git/hooks/pre-commit"
    echo "✅ Installed pre-commit hook (workflow drift detection)"
else
    echo "❌ Error: hooks/pre-commit not found"
    exit 1
fi

echo ""
echo "✅ Git hooks installed successfully"
echo ""
echo "The pre-commit hook will now check for workflow drift before each commit."
echo "To bypass the check temporarily, use: git commit --no-verify"
