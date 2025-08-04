<div align="center">

[![wakatime](https://wakatime.com/badge/github/OpenSaucedHub/advanced-git-sync.svg)](https://wakatime.com/badge/github/OpenSaucedHub/advanced-git-sync)
[![Releases](https://github.com/OpenSaucedHub/advanced-git-sync/actions/workflows/release.yml/badge.svg)](https://github.com/OpenSaucedHub/advanced-git-sync/actions/workflows/release.yml)
[![CLA Assistant](https://github.com/OpenSaucedHub/advanced-git-sync/actions/workflows/cla.yml/badge.svg)](https://github.com/OpenSaucedHub/advanced-git-sync/actions/workflows/cla.yml)

</div>

# GitHub GitLab Sync Action

A powerful GitHub Action that provides bi-directional synchronization between GitHub and GitLab
repositories. Keep your projects in sync across platforms automatically.

## ✨ Key Features

- 🔄 **Bi-directional sync** between GitHub and GitLab
- 🌳 **Branches, PRs/MRs, issues, releases, and tags**
- 💬 **Enhanced comment synchronization** with proper attribution
- ⚙️ **Highly configurable** with sensible defaults
- 🔒 **Secure** with token-based authentication
- 🏷️ **Smart labeling** of synced content

## 🚀 Quick Start

### 1. Create Workflow File

Create `.github/workflows/sync.yml`:

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
      contents: write
      pull-requests: write
      issues: write

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4.2.2

      - name: Sync with GitLab
        uses: OpenSaucedHub/advanced-git-sync@v1.2.3
        with:
          GITLAB_TOKEN: ${{ secrets.GITLAB_TOKEN }}
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
```

### 2. Set Up Tokens

Add these secrets to your GitHub repository:

- `GITLAB_TOKEN`: GitLab personal access token with `api` scope
- `GH_TOKEN`: GitHub personal access token with `workflow` scope (required for syncing workflow
  files)

> **⚠️ Important**: If your sync includes workflow files (`.github/workflows/`), you **must** use a
> Personal Access Token with the `workflow` scope instead of the default `GITHUB_TOKEN`. The default
> token cannot modify workflow files for security reasons.

### 3. Basic Configuration (Optional)

Create `.github/sync-config.yml` for custom settings:

```yaml
gitlab:
  enabled: true
  projectId: 12345 # Your GitLab project ID

github:
  enabled: true
```

That's it! The action will sync everything by default. 🎉

## 📖 Documentation

For detailed configuration and advanced usage:

- **[Configuration Guide](docs/README.md)** - Complete configuration options and examples
- **[Token Setup](docs/token-setup.md)** - Detailed token permissions and setup instructions
- **[Advanced Examples](docs/examples.md)** - Complex configuration scenarios
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues and solutions

## 🤝 Need Help?

- 📋 [Configuration Examples](docs/sync-config-example.yml) - Ready-to-use configuration templates
- 🐛 [Report Issues](https://github.com/OpenSaucedHub/advanced-git-sync/issues) - Found a bug or
  have a feature request?
- 💬 [Discussions](https://github.com/OpenSaucedHub/advanced-git-sync/discussions) - Ask questions
  and share ideas

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/contributing.md) for details.

## 📄 License

MIT License - see the
[LICENSE](https://github.com/OpenSaucedHub/.github/blob/main/.github/LICENSE.md) file for details.

---

<div align="center">

**Built with ❤️ using [TypeScript](https://www.typescriptlang.org/) and [Bun](https://bun.sh/)**

_Inspired by the need for seamless cross-platform development workflows_

</div>
