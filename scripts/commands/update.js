const { runAsync } = require('../lib/fs-utils')

module.exports = async () => {
  await runAsync('npx', ['@acuris/eslint-config', '--init'])
}
