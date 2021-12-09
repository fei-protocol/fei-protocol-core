//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./MergerBase.sol";
import "../oracle/collateralization/ICollateralizationOracle.sol";
import "../token/IFei.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

/// @title Contract to exchange TRIBE with FEI post-merger
/// @author elee
contract TRIBERagequit is MergerBase {
    using SafeCast for *;
    using SafeERC20 for IERC20;

    address public immutable coreAddress = 0x8d5ed43dca8c2f7dfb20cf7b53cc7e593635d7b9;

    uint256 public intrinsicValueExchangeRateBase;

    int256 public minProtocolEquity = type(int256).max;

    address public immutable rewardsDripper = 0x3Fe0EAD3500e767F0F8bC2d3B5AF7755B1b21A6a;
    IFei public constant fei = IFei(0x956F47F50A910163D8BF957Cf5846D573E7f87CA);

    uint256 public immutable rageQuitEnd;

    mapping(address => uint256) public claimed;

    event Exchange(address indexed from, uint256 amountIn, uint256 amountOut);

    bytes32 public merkleRoot;

    constructor(
        bytes32 root, 
        uint256 _rageQuitEnd,
        address tribeRariDAO
    ) MergerBase(tribeRariDAO) {
        merkleRoot = root;

        rageQuitEnd = _rageQuitEnd;
    }

    /// @notice ragequit held TRIBE with FEI
    /// @dev not gonna make it
    /// @param amount the amount to redeem in TRIBE
    /// @param key the amount of TRIBE allocated to the caller in the merkle drop
    /// @param merkleProof a proof proving that the caller may redeem up to `key` amount of tribe
    function ngmi(
        uint256 amount,
        uint256 key,
        bytes32[] memory merkleProof
    ) public {
        require(isEnabled() == true, "Proposals are not both passed");
        require(block.timestamp < rageQuitEnd, "outside ragequit window");
        require(minProtocolEquity > 0, "no equity");
        address thisSender = msg.sender;
        require(
            verifyClaim(thisSender, key, merkleProof) == true,
            "invalid proof"
        );
        require(
            (claimed[thisSender] + amount) <= key,
            "already ragequit all you tokens"
        );
        claimed[thisSender] = claimed[thisSender] + amount;
        uint256 tribeTokenTakenTotal = amount;
        uint256 token1GivenTotal = amount * intrinsicValueExchangeRateBase / scalar;
        tribe.safeTransferFrom(thisSender, coreAddress, tribeTokenTakenTotal);
        fei.mint(thisSender, token1GivenTotal);
        emit Exchange(thisSender, tribeTokenTakenTotal, token1GivenTotal);
    }

    function getCirculatingTribe() public view returns (uint256) {
        return tribe.totalSupply() - tribe.balanceOf(coreAddress) - tribe.balanceOf(rewardsDripper);
    }
    
    /// @notice recalculate the exchange amount using the existing minProtocolEquity
    /// @return the new intrinsicValueExchangeRateBase
    function exchangeRate() public view returns (uint256) {
        uint256 effectiveEquity = minProtocolEquity > 0 ? minProtocolEquity.toUint256() : 0;
        return (scalar * uint256(effectiveEquity)) / getCirculatingTribe();
    }

    /// @notice query for the current minProtocolEquity. Update the value and call recalculate() if new low
    /// @return the new minProtocolEquity (unused)
    function requery() public returns (int256) {
        require(block.timestamp > lowWaterMarkStart && block.timestamp < lowWaterMarkEnd, "outside watermark window");
        (
            uint256 _pcvValue, //  pcv value
            uint256 _userFei, // user fei
            int256 newProtocolEquity,
            bool validity
        ) = oracle.pcvStats();
        if (minProtocolEquity > newProtocolEquity) {
            minProtocolEquity = newProtocolEquity;
            intrinsicValueExchangeRateBase = exchangeRate();
            return minProtocolEquity;
        }
        return minProtocolEquity;
    }

    /// @notice validate the proof of a merkle drop claim
    /// @param claimer the address attempting to claim
    /// @param key the amount of scaled TRIBE allocated the claimer claims that they have credit over
    /// @param merkleProof a proof proving that claimer may redeem up to `key` amount of tribe
    /// @return boolean true if the proof is valid, false if the proof is invalid
    function verifyClaim(
        address claimer,
        uint256 key,
        bytes32[] memory merkleProof
    ) private view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(claimer, key));
        return MerkleProof.verify(merkleProof, merkleRoot, leaf);
    }
}