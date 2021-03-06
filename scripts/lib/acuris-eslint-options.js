'use strict'

const path = require('path')
const projectConfig = require('../../core/project-config').projectConfig
const { createCmdOptionsParser, getProgramName } = require('./cmd-options-parser')

module.exports = {
  projectConfig,
  acurisEslintOptions,
  parseAcurisEslintOptions,
  tryParseAcurisEslintOptions,
  translateOptionsForCLIEngine
}

function tryParseAcurisEslintOptions(args) {
  try {
    return parseAcurisEslintOptions(args)
  } catch (error) {
    require('../acuris-eslint-help').printAcurisEslintOptionsParseError(error, getProgramName())
  }
  return false
}

function parseAcurisEslintOptions(args) {
  const parser = createCmdOptionsParser()
  acurisEslintOptions(parser)
  const result = parser.parse(args)

  const options = result.options
  const command = result.command

  if (options.cwd) {
    options.cwd = path.resolve(options.cwd)
  }

  if (command) {
    result.canLog = command.type !== 'help'
  } else {
    if (result.list.length === 0) {
      result.list.push('.')
    }
    const format = options.format
    result.canLog =
      !format ||
      format === 'unix' ||
      format === 'visualstudio' ||
      format === 'codeframe' ||
      format === 'table' ||
      format === 'compact' ||
      format === 'stylish'
  }

  if (options.lintStaged) {
    options.cache = false
  }

  if (options.fix) {
    if (options.fixDryRun) {
      options.fix = false
    }
    if (options.stdin) {
      options.fix = false
      options.fixDryRun = true
    }
  }

  if (options.ignore === false) {
    options.ignorePath = undefined
  }

  options.projectConfig = projectConfig

  return result
}

function acurisEslintOptions(factory) {
  factory
    .opt({ option: 'help', alias: 'h', type: 'help', desc: 'Show help' })
    .opt({ option: 'commands', type: 'help', desc: 'Show commands help' })
    .opt({ option: 'sys-info', type: 'help', desc: 'Print system info, packages versions and supported features' })
    .opt({ option: 'version', type: 'help', desc: 'Print @acuris/eslint-config version' })
    .opt({ option: 'logo', type: 'help', desc: 'Print acuris-eslint logo' })
    .line()
    .opt({ option: 'clear-cache', desc: 'Deletes eslint cache from disk' })
    .opt({ option: 'print-config', type: 'path', value: '.', desc: 'Print the eslint configuration' })
    .line()
    .opt({ option: 'init', desc: 'Initialises or updates a project' })
    .opt({ option: 'update', desc: 'Updates acuris-eslint and all dependencies' })
    .line()
    .opt({ option: 'init-eslint', desc: 'Updates or creates eslint configuration' })
    .opt({ option: 'init-gitignore', desc: 'Updates or creates .gitignore' })
    .opt({ option: 'init-npmignore', desc: 'Updates or creates .npmignore' })
    .opt({ option: 'init-package', desc: 'Updates or creates package.json' })
    .opt({ option: 'init-prettier', desc: 'Updates or creates prettier configuration' })
    .opt({ option: 'init-tsconfig', desc: 'Updates or creates typescript tsconfig.json' })
    .opt({ option: 'init-vscode', desc: 'updates Visual Studio Code workspace settings' })
    .opt({ option: 'init-clang-format', desc: 'writes .clang-format file for c++ projects' })
    .grp('Configuration')
    .opt({
      option: 'cwd',
      type: 'path',
      desc: 'The base folder for the project (cwd)'
    })
    .opt({
      option: 'config',
      alias: 'c',
      type: 'path',
      value: projectConfig.eslintrc || undefined,
      desc: 'Use this eslint configuration, overriding .eslintrc.* config options if present'
    })
    .opt({
      option: 'resolve-plugins-relative-to',
      key: 'resolvePluginsRelativeTo',
      type: 'path',
      desc: 'A folder where plugins should be resolved from, CWD by default'
    })
    .opt({
      option: 'rulesdir',
      key: 'rulePaths',
      type: 'path',
      desc: 'Use additional rules from this directory'
    })
    .grp('Ignoring files')
    .opt({
      option: 'ignore',
      key: 'ignore',
      type: 'boolean',
      value: true,
      desc: 'Disable use of ignore files and patterns'
    })
    .opt({
      option: 'ignore-path',
      key: 'ignorePath',
      type: 'path',
      desc: 'Specify path of ignore file'
    })
    .opt({
      option: 'ignore-pattern',
      key: 'ignorePattern',
      type: 'string',
      desc: 'Pattern of files to ignore (in addition to those in .eslintignore)'
    })
    .opt({
      option: 'ignore-unknown-extensions',
      key: 'ignoreUnknownExtensions',
      type: 'boolean',
      value: false,
      desc:
        'If a full filename is passed to acuris-eslint, it will be processed also if the extension is invalid. With this option enabled, unknown extensions will be ignored instead.'
    })
    .grp('Fixing problems')
    .opt({ option: 'fix', value: false, desc: 'Automatically fix problems' })
    .opt({
      option: 'fix-dry-run',
      key: 'fixDryRun',
      type: 'boolean',
      value: false,
      desc: 'Automatically fix problems without saving the changes to the file system'
    })
    .grp('Warnings')
    .opt({
      option: 'quiet',
      type: 'boolean',
      value: false,
      desc: 'Report errors only'
    })
    .opt({
      option: 'max-warnings',
      key: 'maxWarnings',
      type: 'int',
      value: -1,
      desc: 'Number of warnings to trigger nonzero exit code'
    })
    .opt({
      option: 'report-unused-disable-directives',
      key: 'reportUnusedDisableDirectives',
      type: 'boolean',
      value: false,
      desc: 'Adds reported errors for unused eslint-disable directives'
    })
    .grp('Using stdin')
    .opt({
      option: 'stdin',
      type: 'boolean',
      value: false,
      desc: 'Lint code provided on <STDIN>'
    })
    .opt({
      option: 'stdin-filename',
      key: 'stdinFilename',
      type: 'string',
      desc: 'Specify filename to process STDIN as'
    })
    .grp('Caching')
    .opt({
      option: 'cache',
      type: 'boolean',
      value: projectConfig.eslintCache,
      desc: 'Disable cache and check also non changed files'
    })
    .opt({
      option: 'cache-location',
      key: 'cacheLocation',
      type: 'path',
      value: projectConfig.eslintCacheLocation,
      desc: 'Path to the cache file or directory'
    })
    .opt({
      option: 'cache-file',
      key: 'cacheFile',
      value: projectConfig.eslintCacheLocation,
      type: 'path'
    })
    .grp('Output')
    .opt({
      option: 'output-file',
      key: 'outputFile',
      alias: 'o',
      type: 'path',
      desc: 'Specify file to write report to'
    })
    .opt({
      option: 'format',
      alias: 'f',
      type: 'string',
      value: projectConfig.eslintOutputFormat,
      desc: 'Use a specific output format'
    })
    .opt({ option: 'color', desc: 'Force enabling/disabling of color' })
    .grp('Miscellaneous')
    .opt({
      option: 'debug',
      type: 'boolean',
      value: false,
      desc: 'Output debugging information'
    })
    .opt({
      option: 'lint-staged',
      key: 'lintStaged',
      type: 'boolean',
      value: false,
      desc: 'Should be used when called by lint-staged or husky'
    })
}

function translateOptionsForCLIEngine(cliOptions) {
  const options = cliOptions.options
  const cwd = options.cwd || process.cwd()
  const result = {
    useEslintrc: true,
    allowInlineConfig: true,
    baseConfig: require('../../index.js'),
    errorOnUnmatchedPattern: false,
    ignore: options.ignore,
    ignorePath: options.ignorePath,
    rulePaths: options.rulePaths,
    cache: options.cache,
    cacheLocation:
      (options.cacheLocation && path.resolve(cwd, options.cacheLocation)) ||
      (options.cacheFile && path.resolve(cwd, options.cacheFile)),
    fix: options.fix || options.fixDryRun,
    reportUnusedDisableDirectives: options.reportUnusedDisableDirectives || 'off',
    resolvePluginsRelativeTo: options.resolvePluginsRelativeTo

    // TODO: options.ignorePattern - Please use the 'overrideConfig.ignorePatterns' option instead
    // TODO: configFile: options.config - Please use the 'overrideConfigFile' option instead.

    //parser: undefined,
    //envs: undefined,
    //rules: undefined,
    //plugins: undefined,
    //globals: undefined,
    //parserOptions: undefined,
    //fixTypes: undefined,
  }

  return result
}
