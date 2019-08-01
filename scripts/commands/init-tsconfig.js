'use strict'

const chalk = require('chalk').default
const { resolveProjectFile, resolveAcurisEslintFile } = require('../lib/fs-utils')
const { updateTextFileAsync } = require('../lib/text-utils')
const { notes, emitImportant } = require('../lib/notes')
const { name: packageName } = require('../../package.json')

module.exports = async () => {
  let fileExisting = true
  if (
    await updateTextFileAsync({
      format: 'json',
      filePath: resolveProjectFile('tsconfig.json'),
      async content(settings, targetPath) {
        if (typeof settings !== 'object' || settings === null) {
          fileExisting = false
          settings = {}
        } else if (targetPath === resolveAcurisEslintFile('tsconfig.json')) {
          return settings
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
    if (!fileExisting) {
      emitImportant(
        chalk.yellowBright(
          `You should run ${chalk.cyanBright(
            'acuris-eslint --init'
          )} to update package.json and install required dependencies.`
        )
      )
    }
  }
}
