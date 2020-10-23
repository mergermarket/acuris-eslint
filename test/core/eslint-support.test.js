const eslintSupport = require('../../core/eslint-support')
const { expect } = require('chai')

describe('core/eslint-support', () => {
  it('contains all packages for @acuris/eslint-config dev configuration', () => {
    expect(eslintSupport).to.deep.include({
      reactVersion: '16.13.1',
      hasEslint: true,
      hasTypescript: true,
      hasEslintPluginCssModules: true,
      hasEslintPluginImport: true,
      hasEslintPluginNode: true,
      hasEslintPluginReact: true,
      hasEslintPluginJsxA11y: true,
      hasEslintPluginJest: true,
      hasEslintPluginMocha: true,
      hasEslintPluginChaiExpect: true,
      hasEslintPluginPromise: true,
      hasEslintPluginJson: true
    })
  })
})
