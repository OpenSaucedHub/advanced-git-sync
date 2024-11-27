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
name: Sync with GitLab
on:
  push:
    branches: [main]
  pull_request:
    types: [opened, closed, reopened]
  issues:
    types: [opened, closed, reopened]
  release:
    types: [published]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4.2.2
        with:
          fetch-depth: 0

      - name: Sync with GitLab
        uses: OpenSaucedHub/git-sync-action@v1.1.1
        with:
          config_path: .github/sync-config.yml
```

2. Create a `.github/sync-config.yml` file with your sync configuration:

```yaml
gitlab:
  enabled: true
  url: 'gitlab.com' # Optional, defaults to gitlab.com
  token: ${{ secrets.GITLAB_TOKEN }}
  username: # Optional, defaults to GitHub repo owner
  repo: # Optional, defaults to GitHub repo name

gl-sync:
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
    syncComments: true
    labels: ['synced-from-github']

  releases:
    enabled: true

  tags:
    enabled: true # atomaticall enabled if releases = true

github:
  enabled: true
  token: ${{ secrets.GH_TOKEN }}
  username: # Optional, defaults to GitHub username
  repo: # Optional, defaults to GitHub repo name

gh-sync:
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
    syncComments: true
    labels: ['synced-from-gitlab']

  releases:
    enabled: true

  tags:
    enabled: true # atomaticall enabled if releases = true
```

3. Set up required secrets in your GitHub repository:
   - `GITLAB_TOKEN`: A GitLab personal access token with API access
   - `GH_TOKEN`: A GitHub personal access token (optional, defaults to `GITHUB_TOKEN`)

## Configuration Options

### GitLab Configuration (`gitlab`)

| Option     | Description                   | Required | Default           |
| ---------- | ----------------------------- | -------- | ----------------- |
| `enabled`  | Enable GitLab synchronization | Yes      | -                 |
| `url`      | GitLab instance URL           | No       | gitlab.com        |
| `token`    | GitLab personal access token  | Yes      | -                 |
| `username` | GitLab username               | No       | GitHub repo owner |
| `repo`     | GitLab repository name        | No       | GitHub repo name  |

### GitHub Configuration (`github`)

| Option     | Description                   | Required | Default        |
| ---------- | ----------------------------- | -------- | -------------- |
| `enabled`  | Enable GitHub synchronization | Yes      | -              |
| `token`    | GitHub personal access token  | Yes      | `GITHUB_TOKEN` |
| `username` | GitHub username               | No       | GitHub context |
| `repo`     | GitHub repository name        | No       | GitHub context |

### Sync Configuration (`gl-sync` and `gh-sync`)

#### Branches

| Option      | Description             | Required | Default |
| ----------- | ----------------------- | -------- | ------- |
| `enabled`   | Enable branch sync      | Yes      | -       |
| `protected` | Sync protected branches | No       | false   |
| `pattern`   | Branch name pattern     | No       | "\*"    |

#### Pull Requests

| Option      | Description                 | Required | Default |
| ----------- | --------------------------- | -------- | ------- |
| `enabled`   | Enable PR sync              | Yes      | -       |
| `autoMerge` | Auto-merge synced PRs       | No       | false   |
| `labels`    | Labels to add to synced PRs | No       | []      |

#### Issues

| Option         | Description                    | Required | Default |
| -------------- | ------------------------------ | -------- | ------- |
| `enabled`      | Enable issue sync              | Yes      | -       |
| `syncComments` | Sync issue comments            | No       | false   |
| `labels`       | Labels to add to synced issues | No       | []      |

#### Releases and Tags

| Option    | Description             | Required | Default |
| --------- | ----------------------- | -------- | ------- |
| `enabled` | Enable release/tag sync | Yes      | -       |

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

## Examples

### Basic Configuration

Minimal configuration to sync everything:

```yaml
gitlab:
  enabled: true
  token: ${{ secrets.GITLAB_TOKEN }}

gl-sync:
  branches:
    enabled: true
  pullRequests:
    enabled: true
  issues:
    enabled: true
  releases:
    enabled: true
  tags:
    enabled: true

github:
  enabled: true
  token: ${{ secrets.GH_TOKEN }}

gh-sync:
  branches:
    enabled: true
  pullRequests:
    enabled: true
  issues:
    enabled: true
  releases:
    enabled: true
  tags:
    enabled: true
```

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

1. Check the [Issues](https://github.com/OpenSaucedHub/git-sync-action/issues) page
2. Create a new issue if your problem isn't already listed
3. Provide as much context as possible

## Acknowledgments 🙏

- Inspired by [Sync to GitLab](https://github.com/marketplace/actions/sync-to-gitlab) action, just
  felt awful having to sync PRs/MRs, branches, releases and issues manually.
- Built with [TypeScript](https://www.typescriptlang.org/) and [Bun](https://bun.sh/)
- Uses the official [GitLab API](https://docs.gitlab.com/ee/api/) and
  [GitHub Actions](https://docs.github.com/en/actions) toolkit
