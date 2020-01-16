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
        }
        settings = mergeConfigs(settings, defaultSettings)
        delete settings['eslint.autoFixOnSave']

        settings['eslint.validate'] = mergeEslintValidate(
          settings['eslint.validate'],
          defaultSettings['eslint.validate']
        )

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
  return Array.from(map.values())

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
