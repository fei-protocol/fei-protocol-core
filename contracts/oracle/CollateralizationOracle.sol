// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IOracle.sol";
import "./ICollateralizationOracle.sol";
import "../refs/CoreRef.sol";
import "../pcv/IPCVDepositV2.sol";

/// @title Fei Protocol's Collateralization Oracle
/// @author eswak
/// @notice Reads a list of PCVDeposit that report their amount of collateral
///         and the amount of protocol-owned FEI they manage, to deduce the
///         protocol-wide collateralization ratio.
contract CollateralizationOracle is ICollateralizationOracle, CoreRef {
    using Decimal for Decimal.D256;

    // ----------- Events -----------

    event DepositAdd(address from, address indexed deposit, address indexed token);
    event DepositRemove(address from, address indexed deposit);
    event OracleUpdate(address from, address indexed token, address indexed oldOracle, address indexed newOracle);

    // ----------- Properties -----------

    /// @notice Array of PCVDeposits to inspect
    address[] public pcvDeposits;

    /// @notice Map of oracles to use to get USD values of assets held in
    ///         PCV deposits. This map is used to get the oracle address from
    ///         and ERC20 address.
    mapping(address => address) public token2oracle;
    /// @notice Map from token address to an array of deposit addresses. It is
    //          used to iterate on all deposits while making oracle requests
    //          only once.
    mapping(address => address[]) public token2deposits;
    /// @notice Map from deposit address to token address. It is used like an
    ///         indexed version of the pcvDeposits array, to check existence
    ///         of a PCVdeposit in the current config.
    mapping(address => address) public deposit2token;
    /// @notice Array of all tokens held in the PCV. Used for iteration on tokens
    ///         and oracles.
    address[] public tokensInPcv;
    /// @notice Map to know if a given token is in the PCV. Used like an indexed
    ///         version of the tokensInPcv array.
    mapping(address => uint8) public isTokenInPcv;

    // ----------- Constructor -----------

    /// @notice CollateralizationOracle constructor
    /// @param _core Fei Core for reference
    constructor(
        address _core
    ) CoreRef(_core) {}

    // ----------- State-changing methods -----------

    /// @notice Add a PCVDeposit to the list of deposits inspected by the
    ///         collateralization ratio oracle.
    ///         note : this function reverts if the deposit is already in the list.
    ///         note : this function reverts if the deposit's token has no oracle.
    /// @param _deposit : the PCVDeposit to add to the list.
    function addDeposit(address _deposit) external onlyGovernor {
        // if the PCVDeposit is already listed, revert.
        require(deposit2token[_deposit] == address(0), "CollateralizationOracle: deposit duplicate");

        // get the token in which the deposit reports its token
        address _token = IPCVDepositV2(_deposit).balanceReportedIn();

        // revert if there is no oracle of this deposit's token
        require(token2oracle[_token] != address(0), "CollateralizationOracle: no oracle");

        // add the PCVDeposit to the list
        pcvDeposits.push(_deposit);

        // update maps & arrays for faster access
        deposit2token[_deposit] = _token;
        token2deposits[_token].push(_deposit);
        if (isTokenInPcv[_token] == 0) {
          isTokenInPcv[_token] = 1;
          tokensInPcv.push(_token);
        }

        // emit event
        emit DepositAdd(msg.sender, _deposit, _token);
    }

    /// @notice Remove a PCVDeposit from the list of deposits inspected by
    ///         the collateralization ratio oracle.
    ///         note : this function reverts if the input deposit is not found.
    /// @param _deposit : the PCVDeposit address to remove from the list.
    function removeDeposit(address _deposit) external onlyGovernor {
        // get the token in which the deposit reports its token
        address _token = deposit2token[_deposit];

        // revert if the deposit is not found
        require(_token != address(0), "CollateralizationOracle: deposit not found");

        // update maps & arrays for faster access
        // deposits array for the deposit's token
        deposit2token[_deposit] = address(0);
        uint256 _nDepositsWithToken = token2deposits[_token].length;
        bool found = false;
        for (uint256 i = 0; !found && i < _nDepositsWithToken; i++) {
            if (token2deposits[_token][i] == _deposit) {
                found = true;
                token2deposits[_token][i] = token2deposits[_token][_nDepositsWithToken - 1];
            }
        }
        token2deposits[_token].pop();
        // if it was the last deposit to have this token, remove this token from
        // the arrays also
        if (token2deposits[_token].length == 0) {
          isTokenInPcv[_token] = 0;
          uint256 _nTokensInPcv = tokensInPcv.length;
          found = false;
          for (uint256 i = 0; !found && i < _nTokensInPcv; i++) {
              if (tokensInPcv[i] == _token) {
                  found = true;
                  tokensInPcv[i] = tokensInPcv[_nTokensInPcv - 1];
              }
          }
          tokensInPcv.pop();
        }
        // remove from the main array
        uint256 _nDeposits = pcvDeposits.length;
        found = false;
        for (uint256 i = 0; !found && i < _nDeposits; i++) {
            if (pcvDeposits[i] == _deposit) {
                found = true;
                pcvDeposits[i] = pcvDeposits[_nDeposits - 1];
            }
        }
        pcvDeposits.pop();

        // emit event
        emit DepositRemove(msg.sender, _deposit);
    }

    /// @notice Set the price feed oracle (in USD) for a given asset.
    /// @param _token : the asset to add price oracle for
    /// @param _newOracle : price feed oracle for the given asset
    function setOracle(address _token, address _newOracle) external onlyGovernor {
        // add oracle to the map(ERC20Address) => OracleAddress
        address _oldOracle = token2oracle[_token];
        token2oracle[_token] = _newOracle;

        // emit event
        emit OracleUpdate(msg.sender, _token, _oldOracle, _newOracle);
    }

    // ----------- IOracle override methods -----------
    /// @notice update all oracles required for this oracle to work
    function update() external override whenNotPaused {
        for (uint256 i = 0; i < tokensInPcv.length; i++) {
            IOracle(token2oracle[tokensInPcv[i]]).update();
        }
    }

    // @notice returns true if any of the oracles required for this oracle to
    //         work are outdated.
    function isOutdated() external override view returns (bool) {
        bool _outdated = false;
        for (uint256 i = 0; i < tokensInPcv.length && !_outdated; i++) {
            _outdated = _outdated || IOracle(token2oracle[tokensInPcv[i]]).isOutdated();
        }
        return _outdated;
    }

    /// @notice Get the current collateralization ratio of the protocol.
    /// @return _collateralRatio the current collateral ratio of the protocol.
    /// @return _globalValid the current oracle validity status (false if any
    ///         of the oracles for tokens held in the PCV are invalid, or if
    ///         this contract is paused).
    function read() public override view returns (Decimal.D256 memory, bool) {
        // The total amount of FEI controlled (owned) by the protocol
        uint256 _protocolControlledFei = 0;
        // The total USD value of assets held in the PCV
        uint256 _protocolControlledValue = 0;
        // false if any of the token oracles are invalid, or if paused
        bool _globalValid = !paused();

        // For each token...
        for (uint256 i = 0; i < tokensInPcv.length; i++) {
            address _token = tokensInPcv[i];
            (Decimal.D256 memory _price, bool _valid) = IOracle(token2oracle[_token]).read();
            _globalValid = _globalValid && _valid;

            // For each deposit...
            for (uint256 j = 0; j < token2deposits[_token].length; j++) {
                IPCVDepositV2 _deposit = IPCVDepositV2(token2deposits[_token][j]);

                // Increment the total protocol controlled value by the USD value of
                // the asset held in this PCVDeposit
                _protocolControlledValue += _price.mul(_deposit.resistantBalance()).asUint256();

                // Increment the total protocol controlled FEI by the amount of FEI
                // held by this PCVDeposit
                _protocolControlledFei += _deposit.resistantProtocolOwnedFei();
            }
        }

        // The circulating FEI is defined as the total FEI supply, minus the
        // protocol-owned FEI managed by the various deposits.
        uint256 _userCirculatingFei = fei().totalSupply() - _protocolControlledFei;

        // The protocol collateralization ratio is defined as the total USD
        // value of assets held in the PCV, minus the circulating FEI.
        Decimal.D256 memory _collateralRatio = Decimal.ratio(_protocolControlledValue, _userCirculatingFei);

        // return values
        return (_collateralRatio, _globalValid);
    }

    // ----------- ICollateralizationOracle override methods -----------

    /// @notice returns true if the protocol is overcollateralized. Overcollateralization
    ///         is defined as the protocol having more assets in its PCV (Protocol
    ///         Controlled Value) than the circulating (user-owned) FEI.
    function isOvercollateralized() external view override whenNotPaused returns (bool) {
        return pcvEquityValue() > 0;
    }

    /// @notice returns the amount of circulating (user-owned) FEI. User Circulating
    ///         FEI is defined as the total supply of FEI minus the FEI held in the
    ///         various protocol's contracts.
    function userCirculatingFei() external view override whenNotPaused returns (uint256) {
        uint256 _protocolControlledFei = 0;

        for (uint256 i = 0; i < pcvDeposits.length; i++) {
            IPCVDepositV2 _deposit = IPCVDepositV2(pcvDeposits[i]);
            _protocolControlledFei += _deposit.resistantProtocolOwnedFei();
        }

        return fei().totalSupply() - _protocolControlledFei;
    }

    /// @notice returns the total PCV (Protocol Controlled Value) of Fei Protocol. The
    ///         PCV is the value of all assets held by the protocol, denominated in USD,
    ///         that is either held on the protocol's contracts, or deployed productively
    ///         in liquidity pools, lending services, etc.
    function pcvValue() external view override whenNotPaused returns (uint256) {
        uint256 _pcv = 0;

        // For each token...
        for (uint256 i = 0; i < tokensInPcv.length; i++) {
            address _token = tokensInPcv[i];
            (Decimal.D256 memory _price, bool _valid) = IOracle(token2oracle[_token]).read();
            require(_valid, "CollateralizationOracle: oracle invalid");

            // For each deposit...
            for (uint256 j = 0; j < token2deposits[_token].length; j++) {
                IPCVDepositV2 _deposit = IPCVDepositV2(token2deposits[_token][j]);
                _pcv += _price.mul(_deposit.resistantBalance()).asUint256();
            }
        }

        return _pcv;
    }

    /// @notice returns the total PCV Equity of Fei Protocol. The PCV equity is
    ///         defined as the total PCV dollar value minus User Circulating FEI.
    ///         See pcvValue() and userCirculatingFei() for more details.
    function pcvEquityValue() public view override whenNotPaused returns (uint256) {
        uint256 _pcv = 0;
        uint256 _protocolControlledFei = 0;

        // For each token...
        for (uint256 i = 0; i < tokensInPcv.length; i++) {
            address _token = tokensInPcv[i];
            (Decimal.D256 memory _price, bool _valid) = IOracle(token2oracle[_token]).read();
            require(_valid, "CollateralizationOracle: oracle invalid");

            // For each deposit...
            for (uint256 j = 0; j < token2deposits[_token].length; j++) {
                IPCVDepositV2 _deposit = IPCVDepositV2(token2deposits[_token][j]);
                _pcv += _price.mul(_deposit.resistantBalance()).asUint256();
                _protocolControlledFei += _deposit.resistantProtocolOwnedFei();
            }
        }

        uint256 _userCirculatingFei = fei().totalSupply() - _protocolControlledFei;
        uint256 _equity = 0;
        if (_pcv > _userCirculatingFei) {
            _equity = _pcv - _userCirculatingFei;
        }
        return _equity;
    }
}
