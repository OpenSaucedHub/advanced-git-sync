# Contributing Guide

Thank you for your interest in contributing to the GitHub GitLab Sync Action! This guide will help
you get started.

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork**
3. **Create a feature branch**
4. **Make your changes**
5. **Test your changes**
6. **Submit a pull request**

## 📋 Prerequisites

- [Bun](https://bun.sh/) (for package management and building)
- [Git](https://git-scm.com/)
- A GitHub account
- A GitLab account (for testing)

## 🛠️ Development Setup

> [!TIP]
>
> Check out the [DEVELOPMENT.md](DEVELOPMENT.md) file for a quick start guide.

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/advanced-git-sync.git
cd advanced-git-sync
```

### 2. Install Dependencies

```bash
# Install dependencies using Bun
bun install
```

### 3. Build the Project

```bash
# Build the TypeScript code
bun run build
```

### 4. Run Tests

```bash
# Run the test suite
bun test
```

## 🏗️ Project Structure

```
advanced-git-sync/
├── src/                    # Source code
│   ├── config.ts          # Configuration handling
│   ├── index.ts           # Main entry point
│   ├── handlers/          # Event handlers
│   ├── structures/        # Data structures
│   ├── sync/              # Sync logic
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── dist/                  # Compiled JavaScript
├── docs/                  # Documentation
├── examples/              # Configuration examples
├── scripts/               # Build and utility scripts
└── __tests__/             # Test files
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test src/config.test.ts
```

### Writing Tests

- Place test files in `__tests__/` directory
- Use descriptive test names
- Test both success and error cases
- Mock external API calls

Example test:

```typescript
import { describe, it, expect } from 'bun:test'
import { parseConfig } from '../src/config'

describe('parseConfig', () => {
  it('should parse valid configuration', () => {
    const config = {
      gitlab: { enabled: true },
      github: { enabled: true }
    }

    const result = parseConfig(config)
    expect(result.gitlab.enabled).toBe(true)
  })
})
```

## 📝 Code Style

### TypeScript Guidelines

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible
- Use meaningful variable and function names

### Formatting

```bash
# Format code with Prettier
bun run f

# Check formatting
bun run f:check
```

### Linting

```bash
# Run ESLint
bun run lint

# Fix linting issues
bun run lint:fix
```

## 🔄 Making Changes

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Follow the existing code style
- Add tests for new functionality
- Update documentation if needed
- Keep commits focused and atomic

### 3. Test Your Changes

```bash
# Run tests
bun test

# Build the project
bun run build

# Test the action locally
bun s

```

### 4. Commit Your Changes

Use conventional commit messages:

```bash
git commit -m "feat: add new sync feature"
git commit -m "fix: resolve token validation issue"
git commit -m "docs: update configuration guide"
```

Commit types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

## 📤 Submitting Changes

### 1. Push Your Branch

```bash
git push origin feature/your-feature-name
```

### 2. Create a Pull Request

1. Go to the original repository on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template

### 3. PR Requirements

- ✅ Clear description of changes
- ✅ Tests pass
- ✅ Code is formatted and linted
- ✅ Documentation updated (if needed)
- ✅ No breaking changes (unless discussed)

## 🐛 Reporting Issues

### Before Reporting

1. Check existing issues
2. Try the latest version
3. Review the troubleshooting guide

### Issue Template

````markdown
**Bug Description:** Clear description of the bug

**Steps to Reproduce:**

1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:** What should happen

**Actual Behavior:** What actually happens

**Configuration:**

```yaml
# Your config (remove sensitive data)
```
````

**Environment:**

- Action version: v1.4.2
- GitHub/GitLab versions
- Any relevant details

````

## 💡 Feature Requests

We welcome feature requests! Please:

1. Check if the feature already exists
2. Open a discussion first for major features
3. Provide clear use cases
4. Consider implementation complexity


**Want to contribute?** Pick a feature above and:

1. Open a discussion to coordinate with maintainers
2. Break down the work into smaller tasks
3. Submit a design proposal
4. Implement incrementally with tests

## �🏷️ Release Process

Releases are automated using semantic-release:

1. Merge PR to main branch
2. Semantic-release analyzes commits
3. Automatically creates release
4. Updates version tags

## 📚 Documentation

### Updating Documentation

- Update relevant `.md` files in `docs/`
- Keep examples up to date
- Use clear, concise language
- Include code examples

### Documentation Structure

- `README.md` - Basic info and quick start
- `docs/configuration.md` - Complete configuration guide
- `docs/token-setup.md` - Authentication setup
- `docs/examples.md` - Advanced examples
- `docs/troubleshooting.md` - Common issues
- `docs/contributing.md` - This file

## 🤝 Community Guidelines

- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Follow the code of conduct

## 🆘 Getting Help

- 💬 [GitHub Discussions](https://github.com/OpenSaucedHub/advanced-git-sync/discussions)
- 🐛 [Issues](https://github.com/OpenSaucedHub/advanced-git-sync/issues)
- 📧 Contact maintainers

## 🙏 Recognition

Contributors are recognized in:

- Release notes
- Contributors section
- Special thanks for significant contributions

Thank you for contributing to making cross-platform development easier! 🎉

```

```
````
