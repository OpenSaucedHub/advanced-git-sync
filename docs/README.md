# Documentation

Complete documentation for GitHub-GitLab sync operations.

## 📚 Documentation Index

### Getting Started

- **[Main README](../README.md)** - Quick start and overview
- **[Token Setup](TOKEN.md)** - Configure authentication tokens

### Configuration

- **[Configuration Guide](CONFIGURATION.md)** - Complete configuration reference
  - Quick start examples
  - Sync direction options
  - All configuration parameters
  - Advanced features
  - Token requirements

- **[Examples](EXAMPLES.md)** - Real-world configuration examples
  - Basic examples
  - Directional sync (one-way, bidirectional)
  - Advanced use cases
  - Workflow examples
  - Common patterns

### Advanced Topics

- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions
- **[Development](DEVELOPMENT.md)** - Contributing and development guide
- **[Contributing](contributing.md)** - How to contribute to the project

### Configuration Files

- **[sync-config-example.yml](sync-config-example.yml)** - Complete configuration template
- **[.github/sync-config-examples/](../.github/sync-config-examples/)** - Multiple example
  configurations

---

## Quick Links

### By Use Case

| Use Case                   | Link                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------- |
| Minimal bidirectional sync | [CONFIGURATION.md#quick-start](CONFIGURATION.md#quick-start)                            |
| One-way GitHub → GitLab    | [EXAMPLES.md#github--gitlab-one-way](EXAMPLES.md#directional-sync)                      |
| One-way GitLab → GitHub    | [EXAMPLES.md#gitlab--github-one-way](EXAMPLES.md#directional-sync)                      |
| Bot branch management      | [CONFIGURATION.md#bot-branch-management](CONFIGURATION.md#advanced-features)            |
| Comment synchronization    | [CONFIGURATION.md#pull-requests--merge-requests](CONFIGURATION.md#entity-configuration) |
| Divergent history handling | [CONFIGURATION.md#timeline-merging](CONFIGURATION.md#advanced-features)                 |

### By Topic

| Topic                     | Link                                                                       |
| ------------------------- | -------------------------------------------------------------------------- |
| Sync directions explained | [CONFIGURATION.md#sync-directions](CONFIGURATION.md#sync-directions)       |
| Branch configuration      | [CONFIGURATION.md#branches](CONFIGURATION.md#entity-configuration)         |
| Release configuration     | [CONFIGURATION.md#releases](CONFIGURATION.md#entity-configuration)         |
| Token scopes              | [CONFIGURATION.md#token-requirements](CONFIGURATION.md#token-requirements) |
| Performance optimization  | [EXAMPLES.md#performance-optimized](EXAMPLES.md#advanced-use-cases)        |
| Multiple sync schedules   | [EXAMPLES.md#multiple-sync-frequencies](EXAMPLES.md#workflow-examples)     |

---

## Documentation Structure

```
docs/
├── README.md                    # This file - documentation index
├── CONFIGURATION.md             # Complete configuration reference
├── EXAMPLES.md                  # Real-world examples
├── TOKEN.md              # Token configuration guide
├── TROUBLESHOOTING.md          # Common issues and solutions
├── DEVELOPMENT.md              # Development guide
└── sync-config-example.yml     # Complete config template

.github/sync-config-examples/
├── minimal-github-to-gitlab.yml
├── unidirectional-github-to-gitlab.yml
├── unidirectional-gitlab-to-github.yml
├── bidirectional-full.yml
└── mixed-directional.yml
```

---

## Getting Help

- **Issues**: Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) first
- **Questions**: Open a
  [GitHub Discussion](https://github.com/OpenSaucedHub/advanced-git-sync/discussions)
- **Bugs**: Report on [GitHub Issues](https://github.com/OpenSaucedHub/advanced-git-sync/issues)
- **Contributing**: See [contributing.md](contributing.md)
