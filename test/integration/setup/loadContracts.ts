import mainnetAddresses from '@addresses/mainnetAddresses';
import { artifacts, ethers } from 'hardhat';
import { MainnetContracts, NamedAddresses } from '@custom-types/types';

interface MainnetContractJSONEntry {
  artifactName: string;
  address: string;
}

interface MainnetContractsJSON {
  [key: string]: MainnetContractJSONEntry;
}

export async function getAllContracts(): Promise<MainnetContracts> {
  const contracts: MainnetContracts = {} as MainnetContracts;
  const addresses = mainnetAddresses as MainnetContractsJSON;

  for (const mainnetAddressEntryName in addresses) {
    const mainnetAddressEntry = addresses[mainnetAddressEntryName];
    const artifactName = mainnetAddressEntry.artifactName;
    const address = mainnetAddressEntry.address;
    if (artifactName == 'unknown') continue;
    const artifact = artifacts.readArtifactSync(artifactName);
    const contract = await ethers.getContractAt(artifact.abi, address);
    contracts[mainnetAddressEntryName] = contract;
  }

  return contracts;
}

export function getAllContractAddresses(): NamedAddresses {
  const contracts: NamedAddresses = {};
  const addresses = mainnetAddresses as MainnetContractsJSON;

  for (const mainnetAddressEntryName in addresses) {
    const mainnetAddressEntry = addresses[mainnetAddressEntryName];
    contracts[mainnetAddressEntryName] = mainnetAddressEntry.address;
  }

  return contracts;
}
