const eslintSupport = require('./core/eslint-support')

eslintSupport.projectConfig.addPrettier()

const acurisEslintPatterns = `*.{${eslintSupport.projectConfig
  .extensionsToArray()
  .map((x) => x.slice(1))
  .join(',')}}`

const acurisEslintPath = require.resolve('./scripts/acuris-eslint')

module.exports = {
  acurisEslintPatterns,
  acurisEslintPath,

  defaultConfig: {
    [acurisEslintPatterns]: `node ${acurisEslintPath} --lint-staged --fix --max-warnings=0`
  }
}
