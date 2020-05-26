'use strict'

const { resolveAcurisEslintFile, resolveProjectFile } = require('../lib/fs-utils')
const { readTextFile, askConfirmation, updateTextFileAsync } = require('../lib/text-utils')

module.exports = async () => {
  await updateTextFileAsync({
    filePath: resolveProjectFile('.clang-format'),
    format: 'text',
    async content(previousContent) {
      const content = readTextFile(resolveAcurisEslintFile('.clang-format'))
      if (content !== previousContent) {
        if (
          !previousContent ||
          (await askConfirmation('.clang-format already exists, would you like to overwrite?', false))
        ) {
          return content
        }
      }
      return previousContent
    }
  })
}
