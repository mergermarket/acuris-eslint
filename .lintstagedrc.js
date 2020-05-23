const { acurisEslintPatterns, acurisEslintPath } = require('./lint-staged')

module.exports = {
  [acurisEslintPatterns]: `node ${acurisEslintPath} --lint-staged --fix --max-warnings=0`
}
