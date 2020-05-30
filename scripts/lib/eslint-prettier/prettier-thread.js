'use strict'

const { parentPort, workerData, threadId } = require('worker_threads')
const fs = require('fs')
const { resolve: pathResolve, dirname: pathDirname, relative: pathRelative } = require('path')
const { homedir: osHomeDir } = require('os')
const ignore = require('ignore')

const { stat: fsStatAsync, readFile: fsReadFileAsync, writeFile: fsWriteFileAsync } = fs.promises

require('../../../core/node-modules')

const { tryGetPrettier, tryGetPrettierConfig } = require('eslint-plugin-quick-prettier/prettier-interface')

const MAX_FILE_SIZE_IN_BYTES = 500000

/** @type {typeof import('prettier')} */
const prettier = tryGetPrettier()
const prettierDefaultConfig = prettier && tryGetPrettierConfig()

let prettified = 0
const errors = []

let inProgress = 0
let onReleased = null

const debug = !!workerData.debug
if (debug) {
  console.debug(`prettier thread ${threadId} started`)
}
if (prettier) {
  parentPort.on('message', handleMessage)
} else {
  doEnd()
}

function handleMessage(msg) {
  if (typeof msg !== 'object' || msg === null) {
    return undefined
  }

  if (msg.type === 'ending') {
    return doEnd().catch(() => {})
  }

  if (msg.type === 'prettify') {
    ++inProgress
    prettifyFile(msg.name)
  }
  return undefined
}

async function doEnd() {
  await new Promise((resolve) => {
    if (inProgress > 0) {
      onReleased = resolve
    } else {
      resolve()
    }
  })
  parentPort.postMessage({ prettified, errors })
  parentPort.off('message', handleMessage)
  parentPort.unref()
  if (debug) {
    console.debug(`prettier thread ${threadId} terminated`)
  }
}

const _ignoreFileCache = new Map()
let _osHomeDir
let _defaultIgnoreFile

function getOsHomeDir() {
  return _osHomeDir || (_osHomeDir = osHomeDir() || '/')
}

async function loadIgnoreFileAsync(found, dir) {
  let text = ''
  try {
    text = await fsReadFileAsync(pathResolve(dir, '.prettierignore'), 'utf8')
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1)
    }
    text = text.replace(/[\r\n]/gm, '\n')
  } catch (_error) {}

  const content = text.split('\n').filter((x) => x && x.charCodeAt(0) !== 35)

  let result
  if (found && content.length === 0) {
    result = found
  } else {
    result = ignore({ ignorecase: false })
    result.directory = dir
    if (found) {
      result.add(found)
    }
    result.add(content)
  }

  _ignoreFileCache.set(dir, result)
  return result
}

async function buildIgnoreFileAsync(dir, recursive) {
  let found = _ignoreFileCache.get(dir)
  if (found !== undefined) {
    return found
  }

  if (recursive) {
    const parentDir = pathDirname(dir)
    if (parentDir && parentDir !== getOsHomeDir() && parentDir.length !== dir.length) {
      found = await getIgnoreFileAsync(parentDir, true)
    } else {
      if (!_defaultIgnoreFile) {
        _defaultIgnoreFile = loadIgnoreFileAsync(null, pathResolve(__dirname, '../../..'))
      }
      found = await _defaultIgnoreFile
      found.directory = '/'
    }
  }

  return loadIgnoreFileAsync(found, dir)
}

function getIgnoreFileAsync(dir, recursive) {
  let result = _ignoreFileCache.get(dir)
  if (result === undefined) {
    result = buildIgnoreFileAsync(dir, recursive)
    _ignoreFileCache.set(dir, result)
  }
  return result
}

async function prettifyFile(filePath) {
  let options
  try {
    try {
      const info = await fsStatAsync(filePath)
      if (info.isSymbolicLink() || !info.isFile() || info.size > MAX_FILE_SIZE_IN_BYTES) {
        return
      }
    } catch (_error) {
      return
    }

    const ignorer = await getIgnoreFileAsync(pathDirname(filePath), true)
    const relativePath = pathRelative(ignorer.directory, filePath)

    let source
    try {
      if (ignorer.test(relativePath).ignored) {
        if (debug) {
          console.debug(`>>> prettier ${filePath} ignored`)
        }
        return
      }

      const resolvedConfigPromise = prettier.resolveConfig(filePath, { useCache: true, editorconfig: true })

      source = await fsReadFileAsync(filePath, 'utf8')

      options = {
        filepath: filePath,
        prettierDefaultConfig,
        ...(await resolvedConfigPromise),
        useCache: true
      }
    } catch (_error) {
      return
    }

    if (debug) {
      console.debug(`>>> prettier ${filePath}`)
    }

    const formatted = prettier.format(source, options)
    if (formatted !== source) {
      await fsWriteFileAsync(filePath, formatted)
      ++prettified
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error()

    const errorMessage = `${e.message}`
    if (errorMessage.startsWith('Multi-line single-quoted string needs to be sufficiently indented')) {
      return // Yaml parsing error that can be ignored.
    }

    // Prettier's message contains a codeframe style preview of the
    // invalid code and the line/column at which the error occured.
    // ESLint shows those pieces of information elsewhere already so
    // remove them from the message
    let message = (error instanceof SyntaxError ? 'Parsing error: ' : ' Prettier error: ') + error.message

    if (error.codeFrame) {
      message = message.replace(`${error.codeFrame}`, '')
    }

    const loc = error.loc
    let line
    let column = NaN
    if (loc && loc.start && loc.start.line) {
      line = loc.start.line || undefined
      column = loc.start.column || NaN
      message = message.replace(/ \(\d+:\d+\)\s?$/, '')
    }

    let ruleId = 'prettier'

    if (options && options.parser) {
      ruleId += `:${options.parser}`
    }

    if (error.code) {
      ruleId += `-${error.code}`
    }

    errors.push({
      filePath,
      messages: [
        {
          ruleId,
          severity: 2,
          message,
          line,
          column,
          nodeType: null
        }
      ],
      errorCount: 1,
      warningCount: 0,
      fixableErrorCount: 0,
      fixableWarningCount: 0
    })
  } finally {
    if (--inProgress <= 0 && onReleased) {
      onReleased()
    }
  }
}
