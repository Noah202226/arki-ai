---
name: git-commit-helper
description: Inspects changed files, generates conventional commit messages, and automatically runs git add ., git commit -m "<msg>", and git push. Use when the user asks to commit git changes, push git changes, generate a commit message, or update git.
---

# Automated Git Commit & Push Helper Skill

Use this skill whenever the user requests help committing git changes, generating commit messages, or pushing changes.

## Automated Workflow Instructions

1. **Inspect Git Status**:
   - Briefly inspect changed, untracked, and modified files.

2. **Craft Conventional Commit Message**:
   Follow standard Conventional Commits formatting:
   - `feat(scope)`: New features or major component additions
   - `fix(scope)`: Bug fixes or error resolutions
   - `refactor(scope)`: Code restructuring without functional changes
   - `style(scope)`: Layout, design, or styling updates
   - `docs(scope)`: Documentation updates

3. **Execute Automated Staging, Commit & Push**:
   Propose and execute the automated 3-step sequence:
   ```powershell
   git add .
   git commit -m "<crafted_commit_message>"
   git push origin main
   ```
