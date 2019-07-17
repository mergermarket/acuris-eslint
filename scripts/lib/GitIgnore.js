'use strict'

class GitIgnore {
  constructor(content) {
    /** @type {Set<string>} */
    const ignoredPatterns = new Set()
    this.ignoredPatterns = ignoredPatterns

    /** @type {Set<string>} */
    const patterns = new Set()
    this.patterns = patterns

    let section = { header: [], body: [] }

    /** @type {{header:[], body: string[]}[]} */
    const sections = []
    this.sections = sections

    this.changed = false

    this.acurisEslintMarkerPosition = -1
    if (content) {
      let previousLineIsComment = false
      let previousLineIsEmpty = false
      for (let line of content.split('\n')) {
        line = line.trim()
        if (line === GitIgnore.acurisEslintMarker) {
          this.addAcurisEslintMarker()
          previousLineIsComment = false
        } else if (
          (line.length === 0 && previousLineIsComment) ||
          (line.startsWith('#') && (line.length === 1 || section.header.length === 0 || line.indexOf(' ') > 0))
        ) {
          if (
            sections[sections.length - 1] !== section &&
            (section.body.length !== 0 ||
              (!previousLineIsComment && previousLineIsEmpty && line && section.header.length !== 0))
          ) {
            sections.push(section)
            section = { header: [], body: [] }
          }
          if (line || section.header[section.header.length - 1]) {
            section.header.push(line)
          }
          previousLineIsComment = true
        } else if (line.length !== 0) {
          if (this.addPattern(line)) {
            section.body.push(line)
          }
          previousLineIsComment = false
        }
        previousLineIsEmpty = line.length === 0
      }

      if (section.body.length !== 0 && sections[sections.length - 1] !== section) {
        sections.push(section)
      }
    }
  }

  addPattern(pattern) {
    if (pattern.startsWith('#')) {
      const ignoredPattern = pattern.slice(1).trim()
      if (!this.ignoredPatterns.has(ignoredPattern) && !this.patterns.has(ignoredPattern)) {
        this.ignoredPatterns.add(ignoredPattern)
        return true
      }
    } else if (!this.patterns.has(pattern)) {
      this.patterns.add(pattern)
      this.ignoredPatterns.delete(pattern)
      return true
    }
    return false
  }

  addAcurisEslintMarker() {
    if (this.acurisEslintMarkerPosition === -1) {
      this.acurisEslintMarkerPosition = this.sections.length
      this.sections.push({ header: [GitIgnore.acurisEslintMarker], body: [] })
    }
    return this.acurisEslintMarkerPosition
  }

  merge(gitignore) {
    const sectionsToAdd = []
    for (const section of gitignore.sections) {
      const body = []
      for (const pattern of section.body) {
        if (!this.ignoredPatterns.has(pattern) && this.addPattern(pattern)) {
          body.push(pattern)
        }
      }
      if (body.length !== 0) {
        sectionsToAdd.push({ header: [...section.header], body })
      }
    }
    if (sectionsToAdd.length !== 0) {
      this.sections.splice(this.addAcurisEslintMarker() + 1, 0, ...sectionsToAdd)
      this.changed = true
    }
  }

  toStringArray() {
    const result = []
    for (const section of this.sections) {
      if (result[result.length - 1]) {
        result.push('')
      }
      result.push(...section.header)
      result.push(...section.body)
    }
    if (result[result.length - 1]) {
      result.push('')
    }
    if (!result[result.length - 1]) {
      result.pop()
    }
    return result
  }

  toString() {
    return `${this.toStringArray().join('\n')}\n`
  }
}

GitIgnore.acurisEslintMarker = '# @acuris/eslint-config'

module.exports = GitIgnore
