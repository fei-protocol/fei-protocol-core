// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IOracle.sol";
import "./ICollateralizationOracle.sol";
import "../refs/CoreRef.sol";
import "../pcv/IPCVDepositV2.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

interface IPausable {
    function paused() external view returns (bool);
}

/// @title Fei Protocol's Collateralization Oracle
/// @author eswak
/// @notice Reads a list of PCVDeposit that report their amount of collateral
///         and the amount of protocol-owned FEI they manage, to deduce the
///         protocol-wide collateralization ratio.
contract CollateralizationOracle is ICollateralizationOracle, CoreRef {
    using Decimal for Decimal.D256;
    using EnumerableSet for EnumerableSet.AddressSet;

    // ----------- Events -----------

    event DepositAdd(address from, address indexed deposit, address indexed token);
    event DepositRemove(address from, address indexed deposit);
    event OracleUpdate(address from, address indexed token, address indexed oldOracle, address indexed newOracle);

    // ----------- Properties -----------

    /// @notice List of PCVDeposits to exclude from calculations
    mapping(address => bool) public excludedDeposits;

    /// @notice Map of oracles to use to get USD values of assets held in
    ///         PCV deposits. This map is used to get the oracle address from
    ///         and ERC20 address.
    mapping(address => address) public tokenToOracle;
    /// @notice Map from token address to an array of deposit addresses. It is
    //          used to iterate on all deposits while making oracle requests
    //          only once.
    mapping(address => EnumerableSet.AddressSet) private tokenToDeposits;
    /// @notice Map from deposit address to token address. It is used like an
    ///         indexed version of the pcvDeposits array, to check existence
    ///         of a PCVdeposit in the current config.
    mapping(address => address) public depositToToken;
    /// @notice Array of all tokens held in the PCV. Used for iteration on tokens
    ///         and oracles.
    EnumerableSet.AddressSet private tokensInPcv;

    // ----------- Constructor -----------

    /// @notice CollateralizationOracle constructor
    /// @param _core Fei Core for reference
    constructor(
        address _core
    ) CoreRef(_core) {}

    // ----------- Convenience getters -----------

    /// @notice returns true if a token is held in the pcv
    function isTokenInPcv(address token) external view returns(bool) {
        return tokensInPcv.contains(token);
    }

    /// @notice returns an array of the addresses of tokens held in the pcv.
    function getTokensInPcv() external view returns(address[] memory) {
        uint256 _length = tokensInPcv.length();
        address[] memory tokens = new address[](_length);
        for (uint256 i = 0; i < _length; i++) {
            tokens[i] = tokensInPcv.at(i);
        }
        return tokens;
    }

    /// @notice returns token at index i of the array of PCV tokens
    function getTokenInPcv(uint256 i) external view returns(address) {
        return tokensInPcv.at(i);
    }

    /// @notice returns an array of the deposits holding a given token.
    function getDepositsForToken(address _token) external view returns(address[] memory) {
        uint256 _length = tokenToDeposits[_token].length();
        address[] memory deposits = new address[](_length);
        for (uint256 i = 0; i < _length; i++) {
            deposits[i] = tokenToDeposits[_token].at(i);
        }
        return deposits;
    }

    /// @notice returns the address of deposit at index i of token _token
    function getDepositForToken(address token, uint256 i) external view returns(address) {
        return tokenToDeposits[token].at(i);
    }

    // ----------- State-changing methods -----------

    /// @notice Guardians can exclude & re-include some PCVDeposits from the list,
    ///         because a faulty deposit or a paused oracle that prevents reading
    ///         from certain deposits could be problematic.
    /// @param _deposit : the deposit to exclude or re-enable.
    /// @param _excluded : the new exclusion flag for this deposit.
    function setDepositExclusion(address _deposit, bool _excluded) external onlyGuardianOrGovernor {
        excludedDeposits[_deposit] = _excluded;
    }

    /// @notice Add a PCVDeposit to the list of deposits inspected by the
    ///         collateralization ratio oracle.
    ///         note : this function reverts if the deposit is already in the list.
    ///         note : this function reverts if the deposit's token has no oracle.
    /// @param _deposit : the PCVDeposit to add to the list.
    function addDeposit(address _deposit) external onlyGovernor {
        // if the PCVDeposit is already listed, revert.
        require(depositToToken[_deposit] == address(0), "CollateralizationOracle: deposit duplicate");

        // get the token in which the deposit reports its token
        address _token = IPCVDepositV2(_deposit).balanceReportedIn();

        // revert if there is no oracle of this deposit's token
        require(tokenToOracle[_token] != address(0), "CollateralizationOracle: no oracle");

        // update maps & arrays for faster access
        depositToToken[_deposit] = _token;
        tokenToDeposits[_token].add(_deposit);
        tokensInPcv.add(_token);

        // emit event
        emit DepositAdd(msg.sender, _deposit, _token);
    }

    /// @notice Remove a PCVDeposit from the list of deposits inspected by
    ///         the collateralization ratio oracle.
    ///         note : this function reverts if the input deposit is not found.
    /// @param _deposit : the PCVDeposit address to remove from the list.
    function removeDeposit(address _deposit) external onlyGovernor {
        // get the token in which the deposit reports its token
        address _token = depositToToken[_deposit];

        // revert if the deposit is not found
        require(_token != address(0), "CollateralizationOracle: deposit not found");

        // update maps & arrays for faster access
        // deposits array for the deposit's token
        depositToToken[_deposit] = address(0);
        tokenToDeposits[_token].remove(_deposit);

        // if it was the last deposit to have this token, remove this token from
        // the arrays also
        if (tokenToDeposits[_token].length() == 0) {
          tokensInPcv.remove(_token);
        }

        // emit event
        emit DepositRemove(msg.sender, _deposit);
    }

    /// @notice Swap a PCVDeposit with a new one, for instance when a new version
    ///         of a deposit (holding the same token) is deployed.
    /// @param _oldDeposit : the PCVDeposit to remove from the list.
    /// @param _newDeposit : the PCVDeposit to add to the list.
    function swapDeposit(address _oldDeposit, address _newDeposit) external onlyGovernor {
        // get the token in which the old deposit reports its token
        address _token = depositToToken[_oldDeposit];
        address _newToken = IPCVDepositV2(_newDeposit).balanceReportedIn();

        // revert if old deposit is not found
        require(_token != address(0), "CollateralizationOracle: deposit not found");

        // revert if new deposit is found
        require(depositToToken[_newDeposit] == address(0), "CollateralizationOracle: deposit duplicate");

        // revert if token is different
        require(_token == _newToken, "CollateralizationOracle: deposit has different token");

        // update maps & arrays for faster access
        depositToToken[_oldDeposit] = address(0);
        depositToToken[_newDeposit] = _token;
        tokenToDeposits[_token].remove(_oldDeposit);
        tokenToDeposits[_token].add(_newDeposit);

        // emit event
        emit DepositRemove(msg.sender, _oldDeposit);
        emit DepositAdd(msg.sender, _newDeposit, _token);
    }

    /// @notice Set the price feed oracle (in USD) for a given asset.
    /// @param _token : the asset to add price oracle for
    /// @param _newOracle : price feed oracle for the given asset
    function setOracle(address _token, address _newOracle) external onlyGovernor {
        // add oracle to the map(ERC20Address) => OracleAddress
        address _oldOracle = tokenToOracle[_token];
        tokenToOracle[_token] = _newOracle;

        // emit event
        emit OracleUpdate(msg.sender, _token, _oldOracle, _newOracle);
    }

    // ----------- IOracle override methods -----------
    /// @notice update all oracles required for this oracle to work that are not
    ///         paused themselves.
    function update() external override whenNotPaused {
        for (uint256 i = 0; i < tokensInPcv.length(); i++) {
            address _oracle = tokenToOracle[tokensInPcv.at(i)];
            if (!IPausable(_oracle).paused()) {
                IOracle(_oracle).update();
            }
        }
    }

    // @notice returns true if any of the oracles required for this oracle to
    //         work are outdated.
    function isOutdated() external override view returns (bool) {
        bool _outdated = false;
        for (uint256 i = 0; i < tokensInPcv.length() && !_outdated; i++) {
            address _oracle = tokenToOracle[tokensInPcv.at(i)];
            if (!IPausable(_oracle).paused()) {
                _outdated = _outdated || IOracle(_oracle).isOutdated();
            }
        }
        return _outdated;
    }

    /// @notice Get the current collateralization ratio of the protocol.
    /// @return collateralRatio the current collateral ratio of the protocol.
    /// @return validityStatus the current oracle validity status (false if any
    ///         of the oracles for tokens held in the PCV are invalid, or if
    ///         this contract is paused).
    function read() public override view returns (Decimal.D256 memory collateralRatio, bool validityStatus) {
        // fetch PCV stats
        (
          uint256 _protocolControlledValue,
          uint256 _userCirculatingFei,
          , // we don't need protocol equity
          bool _valid
        ) = pcvStats();

        // The protocol collateralization ratio is defined as the total USD
        // value of assets held in the PCV, minus the circulating FEI.
        collateralRatio = Decimal.ratio(_protocolControlledValue, _userCirculatingFei);
        validityStatus = _valid;
    }

    // ----------- ICollateralizationOracle override methods -----------

    /// @notice returns the Protocol-Controlled Value, User-circulating FEI, and
    ///         Protocol Equity.
    /// @return protocolControlledValue : the total USD value of all assets held
    ///         by the protocol.
    /// @return userCirculatingFei : the number of FEI not owned by the protocol.
    /// @return protocolEquity : the difference between PCV and user circulating FEI.
    ///         If there are more circulating FEI than $ in the PCV, equity is 0.
    /// @return validityStatus : the current oracle validity status (false if any
    ///         of the oracles for tokens held in the PCV are invalid, or if
    ///         this contract is paused).
    function pcvStats() public override view returns (
      uint256 protocolControlledValue,
      uint256 userCirculatingFei,
      int256 protocolEquity,
      bool validityStatus
    ) {
        uint256 _protocolControlledFei = 0;
        address _fei = address(fei());
        validityStatus = !paused();

        // For each token...
        for (uint256 i = 0; i < tokensInPcv.length(); i++) {
            address _token = tokensInPcv.at(i);
            bool _oracleRead = false; // used to read oracle only once
            bool _oracleValid = false; // validity flag of oracle.read()
            Decimal.D256 memory _oraclePrice = Decimal.zero();

            // For each deposit...
            uint256 _totalTokenBalance  = 0;
            for (uint256 j = 0; j < tokenToDeposits[_token].length(); j++) {
                address _deposit = tokenToDeposits[_token].at(j);

                // ignore deposits that are excluded by the Guardian
                if (!excludedDeposits[_deposit]) {
                    // On the first inspected deposit, read the oracle.
                    // This is done inside the loop, after exclusion check,
                    // because if all deposits of an asset are excluded, there is
                    // no need to read the oracle.
                    if (!_oracleRead) {
                        (_oraclePrice, _oracleValid) = IOracle(tokenToOracle[_token]).read();
                        _oracleRead = true;
                        if (!_oracleValid) {
                            validityStatus = false;
                        }
                    }

                    // read the deposit
                    (uint256 _depositBalance, uint256 _depositFei) = IPCVDepositV2(_deposit).balanceAndFei();
                    _totalTokenBalance += _depositBalance;
                    _protocolControlledFei += _depositFei;
                }
            }

            protocolControlledValue += _oraclePrice.mul(_totalTokenBalance).asUint256();
        }

        userCirculatingFei = fei().totalSupply() - _protocolControlledFei;
        protocolEquity = int256(protocolControlledValue) - int256(userCirculatingFei);

        userCirculatingFei = fei().totalSupply() - _protocolControlledFei;
    }

    /// @notice returns true if the protocol is overcollateralized. Overcollateralization
    ///         is defined as the protocol having more assets in its PCV (Protocol
    ///         Controlled Value) than the circulating (user-owned) FEI, i.e.
    ///         a positive Protocol Equity.
    ///         Note: the validity status is ignored in this function.
    function isOvercollateralized() external override view whenNotPaused returns (bool) {
        (,, int256 _protocolEquity, bool _valid) = pcvStats();
        require(_valid, "CollateralizationOracle: reading is invalid");
        return _protocolEquity > 0;
    }
}
