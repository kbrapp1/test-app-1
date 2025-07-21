# Commit and Sync Command

## 🎯 Command Purpose
Commit all current changes with a descriptive message and sync with the remote repository. This command handles the complete git workflow from staging to pushing changes.

## 📋 Usage
```bash
/commit-and-sync [commit-message]
```

### Examples
```bash
# Commit with descriptive message
/commit-and-sync "refactor: update chatbot-widget domain refactoring plan"

# Commit feature work
/commit-and-sync "feat: implement Result<T,E> pattern in domain services"

# Commit bug fixes
/commit-and-sync "fix: resolve infrastructure leakage in application layer"

# Commit documentation updates
/commit-and-sync "docs: add comprehensive execution tracking to refactoring plans"

# Auto-generate commit message if not provided
/commit-and-sync
```

## 🔄 Execution Workflow

### **Pre-Commit Validation**
The command performs comprehensive validation before committing:

1. **Git Status Analysis**
   - Check for uncommitted changes
   - Identify untracked files
   - Verify branch status and upstream tracking

2. **Security Validation**
   - Scan for potential secrets or sensitive data
   - Validate no temporary files are being committed
   - Check for proper .gitignore compliance

### **Commit Process**
```bash
# Step 1: Stage all changes
echo "📦 Staging changes..."
git add .

# Step 2: Show what will be committed
echo "📋 Changes to be committed:"
git status --short

# Step 3: Generate commit message if not provided
if [ -z "$1" ]; then
  echo "🤖 Generating commit message..."
  COMMIT_MESSAGE="chore: update codebase with latest changes"
else
  COMMIT_MESSAGE="$1"
fi

# Step 4: Create commit with proper formatting
echo "💾 Creating commit..."
git commit -m "$(cat <<EOF
${COMMIT_MESSAGE}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Step 5: Push to remote
echo "🚀 Pushing to remote..."
git push

# Step 6: Confirmation
echo "✅ Changes committed and synced successfully!"
```

## 🛡️ Safety Mechanisms

### **Rollback Protection**
- **Pre-commit Hooks**: Validate changes before commit
- **Staged Changes Review**: Show exactly what will be committed
- **Push Verification**: Confirm remote sync successful

### **Conflict Resolution**
- **Merge Conflicts**: Detect and provide resolution guidance
- **Branch Divergence**: Handle upstream changes gracefully
- **Force Push Protection**: Never use force push operations

## 📊 Implementation Strategy

When this command is executed, it should:

### **1. Git Operations**
```bash
# Check git status
git status --porcelain

# Stage all changes
git add .

# Generate commit message if not provided
if [ -z "$1" ]; then
  COMMIT_MESSAGE="chore: update codebase with latest changes"
else
  COMMIT_MESSAGE="$1"
fi

# Create formatted commit
git commit -m "${COMMIT_MESSAGE}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to remote
git push
```

### **3. Validation and Feedback**
```typescript
// Validate successful push
const pushResult = await validatePushSuccess();
if (pushResult.success) {
  console.log("✅ Changes committed and synced successfully!");
} else {
  console.error("❌ Push failed:", pushResult.error);
}
```

## 🚨 Error Handling

### **Git Operation Failures**
```bash
# If commit fails
echo "❌ Commit failed. Check git status and resolve issues."
git status
exit 1

# If push fails
echo "❌ Push failed. May need to pull latest changes first."
git pull --rebase origin main
git push
```

### **Merge Conflict Resolution**
```bash
# If push fails due to conflicts
echo "🔄 Remote changes detected. Attempting rebase..."
git pull --rebase origin main

if [ $? -ne 0 ]; then
  echo "❌ Merge conflicts detected. Please resolve manually:"
  git status
  echo "After resolving conflicts, run: git rebase --continue && git push"
  exit 1
fi

# Retry push after successful rebase
git push
```

## 📋 Pre-Execution Checklist

The command validates these conditions before executing:

- [ ] **Clean Working Directory**: No uncommitted conflicts
- [ ] **Valid Commit Message**: Auto-generates if not provided
- [ ] **Git Repository**: Current directory is a valid git repository
- [ ] **Remote Configured**: Upstream remote is properly configured
- [ ] **Network Access**: Can reach remote repository

## 🎯 Success Criteria

### **Commit Success**
- [ ] All changes staged successfully
- [ ] Commit created with proper message formatting
- [ ] Claude Code attribution added
- [ ] Local repository updated

### **Sync Success**
- [ ] Changes pushed to remote repository
- [ ] Remote branch updated successfully
- [ ] No conflicts or merge issues
- [ ] Confirmation message displayed

## 📝 Usage Notes

### **Commit Message Best Practices**
- Use conventional commit format: `type: description`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Keep descriptions clear and concise
- Focus on the "why" not just the "what"

### **Quality Requirements**
- Manual quality checks completed by user before running command
- User responsible for TypeScript, linting, and test validation
- Focus on git workflow automation only

### **Git Workflow**
- Automatically handles staging all changes
- Includes proper commit message formatting
- Pushes to the current branch's upstream
- Handles common git scenarios gracefully

---

This command provides a streamlined workflow for committing and syncing changes while ensuring code quality and proper git practices are maintained throughout the process.