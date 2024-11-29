import _ from 'lodash'
import * as core from '@actions/core'
import * as yaml from 'js-yaml'
import { Config } from '../types'
import { getDefaultConfig } from './defaults'

export function correctTypos(
  config: Record<string, unknown>
): Record<string, unknown> {
  const correctedConfig = _.cloneDeep(config)

  const isMaybeUsername = (key: string): boolean => {
    return ['username', 'user', 'name', 'login'].some(potentialUserKey =>
      key.toLowerCase().includes(potentialUserKey)
    )
  }

  const isPermutationOfWord = (input: string, targetWord: string): boolean => {
    // Normalize the input by converting to lowercase and removing any whitespace
    const normalizedInput = input.toLowerCase().replace(/\s/g, '')
    const normalizedTarget = targetWord.toLowerCase()

    // Check if the input has the same length as the target word
    if (normalizedInput.length !== normalizedTarget.length) return false

    // Create frequency maps of characters
    const inputCharMap = new Map<string, number>()
    const targetCharMap = new Map<string, number>()

    // Count character frequencies for input
    for (const char of normalizedInput) {
      inputCharMap.set(char, (inputCharMap.get(char) || 0) + 1)
    }

    // Count character frequencies for target
    for (const char of normalizedTarget) {
      targetCharMap.set(char, (targetCharMap.get(char) || 0) + 1)
    }

    // Compare character frequencies
    for (const [char, count] of targetCharMap) {
      if ((inputCharMap.get(char) || 0) !== count) return false
    }

    return true
  }

  // Recursive function to handle nested objects
  const processValue = (value: unknown, key: string): unknown => {
    if (typeof value === 'string') {
      // Typo detection for 'true'
      if (isPermutationOfWord(value, 'true') && !isMaybeUsername(key)) {
        return 'true'
      }

      // Typo detection for 'false'
      if (isPermutationOfWord(value, 'false') && !isMaybeUsername(key)) {
        return 'false'
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively process nested objects
      return _.mapValues(value, (nestedValue, nestedKey) =>
        processValue(nestedValue, `${key}.${nestedKey}`)
      )
    }

    return value
  }

  return _.mapValues(correctedConfig, (value, key) => processValue(value, key))
}

export function fixSyntaxErrors(yamlContent: string): string {
  // Attempt to fix minor syntax issues like indentation
  try {
    const parsedConfig = yaml.load(yamlContent)
    return yaml.dump(parsedConfig)
  } catch (error) {
    core.debug(
      `Failed to parse YAML: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    // If parsing fails, attempt to fix common issues
    const fixedContent = yamlContent.replace(/^(\s*)-(\S)/gm, '$1  -$2') // Fix indentation for lists
    return fixedContent
  }
}

export function prepareConfig(parsedConfig: Record<string, unknown>): Config {
  const defaultConfig = getDefaultConfig()

  if (
    parsedConfig.gitlab &&
    (parsedConfig.gitlab as { enabled?: boolean }).enabled === true &&
    _.isEmpty(_.omit(parsedConfig.gitlab, 'enabled'))
  ) {
    parsedConfig.gitlab = {
      ...defaultConfig.gitlab,
      enabled: true
    }
  }

  if (
    parsedConfig.github &&
    (parsedConfig.github as { enabled?: boolean }).enabled === true &&
    _.isEmpty(_.omit(parsedConfig.github, 'enabled'))
  ) {
    parsedConfig.github = {
      ...defaultConfig.github,
      enabled: true
    }
  }

  const mergedConfig = _.merge({}, defaultConfig, parsedConfig)

  const sanitizedConfig = {
    github: {
      enabled: mergedConfig.github?.enabled ?? false,
      sync: mergedConfig.github?.sync ?? defaultConfig.github.sync
    },
    gitlab: {
      enabled: mergedConfig.gitlab?.enabled ?? false,
      sync: mergedConfig.gitlab?.sync ?? defaultConfig.gitlab.sync
    }
  }

  return sanitizedConfig
}
