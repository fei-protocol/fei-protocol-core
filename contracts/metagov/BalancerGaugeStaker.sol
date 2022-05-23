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

    event BalancerMinterChanged(address indexed oldMinter, address indexed newMinter);

    address private constant BAL = 0xba100000625a3754423978a60c9317c58a424e3D;

    address public balancerMinter;

    /// @notice Balancer gauge staker
    /// @param _core Fei Core for reference
    constructor(
        address _core,
        address _gaugeController,
        address _balancerMinter
    ) CoreRef(_core) LiquidityGaugeManager(_gaugeController) {
        balancerMinter = _balancerMinter;
    }

    function initialize(
        address _core,
        address _gaugeController,
        address _balancerMinter
    ) external {
        require(gaugeController == address(0), "BalancerGaugeStaker: initialized");
        CoreRef._initialize(_core);
        gaugeController = _gaugeController;
        balancerMinter = _balancerMinter;
    }

    /// @notice Set the balancer minter used to mint BAL
    /// @param newMinter the new minter address
    function setBalancerMinter(address newMinter) public onlyTribeRole(TribeRoles.METAGOVERNANCE_GAUGE_ADMIN) {
        address currentMinter = balancerMinter; // cache to save 1 sload
        require(currentMinter != newMinter, "BalancerGaugeStaker: same minter");

        emit BalancerMinterChanged(currentMinter, newMinter);
        balancerMinter = newMinter;
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
    function withdraw(address to, uint256 amount) public override onlyPCVController whenNotPaused {
        IERC20(BAL).safeTransfer(to, amount);
        emit Withdrawal(msg.sender, to, amount);
    }

    /// @notice Mint everything which belongs to this contract in the given gauge
    /// @param token whose gauge should be claimed
    function mintGaugeRewards(address token) external whenNotPaused returns (uint256) {
        // fetch gauge address from internal mapping to avoid this permissionless
        // call to mint on any arbitrary gauge.
        address gaugeAddress = tokenToGauge[token];
        require(gaugeAddress != address(0), "BalancerGaugeStaker: token has no gauge configured");

        // emit the Deposit event because accounting is performed in BAL
        // and that is what is claimed from the minter.
        uint256 minted = IBalancerMinter(balancerMinter).mint(gaugeAddress);
        emit Deposit(msg.sender, minted);

        return minted;
    }
}
