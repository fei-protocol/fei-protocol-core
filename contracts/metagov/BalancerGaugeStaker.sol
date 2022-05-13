// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../pcv/PCVDeposit.sol";
import "./utils/LiquidityGaugeManager.sol";
import "../external/balancer/IBalancerMinter.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Deposit that can stake in Balancer gauges
/// @author Fei Protocol
contract BalancerGaugeStaker is PCVDeposit, LiquidityGaugeManager {
    using SafeERC20 for IERC20;

    address public constant BALANCER_GAUGE_CONTROLLER = 0xC128468b7Ce63eA702C1f104D55A2566b13D3ABD;
    address public constant BALANCER_MINTER = 0x239e55F427D44C3cc793f49bFB507ebe76638a2b;
    address public constant BAL = 0xba100000625a3754423978a60c9317c58a424e3D;

    /// @notice Balancer gauge staker
    /// @param _core Fei Core for reference
    constructor(address _core) CoreRef(_core) LiquidityGaugeManager(BALANCER_GAUGE_CONTROLLER) {}

    function initialize(address _core) external {
        require(gaugeController == address(0), "BalancerGaugeStaker: initialized");
        CoreRef._initialize(_core);
        gaugeController = BALANCER_GAUGE_CONTROLLER;
    }

    /// @notice returns total balance of PCV in the Deposit
    function balance() public view override returns (uint256) {
        return IERC20(BAL).balanceOf(address(this));
    }

    /// @notice gets the token address in which this deposit returns its balance
    function balanceReportedIn() public view virtual override returns (address) {
        return BAL;
    }

    /// @notice gets the resistant token balance and protocol owned fei of this deposit
    function resistantBalanceAndFei() public view virtual override returns (uint256, uint256) {
        return (balance(), 0);
    }

    /// @notice noop
    function deposit() external override {}

    /// @notice withdraw BAL held to another address
    /// the BAL rewards accrue on this PCVDeposit when Gauge rewards are claimed.
    function withdraw(address to, uint256 amount) external override onlyPCVController whenNotPaused {
        IERC20(BAL).safeTransfer(to, amount);
        emit Withdrawal(msg.sender, to, amount);
    }

    /// @notice withdraw ERC20 from the contract
    /// @param token address of the ERC20 to send
    /// @param to address destination of the ERC20
    /// @param amount quantity of ERC20 to send
    function withdrawERC20(
        address token,
        address to,
        uint256 amount
    ) public virtual override onlyPCVController whenNotPaused {
        // if the token has a gauge, we unstake it from the gauge before transfer
        // @dev : note that this gauge unstaking normally is access controlled to
        // onlyTribeRole(TribeRoles.METAGOVERNANCE_GAUGE_ADMIN), but since
        // withdrawERC20() is a higher clearance role (PCVController), this
        // privilege of gauge unstaking is also made available to the PCV controller,
        // that may have important reasons to quickly unstake from the gauge and move
        // the staked ERC20s to another place.
        address gaugeAddress = tokenToGauge[token];
        if (gaugeAddress != address(0)) {
            ILiquidityGauge(gaugeAddress).withdraw(amount, false);
        }

        _withdrawERC20(token, to, amount);
    }

    /// @notice Mint everything which belongs to this contract in the given gauge
    /// @param token whose gauge should be claimed
    function mint(address token) external whenNotPaused returns (uint256) {
        // fetch gauge address from internal mapping to avoid this permissionless
        // call to mint on any arbitrary gauge.
        address gaugeAddress = tokenToGauge[token];
        require(gaugeAddress != address(0), "BalancerGaugeStaker: token has no gauge configured");

        // emit the same event as Gauge rewards claiming for offline indexing
        uint256 minted = IBalancerMinter(BALANCER_MINTER).mint(gaugeAddress);
        emit GaugeRewardsClaimed(gaugeAddress, BAL, minted);

        return minted;
    }
}
