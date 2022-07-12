import { MainnetContractsConfig, MainnetContractsType } from '@protocol/mainnetAddresses';
import { ethers } from 'hardhat';
import { MainnetContracts, NamedAddresses } from '@custom-types/types';

export async function getAllContracts(): Promise<MainnetContracts> {
  const addresses = MainnetContractsConfig as MainnetContractsType;
  const contractsAsArrayEntries = await Promise.all(
    Object.entries(addresses)
      .filter((entry) => entry[1].artifactName != 'unknown')
      .map(async (entry) => {
        return [entry[0], await ethers.getContractAt(entry[1].artifactName, entry[1].address)];
      })
  );

  return Object.fromEntries(contractsAsArrayEntries) as MainnetContracts;
}

export function getAllContractAddresses(): NamedAddresses {
  const contracts: NamedAddresses = {};
  const addresses = MainnetContractsConfig as MainnetContractsType;

  for (const mainnetAddressEntryName in addresses) {
    const mainnetAddressEntry = addresses[mainnetAddressEntryName as keyof typeof addresses];
    contracts[mainnetAddressEntryName] = mainnetAddressEntry.address;
  }

  return contracts;
}
