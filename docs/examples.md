# Advanced Configuration Examples

This guide provides real-world configuration examples for various use cases.

## Basic Examples

### 1. GitHub to GitLab Only

Sync everything from GitHub to GitLab, but not the reverse:

```yaml
gitlab:
  enabled: false # Don't sync FROM GitLab to GitHub

github:
  enabled: true # Sync FROM GitHub to GitLab
  sync:
    branches:
      enabled: true
    pullRequests:
      enabled: true
      labels: ['github-sync']
    issues:
      enabled: true
      labels: ['github-sync']
    releases:
      enabled: true
```

### 2. GitLab to GitHub Only

Sync everything from GitLab to GitHub, but not the reverse:

```yaml
gitlab:
  enabled: true # Sync FROM GitLab to GitHub
  projectId: 12345
  sync:
    branches:
      enabled: true
    pullRequests:
      enabled: true
      labels: ['gitlab-sync']
    issues:
      enabled: true
      labels: ['gitlab-sync']
    releases:
      enabled: true

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

### 5. Enterprise GitLab Instance

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
      syncComments: true # Enable comment syncing
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
      syncComments: true
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
      syncComments: false # Disable for performance
      labels: ['sync']
    releases:
      enabled: true

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
      syncComments: false # Disable for performance
      labels: ['sync']
    releases:
      enabled: true
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
      syncComments: true # Full sync in dev
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
      syncComments: true
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
      syncComments: false # Performance optimization
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
      syncComments: false
    releases:
      enabled: true
```

## Workflow Examples

### 8. Multiple Sync Schedules

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
      - uses: OpenSaucedHub/advanced-git-sync@v1.1.6
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
      - uses: OpenSaucedHub/advanced-git-sync@v1.1.6
        with:
          CONFIG_PATH: .github/sync-config-releases.yml
          GITLAB_TOKEN: ${{ secrets.GITLAB_TOKEN }}
```

## Best Practices

### Label Strategy

Use descriptive labels to track sync origin:

```yaml
gitlab:
  sync:
    pullRequests:
      labels: ['🔄 synced', '📍 from-gitlab', '🤖 automated']
    issues:
      labels: ['🔄 synced', '📍 from-gitlab']

github:
  sync:
    pullRequests:
      labels: ['🔄 synced', '📍 from-github', '🤖 automated']
    issues:
      labels: ['🔄 synced', '📍 from-github']
```

### Performance Optimization

For large repositories:

```yaml
# Minimize sync scope
gitlab:
  sync:
    branches:
      pattern: 'main|release/*' # Specific patterns
    issues:
      syncComments: false # Skip comments
    pullRequests:
      enabled: true
    releases:
      enabled: false # Skip if not needed
```

## Next Steps

- [Configuration Guide](configuration.md) - Complete configuration reference
- [Token Setup](token-setup.md) - Authentication setup
- [Troubleshooting](troubleshooting.md) - Common issues and solutions
