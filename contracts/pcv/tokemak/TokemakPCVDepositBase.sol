// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../PCVDeposit.sol";
import "../../refs/CoreRef.sol";

interface ITokemakPool {
    function underlyer() external view returns (address);
    function balanceOf(address holder) external view returns(uint256);
    function requestWithdrawal(uint256 amount) external;
}

interface ITokemakRewards {
  struct Recipient {
      uint256 chainId;
      uint256 cycle;
      address wallet;
      uint256 amount;
  }

  function claim(
      Recipient calldata recipient,
      uint8 v,
      bytes32 r,
      bytes32 s // bytes calldata signature
  ) external;
}

/// @title base class for a Tokemak PCV Deposit
/// @author Fei Protocol
abstract contract TokemakPCVDepositBase is PCVDeposit {

    /// @notice event generated when rewards are claimed
    event ClaimRewards (
        address indexed _caller,
        address indexed _token,
        address indexed _to,
        uint256 _amount
    );

    /// @notice event generated when a withdrawal is requested
    event RequestWithdrawal (
        address indexed _caller,
        address indexed _to,
        uint256 _amount
    );

    address private constant TOKE_TOKEN_ADDRESS = address(0x2e9d63788249371f1DFC918a52f8d799F4a38C94);

    /// @notice the tokemak pool to deposit in
    address public immutable pool;

    /// @notice the tokemak rewards contract to claim TOKE incentives
    address public immutable rewards;

    /// @notice the token stored in the Tokemak pool
    IERC20 public immutable token;

    /// @notice Tokemak PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _pool Tokemak pool to deposit in
    /// @param _rewards Tokemak rewards contract to claim TOKE incentives
    constructor(
        address _core,
        address _pool,
        address _rewards
    ) CoreRef(_core) {
        pool = _pool;
        rewards = _rewards;
        token = IERC20(ITokemakPool(_pool).underlyer());
    }

    /// @notice returns total balance of PCV in the Deposit excluding the FEI
    function balance() public view override returns (uint256) {
        return ITokemakPool(pool).balanceOf(address(this));
    }

    /// @notice display the related token of the balance reported
    function balanceReportedIn() public view override returns (address) {
        return address(token);
    }

    /// @notice request to withdraw a given amount of tokens to Tokemak. These
    /// tokens will be available for withdraw in the next cycles.
    /// This function can be called by the contract admin, e.g. the OA multisig,
    /// in anticipation of the execution of a DAO proposal that will call withdraw().
    /// @dev note that withdraw() calls will revert if this function has not been
    /// called before.
    /// @param amountUnderlying of tokens to withdraw in a subsequent withdraw() call.
    function requestWithdrawal(uint256 amountUnderlying)
        external
        onlyGovernorOrAdmin
        whenNotPaused
    {
        ITokemakPool(pool).requestWithdrawal(amountUnderlying);

        emit RequestWithdrawal(msg.sender, address(this), amountUnderlying);
    }

    /// @notice claim TOKE rewards associated to this PCV Deposit. The TOKE tokens
    /// will be sent to the PCVDeposit, and can then be moved with withdrawERC20.
    /// The Tokemak rewards are distributed as follow :
    /// "At the end of each cycle we publish a signed message for each LP out to
    //    a "folder" on IPFS. This message says how much TOKE the account is entitled
    //    to as their reward (and this is cumulative not just for a single cycle).
    //    That folder hash is published out to the website which will call out to
    //    an IPFS gateway, /ipfs/{folderHash}/{account}.json, and get the payload
    //    they need to submit to the contract. Tx is executed with that payload and
    //    the account is sent their TOKE."
    /// For an example of IPFS json file, see :
    //  https://ipfs.tokemaklabs.xyz/ipfs/Qmf5Vuy7x5t3rMCa6u57hF8AE89KLNkjdxSKjL8USALwYo/0x4eff3562075c5d2d9cb608139ec2fe86907005fa.json
    function claimRewards(
        uint256 cycle,
        uint256 amount,
        uint8 v,
        bytes32 r,
        bytes32 s // bytes calldata signature
    ) external whenNotPaused {
        ITokemakRewards.Recipient memory recipient = ITokemakRewards.Recipient(
            1, // chainId
            cycle,
            address(this), // wallet
            amount
        );

        ITokemakRewards(rewards).claim(recipient, v, r, s);

        emit ClaimRewards(
          msg.sender,
          address(TOKE_TOKEN_ADDRESS),
          address(this),
          amount
        );
    }
}
