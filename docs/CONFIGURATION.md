# Configuration Guide

Complete configuration reference for GitHub-GitLab sync operations.

## Table of Contents

- [Quick Start](#quick-start)
- [Sync Directions](#sync-directions)
- [Configuration Options](#configuration-options)
- [Advanced Features](#advanced-features)
- [Token Requirements](#token-requirements)

---

## Quick Start

### Minimal Configuration

```yaml
# Bidirectional sync (branches, tags, releases)
github:
  enabled: true

gitlab:
  enabled: true
  projectId: 12345
```

### One-Way Sync (GitHub → GitLab)

```yaml
github:
  enabled: true
  sync:
    branches: { enabled: true }
    pullRequests: { enabled: true }

gitlab:
  enabled: true
  projectId: 12345
  # No sync section = receive only
```

### One-Way Sync (GitLab → GitHub)

```yaml
github:
  enabled: true
  # No sync section = receive only

gitlab:
  enabled: true
  projectId: 12345
  sync:
    branches: { enabled: true }
    pullRequests: { enabled: true }
```

---

## Sync Directions

### Understanding Configuration Semantics

- **`platform.enabled`**: Platform is accessible (can read and write)
- **`platform.sync.[entity].enabled`**: Sync this entity **FROM** this platform **TO** the other

### Direction Examples

| GitHub sync      | GitLab sync      | Result             |
| ---------------- | ---------------- | ------------------ |
| `enabled: true`  | `enabled: true`  | ↔️ Bidirectional   |
| `enabled: true`  | `enabled: false` | ➡️ GitHub → GitLab |
| `enabled: false` | `enabled: true`  | ⬅️ GitLab → GitHub |
| `enabled: false` | `enabled: false` | ⛔ No sync         |

### Mixed Directional Sync

Different entities can sync in different directions:

```yaml
github:
  enabled: true
  sync:
    branches: { enabled: true } # Bidirectional
    pullRequests: { enabled: true } # GitHub → GitLab only

gitlab:
  enabled: true
  projectId: 12345
  sync:
    branches: { enabled: true } # Bidirectional
    pullRequests: { enabled: false } # Not from GitLab
```

**Result**: Branches sync both ways, PRs only from GitHub to GitLab.

---

## Configuration Options

### Platform Configuration

#### GitHub

```yaml
github:
  enabled: true # Enable GitHub operations
  owner: owner-name # Optional, defaults to GitHub context
  repo: repo-name # Optional, defaults to GitHub context
  sync: # Optional, see entity configuration below
    # ... entity settings
```

#### GitLab

```yaml
gitlab:
  enabled: true # Enable GitLab operations
  host: gitlab.com # Optional, for self-hosted GitLab
  projectId: 12345 # Recommended: GitLab project ID
  owner: owner-name # Optional, defaults to GitHub owner
  repo: repo-name # Optional, defaults to GitHub repo
  sync: # Optional, see entity configuration below
    # ... entity settings
```

**Note**: If `projectId` is provided, `owner` and `repo` are not required.

---

### Entity Configuration

Each platform has a `sync` section with these entities:

#### Branches

```yaml
branches:
  enabled: true # Enable branch sync
  protected: true # Sync protected branches
  pattern: '*' # Branch pattern (glob)

  historySync: # Handle divergent histories
    enabled: true
    strategy: 'merge-timelines' # merge-timelines | skip-diverged | force-match
    createMergeCommits: true
    mergeMessage: 'Sync: Merge timeline from {source} to {target}'

  botBranches: # Bot branch handling
    strategy: 'delete-orphaned' # delete-orphaned | sync | skip
    patterns: [] # Empty = use defaults
```

**Branch Patterns:**

```yaml
pattern: "*"           # All branches
pattern: "main"        # Only main
pattern: "feature/*"   # Feature branches
pattern: "main|dev"    # Multiple branches
```

**History Sync Strategies:**

- `merge-timelines` (default): Creates merge commits to preserve all history
- `skip-diverged`: Only syncs matching commits (conservative)
- `force-match`: Forces exact match (⚠️ destructive)

**Bot Branch Strategies:**

- `delete-orphaned` (default): Clean up orphaned bot branches in target
- `sync`: Treat bot branches like regular branches
- `skip`: Ignore bot branches completely

**Default Bot Patterns** (when `patterns: []`):

- `dependabot/*`, `renovate/*`, `copilot/*`
- `feature/*`, `fix/*`, `hotfix/*`, `bugfix/*`, `chore/*`, `docs/*`
- `refactor/*`, `test/*`, `ci/*`, `build/*`, `perf/*`, `style/*`
- `revert-*`, `temp-*`, `wip-*`, `draft-*`
- `^\d+-*`, `^[a-zA-Z]+-\d+` (issue/ticket branches)

#### Tags

```yaml
tags:
  enabled: true
  divergentCommitStrategy: 'skip' # skip | create-anyway
  pattern: '*' # Tag pattern
```

**Note**: Tags are auto-enabled if releases are enabled.

#### Releases

```yaml
releases:
  enabled: true
  divergentCommitStrategy: 'skip' # skip | create-anyway
  latestReleaseStrategy: 'point-to-latest' # point-to-latest | skip | create-anyway
  skipPreReleases: false
  pattern: '*' # Release pattern
  includeAssets: true
```

**Divergent Commit Strategies:**

- `skip` (default): Skip releases pointing to missing commits
- `create-anyway`: Create release even if commit doesn't exist

**Latest Release Strategies:**

- `point-to-latest` (default): Point to latest commit if original missing
- `skip`: Skip if commit doesn't exist
- `create-anyway`: Create even if commit doesn't exist

#### Pull Requests / Merge Requests

```yaml
pullRequests:
  enabled: false # Disabled by default (can be noisy)
  autoMerge: false

  comments: # Comment synchronization
    enabled: false
    attribution:
      includeAuthor: true
      includeTimestamp: true
      includeSourceLink: true
      format: 'quoted' # quoted | inline | minimal
    handleUpdates: true
    preserveFormatting: true
    syncReplies: true
```

**Comment Formats:**

**Quoted** (default):

```markdown
**💬 Comment by @username on GitHub** ([original](https://github.com/...))

> Original comment content here

---

_Synced from GitHub on 2024-01-15_
```

**Inline**:

```markdown
**@username** (GitHub): [🔗](https://github.com/...) Comment content
```

**Minimal**:

```markdown
Comment content — @username
```

#### Issues

```yaml
issues:
  enabled: false # Disabled by default (can be noisy)

  comments: # Same as pullRequests.comments
    enabled: false
    # ... same options
```

---

## Advanced Features

### Smart Dependencies

The action automatically enables dependencies:

- **Releases enabled** → Tags auto-enabled
- **Tags/Releases enabled** → historySync auto-enabled
- **PRs/Issues enabled** → Branches auto-enabled

You'll see warnings when dependencies are auto-enabled.

### Logical Defaults

Default priorities when `sync` section is omitted:

- ✅ **Enabled**: Branches (with historySync), Tags, Releases
- ❌ **Disabled**: Pull Requests, Issues, Comments

This provides sensible defaults for most use cases.

### Timeline Merging (TVA Approach)

When repositories have divergent commit histories, the action can:

1. **Merge timelines** (recommended): Preserve all developer work
2. **Skip diverged**: Only sync matching commits
3. **Force match**: Reset target to match source (⚠️ destructive)

Example:

```yaml
github:
  sync:
    branches:
      historySync:
        enabled: true
        strategy: 'merge-timelines'
        createMergeCommits: true
        mergeMessage: '🔄 Sync: {source} → {target}'
```

### Bot Branch Management

Automatically handle bot-created branches:

```yaml
# Clean up orphaned bot branches (default)
branches:
  botBranches:
    strategy: "delete-orphaned"
    patterns: []  # Use defaults

# Sync all branches including bots
branches:
  botBranches:
    strategy: "sync"

# Custom bot patterns
branches:
  botBranches:
    strategy: "delete-orphaned"
    patterns: ["dependabot/*", "my-bot/*"]
```

### Label Management

Labels are automatically managed:

- All original labels are preserved
- `synced` label is automatically added
- No configuration needed

### Performance Optimization

For large repositories:

```yaml
branches:
  pattern: 'main|release/*' # Specific patterns
releases:
  enabled: false # Skip if not needed
  pattern: 'v*' # Or use patterns
```

---

## Token Requirements

### Required Tokens

Tokens are needed for platforms you're syncing **FROM**:

| Sync Direction  | Required Tokens                 |
| --------------- | ------------------------------- |
| GitHub → GitLab | `GITHUB_TOKEN` + `GITLAB_TOKEN` |
| GitLab → GitHub | `GITLAB_TOKEN` + `GITHUB_TOKEN` |
| Bidirectional   | Both tokens                     |

**Note**: Both tokens are typically required because the target platform needs write access.

### Token Scopes

**GitHub Token:**

- `repo` - Full repository access
- `workflow` - Update workflows (if needed)

**GitLab Token:**

- `api` - Full API access
- Or: `read_repository` + `write_repository`

### Setting Tokens

```yaml
# In GitHub Actions workflow
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  GITLAB_TOKEN: ${{ secrets.GITLAB_TOKEN }}
```

---

## Complete Example

Full configuration with all options:

```yaml
github:
  enabled: true
  owner: my-org
  repo: my-repo
  sync:
    branches:
      enabled: true
      protected: true
      pattern: '*'
      historySync:
        enabled: true
        strategy: 'merge-timelines'
        createMergeCommits: true
        mergeMessage: 'Sync: Merge timeline from {source} to {target}'
      botBranches:
        strategy: 'delete-orphaned'
        patterns: []

    tags:
      enabled: true
      divergentCommitStrategy: 'skip'
      pattern: '*'

    releases:
      enabled: true
      divergentCommitStrategy: 'skip'
      latestReleaseStrategy: 'point-to-latest'
      skipPreReleases: false
      pattern: '*'
      includeAssets: true

    pullRequests:
      enabled: true
      autoMerge: false
      comments:
        enabled: true
        attribution:
          includeAuthor: true
          includeTimestamp: true
          includeSourceLink: true
          format: 'quoted'
        handleUpdates: true
        preserveFormatting: true
        syncReplies: true

    issues:
      enabled: true
      comments:
        enabled: false

gitlab:
  enabled: true
  host: 'gitlab.com'
  projectId: 12345
  sync:
    # Same structure as github.sync
```

---

## Next Steps

- [Examples](EXAMPLES.md) - Real-world configuration examples
- [Token Setup](TOKEN.md) - Detailed token configuration
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions
