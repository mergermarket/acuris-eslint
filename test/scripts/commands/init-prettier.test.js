const IgnoreFile = require('../../../scripts/lib/IgnoreFile')
const mockFs = require('mock-fs')
const fs = require('fs')
const fsUtils = require('../../../scripts/lib/fs-utils')

const initPrettier = require('../../../scripts/commands/init-prettier')

describe('commands/init-prettier', () => {
  let originalCwd

  const prettierIgnoreDefaultContent = fs.readFileSync(fsUtils.resolveAcurisEslintFile('.prettierignore'), 'utf8')

  beforeEach(() => {
    originalCwd = process.cwd()
  })

  afterEach(() => {
    process.chdir(originalCwd)
    mockFs.restore()
  })

  it('creates files', async () => {
    mockFs({
      myProject: {},
      '.prettierignore': prettierIgnoreDefaultContent,
      '.prettierrc': JSON.stringify({ semi: false }),
      '.editorconfig': 'hello=1'
    })

    process.chdir('myProject')

    await initPrettier()

    expect(new IgnoreFile(fs.readFileSync('.prettierignore', 'utf8')).toStringArray()).to.deep.equal(
      new IgnoreFile(prettierIgnoreDefaultContent).toStringArray()
    )

    const text = fs.readFileSync('.prettierrc', 'utf8')

    expect(JSON.parse(text)).to.deep.include({ semi: false })

    expect(text).to.deep.equal(`${JSON.stringify(JSON.parse(text), null, 2)}\n`)

    expect(fs.readFileSync('.editorconfig', 'utf8')).to.equal('hello=1\n')
  })

  it('does nothing if .prettierignore is already up to date', async () => {
    mockFs({
      myProject: {
        '.prettierignore': `${prettierIgnoreDefaultContent}\n#random comment\n`
      },
      '.prettierignore': prettierIgnoreDefaultContent
    })

    process.chdir('myProject')

    await initPrettier()

    expect(new IgnoreFile(fs.readFileSync('.prettierignore', 'utf8')).toStringArray()).to.deep.equal(
      new IgnoreFile(prettierIgnoreDefaultContent).toStringArray()
    )
  })

  it('updates a .prettierignore', async () => {
    mockFs({
      myProject: {
        '.prettierignore': '# hello world\nxxxx.js\nyyyy.js'
      },
      '.prettierignore': prettierIgnoreDefaultContent
    })

    process.chdir('myProject')

    await initPrettier()

    const finalPatterns = [...new IgnoreFile(fs.readFileSync('.prettierignore', 'utf8')).patterns].sort()
    const expectedPatterns = [...new IgnoreFile(prettierIgnoreDefaultContent).patterns, 'xxxx.js', 'yyyy.js'].sort()

    expect(finalPatterns).to.deep.equal(expectedPatterns)
  })
})
