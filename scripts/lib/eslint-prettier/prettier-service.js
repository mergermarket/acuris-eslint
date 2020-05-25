const { Worker, SHARE_ENV } = require('worker_threads')
const { basename, extname } = require('path')
const os = require('os')

module.exports = {
  startPrettierService
}

function startPrettierService(options = { debug: false }) {
  /** @type {typeof import('prettier')} */
  const prettier = require('eslint-plugin-quick-prettier/prettier-interface').tryGetPrettier()
  if (!prettier) {
    return null
  }

  const MAX_WORKERS = Math.floor(os.cpus().length / 2.5)
  const workers = []
  let prettifiedFiles = 0

  const prettierFilenames = new Set()
  const prettierExtensions = new Set()

  workers.push(startPrettierThread(options))
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
      if (++prettifiedFiles > MAX_WORKERS && workers.length < MAX_WORKERS) {
        workers.push(startPrettierThread(options))
      }
      workers[prettifiedFiles % workers.length].prettify(filepath)
    }
  }

  return {
    prettify,
    end
  }
}

function startPrettierThread(options) {
  let worker = new Worker(require.resolve('./prettier-thread.js'), {
    env: SHARE_ENV,
    workerData: options
  })
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
