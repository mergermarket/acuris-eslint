const eslintSupport = require('./core/eslint-support')

eslintSupport.projectConfig.addPrettier()

module.exports = {
  ['*.{' +
  eslintSupport.projectConfig
    .extensionsToArray()
    .map((x) => x.slice(1))
    .join(',') +
  '}']: 'acuris-eslint --lint-staged --fix --max-warnings=0'
}
