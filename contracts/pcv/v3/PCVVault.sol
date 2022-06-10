// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.10;

import "./PCVStrategy.sol";
import "../../oracle/IOracle.sol";
import "../../utils/ENSNamed.sol";
import "../../external/Decimal.sol";
import "../../external/solmate/Auth.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/// @title Contract used as a central vault for Fei Protocol's PCV.
/// @author eswak
contract PCVVault is Auth, ENSNamed {
    using SafeERC20 for IERC20;
    using SafeERC20 for ERC4626;
    using Decimal for Decimal.D256;
    using EnumerableSet for EnumerableSet.AddressSet;

    // -------------- Events -----------------

    event SetOracle(address caller, address indexed token, address indexed oracle);
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

    /// @notice the PCVVault can be tied to a Gnosis Safe,
    /// in that case, all external calls happen through the Safe, and
    /// the Safe will hold all ERC4626 vault shares, as well as all
    /// tokens used in conversions.
    address public gnosisSafeAddress;

    /// @notice List of assets managed by this vault.
    /// The assets managed by the vault will be tracked with offchain events.
    EnumerableSet.AddressSet private assets;

    /// @notice Oracles for each assets of this vault.
    mapping(address => address) private oracles;

    /// @notice Strategies whitelisted in this vault. The vault
    /// will be able to use these strategies to convert an deposit its
    /// assets.
    EnumerableSet.AddressSet private strategies;

    /// @notice Mapping of a list of strategies for each asset of the vault,
    /// used for iterations while performing accounting.
    mapping(address => EnumerableSet.AddressSet) private assetStrategies;

    // ------------- Constructor -------------
    constructor(address owner, Authority authority) Auth(owner, authority) ENSNamed() {}

    // ---------- Read Methods ---------------

    /// @notice returns the list of assets in the PCV, their amounts, and their values.
    /// Reads all fresh values, so this is quite intensive to call on-chain.
    /// @return currentAssets list of assets in the PCV
    /// @return currentBalances list of balances of assets in the PCV (in the same order as the assets array)
    /// @return currentValues list of values of assets in the PCV (in the same order as the assets array).
    /// currentValues are in USD, with 18 decimals.
    function holdings()
        external
        view
        returns (
            address[] memory currentAssets,
            int256[] memory currentBalances,
            int256[] memory currentValuesUSD
        )
    {
        address thisAddress = _thisAddress();
        currentAssets = assets.values();
        currentBalances = new int256[](currentAssets.length);
        currentValuesUSD = new int256[](currentAssets.length);
        for (uint256 i = 0; i < strategies.length(); i++) {
            PCVStrategy strategy = PCVStrategy(strategies.at(i));
            address[] memory _assets = strategy.assets();
            int256[] memory _balances = strategy.balances(thisAddress);
            for (uint256 j = 0; j < _assets.length; j++) {
                uint256 index = assets._inner._indexes[bytes32(uint256(uint160(_assets[j])))];
                currentBalances[index] += _balances[i];
            }
        }
        for (uint256 k = 0; k < currentBalances.length; k++) {
            IOracle oracle = IOracle(oracles[currentAssets[k]]);
            (Decimal.D256 memory value, bool valid) = oracle.read();
            require(valid, "!ORACLE");
            currentValuesUSD[k] = (currentBalances[k] * int256(value.asUint256())) / int256(1e18);
        }
    }

    // ------ State-changing Methods ---------

    /// @notice set reverse ENS record
    // override to add authority check
    function setName(string calldata newName) public override requiresAuth {
        _setName(newName);
    }

    /// @notice set the gnosis safe address
    /// A PCVVault can execute through a Gnosis Safe if it is linked to one. In this
    /// case, all the ERC4626 vault shares and tokens will be in the Gnosis Safe,
    /// otherwise the PCVVault will hold the funds directly.
    function setGnosisSafeAddress(address newSafeAddress) external requiresAuth {
        emit GnosisSafeAddressUpdated(msg.sender, gnosisSafeAddress, newSafeAddress);
        gnosisSafeAddress = newSafeAddress;
        // TODO: do we have to call some functions on the Safe contracts?
        // TODO: emit Balance() event for all vault assets
    }

    /// @notice register an asset in the PCVVault
    /// This vault will be able to manipulate this asset an emit proper events
    /// for off-chain tracking of this asset's balance.
    function registerAsset(address asset, address oracle) external requiresAuth {
        require(asset != address(0), "INVALID");
        require(!assets.contains(asset), "REGISTERED");

        uint256 amount = IERC20(asset).balanceOf(_thisAddress());
        emit Balance(msg.sender, asset, amount);
        emit AssetRegister(msg.sender, asset);
        emit SetOracle(msg.sender, asset, oracle);

        assets.add(asset);
        oracles[asset] = oracle;
    }

    /// @notice deregister an asset from the PCVVault
    /// This vault will no longer be able to manipulate this token and emit
    /// events for off-chain tracking.
    function deregisterAsset(address asset) external requiresAuth {
        require(asset != address(0), "INVALID");
        require(assets.contains(asset), "!REGISTERED");

        emit Balance(msg.sender, asset, 0);
        emit AssetDeregister(msg.sender, asset);

        assets.remove(asset);
        delete oracles[asset];
    }

    /// @notice register a strategy to be used in this vault.
    /// tokens can only move to registered strategies.
    function registerStrategy(address strategy) external requiresAuth {
        require(strategy != address(0), "INVALID");
        require(!strategies.contains(strategy), "REGISTERED");

        emit StrategyRegister(msg.sender, strategy);

        address[] memory _assets = PCVStrategy(strategy).assets();
        for (uint256 i = 0; i < _assets.length; i++) {
            address asset = _assets[i];
            require(assets.contains(asset), "!ASSET");
            assetStrategies[asset].add(strategy);
        }
        strategies.add(strategy);
    }

    /// @notice deregister a strategy from the vault.
    /// tokens won't be able to move to this strategy.
    function deregisterStrategy(address strategy) external requiresAuth {
        require(strategy != address(0), "INVALID");
        require(strategies.contains(strategy), "!REGISTERED");

        emit StrategyDeregister(msg.sender, strategy);

        address[] memory _assets = PCVStrategy(strategy).assets();
        for (uint256 i = 0; i < _assets.length; i++) {
            address asset = _assets[i];
            assetStrategies[asset].remove(strategy);
        }

        exit(strategy);

        strategies.remove(strategy);

        for (uint256 i = 0; i < _assets.length; i++) {
            refreshBalance(_assets[i]);
        }
    }

    /// @dev note that this call is permissionless
    function refreshBalance(address asset) public {
        // read all strategies of the given asset, get balances,
        // and emit the Balance event.
    }

    function deposit(address strategy, uint256 amount) external requiresAuth {
        // preliminary checks
        require(strategies.contains(strategy), "!STRATEGY");
        require(amount != 0, "ZERO_AMOUNT");

        // deposit tokens in the strategy
        address strategyAsset = address(PCVStrategy(strategy).asset());
        _erc20_approve(strategyAsset, strategy, uint256(amount));
        _erc4626_deposit(strategy, uint256(amount));

        // emit Balance events
        refreshBalance(strategy);
        refreshBalance(strategyAsset);
    }

    function withdraw(address strategy, uint256 amount) external requiresAuth {
        // preliminary checks
        require(strategies.contains(strategy), "!STRATEGY");
        require(amount != 0, "ZERO_AMOUNT");

        // withdraw tokens from the strategy
        _erc4626_withdraw(strategy, uint256(amount));

        // emit Balance events
        refreshBalance(strategy);
        refreshBalance(address(PCVStrategy(strategy).asset()));
    }

    // all strategies should have an emergency switch-off feature that recall
    // all funds to the vault
    function redeemAll(address strategy) public requiresAuth {
        // preliminary checks
        require(strategies.contains(strategy), "!STRATEGY");

        // redeem all shares of an ERC4626 strategy
        address thisAddress = _thisAddress();
        uint256 shares = ERC4626(strategy).balanceOf(thisAddress);
        _erc4626_redeem(strategy, shares);

        // emit Balance events
        address[] memory strategyAssets = PCVStrategy(strategy).assets();
        for (uint256 i = 0; i < strategyAssets.length; i++) {
            refreshBalance(strategyAssets[i]);
        }
    }

    /// @dev note that this call is permissionless, it just pulls back some ERC20s
    /// from a strategy (such as staking rewards) into the vault
    function withdrawERC20FromStrategy(address strategy, address asset) external {
        require(asset != address(0), "INVALID");
        require(assets.contains(asset), "!REGISTERED");

        address thisAddress = _thisAddress();
        uint256 balanceBefore = IERC20(asset).balanceOf(thisAddress);
        _strategy_withdrawERC20(strategy, asset);
        uint256 balanceAfter = IERC20(asset).balanceOf(thisAddress);

        emit Revenue(msg.sender, strategy, asset, balanceAfter - balanceBefore);
        refreshBalance(asset); // emits Balance
    }

    /// @notice convert tokens using a given strategy
    function convert(
        address strategy,
        int256[] memory amountsIn,
        uint16[] memory maxSlippageBps
    ) external requiresAuth returns (int256[] memory amountsOut) {
        int256 usdValueIn = 0;
        uint256[] memory oracleValues = new uint256[](amountsIn.length);
        address[] memory strategyAssets = PCVStrategy(strategy).assets();
        for (uint256 i = 0; i < amountsIn.length; i++) {
            (Decimal.D256 memory value, bool valid) = IOracle(oracles[strategyAssets[i]]).read();
            require(valid, "!VALID");
            oracleValues[i] = value.asUint256();
            usdValueIn += (int256(oracleValues[i]) * amountsIn[i]) / int256(1e18);
        }

        int256[] memory minAmountsOut = new int256[](amountsIn.length);
        for (uint256 i = 0; i < minAmountsOut.length; i++) {
            if (maxSlippageBps[i] != 0) {
                minAmountsOut[i] =
                    ((int256(10000) - int256(int16(maxSlippageBps[i]))) * usdValueIn) /
                    (int256(oracleValues[i]) * int256(10000));
            }
        }
        return _strategy_convertAssets(strategy, amountsIn, minAmountsOut);
    }

    /// withdraw ERC20 to an address
    function withdrawERC20(
        address token,
        address to,
        uint256 amount
    ) external requiresAuth {
        _erc20_transfer(token, to, amount);
        refreshBalance(token);
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
        IERC20(token).safeApprove(spender, amount);
    }

    function _erc20_transfer(
        address token,
        address to,
        uint256 amount
    ) internal {
        // TODO: if associated to a Gnosis Safe, use
        // safe.execTransactionFromModuleReturnData
        // instead of performing a call from this contract.
        IERC20(token).safeTransfer(to, amount);
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

    function _strategy_withdrawERC20(address strategy, address asset) internal {
        // TODO: if associated to a Gnosis Safe, use
        // safe.execTransactionFromModuleReturnData
        // instead of performing a call from this contract.
        PCVStrategy(strategy).withdrawERC20(asset);
    }

    function _strategy_convertAssets(
        address strategy,
        int256[] memory amountsIn,
        int256[] memory minAmountsOut
    ) internal returns (int256[] memory amountsOut) {
        // TODO: if associated to a Gnosis Safe, use
        // safe.execTransactionFromModuleReturnData
        // instead of performing a call from this contract.
        return PCVStrategy(strategy).convertAssets(amountsIn, minAmountsOut);
    }
}
