const { acurisEslintPatterns, acurisEslintPath } = require('./lint-staged')

module.exports = {
  [acurisEslintPatterns]: `${acurisEslintPath} --lint-staged --fix --max-warnings=0`
}
