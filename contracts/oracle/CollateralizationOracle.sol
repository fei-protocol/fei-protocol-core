// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IOracle.sol";
import "../refs/CoreRef.sol";
import "../pcv/IPCVDepositV2.sol";

/// @title Fei Protocol's Collateralization Oracle
/// @author eswak
/// @notice Reads a list of PCVDeposit that report their amount of collateral
///         and the amount of protocol-owned FEI they manage, to deduce the
///         protocol-wide collateralization ratio.
///         The protocol collateralization ratio is defined as the total USD
///         value of assets held in the PCV, minus the circulating FEI.
///         The circulating FEI is defined as the total FEI supply, minus the
///         protocol-owned FEI managed by the various deposits.
contract CollateralizationOracle is CoreRef {
    using Decimal for Decimal.D256;

    // ----------- Events -----------

    event DepositAdd(address indexed _from, address _deposit);
    event DepositRemove(address indexed _from, address _deposit);
    event OracleSet(address indexed _from, address _token, address _oracle);

    // ----------- Properties -----------

    /// @notice array of PCVDeposits to inspect
    address[] public pcvDeposits;

    /// @notice map of oracles to use to get USD values of assets held in
    ///         PCV deposits. This map is used to get the oracle address from
    ///         and ERC20 address.
    mapping(address => address) public oracles;

    // ----------- Constructor -----------

    /// @notice CollateralizationOracle constructor
    /// @param _core Fei Core for reference
    constructor(
        address _core
    ) CoreRef(_core) {}

    // ----------- State-changing methods -----------

    /// @notice Add a PCVDeposit to the list of deposits inspected by the
    ///         collateralization ratio oracle.
    ///         note : this function reverts of the deposit is already in the list.
    /// @param _deposit : the PCVDeposit to add t othe list.
    function addDeposit(address _deposit) external onlyGovernor {
        // flag to indicate of the given _deposit has been found in the list
        // of PCVdeposits declared in this contract.
        bool found = false;
        for (uint256 i = 0; i < pcvDeposits.length; i++) {
            if (pcvDeposits[i] == _deposit) {
                found = true;
            }
        }

        // if the PCVDeposit is already listed, revert.
        require(!found, "CollateralizationOracle: add _deposit duplicate");

        // add the PCVDeposit to the list
        pcvDeposits.push(_deposit);

        // emit event
        emit DepositAdd(msg.sender, _deposit);
    }

    /// @notice Remove a PCVDeposit from the list of deposits inspected by
    ///         the collateralization ratio oracle.
    ///         note : this function reverts if the input deposit is not found.
    /// @param _deposit : the PCVDeposit address to remove from the list.
    function removeDeposit(address _deposit) external onlyGovernor {
        // flag to indicate of the given _deposit has been found in the list
        // of PCVdeposits declared in this contract.
        bool found = false;

        // If the PCVDeposit to remove is last in the array, no need to loop.
        if (pcvDeposits[pcvDeposits.length - 1] == _deposit) {
            found = true;
        }
        // loop through PCVDeposits to find the given deposit, and remove it
        // from the array if found
        else {
            for (uint256 i = 0; i < pcvDeposits.length; i++) {
                if (pcvDeposits[i] == _deposit) {
                    found = true;
                }

                if (found) {
                    pcvDeposits[i] = pcvDeposits[i + 1];
                }
            }
        }

        // revert if the deposit has not been found
        require(found, "CollateralizationOracle: remove _deposit not found");

        // remove last element from the array of deposits
        pcvDeposits.pop();

        // emit event
        emit DepositRemove(msg.sender, _deposit);
    }

    /// @notice Set the price feed oracle (in USD) for a given asset.
    /// @param _token : the asset to add price oracle for
    /// @param _oracle : price feed oracle for the given asset
    function setOracle(address _token, address _oracle) external onlyGovernor {
        // add oracle to the map(ERC20Address) => OracleAddress
        oracles[_token] = _oracle;

        // emit event
        emit OracleSet(msg.sender, _token, _oracle);
    }

    // ----------- View/Pure methods -----------

    /// @notice Get the current collateralization ratio of the protocol.
    /// @return _collateralRatio the current collateral ratio of the protocol,
    ///         expressed on a 1e18 basis.
    /// @return _protocolControlledValue the total USD value of all assets held
    ///         by the protocol, expressed on a 1e18 basis.
    /// @return _circulatingFei the total amount of FEI circulating (i.e. not
    ///         owned by the protocol).
    function read() external view returns (uint256, uint256, uint256) {
        // The total amount of FEI controlled (owned) by the protocol
        uint256 _protocolControlledFei = 0;
        // The total USD value of assets held in the PCV
        uint256 _protocolControlledValue = 0;

        // For each PCVDeposit...
        for (uint256 i = 0; i < pcvDeposits.length; i++) {
            IPCVDepositV2 _deposit = IPCVDepositV2(pcvDeposits[i]);

            // Get the asset this PCVDeposit reports its balance, and read a
            // price feed to get the USD value of this asset.
            address _token = _deposit.balanceReportedIn();
            require(oracles[_token] != address(0), "CollateralizationOracle: oracle not found");
            (Decimal.D256 memory _price, bool _valid) = IOracle(oracles[_token]).read();
            require(_valid, "CollateralizationOracle: oracle invalid");

            // Increment the total protocol controlled value by the USD value of
            // the asset held in this PCVDeposit
            _protocolControlledValue += _price.mul(_deposit.resistantBalance()).asUint256();

            // Increment the total protocol controlled FEI by the amount of FEI
            // held by this PCVDeposit
            _protocolControlledFei += _deposit.resistantProtocolOwnedFei();
        }

        // The circulating FEI is defined as the total FEI supply, minus the
        // protocol-owned FEI managed by the various deposits.
        uint256 _circulatingFei = fei().totalSupply() - _protocolControlledFei;

        // The protocol collateralization ratio is defined as the total USD
        // value of assets held in the PCV, minus the circulating FEI.
        uint256 _collateralRatio = _protocolControlledValue * 1e18 / _circulatingFei;

        // return values
        return (_collateralRatio, _protocolControlledValue, _circulatingFei);
    }
}
