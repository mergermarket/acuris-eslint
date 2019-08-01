'use strict'

const { resolveProjectFile } = require('../lib/fs-utils')
const { updateTextFileAsync } = require('../lib/text-utils')
const { notes } = require('../lib/notes')
const { name: packageName } = require('../../package.json')

module.exports = async () => {
  if (
    await updateTextFileAsync({
      format: 'json',
      filePath: resolveProjectFile('tsconfig.json'),
      async content(settings) {
        if (typeof settings !== 'object' || settings === null) {
          settings = {}
        }

        if (typeof settings.extends === 'string') {
          settings.extends = settings.extends.length ? [settings.extends] : []
        } else if (settings.extends === undefined || settings.extends === null) {
          settings.extends = []
        }

        if (!Array.isArray(settings.extends)) {
          throw new TypeError(`tsconfig.json extends property must be an array but is ${typeof settings.extends}`)
        }

        let hasEslintConfig = false
        for (const item of settings.extends) {
          if (typeof item === 'string' && item.includes(packageName)) {
            hasEslintConfig = true
          }
        }
        if (!hasEslintConfig) {
          settings.extends.unshift(packageName)
        }
        return settings
      }
    })
  ) {
    notes.shouldRestartIde = true
  }
}
