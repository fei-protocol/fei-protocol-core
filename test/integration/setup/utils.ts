import { ethers, artifacts } from 'hardhat';

const forceETHArtifact = artifacts.readArtifactSync('ForceEth');

export async function forceEth(target: string, amount = '100000000000000000000'): Promise<void> {
  const forceETHContractFactory = await ethers.getContractFactory(forceETHArtifact.abi, forceETHArtifact.bytecode);
  const forceETHContract = await forceETHContractFactory.deploy({
    value: ethers.BigNumber.from(amount)
  });
  await forceETHContract.forceEth(target);
}

export async function forceSpecificEth(target: string, amount: string): Promise<void> {
  const forceETHContractFactory = await ethers.getContractFactory(forceETHArtifact.abi, forceETHArtifact.bytecode);
  const forceETHContract = await forceETHContractFactory.deploy({ value: ethers.BigNumber.from(amount) });
  await forceETHContract.forceEth(target);
}

export async function forceEthMultiple(targets: string[]): Promise<void> {
  for (const target of targets) {
    await forceEth(target);
  }
}
