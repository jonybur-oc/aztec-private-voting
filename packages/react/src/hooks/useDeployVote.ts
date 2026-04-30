import { useCallback, useState } from 'react';

import { useAztecClient } from '../aztec/context';
import { eligibilityModeToCode } from '../aztec/voting';
import type { VoteConfig } from '../types';

export type DeployStatus = 'idle' | 'deploying' | 'deployed' | 'error';

export type DeployDraft = Omit<VoteConfig, 'voteId' | 'contractAddress'>;

export interface UseDeployVoteResult {
  deploy: (draft: DeployDraft) => Promise<VoteConfig | null>;
  status: DeployStatus;
  error: string | null;
}

export function useDeployVote(): UseDeployVoteResult {
  const client = useAztecClient();
  const [status, setStatus] = useState<DeployStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const deploy = useCallback(
    async (draft: DeployDraft): Promise<VoteConfig | null> => {
      setStatus('deploying');
      setError(null);
      try {
        const { Contract, AztecAddress, Fr } = await import('@aztec/aztec.js');
        const { PrivateVotingContractArtifact } = await import('../aztec/artifact');

        const titleHash = await hashTitle(draft.title);
        const tokenAddress = draft.tokenAddress
          ? AztecAddress.fromString(draft.tokenAddress)
          : AztecAddress.ZERO;
        const minTokenBalance = draft.minTokenBalance
          ? BigInt(draft.minTokenBalance)
          : 0n;

        const config = {
          title_hash: new Fr(titleHash),
          options_count: draft.options.length,
          start_time: BigInt(Math.floor(draft.startTime / 1000)),
          end_time: BigInt(Math.floor(draft.endTime / 1000)),
          quorum: BigInt(draft.quorum),
          eligibility_mode: eligibilityModeToCode(draft.eligibilityMode),
          token_address: tokenAddress,
          min_token_balance: minTokenBalance,
        };

        const deployment = await Contract.deploy(
          client.wallet,
          PrivateVotingContractArtifact,
          [client.wallet.getAddress(), config],
          'constructor',
        )
          .send()
          .deployed();

        const result: VoteConfig = {
          voteId: deployment.address.toString(),
          contractAddress: deployment.address.toString(),
          title: draft.title,
          description: draft.description,
          options: draft.options,
          startTime: draft.startTime,
          endTime: draft.endTime,
          quorum: draft.quorum,
          eligibilityMode: draft.eligibilityMode,
          ...(draft.tokenAddress ? { tokenAddress: draft.tokenAddress } : {}),
          ...(draft.minTokenBalance ? { minTokenBalance: draft.minTokenBalance } : {}),
          ...(draft.allowlistRoot ? { allowlistRoot: draft.allowlistRoot } : {}),
        };
        setStatus('deployed');
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Deployment failed');
        setStatus('error');
        return null;
      }
    },
    [client],
  );

  return { deploy, status, error };
}

async function hashTitle(title: string): Promise<bigint> {
  const { Fr } = await import('@aztec/aztec.js');
  const { poseidon2Hash } = await import('@aztec/foundation/crypto');
  const encoder = new TextEncoder();
  const bytes = encoder.encode(title);
  const fields: InstanceType<typeof Fr>[] = [];
  for (let i = 0; i < bytes.length; i += 31) {
    const chunk = bytes.slice(i, i + 31);
    let value = 0n;
    for (const byte of chunk) {
      value = (value << 8n) | BigInt(byte);
    }
    fields.push(new Fr(value));
  }
  if (fields.length === 0) {
    fields.push(new Fr(0n));
  }
  const hash = await poseidon2Hash(fields);
  return hash.toBigInt();
}
