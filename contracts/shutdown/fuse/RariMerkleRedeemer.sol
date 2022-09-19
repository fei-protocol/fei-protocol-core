// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.15;

import "../../refs/CoreRef.sol";
import "./MultiMerkleRedeemer.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title Contract for exchanging cTokens for a specific base token, permissioned via Merkle Roots
/// @notice This implementation is specific to the Rari Redemption as described in TIP-121
/// @dev See MultiMerkleRedeemer natspec for most public functions
/// @author kryptoklob
contract RariMerkleRedeemer is MultiMerkleRedeemer, ReentrancyGuard {
    using SafeERC20 for IERC20;

    modifier hasSigned() {
        require(keccak256(userSignatures[msg.sender]) != keccak256(userSignatures[address(0)]), "User has not signed.");
        _;
    }

    modifier hasNotSigned() {
        require(
            keccak256(userSignatures[msg.sender]) == keccak256(userSignatures[address(0)]),
            "User has already signed"
        );
        _;
    }

    /// @param token The token that will be received when exchanging cTokens
    /// @param cTokens The supported cTokens; must be exactly 20 tokens
    /// @param rates The exchange rate for each cToken; must be exactly 20 rates
    /// @param roots The merkle root for each cToken; must be exactly 20 roots
    constructor(
        address token,
        address[] memory cTokens,
        uint256[] memory rates,
        bytes32[] memory roots
    ) {
        _configureExchangeRates(cTokens, rates);
        _configureMerkleRoots(cTokens, roots);
        _configureBaseToken(token);
    }

    /** ---------- Public State-Changing Funcs ----------------- **/

    function sign(bytes calldata signature) external override hasNotSigned nonReentrant {
        _sign(signature);
    }

    function claim(
        address _cToken,
        uint256 _amount,
        bytes32[] calldata _merkleProof
    ) external override hasSigned nonReentrant {
        _claim(_cToken, _amount, _merkleProof);
    }

    function multiClaim(
        address[] calldata _cTokens,
        uint256[] calldata _amounts,
        bytes32[][] calldata _merkleProofs
    ) external override hasSigned nonReentrant {
        _multiClaim(_cTokens, _amounts, _merkleProofs);
    }

    function redeem(address cToken, uint256 cTokenAmount) external override hasSigned nonReentrant {
        _redeem(cToken, cTokenAmount);
    }

    function multiRedeem(address[] calldata cTokens, uint256[] calldata cTokenAmounts)
        external
        override
        hasSigned
        nonReentrant
    {
        _multiRedeem(cTokens, cTokenAmounts);
    }

    function previewRedeem(address cToken, uint256 amount) public view override returns (uint256 baseTokenAmount) {
        // Each ctoken exchange rate is stored as how much you should get for 1e18 of the particular cToken
        // Thus, we divide by 1e18 when returning the amount that a person should get when they provide
        // the amount of cTokens they're turning into the contract
        return (cTokenExchangeRates[cToken] * amount) / 1e18;
    }

    function signAndClaim(
        bytes calldata signature,
        address[] calldata cTokens,
        uint256[] calldata amounts,
        bytes32[][] calldata merkleProofs
    ) external override hasNotSigned nonReentrant {
        // both sign and claim/multiclaim will revert on invalid signatures/proofs
        _sign(signature);
        _multiClaim(cTokens, amounts, merkleProofs);
    }

    function claimAndRedeem(
        address[] calldata cTokens,
        uint256[] calldata amounts,
        bytes32[][] calldata merkleProofs
    ) external hasSigned nonReentrant {
        _multiClaim(cTokens, amounts, merkleProofs);
        _multiRedeem(cTokens, amounts);
    }

    function signAndClaimAndRedeem(
        bytes calldata signature,
        address[] calldata cTokens,
        uint256[] calldata amountsToClaim,
        uint256[] calldata amountsToRedeem,
        bytes32[][] calldata merkleProofs
    ) external override hasNotSigned nonReentrant {
        _sign(signature);
        _multiClaim(cTokens, amountsToClaim, merkleProofs);
        _multiRedeem(cTokens, amountsToRedeem);
    }

    /** ---------- Internal Funcs --------------- **/

    // The exchange rates provided should represent how much of the base token will be given
    // in exchange for 1e18 cTokens. This increases precision.
    function _configureExchangeRates(address[] memory _cTokens, uint256[] memory _exchangeRates) internal {
        require(_cTokens.length == 20, "Must provide exactly 20 exchange rates.");
        require(_cTokens.length == _exchangeRates.length, "Exchange rates must be provided for each cToken");

        for (uint256 i = 0; i < _cTokens.length; i++) {
            require(
                _exchangeRates[i] > 1e10,
                "Exchange rate must be greater than 1e10. Did you forget to multiply by 1e18?"
            );
            cTokenExchangeRates[_cTokens[i]] = _exchangeRates[i];
        }
    }

    function _configureMerkleRoots(address[] memory _cTokens, bytes32[] memory _roots) internal {
        require(_cTokens.length == 20, "Must provide exactly 20 merkle roots");
        require(_cTokens.length == _roots.length, "Merkle roots must be provided for each cToken");

        for (uint256 i = 0; i < _cTokens.length; i++) {
            require(_roots[i] != bytes32(0), "Merkle root must be non-zero");
            merkleRoots[_cTokens[i]] = _roots[i];
        }
    }

    function _configureBaseToken(address _baseToken) internal {
        require(_baseToken != address(0), "Base token must be non-zero");
        baseToken = _baseToken;
    }

    // User provides signature, which is checked against their address and the string constant "message"
    function _sign(bytes calldata _signature) internal virtual {
        // check: to ensure the signature is a valid signature for the constant message string from msg.sender
        require(ECDSA.recover(MESSAGE_HASH, _signature) == msg.sender, "Signature not valid");

        // effect: update user's stored signature
        userSignatures[msg.sender] = _signature;

        emit Signed(msg.sender, _signature);
    }

    // User provides the the cToken & the amount they should get, and it is verified against the merkle root for that cToken
    /// Should set the user's claim amount int he claims mapping for the provided cToken
    function _claim(
        address _cToken,
        uint256 _amount,
        bytes32[] calldata _merkleProof
    ) internal virtual {
        // check: verify that claimableAmount is zero, revert if not
        require(claims[msg.sender][_cToken] == 0, "User has already claimed for this cToken.");

        // check: verify cToken and amount and msg.sender against merkle root
        bytes32 leafHash = keccak256(abi.encodePacked(msg.sender, _amount));
        require(MerkleProof.verifyCalldata(_merkleProof, merkleRoots[_cToken], leafHash), "Merkle proof not valid.");

        // effect: update claimableAmount for the user
        claims[msg.sender][_cToken] = _amount;

        emit Claimed(msg.sender, _cToken, _amount);
    }

    // User provides the cTokens & the amounts they should get, and it is verified against the merkle root for that cToken (for each cToken provided)
    // Should set the user's claim amount in the claims mapping for each cToken provided
    function _multiClaim(
        address[] calldata _cTokens,
        uint256[] calldata _amounts,
        bytes32[][] calldata _merkleProofs
    ) internal virtual {
        require(_cTokens.length == _amounts.length, "Number of cTokens and amounts must match");
        require(_cTokens.length == _merkleProofs.length, "Number of cTokens and merkle proofs must match");

        for (uint256 i = 0; i < _cTokens.length; i++) {
            _claim(_cTokens[i], _amounts[i], _merkleProofs[i]);
        }

        // no events needed here, they happen in _claim
    }

    // Transfers in a particular amount of the user's cToken, and increments their redeemed amount in the redemption mapping
    function _redeem(address cToken, uint256 cTokenAmount) internal virtual {
        // check: amount must be greater than 0
        require(cTokenAmount != 0, "Invalid amount");

        // check: verify that the user's claimedAmount+amount of this cToken doesn't exceed claimableAmount for this cToken
        require(
            redemptions[msg.sender][cToken] + cTokenAmount <= claims[msg.sender][cToken],
            "Amount exceeds available remaining claim."
        );

        // effect: increment the user's claimedAmount
        redemptions[msg.sender][cToken] += cTokenAmount;

        uint256 baseTokenAmountReceived = previewRedeem(cToken, cTokenAmount);

        // interaction: safeTransferFrom the user "amount" of "cToken" to this contract
        IERC20(cToken).safeTransferFrom(msg.sender, address(this), cTokenAmount);
        IERC20(baseToken).safeTransfer(msg.sender, baseTokenAmountReceived);

        emit Redeemed(msg.sender, cToken, cTokenAmount, baseTokenAmountReceived);
    }

    // Plural form of _redeem
    // Doesn't actually call _redeem so that we can separate out the interactions into their own section
    function _multiRedeem(address[] calldata cTokens, uint256[] calldata cTokenAmounts) internal virtual {
        // check : cTokens.length must equal amounts.length
        require(cTokens.length == cTokenAmounts.length, "Length of cTokens and amounts must match.");

        for (uint256 i = 0; i < cTokens.length; i++) {
            // check: cToken cannot be the zero address
            require(cTokens[i] != address(0), "Invalid cToken address");

            // check: amount must be greater than 0
            require(cTokenAmounts[i] != 0, "Invalid amount");

            // check: amount is less than or equal to the user's claimableAmount-claimedAmount for this cToken
            require(
                redemptions[msg.sender][cTokens[i]] + cTokenAmounts[i] <= claims[msg.sender][cTokens[i]],
                "Amount exceeds available remaining claim."
            );

            // effect: increment the user's claimedAmount
            redemptions[msg.sender][cTokens[i]] += cTokenAmounts[i];
        }

        // We give the interactions (the safeTransferFroms) their own for loop, juuuuust to be safe
        for (uint256 i = 0; i < cTokens.length; i++) {
            uint256 baseTokenAmountReceived = previewRedeem(cTokens[i], cTokenAmounts[i]);
            IERC20(cTokens[i]).safeTransferFrom(msg.sender, address(this), cTokenAmounts[i]);
            IERC20(baseToken).safeTransfer(msg.sender, baseTokenAmountReceived);
            emit Redeemed(msg.sender, cTokens[i], cTokenAmounts[i], baseTokenAmountReceived);
        }
    }
}
