const { parentPort } = require('worker_threads')
const { stat, readFile, writeFile } = require('fs').promises

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
}

async function prettifyFile(filePath) {
  let options
  try {
    try {
      const info = await stat(filePath)
      if (info.isSymbolicLink() || !info.isFile() || info.size > MAX_FILE_SIZE_IN_BYTES) {
        return
      }
    } catch (_error) {
      return
    }

    let source
    try {
      const info = await prettier.getFileInfo(filePath, { resolveConfig: true })
      if (!info || info.ignored) {
        return
      }

      const resolvedConfigPromise = prettier.resolveConfig(filePath)

      source = await readFile(filePath, 'utf8')

      options = {
        useCache: true,
        filepath: filePath,
        prettierDefaultConfig,
        ...(await resolvedConfigPromise)
      }

      if (info.inferredParser) {
        if (!options.parser) {
          options.parser = info.inferredParser
        }
        if (!options.inferredParser) {
          options.inferredParser = info.inferredParser
        }
      }
    } catch (_error) {
      return
    }

    const formatted = prettier.format(source, options)
    if (formatted !== source) {
      await writeFile(filePath, formatted)
      ++prettified
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error()

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
