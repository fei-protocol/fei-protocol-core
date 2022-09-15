// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.15;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title Abstract contract for exchange a number of ERC20 tokens for specific base token, permissioned via Merkle root(s)
/// @notice This contract assumes that the users must sign a message to redeem tokens
/// @author kryptoklob
abstract contract MultiMerkleRedeemer {
    /** ---------- Events ----------------------- **/

    /// @notice Emitted when a user signs for the first time; should only be emitted once per user
    /// @param signer the person singing; msg.sender
    /// @param signature the signed message hash
    event Signed(address indexed signer, bytes signature);

    /// @notice Emitted when a user completes a claim on a cToken; should only be emitted once per user per cToken at most
    /// @param claimant the person claiming; msg.sender
    /// @param cToken the cToken being claimed on
    /// @param claimAmount the amount the user says he has claim to; verified by Merkle root
    event Claimed(address indexed claimant, address indexed cToken, uint256 claimAmount);

    /// @notice Emitted when a user exchanges an amount of cTokens for the base token; can happen any number of times per user & cToken
    /// @param recipient the user; msg.sender
    /// @param cToken the cToken being exchange for the baseToken
    /// @param cTokenAmount the amount of cTokens being exchanged
    /// @param baseTokenAmount the amount of baseTokens being received
    event Redeemed(address indexed recipient, address indexed cToken, uint256 cTokenAmount, uint256 baseTokenAmount);

    /** ---------- Storage / Configuration ------ **/

    /// @notice The address of the token that will be exchange for cTokens
    address public baseToken;

    /// @notice The merkle roots that permission users to claim cTokens; one root per cToken
    mapping(address => bytes32) public merkleRoots;

    /// @notice Exchange rate of the base asset per each cToken
    mapping(address => uint256) public cTokenExchangeRates;

    /// @notice Stores user signatures; one signature per user, can only be provided once
    mapping(address => bytes) public userSignatures;

    /// @notice The amount of cTokens a user has redeemed, indexed first by user address, then by cToken address
    /// @dev This value starts at zero and can only increase
    mapping(address => mapping(address => uint256)) public redemptions;

    /// @notice The amount of cTokens a user in their claim, total; indexed first by user address, then by cToken address
    /// @dev This value is set when a user proves their claim on a particular cToken, and cannot change once set
    mapping(address => mapping(address => uint256)) public claims;

    /// @notice The message to be signed by any users claiming on cTokens
    string public constant MESSAGE =
        "By signing and submitting this message to the Ethereum network, I represent that I have read and agree to the Fuse Hack Settlement Agreement and Release, as set forth here: https://fusehacksettlement.com/waiver.pdf";

    /// @notice The hash of the message to be signed by any users claiming on cTokens
    bytes32 public MESSAGE_HASH = ECDSA.toEthSignedMessageHash(bytes(MESSAGE));

    /** ---------- Public State-Changing Funcs ----------------- **/

    /// @notice Stores a user's signature (of the message stored in MESSAGE)
    /// @param _signature the user's signature, encoded as a bytes array
    /// @dev Signature must be encoded into a packed length of 65 bytes: bytes.concat(bytes32(r), bytes32(s), bytes1(v));
    function sign(bytes calldata _signature) external virtual;

    /// @notice Prove a claim on a particular cToken. Amount provided must match the amount in the merkle tree
    /// @param _cToken the cToken being claimed
    /// @param _amount the amount of the particular cToken to claim
    /// @param _merkleProof the merkle proof for the claim
    /// @dev This should set the user's claim for this cToken in the "claims" mapping
    function claim(
        address _cToken,
        uint256 _amount,
        bytes32[] calldata _merkleProof
    ) external virtual;

    /// @notice Plural version of claim. Amounts provided must match the amounts in the merkle trees
    /// @param _cTokens the cTokens being claimed
    /// @param _amounts the amounts of each particular cToken to claim
    /// @param _merkleProofs the merkle proofs for each claim
    /// @dev This should set the user's claim for *each* cToken in the "claims" mapping
    function multiClaim(
        address[] calldata _cTokens,
        uint256[] calldata _amounts,
        bytes32[][] calldata _merkleProofs
    ) external virtual;

    /// @notice Redeem an amount of the specified cToken.
    /// @dev Requires an approval of the specified amount of the specified cToken to this contract.
    /// Should increment the user's redeemed amount for this cToken in the "redeemed" mapping.
    function redeem(address cToken, uint256 cTokenAmount) external virtual;

    /// @notice Redeem an amount of each of the specified cTokens
    /// @dev Requires an approval of the specified amount of each of the specified cTokens to this contract
    /// Should increment the user's redeemed amount for each cToken in the "redeemed" mapping
    function multiRedeem(address[] calldata cTokens, uint256[] calldata cTokenAmounts) external virtual;

    /// @notice Combines sign and claim into a single function
    /// @param _signature the user's signature, encoded as a 65-length bytes: bytes.concat(bytes32(r), bytes32(s), bytes1(v));
    /// @param _cTokens the cTokens being claimed
    /// @param _amounts the amounts of each cToken to claim
    /// @param _merkleProofs the merkle proofs for each claim
    function signAndClaim(
        bytes calldata _signature,
        address[] calldata _cTokens,
        uint256[] calldata _amounts,
        bytes32[][] calldata _merkleProofs
    ) external virtual;

    /// @notice Combines sign, claim, and redeem into a single function
    /// @param _signature the user's signature, encoded as a 65-length bytes: bytes.concat(bytes32(r), bytes32(s), bytes1(v));
    /// @param _cTokens the cTokens being claimed
    /// @param _amountsToClaim the amounts of each cToken to claim; should match the merkle proofs
    /// @param _amountsToRedeem the amounts of each cToken to redeem; must be greater than 0 for each cToken provided
    /// @param _merkleProofs the merkle proofs for each claim
    function signAndClaimAndRedeem(
        bytes calldata _signature,
        address[] calldata _cTokens,
        uint256[] calldata _amountsToClaim,
        uint256[] calldata _amountsToRedeem,
        bytes32[][] calldata _merkleProofs
    ) external virtual;

    /** ---------- Public View/Pure Functions ---------- **/

    /// @notice Returns the amount of the base token that can be exchanged for the specified cToken
    function previewRedeem(address cToken, uint256 amount) external virtual returns (uint256 baseTokenAmount);
}
