import { expectRevert, getAddresses, getCore, time } from '../../helpers';
import { expect } from 'chai'
import hre, { ethers, artifacts } from 'hardhat'
import { Signer } from 'ethers'
  
const OptimisticTimelock = artifacts.readArtifactSync('OptimisticTimelock');
const toBN = ethers.BigNumber.from
  
describe('TimelockedDelegator', function () {
  let userAddress: string
  let guardianAddress: string
  let governorAddress: string

  let impersonatedSigners: { [key: string]: Signer } = { }

  before(async() => {
    const addresses = await getAddresses()

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress
    ]

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address]
      })

      impersonatedSigners[address] = await ethers.getSigner(address)
    }
  });
  
  beforeEach(async function () {
    ({
      userAddress,
      guardianAddress,
      governorAddress,
    } = await getAddresses());
    this.core = await getCore();

    this.delay = toBN(1000);
    const timelockFactory = await ethers.getContractFactory(OptimisticTimelock.abi, OptimisticTimelock.bytecode)
    this.timelock = await timelockFactory.deploy(this.core.address, userAddress, this.delay, this.delay);
  });

  describe('Pausable', function () {
    beforeEach(async function () {
      await hre.network.provider.request({
        'method': 'hardhat_impersonateAccount',
        'params': [governorAddress]
      })

      const governorSigner = await ethers.getSigner(governorAddress)

      await this.timelock.connect(governorSigner).pause();

      await hre.network.provider.request({
        'method': 'hardhat_stopImpersonatingAccount',
        'params': [governorAddress]
      })
    });

    it('queue reverts', async function() {
      const eta = toBN(await time.latest()).add(Number(this.delay).toString());

      await hre.network.provider.request({
        'method': 'hardhat_impersonateAccount',
        'params': [userAddress]
      })

      const userSigner = await ethers.getSigner(userAddress)

      await expectRevert(this.timelock.connect(userSigner).queueTransaction(userAddress, 100, '', ethers.constants.AddressZero, eta), 'Pausable: paused');

      await hre.network.provider.request({
        'method': 'hardhat_stopImpersonatingAccount',
        'params': [userAddress]
      })
    });

    it('execute reverts', async function() {
      const eta = toBN(await time.latest()).add(this.delay);

      await hre.network.provider.request({
        'method': 'hardhat_impersonateAccount',
        'params': [userAddress]
      })

      const userSigner = await ethers.getSigner(userAddress)
      await expectRevert(this.timelock.connect(userSigner).executeTransaction(userAddress, 100, '', ethers.constants.AddressZero, eta), 'Pausable: paused');
      await hre.network.provider.request({
        'method': 'hardhat_stopImpersonatingAccount',
        'params': [userAddress]
      })
    });
  });

  describe('Veto', function () {
    it('non-governor or guardian reverts', async function() {
      const eta = toBN(Number(await time.latest())).add(Number(this.delay.toString());
      await hre.network.provider.request({
        'method': 'hardhat_impersonateAccount',
        'params': [userAddress]
      })

      const userSigner = await ethers.getSigner(userAddress)
      
      await expectRevert(this.timelock.connect(userSigner).vetoTransactions([userAddress], [100], [''], [ethers.constants.AddressZero], [eta]), 'CoreRef: Caller is not a guardian or governor');
      
      await hre.network.provider.request({
        'method': 'hardhat_stopImpersonatingAccount',
        'params': [userAddress]
      })

    });

    it('guardian succeeds', async function() {
      const eta = toBN(await time.latest()).add(this.delay).add(Number(this.delay.toString()));
      await hre.network.provider.request({
        'method': 'hardhat_impersonateAccount',
        'params': [userAddress]
      })

      const userSigner = await ethers.getSigner(userAddress)
      await this.timelock.connect(impersonatedSigners[userAddress]).connect(userSigner).queueTransaction(userAddress, 100, '', ethers.constants.AddressZero, eta, {});

      const txHash = await this.timelock.getTxHash(userAddress, 100, '', ethers.constants.AddressZero, eta);
      expect(await this.timelock.queuedTransactions(txHash)).to.be.equal(true);

      await hre.network.provider.request({
        'method': 'hardhat_stopImpersonatingAccount',
        'params': [userAddress]
      })

      await hre.network.provider.request({
        'method': 'hardhat_impersonateAccount',
        'params': [guardianAddress]
      })

      const guardianSigner = await ethers.getSigner(guardianAddress)
      await this.timelock.connect(guardianSigner).vetoTransactions([userAddress], [100], [''], [ethers.constants.AddressZero], [eta]);
      expect(await this.timelock.queuedTransactions(txHash)).to.be.equal(false);

      await hre.network.provider.request({
        'method': 'hardhat_stopImpersonatingAccount',
        'params': [guardianAddress]
      })
    });

    it('governor succeeds', async function() {
      const eta = toBN(await time.latest()).add(Number(this.delay.toString())).add(Number(this.delay).toString());
      await hre.network.provider.request({
        'method': 'hardhat_impersonateAccount',
        'params': [userAddress]
      })

      const userSigner = await ethers.getSigner(userAddress)

      await this.timelock.connect(userSigner).queueTransaction(userAddress, 100, '', ethers.constants.AddressZero, eta);

      await hre.network.provider.request({
        'method': 'hardhat_stopImpersonatingAccount',
        'params': [userAddress]
      })
  
      const txHash = await this.timelock.getTxHash(userAddress, 100, '', ethers.constants.AddressZero, eta);
      expect(await this.timelock.queuedTransactions(txHash)).to.be.equal(true);
  
      await hre.network.provider.request({
        'method': 'hardhat_impersonateAccount',
        'params': [governorAddress]
      })

      const governorSigner = await ethers.getSigner(governorAddress)

      await this.timelock.connect(governorSigner).vetoTransactions([userAddress], [100], [''], [ethers.constants.AddressZero], [eta]);
      expect(await this.timelock.queuedTransactions(txHash)).to.be.equal(false);

      await hre.network.provider.request({
        'method': 'hardhat_stopImpersonatingAccount',
        'params': [governorAddress]
      })
    });
  });
});
