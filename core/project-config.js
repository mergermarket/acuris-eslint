'use strict'

/* eslint-disable global-require */

const os = require('os')
const path = require('path')
const { existsSync } = require('fs')

module.exports = class ProjectConfig {
  constructor() {
    this.projectPath = ''

    this.eslintrc = ''
    this.eslintCache = true
    this.eslintCacheLocation = '.eslintcache'
    this.eslintOutputFormat = 'stylish'
    this.reactVersion = ''
    this.tsConfigPath = ''

    /** @type {Set<string>} */
    this.ignoredPackages = new Set()

    /** @type {Set<string>} */
    this.nodeResolvePaths = new Set()

    this.extensions = new Map()

    this.addExtension('.js')
    this.addExtension('.jsx')
    this.addExtension('.mjs')
    this.addExtension('.cjs')

    this.filePatterns = {
      mjs: ['*.mjs'],
      typescript: ['*.ts', '*.tsx'],
      typescriptDefinition: ['*.d.ts'],
      bin: ['**/bin/**/*', '**/.bin/**/*'],
      server: ['**/server/**/*', '**/dev-server/**/*'],
      dist: ['**/dist/**/*', '**/out/**/*', '**/_dist/**/*', '**/_out/**/*', '**/.dist/**/*', '**/.out/**/*'],
      scripts: [
        '**/dev-server/**/*',
        '**/scripts/**/*',
        '**/bin/**/*',
        '**/.bin/**/*',
        '**/build/**/*',
        '.eslintrc.js',
        'webpack.config.*',
        'webpack.*.config.*',
        'jest-*.*',
        '**/testUtils/**/*',
        '**/__mocks__/**/*',
        'Gruntfile.js',
        'gulpfile.js',
        'Gulpfile.js',
        '**/gulp/**/*',
        '**/grunt/**/*',
        '*-jest-*.*',
        '**/.mocharc.*'
      ],
      tests: [
        '*.test.*',
        '*.spec.*',
        '**/test/**/*',
        '**/tests/**/*',
        '**/*-test/**/*',
        '**/*-tests/**/*',
        '**/__mocks__/**/*',
        '**/__specs__/**/*',
        '**/__tests__/**/*',
        '**/__mock__/**/*',
        '**/__spec__/**/*',
        '**/__test__/**/*',
        '**/testUtils/**/*',
        '*-jest-*.*',
        '**/.mocharc.*'
      ]
    }
  }

  add(cfg) {
    if (typeof cfg.cwd === 'string') {
      this.cwd = path.resolve(cfg.cwd)
    }

    if (typeof cfg.eslintrc === 'string') {
      this.eslintrc = cfg.eslintrc
    }

    if (cfg.eslintCache !== undefined) {
      this.eslintCache = toBoolean(cfg.eslintCache)
    }

    if (typeof cfg.eslintCacheLocation === 'string') {
      this.eslintCacheLocation = cfg.eslintCacheLocation
    }

    if (typeof cfg.eslintOutputFormat === 'string') {
      this.eslintOutputFormat = cfg.eslintOutputFormat
    }

    if (typeof cfg.reactVersion === 'string') {
      this.reactVersion = cfg.reactVersion
    }

    if (typeof cfg.tsConfigPath === 'string') {
      this.tsConfigPath = cfg.tsConfigPath
    }

    updateSetFromConfig(this.ignoredPackages, cfg.ignoredPackages)
    updateSetFromConfig(this.ignoredPackages, cfg['ignored-packages'])
    updateSetFromConfig(this.nodeResolvePaths, cfg.nodeResolvePaths)
    updateSetFromConfig(this.nodeResolvePaths, cfg['node-resolve-paths'])
    updateExtensionsFromConfig(this.extensions, cfg.extensions)

    updateFilePatterns(this.filePatterns, cfg['file-patterns'])
    updateFilePatterns(this.filePatterns, cfg.filePatterns)
  }

  extensionsToArray() {
    const result = []
    for (const [k, v] of this.extensions) {
      if (v) {
        result.push(k)
      }
    }
    return result
  }

  addExtension(extension) {
    if (!this.extensions.has(extension)) {
      this.extensions.set(extension, true)
    }
  }

  load(directory = process.cwd()) {
    const home = os.homedir()
    const configs = []
    while (directory !== home && directory !== '/') {
      const packageJson = path.resolve(directory, 'package.json')
      if (existsSync(packageJson)) {
        let pkg
        try {
          pkg = require(packageJson)
        } catch (_error) {}
        if (typeof pkg === 'object' && pkg !== null && !Array.isArray(pkg)) {
          if (!this.projectPath) {
            this.projectPath = directory
          }
          const cfg = pkg['acuris-eslint']
          if (cfg) {
            configs.push(cfg)
          }
        }
      }
      const parent = path.dirname(directory)
      if (parent.length >= directory.length) {
        break
      }
      directory = parent
    }

    for (let i = configs.length - 1; i >= 0; --i) {
      this.add(configs[i])
    }

    return this
  }

  static get projectConfig() {
    const projectConfig = new this().load(process.cwd())
    this.projectConfig = projectConfig
    return projectConfig
  }

  static set projectConfig(value) {
    Object.defineProperty(this, 'projectConfig', { value, configurable: true, writable: true, enumerable: true })
  }
}

function updateSetFromConfig(set, input) {
  if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      for (const v of input) {
        if (typeof v === 'string' && v.length !== 0) {
          if (v.startsWith('!')) {
            set.delete(v.slice(1))
          } else {
            set.add(v)
          }
        }
      }
    } else {
      for (const [k, v] of Object.entries(input)) {
        const key = k.trim()
        if (key) {
          if (toBoolean(v)) {
            set.add(key)
          } else {
            set.delete(key)
          }
        }
      }
    }
  }
}

function updateExtensionsFromConfig(map, input) {
  if (typeof input !== 'object' || input === null) {
    return
  }

  if (Array.isArray(input)) {
    for (let v of input) {
      if (typeof v !== 'string') {
        continue
      }
      v = v.trim()
      if (v.length === 0) {
        continue
      }
      if (v.startsWith('!')) {
        v = v.slice(1)
        if (!v.startsWith('.')) {
          v = `.${v}`
        }
        map.set(v, false)
      } else {
        if (!v.startsWith('.')) {
          v = `.${v}`
        }
        map.set(v, true)
      }
    }
    return
  }

  for (const [k, v] of Object.entries(input)) {
    const key = k.trim()
    if (key.length) {
      map.set(k.startsWith('.') ? key : `.${key}`, toBoolean(v))
    }
  }
}

function toBoolean(x) {
  return x === true || x === 'true' || (typeof x === 'number' && x >= 1)
}

function updateFilePatterns(filePatterns, values) {
  if (typeof values !== 'object' || values === null) {
    return
  }

  for (const key of Object.keys(filePatterns)) {
    if (!Array.isArray(filePatterns[key])) {
      continue
    }

    const v = values[key]
    if (typeof v !== 'object' || v === null) {
      continue
    }

    const set = new Set(filePatterns[key])

    if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === 'string') {
          if (item.startsWith('!')) {
            set.delete(item.slice(1))
          } else {
            set.add(item)
          }
        }
      }
    } else {
      for (const [pattern, enabled] of Object.entries(values[key])) {
        if (toBoolean(enabled)) {
          set.add(pattern)
        } else {
          set.delete(pattern)
        }
      }
    }
    filePatterns[key] = Array.from(set)
  }
}
