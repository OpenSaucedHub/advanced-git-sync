import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': [
        'warn', // or 'error' if you want to be stricter
        {
          fixToUnknown: true, // automatically fix 'any' to 'unknown'
          ignoreRestArgs: true // allow 'any' in rest arguments
        }
      ],
      // Optional: allow 'any' in specific scenarios with inline comments
      // This gives you more fine-grained control
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn'
    }
  }
]
