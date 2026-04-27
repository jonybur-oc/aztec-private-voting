import dynamic from 'next/dynamic';
import { VoteResult } from '@aztec-private-voting/react';

import { buildClosedSampleVote } from '../lib/sampleVote';

const AztecBoot = dynamic(
  () => import('../components/AztecBoot').then((m) => m.AztecBoot),
  { ssr: false },
);

export default function ClosedVotePage(): JSX.Element {
  const contractAddress = process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS;
  if (!contractAddress) {
    return (
      <div className="boot-error">
        Set NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS in .env.local to run the demo.
      </div>
    );
  }
  const config = buildClosedSampleVote(contractAddress);
  return (
    <AztecBoot>
      <VoteResult config={config} txExplorerBase="https://aztecscan.io/tx/" />
    </AztecBoot>
  );
}
