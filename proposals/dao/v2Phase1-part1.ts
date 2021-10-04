/*

V2 Phase 1 Upgrade

Part 1 - Deploys the PCV deposits we have to swap out, the new ETH bonding curve, and the ratio PCV controller.
         Grants minter roles to the pcv deposits & the bonding curve, and pcv controller role to the ratio pcv controller.
         Sets bonding curve minting cap maximum for eth bonding curve, and updates the dpi bonding curve allocation. Finally,
         moves pcv from the old eth & dpi uni pcv deposits into the new ones.

----- PART 1 -----

DEPLOY ACTIONS:
1. ETH Uni PCV Deposit
2. DPI Uni PCV Deposit
3. ETH Bonding Curve
4. Ratio PCV Controller

DAO ACTIONS:
1. Grant Minter role to new ETH BondingCurve
2. Grant Minter role to new ETH Uni PCV Deposit
3. Grant Minter role to new DPI Uni PCV Deposit
4. Grant PCV Controller role to new RatioPCVController
5. Set ETH Bonding Curve Minting Cap Max
6. Update DPI Bonding Curve allocation
7. Move PCV from old ETH Uni PCV Deposit to new
8. Move PCV from old DPI Uni PCV Deposit to new

*/