# GitHub GitLab Sync Action

A powerful GitHub Action that provides bi-directional synchronization between GitHub and GitLab
repositories. This action helps maintain consistency across platforms by syncing branches, pull
requests, issues, releases, and tags.

## Features

- 🔄 **Bi-directional Synchronization**: Sync from GitHub to GitLab and vice versa
- 🌳 **Branch Synchronization**: Keep branches in sync across platforms
- 🔀 **Pull Request/Merge Request Sync**: Synchronize pull requests with corresponding merge
  requests
- 📝 **Issue Tracking**: Keep issues and their comments in sync
- 🏷️ **Release Management**: Sync releases and tags across platforms
- ⚙️ **Configurable**: Extensive configuration options for fine-grained control
- 🔒 **Protected Resources**: Support for protected branches and resources
- 🏷️ **Label Management**: Automatic labeling of synced resources

## Setup

1. Create a `.github/workflows/sync.yml` file in your repository:

```yaml
name: Sync to GitLab
on:
  push:
    branches: [main]
  pull_request:
    types: [opened, closed, reopened]
  issues:
    types: [opened, closed, reopened]
  release:
    types: [published]
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write

    steps:
      - name: Sync with GitLab
        uses: OpenSaucedHub/advanced-git-sync@v1.0.2
        with:
          CONFIG_PATH: .github/sync-config.yml # optional, defaults to .github/sync-config.yml
          GITLAB_TOKEN: ${{ secrets.GITLAB_TOKEN }} # optional, unless you want to sync to GitLab
          GITHUB_TOKEN: ${{ secrets.GH_TOKEN }} # Optional, defaults to GITHUB_TOKEN
```

2. Create a `.github/sync-config.yml` file with your sync configuration:

```yaml
#sync-config.yml
# When you have gitlab.sync.[entity].enabled: true, it means those entities will be synced FROM GitHub TO GitLab
gitlab:
  enabled: true
  username: # Optional, defaults to GitHub repo owner

# When you have github.sync.[entity].enabled: true, it means those entities will be synced FROM GitLab TO GitHub
github:
  enabled: true
```

> [!INFO]
>
> - If no config is provided, everything falls back to defaults.
> - In case of partial config, missing fields will default to `false`.
> - If `gitlab.enabled: true` or `github.enabled: true` is set with no other details, that
>   platform's defaults are populated. (The action assumes you meant to sync everything)
> - In case of an invalid config, the action will try to reason with your config.
> - [See Accepted Configuration](#accepted-configuration) for the defaults.

3. Set up required secrets in your GitHub repository:

- `GITLAB_TOKEN`: A GitLab personal access token with API access
- `GH_TOKEN`: A GitHub personal access token (optional, defaults to `GITHUB_TOKEN`)

## Configuration Options

### GitLab Configuration (`gitlab`)

| Option     | Description                   | Required | Default           |
| ---------- | ----------------------------- | -------- | ----------------- |
| `enabled`  | Enable GitLab synchronization | No       | true              |
| `url`      | GitLab instance URL           | No       | gitlab.com        |
| `username` | GitLab username               | No       | GitHub repo owner |
| `repo`     | GitLab repository name        | No       | GitHub repo name  |

### GitHub Configuration (`github`)

| Option     | Description                   | Required | Default        |
| ---------- | ----------------------------- | -------- | -------------- |
| `enabled`  | Enable GitHub synchronization | No       | true           |
| `username` | GitHub username               | No       | GitHub context |
| `repo`     | GitHub repository name        | No       | GitHub context |

### Sync Configuration

#### Branches

| Option      | Description             | Required | Default |
| ----------- | ----------------------- | -------- | ------- |
| `enabled`   | Enable branch sync      | No       | true    |
| `protected` | Sync protected branches | No       | true    |
| `pattern`   | Branch name pattern     | No       | "\*"    |

#### Pull Requests

| Option      | Description                 | Required | Default                   |
| ----------- | --------------------------- | -------- | ------------------------- |
| `enabled`   | Enable PR sync              | No       | true                      |
| `autoMerge` | Auto-merge synced PRs       | No       | false                     |
| `labels`    | Labels to add to synced PRs | No       | synced-from-github/gitlab |

#### Issues

| Option         | Description                    | Required | Default                   |
| -------------- | ------------------------------ | -------- | ------------------------- |
| `enabled`      | Enable issue sync              | No       | true                      |
| `syncComments` | Sync issue comments            | No       | false                     |
| `labels`       | Labels to add to synced issues | No       | synced-from-github/gitlab |

#### Releases and Tags

| Option    | Description             | Required | Default |
| --------- | ----------------------- | -------- | ------- |
| `enabled` | Enable release/tag sync | No       | true    |

## Accepted Configuration

This is the expected config and hence the defaults. If you don't want to sync a particular entity,
set it to `false`.

```yaml
#sync-config.yml
# When you have gitlab.sync.[entity].enabled: true, it means those entities will be synced FROM GitHub TO GitLab
gitlab:
  enabled: true
  url: 'gitlab.com' # Optional, defaults to gitlab.com
  username: # Optional, defaults to GitHub repo owner
  repo: # Optional, defaults to GitHub repo name
  sync:
    branches:
      enabled: true
      protected: true
      pattern: '*'

    pullRequests:
      enabled: true
      autoMerge: false
      labels: ['synced-from-github']

    issues:
      enabled: true
      syncComments: false
      labels: ['synced-from-github']

    releases:
      enabled: true

    tags:
      enabled: true # automatically enabled if releases = true

# When you have github.sync.[entity].enabled: true, it means those entities will be synced FROM GitLab TO GitHub
github:
  enabled: true
  username: # Optional, defaults to GitHub username
  repo: # Optional, defaults to GitHub repo name
  sync:
    branches:
      enabled: true
      protected: true
      pattern: '*'

    pullRequests:
      enabled: true
      autoMerge: false
      labels: ['synced-from-gitlab']

    issues:
      enabled: true
      syncComments: false
      labels: ['synced-from-gitlab']

    releases:
      enabled: true

    tags:
      enabled: true # automatically enabled if releases = true
```

## Token Permissions

### GitLab Token

The GitLab token needs the following permissions:

- `api` - Full API access
- `read_repository` - Read repository
- `write_repository` - Write repository

### GitHub Token

The GitHub token needs the following permissions:

- `repo` - Full repository access
- `workflow` - Workflow access

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open
an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the
[LICENSE](https://github.com/OpenSaucedHub/.github/blob/main/.github/LICENSE.md) file for details.

## Security 🔐

- The action uses token-based authentication for secure operations
- Tokens are never exposed in logs or outputs
- Protected branch settings are respected
- All API calls use HTTPS

## Support 💬

For support, please:

1. Check the [Issues](https://github.com/OpenSaucedHub/advanced-git-sync/issues) page
2. Create a new issue if your problem isn't already listed
3. Provide as much context as possible

## Acknowledgments 🙏

- Inspired by [Sync to GitLab](https://github.com/marketplace/actions/sync-to-gitlab) action, just
  felt awful having to sync PRs/MRs, branches, releases and issues manually.
- Built with [TypeScript](https://www.typescriptlang.org/) and [Bun](https://bun.sh/)
- Uses the official [GitLab API](https://docs.gitlab.com/ee/api/) and
  [GitHub Actions](https://docs.github.com/en/actions) toolkit
