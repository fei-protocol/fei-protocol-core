// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {PCVDeposit} from "../pcv/PCVDeposit.sol";
import {CTokenFuse, CEtherFuse} from "../external/fuse/CToken.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {TribeRoles} from "../core/TribeRoles.sol";

/// @title base class for a Compound PCV Deposit
/// @author Fei Protocol
contract FuseFixer is PCVDeposit {
    address constant DEBTOR = address(0x32075bAd9050d4767018084F0Cb87b3182D36C45);

    /* Addresses for reference only.
    address constant FEI = address(0x956F47F50A910163D8BF957Cf5846D573E7f87CA);
    address constant FRAX = address(0x853d955aCEf822Db058eb8505911ED77F175b99e);
    address constant RAI = address(0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919);
    address constant DAI = address(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    address constant USDC = address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
    address constant LUSD = address(0x5f98805A4E8be255a32880FDeC7F6728C6568bA0);
    address constant wstETH = address(0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0);
    address constant USTw = address(0xa693B19d2931d498c5B318dF961919BB4aee87a5);
    address constant WETH = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    address constant USDT = address(0xdAC17F958D2ee523a2206206994597C13D831ec7);
    */

    address[] CTOKENS = [
        address(0xd8553552f8868C1Ef160eEdf031cF0BCf9686945), // Pool 8: FEI
        address(0xbB025D470162CC5eA24daF7d4566064EE7f5F111), // Pool 8: ETH
        address(0x7e9cE3CAa9910cc048590801e64174957Ed41d43), // Pool 8: DAI
        address(0x7259eE19D6B5e755e7c65cECfd2466C09E251185), // Pool 8: wstETH
        address(0x647A36d421183a0a9Fa62717a64B664a24E469C7), // Pool 8: LUSD
        address(0xFA1057d02A0C1a4885851e3F4fD496Ee7D38F56e), // Pool 18: ETH
        address(0x8E4E0257A4759559B4B1AC087fe8d80c63f20D19), // Pool 18: DAI
        address(0x6f95d4d251053483f41c8718C30F4F3C404A8cf2), // Pool 18: USDC
        address(0x3E5C122Ffa75A9Fe16ec0c69F7E9149203EA1A5d), // Pool 18: FRAX
        address(0x17b1A2E012cC4C31f83B90FF11d3942857664efc), // Pool 18: FEI
        address(0x51fF03410a0dA915082Af444274C381bD1b4cDB1), // Pool 18: RAI
        address(0xB7FE5f277058b3f9eABf6e0655991f10924BFA54), // Pool 18: USTw
        address(0x9de558FCE4F289b305E38ABe2169b75C626c114e), // Pool 27: FRAX
        address(0xda396c927e3e6BEf77A98f372CE431b49EdEc43D), // Pool 27: FEI
        address(0xF148cDEc066b94410d403aC5fe1bb17EC75c5851), // Pool 27: ETH
        address(0x0C402F06C11c6e6A6616C98868A855448d4CfE65), // Pool 27: USTw
        address(0x26267e41CeCa7C8E0f143554Af707336f27Fa051), // Pool 127: ETH
        address(0xEbE0d1cb6A0b8569929e062d67bfbC07608f0A47), // Pool 127: USDC
        address(0x4B68ef5AB32261082DF1A6C9C6a89FFD5eF168B1), // Pool 127: DAI
        address(0xe097783483D1b7527152eF8B150B99B9B2700c8d), // Pool 127: USDT
        address(0x0F0d710911FB37038b3AD88FC43DDAd4Edbe16A5), // Pool 127: USTw
        address(0x8922C1147E141C055fdDfc0ED5a119f3378c8ef8), // Pool 127: FRAX
        address(0x7DBC3aF9251756561Ce755fcC11c754184Af71F7), // Pool 144: ETH
        address(0x3a2804ec0Ff521374aF654D8D0daA1d1aE1ee900), // Pool 144: FEI
        address(0xA54c548d11792b3d26aD74F5f899e12CDfD64Fd6), // Pool 144: FRAX
        address(0xA6C25548dF506d84Afd237225B5B34F2Feb1aa07), // Pool 144: DAI
        address(0xfbD8Aaf46Ab3C2732FA930e5B343cd67cEA5054C), // Pool 146: ETH
        address(0x49dA42a1EcA4AC6cA0C6943d9E5dc64e4641e0E3), // Pool 146: wstETH
        address(0xe14c2e156A3f310d41240Ce8760eB3cb8a0dDBE3), // Pool 156: USTw
        address(0x001E407f497e024B9fb1CB93ef841F43D645CA4F), // Pool 156: FEI
        address(0x5CaDc2a04921213DE60B237688776e0F1A7155E6), // Pool 156: FRAX
        address(0x9CD060A4855290bf0c5aeD266aBe119FF3b01966), // Pool 156: DAI
        address(0x74897C0061ADeec84D292e8900c7BDD00b3388e4), // Pool 156: LUSD
        address(0x88d3557eB6280CC084cA36e425d6BC52d0A04429), // Pool 156: USDC
        address(0xe92a3db67e4b6AC86114149F522644b34264f858) // Pool 156: ETH
    ];

    constructor(address core) CoreRef(core) {}

    /// @dev Repay the underlying asset on all ctokens up to the maximum provide
    /// @notice reverts if the total bad debt is beyond the provided maximum
    /// @param underlying the asset to repay in
    /// @param maximum the maximum amount of underlying asset to repay
    function repay(address underlying, uint256 maximum) public onlyGovernor {
        require(getTotalDebt(underlying) < maximum, "Total debt is greater than maximum");

        if (underlying == address(0)) {
            _repayETH(underlying);
        } else {
            _repayERC20(underlying);
        }
    }

    /* Helper Functions */

    function _repayETH(address underlying) internal {
        for (uint256 i = 0; i < CTOKENS.length; i++) {
            CEtherFuse token = CEtherFuse(CTOKENS[i]);
            if (token.underlying() == underlying) {
                uint256 debtAmount = token.borrowBalanceCurrent(DEBTOR);
                token.repayBorrowBehalf{value: debtAmount}(DEBTOR);
            }
        }
    }

    function _repayERC20(address underlying) internal {
        for (uint256 i = 0; i < CTOKENS.length; i++) {
            CTokenFuse token = CTokenFuse(CTOKENS[i]);
            if (token.underlying() == underlying) {
                uint256 debtAmount = token.borrowBalanceCurrent(DEBTOR);
                token.repayBorrowBehalf(DEBTOR, debtAmount);
            }
        }
    }

    // Must be non-view since this updates a state var
    function getTotalDebt(address underlying) internal returns (uint256 debt) {
        for (uint256 i = 0; i < CTOKENS.length; i++) {
            CTokenFuse token = CTokenFuse(CTOKENS[i]);
            if (token.underlying() == underlying) {
                debt += CTokenFuse(CTOKENS[i]).borrowBalanceCurrent(DEBTOR);
            }
        }
    }

    /* Required Functions from PCVDeposit */

    function deposit() external override {
        // no-op
    }

    function withdraw(address to, uint256 amount) external {
        // no-op, use withdrawERC20 or withdrawETH
    }

    function balance() public view virtual override returns (uint256) {
        return 0;
    }

    function balanceReportedIn() public view virtual override returns (address) {
        return address(0);
    }
}
