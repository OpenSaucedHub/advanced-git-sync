# Token Setup Guide

This guide explains how to create and configure the required tokens for the GitHub GitLab Sync
Action.

## Required Tokens

### GitLab Token

The GitLab token is required for syncing to/from GitLab repositories.

#### Creating a GitLab Personal Access Token

1. **Go to GitLab Settings**
   - Navigate to your GitLab instance (e.g., gitlab.com)
   - Click on your profile picture → **Preferences**
   - In the left sidebar, click **Access Tokens**

2. **Create New Token**
   - Click **Add new token**
   - Enter a descriptive name (e.g., "GitHub Sync Action")
   - Set an expiration date (optional but recommended)

3. **Select Required Scopes**
   - ✅ `api` - Full API access (required)
   - ✅ `read_repository` - Read repository (required)
   - ✅ `write_repository` - Write repository (required)

4. **Create and Copy Token**
   - Click **Create personal access token**
   - **Important**: Copy the token immediately - you won't be able to see it again!

#### Required Permissions

| Permission         | Description              | Required | Comment Sync |
| ------------------ | ------------------------ | -------- | ------------ |
| `api`              | Full API access          | ✅ Yes   | ✅ Yes       |
| `read_repository`  | Read repository content  | ✅ Yes   | ✅ Yes       |
| `write_repository` | Write repository content | ✅ Yes   | ✅ Yes       |

> **💬 Comment Synchronization**: The `api` scope includes access to issue notes (comments). The
> existing permissions are sufficient for comment synchronization.

### GitHub Token (Optional)

The GitHub token is optional - the action will use the default `GITHUB_TOKEN` if not provided.

#### When You Need a Custom GitHub Token

- When you need additional permissions beyond the default `GITHUB_TOKEN`
- For cross-repository operations
- When working with organization repositories with specific security policies

#### Creating a GitHub Personal Access Token

1. **Go to GitHub Settings**
   - Navigate to GitHub.com
   - Click on your profile picture → **Settings**
   - In the left sidebar, click **Developer settings**
   - Click **Personal access tokens** → **Tokens (classic)**

2. **Generate New Token**
   - Click **Generate new token (classic)**
   - Enter a descriptive note (e.g., "GitLab Sync Action")
   - Set an expiration date

3. **Select Required Scopes**
   - ✅ `repo` - Full repository access
   - ✅ `workflow` - Workflow access (if syncing workflow files)

4. **Generate and Copy Token**
   - Click **Generate token**
   - **Important**: Copy the token immediately!

#### Required Permissions

| Permission | Description            | Required | Comment Sync |
| ---------- | ---------------------- | -------- | ------------ |
| `repo`     | Full repository access | ✅ Yes   | ✅ Yes       |
| `workflow` | Workflow access        | Optional | No           |

> **💬 Comment Synchronization**: The `repo` scope includes access to issue and PR comments. No
> additional permissions are needed for comment synchronization.

## Adding Tokens to GitHub Secrets

### Step 1: Navigate to Repository Settings

1. Go to your GitHub repository
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**

### Step 2: Add GitLab Token

1. Click **New repository secret**
2. **Name**: `GITLAB_TOKEN`
3. **Secret**: Paste your GitLab personal access token
4. Click **Add secret**

### Step 3: Add GitHub Token (Optional)

1. Click **New repository secret**
2. **Name**: `GH_TOKEN`
3. **Secret**: Paste your GitHub personal access token
4. Click **Add secret**

## Security Best Practices

### Token Security

- ✅ **Never commit tokens to your repository**
- ✅ **Use GitHub Secrets for token storage**
- ✅ **Set reasonable expiration dates**
- ✅ **Use minimal required permissions**
- ✅ **Regularly rotate tokens**
- ✅ **Monitor token usage**

### Action Security Features

- 🔒 **Tokens are never exposed in logs or outputs**
- 🔒 **Protected branch settings are respected**
- 🔒 **All API calls use HTTPS**
- 🔒 **Token-based authentication only**

## Token Validation

The action will validate your tokens on startup and provide clear error messages if:

- Token is missing or invalid
- Token lacks required permissions
- Token has expired
- Repository access is denied

## Troubleshooting Token Issues

### Common Issues

**"Invalid token" error:**

- Verify the token was copied correctly
- Check if the token has expired
- Ensure the token has the required scopes

**"Permission denied" error:**

- Verify the token has the required permissions
- Check if the repository exists and is accessible
- For GitLab: Ensure you have at least Developer role in the project

**"Repository not found" error:**

- Verify the repository name and owner are correct
- Check if the repository is private and the token has access
- For GitLab: Try using `projectId` instead of `owner/repo`

### Getting Help

If you're still having issues:

1. Check the [Troubleshooting Guide](troubleshooting.md)
2. Review the action logs for specific error messages
3. [Open an issue](https://github.com/OpenSaucedHub/advanced-git-sync/issues) with:
   - Error message (with tokens redacted)
   - Your configuration (with sensitive data removed)
   - Steps to reproduce the issue

## Next Steps

- [Configuration Guide](CONFIGURATION.md) - Configure sync behavior
- [Examples](EXAMPLES.md) - Real-world configuration examples
- [Troubleshooting](troubleshooting.md) - Common issues and solutions
