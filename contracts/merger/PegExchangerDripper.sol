pragma solidity ^0.8.4;

import "./PegExchanger.sol";

contract PegExchangerDripper {

    IERC20 public constant TRIBE = IERC20(0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B);
    address public constant CORE = 0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9;
    address public constant PEG_EXCHANGER = 0xc09BB5ECf865e6f69Fe62A43c27f036A426909f7;
    
    uint256 public constant THRESHOLD = 5_000_000e18; // 5M TRIBE cutoff for dripping
    uint256 public constant DRIP_AMOUNT = 20_000_000e18; // drip 20M TRIBE
 
    function drip() external {
        require(!PegExchanger(PEG_EXCHANGER).isExpired(), "expired"); // ensure pegExchanger live
        require(TRIBE.balanceOf(PEG_EXCHANGER) <= THRESHOLD, "over threshold"); // ensure under drip threshold
        TRIBE.transfer(PEG_EXCHANGER, DRIP_AMOUNT);
    }

    function isEligible() external view returns (bool) {
        return !PegExchanger(PEG_EXCHANGER).isExpired() && TRIBE.balanceOf(PEG_EXCHANGER) <= THRESHOLD;
    }

    function recover() external {
        require(PegExchanger(PEG_EXCHANGER).isExpired(), "still live"); // ensure pegExchanger is expired
        TRIBE.transfer(CORE, TRIBE.balanceOf(address(this))); // transfer everything back to treasury
    }
}