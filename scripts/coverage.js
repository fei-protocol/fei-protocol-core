#!/usr/bin/env node

const { runCoverage } = require('@openzeppelin/test-environment');

async function main () {
  await runCoverage(
    ['mock', 'external', 'orchestration', 'utils/SafeMath128.sol', 'utils/SafeMath32.sol', 'dao/Timelock.sol', 'dao/GovernorAlpha.sol', 'dao/Tribe.sol', 'Migrations.sol'],
    'npm run compile',
    './node_modules/.bin/mocha --exit --timeout 10000 --recursive test/genesis'.split(' '),
  );
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});