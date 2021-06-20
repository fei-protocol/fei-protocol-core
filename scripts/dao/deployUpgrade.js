const { upgrade } = require('./upgrade');
const { getAddresses } = require('../utils/helpers');

const {
  coreAddress,
  ethUniswapPCVDepositAddress,
  ethUniswapPCVControllerAddress,
  ethBondingCurveAddress,
  ethReserveStabilizerAddress,
  tribeReserveStabilizerAddress,
  ratioPCVControllerAddress,
  pcvDripControllerAddress,
  ethPairAddress,
  timelockAddress  // this is the minter -> in a local setup, this will be msg.sender
} = getAddresses();

// The DAO steps for upgrading to ERC20 compatible versions, these must be done with Governor access control privileges
async function main() {
  const addresses = {
    coreAddress,
    ethUniswapPCVDepositAddress,
    ethUniswapPCVControllerAddress,
    ethBondingCurveAddress,
    ethReserveStabilizerAddress,
    tribeReserveStabilizerAddress,
    ratioPCVControllerAddress,
    pcvDripControllerAddress,
    ethPairAddress,
    timelockAddress
  };

  await upgrade(addresses, true);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
