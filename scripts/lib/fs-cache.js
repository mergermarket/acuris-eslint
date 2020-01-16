'use strict'

const fs = require('fs')
const path = require('path')

module.exports = {
  startFsCache
}

/**
 * Several eslint plugins are not well optimized.
 * (for example eslint-plugin-import and eslint-plugin-node).
 * These plugins don't cache properly the result of looking up for package.json.
 * To speed up things, especially for big projects, we can cache package.json and stat
 * by monkey-patching fs.
 */
function startFsCache() {
  const fsStatSync = fs.statSync
  const fsReadFileSync = fs.readFileSync

  const pkgCache = new Map()
  const statCache = new Map()

  const pathResolve = path.resolve

  const PACKAGE_JSON = 'package.json'

  fs.statSync = function statSync(p, options) {
    if (typeof p === 'string' && options === undefined) {
      return cachedStatSync(p)
    }
    return fsStatSync(p, options)
  }

  fs.readFileSync = function readFileSync(p, options) {
    if (typeof p === 'string' && p.indexOf(PACKAGE_JSON, p.length - PACKAGE_JSON.length) !== -1) {
      const content = cachedReadUtf8Sync(p)
      const enc = (typeof options === 'object' && options !== null && options.encoding) || options
      if (enc === 'utf8' || enc === 'utf-8' || enc === 'UTF8' || enc === 'UTF-8') {
        return content
      }
      return Buffer.from(content)
    }
    return fsReadFileSync(p, options)
  }

  return {
    stop
  }

  function stop() {
    fs.statSync = fsStatSync
    fs.readFileSync = fsReadFileSync
  }

  function cachedStatSync(p) {
    const key = pathResolve(p)
    let result = statCache.get(key)
    if (result === undefined) {
      try {
        result = fsStatSync(p)
      } catch (e) {
        const code = e.code
        if (code === 'ENOENT') {
          result = 0
          statCache.set(key, 0)
          pkgCache.set(key, 0)
        }
        throw e
      }
      statCache.set(key, result)
    } else if (result === 0) {
      throwFileNotFoundError(p, 'stat')
    }
    return result
  }

  function cachedReadUtf8Sync(p) {
    const key = pathResolve(p)
    let result = pkgCache.get(key)
    if (result === undefined) {
      try {
        result = fsReadFileSync(p, 'utf8')
      } catch (e) {
        const code = e.code
        if (code === 'ENOENT') {
          result = 0
          pkgCache.set(key, 0)
          statCache.set(key, 0)
        } else if (code === 'EISDIR') {
          result = 1
          pkgCache.set(key, 1)
        }
        throw e
      }
      pkgCache.set(key, result)
    } else if (result === 0) {
      throwFileNotFoundError(p, 'open')
    } else if (result === 1) {
      throwFileIsDir(p)
    }
    return result
  }
}

function throwFileNotFoundError(filename, syscall) {
  const e = new Error(`ENOENT: no such file or directory, ${syscall} '${filename}'`)
  e.errno = -2
  e.syscall = syscall
  e.code = 'ENOENT'
  e.path = filename
  throw e
}

function throwFileIsDir(filename) {
  const e = new Error('EISDIR: illegal operation on a directory, read')
  e.errno = -21
  e.syscall = 'read'
  e.code = 'EISDIR'
  e.path = filename
  throw e
}
