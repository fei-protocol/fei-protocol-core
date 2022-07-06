import { getAllContracts, getAllContractAddresses } from '@test/integration/setup/loadContracts';
import { NamedContracts, UpgradeFuncs } from '@custom-types/types';
import proposals from '@protocol/proposalsConfig';

import * as dotenv from 'dotenv';
import { execProposal } from './exec';
import { overwriteChainlinkAggregator } from '@test/helpers';
import { formatNumber } from './printUtils';

dotenv.config();

// Multisig
const voterAddress = '0xB8f482539F2d3Ae2C9ea6076894df36D1f632775';
const proposalName = process.env.DEPLOY_FILE;
const doSetup = process.env.DO_SETUP;
const checkCrOracle = process.env.READ_CR_ORACLE;

if (!proposalName) {
  throw new Error('DEPLOY_FILE env variable not set');
}

/**
 * Take in a hardhat proposal object and output the proposal calldatas
 * See `proposals/utils/getProposalCalldata.js` on how to construct the proposal calldata
 */
async function checkProposal(proposalName: string, doSetup?: string) {
  // Get the upgrade setup, run and teardown scripts
  const proposalFuncs: UpgradeFuncs = await import(`@proposals/dao/${proposalName}`);

  const contracts = (await getAllContracts()) as unknown as NamedContracts;

  const contractAddresses = getAllContractAddresses();

  if (proposalFuncs.setup.toString().length > 130 && !doSetup) {
    console.log(`Heads up: setup() is defined in ${proposalName}, but you did not use the DO_SETUP=true env variable`);
  }

  if (doSetup) {
    console.log('Setup');
    await proposalFuncs.setup(contractAddresses, contracts, contracts, true);
  }

  let crOracleReadingBefore;
  if (checkCrOracle) {
    console.log('Reading CR oracle before proposal execution');
    crOracleReadingBefore = await contracts.collateralizationOracle.pcvStats();

    // persist chainlink ETH/USD reading for BAMM deposit to not revert with 'chainlink is down'
    const chainlinkEthUsd = await contracts.chainlinkEthUsdOracleWrapper.read();
    await overwriteChainlinkAggregator(
      contractAddresses.chainlinkEthUsdOracle,
      Math.round(chainlinkEthUsd[0] / 1e10).toString(),
      '8'
    );
  }

  const { feiDAO } = contracts;

  const proposalNo = proposals[proposalName].proposalId;

  await execProposal(voterAddress, feiDAO.address, proposals[proposalName].totalValue.toString(), proposalNo);

  console.log('Teardown');
  await proposalFuncs.teardown(
    contractAddresses,
    contracts as unknown as NamedContracts,
    contracts as unknown as NamedContracts,
    true
  );

  console.log('Validate');
  await proposalFuncs.validate(
    contractAddresses,
    contracts as unknown as NamedContracts,
    contracts as unknown as NamedContracts,
    true
  );

  if (checkCrOracle) {
    console.log('Reading CR oracle after proposal execution');
    const crOracleReadingAfter = await contracts.collateralizationOracle.pcvStats();
    const pcvChange =
      crOracleReadingAfter.protocolControlledValue.toString() / 1 -
      crOracleReadingBefore.protocolControlledValue.toString() / 1;
    const feiChange =
      crOracleReadingAfter.userCirculatingFei.toString() / 1 - crOracleReadingBefore.userCirculatingFei.toString() / 1;
    console.log('PCV Change :', formatNumber(pcvChange));
    console.log('FEI Circulating Change :', formatNumber(feiChange));
  }
}

checkProposal(proposalName, doSetup)
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
