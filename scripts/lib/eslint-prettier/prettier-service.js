const { Worker, SHARE_ENV } = require('worker_threads')
const { basename, extname, isAbsolute } = require('path')
const os = require('os')

const { eslintRequire } = require('../../../core/node-modules')

module.exports = {
  startIterateFileSpeedup,
  startPrettierService,
  startEslintPrettier
}

function startIterateFileSpeedup() {
  const MAX_CACHED_ITEMS = 52

  const fileEnumeratorProto = eslintRequire('./lib/cli-engine/file-enumerator.js').FileEnumerator.prototype

  const oldIterateFiles = fileEnumeratorProto.iterateFiles
  fileEnumeratorProto.iterateFiles = iterateFiles

  const end = () => {
    if (fileEnumeratorProto && fileEnumeratorProto.iterateFiles === iterateFiles) {
      fileEnumeratorProto.iterateFiles = oldIterateFiles
    }
  }

  function* iterateFiles(patternOrPatterns) {
    const buffer = []
    for (const item of oldIterateFiles.call(this, patternOrPatterns)) {
      if (buffer.length < MAX_CACHED_ITEMS) {
        buffer.push(item)
      } else {
        yield* buffer
        buffer.length = 0
      }
    }
    yield* buffer
  }

  return end
}

function startEslintPrettier() {
  const fileEnumeratorProto = eslintRequire('./lib/cli-engine/file-enumerator.js').FileEnumerator.prototype
  const oldIsTargetPath = fileEnumeratorProto.isTargetPath

  const prettierService = startPrettierService()

  function isTargetPath(filepath, providedConfig) {
    const result = oldIsTargetPath.call(this, filepath, providedConfig)
    if (
      !result &&
      providedConfig &&
      isAbsolute(filepath) &&
      !this._isIgnoredFile(filepath, { ...providedConfig, dotfiles: true, direct: false })
    ) {
      prettierService.prettify(filepath)
    }
    return result
  }

  if (prettierService.hasPrettier) {
    // Monkey patch eslint FileEnumerator to pass ignored files to prettier
    fileEnumeratorProto.isTargetPath = isTargetPath
  }

  const endEslintPrettier = () => {
    if (fileEnumeratorProto.isTargetPath === isTargetPath) {
      fileEnumeratorProto.isTargetPath = oldIsTargetPath
    }
    return prettierService.end()
  }

  return endEslintPrettier
}

function startPrettierService() {
  const MAX_WORKERS = Math.floor(os.cpus().length / 2)
  const workers = []
  let roundRobin = 0

  /** @type {typeof import('prettier')} */
  const prettier = require('eslint-plugin-quick-prettier/prettier-interface').tryGetPrettier()

  const prettierFilenames = new Set()
  const prettierExtensions = new Set()

  if (prettier) {
    workers.push(startPrettierThread())
    const supportInfo = prettier.getSupportInfo()
    for (const language of supportInfo.languages) {
      if (language.extensions) {
        for (const extension of language.extensions) {
          prettierExtensions.add(extension)
        }
      }
      if (language.filenames) {
        for (const filename of language.filenames) {
          prettierFilenames.add(filename)
        }
      }
    }
  }

  const end = async () => {
    const msgs = await Promise.all(workers.map((w) => w.end()))

    let prettified = 0
    const errors = []
    for (const msg of msgs) {
      if (msg) {
        prettified += msg.prettified
        if (msg.errors.length !== 0) {
          errors.push(...msg.errors)
        }
      }
    }

    return {
      prettified,
      errors
    }
  }

  const prettify = (filepath) => {
    if (prettierFilenames.has(basename(filepath)) || prettierExtensions.has(extname(filepath))) {
      if (roundRobin > 0 && workers.length < MAX_WORKERS) {
        workers.push(startPrettierThread())
      }
      workers[++roundRobin % workers.length].prettify(filepath)
    }
  }

  return {
    hasPrettier: !!prettier,
    prettify,
    end
  }
}

function startPrettierThread() {
  let worker = new Worker(require.resolve('./prettier-thread.js'), { env: SHARE_ENV })
  worker.unref()

  const promise = new Promise((resolve, reject) => {
    worker.on('error', (error) => {
      end()
      reject(error)
    })

    worker.on('message', (msg) => {
      worker = null
      resolve(msg)
    })

    worker.on('exit', () => {
      worker = null
      resolve()
    })
  })

  function prettify(name) {
    if (worker) {
      worker.postMessage({ type: 'prettify', name })
    }
  }

  function end() {
    if (worker) {
      try {
        worker.postMessage({ type: 'ending' })
      } catch (_) {}
    }
    return promise
  }

  return { prettify, end }
}
