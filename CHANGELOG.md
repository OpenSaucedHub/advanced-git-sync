# 📦 Changelog

All notable changes to this project will be documented in this file.


# [v1.0.3](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.2...v1.0.3) (2024-12-01)



## [1.0.3](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.2...v1.0.3) (2024-12-01)

### Bug Fixes

* Remove lodash dependency and update permission validation methods for GitHub and GitLab clients ([1de581a](https://github.com/OpenSaucedHub/advanced-git-sync/commit/1de581ac07779273fdb3c7d1796c04ed626d7bca))

# [v1.0.2](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.1...v1.0.2) (2024-12-01)

## [1.0.2](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.1...v1.0.2) (2024-12-01)

### Bug Fixes

- Add configuration loading and validation functions; implement permission checks and token
  management, and lots, lots more fixes
  ([a07bf4c](https://github.com/OpenSaucedHub/advanced-git-sync/commit/a07bf4cb15707a699478d0c4327a5f6843b03248))

# [v1.0.1](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.0...v1.0.1) (2024-11-29)

## [1.0.1](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.0...v1.0.1) (2024-11-29)

### Bug Fixes

- Add getRepoInfo method to GitLabClient and GitHubClient; update logging messages for consistency
  ([2838bb7](https://github.com/OpenSaucedHub/advanced-git-sync/commit/2838bb7644da4b65d29accacc89c4beb46116719))

# v1.0.0 (2024-11-29)

## 1.0.0 (2024-11-29)

### Features

- Add initial better implementation for GitHub and GitLab synchronization, including configuration
  and utility functions
  ([edc2810](https://github.com/OpenSaucedHub/advanced-git-sync/commit/edc28105b0389b7446ee7e4f935f076dc5b2da8a))
- Add initial project structure with configuration and service files
  ([9633449](https://github.com/OpenSaucedHub/advanced-git-sync/commit/963344985e1c20bda03503f4a3609a75a78b0b1a))
- Update type exports and remove unused common types; enhance sync functionality for branches, pull
  requests, issues, and releases
  ([b53d628](https://github.com/OpenSaucedHub/advanced-git-sync/commit/b53d6281a8fd48167457980bfdd8bb221b4349a3))

### Bug Fixes

- Enhance configuration loading and error handling; improve logging for GitLab and GitHub tokens
  [skip ci]
  ([76ee96c](https://github.com/OpenSaucedHub/advanced-git-sync/commit/76ee96cd2f0eaac00112f2a07ce558425c3d29b6))
- Enhance Dependabot configuration and update README for clarity; backup and restore original
  dependencies in action
  ([b9db11d](https://github.com/OpenSaucedHub/advanced-git-sync/commit/b9db11dfca21135a080a5a889ab48c7919c2a65b))
- Implement default configuration and enhance sync functionality for GitHub and GitLab, fix
  authentication errors
  ([957b79b](https://github.com/OpenSaucedHub/advanced-git-sync/commit/957b79b4a4ed9274b9f4aff002c4cc660cbb8dfe))
- Refactor configuration handling; introduce validation for GitHub and GitLab tokens, and update
  type exports
  ([53d0a41](https://github.com/OpenSaucedHub/advanced-git-sync/commit/53d0a417879c88e23f3bce4d36718ddcad4e8cf1))
- Update action input names to uppercase; remove unused files and improve configuration handling
  ([bc77a9d](https://github.com/OpenSaucedHub/advanced-git-sync/commit/bc77a9dcc1dc2c91a37ce271cc73ce1b406b6a68))
- Update configuration loading to prioritize environment variables; enhance error handling and
  logging for GitHub and GitLab tokens
  ([f4d5cd9](https://github.com/OpenSaucedHub/advanced-git-sync/commit/f4d5cd95309a853a17fcd7eddf832a2b7e7dcb69))
- Update configuration options in README and improve error logging in config loading
  ([75c63d2](https://github.com/OpenSaucedHub/advanced-git-sync/commit/75c63d2a9f034dd9414af77ca93f46bdd04f2086))
