// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @title RariGovernanceTokenUniswapDistributor
 * @author David Lucid <david@rari.capital> (https://github.com/davidlucid)
 * @notice RariGovernanceTokenUniswapDistributor distributes RGT (Rari Governance Token) to Uniswap LP token holders.
 */
interface RariGovernanceTokenUniswapDistributor {
    function setDistributionEndBlock() external;

    function distributionEndBlock() external view returns (uint256);

    function getRgtDistributed(uint256 blockNumber) external view returns (uint256);

    function setDisabled(bool _disabled) external;

    function upgrade(address newContract, uint256 amount) external;
}
