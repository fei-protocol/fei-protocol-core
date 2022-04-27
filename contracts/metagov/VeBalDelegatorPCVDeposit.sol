// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./SnapshotDelegatorPCVDeposit.sol";
import "./utils/VoteEscrowTokenManager.sol";
import "./utils/LiquidityGaugeManager.sol";
import "./utils/GovernorVoter.sol";

/// @title 80-BAL-20-WETH BPT PCV Deposit
/// @author Fei Protocol
contract VeBalDelegatorPCVDeposit is
    SnapshotDelegatorPCVDeposit,
    VoteEscrowTokenManager,
    LiquidityGaugeManager,
    GovernorVoter
{
    address public constant B_80BAL_20WETH = 0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56;
    address public constant VE_BAL = 0xC128a9954e6c874eA3d62ce62B468bA073093F25;
    address public constant BALANCER_GAUGE_CONTROLLER = 0xC128468b7Ce63eA702C1f104D55A2566b13D3ABD;

    /// @notice veBAL token manager
    /// @param _core Fei Core for reference
    /// @param _initialDelegate initial delegate for snapshot votes
    constructor(address _core, address _initialDelegate)
        SnapshotDelegatorPCVDeposit(
            _core,
            IERC20(B_80BAL_20WETH), // token used in reporting
            "balancer.eth", // initial snapshot spaceId
            _initialDelegate
        )
        VoteEscrowTokenManager(
            IERC20(B_80BAL_20WETH), // liquid token
            IVeToken(VE_BAL), // vote-escrowed token
            365 * 86400 // vote-escrow time = 1 year
        )
        LiquidityGaugeManager(BALANCER_GAUGE_CONTROLLER)
        GovernorVoter()
    {}

    /// @notice returns total balance of PCV in the Deposit
    function balance() public view override returns (uint256) {
        return _totalTokensManaged(); // liquid and vote-escrowed tokens
    }
}
