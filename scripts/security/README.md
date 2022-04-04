# Security
This contains a series of automated security tools that can be easily run to increase confidence that smart contract code is secure. More tools will be added to this over time.

It contains several scripts to act as wrappers around the relevant tool, and remove the need for manually handling Python environments, Docker containers etc.

## MythX
Example of how to run:
`MYTHX_API_KEY=1234 ./scripts/security/runMythx.sh deep ./contracts/fei/Contract1.sol ./contracts/fei/Contract2.sol`

This will pass the Fei MythX API key to the MythX script and run a deep MythX scan on `Contract1.sol` and `Contract2.sol`.
