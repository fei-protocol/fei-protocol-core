# Protocol Security

Fei Protocol needs to protect against malicious actors and attack that come in multiple categories. We attempt to firewall assets from each other as best as possible, so that exploits in one area don't affect others. We also use a variety of features to pre-emptively and retractively secure assets, such as the PCV Guardian and PCV Sentinel.

## PCV Guardian

[The PCV Guardian](https://github.com/fei-protocol/fei-protocol-core/blob/develop/contracts/pcv/PCVGuardian.sol), [deployed here](https://etherscan.io/address/0x2D1b1b509B6432A73e3d798572f0648f6453a5D9#code) has the role of PCV Controller. It is allowed to move assets from any pcv deposit to any of the "safe" addresses it knows about; governance (specifically the governor role) can add additional safe addresses, and the guardian role can remove them.

The guardian role is required to use the pcv guardian, and withdraw funds from any pcv deposit to any "safe" address.

## PCV Sentinel

[The PCV Sentinel](https://github.com/fei-protocol/fei-protocol-core/blob/develop/contracts/sentinel/PCVSentinel.sol), [deployed here](https://etherscan.io/address/0xC297705Acf50134d256187c754B92FA37826C019#code) is a smart contract with the "guardian" role. On its own, it is useless. The "guardian" role can be used to add "guards" to the PCV Sentinel. Each guard is a smart contract that conforms to the [IGuard](https://github.com/fei-protocol/fei-protocol-core/blob/develop/contracts/sentinel/IGuard.sol) interface.

Guards know how to check for issues, and what calldata to provide the Sentinel to resolve the issue (or protect the asset in question, or pause functionality, etc). Guards are useless on their own as they have no role in the Fei/Tribe system.

The PCV Sentinel acts as automated extennsion of the Multisig Guardian.

Currently there are no guards. Planned guards include:
- fuse oracle liquidity monitoring
- psm liquidity monitoring (unpause eth psm when others are low)
- pcv deposit monitoring (pull assets to safety if underlying deposit compromised)