# Configuration Guide

This guide covers all configuration options for the GitHub GitLab Sync Action.

## Configuration File

Create a `.github/sync-config.yml` file in your repository to customize the sync behavior.

**📝 YAML Array Support**: The action includes robust YAML parsing that handles various array
formats. You can use either `["item1", "item2"]` or the standard YAML array syntax:

```yaml
labels:
  - item1
  - item2
```

## 🧠 Intelligent Defaults & Dependencies

The action uses **logical priority-based defaults** with automatic dependency management:

### Priority Levels:

- **🔴 CRITICAL (enabled by default)**: Branches + historySync - foundation for everything
- **🟡 HIGH (enabled by default)**: Tags, Releases - core sync features most users want
- **🟠 MEDIUM (disabled by default)**: Pull Requests, Issues - can be noisy, user preference
- **🔵 LOW (disabled by default)**: Comments - very noisy, advanced feature

### Smart Dependencies:

- **Releases enabled** → automatically enables **Tags** (releases need tags)
- **Tags/Releases enabled** → automatically enables **historySync** (proper timeline needed)
- **Pull Requests/Issues enabled** → automatically enables **Branches** (PRs/issues need branches)

## Complete Default Configuration

This shows the complete default configuration with the logical defaults:

```yaml
# When you have gitlab.sync.[entity].enabled: true, entities will be synced FROM GitLab to GitHub
gitlab:
  enabled: true
  host: 'gitlab.com' # Optional, defaults to gitlab.com
  projectId: # optional, but recommended if present, you do not need owner and repo
  owner: # Optional, defaults to GitHub repo owner
  repo: # Optional, defaults to GitHub repo name
  sync:
    # 🔴 CRITICAL: Foundation for all sync operations (enabled by default)
    branches:
      enabled: true
      protected: true
      pattern: '*'
      historySync:
        enabled: true # Always enabled - required for proper timeline sync
        strategy: 'merge-timelines'
        createMergeCommits: true
        mergeMessage: 'Sync: Merge timeline from {source} to {target}'
      botBranches:
        strategy: 'delete-orphaned' # 'delete-orphaned' | 'sync' | 'skip'
        patterns: [] # Empty = use defaults, populated = override defaults entirely

    # 🟡 HIGH: Core sync features - most users want these (enabled by default)
    tags:
      enabled: true # Auto-enabled if releases are enabled
      divergentCommitStrategy: 'skip'
      pattern: '*'

    releases:
      enabled: true
      divergentCommitStrategy: 'skip'
      latestReleaseStrategy: 'point-to-latest'
      skipPreReleases: false
      pattern: '*'
      includeAssets: true

    # 🟠 MEDIUM: Social features - can be noisy (disabled by default)
    pullRequests:
      enabled: false # Changed: Can be overwhelming, user choice
      autoMerge: false
      # Labels: Automatically syncs all original labels + adds 'synced' label
      comments:
        enabled: false # 🔵 LOW: Very noisy, advanced feature
        attribution:
          includeAuthor: true
          includeTimestamp: true
          includeSourceLink: true
          format: 'quoted' # quoted | inline | minimal
        handleUpdates: true
        preserveFormatting: true
        syncReplies: true

    issues:
      enabled: false # Changed: Can be very noisy, user choice
      # Labels: Automatically syncs all original labels + adds 'synced' label
      comments:
        enabled: false # 🔵 LOW: Very noisy, advanced feature
        attribution:
          includeAuthor: true
          includeTimestamp: true
          includeSourceLink: true
          format: 'quoted' # quoted | inline | minimal
        handleUpdates: true
        preserveFormatting: true
        syncReplies: true

# When you have github.sync.[entity].enabled: true, entities will be synced FROM GitHub to GitLab
github:
  enabled: true
  owner: # Optional, defaults to GitHub owner
  repo: # Optional, defaults to GitHub repo name
  sync:
    # 🔴 CRITICAL: Foundation for all sync operations (enabled by default)
    branches:
      enabled: true
      protected: true
      pattern: '*'
      historySync:
        enabled: true # Always enabled - required for proper timeline sync
        strategy: 'merge-timelines'
        createMergeCommits: true
        mergeMessage: 'Sync: Merge timeline from {source} to {target}'
      botBranches:
        strategy: 'delete-orphaned' # 'delete-orphaned' | 'sync' | 'skip'
        patterns: [] # Empty = use defaults, populated = override defaults entirely

    # 🟡 HIGH: Core sync features - most users want these (enabled by default)
    tags:
      enabled: true # Auto-enabled if releases are enabled
      divergentCommitStrategy: 'skip'
      pattern: '*'

    releases:
      enabled: true
      divergentCommitStrategy: 'skip'
      latestReleaseStrategy: 'point-to-latest'
      skipPreReleases: false
      pattern: '*'
      includeAssets: true

    # 🟠 MEDIUM: Social features - can be noisy (disabled by default)
    pullRequests:
      enabled: false # Changed: Can be overwhelming, user choice
      autoMerge: false
      # Labels: Automatically syncs all original labels + adds 'synced' label
      comments:
        enabled: false # 🔵 LOW: Very noisy, advanced feature
        attribution:
          includeAuthor: true
          includeTimestamp: true
          includeSourceLink: true
          format: 'quoted' # quoted | inline | minimal
        handleUpdates: true
        preserveFormatting: true
        syncReplies: true

    issues:
      enabled: false # Changed: Can be very noisy, user choice
      # Labels: Automatically syncs all original labels + adds 'synced' label
      comments:
        enabled: false # 🔵 LOW: Very noisy, advanced feature
        attribution:
          includeAuthor: true
          includeTimestamp: true
          includeSourceLink: true
          format: 'quoted' # quoted | inline | minimal
        handleUpdates: true
        preserveFormatting: true
        syncReplies: true
```

## Configuration Behavior

> [!IMPORTANT]
>
> - **Smart Defaults**: Uses logical priority-based defaults (core features enabled, social features
>   disabled)
> - **Automatic Dependencies**: Automatically enables required features (e.g., tags when releases
>   are enabled)
> - **Chronological Execution**: Sync operations run in dependency order (branches → tags → releases
>   → PRs → issues)
> - **Partial Config Support**: Missing fields use intelligent defaults, not just `false`
> - **Config Reasoning**: Invalid configs are automatically corrected when possible
> - **Platform Defaults**: If `gitlab.enabled: true` or `github.enabled: true` with no details,
>   logical defaults apply

## Platform Configuration

### GitLab Configuration (`gitlab`)

| Option      | Description                   | Required | Default           |
| ----------- | ----------------------------- | -------- | ----------------- |
| `enabled`   | Enable GitLab synchronization | No       | true              |
| `host`      | GitLab instance URL           | No       | gitlab.com        |
| `owner`     | GitLab owner                  | No       | GitHub repo owner |
| `repo`      | GitLab repository name        | No       | GitHub repo name  |
| `projectId` | GitLab project ID             | No       | Auto-detected     |

<br>

> [!TIP]
>
> If `projectId` is provided, `owner` and `repo` are not required.

<br>

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

### Bot Branch Handling

Advanced Git Sync provides intelligent handling of bot-created branches (dependabot, renovate,
copilot, etc.) to prevent orphaned branches and maintain clean repositories.

**Configuration Options:**

| Option     | Description                                     | Required | Default             |
| ---------- | ----------------------------------------------- | -------- | ------------------- |
| `strategy` | How to handle bot branches                      | No       | `delete-orphaned`   |
| `patterns` | Custom bot branch patterns (overrides defaults) | No       | `[]` (use defaults) |

**Bot Branch Strategies:**

- **`delete-orphaned`** (Default): Delete bot branches that exist only in target repository (cleanup
  orphaned branches)
- **`sync`**: Treat bot branches like regular branches - sync bidirectionally
- **`skip`**: Skip bot branches entirely (don't sync or delete)

**Default Bot Patterns:** When `patterns: []` (empty), these patterns are automatically detected as
bot branches:

- `dependabot/*`, `renovate/*`, `copilot/*` - Dependency/AI bots
- `feature/*`, `fix/*`, `hotfix/*`, `bugfix/*`, `chore/*`, `docs/*`, `refactor/*`, `test/*`, `ci/*`,
  `build/*`, `perf/*`, `style/*` - Standard Git flow
- `revert-*`, `temp-*`, `wip-*`, `draft-*` - Temporary branches
- `^\d+-*`, `^[a-zA-Z]+-\d+` - Issue/ticket branches (123-fix-bug, JIRA-456)

**Custom Patterns:**

```yaml
botBranches:
  strategy: 'delete-orphaned'
  patterns:
    - 'dependabot/*'
    - 'my-company-bot/*'
    - 'automated-*'
    # Only these patterns are considered bots (defaults ignored)
```

**Example Configurations:**

```yaml
# Default behavior - clean up orphaned bot branches
branches:
  botBranches:
    strategy: 'delete-orphaned' # Clean up orphaned bot branches
    patterns: [] # Use default bot patterns

# Sync all branches including bots
branches:
  botBranches:
    strategy: 'sync' # Treat bot branches like regular branches

# Custom bot patterns only
branches:
  botBranches:
    strategy: 'delete-orphaned'
    patterns: ['dependabot/*', 'my-bot/*'] # Only these are bots
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

#### 💬 Comment Synchronization

Both issues and pull requests support enhanced comment synchronization with proper attribution. This
powerful feature maintains complete discussion context across GitHub and GitLab platforms.

**Quick Start:**

```yaml
github:
  sync:
    issues:
      comments:
        enabled: true
        attribution:
          format: quoted # quoted, inline, or minimal
          includeAuthor: true
          includeTimestamp: true
          includeSourceLink: true
        handleUpdates: true
        preserveFormatting: true
    pullRequests:
      comments:
        enabled: true
        # Same options as issues
```

**Comment Attribution Formats:**

**1. Quoted Format (Default)** - Clearest attribution, recommended for most use cases:

```markdown
**💬 Comment by @username on GitHub**
([original](https://github.com/user/repo/issues/123#issuecomment-456))

> This is the original comment content that would be quoted and properly attributed to maintain
> discussion context.

---

_Synced from GitHub on 2024-01-15_
```

**2. Inline Format** - Compact representation:

```markdown
**@username** (GitHub): [🔗](https://github.com/user/repo/issues/123#issuecomment-456) This is the
comment content with inline attribution.
```

**3. Minimal Format** - Least visual clutter:

```markdown
This is the comment content with minimal attribution. — @username
```

**Configuration Options:**

| Option                          | Type    | Default    | Description                              |
| ------------------------------- | ------- | ---------- | ---------------------------------------- |
| `enabled`                       | boolean | `false`    | Enable/disable comment synchronization   |
| `attribution.includeAuthor`     | boolean | `true`     | Include original comment author          |
| `attribution.includeTimestamp`  | boolean | `true`     | Include sync timestamp                   |
| `attribution.includeSourceLink` | boolean | `true`     | Include link to original comment         |
| `attribution.format`            | string  | `"quoted"` | Format: `quoted`, `inline`, or `minimal` |
| `handleUpdates`                 | boolean | `true`     | Sync comment edits and updates           |
| `preserveFormatting`            | boolean | `true`     | Preserve markdown formatting             |
| `syncReplies`                   | boolean | `true`     | Include comment threads and replies      |

**Key Features:**

- **Intelligent Deduplication** - Prevents duplicate comments
- **Markdown Preservation** - Maintains code blocks, links, formatting
- **@Mention Escaping** - Prevents unwanted notifications (`@user` → `\@user`)
- **Update Handling** - Syncs comment edits and modifications
- **Source Links** - Direct links to original comments
- **Error Resilience** - Graceful handling of API failures

**Important Considerations:**

- Comment sync adds API calls and may increase sync duration
- Be aware of platform rate limits (GitHub: 5,000/hour, GitLab: 2,000/minute)
- Comments are disabled by default to maintain backward compatibility

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

**Divergent Commit Strategies for Tags:**

- **`skip`** (Default): Skip tags pointing to commits that don't exist in target repository
- **`create-anyway`**: Create tags even if the commit doesn't exist in target

**Example Tag Configuration:**

```yaml
tags:
  enabled: true
  divergentCommitStrategy: 'skip' # skip | create-anyway
  pattern: 'v*'
```

<br>

> [!IMPORTANT]
>
> - Tags syncing is automatically enabled if releases syncing is enabled to avoid orphaning
>   releases.
> - The action intelligently handles repositories with different commit histories.
> - Latest releases get special treatment to ensure users always have access to the current version.

<br>

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

**Historical Releases**: Skipped by default to maintain integrity

**Latest Release**: Gets special treatment - points to the latest commit in target repository

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

## Next Steps

- [Token Setup Guide](token-setup.md) - Configure authentication tokens
- [Advanced Examples](examples.md) - Complex configuration scenarios
- [Troubleshooting](troubleshooting.md) - Common issues and solutions
