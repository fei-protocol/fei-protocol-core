# Governance
The Fei Protocol makes use of a three tiered governance structure: token governance, optimistic governance and security guardian powers. 

Token governance is implemented as a DAO, optimistic as a Gnosis Safe/Multisig attached to a timelock and the security guardian as a multisig that can act immediately. Each has different powers and responsibilities and taken together, they enable lean and trust minimised DAO governance. 

## Token governance via the DAO
Token governance has "executive powers" over the protocol and is implemented as a DAO, [FeiDAO.sol](https://github.com/fei-protocol/fei-protocol-core/blob/develop/contracts/dao/governor/FeiDAO.sol). This is an instance of OpenZeppelin's OZ Governor, with a module to make it compatible with GovernorBravo. The DAO has a quorum of 25M TRIBE, with a minimum proposal threshold of 2.5M TRIBE. 

It has ultimate power over the FEI protocol and, amongst other powers, is able to:
- Mint FEI
- Create and grant new access roles
- Move PCV arbitrarily 

## Optimistic governance via a Gnosis Safe and timelock
Most proposals do not require a full expensive DAO vote, and instead they can be approved in an optimistic fashion. A process referred to as OA (optimistic approval) exists to perform this - it is implemented as a Gnosis Safe multisig attached to a timelock contract. The timelock is present to give a user time to leave the Fei ecosystem if they disagree with a proposal.

The multisig is a 4 of 7 multisig, with a 4 day timelock. The owners are actors invested in the success of Fei - core team members and engaged community members. 

The timelock contract is a standard OZ `TimelockController.sol`. It can be thought of as the "executor" of OA proposals and is granted various roles through which it can operate on the protocol: `ORACLE_ADMIN_ROLE`, `SWAP_ADMIN_ROLE`, `TRIBAL_CHIEF_ADMIN_ROLE`.

It is important to note, that any proposal in the OA timelock can be vetoed by the DAO and the Security guardian. 

## Security guardian
The security guardian is a Gnosis Safe which has critical powers to pause parts of the protocol during an emergency. It necessarily can act immediately without a timelock and is held by Fei Labs on a 3 or 7 multisig. 

The guardian has a set of predefined behaviours it can act on including
- Pausing contracts
- Vetoing malicious optimistic or token governance proposals


