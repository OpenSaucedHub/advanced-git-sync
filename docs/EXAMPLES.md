# Configuration Examples

Real-world configuration examples for common use cases.

## Table of Contents

- [Basic Examples](#basic-examples)
- [Directional Sync](#directional-sync)
- [Advanced Use Cases](#advanced-use-cases)
- [Workflow Examples](#workflow-examples)

---

## Basic Examples

### Minimal Bidirectional Sync

Sync core features (branches, tags, releases) in both directions:

```yaml
github:
  enabled: true

gitlab:
  enabled: true
  projectId: 12345
```

**Result**: Branches, tags, and releases sync bidirectionally (default behavior).

---

### Sync Everything (Including Social Features)

```yaml
github:
  enabled: true
  sync:
    branches: { enabled: true }
    tags: { enabled: true }
    releases: { enabled: true }
    pullRequests: { enabled: true }
    issues: { enabled: true }

gitlab:
  enabled: true
  projectId: 12345
  sync:
    branches: { enabled: true }
    tags: { enabled: true }
    releases: { enabled: true }
    pullRequests: { enabled: true }
    issues: { enabled: true }
```

---

### Branches and Releases Only

```yaml
github:
  enabled: true
  sync:
    branches: { enabled: true }
    tags: { enabled: true } # Auto-enabled with releases
    releases: { enabled: true }
    pullRequests: { enabled: false }
    issues: { enabled: false }

gitlab:
  enabled: true
  projectId: 12345
  sync:
    branches: { enabled: true }
    tags: { enabled: true }
    releases: { enabled: true }
    pullRequests: { enabled: false }
    issues: { enabled: false }
```

---

## Directional Sync

### GitHub → GitLab (One-Way)

#### Minimal

```yaml
github:
  enabled: true
  sync:
    branches: { enabled: true }
    pullRequests: { enabled: true }

gitlab:
  enabled: true
  projectId: 12345
```

#### Full Mirror

```yaml
github:
  enabled: true
  sync:
    branches: { enabled: true }
    tags: { enabled: true }
    releases: { enabled: true }
    pullRequests: { enabled: true }
    issues: { enabled: true }

gitlab:
  enabled: true
  projectId: 12345
  # Receives everything from GitHub
```

---

### GitLab → GitHub (One-Way)

#### Minimal

```yaml
github:
  enabled: true

gitlab:
  enabled: true
  projectId: 12345
  sync:
    branches: { enabled: true }
    pullRequests: { enabled: true }
```

#### Public Mirror (Private GitLab → Public GitHub)

```yaml
github:
  enabled: true
  # Receives from GitLab (public mirror)

gitlab:
  enabled: true
  projectId: 12345
  sync:
    branches: { enabled: true }
    tags: { enabled: true }
    releases: { enabled: true }
    pullRequests: { enabled: false } # Keep PRs private
    issues: { enabled: false } # Keep issues private
```

---

### Mixed Directional Sync

Branches bidirectional, but PRs only from GitHub:

```yaml
github:
  enabled: true
  sync:
    branches: { enabled: true } # ↔️ Bidirectional
    pullRequests: { enabled: true } # ➡️ To GitLab only

gitlab:
  enabled: true
  projectId: 12345
  sync:
    branches: { enabled: true } # ↔️ Bidirectional
    pullRequests: { enabled: false } # ❌ Not from GitLab
```

---

## Advanced Use Cases

### Enterprise GitLab Instance

Self-hosted GitLab with custom configuration:

```yaml
github:
  enabled: true
  sync:
    branches: { enabled: true }
    pullRequests: { enabled: true }
    issues: { enabled: true }

gitlab:
  enabled: true
  host: 'gitlab.company.com'
  projectId: 42
  sync:
    branches:
      enabled: true
      protected: false # Don't sync protected branches
    pullRequests: { enabled: true }
    issues: { enabled: true }
```

---

### Selective Branch Sync

Only sync specific branches:

```yaml
github:
  enabled: true
  sync:
    branches:
      enabled: true
      pattern: 'main' # Only main branch

gitlab:
  enabled: true
  projectId: 12345
  sync:
    branches:
      enabled: true
      pattern: 'main|develop' # Main and develop
```

---

### Bot Branch Management

#### Clean Up Orphaned Bot Branches (Default)

```yaml
github:
  enabled: true
  sync:
    branches:
      enabled: true
      botBranches:
        strategy: 'delete-orphaned'
        patterns: [] # Use defaults

gitlab:
  enabled: true
  projectId: 12345
  sync:
    branches:
      enabled: true
      botBranches:
        strategy: 'delete-orphaned'
```

#### Sync All Branches (Including Bots)

```yaml
github:
  sync:
    branches:
      enabled: true
      botBranches:
        strategy: 'sync' # Treat bots as regular branches

gitlab:
  sync:
    branches:
      enabled: true
      botBranches:
        strategy: 'sync'
```

#### Custom Bot Patterns

```yaml
github:
  sync:
    branches:
      enabled: true
      botBranches:
        strategy: 'delete-orphaned'
        patterns:
          - 'dependabot/*'
          - 'renovate/*'
          - 'my-company-bot/*'
```

---

### Divergent History Handling

#### Merge Timelines (Recommended)

```yaml
github:
  enabled: true
  sync:
    branches:
      enabled: true
      historySync:
        enabled: true
        strategy: 'merge-timelines'
        createMergeCommits: true
        mergeMessage: '🔄 Sync: Merge {source} → {target}'
    releases:
      enabled: true
      divergentCommitStrategy: 'skip'
      latestReleaseStrategy: 'point-to-latest'

gitlab:
  enabled: true
  projectId: 12345
  sync:
    branches:
      enabled: true
      historySync:
        enabled: true
        strategy: 'merge-timelines'
    releases:
      enabled: true
      divergentCommitStrategy: 'skip'
      latestReleaseStrategy: 'point-to-latest'
```

#### Conservative (Skip Diverged)

```yaml
github:
  enabled: false # One-way only

gitlab:
  enabled: true
  projectId: 12345
  sync:
    branches:
      enabled: true
      historySync:
        strategy: 'skip-diverged'
        createMergeCommits: false
```

---

### Comment Synchronization

Full comment sync with attribution:

```yaml
github:
  enabled: true
  sync:
    pullRequests:
      enabled: true
      comments:
        enabled: true
        attribution:
          format: 'quoted' # quoted | inline | minimal
          includeAuthor: true
          includeTimestamp: true
          includeSourceLink: true
        handleUpdates: true
        preserveFormatting: true
        syncReplies: true

    issues:
      enabled: true
      comments:
        enabled: true
        attribution:
          format: 'inline'
```

---

### Performance Optimized

For large repositories with many branches:

```yaml
github:
  enabled: true
  sync:
    branches:
      enabled: true
      pattern: 'main|develop|release/*' # Specific patterns only
    tags:
      enabled: true
      pattern: 'v*' # Only version tags
    releases:
      enabled: true
      pattern: 'v*'
      skipPreReleases: true # Skip pre-releases
    pullRequests:
      enabled: false # Disable if not needed
    issues:
      enabled: false

gitlab:
  enabled: true
  projectId: 12345
  sync:
    branches:
      enabled: true
      pattern: 'main|develop'
    tags: { enabled: true, pattern: 'v*' }
    releases: { enabled: true }
```

---

## Workflow Examples

### Multiple Sync Frequencies

#### High-Frequency Branch Sync

`.github/workflows/sync-branches.yml`:

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
      - uses: actions/checkout@v4
      - uses: OpenSaucedHub/advanced-git-sync@v1
        with:
          CONFIG_PATH: .github/sync-branches.yml
          GITLAB_TOKEN: ${{ secrets.GITLAB_TOKEN }}
```

`.github/sync-branches.yml`:

```yaml
github:
  enabled: true
  sync:
    branches: { enabled: true }
    tags: { enabled: false }
    releases: { enabled: false }
    pullRequests: { enabled: false }
    issues: { enabled: false }

gitlab:
  enabled: true
  projectId: 12345
  sync:
    branches: { enabled: true }
```

#### Low-Frequency Release Sync

`.github/workflows/sync-releases.yml`:

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
      - uses: actions/checkout@v4
      - uses: OpenSaucedHub/advanced-git-sync@v1
        with:
          CONFIG_PATH: .github/sync-releases.yml
          GITLAB_TOKEN: ${{ secrets.GITLAB_TOKEN }}
```

`.github/sync-releases.yml`:

```yaml
github:
  enabled: true
  sync:
    branches: { enabled: false }
    tags: { enabled: true }
    releases: { enabled: true }

gitlab:
  enabled: true
  projectId: 12345
  sync:
    branches: { enabled: false }
    tags: { enabled: true }
    releases: { enabled: true }
```

---

### Environment-Specific Configurations

#### Development Environment

`.github/sync-config-dev.yml`:

```yaml
github:
  enabled: true
  owner: dev-org
  repo: project-dev
  sync:
    branches:
      enabled: true
      pattern: '*' # All branches in dev
    pullRequests: { enabled: true }
    issues: { enabled: true }
    releases: { enabled: false }

gitlab:
  enabled: true
  projectId: 111
  owner: dev-org
  repo: project-dev
  sync:
    branches: { enabled: true, pattern: 'feature/*|bugfix/*' }
    pullRequests: { enabled: true }
    issues: { enabled: true }
```

#### Production Environment

`.github/sync-config.yml`:

```yaml
github:
  enabled: true
  sync:
    branches:
      enabled: true
      pattern: 'main|release/*' # Only stable branches
    pullRequests: { enabled: true }
    issues: { enabled: true }
    releases: { enabled: true }

gitlab:
  enabled: true
  projectId: 222
  sync:
    branches: { enabled: true, pattern: 'main|hotfix/*' }
    pullRequests: { enabled: true }
    issues: { enabled: true }
    releases: { enabled: true }
```

---

## Common Patterns

### Pattern 1: GitHub as Primary, GitLab as Backup

```yaml
github:
  enabled: true
  sync:
    branches: { enabled: true }
    tags: { enabled: true }
    releases: { enabled: true }
    pullRequests: { enabled: false }
    issues: { enabled: false }

gitlab:
  enabled: true
  projectId: 12345
  # Receive only - no sync back
```

### Pattern 2: GitLab as Primary, GitHub as Public Mirror

```yaml
github:
  enabled: true
  # Public mirror - receive only

gitlab:
  enabled: true
  projectId: 12345
  sync:
    branches: { enabled: true }
    tags: { enabled: true }
    releases: { enabled: true }
    pullRequests: { enabled: false } # Keep internal
    issues: { enabled: false } # Keep internal
```

### Pattern 3: Development on GitHub, CI/CD on GitLab

```yaml
github:
  enabled: true
  sync:
    branches: { enabled: true } # Push to GitLab for CI/CD

gitlab:
  enabled: true
  projectId: 12345
  sync:
    branches: { enabled: false } # Don't push back
```

### Pattern 4: Full Collaboration (Everything Synced)

```yaml
github:
  enabled: true
  sync:
    branches: { enabled: true }
    tags: { enabled: true }
    releases: { enabled: true }
    pullRequests: { enabled: true }
    issues: { enabled: true }

gitlab:
  enabled: true
  projectId: 12345
  sync:
    branches: { enabled: true }
    tags: { enabled: true }
    releases: { enabled: true }
    pullRequests: { enabled: true }
    issues: { enabled: true }
```

---

## Example Files

See `.github/sync-config-examples/` for complete working examples:

- `minimal-github-to-gitlab.yml` - Simplest one-way sync
- `unidirectional-github-to-gitlab.yml` - Full GitHub → GitLab
- `unidirectional-gitlab-to-github.yml` - Full GitLab → GitHub
- `bidirectional-full.yml` - Complete bidirectional sync
- `mixed-directional.yml` - Mixed sync directions

---

## Next Steps

- [Configuration Reference](CONFIGURATION.md) - Complete option reference
- [Token Setup](TOKEN.md) - Authentication configuration
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions
