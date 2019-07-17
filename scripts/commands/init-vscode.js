'use strict'

const { readJsonFile } = require('../lib/json-utils')
const { resolveAcurisEslintFile, resolveProjectFile, updateTextFile } = require('../lib/fs-utils')

module.exports = async () => {
  await updateTextFile({
    isJSON: true,
    filePath: resolveProjectFile('xvscode/settings.json'),
    async content(content = {}) {
      const defaultSettings = await readJsonFile(resolveAcurisEslintFile('.vscode/settings.json'))

      for (const key of Object.keys(defaultSettings)) {
        if (!(key in content)) {
          content[key] = defaultSettings[key]
        }
      }

      return Object.assign(content, defaultSettings)
    }
  })

  await updateTextFile({
    isJSON: true,
    filePath: resolveProjectFile('xvscode/extensions.json'),
    async content(content) {
      const defaultSettings = await readJsonFile(resolveAcurisEslintFile('.vscode/extensions.json'))
      return Object.assign(content || {}, defaultSettings)
    }
  })
}

module.exports.description = 'initializes common Visual Studio Code settings'
