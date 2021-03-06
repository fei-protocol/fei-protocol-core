---
description: 'Running unit, integration, and coverage tests on fei-protocol-core'
---

# Testing Guide

## Setup

Fei Protocol Core uses the following tools for testing, development, and coverage:

* [Truffle](https://www.trufflesuite.com/docs/truffle/overview)
* [Ganache-cli](https://github.com/trufflesuite/ganache-cli)
* [OpenZeppelin CLI](https://docs.openzeppelin.com/cli/2.8/)
* [Mocha](https://mochajs.org/)

To install, run `npm install`

## Unit Tests

There are extensive unit tests covering the protocol code, with the exception of forked and external contracts.

To run the unit tests, run `npm run test`

Here is a sample output:

{% file src="../.gitbook/assets/fei\_tests.txt" caption="Unit Tests" %}

## Unit Test Coverage

To run the unit test coverage module, run `npm run coverage`

Here is a sample output: 

{% file src="../.gitbook/assets/fei\_coverage.txt" caption="Test Coverage" %}

## Integration Tests

There are several integration tests which go deeper into various functionality of the protocol, using a mainnet fork and fully deployed and linked contracts.

The following configurations need to be in place:

* create an Alchemy mainnet project and add `export MAINNET_ALCHEMY_API_KEY="<KEY>"` to your .bashrc or .bash\_profile
* run ganache-cli with mainnet fork: `ganache-cli -e 10000000 -g 200000000 -l 8000000 -f https://eth-mainnet.alchemyapi.io/v2/$MAINNET_ALCHEMY_API_KEY@11895000 -i 5777 -p 7545`
* In a separate terminal, open a truffle console by running `truffle console --network ganache`
* In the truffle console, run `migrate`

{% hint style="info" %}
Keep ganache-cli and the truffle console running, and execute the following tests within the truffle console
{% endhint %}

### End-to-end

To run this test, within the truffle console run `exec scripts/test/e2e.js`

This test will go through all of the main user flows, log some related info and gas price



