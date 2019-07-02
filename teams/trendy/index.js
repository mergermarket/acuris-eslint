// eslint rules specific for trendy team
const { mergeEslintConfigs } = require('../../core')

const baseEslintConfig = require('../..')

const baseNoUnusedVarsRule = Array.isArray(baseEslintConfig.rules['no-unused-vars'])
  ? baseEslintConfig.rules['no-unused-vars']
  : [0, {}]

module.exports = mergeEslintConfigs(baseEslintConfig, {
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
