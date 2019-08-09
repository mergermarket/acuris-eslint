// eslint rules specific for trendy team

const baseEslintConfig = require('../..')
const eslintSupport = require('../../core/eslint-support')

module.exports = eslintSupport.mergeEslintConfigs(baseEslintConfig, {
  overrides: [
    {
      files: ['*.spec.js'],
      rules: {
        'no-console': 0
      }
    }
  ]
})
