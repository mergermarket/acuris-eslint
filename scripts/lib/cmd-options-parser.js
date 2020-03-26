'use strict'

const path = require('path')

module.exports = {
  getProgramName,
  createCmdOptionsParser
}

function getProgramName() {
  const argv1 = process.argv[1] || ''
  return path.basename(argv1, path.extname(argv1))
}

function createCmdOptionsParser(programName = getProgramName()) {
  const map = new Map()
  let isCommand = true

  const instance = { grp, opt, line, parse }
  return instance

  function grp() {
    isCommand = false
    return instance
  }

  function line() {
    return instance
  }

  function opt({ option, key = option, alias, type = 'boolean', value }) {
    const entry = { option, key, type, value, isCommand }
    map.set(option, entry)
    if (alias) {
      map.set(alias, entry)
    }
    return instance
  }

  function parse(args = process.argv.slice(2)) {
    let list = []
    const options = {}
    let command
    let multipleCommands
    for (const entry of map.values()) {
      if (!entry.isCommand) {
        options[entry.key] = entry.value
      }
    }

    const len = args.length
    for (let i = 0; i < len; ++i) {
      const arg = args[i]
      if (arg.length > 1 && arg.charCodeAt(0) === 45) {
        i = processOption(arg, i)
      } else {
        list.push(arg)
      }
    }

    if (command && command.type !== 'help' && multipleCommands) {
      throw new Error(`Multiple commands are not supported. Found '${command.option}' and '${multipleCommands}'`)
    }

    return { programName, command, options, list }

    function processOption(arg, i) {
      let value = ''
      let option = arg
      const indexOfEq = option.indexOf('=')
      if (indexOfEq >= 0) {
        value = arg.slice(indexOfEq + 1).trim()
        option = arg.slice(0, indexOfEq).trimRight()
        if (!option) {
          throw new Error(`Invalid option '${arg}'.`)
        }
      } else {
        option = option.trimRight()
      }

      let negated = false
      let key
      if (arg.charCodeAt(1) === 45) {
        negated = option.startsWith('--no-')
        if (negated) {
          key = option.slice(5)
        } else {
          key = option.slice(2)
          if (key.length === 0) {
            if (indexOfEq < 0) {
              list = list.concat(args.slice(i + 1))
              return args.length
            }
            list.push(arg)
            return i
          }
        }
      } else {
        key = option.slice(1)
        if (option.length !== 2) {
          const best = similarOption(map, key)
          throw new Error(`Invalid option '${option}' - perhaps you meant '${best.length === 1 ? '-' : '--'}${best}'?`)
        }
      }

      const entry = map.get(key)
      if (!entry) {
        if (!/^[a-zA-Z0-9-]/.test(key)) {
          list.push(arg)
          return i
        }

        const best = similarOption(map, key)
        throw new Error(`Unknown option '${option}' - perhaps you meant '${best.length === 1 ? '-' : '--'}${best}'?`)
      }

      const type = entry.type

      if (negated && type !== 'boolean') {
        const best = similarOption(map, key)
        throw new Error(`Unknown option '${option}' - perhaps you meant '${best.length === 1 ? '-' : '--'}${best}'?`)
      }

      if (indexOfEq > 0) {
        if (entry.isCommand && (type === 'boolean' || type === 'help')) {
          throw new Error(
            `Invalid command '${option}=${value}' - perhaps you meant '${option.length === 1 ? '-' : '--'}${option}${
              value ? ` ${value}` : ''
            }'?`
          )
        }
        if (!value) {
          throw new Error(`No value for '${option}' of type '${type}' specified.`)
        }
      }

      value = value.trim()
      if (type === 'boolean') {
        if (!value || value === 'true' || value === '1' || value === 'y' || value === 'Y') {
          value = !negated
        } else if (value === 'false' || value === '0' || value === 'n' || value === 'N') {
          value = negated
        } else {
          throw new Error(
            `Invalid value for ${
              entry.isCommand ? 'command' : 'option'
            } '${option}' - expected type 'boolean', received value: ${value}.`
          )
        }
      } else if (type === 'help') {
        value = true
      } else {
        if (indexOfEq < 0) {
          const next = args[i + 1]
          if (typeof next === 'string' && !next.startsWith('-')) {
            value = next.trim()
            ++i
          }
        }

        if (!value) {
          if (entry.value === undefined) {
            throw new Error(
              `Value for ${entry.isCommand ? 'command' : 'option'} '${option}' of type '${type}' is required`
            )
          }
          value = entry.value
        }

        if (type === 'int') {
          const intValue = parseInt(value)
          if (isNaN(intValue)) {
            throw new Error(
              `Invalid value for ${
                entry.isCommand ? 'command' : 'option'
              } '${option}' - expected type 'int', received value: ${value}.`
            )
          }
          value = intValue
        }
      }

      if (entry.isCommand) {
        if (command && entry.type !== 'help') {
          multipleCommands = entry.option
          return i
        }
        command = { option: entry.option, key: entry.key, type: entry.type, value }
      } else {
        options[entry.key] = value
      }
      return i
    }
  }
}

function similarOption(lookup, value) {
  let bestDistance = Number.MAX_SAFE_INTEGER
  let best = value
  for (const [k, v] of lookup) {
    const d = levenshtein(k, value)
    if (d < bestDistance) {
      bestDistance = d
      best = k
    }
    if (!v.isCommand && v.type === 'boolean') {
      const k1 = `no-${k}`
      const d1 = levenshtein(k1, value)
      if (d1 < bestDistance) {
        bestDistance = d1
        best = k1
      }
    }
  }
  return best
}

function levenshtein(a, b) {
  if (a.length === 0) {
    return b.length
  }
  if (b.length === 0) {
    return a.length
  }
  const mat = []
  for (let i = 0; i <= b.length; i++) {
    mat[i] = [i]
    mat[0][i] = i
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charCodeAt(i - 1) === a.charCodeAt(j - 1)) {
        mat[i][j] = mat[i - 1][j - 1]
      } else {
        mat[i][j] = Math.min(mat[i - 1][j - 1] + 1, mat[i][j - 1] + 1, mat[i - 1][j] + 1)
      }
    }
  }
  return mat[b.length][a.length]
}
