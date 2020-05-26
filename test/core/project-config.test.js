const { expect } = require('chai')
const ProjectConfig = require('../../core/project-config')

describe('core/project-config', () => {
  it('allows loading multiple configs', () => {
    const pc = new ProjectConfig()
    pc.ignoredPackages.add('bbb')
    pc.ignoredPackages.add('ccc')
    pc.nodeResolvePaths.add('yyy')
    pc.nodeResolvePaths.add('zzz')
    pc.filePatterns.bin.push('-b1-')
    pc.filePatterns.bin.push('-b2-')
    pc.filePatterns.dist.push('-d1-')
    pc.filePatterns.dist.push('-d2-')
    pc.filePatterns.dist.push('-d3-')
    pc.filePatterns.scripts.push('s0')
    pc.filePatterns.scripts.push('sb')

    expect(pc.eslintrc).to.equal('')
    expect(pc.eslintCache).to.equal(true)
    expect(pc.eslintCacheLocation).to.equal('.eslintcache')
    expect(pc.eslintOutputFormat).to.equal('stylish')
    expect(pc.reactVersion).to.equal('')
    expect(pc.tsConfigPath).to.equal('')

    pc.add({
      eslintrc: 'hello',
      eslintCache: 'false',
      eslintCacheLocation: 'ecp',
      eslintOutputFormat: 'xxx',
      reactVersion: '999',
      tsConfigPath: 'www',
      ignoredPackages: ['aaa', '!bbb', 'ccc', 'ddd'],
      nodeResolvePaths: ['xxx', '!yyy'],
      filePatterns: {
        bin: { '-b3-': true, '-b2-': false },
        dist: { '-d3-': 0, '-d4-': 1 },
        scripts: ['s1', '!sb', 'sc']
      }
    })

    expect(pc.filePatterns.bin).to.contain('-b1-')
    expect(pc.filePatterns.bin).to.not.contain('-b2-')
    expect(pc.filePatterns.bin).to.contain('-b3-')

    expect(pc.filePatterns.dist).to.contain('-d1-')
    expect(pc.filePatterns.dist).to.contain('-d2-')
    expect(pc.filePatterns.dist).to.not.contain('-d3-')
    expect(pc.filePatterns.dist).to.contain('-d4-')

    expect(pc.filePatterns.scripts).to.contain('s0')
    expect(pc.filePatterns.scripts).to.contain('s1')
    expect(pc.filePatterns.scripts).to.not.contain('sb')
    expect(pc.filePatterns.scripts).to.contain('sc')

    expect(pc.eslintrc).to.equal('hello')
    expect(pc.eslintCache).to.equal(false)
    expect(pc.eslintCacheLocation).to.equal('ecp')
    expect(pc.eslintOutputFormat).to.equal('xxx')
    expect(pc.reactVersion).to.equal('999')
    expect(pc.tsConfigPath).to.equal('www')

    expect(pc.ignoredPackages.has('aaa')).to.equal(true)
    expect(pc.ignoredPackages.has('bbb')).to.equal(false)
    expect(pc.ignoredPackages.has('!bbb')).to.equal(false)
    expect(pc.ignoredPackages.has('ccc')).to.equal(true)
    expect(pc.ignoredPackages.has('ddd')).to.equal(true)

    expect(pc.nodeResolvePaths.has('xxx')).to.equal(true)
    expect(pc.nodeResolvePaths.has('yyy')).to.equal(false)
    expect(pc.nodeResolvePaths.has('!yyy')).to.equal(false)

    pc.add({
      eslintrc: 'hello1',
      eslintCache: true,
      ignoredPackages: { ccc: true, ddd: false },
      nodeResolvePaths: { zzz: true, www: false }
    })

    expect(pc.eslintrc).to.equal('hello1')
    expect(pc.eslintCache).to.equal(true)

    expect(pc.ignoredPackages.has('aaa')).to.equal(true)
    expect(pc.ignoredPackages.has('bbb')).to.equal(false)
    expect(pc.ignoredPackages.has('ccc')).to.equal(true)
    expect(pc.ignoredPackages.has('ddd')).to.equal(false)
  })
})
