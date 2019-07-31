#!/bin/sh

set -e

if [[ -z "${CI}" ]]; then
  export CI='X'
fi

npm ci
npm run lint -- --max-warnings 0
npm test
npm config set '//registry.npmjs.org/:_authToken' "${NPM_TOKEN}"
npm publish --access public
