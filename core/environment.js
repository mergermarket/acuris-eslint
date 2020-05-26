module.exports = {
  isCI: loadIsCI(),
  assertNodeVersion
}

function loadIsCI() {
  const env = process.env
  if (!env) {
    return false
  }

  if ('CI' in env) {
    return env.CI !== '0' && env.CI !== 'false' && env.CI !== 'FALSE'
  }

  if ('JENKINS_URL' in env && 'BUILD_ID' in env) {
    return true
  }

  const knownKeys = [
    'APPVEYOR',
    'SYSTEM_TEAMFOUNDATIONCOLLECTIONURI',
    'bamboo_planKey',
    'BITBUCKET_PR_ID',
    'BITRISE_PULL_REQUEST',
    'BUDDY_WORKSPACE_ID',
    'BUILDKITE',
    'CIRCLECI',
    'CIRRUS_CI',
    'CODEBUILD',
    'CODEBUILD_BUILD_ARN',
    'DSARI',
    'GITHUB_ACTIONS',
    'GITLAB_CI',
    'GO_PIPELINE_LABEL',
    'HUDSON_URL',
    'NOW_BUILDER',
    'NETLIFY',
    'NEVERCODE',
    'SAILCI',
    'TEAMCITY',
    'TRAVIS'
  ]
  for (let i = 0, len = knownKeys.length; i < len; ++i) {
    if (knownKeys[i] in env) {
      return true
    }
  }

  if (env.CI_NAME === 'codeship') {
    return true
  }

  return false
}

function assertNodeVersion() {
  let nodeVersion = (process && process.version) || ''
  if (nodeVersion.startsWith('v')) {
    nodeVersion = nodeVersion.slice(1)
  }
  const parsed = parseFloat(nodeVersion)
  if (parsed < 12.12) {
    throw new Error(`Node 12.12.0 or greater is required. Current version is ${nodeVersion}`)
  }
}
