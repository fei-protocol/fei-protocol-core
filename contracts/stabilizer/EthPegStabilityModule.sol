pragma solidity ^0.8.4;

import "./PegStabilityModule.sol";

contract EthPegStabilityModule is PegStabilityModule {
    using SafeERC20 for IERC20;

    constructor(
        address _coreAddress,
        address _oracleAddress,
        address _backupOracle,
        uint256 _mintFeeBasisPoints,
        uint256 _redeemFeeBasisPoints,
        uint256 _reservesThreshold,
        uint256 _feiLimitPerSecond,
        uint256 _mintingBufferCap,
        int256 _decimalsNormalizer,
        bool _doInvert,
        IPCVDeposit _target
    ) PegStabilityModule(
        _coreAddress,
        _oracleAddress,
        _backupOracle,
        _mintFeeBasisPoints,
        _redeemFeeBasisPoints,
        _reservesThreshold,
        _feiLimitPerSecond,
        _mintingBufferCap,
        _decimalsNormalizer,
        _doInvert,
        IERC20(address(0)), /// since the token for this PSM is eth, the address is 0
        _target
    ) {}

    receive() external payable {}

    /// @notice function to mint Fei by sending eth
    function _checkMsgValue(uint256 amountIn) internal override {
        require(msg.value == amountIn, "EthPegStabilityModule: Sent value does not equal input");
    }

    /// @notice override the _transferFrom method inside of the PSM as eth has already been sent to contract
    function _transferFrom(address from, address to, uint256 amount) internal override {}

    /// @notice do nothing as prices will not be validated
    function _validatePriceRange(Decimal.D256 memory price) internal view override {}

    /// @notice override transfer of PSM class
    function _transfer(address to, uint256 amount) internal override {
        Address.sendValue(payable(to), amount);
    }

    /// @notice function from PCVDeposit that must be overriden
    function balance() public view override returns(uint256) {
        return address(this).balance;
    }
}
