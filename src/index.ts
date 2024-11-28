import {
  getInput,
  debug,
  setFailed,
  setOutput,
  setSecret,
  exportVariable,
  info
} from '@actions/core'

const run = async () => {
  try {
    // Get the config_path input
    const configPath = getInput('config_path', { required: false })
    debug(`Debug: config_path input: ${configPath}`)
    info(`Config path: ${configPath}`)

    // Set the config_path as an output
    setOutput('config_path', configPath)

    // Get the gitlab_token input
    const gitlabToken = getInput('gitlab_token', { required: false })
    debug(`Debug: gitlab_token input: ${gitlabToken}`)
    if (gitlabToken) {
      setSecret(gitlabToken)
      info(`GitLab token length: ${gitlabToken.length}`)
      exportVariable('GITLAB_TOKEN', gitlabToken)
    }

    // Get the github_token input
    const githubToken = getInput('github_token', { required: false })
    debug(`Debug: github_token input: ${githubToken}`)
    if (githubToken) {
      setSecret(githubToken)
      info(`GitHub token length: ${githubToken.length}`)
      exportVariable('GH_TOKEN', githubToken)
    }
  } catch (error) {
    if (error instanceof Error) {
      setFailed(error.message)
    } else {
      setFailed(String(error))
    }
  }
}

run()
  .then(() => {})
  .catch(error => {
    console.error('ERROR', error)
    setFailed(error.message)
  })
