# Git Sync Action 🔄

A powerful GitHub Action that provides advanced synchronization between GitHub and GitLab
repositories, including two-way sync for branches, pull requests/merge requests, and issues.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/OpenSaucedHub/.github/blob/main/.github/LICENSE.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

## Features ✨

- 🌳 **Branch Synchronization**: Automatically sync branches between GitHub and GitLab
- 🔄 **Pull Request/Merge Request Sync**: Keep PRs and MRs in sync across platforms
- 📝 **Issue Synchronization**: Mirror issues between repositories
- ⚙️ **Flexible Configuration**: Customize sync behavior via YAML configuration
- 🔒 **Secure**: Uses token-based authentication for secure operations
- 🎯 **Selective Sync**: Configure which elements to sync using patterns and filters

## Usage 🚀

1. Add the action to your workflow:

```yaml
name: Sync to GitLab
on:
  push:
    branches: [main, develop]
  pull_request:
    types: [opened, closed, synchronized]
  issues:
    types: [opened, closed, edited]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Sync to GitLab
        uses: OpenSaucedHub/git-sync-action@v1.0.0
        with:
          gitlab_url: ${{ secrets.GITLAB_URL }}
          gitlab_token: ${{ secrets.GITLAB_TOKEN }}
          gitlab_username: ${{ secrets.GITLAB_USERNAME }}
          config_path: .github/git-sync.yml # Optional
```

2. Create a configuration file (`.github/git-sync.yml`):

```yaml
gitlab:
  url: ${GITLAB_URL}
  token: ${GITLAB_TOKEN}
  username: ${GITLAB_USERNAME}

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
    syncComments: true
    labels: ['synced-from-github']
```

## Configuration Options 🛠️

### GitLab Settings

| Option     | Description                  | Required |
| ---------- | ---------------------------- | -------- |
| `url`      | GitLab instance URL          | Yes      |
| `token`    | GitLab Personal Access Token | Yes      |
| `username` | GitLab username              | Yes      |

### Sync Settings

#### Branches

```yaml
branches:
  enabled: true # Enable/disable branch syncing
  protected: true # Sync protected branches
  pattern: '*' # Branch name pattern to sync
```

#### Pull Requests

```yaml
pullRequests:
  enabled: true # Enable/disable PR syncing
  autoMerge: false # Auto-merge synchronized PRs
  labels: ['synced'] # Labels to add to synced PRs
```

#### Issues

```yaml
issues:
  enabled: true # Enable/disable issue syncing
  syncComments: true # Sync issue comments
  labels: ['synced'] # Labels to add to synced issues
```

## Development 🔧

### Prerequisites

- Bun v1.1.37 or higher. If you do not use bun for your projects, try it and thank me later.

```bash
curl -fsSL https://bun.sh/install | bash
```

### Setup

1. Clone the repository:

```bash
git clone https://github.com/OpenSaucedHub/git-sync-action.git
cd git-sync-action
```

2. Install dependencies:

```bash
bun install
```

3. Build the project:

```bash
bun run build
```

### Available Scripts

- `bun run build`: Build the TypeScript project
- `bun run test`: Run tests // TODO
- `bun run lint`: Lint the codebase
- `bun run f`: Format code using Prettier

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open
an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
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
  felt awful having to sync PR/MS, branches and issues manually.
- Built with [TypeScript](https://www.typescriptlang.org/) and [Bun](https://bun.sh/)
- Uses the official [GitLab API](https://docs.gitlab.com/ee/api/) and
  [GitHub Actions](https://docs.github.com/en/actions) toolkit
