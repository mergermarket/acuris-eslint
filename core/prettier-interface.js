const path = require('path')
const fs = require('fs')

require('./node-modules')

const prettierInterface = require('eslint-plugin-quick-prettier/prettier-interface')

prettierInterface.loadDefaultPrettierConfig = () => {
  return JSON.parse(fs.readFileSync(path.resolve(__dirname, '../.prettierrc')))
}

module.exports = prettierInterface
