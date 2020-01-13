const path = require('path')
const { eslintRequire } = require('../../core/node-modules')
const { directoryExists } = require('../lib/fs-utils')
const { translateOptionsForCLIEngine } = require('../lib/acuris-eslint-options')

module.exports = cliOptions => {
  const filePath = path.resolve(cliOptions.command.value)

  let resolved
  if (directoryExists(filePath)) {
    try {
      resolved = require.resolve(filePath)
    } catch (_error) {
      resolved = path.join(filePath, ':.js')
    }
  } else {
    resolved = filePath
  }

  const { CLIEngine } = eslintRequire('./lib/cli-engine')
  const engine = new CLIEngine(translateOptionsForCLIEngine(cliOptions))
  const fileConfig = engine.getConfigForFile(resolved)
  console.info(JSON.stringify(fileConfig, null, 2))
  return 0
}
