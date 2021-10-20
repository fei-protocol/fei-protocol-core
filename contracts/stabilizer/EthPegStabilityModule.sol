pragma solidity ^0.8.4;

import "./PegStabilityModule.sol";

contract EthPegStabilityModule is PegStabilityModule {
    using SafeERC20 for IERC20;

    constructor(
        address _coreAddress,
        address _oracleAddress,
        uint256 _mintFeeBasisPoints,
        uint256 _redeemFeeBasisPoints,
        uint256 _reservesThreshold,
        uint256 _feiLimitPerSecond,
        uint256 _mintingBufferCap,
        int256 _decimalsNormalizer,
        bool _doInvert,
        IPCVDeposit _target,
        IFei _FEI
    ) PegStabilityModule(
        _coreAddress,
        _oracleAddress,
        _mintFeeBasisPoints,
        _redeemFeeBasisPoints,
        _reservesThreshold,
        _feiLimitPerSecond,
        _mintingBufferCap,
        _decimalsNormalizer,
        _doInvert,
        IERC20(address(0)), /// since the token for this PSM is eth, the address is 0
        _target,
        _FEI
    ) {}

    /// @notice function to redeem FEI for an underlying asset
    function redeem(address to, uint256 amountFeiIn) external override nonReentrant returns (uint256 amountEthOut) {
        updateOracle();

        amountEthOut = getRedeemAmountOut(amountFeiIn);
        FEI.transferFrom(msg.sender, address(this), amountFeiIn);
        FEI.burn(amountFeiIn);

        (bool success,) = to.call{value: amountEthOut, gas: 100000}("");
        require(success, "EthPegStabillityModule: error sending eth");

        emit Redeem(to, amountFeiIn);
    }

    /// @notice function to mint Fei by sending eth
    function mint(address to, uint256 amountIn) external payable override nonReentrant returns (uint256 amountFeiOut) {
        require(msg.value == amountIn, "EthPegStabilityModule: Sent value does not equal input");

        updateOracle();

        amountFeiOut = getMintAmountOut(amountIn);
        token.safeTransferFrom(msg.sender, address(this), amountIn);

        _mintFei(msg.sender, amountFeiOut);

        emit Mint(to, amountIn);        
    }

    /// @notice withdraw assets from ETH PSM to an external address
    function withdraw(address to, uint256 amount) external override onlyPCVController {
        (bool success,) = to.call{value: amount, gas: 100000}("");
        require(success, "EthPegStabillityModule: error sending eth");
    }

    /// @notice TODO figure out how and if this contract should handle deposits
    function deposit() external override {
        revert("no-op");
    }

    /// @notice returns eth balance of this contract
    function tokenBalance() public override view returns (uint256) {
        return address(this).balance;
    }

    /// @notice function from PCVDeposit that must be overriden
    function balance() public view override returns(uint256) {
        return tokenBalance();
    }

    /// @notice send any excess reserves to the balancer investment pool
    function allocateSurplus() external override  whenNotPaused {
        require(reservesSurplus() > 0, "EthPegStabilityModule: No surplus to allocate");
        /// @TODO figure out what to do here
    }
}
