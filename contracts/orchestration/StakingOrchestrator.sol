    pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../staking/FeiRewardsDistributor.sol";
import "../staking/FeiStakingRewards.sol";
import "./IOrchestrator.sol";

contract StakingOrchestrator is IStakingOrchestrator, Ownable {
    function init(
        address core,
        address tribeFeiPair,
        address tribe,
        uint stakingDuration,
        uint dripFrequency,
        uint incentiveAmount
    ) public override onlyOwner returns (address stakingRewards, address distributor) {

        distributor = address(
            new FeiRewardsDistributor(
                core,
                address(0), // to be set by governor
                stakingDuration,
                dripFrequency,
                incentiveAmount
            )
        );

        stakingRewards = address(
            new FeiStakingRewards(
                distributor,
                tribe,
                tribeFeiPair,
                dripFrequency
            )
        );
        return (stakingRewards, distributor);
    }

    function detonate() public override onlyOwner {
        selfdestruct(payable(owner()));
    }
}