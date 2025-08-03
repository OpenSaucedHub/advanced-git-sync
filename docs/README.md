# Configuration Guide

This guide covers all configuration options for the GitHub GitLab Sync Action.

## Configuration File

Create a `.github/sync-config.yml` file in your repository to customize the sync behavior.

> **📝 YAML Array Support**: The action includes robust YAML parsing that handles various array
> formats. You can use either `["item1", "item2"]` or the standard YAML array syntax:
>
> ```yaml
> labels:
>   - item1
>   - item2
> ```

## Platform Configuration

### GitLab Configuration (`gitlab`)

| Option      | Description                   | Required | Default           |
| ----------- | ----------------------------- | -------- | ----------------- |
| `enabled`   | Enable GitLab synchronization | No       | true              |
| `host`      | GitLab instance URL           | No       | gitlab.com        |
| `owner`     | GitLab owner                  | No       | GitHub repo owner |
| `repo`      | GitLab repository name        | No       | GitHub repo name  |
| `projectId` | GitLab project ID             | No       | Auto-detected     |

> [!TIP]
>
> If `projectId` is provided, `owner` and `repo` are not required.

### GitHub Configuration (`github`)

| Option    | Description                   | Required | Default        |
| --------- | ----------------------------- | -------- | -------------- |
| `enabled` | Enable GitHub synchronization | No       | true           |
| `owner`   | GitHub owner                  | No       | GitHub context |
| `repo`    | GitHub repository name        | No       | GitHub context |

## Sync Configuration

### Branches

| Option      | Description             | Required | Default |
| ----------- | ----------------------- | -------- | ------- |
| `enabled`   | Enable branch sync      | No       | true    |
| `protected` | Sync protected branches | No       | true    |
| `pattern`   | Branch name pattern     | No       | "\*"    |

**Branch Pattern Examples:**

```yaml
pattern: "*"           # All branches
pattern: "main"        # Only main branch
pattern: "feature/*"   # All feature branches
pattern: "release/*"   # All release branches
```

#### Timeline Merging (Advanced)

When repositories have divergent commit histories, the action can handle them intelligently:

| Option                           | Description                          | Required | Default         |
| -------------------------------- | ------------------------------------ | -------- | --------------- |
| `historySync.enabled`            | Enable timeline merging              | No       | true            |
| `historySync.strategy`           | Timeline merging strategy            | No       | merge-timelines |
| `historySync.createMergeCommits` | Create merge commits for unification | No       | true            |
| `historySync.mergeMessage`       | Template for merge commit messages   | No       | See below       |

**Timeline Strategies:**

- **`merge-timelines`** (Recommended): Creates merge commits to unify divergent histories. Preserves
  all developer work.
- **`skip-diverged`**: Only syncs commits that exist on both repositories. Conservative approach.
- **`force-match`**: Forces one repository to match the other exactly. ⚠️ **Destructive** - can lose
  history.

**Default merge message template:**

```yaml
mergeMessage: 'Sync: Merge timeline from {source} to {target}'
```

**Example Timeline Configuration:**

```yaml
branches:
  enabled: true
  protected: true
  pattern: '*'
  historySync:
    enabled: true
    strategy: 'merge-timelines'
    createMergeCommits: true
    mergeMessage: '🔄 Timeline sync: Merge {source} → {target}'
```

### Pull Requests

| Option      | Description                 | Required | Default |
| ----------- | --------------------------- | -------- | ------- |
| `enabled`   | Enable PR sync              | No       | true    |
| `autoMerge` | Auto-merge synced PRs       | No       | false   |
| `labels`    | Labels to add to synced PRs | No       | synced  |

### Issues

| Option    | Description                    | Required | Default |
| --------- | ------------------------------ | -------- | ------- |
| `enabled` | Enable issue sync              | No       | true    |
| `labels`  | Labels to add to synced issues | No       | synced  |

### Releases

| Option    | Description         | Required | Default |
| --------- | ------------------- | -------- | ------- |
| `enabled` | Enable release sync | No       | true    |

#### Advanced Release Sync

When repositories have divergent commit histories, releases may point to commits that don't exist in
the target repository. The action provides intelligent strategies to handle these scenarios:

| Option                    | Description                                 | Required | Default         |
| ------------------------- | ------------------------------------------- | -------- | --------------- |
| `divergentCommitStrategy` | How to handle releases with missing commits | No       | skip            |
| `latestReleaseStrategy`   | Special handling for the latest release     | No       | point-to-latest |
| `skipPreReleases`         | Skip pre-release versions                   | No       | false           |
| `pattern`                 | Pattern to match release names              | No       | "\*"            |
| `includeAssets`           | Include release assets in sync              | No       | true            |

**Divergent Commit Strategies:**

- **`skip`** (Default): Skip releases pointing to commits that don't exist in target repository
- **`create-anyway`**: Create releases even if the commit doesn't exist in target
- **`point-to-latest`**: Point the release to the latest commit in the target repository

**Latest Release Strategies:**

- **`point-to-latest`** (Default): For the latest release, point to latest commit if original commit
  is missing
- **`skip`**: Skip the latest release if commit doesn't exist
- **`create-anyway`**: Create the latest release even if commit doesn't exist

**Example Release Configuration:**

```yaml
releases:
  enabled: true
  divergentCommitStrategy: 'skip'
  latestReleaseStrategy: 'point-to-latest'
  skipPreReleases: false
  pattern: 'v*'
  includeAssets: true
```

### Tags

| Option    | Description     | Required | Default |
| --------- | --------------- | -------- | ------- |
| `enabled` | Enable tag sync | No       | true    |

#### Advanced Tag Sync

| Option                    | Description                             | Required | Default |
| ------------------------- | --------------------------------------- | -------- | ------- |
| `divergentCommitStrategy` | How to handle tags with missing commits | No       | skip    |
| `pattern`                 | Pattern to match tag names              | No       | "\*"    |

**Example Tag Configuration:**

```yaml
tags:
  enabled: true
  divergentCommitStrategy: 'skip'
  pattern: 'v*'
```

> [!TIP]
>
> - Tags syncing is automatically enabled if releases syncing is enabled to avoid orphaning
>   releases.
> - The action intelligently handles repositories with different commit histories.
> - Latest releases get special treatment to ensure users always have access to the current version.

## Complete Default Configuration

This is the complete default configuration. If you don't want to sync a particular entity, set it to
`false`.

```yaml
# When you have gitlab.sync.[entity].enabled: true, entities will be synced FROM GitLab to GitHub
gitlab:
  enabled: true
  host: 'gitlab.com' # Optional, defaults to gitlab.com
  projectId: # optional, but recommended if present, you do not need owner and repo
  owner: # Optional, defaults to GitHub repo owner
  repo: # Optional, defaults to GitHub repo name
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

    pullRequests:
      enabled: true
      autoMerge: false
      labels: ['synced']

    issues:
      enabled: true
      labels: ['synced']

    releases:
      enabled: true
      divergentCommitStrategy: 'skip'
      latestReleaseStrategy: 'point-to-latest'
      skipPreReleases: false
      pattern: '*'
      includeAssets: true

    tags:
      enabled: true # automatically enabled if releases = true
      divergentCommitStrategy: 'skip'
      pattern: '*'

# When you have github.sync.[entity].enabled: true, entities will be synced FROM GitHub to GitLab
github:
  enabled: true
  owner: # Optional, defaults to GitHub owner
  repo: # Optional, defaults to GitHub repo name
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

    pullRequests:
      enabled: true
      autoMerge: false
      labels: ['synced']

    issues:
      enabled: true
      labels: ['synced']

    releases:
      enabled: true
      divergentCommitStrategy: 'skip'
      latestReleaseStrategy: 'point-to-latest'
      skipPreReleases: false
      pattern: '*'
      includeAssets: true

    tags:
      enabled: true # automatically enabled if releases = true
      divergentCommitStrategy: 'skip'
      pattern: '*'
```

## Configuration Behavior

> [!IMPORTANT]
>
> - If no config is provided, everything falls back to defaults.
> - In case of partial config, missing fields will default to `false`.
> - If `gitlab.enabled: true` or `github.enabled: true` is set with no other details, that
>   platform's defaults are populated. (The action assumes you meant to sync everything)
> - In case of an invalid config, the action will try to reason with your config.

## Label Configuration Examples

**Single label as string:**

```yaml
labels: 'synced'
```

**Multiple labels as array (recommended):**

```yaml
labels: ['synced', 'automated', 'cross-platform']
```

**No labels:**

```yaml
labels: []
```

## Timeline Merging & Divergent Histories

### Understanding Repository Divergence

When repositories are synchronized across different platforms, they often develop different commit
histories due to:

- **Different development workflows** on each platform
- **Platform-specific commits** (e.g., workflow files, platform configurations)
- **Timing differences** in when commits are made
- **Merge strategies** that create different commit SHAs

### The TVA Approach

This action takes inspiration from the Time Variance Authority (TVA) concept - instead of "pruning"
timelines (destroying history), we intelligently merge them to preserve all developer work.

#### Timeline Strategies Explained

**🔄 Merge Timelines (Recommended)**

```yaml
strategy: 'merge-timelines'
```

- Creates merge commits to unify divergent histories
- Preserves all developer work from both repositories
- Non-destructive approach that maintains full history
- Best for teams that value complete history preservation

**⏭️ Skip Diverged**

```yaml
strategy: 'skip-diverged'
```

- Only syncs commits that exist on both repositories
- Conservative approach that avoids conflicts
- May result in incomplete synchronization
- Good for repositories with very different purposes

**⚠️ Force Match (Destructive)**

```yaml
strategy: 'force-match'
```

- Forces one repository to exactly match the other
- **Destroys history** that doesn't exist on the source
- Should only be used when you want to completely reset one repository
- Requires careful consideration and team agreement

### Smart Release Handling

When releases point to commits that don't exist in the target repository:

**📦 Historical Releases**: Skipped by default to maintain integrity

**🏷️ Latest Release**: Gets special treatment - points to the latest commit in target repository

This ensures users always have access to the current version, even when commit histories diverge.

### Example Scenarios

**Scenario 1: Different Workflow Files**

```
GitHub: main branch with .github/workflows/
GitLab: main branch with .gitlab-ci.yml
```

**Solution**: Merge timelines creates a unified branch with both workflow systems.

**Scenario 2: Release Pointing to Missing Commit**

```
GitLab Release v2.0.0 → commit abc123 (doesn't exist on GitHub)
```

**Solution**: If it's the latest release, point it to GitHub's latest commit. Otherwise, skip it.

## Performance Considerations

- Use specific branch patterns instead of "\*" if you have many branches
- Consider disabling releases/tags sync if not needed
- The action runs operations in parallel for better performance
- Timeline merging adds some overhead but preserves complete history
- Use `skip-diverged` strategy for fastest performance with divergent repositories
- Release analysis is cached to avoid repeated commit existence checks

## Migration & Best Practices

### Migrating from Previous Versions

If you're upgrading from a previous version of advanced-git-sync:

1. **Existing configurations continue to work** - all new features have sensible defaults
2. **Timeline merging is enabled by default** - uses the safe `merge-timelines` strategy
3. **Release sync is enhanced** - but maintains backward compatibility

### Best Practices

#### For New Repository Synchronization

```yaml
# Recommended configuration for new sync setups
branches:
  historySync:
    strategy: 'merge-timelines' # Preserve all history
releases:
  latestReleaseStrategy: 'point-to-latest' # Keep latest accessible
  divergentCommitStrategy: 'skip' # Conservative for historical releases
```

#### For Existing Synchronized Repositories

```yaml
# Conservative configuration for existing setups
branches:
  historySync:
    strategy: 'skip-diverged' # Avoid disrupting existing sync
releases:
  divergentCommitStrategy: 'skip' # Maintain current behavior
```

#### For Repository Migration/Consolidation

```yaml
# When consolidating repositories or migrating platforms
branches:
  historySync:
    strategy: 'merge-timelines'
    mergeMessage: '🔄 Platform migration: Merge {source} → {target}'
releases:
  divergentCommitStrategy: 'create-anyway' # Preserve all releases
  latestReleaseStrategy: 'point-to-latest'
```

### Troubleshooting Timeline Issues

**Problem**: Merge conflicts during timeline merging **Solution**: The action automatically resolves
conflicts by accepting changes from the source repository

**Problem**: Too many merge commits cluttering history **Solution**: Use `createMergeCommits: false`
or switch to `skip-diverged` strategy

**Problem**: Releases pointing to wrong commits **Solution**: Review your `latestReleaseStrategy`
and `divergentCommitStrategy` settings

## Next Steps

- [Token Setup Guide](token-setup.md) - Configure authentication tokens
- [Advanced Examples](examples.md) - Complex configuration scenarios
- [Troubleshooting](troubleshooting.md) - Common issues and solutions
