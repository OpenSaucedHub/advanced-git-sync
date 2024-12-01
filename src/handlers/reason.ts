// src/utils/reason.ts
import * as core from '@actions/core'

function containsAllLetters(input: string, target: string): boolean {
  const inputChars = new Set(input.toLowerCase())
  return target
    .toLowerCase()
    .split('')
    .every(char => inputChars.has(char))
}

function reasonBoolean(value: unknown): {
  value: boolean
  suggestion?: string
} {
  // Handle actual booleans
  if (typeof value === 'boolean') {
    return { value }
  }

  // Handle string values
  if (typeof value === 'string') {
    const str = value.toLowerCase()

    // Check for common true values
    if (['true', 'yes', 'y', '1'].includes(str)) {
      return { value: true }
    }

    // Check for common false values
    if (['false', 'no', 'n', '0'].includes(str)) {
      return { value: false }
    }

    // Advanced reasoning for true/false
    if (containsAllLetters(str, 'true')) {
      return {
        value: true,
        suggestion: `Did you mean 'true'? Found "${value}" which contains all letters of "true"`
      }
    }

    if (containsAllLetters(str, 'false')) {
      return {
        value: false,
        suggestion: `Did you mean 'false'? Found "${value}" which contains all letters of "false"`
      }
    }
  }

  // Default to false for any other values
  return {
    value: false,
    suggestion: `Invalid boolean value "${value}", defaulting to false`
  }
}

// Process boolean values with reasoning
export function processConfig(
  obj: Record<string, unknown>
): Record<string, unknown> {
  if (!obj || typeof obj !== 'object') return obj

  const processed: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object') {
      processed[key] = processConfig(value as Record<string, unknown>)
    } else {
      // Check if this field should be boolean based on schema
      const isExpectedBoolean = [
        'enabled',
        'protected',
        'autoMerge',
        'syncComments'
      ].includes(key)

      if (isExpectedBoolean) {
        const reasoned = reasonBoolean(value)
        if (reasoned.suggestion) {
          core.info(`📝 ${reasoned.suggestion}`)
        }
        processed[key] = reasoned.value
      } else {
        processed[key] = value
      }
    }
  }
  return processed
}
