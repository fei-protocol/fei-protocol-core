---
description: Community engagement incentives
---

# Bug Bounties

## Bug Bounties

**Program overview**

Fei Protocol's goal is to maintain a liquid market in which ETH/FEI trades closely to the ETH/USD price. FEI achieves this via a new stability mechanism known as direct incentives. Direct incentive stable coins use dynamic mint rewards and burn penalties on DEX trade volume to maintain the peg. Governance can add and update DEX integrations and other incentives as needed, which uses the TRIBE governance token.

The bug bounty program is focused on its smart contracts and website and the prevention of the loss of user funds and the disruption of the governance system.

## All bug submissions must go through Immunefi's bug submission process on the [Fei bug bounty page](https://immunefi.com/bounty/feiprotocol).

The Fei bug bounty page can be viewed at [https://immunefi.com/bounty/feiprotocol](https://immunefi.com/bounty/feiprotocol). When a hacker hits the "Submit bug report" button, they will be sent to [bugs.immunefi.com](https://bugs.immunefi.com/) which will guide them through the process of creating a bug report.

**Rewards by threat level**

Rewards are distributed according to the impact of the vulnerability based on the [Immunefi Vulnerability Severity Classification System](https://immunefi.com/severity-system/). This is a simplified 5-level scale, with separate scales for websites/apps and smart contracts/blockchains, encompassing everything from a consequence of exploitation to privilege required to the likelihood of a successful exploit.

**Smart Contracts and Blockchain**

Critical\* Up to **USD 1 000 000**

High **USD 7 500**

Medium **USD 3 250**

Low **USD 1 000**

**Websites and Apps**

Critical **USD 15 000**

High **USD 10 000**

Medium **USD 1 000**

Low **USD 200**

Payouts are handled by the **Fei Protocol** team directly and are denominated in USD. However, payouts are done in **TRIBE or FEI**.

\*Critical-level smart contract vulnerabilities that result in the loss of user funds will have rewards additionally capped at 10% of the funds potentially affected based on the vulnerability that was identified. These rewards are additionally only payable in **TRIBE** and have a vesting schedule lasting between 6-12 months with a minimum of 6 months for rewards up to USD 400 000, with an additional month added for every USD 100,000 tranche, rounded up.

**Assets in Scope**

**Prioritized vulnerabilities**

We are especially interested in receiving and rewarding vulnerabilities of the following types:

**Smart Contracts and Blockchain**

* Re-entrancy
* Logic errors
  * including user authentication errors
* Solidity/EVM details not considered
  * including integer over-/under-flow
  * including unhandled exceptions
* Trusting trust/dependency vulnerabilities
  * including composability vulnerabilities
* Oracle failure/manipulation
* Novel governance attacks
* Economic/financial attacks
  * including flash loan attacks
* Congestion and scalability
  * including running out of gas
  * including block stuffing
  * including susceptibility to frontrunning
* Consensus failures
* Cryptography problems
  * Signature malleability
  * Susceptibility to replay attacks
  * Weak randomness
  * Weak encryption
* Susceptibility to block timestamp manipulation
* Missing access controls / unprotected internal or debugging interfaces

**Websites and Apps**

* Remote Code Execution
* Trusting trust/dependency vulnerabilities
* Vertical Privilege Escalation
* XML External Entities Injection
* SQL Injection
* LFI/RFI
* Horizontal Privilege Escalation
* Stored XSS
* Reflective XSS with impact
* CSRF
* CSRF with impact
* Direct object reference
* Internal SSRF
* Session fixation
* Insecure Deserialization
* Direct object reference
* Path Traversal
* DOM XSS
* SSL misconfigurations
* SPF configuration problems
* SSL/TLS issues \(weak crypto, improper setup\)
* URL redirect
* Clickjacking
* Misleading Unicode text \(e.g., using right to left override characters\)
* Coercing the application to display/return specific text to other users

**Out of Scope & Rules**

The following vulnerabilities are excluded from the rewards for this bug bounty program:

**All Programs**

* Attacks that the reporter has already exploited themselves, leading to damage
* Attacks requiring access to leaked keys/credentials
* Attacks requiring access to privileged addresses \(governance, strategist\)

**Smart Contracts and Blockchain**

* Incorrect data supplied by third party oracles
  * Not to exclude oracle manipulation/flash loan attacks
* Basic economic governance attacks \(e.g. 51% attack\)
* Lack of liquidity
* Best practice critiques
* Sybil attacks

**Websites and Apps**

* Theoretical vulnerabilities without any proof or demonstration
* Content spoofing / Text injection issues
* Self-XSS
* Captcha bypass using OCR
* CSRF with no security impact \(logout CSRF, change language, etc.\)
* Missing HTTP Security Headers \(such as X-FRAME-OPTIONS\) or cookie security flags \(such as “httponly”\)
* Server-side information disclosure such as IPs, server names, and most stack traces
* Vulnerabilities used to enumerate or confirm the existence of users or tenants
* Vulnerabilities requiring unlikely user actions
* URL Redirects \(unless combined with another vulnerability to produce a more severe vulnerability\)
* Lack of SSL/TLS best practices
* DDoS vulnerabilities
* Attacks requiring privileged access from within the organization

The bug bounty program prohibits the following activities:

* Any testing with mainnet or public testnet contracts; all testing should be done on private testnets
* Any testing with pricing oracles or third party smart contracts
* Attempting phishing or other social engineering attacks against our employees and/or customers
* Any testing with third-party systems and applications \(e.g., browser extensions\) as well as websites \(e.g., SSO providers, advertising networks\)
* Any denial of service attacks
* Automated testing of services that generates significant amounts of traffic
* Public disclosure of an unpatched vulnerability in an embargoed bounty

