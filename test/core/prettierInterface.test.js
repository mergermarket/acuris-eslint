const prettierInterface = require('eslint-plugin-quick-prettier/prettier-interface')
const { expect } = require('chai')

describe('core/prettierInterface', () => {
  describe('getPrettier', () => {
    it('returns prettier', () => {
      expect(prettierInterface.getPrettier()).to.equal(require('prettier'))
    })
  })

  describe('tryGetPrettier', () => {
    it('returns prettier', () => {
      expect(prettierInterface.tryGetPrettier()).to.equal(require('prettier'))
    })
  })

  describe('getPrettierConfig', () => {
    it('returns prettier config', () => {
      expect(prettierInterface.getPrettierConfig()).to.deep.include({
        endOfLine: 'lf',
        printWidth: 120,
        semi: false,
        singleQuote: true
      })
    })
  })

  describe('tryGetPrettierConfig', () => {
    it('returns prettier config', () => {
      expect(prettierInterface.tryGetPrettierConfig()).to.deep.include({
        endOfLine: 'lf',
        printWidth: 120,
        semi: false,
        singleQuote: true
      })
    })
  })

  describe('format', () => {
    it('formats a json file', () => {
      const formatted = prettierInterface.format(JSON.stringify({ a: 1, b: [1, 2, 3], c: { x: 1, b: 2 } }, null, 2), {
        parser: 'json'
      })
      expect(formatted).to.equal('{\n  "a": 1,\n  "b": [1, 2, 3],\n  "c": {\n    "x": 1,\n    "b": 2\n  }\n}\n')
    })
  })
})
