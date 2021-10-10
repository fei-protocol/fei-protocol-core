// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./ITribeMinter.sol";
import "../utils/RateLimited.sol";
import "../Constants.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/** 
  @title implementation for a TRIBE Minter Contract
  @author Fei Protocol

  This contract will be the unique TRIBE minting contract. 
  All minting is subject to an annual inflation rate limit.
  For example if circulating supply is 1m and inflation is capped at 10%, then no more than 100k TRIBE can enter circulation in the following year.

  The contract will increase (decrease) the rate limit proportionally as supply increases (decreases)

  Governance and admins can only lower the max inflation %. 
  They can also exclude (unexclude) addresses' TRIBE balances from the circulating supply. 
  The minter's balance is excluded by default.

  ACCESS_CONTROL:
  This contract follows a somewhat unique access control pattern. 
  It has a contract admin which is NOT intended for optimistic approval, but rather for contracts such as the TribeReserveStabilizer.
  An additional potential contract admin is one which automates the inclusion and removal of excluded deposits from on-chain timelocks.

  Additionally, the ability to transfer the tribe minter role is held by the contract *owner* rather than governor or admin.
  The owner will intially be the DAO timelock.
  This keeps the power to transfer or burn TRIBE minting rights isolated.
*/
contract TribeMinter is ITribeMinter, RateLimited, Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 public override annualMaxInflationBasisPoints;

    EnumerableSet.AddressSet internal _lockedTribeAddresses;

    /// @notice Tribe Reserve Stabilizer constructor
    /// @param _core Fei Core to reference
    constructor(
        address _core,
        uint256 _annualMaxInflationBasisPoints,
        address _owner,
        address[] memory _lockedTribeAddressList
    ) 
      RateLimited(0, 0, 0, false)
      CoreRef(_core)
    {
        _setAnnualMaxInflationBasisPoints(_annualMaxInflationBasisPoints);
        _poke();

        // start with a full buffer
        _resetBuffer();

        transferOwnership(_owner);

        _addLockedTribeAddress(address(this));
        for (uint256 i = 0; i < _lockedTribeAddressList.length; i++) {
            _addLockedTribeAddress(_lockedTribeAddressList[i]);
        }
    }

    /// @notice update the rate limit per second and buffer cap
    function poke() public override {
        (uint256 oldBufferCap, uint256 newBufferCap) = _poke();

        // Increasing the buffer cap shouldn't also increase capacity atomically
        // Deplete buffer by the newly increased cap difference
        if (newBufferCap > oldBufferCap) {
            uint256 increment = newBufferCap - oldBufferCap;
            _depleteBuffer(increment);
        }
    }

    /// @dev no-op, reverts. Prevent admin or governor from overwriting ideal rate limit
    function setRateLimitPerSecond(uint256) external pure override {
        revert("no-op");
    }

    /// @dev no-op, reverts. Prevent admin or governor from overwriting ideal buffer cap
    function setBufferCap(uint256) external pure override { 
        revert("no-op");
    }

    /// @notice mints TRIBE to the target address, subject to rate limit
    /// @param to the address to send TRIBE to
    /// @param amount the amount of TRIBE to send
    function mint(address to, uint256 amount) external override onlyGovernorOrAdmin {
        // first apply rate limit 
        _depleteBuffer(amount);

        // then mint
        _mint(to, amount);
    }

    /// @notice add an address to the lockedTribe excluded list
    function addLockedTribeAddress(address lockedTribeAddress) external override onlyGovernorOrAdmin {
        _addLockedTribeAddress(lockedTribeAddress);
    }

    /// @notice remove an address from the lockedTribe excluded list
    function removeLockedTribeAddress(address lockedTribeAddress) external onlyGovernorOrAdmin {
        _lockedTribeAddresses.remove(lockedTribeAddress);
        emit RemoveLockedTribeAddress(lockedTribeAddress);
    }

    /// @notice changes the TRIBE minter address
    /// @param newMinter the new minter address
    function setMinter(address newMinter) external override onlyOwner {
        require(newMinter != address(0), "TribeReserveStabilizer: zero address");
        ITribe _tribe = ITribe(address(tribe()));
        _tribe.setMinter(newMinter);
    }

    /// @notice sets the max annual inflation relative to current supply
    /// @param newAnnualMaxInflationBasisPoints the new max inflation % denominated in basis points (1/10000)
    function setAnnualMaxInflationBasisPoints(uint256 newAnnualMaxInflationBasisPoints) external override onlyGovernorOrAdmin {
        _setAnnualMaxInflationBasisPoints(newAnnualMaxInflationBasisPoints);
    }

    /// @notice return the ideal buffer cap based on TRIBE circulating supply
    function idealBufferCap() public view override returns (uint256) {
        return tribeCirculatingSupply() * annualMaxInflationBasisPoints / Constants.BASIS_POINTS_GRANULARITY;
    }

    /// @notice return the TRIBE supply, subtracting locked TRIBE
    function tribeCirculatingSupply() public view override returns (uint256) {
        IERC20 _tribe = tribe();

        // Remove all locked TRIBE from total supply calculation
        uint256 lockedTribe;
        for (uint256 i = 0; i < _lockedTribeAddresses.length(); i++) {
            lockedTribe += _tribe.balanceOf(_lockedTribeAddresses.at(i));
        }

        return _tribe.totalSupply() - lockedTribe;
    }

    /// @notice alias for tribeCirculatingSupply
    /// @dev for compatibility with ERC-20 standard for off-chain 3rd party sites
    function totalSupply() public view override returns (uint256) {
        return tribeCirculatingSupply();
    }

    /// @notice return whether a poke is needed or not i.e. is buffer cap != ideal cap
    function isPokeNeeded() external view override returns (bool) {
        return idealBufferCap() != bufferCap;
    }

    /// @notice return the set of locked TRIBE holding addresses to be excluded from circulating supply
    function lockedTribeAddresses() external view override returns(address[] memory) {
        return _lockedTribeAddresses.values();
    }

    function _addLockedTribeAddress(address lockedTribeAddress) internal {
        _lockedTribeAddresses.add(lockedTribeAddress);
        emit AddLockedTribeAddress(lockedTribeAddress);
    }

    // Update the buffer cap and rate limit if needed
    function _poke() internal returns (uint256 oldBufferCap, uint256 newBufferCap) {
        newBufferCap = idealBufferCap();
        oldBufferCap = bufferCap;
        require(newBufferCap != oldBufferCap, "TribeMinter: No rate limit change needed");
        
        _setBufferCap(newBufferCap);
        _setRateLimitPerSecond(newBufferCap / Constants.ONE_YEAR);
    }

    // Transfer held TRIBE first, then mint to cover remainder
    function _mint(address to, uint256 amount) internal {
        ITribe _tribe = ITribe(address(tribe()));

        uint256 _tribeBalance = _tribe.balanceOf(address(this));
        uint256 mintAmount = amount;

        // First transfer maximum amount of held TRIBE
        if(_tribeBalance != 0) {
            uint256 transferAmount = Math.min(_tribeBalance, amount);

            _tribe.transfer(to, transferAmount);

            mintAmount = mintAmount - transferAmount;
            assert(mintAmount + transferAmount == amount);
        }
        
        // Then mint if any more is needed
        if (mintAmount != 0) {
            _tribe.mint(to, mintAmount);
        }
    }

    function _setAnnualMaxInflationBasisPoints(uint256 newAnnualMaxInflationBasisPoints) internal {
        uint256 oldAnnualMaxInflationBasisPoints = annualMaxInflationBasisPoints;
        require(newAnnualMaxInflationBasisPoints != 0, "TribeMinter: cannot have 0 inflation");

        // make sure the new inflation is strictly lower, unless the old inflation is 0 (which is only true upon construction)
        require(newAnnualMaxInflationBasisPoints < oldAnnualMaxInflationBasisPoints || oldAnnualMaxInflationBasisPoints == 0, "TribeMinter: cannot increase max inflation");

        annualMaxInflationBasisPoints = newAnnualMaxInflationBasisPoints;

        emit AnnualMaxInflationUpdate(oldAnnualMaxInflationBasisPoints, newAnnualMaxInflationBasisPoints);
    }
}
