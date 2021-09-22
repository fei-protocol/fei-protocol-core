import { ethers } from "hardhat";
import { expect } from "chai";

async function setup(addresses, oldContracts, contracts, logging) {}

/*
 1. Set pending timelock admin 
 2. Accept admin from new Fei DAO
*/
async function run(addresses, oldContracts, contracts, logging = false) {}

async function teardown(addresses, oldContracts, contracts, logging) {}

async function validate(addresses, oldContracts, contracts) {}

module.exports = {
  setup, run, teardown, validate
};
