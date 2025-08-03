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

### Pull Requests

| Option      | Description                 | Required | Default |
| ----------- | --------------------------- | -------- | ------- |
| `enabled`   | Enable PR sync              | No       | true    |
| `autoMerge` | Auto-merge synced PRs       | No       | false   |
| `labels`    | Labels to add to synced PRs | No       | synced  |

### Issues

| Option         | Description                    | Required | Default |
| -------------- | ------------------------------ | -------- | ------- |
| `enabled`      | Enable issue sync              | No       | true    |
| `syncComments` | Sync issue comments            | No       | false   |
| `labels`       | Labels to add to synced issues | No       | synced  |

### Releases and Tags

| Option    | Description             | Required | Default |
| --------- | ----------------------- | -------- | ------- |
| `enabled` | Enable release/tag sync | No       | true    |

> [!TIP]
>
> - Tags syncing is automatically enabled if releases syncing is enabled to avoid orphaning
>   releases.
> - Labels can be either a string or an array of strings.

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

    pullRequests:
      enabled: true
      autoMerge: false
      labels: ['synced']

    issues:
      enabled: true
      syncComments: false
      labels: ['synced']

    releases:
      enabled: true

    tags:
      enabled: true # automatically enabled if releases = true

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

    pullRequests:
      enabled: true
      autoMerge: false
      labels: ['synced']

    issues:
      enabled: true
      syncComments: false
      labels: ['synced']

    releases:
      enabled: true

    tags:
      enabled: true # automatically enabled if releases = true
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

## Performance Considerations

- Set `syncComments: false` for better performance
- Use specific branch patterns instead of "\*" if you have many branches
- Consider disabling releases/tags sync if not needed
- The action runs operations in parallel for better performance

## Next Steps

- [Token Setup Guide](token-setup.md) - Configure authentication tokens
- [Advanced Examples](examples.md) - Complex configuration scenarios
- [Troubleshooting](troubleshooting.md) - Common issues and solutions
