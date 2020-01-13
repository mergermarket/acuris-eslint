const createCmdOptionsParser = require('../../../scripts/lib/cmd-options-parser')
const { expect } = require('chai')

describe('cmd-options', () => {
  describe('parser', () => {
    it('parses a simple list of arguments with no options', () => {
      const parsed = createCmdOptionsParser().parse(['aaa.a', 'bbb.b', 'ccc.c', 'd-'])
      expect(parsed).to.deep.equal({
        command: undefined,
        options: {},
        list: ['aaa.a', 'bbb.b', 'ccc.c', 'd-']
      })
    })

    it('initialises options default values', () => {
      const parsed = createCmdOptionsParser()
        .grp('opts')
        .opt({ option: 'aa', value: 'hello', type: 'string' })
        .opt({ option: 'ap', value: './xxx', type: 'path' })
        .opt({ option: 'bb', value: 123, type: 'int' })
        .opt({ option: 'cc', value: true, type: 'boolean' })
        .opt({ option: 'dd', value: false, type: 'boolean' })
        .parse(['xx'])
      expect(parsed).to.deep.equal({
        command: undefined,
        options: { aa: 'hello', ap: './xxx', bb: 123, cc: true, dd: false },
        list: ['xx']
      })
    })

    it('handles single character string options', () => {
      const parsed = createCmdOptionsParser()
        .grp('opts')
        .opt({ option: 'a', key: 'A', type: 'string' })
        .opt({ option: 'b' })
        .opt({ option: 'c' })
        .opt({ option: 'd' })
        .opt({ option: 'yyy', alias: 'y', type: 'string' })
        .opt({ option: 'x', alias: 'kkk', key: 'K', type: 'string' })
        .parse(['-a=www', '-b', '--no-c', '-y', 'yyy', 'a', '--kkk', 'k!'])
      expect(parsed).to.deep.equal({
        command: undefined,
        options: { A: 'www', b: true, c: false, d: undefined, yyy: 'yyy', K: 'k!' },
        list: ['a']
      })
    })

    it('parse simple string option with default value', () => {
      const parsed = createCmdOptionsParser()
        .grp('opts')
        .opt({ option: 'test', alias: 't', value: 'def1', type: 'string' })
        .opt({ option: 'xxx', value: 'def2', type: 'string' })
        .opt({ option: 'yyy', value: 'def3', type: 'string' })
        .opt({ option: 'zzz', value: 'def4', type: 'string' })
        .parse(['--test', '--xxx', 'b', 'c', '--yyy'])
      expect(parsed).to.deep.equal({
        command: undefined,
        options: { test: 'def1', xxx: 'b', yyy: 'def3', zzz: 'def4' },
        list: ['c']
      })
    })

    it('parses all types', () => {
      const parsed = createCmdOptionsParser()
        .grp('opts')
        .opt({ option: 'string', type: 'string' })
        .opt({ option: 'stringEq', type: 'path' })
        .opt({ option: 'int', type: 'int' })
        .opt({ option: 'intEq', type: 'int' })
        .opt({ option: 'bool1', value: false })
        .opt({ option: 'bool2', value: true })
        .parse(['--string', 's1', 'xx', '--stringEq=s2', '--int', '123', '--intEq=45', '--bool1', 'yy', '--no-bool2'])
      expect(parsed).to.deep.equal({
        command: undefined,
        options: {
          int: 123,
          intEq: 45,
          string: 's1',
          stringEq: 's2',
          bool1: true,
          bool2: false
        },
        list: ['xx', 'yy']
      })
    })

    it('parses types in commands', () => {
      const parser = createCmdOptionsParser()
        .opt({ option: 'string', type: 'string' })
        .opt({ option: 'stringEq', key: 'string', type: 'path' })
        .opt({ option: 'int', type: 'int' })
        .opt({ option: 'intEq', type: 'int' })
        .opt({ option: 'bool1', type: 'boolean' })
        .opt({ option: 'boolHelp', type: 'help' })

      expect(parser.parse(['--string', 's1', 'xx'])).to.deep.equal({
        command: { option: 'string', key: 'string', type: 'string', value: 's1' },
        options: {},
        list: ['xx']
      })

      expect(parser.parse(['--stringEq', 's123', 'xx'])).to.deep.equal({
        command: { option: 'stringEq', key: 'string', type: 'path', value: 's123' },
        options: {},
        list: ['xx']
      })

      expect(parser.parse(['--int', '123', 'xx'])).to.deep.equal({
        command: { option: 'int', key: 'int', type: 'int', value: 123 },
        options: {},
        list: ['xx']
      })

      expect(parser.parse(['--intEq=123', 'xx'])).to.deep.equal({
        command: { option: 'intEq', key: 'intEq', type: 'int', value: 123 },
        options: {},
        list: ['xx']
      })

      expect(parser.parse(['--bool1', 'xx'])).to.deep.equal({
        command: { option: 'bool1', key: 'bool1', type: 'boolean', value: true },
        options: {},
        list: ['xx']
      })

      expect(parser.parse(['--bool1', '--boolHelp', 'xx'])).to.deep.equal({
        command: { option: 'boolHelp', key: 'boolHelp', type: 'help', value: true },
        options: {},
        list: ['xx']
      })

      expect(parser.parse(['--boolHelp', '--no-bool1', 'xx'])).to.deep.equal({
        command: { option: 'boolHelp', key: 'boolHelp', type: 'help', value: true },
        options: {},
        list: ['xx']
      })

      expect(parser.parse(['--boolHelp', '--boolHelp', '--no-bool1', 'xx', '--boolHelp'])).to.deep.equal({
        command: { option: 'boolHelp', key: 'boolHelp', type: 'help', value: true },
        options: {},
        list: ['xx']
      })
    })

    it('treats everything after "--" as items', () => {
      const parsed = createCmdOptionsParser()
        .grp('opts')
        .opt({ option: 'xa', type: 'string' })
        .opt({ option: 'xb', value: '', type: 'string' })
        .parse(['aaa', '--xa=abc', '--', '--xb', '-c', 'ddd', 'd'])
      expect(parsed).to.deep.equal({
        command: undefined,
        options: {
          xa: 'abc',
          xb: ''
        },
        list: ['aaa', '--xb', '-c', 'ddd', 'd']
      })
    })

    it('treats --=xxx as item', () => {
      const parsed = createCmdOptionsParser()
        .grp('opts')
        .opt({ option: 'xxx', value: 'x' })
        .opt({ option: 'mm', value: 'x', type: 'string' })
        .parse(['--=xxx', '--mm=1'])
      expect(parsed).to.deep.equal({
        command: undefined,
        options: {
          xxx: 'x',
          mm: '1'
        },
        list: ['--=xxx']
      })
    })

    it('treates --<special character> as item', () => {
      const parsed = createCmdOptionsParser()
        .grp('opts')
        .opt({ option: 'xxx', value: 'x', type: 'string' })
        .parse(['--:xxx'])
      expect(parsed).to.deep.equal({
        command: undefined,
        options: {
          xxx: 'x'
        },
        list: ['--:xxx']
      })
    })
  })
})
