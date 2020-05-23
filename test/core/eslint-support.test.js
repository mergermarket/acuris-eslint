const eslintSupport = require('../../core/eslint-support')
const { expect } = require('chai')

describe('core/eslint-support', () => {
  it('contains all packages for @acuris/eslint-config dev configuration', () => {
    expect(eslintSupport).to.deep.include({
      isCI: 'CI' in process.env,
      reactVersion: '16.13.1',
      hasEslint: true,
      hasTypescript: true,
      hasEslintPluginCssModules: true,
      hasEslintPluginImport: true,
      hasEslintPluginNode: true,
      hasEslintPluginReact: true,
      hasEslintPluginJsxA11y: true,
      hasEslintPluginJest: false,
      hasEslintPluginMocha: true,
      hasEslintPluginChaiExpect: true,
      hasEslintPluginPromise: true,
      hasEslintPluginJson: true
    })
    expect(eslintSupport.extensions).to.include('.js')
    expect(eslintSupport.extensions).to.include('.jsx')
    expect(eslintSupport.extensions).to.include('.mjs')
    expect(eslintSupport.extensions).to.include('.cjs')
    expect(eslintSupport.extensions).to.include('.ts')
    expect(eslintSupport.extensions).to.include('.tsx')
    expect(eslintSupport.extensions).to.include('.json')
  })
})
