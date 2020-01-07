'use strict'

const chalk = require('chalk')
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

        if (settings.extends && settings.extends !== packageName) {
          emitImportant(
            chalk.yellowBright(
              `tsconfig.json already extends ${JSON.stringify(settings.extends)} instead of "${packageName}".`
            )
          )
          return settings
        }

        settings.extends = `${packageName}/tsconfig.json`

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
