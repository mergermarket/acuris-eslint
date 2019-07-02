const { isArray } = Array
const { assign: objectAssign, keys: objectKeys } = Object

/**
 * Merges multiple eslint configurations together or clones the given one.
 * @template T
 * @param  {...readonly T?} sources The sources to merge
 * @returns {Required<T>} A new merged configuration
 */
module.exports = function mergeEslintConfigs(...sources) {
  let result = {}
  for (let i = 0; i < sources.length; ++i) {
    const source = sources[i]
    if (source !== null && source !== undefined) {
      if (typeof source !== 'object') {
        throw new TypeError(`eslint configuration ${i} must be an object but is a ${typeof source}`)
      }
      result = isArray(source) ? mergeEslintConfigs(result, ...source) : deepmerge(result, source, true)
    }
  }
  return result
}

function deepmerge(target, src, combine, isRule) {
  /*
   * This code is inspired from deepmerge and eslint
   * (https://github.com/KyleAMathews/deepmerge)
   */
  const array = isArray(src) || isArray(target)
  let dst = (array && []) || {}

  if (array) {
    const resolvedTarget = target || []

    // src could be a string, so check for array
    if (isRule && isArray(src) && src.length > 1) {
      dst = dst.concat(src)
    } else {
      dst = dst.concat(resolvedTarget)
    }
    const resolvedSrc = typeof src === 'object' ? src : [src]
    const keys = objectKeys(resolvedSrc)
    for (let i = 0, len = keys.length; i !== len; ++i) {
      const e = resolvedSrc[i]
      if (dst[i] === undefined) {
        dst[i] = e
      } else if (typeof e === 'object') {
        if (isRule) {
          dst[i] = e
        } else {
          dst[i] = deepmerge(resolvedTarget[i], e, combine, isRule)
        }
      } else if (!combine) {
        dst[i] = e
      } else if (dst.indexOf(e) === -1) {
        dst.push(e)
      }
    }
  } else {
    if (target && typeof target === 'object') {
      objectAssign(dst, target)
    }
    const keys = objectKeys(src)
    for (let i = 0, len = keys.length; i !== len; ++i) {
      const key = keys[i]
      if (key === 'overrides') {
        const overrides = (target[key] || []).concat(src[key] || [])
        if (overrides.length !== 0) {
          dst[key] = overrides
        }
      } else if (isArray(src[key]) || isArray(target[key])) {
        dst[key] = deepmerge(target[key], src[key], key === 'plugins' || key === 'extends', isRule)
      } else if (typeof src[key] !== 'object' || !src[key] || key === 'exported' || key === 'astGlobals') {
        dst[key] = src[key]
      } else {
        dst[key] = deepmerge(target[key] || {}, src[key], combine, key === 'rules')
      }
    }
  }

  return dst
}
