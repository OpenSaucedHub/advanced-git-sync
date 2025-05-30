# 📦 Changelog

All notable changes to this project will be documented in this file.

# [v1.1.5](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.1.4...v1.1.5) (2024-12-07)

## [1.1.5](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.1.4...v1.1.5) (2024-12-07)

### Bug Fixes

- implement LabelHelper for label normalization and integration; refactor issue and pull request
  handling
  ([05f9f26](https://github.com/OpenSaucedHub/advanced-git-sync/commit/05f9f267b7fbe6d74c2d565cde0a337508d910dc))
- introduce GitHub and GitLab permissions and tags helpers; refactor release and sync
  functionalities
  ([9bc811e](https://github.com/OpenSaucedHub/advanced-git-sync/commit/9bc811e9ac137f30fdd1df338018376c81e6b40b))

# [v1.1.4](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.1.3...v1.1.4) (2024-12-06)

## [1.1.4](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.1.3...v1.1.4) (2024-12-06)

### Bug Fixes

- rename branchHelper and issueHelper to gitHubBranches and gitHubIssues; update imports and
  initialization in clientManager
  ([1bf4458](https://github.com/OpenSaucedHub/advanced-git-sync/commit/1bf4458a83ea568697002a2404cff7860c1be68e))

# [v1.1.3](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.1.2...v1.1.3) (2024-12-03)

## [1.1.3](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.1.2...v1.1.3) (2024-12-03)

### Bug Fixes

- add permsHelper for GitHub and GitLab clients; update client initialization and permissions
  validation
  ([36b8abf](https://github.com/OpenSaucedHub/advanced-git-sync/commit/36b8abf80c56090751768f519fba3d32526345c0))

# [v1.1.2](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.1.1...v1.1.2) (2024-12-03)

## [1.1.2](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.1.1...v1.1.2) (2024-12-03)

### Bug Fixes

- remove BaseClient class and update GitHub/GitLab clients to implement IClient directly
  ([25e6789](https://github.com/OpenSaucedHub/advanced-git-sync/commit/25e67892a29a2221ea53b08e566d08326fc41f39))

# [v1.1.1](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.1.0...v1.1.1) (2024-12-03)

## [1.1.1](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.1.0...v1.1.1) (2024-12-03)

### Bug Fixes

- update CHANGELOG and README for clarity; remove redundant validation in BaseClient constructor
  ([5e84a63](https://github.com/OpenSaucedHub/advanced-git-sync/commit/5e84a63bb49e3ddf562b88abaf8f96611511a666))

# [v1.1.0](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.11...v1.1.0) (2024-12-03)

## [1.1.0](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.11...v1.1.0) (2024-12-03)

### Features

- add deepmerge dependency and implement config merging functionality
  ([2e7a49a](https://github.com/OpenSaucedHub/advanced-git-sync/commit/2e7a49a2876601914673111987d4c1573d3c3ac6))

# [v1.0.11](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.10...v1.0.11) (2024-12-03)

## [1.0.11](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.10...v1.0.11) (2024-12-03)

### Bug Fixes

- simplify GitLabClient host URL handling and improve project ID retrieval logic
  ([0437006](https://github.com/OpenSaucedHub/advanced-git-sync/commit/04370065023261c5450ad8951b9962e3d4370047))

# [v1.0.10](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.9...v1.0.10) (2024-12-03)

## [1.0.10](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.9...v1.0.10) (2024-12-03)

### Bug Fixes

- enhance GitLab configuration with optional projectId and improve client initialization
  ([311f331](https://github.com/OpenSaucedHub/advanced-git-sync/commit/311f331a6b7f253931d28ca6bf5464ebf9078aef))

# [v1.0.9](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.8...v1.0.9) (2024-12-02)

## [1.0.9](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.8...v1.0.9) (2024-12-02)

### Bug Fixes

- enhance GitLabClient initialization and improve error handling
  ([45afba1](https://github.com/OpenSaucedHub/advanced-git-sync/commit/45afba140b91fcb866c226e3c75bac841ce37fd0))

# [v1.0.8](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.7...v1.0.8) (2024-12-02)

## [1.0.8](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.7...v1.0.8) (2024-12-02)

### Bug Fixes

- remove GitLab URL utility functions and enhance GitLabClient initialization
  ([8178b6f](https://github.com/OpenSaucedHub/advanced-git-sync/commit/8178b6f9a80c002a402f0824db004fcd07a6dc71))

# [v1.0.7](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.6...v1.0.7) (2024-12-02)

## [1.0.7](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.6...v1.0.7) (2024-12-02)

### Bug Fixes

- add GitLab URL utility functions and refactor error handling
  ([675246b](https://github.com/OpenSaucedHub/advanced-git-sync/commit/675246bc2073166de42a14abcc554603192f0b1d))

# [v1.0.6](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.5...v1.0.6) (2024-12-02)

## [1.0.6](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.5...v1.0.6) (2024-12-02)

### Bug Fixes

- rename config module and restructure repository utility functions
  ([f3e1477](https://github.com/OpenSaucedHub/advanced-git-sync/commit/f3e1477dba043f41eae49cf93364b7c76c2e1631))

# [v1.0.5](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.4...v1.0.5) (2024-12-01)

## [1.0.5](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.4...v1.0.5) (2024-12-01)

### Bug Fixes

- fix a circular dependency between modules. The client classes and base client were trying to
  import each other. fixed this by restructuring the imports and class hierarchy.
  ([45b457a](https://github.com/OpenSaucedHub/advanced-git-sync/commit/45b457a95ce3c72bea9ec657a90ca72df31d70d6))

# [v1.0.4](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.3...v1.0.4) (2024-12-01)

## [1.0.4](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.3...v1.0.4) (2024-12-01)

### Bug Fixes

- Remove permission helper classes and update README for configuration clarity
  ([c1d14fa](https://github.com/OpenSaucedHub/advanced-git-sync/commit/c1d14faa6b4e4307da61f929f1a89ff8b362e553))

# [v1.0.3](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.2...v1.0.3) (2024-12-01)

## [1.0.3](https://github.com/OpenSaucedHub/advanced-git-sync/compare/v1.0.2...v1.0.3) (2024-12-01)

### Bug Fixes

- Remove lodash dependency and update permission validation methods for GitHub and GitLab clients
  ([1de581a](https://github.com/OpenSaucedHub/advanced-git-sync/commit/1de581ac07779273fdb3c7d1796c04ed626d7bca))

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
