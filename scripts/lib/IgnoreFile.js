'use strict'

class IgnoreFile {
  constructor(content) {
    /** @type {Set<string>} */
    const commentedPatterns = new Set()
    this.commentedPatterns = commentedPatterns

    /** @type {Set<string>} */
    const patterns = new Set()
    this.patterns = patterns

    let section = { header: [], body: [] }

    /** @type {{header:[], body: string[]}[]} */
    const sections = []
    this.sections = sections

    this.changed = false

    this.acurisEslintMarkerPosition = -1
    this.acurisEslintEndMarker = null

    if (content) {
      if (Array.isArray(content)) {
        content = content.join('\n')
      }
      let previousLineIsComment = false
      let previousLineIsEmpty = false
      for (let line of content.split('\n')) {
        line = line.trim()
        if (line === IgnoreFile.acurisEslintMarker) {
          if (sections[sections.length - 1] !== section && (section.body.length !== 0 || section.header.length !== 0)) {
            sections.push(section)
          }
          if (this.acurisEslintMarkerPosition === -1) {
            this.acurisEslintMarkerPosition = sections.length
            sections.push({ header: [IgnoreFile.acurisEslintMarker], body: [], marker: true })
            section = { header: [], body: [] }
            previousLineIsComment = false
          }
        } else if (line === IgnoreFile.acurisEslintEndMarker) {
          if (sections[sections.length - 1] !== section && (section.body.length !== 0 || section.header.length !== 0)) {
            sections.push(section)
          }
          if (this.acurisEslintMarkerPosition !== -1) {
            if (this.acurisEslintEndMarker) {
              sections.splice(sections.indexOf(this.acurisEslintEndMarker), 1)
            }
            this.acurisEslintEndMarker = { header: [IgnoreFile.acurisEslintEndMarker], body: [], marker: 'end' }
            sections.push(this.acurisEslintEndMarker)
          }
          section = { header: [], body: [] }
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
    if (pattern === IgnoreFile.acurisEslintEndMarker || pattern === IgnoreFile.acurisEslintEndMarker) {
      return false
    }
    if (pattern.startsWith('#')) {
      const cp = pattern.slice(1).trim()
      if (!this.commentedPatterns.has(cp) && !this.patterns.has(cp)) {
        this.commentedPatterns.add(cp)
        return true
      }
    } else if (!this.patterns.has(pattern)) {
      this.patterns.add(pattern)
      this.commentedPatterns.delete(pattern)
      return true
    }
    return false
  }

  addAcurisEslintMarker() {
    if (this.acurisEslintMarkerPosition === -1) {
      this.acurisEslintMarkerPosition = 0
      this.sections.splice(0, 0, { header: [IgnoreFile.acurisEslintMarker], body: [], marker: true })
    }
    return this.acurisEslintMarkerPosition
  }

  merge(gitignore, addAcurisEslintMarker = true) {
    const sectionsToAdd = []
    for (const section of gitignore.sections) {
      const body = []
      for (const pattern of section.body) {
        if (!this.commentedPatterns.has(pattern) && this.addPattern(pattern)) {
          body.push(pattern)
        }
      }
      if (!section.marker && body.length) {
        sectionsToAdd.push({ header: [...section.header], body })
      }
    }
    if (sectionsToAdd.length !== 0) {
      if (addAcurisEslintMarker) {
        this.addAcurisEslintMarker()

        if (!this.acurisEslintEndMarker) {
          this.acurisEslintEndMarker = { header: [IgnoreFile.acurisEslintEndMarker], body: [], marker: 'end' }
          sectionsToAdd.push(this.acurisEslintEndMarker)
        }

        this.sections.splice(this.acurisEslintMarkerPosition + 1, 0, ...sectionsToAdd)
      } else {
        this.sections.push(...sectionsToAdd)
      }
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

IgnoreFile.acurisEslintMarker = '# <@acuris/eslint-config>'
IgnoreFile.acurisEslintEndMarker = '# </@acuris/eslint-config>'

module.exports = IgnoreFile
