module.exports = {
  /**
   * A dummy parser for eslint that reutrns an empty program.
   * Used for allowing running prettier without parsing unknown file types and still allow custom parsers to be registered via overrides.
   */
  parse(text) {
    return {
      text,
      type: 'Program',
      start: 0,
      end: 0,
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 0 }
      },
      range: [0, 0],
      body: [],
      sourceType: 'module',
      comments: [],
      tokens: []
    }
  }
}
