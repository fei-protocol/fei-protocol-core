import { ethers } from 'hardhat';
const toBN = ethers.BigNumber.from;

export const pool8Config = {
  supplyCap: ethers.utils.parseEther('2000000'), // 2M, units of Fei
  feiERC4626StrategyAddress: '0xf486608dbc7dd0eb80e4b9fa0fdb03e40f414030'
};

export const pool18Config = {
  supplyCap: ethers.utils.parseEther('2000000'), // 2M, units of Fei
  // TODO: Check and verify
  feiERC4626StrategyAddress: '0x0a00f781508a2e3ff5c6aa80df97daebd0ffc259'
};

export const gOhmConfig = {
  address: '0x0ab87046fBb341D058F17CBC4c1133F25a20a52f',
  dollarPrice: 2955, // Approximate
  dollarCollateralCap: 5_000_000, // $5M
  dollarBoostCap: 1_000_000, // $1M
  collateralMantisa: ethers.utils.parseEther('0.5') // 0.5e18, collateral factor
};

export const gohmCollateralSupplyCap = ethers.constants.WeiPerEther.mul(
  toBN(gOhmConfig.dollarCollateralCap).div(toBN(gOhmConfig.dollarPrice))
); // 5M (1e18 * (max gOhm $ collateral / gOhm $ price))

export const gohmCollateralBoostCap = ethers.constants.WeiPerEther.mul(
  toBN(gOhmConfig.dollarBoostCap).div(toBN(gOhmConfig.dollarPrice))
);

export const balConfig = {
  address: '0xba100000625a3754423978a60c9317c58a424e3D',
  dollarPrice: 15, // Approximate
  dollarCollateralCap: 5_000_000, // $5M
  dollarBoostCap: 1_000_000, // $1M
  collateralMantissa: ethers.utils.parseEther('0.75') // 0.8e18, collateral factor
};

export const balCollateralSupplyCap = ethers.constants.WeiPerEther.mul(
  toBN(balConfig.dollarCollateralCap).div(toBN(balConfig.dollarPrice))
);
export const balCollateralBoostCap = ethers.constants.WeiPerEther.mul(
  toBN(balConfig.dollarBoostCap).div(toBN(balConfig.dollarPrice))
);
