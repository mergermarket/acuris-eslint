'use strict'

const { resolveAcurisEslintFile, resolveProjectFile } = require('../lib/fs-utils')
const { readTextFile, updateTextFileAsync } = require('../lib/text-utils')
const { notes } = require('../lib/notes')

module.exports = async () => {
  if (
    await updateTextFileAsync({
      format: 'json',
      filePath: resolveProjectFile('.vscode/settings.json'),
      async content(settings) {
        const defaultSettings = readTextFile(resolveAcurisEslintFile('.vscode/settings.json'))

        if (typeof settings !== 'object' || settings === null) {
          settings = {}
        } else {
          settings = { ...settings }
        }

        settings = mergeConfigs(settings, defaultSettings)

        // Have to be done twice for a bug with hjson package
        delete settings['eslint.autoFixOnSave']
        delete settings['eslint.autoFixOnSave']

        const eslintValidateValue = mergeEslintValidate(settings['eslint.validate'], defaultSettings['eslint.validate'])
        console.log(settings)
        if (!eslintValidateValue) {
          // Have to be done twice for a bug with hjson package
          delete settings['eslint.validate']
          delete settings['eslint.validate']
        } else {
          settings['eslint.validate'] = eslintValidateValue
        }

        if (defaultSettings['search.exclude']) {
          settings['search.exclude'] = { ...defaultSettings['search.exclude'], ...settings['search.exclude'] }
        }

        if (defaultSettings['files.exclude']) {
          settings['files.exclude'] = { ...defaultSettings['files.exclude'], ...settings['files.exclude'] }
        }

        return settings
      }
    })
  ) {
    notes.shouldRestartVsCode = true
  }

  if (
    await updateTextFileAsync({
      format: 'json',
      filePath: resolveProjectFile('.vscode/extensions.json'),
      async content(extensions) {
        const defaultExtensions = readTextFile(resolveAcurisEslintFile('.vscode/extensions.json'))

        if (typeof extensions !== 'object' || extensions === null) {
          extensions = {}
        }
        extensions = mergeConfigs(extensions)

        const recommendationsSet = new Set(defaultExtensions.recommendations)
        if (Array.isArray(extensions.recommendations)) {
          for (const recommendation of extensions.recommendations) {
            recommendationsSet.add(recommendation)
          }
        }
        extensions.recommendations = Array.from(recommendationsSet)

        for (const key of Object.keys(defaultExtensions)) {
          if (!(key in extensions)) {
            extensions[key] = defaultExtensions[key]
          }
        }

        return extensions
      }
    })
  ) {
    notes.shouldInstallVsCodePlugins = true
  }
}

function mergeConfigs(target, source) {
  if (typeof target === 'object' && target !== null && typeof source === 'object' && source !== null) {
    if (Array.isArray(target) || Array.isArray(source)) {
      return target
    }
    for (const key of Object.keys(source)) {
      target[key] = mergeConfigs(target[key], source[key])
    }
  }
  if (target === undefined) {
    return source
  }
  return target === undefined ? source : target
}

function mergeEslintValidate(target, source) {
  const map = new Map()
  eslintValidateLanguages(source)
  eslintValidateLanguages(target)
  const result = Array.from(map.values())

  if (result.every(x => typeof x === 'string')) {
    result.sort()
    // Remove default value
    if (['javascript', 'javascriptreact', 'typescript', 'typescriptreact'].join() === result.join()) {
      return undefined
    }
  }

  return result

  function eslintValidateLanguages(x) {
    if (Array.isArray(x)) {
      for (const item of x) {
        if (typeof item === 'string') {
          map.set(item, item)
          continue
        }
        if (typeof item === 'object' && item !== null && item.language && !Array.isArray(item)) {
          map.set(item.language, item.autoFix ? item.language : item)
          continue
        }
        map.set(map.size, item)
      }
    }
  }
}
