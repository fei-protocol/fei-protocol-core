// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IVault.sol";
import "./ILinearPool.sol";
import "./IPhantomStablePool.sol";
import "../../external/IERC4626.sol";
import "../PCVDeposit.sol";
import "../../refs/CoreRef.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../Constants.sol";

/// @title PCV Deposit for the bb-f-USD pool
/// @author Fei Protocol
contract BalancerPCVDepositBBFUSD is PCVDeposit {
    // ----------- Events ---------------
    event UpdateMaximumSlippage(uint256 maximumSlippageBasisPoints);

    bytes32 public constant BB_F_USD_POOLID = 0xd997f35c9b1281b82c8928039d14cddab5e13c2000000000000000000000019c;
    bytes32 public constant BB_F_FEI_POOLID = 0xc8c79fcd0e859e7ec81118e91ce8e4379a481ee6000000000000000000000196;
    bytes32 public constant BB_F_DAI_POOLID = 0x8f4063446f5011bc1c9f79a819efe87776f23704000000000000000000000197;
    bytes32 public constant BB_F_LUSD_POOLID = 0xb0f75e97a114a4eb4a425edc48990e6760726709000000000000000000000198;
    address public constant BB_F_USD_ADDRESS = 0xD997f35c9b1281B82C8928039D14CdDaB5e13c20;
    address public constant BB_F_FEI_ADDRESS = 0xc8C79fCD0e859e7eC81118e91cE8E4379A481ee6;
    address public constant BB_F_DAI_ADDRESS = 0x8f4063446F5011bC1C9F79A819EFE87776F23704;
    address public constant BB_F_LUSD_ADDRESS = 0xb0F75E97A114A4EB4a425eDc48990e6760726709;
    address public constant BALANCER_VAULT = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;
    address public constant ERC20_DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address public constant ERC20_LUSD = 0x5f98805A4E8be255a32880FDeC7F6728C6568bA0;
    address public constant ERC20_FEI = 0x956F47F50A910163D8BF957Cf5846D573E7f87CA;
    address public constant ERC4626_DAI = 0xbA63738C2E476B1a0CFB6b41A7b85d304d032454;
    address public constant ERC4626_LUSD = 0x83e556baEA9b5fa5f131BC89a4C7282cA240B156;
    address public constant ERC4626_FEI = 0xf486608dbc7dd0EB80e4B9fA0FDB03E40F414030;

    /// @notice the maximum slippage accepted during deposit/withdraw
    uint256 public maximumSlippageBasisPoints;

    /// @notice Balancer PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _maximumSlippageBasisPoints Maximum slippage basis points when depositing
    constructor(address _core, uint256 _maximumSlippageBasisPoints) CoreRef(_core) {
        maximumSlippageBasisPoints = _maximumSlippageBasisPoints;
    }

    /// @notice the PCVDeposit reports its balance in "USD"
    function balanceReportedIn() public view override returns (address) {
        return 0x1111111111111111111111111111111111111111;
    }

    /// @notice Sets the maximum slippage vs 1:1 price accepted during withdraw.
    /// @param _maximumSlippageBasisPoints the maximum slippage expressed in basis points (1/10_000)
    function setMaximumSlippage(uint256 _maximumSlippageBasisPoints) external onlyGovernorOrAdmin {
        require(
            _maximumSlippageBasisPoints <= Constants.BASIS_POINTS_GRANULARITY,
            "BalancerPCVDepositBBFUSD: Exceeds bp granularity"
        );
        maximumSlippageBasisPoints = _maximumSlippageBasisPoints;
        emit UpdateMaximumSlippage(_maximumSlippageBasisPoints);
    }

    /// @notice returns total balance of PCV in the Deposit
    function balance() public view override returns (uint256) {
        uint256 bptBalance = IPhantomStablePool(BB_F_USD_ADDRESS).balanceOf(address(this));
        uint256 bptRate = IPhantomStablePool(BB_F_USD_ADDRESS).getRate();

        return (bptBalance * bptRate) / 1e18;
    }

    // @notice returns the manipulation-resistant balance of tokens & FEI held.
    function resistantBalanceAndFei() public view override returns (uint256 _resistantBalance, uint256 _resistantFei) {
        uint256 bptBalance = IPhantomStablePool(BB_F_USD_ADDRESS).balanceOf(address(this));
        uint256 bptRate = IPhantomStablePool(BB_F_USD_ADDRESS).getRate();

        uint256 totalStablecoinsOwned = (bptBalance * bptRate) / 1e18;

        return ((2 * totalStablecoinsOwned) / 3, totalStablecoinsOwned / 3);
    }

    /// @notice deposit unwrapped tokens (DAI, LUSD, FEI) to the Balancer pool
    /// @param maxTokens maximum amount of each stablecoin to deposit.
    function depositUnwrapped(uint256 maxTokens) external whenNotPaused onlyPCVController {
        uint256 dai = IERC20(ERC20_DAI).balanceOf(address(this));
        uint256 lusd = IERC20(ERC20_LUSD).balanceOf(address(this));
        uint256 fei = IERC20(ERC20_FEI).balanceOf(address(this));

        // limit deposit to maximum {maxTokens} tokens of each stablecoin
        if (dai > maxTokens && maxTokens != 0) dai = maxTokens;
        if (lusd > maxTokens && maxTokens != 0) lusd = maxTokens;
        if (fei > maxTokens && maxTokens != 0) fei = maxTokens;

        // Check nonzero deposit
        uint256 stablecoinsDeposited = dai + lusd + fei;
        require(stablecoinsDeposited != 0, "BalancerPCVDepositBBFUSD: Deposit 0");

        // For each stablecoin, perform a batch swap to get bb-f-USD
        // e.g. FEI ---> bb-f-FEI ---> bb-f-USD
        uint256 bbfUsdBalanceBefore = IPhantomStablePool(BB_F_USD_ADDRESS).balanceOf(address(this));

        if (dai > 0) {
            IERC4626(ERC20_DAI).approve(BALANCER_VAULT, dai);
            _depositBatchSwap(
                BB_F_DAI_ADDRESS, // linearPoolAddress
                BB_F_DAI_POOLID, // linearPoolId
                ERC20_DAI, // tokenAddress
                dai // tokenAmount
            );
        }
        if (lusd > 0) {
            IERC4626(ERC20_LUSD).approve(BALANCER_VAULT, lusd);
            _depositBatchSwap(
                BB_F_LUSD_ADDRESS, // linearPoolAddress
                BB_F_LUSD_POOLID, // linearPoolId
                ERC20_LUSD, // tokenAddress
                lusd // tokenAmount
            );
        }
        if (fei > 0) {
            IERC4626(ERC20_FEI).approve(BALANCER_VAULT, fei);
            _depositBatchSwap(
                BB_F_FEI_ADDRESS, // linearPoolAddress
                BB_F_FEI_POOLID, // linearPoolId
                ERC20_FEI, // tokenAddress
                fei // tokenAmount
            );
        }

        // check for slippage
        uint256 bbfUsdBalanceAfter = IPhantomStablePool(BB_F_USD_ADDRESS).balanceOf(address(this));
        uint256 bbfUsdReceived = bbfUsdBalanceAfter - bbfUsdBalanceBefore;
        uint256 usdReceived = (bbfUsdReceived * IPhantomStablePool(BB_F_USD_ADDRESS).getRate()) / 1e18;
        uint256 minUsdReceived = (stablecoinsDeposited *
            (Constants.BASIS_POINTS_GRANULARITY - maximumSlippageBasisPoints)) / Constants.BASIS_POINTS_GRANULARITY;
        require(usdReceived >= minUsdReceived, "BalancerPCVDepositBBFUSD: slippage too high");

        // emit event
        emit Deposit(msg.sender, stablecoinsDeposited);
    }

    // @notice deposit tokens to the Balancer pool
    // the tokens deposited are wrapped in ERC4626 vault before deposit.
    function deposit() external override whenNotPaused {
        // Get stablecoin balances
        uint256 dai = IERC20(ERC20_DAI).balanceOf(address(this));
        uint256 lusd = IERC20(ERC20_LUSD).balanceOf(address(this));
        uint256 fei = IERC20(ERC20_FEI).balanceOf(address(this));

        // Check nonzero deposit
        uint256 stablecoinsDeposited = dai + lusd + fei;
        require(stablecoinsDeposited != 0, "BalancerPCVDepositBBFUSD: Deposit 0");

        // For each stablecoin :
        // 1/ Deposit stablecoins in ERC4626 vaults if the deposit holds some
        // 2/ Perform a batch swap to get bb-f-USD
        //    The 2 swaps are, for instance : 4626-fDAI-8 ---> bb-f-DAI ---> bb-f-USD
        uint256 bbfUsdBalanceBefore = IPhantomStablePool(BB_F_USD_ADDRESS).balanceOf(address(this));
        if (dai > 0) {
            // ERC4626 wrap
            IERC20(ERC20_DAI).approve(ERC4626_DAI, dai);
            uint256 erc4626Dai = IERC4626(ERC4626_DAI).deposit(dai, address(this));
            IERC4626(ERC4626_DAI).approve(BALANCER_VAULT, erc4626Dai);
            // Batch swap
            if (erc4626Dai != 0) {
                _depositBatchSwap(
                    BB_F_DAI_ADDRESS, // linearPoolAddress
                    BB_F_DAI_POOLID, // linearPoolId
                    ERC4626_DAI, // tokenAddress
                    erc4626Dai // tokenAmount
                );
            }
        }
        if (lusd > 0) {
            // ERC4626 wrap
            IERC20(ERC20_LUSD).approve(ERC4626_LUSD, lusd);
            uint256 erc4626Lusd = IERC4626(ERC4626_LUSD).deposit(lusd, address(this));
            IERC4626(ERC4626_LUSD).approve(BALANCER_VAULT, erc4626Lusd);
            // Batch swap
            if (erc4626Lusd != 0) {
                _depositBatchSwap(
                    BB_F_LUSD_ADDRESS, // linearPoolAddress
                    BB_F_LUSD_POOLID, // linearPoolId
                    ERC4626_LUSD, // tokenAddress
                    erc4626Lusd // tokenAmount
                );
            }
        }
        if (fei > 0) {
            // ERC4626 wrap
            IERC20(ERC20_FEI).approve(ERC4626_FEI, fei);
            uint256 erc4626Fei = IERC4626(ERC4626_FEI).deposit(fei, address(this));
            IERC4626(ERC4626_FEI).approve(BALANCER_VAULT, erc4626Fei);
            // Batch swap
            if (erc4626Fei != 0) {
                _depositBatchSwap(
                    BB_F_FEI_ADDRESS, // linearPoolAddress
                    BB_F_FEI_POOLID, // linearPoolId
                    ERC4626_FEI, // tokenAddress
                    erc4626Fei // tokenAmount
                );
            }
        }

        // check for slippage
        uint256 bbfUsdBalanceAfter = IPhantomStablePool(BB_F_USD_ADDRESS).balanceOf(address(this));
        uint256 bbfUsdReceived = bbfUsdBalanceAfter - bbfUsdBalanceBefore;
        uint256 usdReceived = (bbfUsdReceived * IPhantomStablePool(BB_F_USD_ADDRESS).getRate()) / 1e18;
        uint256 minUsdReceived = (stablecoinsDeposited *
            (Constants.BASIS_POINTS_GRANULARITY - maximumSlippageBasisPoints)) / Constants.BASIS_POINTS_GRANULARITY;
        require(usdReceived >= minUsdReceived, "BalancerPCVDepositBBFUSD: slippage too high");

        // emit event
        emit Deposit(msg.sender, stablecoinsDeposited);
    }

    /// @notice withdraw FEI from the bb-f-USD pool
    /// @param to the address to send FEI to
    /// @param amount of FEI withdrawn
    /// Note: this function will not withdraw tokens in the right
    /// proportions for the pool, only FEI, so only use this to withdraw small
    /// amounts comparatively to the pool size. For large withdrawals, it is
    /// preferrable to use withdrawBatchSwap() multiple times, with multiple
    /// tokens.
    function withdraw(address to, uint256 amount) external override onlyPCVController whenNotPaused {
        withdrawBatchSwap(BB_F_FEI_ADDRESS, BB_F_FEI_POOLID, ERC4626_FEI, amount, to, true);
    }

    /// @notice redeeem {amount} bbfusd to get tokens out
    /// @param linearPoolAddress pool address (one of bbfdai, bbflusd, bbffei)
    /// @param linearPoolId pool id (one of bbfdai, bbflusd, bbffei)
    /// @param tokenAddress token address (one of dai or 4646-fDAI-8 if {linearPoolAddress} is bbfdai,
    ///                     one of lusd or 4646-fLUSD-8 if {linearPoolAddress} is bbflusd,
    ///                     one of fei or 4646-fFEI-8 if {linearPoolAddress} is bbffei)
    /// @param tokenAmount amount of tokens to withdraw
    /// @param tokenDestination recipient of the tokens
    /// @param unwrap true if the token withdrawn has to be unwrapped before sending
    function withdrawBatchSwap(
        address linearPoolAddress,
        bytes32 linearPoolId,
        address tokenAddress,
        uint256 tokenAmount,
        address tokenDestination,
        bool unwrap
    ) public whenNotPaused onlyPCVController {
        // check pool & token addresses
        if (linearPoolId == BB_F_DAI_POOLID) {
            require(linearPoolAddress == BB_F_DAI_ADDRESS, "BalancerPCVDepositBBFUSD: wrong dai pool address");
            if (unwrap) require(tokenAddress == ERC4626_DAI, "BalancerPCVDepositBBFUSD: wrong 4626-dai token");
            else require(tokenAddress == ERC20_DAI, "BalancerPCVDepositBBFUSD: wrong dai token");
        } else if (linearPoolId == BB_F_LUSD_POOLID) {
            require(linearPoolAddress == BB_F_LUSD_ADDRESS, "BalancerPCVDepositBBFUSD: wrong lusd pool address");
            if (unwrap) require(tokenAddress == ERC4626_LUSD, "BalancerPCVDepositBBFUSD: wrong 4626-lusd token");
            else require(tokenAddress == ERC20_LUSD, "BalancerPCVDepositBBFUSD: wrong lusd token");
        } else if (linearPoolId == BB_F_FEI_POOLID) {
            require(linearPoolAddress == BB_F_FEI_ADDRESS, "BalancerPCVDepositBBFUSD: wrong fei pool address");
            if (unwrap) require(tokenAddress == ERC4626_FEI, "BalancerPCVDepositBBFUSD: wrong 4646-fei token");
            else require(tokenAddress == ERC20_FEI, "BalancerPCVDepositBBFUSD: wrong fei token");
        } else {
            revert("BalancerPCVDepositBBFUSD: wrong linear pool id");
        }

        // approve bb-f-USD spend on vault
        uint256 maxBbfUsdSpent = (tokenAmount *
            1e18 *
            (Constants.BASIS_POINTS_GRANULARITY + maximumSlippageBasisPoints)) /
            (IPhantomStablePool(BB_F_USD_ADDRESS).getRate() * Constants.BASIS_POINTS_GRANULARITY);
        IERC20(BB_F_USD_ADDRESS).approve(BALANCER_VAULT, maxBbfUsdSpent);

        // Perform a batch swap to spend bb-f-USD
        // The 2 swaps are :
        // bb-f-USD ---> bb-f-XXX ---> ERC20_XXX or ERC4626_XXX,
        // with XXX one of [DAI, LUSD, FEI].
        IAsset[] memory assets = new IAsset[](3);
        assets[0] = IAsset(tokenAddress);
        assets[1] = IAsset(linearPoolAddress);
        assets[2] = IAsset(BB_F_USD_ADDRESS);

        IVault.BatchSwapStep[] memory swaps = new IVault.BatchSwapStep[](2);
        swaps[0] = IVault.BatchSwapStep(
            BB_F_USD_POOLID, // poolId
            2, // assetInIndex = BB_F_USD_ADDRESS
            1, // assetOutIndex = BB_F_XXX_ADDRESS
            maxBbfUsdSpent, // amount
            bytes("") // userData
        );
        swaps[1] = IVault.BatchSwapStep(
            linearPoolId, // poolId
            1, // assetInIndex = BB_F_XXX_ADDRESS
            0, // assetOutIndex = ERC20_XXX or ERC4626_XXX
            tokenAmount, // amount = 0 means output from the previous step
            bytes("") // userData
        );

        // slippage is checked at the end of all operations
        int256[] memory limits = new int256[](3);
        limits[0] = type(int256).max;
        limits[1] = type(int256).max;
        limits[2] = type(int256).max;

        IVault(BALANCER_VAULT).batchSwap(
            IVault.SwapKind.GIVEN_OUT,
            swaps,
            assets,
            IVault.FundManagement(
                address(this), // sender
                false, // fromInternalBalance
                payable(address(this)), // recipient
                false // toInternalBalance
            ),
            limits,
            block.timestamp // deadline
        );

        // 4626 redeem before sending
        if (unwrap) {
            IERC4626(tokenAddress).redeem(IERC20(tokenAddress).balanceOf(address(this)), address(this), address(this));
            IERC20(IERC4626(tokenAddress).asset()).transfer(tokenDestination, tokenAmount);
        }
        // or direct ERC20 transfer
        else {
            IERC20(tokenAddress).transfer(tokenDestination, tokenAmount);
        }
    }

    /// @notice batch-swap {tokenAmount} tokens {tokenAddress} to LinearPool
    /// bpts (of pool ID {linearPoolId}, pool address {linearPoolAddress}),
    /// then swap them to bb-f-USD pool tokens.
    /// @dev approval is not performed, slippage is not checked.
    function _depositBatchSwap(
        address linearPoolAddress,
        bytes32 linearPoolId,
        address tokenAddress,
        uint256 tokenAmount
    ) internal {
        // Perform a batch swap to get bb-f-USD
        // The 2 swaps are :
        // 4626-fXXX-8 ---> bb-f-XXX ---> bb-f-USD
        IAsset[] memory assets = new IAsset[](3);
        assets[0] = IAsset(tokenAddress);
        assets[1] = IAsset(linearPoolAddress);
        assets[2] = IAsset(BB_F_USD_ADDRESS);

        IVault.BatchSwapStep[] memory swaps = new IVault.BatchSwapStep[](2);
        swaps[0] = IVault.BatchSwapStep(
            linearPoolId, // poolId
            0, // assetInIndex = ERC4626_XXX
            1, // assetOutIndex = BB_F_XXX_ADDRESS
            tokenAmount, // amount
            bytes("") // userData
        );
        swaps[1] = IVault.BatchSwapStep(
            BB_F_USD_POOLID, // poolId
            1, // assetInIndex = BB_F_XXX_ADDRESS
            2, // assetOutIndex = BB_F_USD_ADDRESS
            0, // amount = 0 means output from the previous step
            bytes("") // userData
        );

        // slippage is checked at the end of all operations
        int256[] memory limits = new int256[](3);
        limits[0] = type(int256).max;
        limits[1] = type(int256).max;
        limits[2] = type(int256).max;

        IVault(BALANCER_VAULT).batchSwap(
            IVault.SwapKind.GIVEN_IN,
            swaps,
            assets,
            IVault.FundManagement(
                address(this), // sender
                false, // fromInternalBalance
                payable(address(this)), // recipient
                false // toInternalBalance
            ),
            limits,
            block.timestamp // deadline
        );
    }
}
