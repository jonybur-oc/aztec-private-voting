import dynamic from 'next/dynamic';
import { VoteResult } from '@aztec-private-voting/react';

import { buildClosedSampleVote, getDeployedContractAddress } from '../lib/sampleVote';

const AztecBoot = dynamic(
  () => import('../components/AztecBoot').then((m) => m.AztecBoot),
  { ssr: false },
);

export default function ClosedVotePage(): JSX.Element {
  const contractAddress = getDeployedContractAddress();
  if (!contractAddress) {
    return (
      <div className="boot-error">
        No contract address found. Either set NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS in
        .env.local, or run <code>npm run deploy:testnet</code> from the repo root.
      </div>
    );
  }
  const config = buildClosedSampleVote(contractAddress);
  return (
    <AztecBoot>
      <VoteResult
        config={config}
        txExplorerBase="https://aztecscan.io/tx/"
        contractExplorerBase="https://aztecscan.io/address/"
      />
    </AztecBoot>
  );
}
