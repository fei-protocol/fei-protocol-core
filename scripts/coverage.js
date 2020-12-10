#!/usr/bin/env node

const { runCoverage } = require('@openzeppelin/test-environment');

async function main () {
  await runCoverage(
    ['mock'],
    'truffle compile',
    './node_modules/.bin/mocha --exit --timeout 10000'.split(' '),
  );
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});