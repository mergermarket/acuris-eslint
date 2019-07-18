'use strict'

const { resolveAcurisEslintFile, resolveProjectFile } = require('../lib/fs-utils')
const { readTextFile, updateTextFileAsync } = require('../lib/text-utils')
const GitIgnore = require('../lib/GitIgnore')

module.exports = async () => {
  await updateTextFileAsync({
    filePath: resolveProjectFile('.gitignore'),
    async content(previousContent) {
      const targetGitIgnore = new GitIgnore(previousContent)
      targetGitIgnore.merge(new GitIgnore(readTextFile(resolveAcurisEslintFile('.gitignore.default'))))
      if (!targetGitIgnore.changed) {
        return undefined
      }
      return targetGitIgnore.toString()
    }
  })
}

module.exports.description = 'writes .gitignore'
