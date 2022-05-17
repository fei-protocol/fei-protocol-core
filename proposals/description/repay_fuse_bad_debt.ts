import { ProposalDescription } from '@custom-types/types';

const repay_fuse_bad_debt: ProposalDescription = {
  title: 'Repay Fuse Bad Debt',
  commands: [
    {
      target: 'fuseFixer',
      values: '0',
      method: 'repayAll()',
      arguments: [],
      description: 'Repay all bad debt in Fuse pools 8, 18, 27, 127, 144, 146, 156'
    }
  ],
  description: 'Repay all bad debt in Fuse pools 8, 18, 27, 127, 144, 146, 156'
};

export default repay_fuse_bad_debt;
