# Protocol Controlled Value

#### PCV

The ETH coming in at Genesis to the bonding curve will fund the Protocol Controlled Value \(PCV\) of Fei. Initially, 100% of this PCV will be used as FEI/ETH liquidity on Uniswap. The listing price and target peg for FEI on uniswap will use the bonding curve oracle mentioned in the previous section. Therefore FEI will be actually listing at a 10% discount to the FEI price received in the Genesis Group. We fully expect this discrepancy to be arbitraged away as the protocol incentives kick in and the thawing period ends.  


The white paper describes having the bonding curve ETH going straight to Uniswap. However this is gas inefficient \(around 300k\) as each user purchase would also need to pay for a Uniswap liquidity provision. Thanks to a recommendation from Ashwin Ramachandran, we are splitting out this allocation to Uniswap into a separate flow available for keepers. This brings bonding curve purchases down to around 100k gas, a 66% reduction making it cheaper than most Uniswap purchases!  


The way this works on the keeper side is that the allocate\(\) function will always be available for execution to send any ETH PCV to Uniswap. Even though it can be called any time, it will be incentivized once every 24 hours with a 500 FEI bonus for the caller.  
****

