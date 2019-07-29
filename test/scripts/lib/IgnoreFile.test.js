require('chai/register-expect')

const IgnoreFile = require('../../../scripts/lib/IgnoreFile')

const simpleGitIgnore = [
  '#hello world',
  'a.txt',
  'b.txt',
  '',
  '#section A',
  'hello',
  '#section B',
  '#section B continued',
  '',
  '',
  'hello world',
  '#commented-pattern',
  'hello world 1',
  'hello world',
  ''
].join('\n')

const gitIgnoreToMerge = [
  IgnoreFile.acurisEslintMarker,
  '',
  '# after marker1',
  'xxx1',
  'xxx1',
  'hello',
  'xxx2',
  '# after marker2',
  'xxx3',
  'hello',
  'xxx4',
  '# after marker3',
  'hello world',
  'commented-pattern'
].join('\n')

const cleanedUpGitIgnoreArray = [
  '#hello world',
  'a.txt',
  'b.txt',
  '',
  '#section A',
  'hello',
  '',
  '#section B',
  '#section B continued',
  '',
  'hello world',
  '#commented-pattern',
  'hello world 1'
]

const cleanedUpGitIgnoreToMergeArray = [
  '# @acuris/eslint-config',
  '',
  '# after marker1',
  'xxx1',
  'hello',
  'xxx2',
  '',
  '# after marker2',
  'xxx3',
  'xxx4',
  '',
  '# after marker3',
  'hello world',
  'commented-pattern'
]

describe('IgnoreFile', () => {
  describe('constructor', () => {
    it('parses correctly a simple .gitignore file', () => {
      const parsed = new IgnoreFile(simpleGitIgnore)
      expect(parsed.acurisEslintMarkerPosition).to.equal(-1)
      expect(Array.from(parsed.patterns).sort()).to.deep.equal([
        'a.txt',
        'b.txt',
        'hello',
        'hello world',
        'hello world 1'
      ])
      expect(parsed.sections).to.deep.equal([
        { header: ['#hello world'], body: ['a.txt', 'b.txt'] },
        { header: ['#section A'], body: ['hello'] },
        {
          header: ['#section B', '#section B continued', ''],
          body: ['hello world', '#commented-pattern', 'hello world 1']
        }
      ])
      expect(parsed.changed).to.equal(false)
    })

    it('parses correctly a source .gitignore', () => {
      const parsed = new IgnoreFile(gitIgnoreToMerge)
      expect(parsed.acurisEslintMarkerPosition).to.equal(0)
      expect(Array.from(parsed.patterns).sort()).to.deep.equal([
        'commented-pattern',
        'hello',
        'hello world',
        'xxx1',
        'xxx2',
        'xxx3',
        'xxx4'
      ])
      expect(parsed.sections).to.deep.equal([
        { header: ['# @acuris/eslint-config'], body: [] },
        { header: ['# after marker1'], body: ['xxx1', 'hello', 'xxx2'] },
        { header: ['# after marker2'], body: ['xxx3', 'xxx4'] },
        { header: ['# after marker3'], body: ['hello world', 'commented-pattern'] }
      ])
      expect(parsed.changed).to.equal(false)
    })
  })

  describe('toStringArray', () => {
    it('generates a valid output for a simple .gitignore', () => {
      const parsed = new IgnoreFile(simpleGitIgnore)
      expect(parsed.toStringArray()).to.deep.equal(cleanedUpGitIgnoreArray)
    })

    it('generates a valid output for a source .gitignore', () => {
      const parsed = new IgnoreFile(gitIgnoreToMerge)
      expect(parsed.toStringArray()).to.deep.equal(cleanedUpGitIgnoreToMergeArray)
    })
  })

  describe('toString', () => {
    it('generates a valid output for a simple .gitignore', () => {
      const parsed = new IgnoreFile(simpleGitIgnore)
      expect(parsed.toString()).to.deep.equal(`${cleanedUpGitIgnoreArray.join('\n')}\n`)
    })

    it('generates a valid output for a source .gitignore', () => {
      const parsed = new IgnoreFile(gitIgnoreToMerge)
      expect(parsed.toString()).to.deep.equal(`${cleanedUpGitIgnoreToMergeArray.join('\n')}\n`)
    })
  })

  describe('merge', () => {
    it('merges simple .gitignore with source .gitignore', () => {
      const target = new IgnoreFile(simpleGitIgnore)
      const source = new IgnoreFile(gitIgnoreToMerge)
      target.merge(source)
      expect(target.changed).to.equal(true)
      expect(target.sections).to.deep.equal([
        { header: ['#hello world'], body: ['a.txt', 'b.txt'] },
        { header: ['#section A'], body: ['hello'] },
        {
          header: ['#section B', '#section B continued', ''],
          body: ['hello world', '#commented-pattern', 'hello world 1']
        },
        { header: ['# @acuris/eslint-config'], body: [] },
        { header: ['# after marker1'], body: ['xxx1', 'xxx2'] },
        { header: ['# after marker2'], body: ['xxx3', 'xxx4'] }
      ])
      expect(target.patterns.has('commented-pattern')).to.equal(false)
    })
  })
})
