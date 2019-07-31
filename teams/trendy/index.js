// eslint rules specific for trendy team

const baseEslintConfig = require('../..')
const eslintSupport = require('../../core/eslint-support')

const baseNoUnusedVarsRule = Array.isArray(baseEslintConfig.rules['no-unused-vars'])
  ? baseEslintConfig.rules['no-unused-vars']
  : [0, {}]

module.exports = eslintSupport.mergeEslintConfigs(baseEslintConfig, {
  overrides: [
    {
      files: ['*.spec.js'],
      rules: {
        'no-console': 0,
        'no-unused-vars': [baseNoUnusedVarsRule[0], { ...baseNoUnusedVarsRule[1], args: 'none' }]
      }
    }
  ]
})
