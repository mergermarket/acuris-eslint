'use strict'

const { resolveAcurisEslintFile, resolveProjectFile, readTextFile, updateTextFile } = require('../lib/fs-utils')
const GitIgnore = require('../lib/GitIgnore')

module.exports = async () => {
  await updateTextFile({
    filePath: resolveProjectFile('.gitignore'),
    async content(previousContent) {
      const targetGitIgnore = new GitIgnore(previousContent)
      targetGitIgnore.merge(new GitIgnore(await readTextFile(resolveAcurisEslintFile('.gitignore.default'))))
      if (!targetGitIgnore.changed) {
        return undefined
      }
      return targetGitIgnore.toString()
    }
  })
}

module.exports.description = 'initializes or updates .gitignore'
