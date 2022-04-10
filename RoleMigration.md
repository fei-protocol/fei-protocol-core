## Role migration
Aim: Allow the TribalCouncil to operate autonomously, by being able to grant any non-major role.

To do this, it needs to be the admin of all roles it seeks to grant.

## TribeRoles to grant
The following non-major roles have been created and the current admin is the GOVERNOR. Their admin is being transferred to ROLE_ADMIN:
- ORACLE_ADMIN: 0xc307c44629779eb8fc0b85f224c3d22f5876a6c84de0ee42d481eb7814f0d3a8
- TRIBAL_CHIEF_ADMIN: 0x23970cab3799b6876df4319661e6c03cc45bd59628799d92e988dd8cbdc90e31
- PCV_GUARDIAN_ADMIN: 0xdf6ce05acd28d71e96472375ef55c4a692f167af3ccda9500570f7373c1ba22c
- METAGOVERNANCE_VOTE_ADMIN: 0xb02f76effb323167cad756bb4f3edbfb9d9291f9bfcdc72c9ceea005562f32eb
- METAGOVERNANCE_TOKEN_STAKING: 0xa100760f521bbb2848bef0b72ea29301f6a6b0605d004243f0eea2b1c359f7c7
- METAGOVERNANCE_GAUGE_ADMIN: 0x3bee38c33241595abfefa470fd75bfa1cc9cb01eff02cf6732fd2baea4ea4241
- LBP_SWAP_ROLE: 0x471cfe1a44bf1b786db7d7104d51e6728ed7b90a35394ad7cc424adf8ed16816
- VOTIUM_ROLE: 0x2d46c62aa6fbc9b550f22e00476aebb90f4ea69cd492a68db4d444217763330d


## TODOs:
1. Make all existing non-major roles have the ROLE_ADMIN as their admin
2. Change the relevant contract admins from existing to ROLE_ADMIN
3. Verify all this. Aim to be in same DAO vote

Roles to transfer
- All TribeRoles which have the GOVERNOR as the admin