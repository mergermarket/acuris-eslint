const chalk = require('chalk')
const path = require('path')

module.exports.chalk = chalk

module.exports.createCmdOptionsHelp = createCmdOptionsHelp

module.exports.getProgramName = getProgramName

const chalkDisabled = new chalk.Instance({ level: 0 })

function getProgramName() {
  const argv1 = process.argv[1] || ''
  return path.basename(argv1, path.extname(argv1))
}

function createCmdOptionsHelp(programName = getProgramName()) {
  let group = { name: 'Commands', options: [] }
  const groups = []

  const instance = {
    grp,
    opt,
    line,
    getCommandsHelp,
    getHelp
  }
  return instance

  function grp(name) {
    if (!group.name !== name) {
      group = { name, options: [] }
    }
    return instance
  }

  function line() {
    if (group.options[group.options.length - 1]) {
      group.options.push(null)
    }
    return instance
  }

  function opt(option) {
    if (option.desc) {
      if (group.options.length === 0) {
        groups.push(group)
      }
      group.options.push(option)
    }
    return instance
  }

  function getCommandsHelp(name = 'Commands') {
    const result = []
    result.push(`${chalk.whiteBright(programName)} ${chalk.cyanBright('--<command>')} ${chalk.gray('[arguments]')}`)
    result.push(`  ${chalk.cyan('executes the given command')}`, '')
    result.push(`${chalk.greenBright(name)}:`, '')
    const g = groups.find(t => t.name === name)
    if (g) {
      for (const o of g.options) {
        if (!o) {
          continue
        }
        let s = `${chalk.white(programName)} ${chalk.cyanBright(`--${o.option}`)}`
        if (o.type !== 'help' && o.type !== 'boolean' && o.type !== undefined) {
          if (o.value === undefined) {
            s += ` ${chalk.gray('<')}${chalk.green(o.type)}${chalk.gray('>')}`
          } else {
            s += ` ${chalk.gray('[')}${chalk.green(o.type)}${chalk.gray(']')}`
          }
        }
        result.push(s)
        result.push(`  ${chalk.cyan(o.desc || `Executes ${o.key || o.option}`)}`)
        result.push('')
      }
    }
    return result.join('\n')
  }

  function getHelp(maxWidth = (process.stdout && process.stdout.columns) || 500) {
    const result = []

    const maxCmdHeaderLen = getMaxCmdHeaderLen()
    const cmdDescColumns = maxWidth - maxCmdHeaderLen - 1
    const cmdDescIndent = cmdDescColumns > 15 ? `${' '.repeat(maxCmdHeaderLen + 1)}` : '      '

    for (const g of groups) {
      const isCommand = g.name === 'Commands'
      if (isCommand) {
        result.push(`${chalk.cyanBright.bold(g.name)}:`, '')
      } else {
        result.push(`${chalk.yellow.bold(g.name)}:`)
      }

      for (const o of g.options) {
        if (!o) {
          result.push('')
          continue
        }

        const header = getCommandHeader(g, o, chalk)
        const headerLen = getCmdHeaderLen(g, o)

        let desc = o.desc
        if (!desc.endsWith('.')) {
          desc += '.'
        }

        if (cmdDescColumns > 15) {
          desc = wordWrap(desc, cmdDescColumns, cmdDescIndent)
          result.push(`${header}${' '.repeat(maxCmdHeaderLen - headerLen)} ${isCommand ? chalk.cyan(desc) : desc}`)
        } else {
          result.push(header)
          result.push(cmdDescIndent + (isCommand ? chalk.cyan(desc) : desc))
        }

        if (!isCommand && o.value && o.value !== true) {
          result.push(cmdDescIndent + chalk.italic.gray(`default: ${o.value}`))
        }
      }
      result.push('')
    }
    return result.join('\n')
  }

  function getCommandHeader(g, o, c = chalk) {
    const isCommand = g.name === 'Commands'
    let s = '  '

    let alias = o.alias
    let option = o.option
    if ((o.type === 'boolean' || o.type === undefined) && o.value === true) {
      alias = alias && `no-${alias}`
      option = `no-${option}`
    }

    if (o.alias && o.alias !== o.option) {
      s += (isCommand ? c.cyanBright : c.greenBright)((alias.length > 1 ? '--' : '-') + alias)
      s += ', '
    }

    s += (isCommand ? c.cyanBright : c.greenBright)((option.length > 1 ? '--' : '-') + option)

    if (!isCommand && (o.type === 'boolean' || o.type === undefined) && o.value === undefined) {
      s += ', '
      s += (isCommand ? c.cyanBright : c.greenBright)(`--no-${o.option}`)
    }

    if (o.type !== 'help' && o.type !== 'boolean' && o.type !== undefined) {
      if (o.value === undefined) {
        s += ` ${c.gray('<')}${c.green(o.type)}${c.gray('>')}`
      } else {
        s += ` ${c.gray('[')}${c.green(o.type)}${c.gray(']')}`
      }
    }
    return s
  }

  function getCmdHeaderLen(g, o) {
    return o ? getCommandHeader(g, o, chalkDisabled).length : 0
  }

  function getMaxCmdHeaderLen() {
    let result = 0
    for (const g of groups) {
      for (const o of g.options) {
        result = Math.max(result, getCmdHeaderLen(g, o))
      }
    }
    return result
  }

  function wordWrap(s, width, indent) {
    let r = ''
    while (s.length > width) {
      let found = false
      for (let i = width - 1; i >= 0; i--) {
        if (s.charCodeAt(i) === 32) {
          r += `${s.slice(0, i)}\n${indent}`
          s = s.slice(i + 1)
          found = true
          break
        }
      }
      if (!found) {
        r += `${s.slice(0, width)}\n${indent}`
        s = s.slice(width)
      }
    }
    return r + s
  }
}
