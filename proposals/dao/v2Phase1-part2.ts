import '@nomiclabs/hardhat-ethers';
import hre, { ethers } from 'hardhat';
import {
  SetupUpgradeFunc,
  ValidateUpgradeFunc,
  RunUpgradeFunc,
  TeardownUpgradeFunc,
  NamedContracts
} from '@custom-types/types';

import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { CollateralizationOracleKeeper, Core, EthBondingCurve, PCVEquityMinter, RatioPCVController, TribeReserveStabilizer, UniswapPCVDeposit } from '@custom-types/contracts';
import { getImpersonatedSigner } from "@test/helpers";

const toBN = ethers.BigNumber.from;

before(() => {
  chai.use(CBN(ethers.BigNumber));
});

/*

V2 Phase 1 Upgrade

Part 2 - Deploys all of the PCV deposit wrappers needed for the collateralization oracle, deploys the constant oracles used
         for FEI & USD, and deploys the collateralization oracle (along proxy-impl, and proxy-base) contracts.


----- PART 2 -----

DEPLOY ACTIONS:
1. Static Pcv Deposit Wrapper
2. Eth Reserve Stabilizer Wrapper
3. Dai bonding curve wrapper
4. Rai bonding curve wrapper
5. Dpi bonding curve wrapper
6. Eth Lido PCV Deposit Wrapper
7. Cream Fei PCV Deposit Wrapper
8. Compound dai PCV Deposit Wrapper
9. Compound Eth PCV Deposit Wrapper
10. Aave Rai PCV Deposit Wrapper
11. Aave Eth PCV Deposit Wrapper
12. Rari Pool 9 Rai PCV Deposit Wrapper
13. Rari Pool 19 Dpi PCV Deposit Wrapper
14. Rari Pool 8 Fei PCV Deposit Wrapper
15. Rari Pool 9 Fei PCV Deposit Wrapper
16. Rari Pool 7 Fei PCV Deposit Wrapper
17. Rari Pool 6 Fei PCV Deposit Wrapper
18. Rari Pool 19 Fei PCV Deposit Wrapper
19. Rari Pool 24 Fei PCV Deposit Wrapper
20. Rari Pool 25 Fei PCV Deposit Wrapper
21. Rari Pool 26 Fei PCV Deposit Wrapper
22. Rari Pool 27 Fei PCV Deposit Wrapper
23. Rari Pool 18 Fei PCV Deposit Wrapper
24. Zero Constant Oracle
25. One Constant Oracle
26. Collateralization Ratio Oracle
27. Collateralization Ratio Oracle Wrapper Implementation
28. Collateralization Ratio Oracle Wrapper Proxy


DAO ACTIONS:
(no actions by the dao)

*/

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
    logging && console.log(`V2-Phase1 part 2 has no DAO setup actions.`)
};
  
export const run: RunUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {
    logging && console.log(`V2-Phase1 part 2 has no DAO run actions.`)
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {
    logging && console.log(`V2-Phase1 part 2 has no DAO teardown actions.`)
}

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {
    logging && console.log(`V2-Phase1 part 2 has no DAO validate actions.`)
}