// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./SnapshotDelegatorPCVDeposit.sol";
import "./utils/VoteEscrowTokenManager.sol";
import "./utils/LiquidityGaugeManager.sol";

/// @title 80-BAL-20-WETH BPT PCV Deposit
/// @author Fei Protocol
contract VeBalDelegatorPCVDeposit is
    SnapshotDelegatorPCVDeposit,
    VoteEscrowTokenManager,
    LiquidityGaugeManager
{
    address private constant BAL = 0xba100000625a3754423978a60c9317c58a424e3D;
    address private constant B_80BAL_20WETH =
        0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56;
    address private constant VE_BAL =
        0xC128a9954e6c874eA3d62ce62B468bA073093F25;
    address private constant BALANCER_GAUGE_CONTROLLER =
        0xC128468b7Ce63eA702C1f104D55A2566b13D3ABD;
    bytes32 private constant BALANCER_SNAPSHOT_SPACE = "balancer.eth";

    /// @notice veBAL token manager
    /// @param _core Fei Core for reference
    /// @param _initialDelegate initial delegate for snapshot votes
    constructor(address _core, address _initialDelegate)
        SnapshotDelegatorPCVDeposit(
            _core,
            IERC20(B_80BAL_20WETH), // token used in reporting
            BALANCER_SNAPSHOT_SPACE, // snapshot spaceId
            _initialDelegate
        )
        VoteEscrowTokenManager(
            IERC20(B_80BAL_20WETH), // liquid token
            IVeToken(VE_BAL), // vote-escrowed token
            365 * 86400 // vote-escrow time = 1 year
        )
        LiquidityGaugeManager(BALANCER_GAUGE_CONTROLLER)
    {}

    /// @notice returns total balance of PCV in the Deposit
    function balance() public view override returns (uint256) {
        return _totalTokensManaged(); // liquid and vote-escrowed tokens
    }
}
