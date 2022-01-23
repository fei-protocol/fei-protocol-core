pragma solidity ^0.8.4;

import "./ERC20PCVDepositWrapper.sol";
import "../../oracle/collateralization/ICollateralizationOracle.sol";

contract ERC20LensFactory {
    address constant timelock = 0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c;

    ICollateralizationOracle constant collateralizationOracle = ICollateralizationOracle(0xFF6f59333cfD8f4Ebc14aD0a0E181a83e655d257);

    function addLens(IERC20 token) external {
        ERC20PCVDepositWrapper wrapper = new ERC20PCVDepositWrapper{salt: keccak256(abi.encodePacked(address(token)))}(timelock, token, false);

        require(collateralizationOracle.tokenToOracle(address(token)) != address(0), "Token not in oracle");
        require(collateralizationOracle.depositToToken(address(wrapper)) == address(0), "Deposit already in oracle");

        collateralizationOracle.addDeposit(address(wrapper));
    }
}