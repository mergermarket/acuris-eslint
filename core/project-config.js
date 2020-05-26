'use strict'

/* eslint-disable global-require */

const os = require('os')
const { dirname, resolve: pathResolve } = require('path')
const { existsSync } = require('fs')
const environment = require('./environment')

const { isArray, from: arrayFrom } = Array

module.exports = class ProjectConfig {
  constructor() {
    this.projectPath = ''

    this.cwd = process.cwd()
    this.eslintrc = ''
    this.eslintCache = true
    this.eslintCacheLocation = '.eslintcache'
    this.eslintOutputFormat = 'stylish'
    this.reactVersion = ''
    this.tsConfigPath = ''
    this.isCI = environment.isCI

    /** Used when running acuris-eslint --fix */
    this.fixWithPrettier = false

    /** @type {Set<string>} */
    this.ignoredPackages = new Set()

    /** @type {Set<string>} */
    this.nodeResolvePaths = new Set()

    this.filePatterns = {
      prettier: [],
      js: ['*.js', '*._js', '*.cjs'],
      mjs: ['*.mjs', '*.es', '*.es6', '*.jsx'],
      json: ['*.json'],
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

  update() {
    const filePatterns = this.filePatterns
    this.jsExtensions = extensionsFromPatterns(filePatterns.js, filePatterns.mjs)
    this.tsExtensions = extensionsFromPatterns(filePatterns.typescript, filePatterns.typescriptDefinition)
    this.jsonExtensions = extensionsFromPatterns(filePatterns.json)
  }

  add(cfg) {
    if (typeof cfg.cwd === 'string') {
      this.cwd = pathResolve(cfg.cwd)
    } else if (cfg.cwd === null) {
      this.cwd = process.cwd()
    }

    if (typeof cfg.eslintrc === 'string' || cfg.eslintrc === null) {
      this.eslintrc = cfg.eslintrc
    }

    if (cfg.eslintCache !== undefined) {
      this.eslintCache = toBoolean(cfg.eslintCache)
    }

    if (cfg.isCI !== undefined) {
      this.isCI = cfg.isCI !== null ? toBoolean(cfg.isCI) : environment.isc
    }

    if (typeof cfg.eslintCacheLocation === 'string' || cfg.eslintCacheLocation === null) {
      this.eslintCacheLocation = cfg.eslintCacheLocation || ''
    }

    if (typeof cfg.eslintOutputFormat === 'string' || cfg.eslintOutputFormat === null) {
      this.eslintOutputFormat = cfg.eslintOutputFormat || ''
    }

    if (typeof cfg.reactVersion === 'string' || cfg.reactVersion === null) {
      this.reactVersion = cfg.reactVersion
    }

    if (typeof cfg.tsConfigPath === 'string' || cfg.tsConfigPath === null) {
      this.tsConfigPath = cfg.tsConfigPath || ''
    }

    updateSetFromConfig(this.ignoredPackages, cfg.ignoredPackages)
    updateSetFromConfig(this.ignoredPackages, cfg['ignored-packages'])
    updateSetFromConfig(this.nodeResolvePaths, cfg.nodeResolvePaths)
    updateSetFromConfig(this.nodeResolvePaths, cfg['node-resolve-paths'])

    updateFilePatterns(this.filePatterns, cfg['file-patterns'])
    updateFilePatterns(this.filePatterns, cfg.filePatterns)
  }

  load(directory = process.cwd()) {
    const home = os.homedir()
    const configs = []
    while (directory !== home && directory !== '/') {
      const packageJson = pathResolve(directory, 'package.json')
      if (existsSync(packageJson)) {
        let pkg
        try {
          pkg = require(packageJson)
        } catch (_error) {}
        if (typeof pkg === 'object' && pkg !== null && !isArray(pkg)) {
          if (!this.projectPath) {
            this.projectPath = directory
          }
          const cfg = pkg['acuris-eslint']
          if (cfg) {
            configs.push(cfg)
          }
        }
      }
      const parent = dirname(directory)
      if (parent.length >= directory.length) {
        break
      }
      directory = parent
    }

    for (let i = configs.length - 1; i >= 0; --i) {
      this.add(configs[i])
    }

    this.update()
    return this
  }

  toJSON() {
    return {
      ...this,
      ignoredPackages: arrayFrom(this.ignoredPackages),
      nodeResolvePaths: arrayFrom(this.nodeResolvePaths)
    }
  }

  static get projectConfig() {
    const projectConfig = new this().load(process.cwd())
    this.projectConfig = projectConfig
    return projectConfig
  }

  static set projectConfig(value) {
    Reflect.defineProperty(this, 'projectConfig', { value, configurable: true, writable: true, enumerable: true })
  }
}

function updateSetFromConfig(set, input) {
  if (typeof input === 'object' && input !== null) {
    if (isArray(input)) {
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

function toBoolean(x) {
  return x === true || x === 'true' || (typeof x === 'number' && x >= 1)
}

function updateFilePatterns(filePatterns, values) {
  if (typeof values !== 'object' || values === null) {
    return
  }

  for (const key of Object.keys(filePatterns)) {
    if (!isArray(filePatterns[key])) {
      continue
    }

    const v = values[key]
    if (typeof v !== 'object' || v === null) {
      continue
    }

    const set = new Set(filePatterns[key])

    if (isArray(v)) {
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
    filePatterns[key] = arrayFrom(set)
  }
}

const extensionPatternRegex = /^\*(.[a-zA-Z_-]+)+$/

function extensionsFromPatterns(...patterns) {
  const set = new Set()
  for (const pattern of patterns) {
    if (isArray(pattern)) {
      for (const subPattern of pattern) {
        if (extensionPatternRegex.test(subPattern)) {
          set.add(subPattern.slice(1))
        }
      }
    } else if (typeof pattern === 'string' && extensionPatternRegex.test(pattern)) {
      set.add(pattern.slice(1))
    }
  }
  return arrayFrom(set)
}
