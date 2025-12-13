module.exports = {
  branches: ['main'],
  plugins: [
    [
      'semantic-release-gitmoji',
      {
        releaseRules: {
          patch: {
            include: [':bug:', ':ambulance:', ':lock:', ':adhesive_bandage:']
          },
          minor: {
            include: [':sparkles:', ':rocket:', ':boom:', ':lipstick:', ':zap:']
          },
          major: {
            include: [':boom:', ':warning:']
          }
        }
      }
    ],

    '@semantic-release/commit-analyzer',

    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        writerOpts: {
          types: [
            { type: 'feat', section: '✨ Features' },
            { type: 'fix', section: '🐛 Bug Fixes' },
            { type: 'perf', section: '⚡ Performance Improvements' },
            { type: 'revert', section: '⏪ Reverts' },
            { type: 'docs', section: '📚 Documentation' },
            { type: 'style', section: '💄 Styles' },
            { type: 'chore', section: '🔧 Miscellaneous' },
            { type: 'refactor', section: '♻️ Code Refactoring' },
            { type: 'test', section: '✓ Tests' },
            { type: 'build', section: '👷 Build System' },
            { type: 'ci', section: '🔄 CI/CD' }
          ]
        }
      }
    ],

    [
      '@semantic-release/changelog',
      {
        changelogTitle:
          '# 📦 Changelog\n\nAll notable changes to this project will be documented in this file.\n'
      }
    ],

    [
      '@semantic-release/github',
      {
        successComment:
          "🎉 This ${issue.pull_request ? 'PR is included' : 'issue has been resolved'} in version ${nextRelease.version} and published to GitHub Marketplace",
        failTitle: '❌ The release failed',
        failComment:
          'The release from branch ${branch.name} failed to publish.',
        labels: ['released']
      }
    ],

    [
      '@semantic-release/exec',
      {
        prepareCmd: [
          // Update README.md version references
          "sed -i 's|OpenSaucedHub/advanced-git-sync@v[0-9]\\+\\.[0-9]\\+\\.[0-9]\\+|OpenSaucedHub/advanced-git-sync@v${nextRelease.version}|g' README.md",
          // Update documentation version references
          "sed -i 's|OpenSaucedHub/advanced-git-sync@v[0-9]\\+\\.[0-9]\\+\\.[0-9]\\+|OpenSaucedHub/advanced-git-sync@v${nextRelease.version}|g' docs/TROUBLESHOOTING.md",
          "sed -i 's|OpenSaucedHub/advanced-git-sync@v[0-9]\\+\\.[0-9]\\+\\.[0-9]\\+|OpenSaucedHub/advanced-git-sync@v${nextRelease.version}|g' docs/EXAMPLES.md",
          "sed -i 's|OpenSaucedHub/advanced-git-sync@v[0-9]\\+\\.[0-9]\\+\\.[0-9]\\+|OpenSaucedHub/advanced-git-sync@v${nextRelease.version}|g' docs/CONFIGURATION.md",
          "sed -i 's|OpenSaucedHub/advanced-git-sync@v[0-9]\\+\\.[0-9]\\+\\.[0-9]\\+|OpenSaucedHub/advanced-git-sync@v${nextRelease.version}|g' docs/README.md",
          "sed -i 's|OpenSaucedHub/advanced-git-sync@v[0-9]\\+\\.[0-9]\\+\\.[0-9]\\+|OpenSaucedHub/advanced-git-sync@v${nextRelease.version}|g' docs/SDK.md",
          // Update action version references in documentation
          "sed -i 's|\\*\\*Action Version:\\*\\* v[0-9]\\+\\.[0-9]\\+\\.[0-9]\\+|**Action Version:** v${nextRelease.version}|g' docs/TROUBLESHOOTING.md",
          "sed -i 's|Action version: v[0-9]\\+\\.[0-9]\\+\\.[0-9]\\+|Action version: v${nextRelease.version}|g' docs/contributing.md",
          // Update package.json version
          'npm version ${nextRelease.version} --no-git-tag-version'
        ].join(' && ')
      }
    ],

    [
      '@semantic-release/git',
      {
        assets: [
          'package.json',
          'CHANGELOG.md',
          'README.md',
          'docs/TROUBLESHOOTING.md',
          'docs/EXAMPLES.md',
          'docs/CONFIGURATION.md',
          'docs/README.md',
          'docs/SDK.md'
        ],
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ]
  ]
}
