// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.10;

import "./PCVStrategy.sol";
import "../../utils/ENSNamed.sol";
import "../../external/solmate/Auth.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Contract used as a central vault for Fei Protocol's PCV.
/// @author eswak
contract PCVVault is Auth, ENSNamed {
    using SafeERC20 for IERC20;
    using SafeERC20 for ERC4626;

    struct StrategyDeployment {
        address strategy;
        uint256 amount;
    }

    // -------------- Events -----------------

    event AssetRegister(address caller, address indexed token);
    event AssetDeregister(address caller, address indexed token);
    event StrategyRegister(address caller, address indexed strategy);
    event StrategyDeregister(address caller, address indexed strategy);
    event Balance(address caller, address indexed token, uint256 amount);
    event Deploy(address caller, address indexed strategy, address indexed token, uint256 amount);
    event Recall(address caller, address indexed strategy, address indexed token, uint256 amount);
    event Revenue(address caller, address indexed strategy, address indexed token, int256 amount);

    event GnosisSafeAddressUpdated(address caller, address indexed oldSafe, address indexed newSafe);

    // ----------- State variables -----------

    address public gnosisSafeAddress;

    mapping(address => bool) public strategyRegistered;
    mapping(address => uint256) private tokenBalances;
    mapping(address => StrategyDeployment[]) private strategyDeployments;

    // ------------- Constructor -------------
    constructor(address owner, Authority authority) Auth(owner, authority) ENSNamed() {}

    // ---------- Read Methods ---------------

    /// @notice returns the list of assets in the PCV, and their amounts
    /// @return tokens list of tokens in the PCV
    /// @return balances list of balances of tokens in the PCV (in the same order as the tokens array)
    function assets() external view returns (address[] memory tokens, uint256[] memory balances) {
        // TODO: implementation (should return fresh values)
    }

    // ------ State-changing Methods ---------

    // override to add authority check
    function setName(string calldata newName) public override requiresAuth {
        _setName(newName);
    }

    function setGnosisSafeAddress(address newSafeAddress) external requiresAuth {
        emit GnosisSafeAddressUpdated(msg.sender, gnosisSafeAddress, newSafeAddress);
        gnosisSafeAddress = newSafeAddress;
        // TODO: do we have to call some functions on the Safe contracts?
        // TODO: do we have to refresh all cached balances ?
    }

    function registerAsset(address token) external requiresAuth {
        // TODO: already registered check
        // TODO: non-zero check
        uint256 amount = IERC20(token).balanceOf(_thisAddress());
        tokenBalances[token] = amount;
        emit Balance(msg.sender, token, amount);
        emit AssetRegister(msg.sender, token);
    }

    function deregisterAsset(address token) external requiresAuth {
        // TODO: registered check
        // TODO: non-zero check
        delete strategyDeployments[token];
        tokenBalances[token] = 0;
        emit Balance(msg.sender, token, 0);
        emit AssetDeregister(msg.sender, token);
        // TODO: what to do if balance of asset deployed in strategies is not zero ?
    }

    function registerStrategy(address strategy) external requiresAuth {
        require(strategy != address(0), "PCVVault: cannot register 0");
        require(!strategyRegistered[strategy], "PCVVault: already registered");
        strategyRegistered[strategy] = true;
        emit StrategyRegister(msg.sender, strategy);
    }

    function deregisterStrategy(address strategy) external requiresAuth {
        require(strategy != address(0), "PCVVault: cannot deregister 0");
        require(strategyRegistered[strategy], "PCVVault: not registered");
        delete strategyRegistered[strategy];
        // TODO: what about assets in the strategy ?
        emit StrategyDeregister(msg.sender, strategy);
    }

    /// @dev note that this call is permissionless
    function refreshBalance(address token) public {
        address thisAddress = _thisAddress();
        uint256 heldBalance = IERC20(token).balanceOf(thisAddress);
        uint256 deployedInStrategies = 0;
        for (uint256 i = 0; i < strategyDeployments[token].length; i++) {
            StrategyDeployment storage deployment = strategyDeployments[token][i]; // sload
            uint256 shares = ERC4626(deployment.strategy).balanceOf(thisAddress);
            uint256 amount = ERC4626(deployment.strategy).previewRedeem(shares);
            uint256 cachedAmount = deployment.amount;
            if (amount != cachedAmount) {
                emit Revenue(msg.sender, deployment.strategy, token, int256(amount) - int256(cachedAmount));
            }
            deployment.amount = amount; // sstore
            deployedInStrategies += amount;
        }
        emit Balance(msg.sender, token, heldBalance + deployedInStrategies);
    }

    function depositFunds(address strategy, uint256 amount) external requiresAuth {
        // preliminary checks
        require(strategyRegistered[strategy], "PCVVault: unregistered strategy");
        require(amount != 0, "PCVVault: cannot deposit 0");

        // deposit tokens in the strategy
        address strategyAsset = address(PCVStrategy(strategy).asset());
        _erc20_approve(strategyAsset, strategy, uint256(amount));
        _erc4626_deposit(strategy, uint256(amount));

        // emit Balance events
        refreshBalance(strategy);
        refreshBalance(strategyAsset);
    }

    function withdrawFunds(address strategy, uint256 amount) external requiresAuth {
        // preliminary checks
        require(strategyRegistered[strategy], "PCVVault: unregistered strategy");
        require(amount != 0, "PCVVault: cannot withdraw 0");

        // withdraw tokens from the strategy
        _erc4626_withdraw(strategy, uint256(amount));

        // emit Balance events
        refreshBalance(strategy);
        refreshBalance(address(PCVStrategy(strategy).asset()));
    }

    // all strategies should have an emergency switch-off feature that recall
    // all funds to the vault
    function exitStrategy(address strategy) external requiresAuth {
        // preliminary checks
        require(strategyRegistered[strategy], "PCVVault: unregistered strategy");

        // redeem all shares of an ERC4626 strategy
        address thisAddress = _thisAddress();
        uint256 shares = ERC4626(strategy).balanceOf(thisAddress);
        _erc4626_redeem(strategy, shares);

        // emit Balance events
        refreshBalance(strategy);
        refreshBalance(address(PCVStrategy(strategy).asset()));
    }

    /// @dev note that this call is permissionless
    function claimStrategyRewards(address strategy, address token) external {
        // TODO: check token is a registered asset
        // TODO: emit Balance
        // TODO: emit Revenue
        // claim on behalf of self or on behalf of the Gnosis Safe
        PCVStrategy(strategy).claimRewards(token, _thisAddress());
    }

    function convertUnderlyingsToAsset(
        address strategy,
        uint256[] memory amounts,
        uint16 maxSlippageBps
    ) external requiresAuth returns (uint256 amount) {
        // TODO
        // Need oracle prices to check slippage...
    }

    function convertAssetToUnderlyings(
        address strategy,
        uint256 amount,
        uint16 maxSlippageBps
    ) external requiresAuth returns (uint256[] memory amounts) {
        // TODO
        // Need oracle prices to check slippage...
    }

    // ---------- Internal Methods -----------

    /// @notice returns the address that should be used to read balance
    /// and other logic where the PCVVault can be standalone or tied to a
    /// Gnosis Safe.
    function _thisAddress() internal view returns (address) {
        address thisAddress = gnosisSafeAddress;
        if (thisAddress == address(0)) thisAddress = address(this);
        return thisAddress;
    }

    function _erc20_approve(
        address token,
        address spender,
        uint256 amount
    ) internal {
        // TODO: if associated to a Gnosis Safe, use
        // safe.execTransactionFromModuleReturnData
        // instead of performing a call from this contract.
        IERC20(token).approve(spender, amount);
    }

    function _erc4626_deposit(address strategy, uint256 amount) internal returns (uint256) {
        // TODO: if associated to a Gnosis Safe, use
        // safe.execTransactionFromModuleReturnData
        // instead of performing a call from this contract.
        return ERC4626(strategy).deposit(amount, address(this));
    }

    function _erc4626_redeem(address strategy, uint256 amount) internal returns (uint256) {
        // TODO: if associated to a Gnosis Safe, use
        // safe.execTransactionFromModuleReturnData
        // instead of performing a call from this contract.
        return ERC4626(strategy).redeem(amount, address(this), address(this));
    }

    function _erc4626_withdraw(address strategy, uint256 amount) internal returns (uint256) {
        // TODO: if associated to a Gnosis Safe, use
        // safe.execTransactionFromModuleReturnData
        // instead of performing a call from this contract.
        return ERC4626(strategy).withdraw(amount, address(this), address(this));
    }
}

// TODO: accounting (oracles, PCV value in USD onchain)
//   -> Add oracle management in the PCVVault ? Could be useful to emit USD values in events, and also check for slippage on strategy enter/exit & on conversions
// TODO: collateralization oracle
//   -> Read vault.assets() and fei.totalSupply() + a list of fei.balanceOf(...) addresses to exclude ("protocol-owned") to compute CR
