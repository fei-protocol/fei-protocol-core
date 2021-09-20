pragma solidity ^0.8.4;
pragma experimental ABIEncoderV2;

import "../refs/CoreRef.sol";
import "../Constants.sol";
import "./TestOldIPCVDeposit.sol";

/// @title Old PCV controller used for testing purposes.
/// Specifically used to avoid abi clashes in pcvDeposit contract
// This PCV controller is for moving a ratio of the total value in the PCV deposit
/// @author Fei Protocol
contract TestOldRatioPCVController is CoreRef {

    event Withdraw(
        address indexed pcvDeposit,
        address indexed to,
        uint256 amount
    );

    /// @notice PCV controller constructor
    /// @param _core Fei Core for reference
    constructor(address _core) public CoreRef(_core) {}

    /// @notice withdraw tokens from the input PCV deposit in basis points terms
    /// @param to the address to send PCV to
    function withdrawRatio(
        TestOldIPCVDeposit pcvDeposit,
        address to,
        uint256 basisPoints
    ) public onlyPCVController whenNotPaused {
        require(
            basisPoints <= Constants.BASIS_POINTS_GRANULARITY,
            "RatioPCVController: basisPoints too high"
        );
        uint256 amount = (pcvDeposit.totalValue() * basisPoints) /
            Constants.BASIS_POINTS_GRANULARITY;
        require(amount != 0, "RatioPCVController: no value to withdraw");

        pcvDeposit.withdraw(to, amount);
        emit Withdraw(address(pcvDeposit), to, amount);
    }

    function dummy() public {}
}
