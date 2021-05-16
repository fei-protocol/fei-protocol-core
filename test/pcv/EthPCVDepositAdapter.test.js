

const {
    userAddress,
    BN,
    balance,
    web3,
    expect,
    contract,
  } = require('../helpers');
  
const EthPCVDepositAdapter = contract.fromArtifact('EthPCVDepositAdapter');
const MockPCVDeposit = contract.fromArtifact('MockEthUniswapPCVDeposit');

  describe('EthPCVDepositAdapter', function () {
  
    beforeEach(async function () {
      this.pcvDeposit = await MockPCVDeposit.new(userAddress);
      await this.pcvDeposit.setBeneficiary(this.pcvDeposit.address);

      this.adapter = await EthPCVDepositAdapter.new(this.pcvDeposit.address);

      this.pcvAmount = new BN('10000000000');
    });
  
    describe('Deposit', function() {
        it('succeeds', async function() {
            await this.adapter.deposit(this.pcvAmount, {from: userAddress, value: this.pcvAmount});
            expect(await balance.current(this.pcvDeposit.address)).to.be.bignumber.equal(this.pcvAmount);
        });
    });

    describe('Receive', function() {
        it('succeeds', async function() {
            await web3.eth.sendTransaction({from: userAddress, to: this.adapter.address, value: this.pcvAmount});
            expect(await balance.current(this.pcvDeposit.address)).to.be.bignumber.equal(this.pcvAmount);
        });
    });
  });