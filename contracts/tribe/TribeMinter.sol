// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./ITribeMinter.sol";
import "../utils/RateLimited.sol";
import "../Constants.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

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
    /// @notice the max inflation in TRIBE circulating supply per year in basis points (1/10000)
    uint256 public override annualMaxInflationBasisPoints;

    /// @notice the tribe treasury address used to exclude from circulating supply
    address public override tribeTreasury;

    /// @notice the tribe rewards dripper address used to exclude from circulating supply
    address public override tribeRewardsDripper;

    /// @notice Tribe Reserve Stabilizer constructor
    /// @param _core Fei Core to reference
    /// @param _annualMaxInflationBasisPoints the max inflation in TRIBE circulating supply per year in basis points (1/10000)
    /// @param _owner the owner, capable of changing the tribe minter address.
    /// @param _tribeTreasury the tribe treasury address used to exclude from circulating supply
    /// @param _tribeRewardsDripper the tribe rewards dripper address used to exclude from circulating supply
    constructor(
        address _core,
        uint256 _annualMaxInflationBasisPoints,
        address _owner,
        address _tribeTreasury,
        address _tribeRewardsDripper
    ) RateLimited(0, 0, 0, false) CoreRef(_core) {
        _setAnnualMaxInflationBasisPoints(_annualMaxInflationBasisPoints);
        poke();

        // start with a full buffer
        _resetBuffer();

        transferOwnership(_owner);

        if (_tribeTreasury != address(0)) {
            tribeTreasury = _tribeTreasury;
            emit TribeTreasuryUpdate(address(0), _tribeTreasury);
        }

        if (_tribeRewardsDripper != address(0)) {
            tribeRewardsDripper = _tribeRewardsDripper;
            emit TribeRewardsDripperUpdate(address(0), _tribeRewardsDripper);
        }
    }

    /// @notice update the rate limit per second and buffer cap
    function poke() public override {
        uint256 newBufferCap = idealBufferCap();
        uint256 oldBufferCap = bufferCap;
        require(newBufferCap != oldBufferCap, "TribeMinter: No rate limit change needed");

        _setBufferCap(newBufferCap);
        _setRateLimitPerSecond(newBufferCap / Constants.ONE_YEAR);
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

    /// @notice sets the new TRIBE treasury address
    function setTribeTreasury(address newTribeTreasury) external override onlyGovernorOrAdmin {
        address oldTribeTreasury = tribeTreasury;
        tribeTreasury = newTribeTreasury;
        emit TribeTreasuryUpdate(oldTribeTreasury, newTribeTreasury);
    }

    /// @notice sets the new TRIBE treasury rewards dripper
    function setTribeRewardsDripper(address newTribeRewardsDripper) external override onlyGovernorOrAdmin {
        address oldTribeRewardsDripper = tribeRewardsDripper;
        tribeRewardsDripper = newTribeRewardsDripper;
        emit TribeTreasuryUpdate(oldTribeRewardsDripper, newTribeRewardsDripper);
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
    function setAnnualMaxInflationBasisPoints(uint256 newAnnualMaxInflationBasisPoints)
        external
        override
        onlyGovernorOrAdmin
    {
        _setAnnualMaxInflationBasisPoints(newAnnualMaxInflationBasisPoints);
    }

    /// @notice return the ideal buffer cap based on TRIBE circulating supply
    function idealBufferCap() public view override returns (uint256) {
        return (tribeCirculatingSupply() * annualMaxInflationBasisPoints) / Constants.BASIS_POINTS_GRANULARITY;
    }

    /// @notice return the TRIBE supply, subtracting locked TRIBE
    function tribeCirculatingSupply() public view override returns (uint256) {
        IERC20 _tribe = tribe();

        // Remove all locked TRIBE from total supply calculation
        uint256 lockedTribe = _tribe.balanceOf(address(this));

        if (tribeTreasury != address(0)) {
            lockedTribe += _tribe.balanceOf(tribeTreasury);
        }

        if (tribeRewardsDripper != address(0)) {
            lockedTribe += _tribe.balanceOf(tribeRewardsDripper);
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

    // Transfer held TRIBE first, then mint to cover remainder
    function _mint(address to, uint256 amount) internal {
        ITribe _tribe = ITribe(address(tribe()));

        uint256 _tribeBalance = _tribe.balanceOf(address(this));
        uint256 mintAmount = amount;

        // First transfer maximum amount of held TRIBE
        if (_tribeBalance != 0) {
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
        require(
            newAnnualMaxInflationBasisPoints < oldAnnualMaxInflationBasisPoints ||
                oldAnnualMaxInflationBasisPoints == 0,
            "TribeMinter: cannot increase max inflation"
        );

        annualMaxInflationBasisPoints = newAnnualMaxInflationBasisPoints;

        emit AnnualMaxInflationUpdate(oldAnnualMaxInflationBasisPoints, newAnnualMaxInflationBasisPoints);
    }
}
