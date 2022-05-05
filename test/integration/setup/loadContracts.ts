import mainnetAddresses from '@protocol/mainnetAddresses';
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
  const addresses = mainnetAddresses as MainnetContractsJSON;
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
  const addresses = mainnetAddresses as MainnetContractsJSON;

  for (const mainnetAddressEntryName in addresses) {
    const mainnetAddressEntry = addresses[mainnetAddressEntryName];
    contracts[mainnetAddressEntryName] = mainnetAddressEntry.address;
  }

  return contracts;
}
