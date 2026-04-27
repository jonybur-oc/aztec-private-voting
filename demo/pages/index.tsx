import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  PrivateBallot,
  VoteEligibilityProof,
  VoteReceipt,
} from '@aztec-private-voting/react';
import type {
  EligibilityProof,
  VoteReceiptData,
} from '@aztec-private-voting/react';

import { buildSampleVote } from '../lib/sampleVote';

const AztecBoot = dynamic(
  () => import('../components/AztecBoot').then((m) => m.AztecBoot),
  { ssr: false },
);

export default function ActiveVotePage(): JSX.Element {
  const contractAddress = process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS;
  if (!contractAddress) {
    return (
      <div className="boot-error">
        Set NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS in .env.local to run the demo.
      </div>
    );
  }
  return (
    <AztecBoot>
      <ActiveVote contractAddress={contractAddress} />
    </AztecBoot>
  );
}

interface ActiveVoteProps {
  contractAddress: string;
}

function ActiveVote({ contractAddress }: ActiveVoteProps): JSX.Element {
  const config = buildSampleVote(contractAddress);
  const [proof, setProof] = useState<EligibilityProof | null>(null);
  const [receipt, setReceipt] = useState<VoteReceiptData | null>(null);
  const [ineligibleReason, setIneligibleReason] = useState<string | null>(null);

  if (receipt) {
    return <VoteReceipt receipt={receipt} verifierUrl="/closed" />;
  }

  if (!proof) {
    return (
      <VoteEligibilityProof
        config={config}
        onEligible={setProof}
        onIneligible={setIneligibleReason}
      />
    );
  }

  return (
    <>
      {ineligibleReason ? <p className="demo-note">{ineligibleReason}</p> : null}
      <PrivateBallot config={config} eligibilityProof={proof} onVoteCast={setReceipt} />
    </>
  );
}
