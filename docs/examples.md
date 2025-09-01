# Advanced Configuration Examples

This guide provides real-world configuration examples for various use cases.

## 🧠 Understanding Logical Defaults

The action uses **logical priority-based defaults** with automatic dependency management:

- **✅ Enabled by default**: Branches (with historySync), Tags, Releases - core features most users
  want
- **❌ Disabled by default**: Pull Requests, Issues, Comments - can be noisy, user choice
- **🔗 Smart dependencies**: Automatically enables required features (e.g., tags when releases
  enabled)

### Minimal Configuration

For most users, this is all you need:

```yaml
gitlab:
  enabled: true
  projectId: 12345 # Your GitLab project ID

github:
  enabled: true
```

This automatically syncs: **Branches** (with history) + **Tags** + **Releases** 🎉

## Basic Examples

### 1. GitHub to GitLab Only (Core Features)

Sync core features from GitHub to GitLab using Logical defaults:

```yaml
gitlab:
  enabled: false # Don't sync FROM GitLab to GitHub

github:
  enabled: true # Sync FROM GitHub to GitLab
  # Uses Logical defaults: branches + tags + releases enabled
  # pullRequests and issues disabled by default (less noisy)
```

### 2. GitHub to GitLab with Social Features

If you want to include PRs and issues (can be noisy):

```yaml
gitlab:
  enabled: false

github:
  enabled: true
  sync:
    # Core features use defaults (branches, tags, releases = true)
    pullRequests:
      enabled: true # Enable social features
      # Labels automatically handled: original labels + 'synced'
    issues:
      enabled: true # Enable social features
      # Labels automatically handled: original labels + 'synced'
```

### 3. GitLab to GitHub Only (Core Features)

Sync core features from GitLab to GitHub using Logical defaults:

```yaml
gitlab:
  enabled: true # Sync FROM GitLab to GitHub
  projectId: 12345
  # Uses Logical defaults: branches + tags + releases enabled

github:
  enabled: false # Don't sync FROM GitHub to GitLab
```

### 3. Branches and Releases Only

Only sync branches and releases, skip PRs and issues:

```yaml
gitlab:
  enabled: true
  sync:
    branches:
      enabled: true
    pullRequests:
      enabled: false
    issues:
      enabled: false
    releases:
      enabled: true

github:
  enabled: true
  sync:
    branches:
      enabled: true
    pullRequests:
      enabled: false
    issues:
      enabled: false
    releases:
      enabled: true
```

## Advanced Examples

### 4. Selective Branch Syncing

Sync only specific branch patterns:

```yaml
gitlab:
  enabled: true
  sync:
    branches:
      enabled: true
      protected: true
      pattern: 'main' # Only sync main branch
    pullRequests:
      enabled: true
    issues:
      enabled: false
    releases:
      enabled: true

github:
  enabled: true
  sync:
    branches:
      enabled: true
      protected: true
      pattern: 'feature/*' # Only sync feature branches
    pullRequests:
      enabled: true
    issues:
      enabled: false
    releases:
      enabled: true
```

### 5. Bot Branch Management

Control how bot-created branches (dependabot, renovate, etc.) are handled:

```yaml
# Default: Clean up orphaned bot branches
gitlab:
  enabled: true
  sync:
    branches:
      enabled: true
      botBranches:
        strategy: 'delete-orphaned' # Clean up orphaned bot branches
        patterns: [] # Use default bot patterns

github:
  enabled: true
  sync:
    branches:
      enabled: true
      botBranches:
        strategy: 'delete-orphaned'
        patterns: [] # Use defaults: dependabot/*, renovate/*, copilot/*, feature/*, etc.
```

```yaml
# Sync all branches including bots (no special handling)
gitlab:
  enabled: true
  sync:
    branches:
      enabled: true
      botBranches:
        strategy: 'sync' # Treat bot branches like regular branches

github:
  enabled: true
  sync:
    branches:
      enabled: true
      botBranches:
        strategy: 'sync'
```

```yaml
# Custom bot patterns only
gitlab:
  enabled: true
  sync:
    branches:
      enabled: true
      botBranches:
        strategy: 'delete-orphaned'
        patterns: # Only these patterns are considered bots
          - 'dependabot/*'
          - 'my-company-bot/*'
          - 'automated-*'

github:
  enabled: true
  sync:
    branches:
      enabled: true
      botBranches:
        strategy: 'delete-orphaned'
        patterns: ['dependabot/*', 'renovate/*'] # Custom patterns
```

### 6. Enterprise GitLab Instance

Configure for a self-hosted GitLab instance:

```yaml
gitlab:
  enabled: true
  host: 'gitlab.company.com'
  projectId: 42
  sync:
    branches:
      enabled: true
      protected: false # Don't sync protected branches
    pullRequests:
      enabled: true
      autoMerge: false
      labels: ['external-sync', 'github']
    issues:
      enabled: true
      labels: ['external-sync', 'github']
    releases:
      enabled: true

github:
  enabled: true
  sync:
    branches:
      enabled: true
    pullRequests:
      enabled: true
      labels: ['external-sync', 'gitlab']
    issues:
      enabled: true
      labels: ['external-sync', 'gitlab']
    releases:
      enabled: true
```

### 6. High-Performance Configuration

Optimized for repositories with many branches and issues:

```yaml
gitlab:
  enabled: true
  sync:
    branches:
      enabled: true
      protected: true
      pattern: 'main|develop|release/*' # Specific patterns only
    pullRequests:
      enabled: true
      autoMerge: false
      labels: ['sync']
    issues:
      enabled: true
      labels: ['sync']
    releases:
      enabled: true
      divergentCommitStrategy: 'skip'
      latestReleaseStrategy: 'point-to-latest'
      pattern: 'v*'
    tags:
      enabled: true
      divergentCommitStrategy: 'skip'
      pattern: 'v*'

github:
  enabled: true
  sync:
    branches:
      enabled: true
      protected: true
      pattern: 'main|develop|feature/*'
    pullRequests:
      enabled: true
      autoMerge: false
      labels: ['sync']
    issues:
      enabled: true
      labels: ['sync']
    releases:
      enabled: true
      divergentCommitStrategy: 'skip'
      latestReleaseStrategy: 'point-to-latest'
      pattern: 'v*'
    tags:
      enabled: true
      divergentCommitStrategy: 'skip'
      pattern: 'v*'
```

### 7. Development vs Production

Different configurations for different environments:

**Development Environment (.github/sync-config-dev.yml):**

```yaml
gitlab:
  enabled: true
  owner: 'dev-team'
  repo: 'project-dev'
  sync:
    branches:
      enabled: true
      pattern: '*' # All branches in dev
    pullRequests:
      enabled: true
      labels: ['dev-sync', 'testing']
    issues:
      enabled: true
    releases:
      enabled: false # No releases in dev

github:
  enabled: true
  sync:
    branches:
      enabled: true
      pattern: 'feature/*|bugfix/*'
    pullRequests:
      enabled: true
      labels: ['dev-sync']
    issues:
      enabled: true
    releases:
      enabled: false
```

**Production Environment (.github/sync-config.yml):**

```yaml
gitlab:
  enabled: true
  sync:
    branches:
      enabled: true
      pattern: 'main|release/*' # Only stable branches
    pullRequests:
      enabled: true
      labels: ['prod-sync']
    issues:
      enabled: true
    releases:
      enabled: true

github:
  enabled: true
  sync:
    branches:
      enabled: true
      pattern: 'main|hotfix/*'
    pullRequests:
      enabled: true
      labels: ['prod-sync']
    issues:
      enabled: true
    releases:
      enabled: true
```

### 8. Divergent History Handling

Configuration for repositories with different commit histories:

```yaml
gitlab:
  enabled: true
  sync:
    branches:
      enabled: true
      historySync:
        enabled: true
        strategy: 'merge-timelines' # Preserve all work
        createMergeCommits: true
        mergeMessage: 'Sync: Merge GitLab timeline → GitHub'
    releases:
      enabled: true
      divergentCommitStrategy: 'skip' # Skip releases with missing commits
      latestReleaseStrategy: 'point-to-latest' # Latest release points to current commit
      pattern: 'v*'
    tags:
      enabled: true
      divergentCommitStrategy: 'skip' # Skip tags with missing commits
      pattern: 'v*'

github:
  enabled: true
  sync:
    branches:
      enabled: true
      historySync:
        enabled: true
        strategy: 'merge-timelines'
        createMergeCommits: true
        mergeMessage: 'Sync: Merge GitHub timeline → GitLab'
    releases:
      enabled: true
      divergentCommitStrategy: 'skip'
      latestReleaseStrategy: 'point-to-latest'
      pattern: 'v*'
    tags:
      enabled: true
      divergentCommitStrategy: 'skip'
      pattern: 'v*'
```

### 9. Conservative Sync (Skip Diverged)

For repositories where you want to avoid merge commits:

```yaml
gitlab:
  enabled: true
  sync:
    branches:
      enabled: true
      historySync:
        enabled: true
        strategy: 'skip-diverged' # Only sync existing commits
        createMergeCommits: false
    releases:
      enabled: true
      divergentCommitStrategy: 'skip'
      latestReleaseStrategy: 'skip' # Skip even latest if commit missing
    tags:
      enabled: true
      divergentCommitStrategy: 'skip'

github:
  enabled: false # One-way sync only
```

## Workflow Examples

### 10. Multiple Sync Schedules

Different sync frequencies for different content types:

**.github/workflows/sync-branches.yml** (Frequent):

```yaml
name: Sync Branches
on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '*/15 * * * *' # Every 15 minutes

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4.2.2
      - uses: OpenSaucedHub/advanced-git-sync@v1.4.5
        with:
          CONFIG_PATH: .github/sync-config-branches.yml
          GITLAB_TOKEN: ${{ secrets.GITLAB_TOKEN }}
```

**.github/workflows/sync-releases.yml** (Less frequent):

```yaml
name: Sync Releases
on:
  release:
    types: [published]
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4.2.2
      - uses: OpenSaucedHub/advanced-git-sync@v1.4.5
        with:
          CONFIG_PATH: .github/sync-config-releases.yml
          GITLAB_TOKEN: ${{ secrets.GITLAB_TOKEN }}
```

## Best Practices

### Automatic Label Management

Labels are now automatically handled:

- **All original labels** from the source PR/Issue are preserved
- **'synced' label** is automatically added to all synced content
- **No configuration needed** - labels work out of the box

Example: A GitHub PR with labels `['bug', 'urgent']` will become a GitLab MR with labels
`['bug', 'urgent', 'synced']`

### Performance Optimization

For large repositories:

```yaml
# Minimize sync scope
gitlab:
  sync:
    branches:
      pattern: 'main|release/*' # Specific patterns
    pullRequests:
      enabled: true
    releases:
      enabled: false # Skip if not needed
```

## Next Steps

- [Configuration Guide](configuration.md) - Complete configuration reference
- [Token Setup](token-setup.md) - Authentication setup
- [Troubleshooting](troubleshooting.md) - Common issues and solutions
