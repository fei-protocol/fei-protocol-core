export type PodConfig = {
  members: string[];
  threshold: number;
  label: string;
  ensString: string;
  imageUrl: string;
  minDelay: number;
  numMembers: number;
  placeHolderMembers: string[];
};

export type PodCreationConfig = {
  members: string[];
  threshold: number;
  label: string;
  ensString: string;
  imageUrl: string;
  admin: string;
  minDelay: number;
};

export const tribalCouncilMembers = [
  '0xc8eefb8b3d50ca87Da7F99a661720148acf97EfA', // TODO: Complete with real member addresses
  '0x72b7448f470D07222Dbf038407cD69CC380683F3',
  '0xA6D08774604d6Da7C96684ca6c4f61f89c4e5b96',
  '0xe0ac4559739bD36f0913FB0A3f5bFC19BCBaCD52',
  '0xC2138f77E97A9Ac0A4bC26F42D80D29D1a091866',
  '0x9f5e6F58CC8823D3c022AeBE3942EeF689E9AcD9',
  '0xaB339ae6eab3C3CF4f5885E56F7B49391a01DDA6',
  '0xd90E9181B20D8D1B5034d9f5737804Da182039F6',
  '0x0000000000000000000000000000000000000015'
];

export const placeHolderCouncilMembers = [
  '0x0000000000000000000000000000000000000004',
  '0x0000000000000000000000000000000000000005',
  '0x0000000000000000000000000000000000000006',
  '0x0000000000000000000000000000000000000007',
  '0x0000000000000000000000000000000000000008',
  '0x0000000000000000000000000000000000000009',
  '0x000000000000000000000000000000000000000a',
  '0x000000000000000000000000000000000000000b',
  '0x000000000000000000000000000000000000000c'
];

export const MIN_TIMELOCK_DELAY = 86400; // 1 day

export const tribeCouncilPodConfig: PodConfig = {
  members: tribalCouncilMembers,
  threshold: 5,
  label: '0xcc74924992a4b3a8d464650443c1d35252c3c4eacfcae441e1a646c194eda9c9', // tribalcouncil
  ensString: 'tribalcouncil.pod.xyz',
  imageUrl: '',
  minDelay: 86400 * 4, // 4 days
  numMembers: tribalCouncilMembers.length,
  placeHolderMembers: placeHolderCouncilMembers
};

export const TRIBAL_COUNCIL_POD_ID = 24;
