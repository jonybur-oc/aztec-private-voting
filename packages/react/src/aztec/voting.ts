import type { AccountWalletWithSecretKey } from '@aztec/aztec.js';

import type { VoteConfig } from '../types';

interface ContractMethod {
  send: () => { wait: () => Promise<{ txHash: { toString: () => string } }> };
  simulate: () => Promise<unknown>;
}

export interface VotingContract {
  methods: {
    cast_vote: (
      choice: number,
      eligibilityProof: bigint,
      nullifier: bigint,
    ) => ContractMethod;
    finalize_vote: () => ContractMethod;
    verify_vote_counted: (nullifier: bigint) => ContractMethod;
    get_vote_count: () => ContractMethod;
    get_final_tally: (optionIndex: number) => ContractMethod;
    is_finalized: () => ContractMethod;
  };
}

export async function loadVotingContract(
  wallet: AccountWalletWithSecretKey,
  contractAddress: string,
): Promise<VotingContract> {
  const { Contract: AztecContract, AztecAddress: AztecAddressCtor } = await import(
    '@aztec/aztec.js'
  );
  const { PrivateVotingContractArtifact } = await import('./artifact');
  const contract = await AztecContract.at(
    AztecAddressCtor.fromString(contractAddress),
    PrivateVotingContractArtifact,
    wallet,
  );
  return contract as unknown as VotingContract;
}

export function eligibilityModeToCode(mode: VoteConfig['eligibilityMode']): number {
  switch (mode) {
    case 'open':
      return 0;
    case 'token':
      return 1;
    case 'allowlist':
      return 2;
  }
}
