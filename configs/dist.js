'use strict'

const { getMergedOverridesRules } = require('../core/eslint-support')

module.exports = {
  rules: getMergedOverridesRules(require('../rules/dist'))
}
