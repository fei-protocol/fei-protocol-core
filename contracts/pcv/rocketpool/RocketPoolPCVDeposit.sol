// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.10;

import {PCVDeposit, CoreRef} from "../PCVDeposit.sol";
import {Constants} from "../../Constants.sol";
import {TribeRoles} from "../../core/TribeRoles.sol";
import {IVault, IAsset} from "../balancer/IVault.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

// Rocket storage, used to retrieve contract addresses of RocketPool contracts
interface IRocketStorage {
    function getAddress(bytes32 _key) external view returns (address);
}

interface IRocketVault {
    function balanceOf(string memory _networkContractName) external view returns (uint256);
}

interface IRocketSettings {
    // RocketDAOProtocolSettingsDepositInterface
    function getDepositEnabled() external view returns (bool);

    function getMinimumDeposit() external view returns (uint256);

    function getMaximumDepositPoolSize() external view returns (uint256);
}

interface IRocketDepositPool {
    function deposit() external payable;
}

// rETH Token contract specific functions
interface IRocketTokenRETH is IERC20 {
    function getExchangeRate() external view returns (uint256); // e.g. 1.02999e18
}

/// @title implementation for PCV Deposit that custody rETH and WETH.
/// WETH can be swapped to rETH with deposit(). Conversely, withdraw()
/// will swap rETH to WETH. Balance is reported in WETH, even if part
/// of the custodied funds are rETH (in this case, the underlying value
/// of rETH is used to calculate the balance). Note that the underlying
/// value of rETH can differ from the market value of rETH, so the funds
/// custodied by this contract shall be considered as somewhat illiquid.
/// @author eswak
contract RocketPoolPCVDeposit is CoreRef, PCVDeposit {
    // ----------- Events ---------------
    event UpdateMaximumDepositSlippage(uint256 maxDepositSlippageBps);
    event UpdateMaximumWithdrawSlippage(uint256 maxWithdrawSlippageBps);

    // ----------- Properties -----------
    // References to external contracts
    address public constant ROCKET_STORAGE = 0x1d8f8f00cfa6758d7bE78336684788Fb0ee0Fa46;
    address public constant ERC20_RETH = 0xae78736Cd615f374D3085123A210448E74Fc6393;
    address public constant BALANCER_VAULT = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;
    bytes32 public constant BALANCER_POOL = 0x1e19cf2d73a72ef1332c882f20534b6519be0276000200000000000000000112;

    // Maximum tolerated slippage for deposit(), in basis points.
    uint256 public maximumDepositSlippageBps;
    // Maximum tolerated slippage for withdraw(), in basis points.
    uint256 public maximumWithdrawSlippageBps;

    constructor(
        address _core,
        uint256 _maximumDepositSlippageBps,
        uint256 _maximumWithdrawSlippageBps
    ) CoreRef(_core) {
        maximumDepositSlippageBps = _maximumDepositSlippageBps;
        maximumWithdrawSlippageBps = _maximumWithdrawSlippageBps;
    }

    // Empty callback on ETH reception
    receive() external payable {}

    /// @notice Wraps all ETH held by the contract to WETH
    /// Anyone can call it
    function wrapETH() public {
        uint256 ethBalance = address(this).balance;
        if (ethBalance != 0) {
            Constants.WETH.deposit{value: ethBalance}();
        }
    }

    /// @notice deposit all WETH held by the contract to get rETH.
    function deposit() external override whenNotPaused {
        uint256 amountIn = IERC20(address(Constants.WETH)).balanceOf(address(this));
        _depositSwap(amountIn);
    }

    /// @notice deposit a specific amount of WETH held by the contract to get rETH.
    function depositSwap(uint256 amountIn) external whenNotPaused {
        _depositSwap(amountIn);
    }

    /// @notice get the address of a contract of RocketPool
    function _rocketAddress(string memory name) internal view returns (address) {
        return IRocketStorage(ROCKET_STORAGE).getAddress(keccak256(abi.encodePacked("contract.address", name)));
    }

    /// @notice amount of rETH available for staking
    function maximumStake() public view returns (uint256) {
        // fetch rocketpool addresses
        IRocketSettings rocketSettings = IRocketSettings(_rocketAddress("rocketDAOProtocolSettingsDeposit"));
        IRocketVault rocketVault = IRocketVault(_rocketAddress("rocketVault"));

        if (!rocketSettings.getDepositEnabled()) {
            return 0;
        }

        uint256 maxAmountIn = rocketSettings.getMaximumDepositPoolSize() - rocketVault.balanceOf("rocketDepositPool");
        return maxAmountIn;
    }

    /// @notice stake a specific amount of WETH held by the contract to get rETH.
    function depositStake(uint256 amountIn) external whenNotPaused {
        // withdraw WETH to get naked ETH
        Constants.WETH.withdraw(amountIn);

        uint256 rethExchangeRate = IRocketTokenRETH(ERC20_RETH).getExchangeRate();
        uint256 minAmountOut = (amountIn * 1e18) / rethExchangeRate;
        uint256 balanceBefore = IRocketTokenRETH(ERC20_RETH).balanceOf(address(this));

        // preform deposit
        IRocketDepositPool rocketDepositPool = IRocketDepositPool(_rocketAddress("rocketDepositPool"));
        rocketDepositPool.deposit{value: amountIn}();

        // sanity check
        uint256 balanceAfter = IRocketTokenRETH(ERC20_RETH).balanceOf(address(this));
        assert((balanceAfter - balanceBefore + 1e10) >= minAmountOut);
    }

    /// @notice deposit a specific amount of WETH held by the contract to get rETH.
    /// This internal function does not check the paused state.
    /// rETH is obtained by swapping WETH for rETH in Balancer.
    /// A maximum of {maximumDepositSlippageBps} basis points of slippage is tolerated.
    function _depositSwap(uint256 amountIn) internal {
        require(amountIn > 0, "RocketPoolPCVDeposit: cannot deposit 0");

        uint256 rethExchangeRate = IRocketTokenRETH(ERC20_RETH).getExchangeRate();
        // ideal amount out
        uint256 minAmountOut = (amountIn * 1e18) / rethExchangeRate;
        // apply slippage tolerance
        minAmountOut =
            ((Constants.BASIS_POINTS_GRANULARITY - maximumDepositSlippageBps) * minAmountOut) /
            Constants.BASIS_POINTS_GRANULARITY;

        // Swap WETH to rETH
        IERC20(address(Constants.WETH)).approve(BALANCER_VAULT, amountIn);
        uint256 actualAmountOut = IVault(BALANCER_VAULT).swap(
            IVault.SingleSwap({
                poolId: BALANCER_POOL,
                kind: IVault.SwapKind.GIVEN_IN,
                assetIn: IAsset(address(Constants.WETH)),
                assetOut: IAsset(ERC20_RETH),
                amount: amountIn,
                userData: bytes("")
            }),
            IVault.FundManagement({
                sender: address(this),
                fromInternalBalance: false,
                recipient: payable(address(this)),
                toInternalBalance: false
            }),
            minAmountOut,
            block.timestamp
        );

        emit Deposit(msg.sender, actualAmountOut);
    }

    /// @notice preview a swap of {amountIn} WETH to rETH in the Balancer pool.
    function previewDepositSwap(uint256 amountIn)
        external
        returns (
            int256 rETHout,
            int256 idealAmountOut,
            int256 arbitrageOpportunity
        )
    {
        IVault.BatchSwapStep[] memory swaps = new IVault.BatchSwapStep[](1);
        swaps[0] = IVault.BatchSwapStep({
            poolId: BALANCER_POOL,
            assetInIndex: 1,
            assetOutIndex: 0,
            amount: amountIn,
            userData: bytes("")
        });

        IAsset[] memory assets = new IAsset[](2);
        assets[0] = IAsset(ERC20_RETH);
        assets[1] = IAsset(address(Constants.WETH));

        int256[] memory assetDeltas = IVault(BALANCER_VAULT).queryBatchSwap(
            IVault.SwapKind.GIVEN_IN,
            swaps,
            assets,
            IVault.FundManagement({
                sender: address(this),
                fromInternalBalance: false,
                recipient: payable(address(this)),
                toInternalBalance: false
            })
        );

        uint256 rethExchangeRate = IRocketTokenRETH(ERC20_RETH).getExchangeRate();
        idealAmountOut = int256((amountIn * 1e18) / rethExchangeRate);
        rETHout = -assetDeltas[0];
        arbitrageOpportunity = rETHout - idealAmountOut;

        return (rETHout, idealAmountOut, arbitrageOpportunity);
    }

    /// @notice withdraw rETH held by the contract to get WETH.
    /// rETH is obtained by swapping rETH for WETH in Balancer.
    /// A maximum of {maximumWithdrawSlippageBps} basis points of slippage is tolerated.
    /// @param to the destination of the withdrawn WETH
    /// @param amountIn the number of rETH to withdraw.
    function withdraw(address to, uint256 amountIn) external override onlyPCVController whenNotPaused {
        require(amountIn > 0, "RocketPoolPCVDeposit: cannot withdraw 0");

        uint256 rethExchangeRate = IRocketTokenRETH(ERC20_RETH).getExchangeRate();
        // ideal amount out
        uint256 minAmountOut = (amountIn * rethExchangeRate) / 1e18;
        // apply slippage tolerance
        minAmountOut =
            ((Constants.BASIS_POINTS_GRANULARITY - maximumWithdrawSlippageBps) * minAmountOut) /
            Constants.BASIS_POINTS_GRANULARITY;

        // Swap rETH to WETH
        IERC20(ERC20_RETH).approve(BALANCER_VAULT, amountIn);
        uint256 actualAmountOut = IVault(BALANCER_VAULT).swap(
            IVault.SingleSwap({
                poolId: BALANCER_POOL,
                kind: IVault.SwapKind.GIVEN_IN,
                assetIn: IAsset(ERC20_RETH),
                assetOut: IAsset(address(Constants.WETH)),
                amount: amountIn,
                userData: bytes("")
            }),
            IVault.FundManagement({
                sender: address(this),
                fromInternalBalance: false,
                recipient: payable(to),
                toInternalBalance: false
            }),
            minAmountOut,
            block.timestamp
        );

        emit Withdrawal(msg.sender, to, actualAmountOut);
    }

    /// @notice Returns the current balance of ETH (wrapped or in Rocket Pool) held by the contract
    function balance() public view override returns (uint256 amount) {
        uint256 wethBalance = IERC20(address(Constants.WETH)).balanceOf(address(this));
        uint256 rethBalance = IRocketTokenRETH(ERC20_RETH).balanceOf(address(this));
        uint256 rethExchangeRate = IRocketTokenRETH(ERC20_RETH).getExchangeRate();
        return wethBalance + (rethBalance * rethExchangeRate) / 1e18;
    }

    /// @notice Sets the maximum slippage accepted during deposit.
    /// @param _maximumDepositSlippageBps the maximum slippage expressed in basis points (1/10_000)
    function setMaximumDepositSlippage(uint256 _maximumDepositSlippageBps)
        external
        onlyTribeRole(TribeRoles.PCV_MINOR_PARAM_ROLE)
    {
        require(
            _maximumDepositSlippageBps <= Constants.BASIS_POINTS_GRANULARITY,
            "RocketPoolPCVDeposit: Exceeds bp granularity."
        );
        maximumDepositSlippageBps = _maximumDepositSlippageBps;
        emit UpdateMaximumDepositSlippage(_maximumDepositSlippageBps);
    }

    /// @notice Sets the maximum slippage accepted during withdraw.
    /// @param _maximumWithdrawSlippageBps the maximum slippage expressed in basis points (1/10_000)
    function setMaximumWithdrawSlippage(uint256 _maximumWithdrawSlippageBps)
        external
        onlyTribeRole(TribeRoles.PCV_MINOR_PARAM_ROLE)
    {
        require(
            _maximumWithdrawSlippageBps <= Constants.BASIS_POINTS_GRANULARITY,
            "RocketPoolPCVDeposit: Exceeds bp granularity."
        );
        maximumWithdrawSlippageBps = _maximumWithdrawSlippageBps;
        emit UpdateMaximumDepositSlippage(_maximumWithdrawSlippageBps);
    }

    /// @notice display the related token of the balance reported
    function balanceReportedIn() public pure override returns (address) {
        return address(Constants.WETH);
    }
}
