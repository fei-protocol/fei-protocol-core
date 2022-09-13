# Merkle Redeemer Spec

## Contract

- Contract will store one merkle root per cToken; this stores the amount of that cToken each user can exchange
- Contract will store the signatures provided by each user, and won't allow them to claim until they've provided their sig
- Contract will store the exchange rate for each cToken<>baseToken pair
- After signature has been provided and (multi)claim has been called, contract stores the amount of each cToken the user can has exchange so far, and their maximum.

## Governance Flow

- Deploy contract with configured params
- Send baseToken to contract

## User Flow

- Go to website; UI prompts to connect wallet
- Once wallet connected, the website will display two primary things:
  - Whether or not the user has any tokens to claim
  - Whether or not the user has signed the message
- Website will allow the user to sign the message and claim their tokens, prompting for approvals for the ctokens first
- The user can claim a configurable amount of each ctoken, or all of them (if possible)
- The user can sign and claim in a single transaction - which will be the default if their approvals are sufficient and their ctoken balances are sufficient

## Frontend

- Frontend will hold the merkle tree data and fetch the correct data for the user that signs in, so that they can provide it in their merkle proof
- Frontend will know all users that have a claim. If the supplied user has a claim, it will call into the contract to see if the user has signed their message (`userSignatures`)
- If the user has signed their message, then it qeuries their redeemed token balance so far, and their maximum redeemeable token balance, for each cTokenm to get the user's redeemable amounts remaining, using `previewRedeem` to calculate the amount of the base token they'd get for eeach cToken.
